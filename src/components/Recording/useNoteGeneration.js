import { useRef } from 'react';
import * as subscriptions from '../../graphql/subscriptions';
import { getAmplifyClient } from '../../services/amplifyClient';
import {
  NOTE_GENERATION_RETRY_MESSAGE, NOTE_GENERATION_TIMEOUT_AFTER_TRANSCRIPT_FALLBACK_MS,
  NOTE_GENERATION_TIMEOUT_MS, TRANSCRIPT_WAIT_TIMEOUT_MS, NOTE_GENERATION_URL
} from './recordingConstants';
import { generateToken } from './recordingAuth';
import { parseLambdaErrorPayload } from './noteGenerationErrors';

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
    setTextStream('');
    onTextStreamUpdate('', { timestamp: job.timestamp, complete: false });
    setIsGeneratingSummary(false);
    setIsPreparingTranscript(false);
    noSleepRef.current?.disable();
    onError({ code, message: NOTE_GENERATION_RETRY_MESSAGE });
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
          userId: job.userId, timeStamp: job.timestamp, accessToken, noteSettings: job.noteSettings
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
      while (active(job)) {
        const chunk = await job.reader.read();
        if (!active(job)) return;
        text += decoder.decode(chunk.value, { stream: !chunk.done });
        // Check the accumulated text so a JSON error/sentinel split across reads cannot escape.
        if (parseLambdaErrorPayload(text)) {
          fail(job, 'generation_backend_failed');
          return;
        }
        if (chunk.done) break;
        setTextStream(text);
        onTextStreamUpdate(text, { timestamp: job.timestamp, complete: false });
      }
      if (!active(job)) return;
      if (!text.trim()) {
        fail(job, 'generation_empty');
        return;
      }
      cleanupNoteGeneration();
      setTextStream(text);
      onTextStreamUpdate(text, { timestamp: job.timestamp, complete: true });
      setIsGeneratingSummary(false);
      setIsPreparingTranscript(false);
      noSleepRef.current?.disable();
      onTransitionToMainApp();
    } catch {
      if (active(job)) fail(job, 'generation_connection_failed');
    }
  };

  const subscribeToNoteCompletion = (userId, timestamp) => {
    cleanupNoteGeneration();
    const job = { userId, timestamp, noteSettings: localStorage.getItem('noteSettings') };
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
