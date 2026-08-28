import React, { useEffect, useState } from 'react';
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
  isStarting,
  error,
  clearError,
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
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  useEffect(() => {
    localStorage.setItem('selectedLanguage', 'null');
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

      {error?.code === 'recording_limit' ? (
        <CreditPopup onClose={clearError} />
      ) : isIdle ? (
        <div className="recording-setup">
          <div className="recording-ready-copy">
            <span className="eyebrow">Ready for the next patient</span>
            <h1>Record the visit.</h1>
            <p>Your usual note settings are already selected.</p>
          </div>

          <button type="button" className="recording-start-card" disabled={isStarting} onClick={startRecording}>
            <Icon name="mic" size={38} />
            <strong>{isStarting ? 'Starting recording…' : 'Start recording'}</strong>
            <span>{isStarting ? 'Checking your account and microphone' : 'Uses your default microphone'}</span>
          </button>

          <details className="recording-preferences" open>
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
            <fieldset className="settings-card" disabled={isStarting}>
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

          {error && <p className="recording-error" role="alert">{error.message}</p>}
          <div className="recording-ready-footer">
            <p className="recording-consent">Confirm patient consent according to your practice policy before recording.</p>
          </div>
        </div>
      ) : isPreparingTranscript || isGeneratingSummary ? (
        <div className="processing-card" role="status" aria-live="polite">
          <div className="loading-spinner" aria-hidden="true" />
          <span className="processing-kicker">Recording complete</span>
          <h3>{isPreparingTranscript ? 'Preparing transcript' : 'Generating note'}</h3>
          <p>{isPreparingTranscript ? 'Uploading audio and preparing the transcript.' : 'ChiroNote is writing the clinical note.'}</p>
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
      <p className="panel-lifecycle-hint">Keep this side panel open while recording and generating. Closing it stops local work; submitted work may still appear in Recent notes.</p>
    </section>
  );
}

export default Recording;
