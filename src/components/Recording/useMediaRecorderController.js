import { useRef } from 'react';
import { AUDIO_CHUNK_INTERVAL_MS, MIN_AUDIO_BLOB_SIZE } from './recordingConstants';
import { getUserId } from './recordingAuth';
import { getRecordingMediaDescriptor } from './recordingMedia';
import { captureSnapshot, recordingSettingsSnapshot } from '../../services/patientNotes';

function useMediaRecorderController({
  timeStampRef, pathStampRef, filePathRef, noSleepRef, isDiscardingRef,
  queueUpload, startUploadSession, cancelUploadSession, cleanupNoteGeneration,
  resetNoteGenerationState, setIsRecording, setIsPaused, setIsPreparingTranscript,
  setIsGeneratingSummary, setIsTranscriptCompleted, setTextStream,
  onRecordingError = () => {}
}) {
  const sessionRef = useRef(null);
  const isRecordingRef = useRef(false);
  const isPausedRef = useRef(false);

  const isCurrent = session => sessionRef.current === session && !session.cancelled;
  const releaseTracks = session => {
    session.stream?.getTracks().forEach(track => {
      track.onended = null;
      track.stop();
    });
    session.stream = null;
  };

  const cancel = (updateState = true) => {
    const session = sessionRef.current;
    sessionRef.current = null;
    isDiscardingRef.current = true;
    isRecordingRef.current = false;
    isPausedRef.current = false;
    if (session) {
      session.cancelled = true;
      clearInterval(session.interval);
      cancelUploadSession(session.id);
      const recorder = session.recorder;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (recorder.state !== 'inactive') recorder.stop();
      }
      releaseTracks(session);
    }
    cleanupNoteGeneration();
    noSleepRef.current?.disable();
    if (updateState) {
      setIsRecording(false);
      setIsPaused(false);
      setIsPreparingTranscript(false);
      setIsGeneratingSummary(false);
      setIsTranscriptCompleted(false);
      setTextStream('');
    }
  };

  const fail = (session, code) => {
    if (!isCurrent(session)) return;
    cancel();
    onRecordingError(code);
  };

  const startInterval = session => {
    clearInterval(session.interval);
    session.interval = setInterval(() => {
      if (isCurrent(session) && session.recorder?.state === 'recording') {
        session.recorder.stop();
      }
    }, AUDIO_CHUNK_INTERVAL_MS);
  };

  const startRecording = async (metadata, settings) => {
    if (sessionRef.current) return;
    const timestamp = Date.now();
    const session = {
      capture: Object.freeze({ visitMetadata: captureSnapshot(metadata), noteSettings: recordingSettingsSnapshot(settings) }),
      id: `${timestamp}_${Math.random().toString(36).slice(2, 11)}`,
      timestamp, index: 0, finish: false, cancelled: false, chain: Promise.resolve()
    };
    sessionRef.current = session;
    isDiscardingRef.current = false;
    timeStampRef.current = timestamp;
    pathStampRef.current = session.id;
    filePathRef.current = null;
    cleanupNoteGeneration();
    resetNoteGenerationState();
    setTextStream('');
    startUploadSession(session.id);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { channelCount: 1, echoCancellation: false, noiseSuppression: false, autoGainControl: false }
      });
      if (!isCurrent(session)) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      session.stream = stream;
      const options = MediaRecorder.isTypeSupported('audio/webm; codecs="pcm"')
        ? { mimeType: 'audio/webm; codecs="pcm"' } : { mimeType: 'audio/webm' };
      const recorder = new MediaRecorder(stream, options);
      session.recorder = recorder;
      stream.getTracks().forEach(track => {
        track.onended = () => fail(session, 'microphone_disconnected');
      });
      recorder.onerror = () => fail(session, 'recorder_failed');
      const enqueueAudio = (blob, final) => {
        if (!isCurrent(session)) return;
        const index = session.index++;
        session.chain = session.chain.then(async () => {
          if (!isCurrent(session)) return;
          if (blob.size < MIN_AUDIO_BLOB_SIZE) {
            if (final) fail(session, 'recording_too_short');
            return;
          }
          const userId = await getUserId();
          if (!isCurrent(session)) return;
          if (!userId) throw new Error('authentication_required');
          const media = getRecordingMediaDescriptor(blob.type, recorder.mimeType);
          const path = `protected/${userId}/${timestamp}_recording_${final ? 'final' : 'chunk'}_${session.id}_${index}.${media.extension}`;
          queueUpload(blob, path, {
            capture: session.capture,
            contentType: media.contentType, sessionId: session.id, timestamp, userId
          });
        }).catch(() => fail(session, 'audio_submission_failed'));
      };
      recorder.ondataavailable = event => {
        if (!isCurrent(session)) return;
        // Hold stop's blob until onstop: Finish may arrive during a rotation.
        if (recorder.state === 'inactive') session.stoppedBlob = event.data;
        else enqueueAudio(event.data, false);
      };
      recorder.onstop = () => {
        if (!isCurrent(session)) return;
        if (session.stoppedBlob) enqueueAudio(session.stoppedBlob, session.finish);
        else if (session.finish) fail(session, 'recording_too_short');
        session.stoppedBlob = null;
        if (session.finish) {
          releaseTracks(session);
          session.recorder = null;
        } else {
          // Finish/pause can arrive between rotation's data and stop events.
          recorder.start();
          if (isPausedRef.current) {
            recorder.pause();
          }
        }
      };
      recorder.start();
      isRecordingRef.current = true;
      isPausedRef.current = false;
      setIsRecording(true);
      setIsPaused(false);
      startInterval(session);
      // Refusing a wake lock must not fail an otherwise healthy recording.
      try { await noSleepRef.current?.enable(); } catch { /* Wake lock unavailable. */ }
      if (!isCurrent(session)) noSleepRef.current?.disable();
    } catch (error) {
      if (isCurrent(session)) {
        cancel();
        throw error;
      }
    }
  };

  const stopRecording = () => {
    const session = sessionRef.current;
    if (!session?.recorder || session.finish) return;
    session.finish = true;
    clearInterval(session.interval);
    isRecordingRef.current = false;
    isPausedRef.current = false;
    setIsRecording(false);
    setIsPaused(false);
    setIsPreparingTranscript(true);
    if (session.recorder.state !== 'inactive') {
      session.recorder.stop();
    }
  };

  const pauseRecording = () => {
    const session = sessionRef.current;
    if (!session || !isRecordingRef.current || isPausedRef.current) return;
    isPausedRef.current = true;
    clearInterval(session.interval);
    if (session.recorder.state === 'recording') session.recorder.pause();
    setIsPaused(true);
  };
  const resumeRecording = () => {
    const session = sessionRef.current;
    if (!session || !isRecordingRef.current || !isPausedRef.current) return;
    isPausedRef.current = false;
    if (session.recorder.state === 'paused') session.recorder.resume();
    startInterval(session);
    setIsPaused(false);
  };

  return {
    startRecording, stopRecording, pauseRecording, resumeRecording,
    discardRecording: () => cancel(), cancelRecordingForFailure: () => cancel(),
    cleanupRecorder: () => cancel(false), isRecordingRef, isPausedRef
  };
}

export default useMediaRecorderController;
