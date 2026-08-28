import { useState, useRef, useEffect } from 'react';
import NoSleep from 'nosleep.js';
import { getCurrentUser } from 'aws-amplify/auth';
import { getAmplifyClient } from '../../services/amplifyClient';
import { getUserSubscription } from '../../graphql/queries';
import useAudioUploadQueue from './useAudioUploadQueue';
import useMediaRecorderController from './useMediaRecorderController';
import useNoteGeneration from './useNoteGeneration';

const messages = {
  microphone_denied: 'Microphone access was denied. Allow the microphone for ChiroNote in Chrome and try again.',
  microphone_disconnected: 'The microphone disconnected. This visit could not be submitted. Reconnect it before starting again.',
  recorder_failed: 'Recording stopped unexpectedly. Check your microphone before starting again.',
  recording_too_short: 'There was not enough final audio to submit this visit. Please start a new recording.',
  audio_submission_failed: 'Audio could not be submitted. Check your connection before starting a new visit.',
  authentication_required: 'Your session could not be verified. Check your connection or sign in again.',
  recording_limit: 'Your plan has no recording time remaining.',
  recording_start_failed: 'Recording could not start. Check your microphone and connection.'
};

function RecordingManager({ onTextStreamUpdate, onTransitionToMainApp }) {
  const [isStarting, setIsStarting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isPreparingTranscript, setIsPreparingTranscript] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [isTranscriptCompleted, setIsTranscriptCompleted] = useState(false);
  const [textStream, setTextStream] = useState('');
  const [error, setError] = useState(null);
  const timeStampRef = useRef(null);
  const pathStampRef = useRef(null);
  const filePathRef = useRef(null);
  const noSleepRef = useRef(null);
  const isDiscardingRef = useRef(false);
  const lifecycleRef = useRef({ mounted: false, attempt: 0, starting: false });
  const cleanupRef = useRef({});
  const onError = errorValue => {
    setError(errorValue);
    console.warn(errorValue.code);
  };
  const reportRecordingError = code => {
    onTextStreamUpdate('', { timestamp: timeStampRef.current, complete: false });
    onError({ code, message: messages[code] || messages.recording_start_failed });
  };
  const generation = useNoteGeneration({
    noSleepRef, setTextStream, setIsPreparingTranscript, setIsGeneratingSummary,
    setIsTranscriptCompleted, onTextStreamUpdate, onTransitionToMainApp, onError
  });
  const uploads = useAudioUploadQueue({
    filePathRef,
    onFinalAudioQueued: generation.subscribeToNoteCompletion,
    onUploadError: () => {
      cleanupRef.current.cancelRecordingForFailure();
      reportRecordingError('audio_submission_failed');
    }
  });
  const recorder = useMediaRecorderController({
    timeStampRef, pathStampRef, filePathRef, noSleepRef, isDiscardingRef,
    ...uploads, ...generation, setIsRecording, setIsPaused, setIsPreparingTranscript,
    setIsGeneratingSummary, setIsTranscriptCompleted, setTextStream,
    onRecordingError: reportRecordingError
  });
  cleanupRef.current = { ...recorder, ...generation };

  useEffect(() => {
    const lifecycle = lifecycleRef.current;
    lifecycle.mounted = true;
    noSleepRef.current = new NoSleep();
    const teardown = () => {
      lifecycle.attempt += 1;
      lifecycle.starting = false;
      cleanupRef.current.cleanupRecorder();
      noSleepRef.current?.disable();
    };
    window.addEventListener('pagehide', teardown);
    return () => {
      lifecycle.mounted = false;
      window.removeEventListener('pagehide', teardown);
      teardown();
    };
  }, []);

  const startRecording = async () => {
    const lifecycle = lifecycleRef.current;
    if (!lifecycle.mounted || lifecycle.starting || isRecording || isPreparingTranscript || isGeneratingSummary) return;
    lifecycle.starting = true;
    const attempt = ++lifecycle.attempt;
    const current = () => lifecycle.mounted && lifecycle.attempt === attempt;
    setError(null);
    setIsStarting(true);
    // Cancel the previous completed session before beginning a distinct visit.
    recorder.discardRecording();
    let verificationTimer;
    try {
      const subscription = await Promise.race([
        (async () => {
          const user = await getCurrentUser().catch(() => { throw new Error('authentication_required'); });
          const response = await getAmplifyClient().graphql({
            query: getUserSubscription, variables: { owner: user.username }
          });
          if (response.errors?.length) throw new Error('authentication_required');
          return response.data?.getUserSubscription;
        })(),
        new Promise((resolve, reject) => {
          verificationTimer = setTimeout(() => reject(new Error('authentication_required')), 15000);
        })
      ]);
      clearTimeout(verificationTimer);
      if (!current()) return;
      if (!subscription || !Number.isFinite(Number(subscription.hoursleft))) {
        throw new Error('authentication_required');
      }
      if (Number(subscription.hoursleft) <= 0) {
        reportRecordingError('recording_limit');
        return;
      }
      await recorder.startRecording();
      if (current()) onTextStreamUpdate('', { timestamp: timeStampRef.current, complete: false });
    } catch (failure) {
      if (!current()) return;
      recorder.discardRecording();
      reportRecordingError(failure?.name === 'NotAllowedError' ? 'microphone_denied'
        : failure?.message === 'authentication_required' ? 'authentication_required'
          : 'recording_start_failed');
    } finally {
      clearTimeout(verificationTimer);
      if (current()) {
        lifecycle.starting = false;
        setIsStarting(false);
      }
    }
  };

  return {
    isStarting, isRecording, isPaused, isPreparingTranscript, isGeneratingSummary,
    isTranscriptCompleted, textStream, error, clearError: () => setError(null),
    startRecording, stopRecording: recorder.stopRecording,
    discardRecording: recorder.discardRecording,
    pauseRecording: recorder.pauseRecording, resumeRecording: recorder.resumeRecording
  };
}

export default RecordingManager;
