import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Image, View, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from './amplifyconfiguration.json';
import HistorySidebar from './components/History/HistorySidebar';
import NoteWorkspace from './components/History/NoteWorkspace';
import Recording from './components/Recording/Recording';
import RecordingManager from './components/Recording/RecordingManager';
import Icon from './components/Icon';
import useNotesHistory from './hooks/useNotesHistory';
import { extractPlainText } from './utils/historyGrouping';
import { stripMarkdown } from './utils/markdownStripper';
import textLogo from './assets/fulllogo.svg';
import './App.css';

Amplify.configure(config);

localStorage.setItem('selectedLanguage', 'null');

function AuthHeader() {
  return (
    <View className="auth-brand">
      <Image alt="ChiroNote" src={textLogo} className="auth-logo" />
      <p>Clinical notes beside your EHR</p>
    </View>
  );
}

function App({ signOut, user }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [showRecording, setShowRecording] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [liveNoteText, setLiveNoteText] = useState('');
  const [isLiveNote, setIsLiveNote] = useState(false);
  const [copyState, setCopyState] = useState({ status: 'idle', target: null });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const liveTimestampRef = useRef(null);
  const copyTimerRef = useRef(null);

  const notesHistory = useNotesHistory(user.username, setIsConnecting);

  const handleTextStreamUpdate = useCallback((newText) => {
    const cleanedText = stripMarkdown(newText || '');
    setLiveNoteText(cleanedText);
    setIsLiveNote(true);
    setSelectedNote({
      owner: user.username,
      timestamp: liveTimestampRef.current || Date.now(),
      note: cleanedText,
      noteLabel: 'New note'
    });
  }, [user.username]);

  const handleTransitionToWorkspace = useCallback(() => {
    setShowRecording(false);
    setShowHistory(false);
  }, []);

  const recordingManager = RecordingManager({
    onTextStreamUpdate: handleTextStreamUpdate,
    onTransitionToMainApp: handleTransitionToWorkspace
  });

  useEffect(() => {
    const newestNote = notesHistory.notes[0];
    if (!isLiveNote || !liveNoteText || !newestNote?.note) return;

    if (stripMarkdown(newestNote.note).trim() === liveNoteText.trim()) {
      setSelectedNote(newestNote);
      setIsLiveNote(false);
    }
  }, [isLiveNote, liveNoteText, notesHistory.notes]);

  useEffect(() => () => {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
  }, []);

  const openRecording = () => {
    liveTimestampRef.current = Date.now();
    setLiveNoteText('');
    setIsLiveNote(false);
    setCopyState({ status: 'idle', target: null });
    setShowRecording(true);
    setShowHistory(false);
    setShowAccountMenu(false);
  };

  const selectHistoryNote = (note) => {
    setSelectedNote(note);
    setIsLiveNote(false);
    setShowRecording(false);
    setShowHistory(false);
    setCopyState({ status: 'idle', target: null });
    notesHistory.removeHighlight(note.timestamp);
  };

  const copyText = async (text, target) => {
    const plainText = extractPlainText(text || '');
    if (!plainText) return;

    try {
      await navigator.clipboard.writeText(plainText);
      setCopyState({ status: 'copied', target });
    } catch {
      setCopyState({ status: 'error', target });
    }

    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(
      () => setCopyState({ status: 'idle', target: null }),
      1800
    );
  };

  const connectionLabel = !navigator.onLine
    ? 'Offline'
    : isConnecting
      ? 'Connecting'
      : 'Synced';

  const isBusy = recordingManager.isRecording ||
    recordingManager.isPreparingTranscript ||
    recordingManager.isGeneratingSummary;
  const hasSelectedNote = Boolean(selectedNote?.note?.trim() || liveNoteText.trim());
  const showCopyAll = hasSelectedNote && !showHistory && !showRecording && !isBusy;

  return (
    <div className="extension-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <img src={textLogo} alt="ChiroNote" className="topbar-logo" />
          <span className="topbar-context">Visit companion</span>
        </div>
        <div className="topbar-actions">
          <span
            className={`connection-indicator ${connectionLabel.toLowerCase()}`}
            aria-label={connectionLabel}
            aria-live="polite"
            role="status"
            title={connectionLabel}
          >
            <span aria-hidden="true" />
            {connectionLabel}
          </span>
          {showCopyAll && (
            <button
              type="button"
              className={`icon-button ${copyState.target === 'all' ? copyState.status : ''}`}
              aria-label={copyState.target === 'all' && copyState.status === 'copied'
                ? 'Entire note copied'
                : 'Copy entire note'}
              title="Copy entire note"
              onClick={() => copyText(selectedNote?.note || liveNoteText, 'all')}
            >
              <Icon name={copyState.target === 'all' && copyState.status === 'copied' ? 'check' : 'copy'} size={19} />
            </button>
          )}
          <button
            type="button"
            className={`icon-button ${showHistory ? 'active' : ''}`}
            aria-label={showHistory ? 'Return to visit workspace' : 'Show recent notes'}
            title={showHistory ? 'Return to visit workspace' : 'Recent notes'}
            aria-pressed={showHistory}
            disabled={isBusy}
            onClick={() => {
              setShowHistory(value => !value);
              setShowAccountMenu(false);
            }}
          >
            <Icon name="history" size={19} />
          </button>
          <div className="account-menu-wrap">
            <button
              type="button"
              className="icon-button"
              aria-label="Account menu"
              title="Account menu"
              aria-expanded={showAccountMenu}
              onClick={() => setShowAccountMenu(value => !value)}
            >
              <Icon name="account" size={19} />
            </button>
            {showAccountMenu && (
              <div className="account-menu" role="menu">
                <div className="account-menu-label">
                  <small>Signed in as</small>
                  <span>{user.username}</span>
                </div>
                <button type="button" role="menuitem" onClick={signOut}>Sign out</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="workspace">
        {showHistory && !isBusy ? (
          <HistorySidebar
            notes={notesHistory.notes}
            isLoading={notesHistory.isLoading}
            error={notesHistory.error}
            collapsedWeeks={notesHistory.collapsedWeeks}
            newItems={notesHistory.newItems}
            selectedTimestamp={isLiveNote ? null : selectedNote?.timestamp}
            onItemClick={selectHistoryNote}
            onToggleWeek={notesHistory.toggleWeekCollapse}
          />
        ) : showRecording || isBusy ? (
          <Recording
            onBack={() => setShowRecording(false)}
            isRecording={recordingManager.isRecording}
            isPaused={recordingManager.isPaused}
            isPreparingTranscript={recordingManager.isPreparingTranscript}
            isGeneratingSummary={recordingManager.isGeneratingSummary}
            startRecording={recordingManager.startRecording}
            stopRecording={recordingManager.stopRecording}
            discardRecording={recordingManager.discardRecording}
            pauseRecording={recordingManager.pauseRecording}
            resumeRecording={recordingManager.resumeRecording}
          />
        ) : (
          <NoteWorkspace
            note={selectedNote}
            copyState={copyState}
            onCopySection={(text, label) => copyText(text, label)}
            onNewRecording={openRecording}
          />
        )}
      </main>
    </div>
  );
}

export default withAuthenticator(App, {
  hideSignUp: true,
  components: { Header: AuthHeader }
});
