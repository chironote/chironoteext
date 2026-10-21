import { useRef } from 'react';
import * as subscriptions from '../../graphql/subscriptions';
import { getAmplifyClient } from '../../services/amplifyClient';
import {
  NOTE_GENERATION_RETRY_MESSAGE, NOTE_GENERATION_TIMEOUT_AFTER_TRANSCRIPT_FALLBACK_MS,
  NOTE_GENERATION_TIMEOUT_MS, TRANSCRIPT_WAIT_TIMEOUT_MS, NOTE_GENERATION_URL
} from './recordingConstants';
import { generateToken } from './recordingAuth';
import { patientNotesEnabled, patientRequest } from '../../services/patientNotes';
import { createNoteGenerationStreamParser, parseLambdaErrorPayload } from './noteGenerationErrors';

function useNoteGeneration({
  noSleepRef, setTextStream, setIsPreparingTranscript, setIsGeneratingSummary,
  setIsTranscriptCompleted, onTextStreamUpdate, onTransitionToMainApp, onError
}) {
  const jobRef = useRef(null);
  const active = job => jobRef.current === job && !job.cancelled;
  const release = job => {
    clearTimeout(job.transcriptTimer);
    clearTimeout(job.generationTimer);
    job.subscription?.unsubscribe();
    job.subscription = null;
    job.abort?.abort();
    job.reader?.cancel().catch(() => {});
  };
  const cleanupNoteGeneration = () => {
    const job = jobRef.current;
    jobRef.current = null;
    if (job) {
      job.cancelled = true;
      release(job);
    }
  };
  const fail = (job, code) => {
    if (!active(job)) return;
    cleanupNoteGeneration();
    setTextStream(job.preview || '');
    onTextStreamUpdate(job.preview || '', { timestamp: job.timestamp, complete: Boolean(job.preview), unsaved: true });
    setIsGeneratingSummary(false);
    setIsPreparingTranscript(false);
    noSleepRef.current?.disable();
    onError({ code, message: job.preview ? 'Saving could not be confirmed. Keep this preview and check saved notes before retrying. Copy it if needed, then retry from the saved recording.' : NOTE_GENERATION_RETRY_MESSAGE });
    onTransitionToMainApp();
  };

  const streamResponse = async job => {
    if (!active(job) || job.started) return;
    job.started = true;
    clearTimeout(job.transcriptTimer);
    job.subscription?.unsubscribe();
    job.subscription = null;
    setIsTranscriptCompleted(true);
    setIsPreparingTranscript(false);
    setIsGeneratingSummary(true);
    job.abort = new AbortController();
    job.generationTimer = setTimeout(() => fail(job, 'generation_timeout'), job.fallback
      ? NOTE_GENERATION_TIMEOUT_AFTER_TRANSCRIPT_FALLBACK_MS : NOTE_GENERATION_TIMEOUT_MS);
    try {
      const accessToken = await generateToken();
      if (!active(job)) return;
      const response = await fetch(NOTE_GENERATION_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: job.userId, timeStamp: job.timestamp, accessToken, noteSettings: job.noteSettings,
          ...(job.visitMetadata ? { visitMetadata: job.visitMetadata } : {})
        }),
        signal: job.abort.signal
      });
      if (!active(job)) return;
      if (!response.ok || !response.body) {
        fail(job, 'generation_response_failed');
        return;
      }
      job.reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let text = '';
      let recovered = false;
      const parseStream = createNoteGenerationStreamParser();
      while (active(job)) {
        const chunk = await job.reader.read();
        if (!active(job)) return;
        const frame = parseStream(decoder.decode(chunk.value, { stream: !chunk.done }), chunk.done);
        text += frame.text;
        const error = frame.error || parseLambdaErrorPayload(text);
        if (error) {
          job.preview = text.trimStart().startsWith('{') ? '' : text;
          if (error.code !== 'NOTE_RECOVERED') { fail(job, 'generation_backend_failed'); return; }
          recovered = true;
          Promise.resolve().then(() => job.reader.cancel()).catch(() => {});
          break;
        }
        if (chunk.done) break;
        job.preview = text.split('\u0000')[0];
        setTextStream(job.preview);
        onTextStreamUpdate(job.preview, { timestamp: job.timestamp, complete: false });
      }
      if (!active(job)) return;
      if (!text.trim() && !recovered) {
        fail(job, 'generation_empty');
        return;
      }
      const saved = (patientNotesEnabled || recovered) ? (await patientRequest('getSavedNote', { timestamp: String(job.timestamp) })).note : null;
      if ((patientNotesEnabled || recovered) && (!saved?.ready || !saved.version || typeof saved.note !== 'string' || String(saved.timestamp) !== String(job.timestamp))) { fail(job, 'generation_not_saved'); return; }
      if (!active(job)) return;
      cleanupNoteGeneration();
      setTextStream(saved?.note || text);
      onTextStreamUpdate(saved?.note || text, { timestamp: job.timestamp, complete: true, ...(saved ? { savedNote: saved } : {}) });
      setIsGeneratingSummary(false);
      setIsPreparingTranscript(false);
      noSleepRef.current?.disable();
      onTransitionToMainApp();
    } catch {
      if (active(job)) fail(job, 'generation_connection_failed');
    }
  };

  const subscribeToNoteCompletion = (userId, timestamp, capture) => {
    cleanupNoteGeneration();
    const job = { userId, timestamp, noteSettings: capture?.noteSettings ?? localStorage.getItem('noteSettings'), visitMetadata: capture?.visitMetadata };
    jobRef.current = job;
    const begin = fallback => {
      if (!active(job) || job.started) return;
      job.fallback = fallback;
      void streamResponse(job);
    };
    job.transcriptTimer = setTimeout(() => begin(true), TRANSCRIPT_WAIT_TIMEOUT_MS);
    try {
      const subscription = getAmplifyClient().graphql({
        query: subscriptions.onUpdateNotesByOwner, variables: { owner: userId }
      }).subscribe({
        next: ({ data }) => {
          const note = data?.onUpdateNotesByOwner;
          if (!active(job) || String(note?.timestamp) !== String(timestamp)) return;
          if (parseLambdaErrorPayload(note.transcript || '')) begin(true);
          else if (note.isCompleted === true) begin(false);
        },
        error: () => begin(true)
      });
      // A subscription may synchronously report an error during registration.
      if (!active(job) || job.started) subscription.unsubscribe();
      else job.subscription = subscription;
    } catch {
      begin(true);
    }
  };

  return {
    subscribeToNoteCompletion, cleanupNoteGeneration,
    resetNoteGenerationState: cleanupNoteGeneration
  };
}

export default useNoteGeneration;
