import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { fetchUserAttributes } from 'aws-amplify/auth';
import { Image, View, withAuthenticator } from '@aws-amplify/ui-react';
import '@aws-amplify/ui-react/styles.css';
import config from './amplifyconfiguration.json';
import HistorySidebar from './components/History/HistorySidebar';
import NoteWorkspace from './components/History/NoteWorkspace';
import SavedNoteEditor from './components/Patients/SavedNoteEditor';
import { leaveDrafts, hasUnsavedDraft } from './components/Patients/draftNavigation';
import { patientNotesEnabled } from './services/patientNotes';
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
  const [editingNote, setEditingNote] = useState(null);
  const [historySearch, setHistorySearch] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);
  const [liveNote, setLiveNote] = useState(null);
  const [copyState, setCopyState] = useState({ status: 'idle', target: null });
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [accountEmail, setAccountEmail] = useState(user.signInDetails?.loginId || user.attributes?.email || user.username);
  const copyTimerRef = useRef(null);
  const copyRequestRef = useRef(0);
  const accountRef = useRef(null);
  const accountButtonRef = useRef(null);
  const historySearchRef = useRef(null);
  const notesHistory = useNotesHistory(user.username);
  const handleTextStreamUpdate = useCallback((text, { timestamp, complete, unsaved, savedNote }) => {
    setSelectedNote(null);
    setLiveNote(text ? { owner: user.username, timestamp, note: stripMarkdown(text), complete, unsaved, savedNote } : null);
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
  const reviewNote = selectedNote || liveNote?.savedNote || savedLiveNote || (liveNote?.complete ? liveNote : null);
  const canCopy = Boolean(reviewNote?.note?.trim()) && !isBusy && !showRecording && !showHistory;

  useEffect(() => {
    if (showHistory && !isBusy) historySearchRef.current?.focus();
  }, [showHistory, isBusy]);

  useEffect(() => () => {
    clearTimeout(copyTimerRef.current);
    copyRequestRef.current += 1;
  }, []);
  useEffect(() => {
    let cancelled = false;
    fetchUserAttributes()
      .then(attributes => {
        if (!cancelled && attributes.email) setAccountEmail(attributes.email);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user.userId, user.username]);
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
  const openRecording = async () => {
    if (isBusy || (hasUnsavedDraft() && !await leaveDrafts())) return;
    setEditingNote(null);
    resetCopy();
    recordingManager.clearError();
    setSelectedNote(null);
    setLiveNote(null);
    setShowRecording(true);
    setShowHistory(false);
    setShowAccountMenu(false);
  };
  const selectHistoryNote = async note => {
    if (hasUnsavedDraft() && !await leaveDrafts()) return;
    setEditingNote(null);
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
      <header className={`topbar ${showHistory && !isBusy ? 'topbar-history' : ''}`}>
        {showHistory && !isBusy ? (
          <div className="history-search" role="search" aria-label="Recent notes">
            <label htmlFor="history-search">Search notes</label>
            <div className="history-search-field">
              <Icon name="search" size={18} />
              <input id="history-search" ref={historySearchRef} type="search"
                placeholder="Name or test…" value={historySearch}
                autoComplete="off" spellCheck={false}
                aria-describedby="history-search-hint"
                onChange={event => setHistorySearch(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Escape') setHistorySearch('');
                }} />
              {historySearch && (
                <button type="button" className="history-search-clear" aria-label="Clear search"
                  onClick={() => { setHistorySearch(''); historySearchRef.current?.focus(); }}>
                  <Icon name="close" size={16} />
                </button>
              )}
            </div>
          </div>
        ) : <button type="button" className="icon-button topbar-nav"
          aria-label={!showRecording && !showHistory && reviewNote ? 'Back to Notes' : 'Recent Notes'}
          aria-pressed={showHistory} disabled={isBusy}
          onClick={() => leaveDrafts(() => { setEditingNote(null); resetCopy(); setShowHistory(true); setShowAccountMenu(false); })}>
          <Icon name={!showRecording && !showHistory && reviewNote ? 'back' : 'history'} size={19} />
          <span>{!showRecording && !showHistory && reviewNote ? 'Back to Notes' : 'Recent Notes'}</span>
        </button>}
        <div className="topbar-actions">
          <span className={`connection-indicator ${notesHistory.connection.toLowerCase()}`}
            role="status" aria-live="polite" title={notesHistory.connection}>
            <span aria-hidden="true" />{notesHistory.connection}
          </span>
          <button type="button" className="icon-button topbar-nav recording-nav"
            aria-label="New Recording" disabled={isBusy} onClick={openRecording}>
            <Icon name="mic" size={19} />
            <span>New Recording</span>
          </button>
          <div className="account-menu-wrap" ref={accountRef}>
            <button type="button" className="icon-button" ref={accountButtonRef}
              aria-label="Account menu" title="Account menu" aria-expanded={showAccountMenu}
              onClick={() => setShowAccountMenu(value => !value)}>
              <Icon name="account" size={19} />
            </button>
            {showAccountMenu && (
              <div className="account-menu" aria-label="Account options">
                <div className="account-menu-label"><small>Signed in as</small><span>{accountEmail}</span></div>
                <a href="https://chironote.ai/app/patients" target="_blank" rel="noopener noreferrer">Patient profiles and PDF export</a>
                <a href="https://chironote.ai/app/settings" target="_blank" rel="noopener noreferrer">Custom instructions on website</a>
                <a href="https://chironote.ai/app/account" target="_blank" rel="noopener noreferrer">Manage account on website</a>
                <button type="button" disabled={isBusy} onClick={() => { if (!isBusy) leaveDrafts(signOut); }}>
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
          <HistorySidebar {...notesHistory} searchQuery={historySearch} selectedTimestamp={reviewNote?.timestamp}
            onItemClick={selectHistoryNote} onToggleWeek={notesHistory.toggleWeekCollapse}
            onRetry={notesHistory.refresh} />
        ) : showRecording || isBusy ? (
          <Recording {...recordingManager} onBack={() => setShowRecording(true)} />
        ) : editingNote ? <SavedNoteEditor timestamp={editingNote} desktopSave onClose={() => setEditingNote(null)} onSaved={note => { setSelectedNote(note); notesHistory.refresh(); }} /> : (
          <>{patientNotesEnabled && reviewNote?.timestamp && !reviewNote.unsaved && <div className="patient-actions"><button type="button" onClick={() => setEditingNote(reviewNote.timestamp)}>Edit and save note</button></div>}
          <>{reviewNote?.unsaved && <p role="alert">This preview was not saved. You can copy it; retry generation from the saved recording.</p>}</>
          <NoteWorkspace note={reviewNote} copyState={copyState}
            onCopySection={copyText} onCopyNote={() => copyText(reviewNote.note, 'all')}
            canCopy={canCopy} onNewRecording={openRecording} /></>
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
