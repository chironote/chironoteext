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

function AuthHeader() {
  return (
    <View className="auth-brand">
      <Image alt="ChiroNote" src={textLogo} className="auth-logo" />
      <p>Clinical notes beside your EHR</p>
    </View>
  );
}

export function VisitWorkspace({ signOut, user }) {
  const [showRecording, setShowRecording] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [liveNote, setLiveNote] = useState(null);
  const [copyState, setCopyState] = useState({ status: 'idle', target: null });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const copyTimerRef = useRef(null);
  const copyRequestRef = useRef(0);
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const notesHistory = useNotesHistory(user.username);
  const handleTextStreamUpdate = useCallback((text, { timestamp, complete }) => {
    setSelectedNote(null);
    setLiveNote(text ? { owner: user.username, timestamp, note: stripMarkdown(text), complete } : null);
  }, [user.username]);
  const transitionToReview = useCallback(() => {
    setShowRecording(false);
    setShowHistory(false);
  }, []);
  const recordingManager = RecordingManager({
    onTextStreamUpdate: handleTextStreamUpdate, onTransitionToMainApp: transitionToReview
  });
  const isBusy = recordingManager.isStarting || recordingManager.isRecording ||
    recordingManager.isPreparingTranscript || recordingManager.isGeneratingSummary;
  const savedLiveNote = liveNote?.complete && notesHistory.notes.find(note =>
    note.owner === liveNote.owner && String(note.timestamp) === String(liveNote.timestamp));
  const reviewNote = selectedNote || savedLiveNote || (liveNote?.complete ? liveNote : null);
  const canCopy = Boolean(reviewNote?.note?.trim()) && !isBusy && !showRecording && !showHistory;

  useEffect(() => () => {
    clearTimeout(copyTimerRef.current);
    copyRequestRef.current += 1;
  }, []);
  useEffect(() => {
    if (!showAccountMenu) return undefined;
    accountRef.current?.querySelector('.account-menu a, .account-menu button')?.focus();
    const close = event => {
      if (event.type === 'keydown' && event.key !== 'Escape') return;
      if (event.type !== 'keydown' && accountRef.current?.contains(event.target)) return;
      setShowAccountMenu(false);
      if (event.type === 'keydown') accountButtonRef.current?.focus();
    };
    window.addEventListener('pointerdown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('pointerdown', close);
      window.removeEventListener('keydown', close);
    };
  }, [showAccountMenu]);

  const resetCopy = () => {
    copyRequestRef.current += 1;
    clearTimeout(copyTimerRef.current);
    setCopyState({ status: 'idle', target: null });
  };
  const openRecording = () => {
    resetCopy();
    recordingManager.clearError();
    setSelectedNote(null);
    setLiveNote(null);
    setShowRecording(true);
    setShowHistory(false);
    setShowAccountMenu(false);
  };
  const selectHistoryNote = note => {
    resetCopy();
    setSelectedNote(note);
    setLiveNote(null);
    setShowRecording(false);
    setShowHistory(false);
    notesHistory.removeHighlight(note.timestamp);
  };
  const copyText = async (text, target) => {
    if (!canCopy) return;
    const plainText = extractPlainText(text || '');
    if (!plainText) return;
    const request = ++copyRequestRef.current;
    let status = 'copied';
    try { await navigator.clipboard.writeText(plainText); } catch { status = 'error'; }
    if (copyRequestRef.current !== request) return;
    setCopyState({ status, target });
    clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => setCopyState({ status: 'idle', target: null }), 2400);
  };

  return (
    <div className="extension-shell">
      <header className="topbar">
        <div className="topbar-brand">
          <img src={textLogo} alt="ChiroNote" className="topbar-logo" />
          <span className="topbar-context">Visit companion</span>
        </div>
        <div className="topbar-actions">
          <span className={`connection-indicator ${notesHistory.connection.toLowerCase()}`}
            role="status" aria-live="polite" title={notesHistory.connection}>
            <span aria-hidden="true" />{notesHistory.connection}
          </span>
          {canCopy && (
            <button type="button" className="icon-button" aria-label="Copy entire note"
              title="Copy entire note" onClick={() => copyText(reviewNote.note, 'all')}>
              <Icon name={copyState.target === 'all' && copyState.status === 'copied' ? 'check' : 'copy'} size={19} />
            </button>
          )}
          <button type="button" className={`icon-button ${showHistory ? 'active' : ''}`}
            aria-label={showHistory ? 'Return to visit workspace' : 'Show recent notes'}
            title="Recent notes" aria-pressed={showHistory} disabled={isBusy}
            onClick={() => { resetCopy(); setShowHistory(value => !value); setShowAccountMenu(false); }}>
            <Icon name="history" size={19} />
          </button>
          <div className="account-menu-wrap" ref={accountRef}>
            <button type="button" className="icon-button" ref={accountButtonRef}
              aria-label="Account menu" title="Account menu" aria-expanded={showAccountMenu}
              onClick={() => setShowAccountMenu(value => !value)}>
              <Icon name="account" size={19} />
            </button>
            {showAccountMenu && (
              <div className="account-menu" aria-label="Account options">
                <div className="account-menu-label"><small>Signed in as</small><span>{user.username}</span></div>
                <a href="https://chironote.ai/app/account" target="_blank" rel="noopener noreferrer">Manage account on website</a>
                <button type="button" disabled={isBusy} onClick={() => { if (!isBusy) signOut(); }}>
                  Sign out
                </button>
                {isBusy && <small>Finish or discard the visit before signing out.</small>}
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="workspace">
        {showHistory && !isBusy ? (
          <HistorySidebar {...notesHistory} selectedTimestamp={reviewNote?.timestamp}
            onItemClick={selectHistoryNote} onToggleWeek={notesHistory.toggleWeekCollapse}
            onRetry={notesHistory.refresh} />
        ) : showRecording || isBusy ? (
          <Recording {...recordingManager} onBack={() => setShowRecording(true)} />
        ) : (
          <NoteWorkspace note={reviewNote} copyState={copyState}
            onCopySection={copyText} onNewRecording={openRecording} />
        )}
      </main>
    </div>
  );
}

// Remount the complete clinical workspace whenever the authenticated identity changes.
function App(props) {
  return <VisitWorkspace key={props.user.userId || props.user.username} {...props} />;
}
export default withAuthenticator(App, { hideSignUp: true, components: { Header: AuthHeader } });
