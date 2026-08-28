import React, { useEffect, useState } from 'react';
import { fetchAuthSession, getCurrentUser } from 'aws-amplify/auth';
import * as queries from '../../graphql/queries';
import { getAmplifyClient } from '../../services/amplifyClient';
import Icon from '../Icon';
import ConfirmationPopup from './ConfirmationPopup';
import CreditPopup from './CreditLimit';
import './Recording.css';

function readNoteSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('noteSettings'));
    return {
      examLayout: Boolean(stored?.examLayout),
      PILayout: Boolean(stored?.PILayout)
    };
  } catch {
    return { examLayout: false, PILayout: false };
  }
}

function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const remainder = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${remainder}`;
}

function Recording({
  onBack,
  isRecording,
  isPaused,
  isPreparingTranscript,
  isGeneratingSummary,
  startRecording,
  stopRecording,
  discardRecording,
  pauseRecording,
  resumeRecording
}) {
  const [noteSettings, setNoteSettings] = useState(readNoteSettings);
  const [showCreditPopup, setShowCreditPopup] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    localStorage.setItem('selectedLanguage', 'null');
    fetchAuthSession({ forceRefresh: true }).catch((error) => {
      console.warn('Unable to refresh the sign-in session:', error);
    });
  }, []);

  useEffect(() => {
    localStorage.setItem('noteSettings', JSON.stringify(noteSettings));
  }, [noteSettings]);

  useEffect(() => {
    if (!isRecording || isPaused) return undefined;
    const interval = setInterval(() => setElapsedSeconds(value => value + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused, isRecording]);

  useEffect(() => {
    if (!isRecording && !isPreparingTranscript && !isGeneratingSummary) {
      setElapsedSeconds(0);
    }
  }, [isGeneratingSummary, isPreparingTranscript, isRecording]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && isRecording) {
        event.preventDefault();
        setShowConfirmation(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isRecording]);

  const fetchUserSubscription = async () => {
    const currentUser = await getCurrentUser();
    const response = await getAmplifyClient().graphql({
      query: queries.getUserSubscription,
      variables: { owner: currentUser.username }
    });
    return response.data.getUserSubscription;
  };

  const handleStartRecording = async () => {
    setStartError('');

    try {
      const recordingStart = startRecording();
      const subscription = await fetchUserSubscription();
      await recordingStart;

      if (!subscription || subscription.hoursleft <= 0) {
        discardRecording();
        setShowCreditPopup(true);
      }
    } catch (error) {
      console.error('Unable to start recording:', error);
      discardRecording();
      setStartError('Recording could not start. Check your microphone and connection.');
    }
  };

  const updateSetting = (event) => {
    const { name, checked } = event.target;
    setNoteSettings(current => ({ ...current, [name]: checked }));
  };

  const confirmDiscard = () => {
    setShowConfirmation(false);
    discardRecording();
    onBack();
  };

  const isIdle = !isRecording && !isPreparingTranscript && !isGeneratingSummary;

  return (
    <section className="recording-panel">
      {showConfirmation && (
        <ConfirmationPopup
          onConfirm={confirmDiscard}
          onCancel={() => setShowConfirmation(false)}
        />
      )}

      {showCreditPopup ? (
        <CreditPopup onClose={() => setShowCreditPopup(false)} />
      ) : isIdle ? (
        <div className="recording-setup">
          <div className="recording-ready-copy">
            <span className="eyebrow">Ready for the next patient</span>
            <h1>Record the visit.</h1>
            <p>Your usual note settings are already selected.</p>
          </div>

          <button type="button" className="recording-start-card" onClick={handleStartRecording}>
            <Icon name="mic" size={38} />
            <strong>Start recording</strong>
            <span>Uses your default microphone</span>
          </button>

          <details className="recording-preferences">
            <summary>
              <span>
                {noteSettings.examLayout || noteSettings.PILayout
                  ? [noteSettings.examLayout && 'Exam layout', noteSettings.PILayout && 'Personal injury']
                    .filter(Boolean)
                    .join(' · ')
                  : 'Standard SOAP'}
                {' · Auto language'}
              </span>
              <strong>Change</strong>
            </summary>
            <fieldset className="settings-card">
              <legend>Note format</legend>
              <label className="setting-row">
                <span>
                  <strong>Exam layout</strong>
                  <small>Intake and re-exam structure</small>
                </span>
                <span className="switch-control">
                  <input
                    type="checkbox"
                    name="examLayout"
                    checked={noteSettings.examLayout}
                    onChange={updateSetting}
                  />
                  <span aria-hidden="true" />
                </span>
              </label>
              <label className="setting-row">
                <span>
                  <strong>Personal injury</strong>
                  <small>Include PI-specific structure</small>
                </span>
                <span className="switch-control">
                  <input
                    type="checkbox"
                    name="PILayout"
                    checked={noteSettings.PILayout}
                    onChange={updateSetting}
                  />
                  <span aria-hidden="true" />
                </span>
              </label>
            </fieldset>
          </details>

          {startError && <p className="recording-error" role="alert">{startError}</p>}
          <div className="recording-ready-footer">
            <p className="recording-consent">Confirm patient consent according to your practice policy before recording.</p>
          </div>
        </div>
      ) : isPreparingTranscript || isGeneratingSummary ? (
        <div className="processing-card" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <span className="processing-kicker">Recording complete</span>
          <h3>{isPreparingTranscript ? 'Preparing transcript' : 'Generating note'}</h3>
          <p>{isPreparingTranscript ? 'The recording is safely uploaded.' : 'ChiroNote is writing the clinical note.'}</p>
          <small>Keep the ChiroNote side panel open.</small>
        </div>
      ) : (
        <div className="active-recording">
          <div className="recording-status-card">
            <div className={`recording-orb ${isPaused ? 'paused' : ''}`}>
              <Icon name={isPaused ? 'pause' : 'waveform'} size={28} />
            </div>
            <span className="recording-badge"><span />{isPaused ? 'Recording paused' : 'Recording visit'}</span>
            <strong className="recording-time">{formatDuration(elapsedSeconds)}</strong>
            <div className="sound-bars" aria-hidden="true">
              {[0, 1, 2, 3, 4].map(index => (
                <span key={index} className={isPaused ? 'paused' : ''} style={{ animationDelay: `${index * 0.12}s` }} />
              ))}
            </div>
          </div>

          <div className="recording-actions">
            <button type="button" className="secondary-button" onClick={isPaused ? resumeRecording : pauseRecording}>
              <Icon name={isPaused ? 'play' : 'pause'} size={17} />
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button type="button" className="primary-button" onClick={stopRecording}>
              <Icon name="stop" size={17} /> Finish visit
            </button>
          </div>
          <button type="button" className="danger-text-button" onClick={() => setShowConfirmation(true)}>
            <Icon name="trash" size={15} /> Discard recording
          </button>
        </div>
      )}
    </section>
  );
}

export default Recording;
