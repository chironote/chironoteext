import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { Simulate } from 'react-dom/test-utils';
import App from './App';
import { formatTimestamp } from './utils/historyGrouping';

let mockManager;
let mockCallbacks;
let mockHistory;
jest.mock('aws-amplify', () => ({ Amplify: { configure: () => {} } }));
jest.mock('aws-amplify/auth', () => ({ fetchUserAttributes: jest.fn() }));
jest.mock('@aws-amplify/ui-react', () => ({ withAuthenticator: component => component }));
jest.mock('@aws-amplify/ui-react/styles.css', () => ({}), { virtual: true });
jest.mock('./components/Recording/RecordingManager', () => options => {
  mockCallbacks = options;
  return mockManager;
});
jest.mock('./hooks/useNotesHistory', () => () => mockHistory);

describe('side-panel review and account safety', () => {
  let root;
  let container;
  let signOut;
  const user = { username: 'demo-clinician', userId: 'synthetic-user' };
  const button = label => container.querySelector(`[aria-label="${label}"]`);
  const render = (identity = user) => act(() => root.render(<App user={identity} signOut={signOut} />));
  const search = value => act(() => Simulate.change(container.querySelector('input[type="search"]'), { target: { value } }));
  const capture = name => {
    if (process.env.CHIRONOTE_VISUAL_FIXTURES !== '1') return;
    const fs = require('fs');
    const path = require('path');
    const folder = path.resolve('release-artifacts/visual');
    fs.mkdirSync(folder, { recursive: true });
    const css = fs.readFileSync('src/index.css', 'utf8') + fs.readFileSync('src/App.css', 'utf8') +
      fs.readFileSync('src/components/Recording/Recording.css', 'utf8') + fs.readFileSync('src/components/Recording/CreditLimit.css', 'utf8');
    fs.writeFileSync(path.join(folder, 'preview.css'), css);
    fs.writeFileSync(path.join(folder, name + '.html'), '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Synthetic UI fixture: ' + name + '</title><link rel="stylesheet" href="preview.css"></head><body><div id="root">' + container.innerHTML + '</div></body></html>');
    fs.copyFileSync('src/assets/fulllogo.svg', path.join(folder, 'fulllogo.svg'));
  };
  beforeEach(() => {
    global.IS_REACT_ACT_ENVIRONMENT = true;
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
    signOut = jest.fn();
    require('aws-amplify/auth').fetchUserAttributes.mockResolvedValue({});
    mockManager = {
      isStarting: false, isRecording: false, isPaused: false, isPreparingTranscript: false,
      isGeneratingSummary: false, error: null, clearError: jest.fn(), startRecording: jest.fn(),
      stopRecording: jest.fn(), pauseRecording: jest.fn(), resumeRecording: jest.fn(), discardRecording: jest.fn()
    };
    mockHistory = {
      notes: [], isLoading: false, error: '', connection: 'Synced',
      collapsedWeeks: new Set(), newItems: new Set(), removeHighlight: jest.fn(),
      toggleWeekCollapse: jest.fn(), refresh: jest.fn()
    };
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: jest.fn().mockResolvedValue() } });
    render();
  });
  afterEach(() => { act(() => root.unmount()); container.remove(); });

  test('partial output and failures cannot be copied as notes', () => {
    capture('ready');
    mockManager.isGeneratingSummary = true;
    act(() => mockCallbacks.onTextStreamUpdate('Incomplete synthetic note', { timestamp: 123, complete: false }));
    expect(button('Copy to Clipboard')).toBeNull();
    expect(container.querySelector('.note-document')).toBeNull();
    mockManager.isGeneratingSummary = false;
    mockManager.error = { code: 'generation_failed', message: 'The note could not be generated.' };
    act(() => mockCallbacks.onTextStreamUpdate('', { timestamp: 123, complete: false }));
    expect(container.querySelector('[role="alert"]').textContent).toContain('could not be generated');
    expect(button('Copy to Clipboard')).toBeNull();
    capture('error');
  });

  test('matches completed history by owner and timestamp, and announces clipboard failure', async () => {
    mockHistory.notes = [{ owner: user.username, timestamp: '123', note: 'SUBJECTIVE: Synthetic improvement\nOBJECTIVE: Synthetic findings\nASSESSMENT: Synthetic assessment\nPLAN: Synthetic plan\nTREATMENT: Synthetic treatment' }];
    act(() => {
      mockCallbacks.onTextStreamUpdate('Different streamed text', { timestamp: 123, complete: true });
      mockCallbacks.onTransitionToMainApp();
    });
    expect(container.querySelector('.note-document').textContent).toContain('Synthetic improvement');
    expect(container.querySelectorAll('.section-copy-link')).toHaveLength(5);
    capture('review');
    navigator.clipboard.writeText.mockRejectedValueOnce(new Error('denied'));
    await act(async () => button('Copy to Clipboard').click());
    expect(container.textContent).toContain('Copy failed. Select the note text');
    await act(async () => container.querySelectorAll('.section-copy-link')[4].click());
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith('Synthetic treatment');
    expect(container.textContent).toContain('TREATMENT copied');
    act(() => button('Back to Notes').click());
    capture('history');
  });

  test('labeled navigation opens history, returns from review, and opens recording setup', async () => {
    expect(container.querySelector('.topbar img')).toBeNull();
    expect(button('Recent Notes').textContent).toBe('Recent Notes');
    expect(button('Recent Notes').querySelector('svg')).not.toBeNull();
    mockHistory.notes = [{ owner: user.username, timestamp: '123', note: 'Synthetic complete note' }];
    act(() => button('Recent Notes').click());
    expect(container.querySelector('.history-panel')).not.toBeNull();
    expect(button('Recent Notes')).toBeNull();
    expect(container.querySelector('input[type="search"]')).not.toBeNull();
    expect(document.activeElement).toBe(container.querySelector('input[type="search"]'));
    act(() => container.querySelector('.history-item').click());
    expect(button('Back to Notes').textContent).toBe('Back to Notes');
    expect(container.querySelector('.topbar .note-copy-button')).toBeNull();
    expect(container.querySelector('.note-meta').contains(button('Copy to Clipboard'))).toBe(true);
    await act(async () => button('Copy to Clipboard').click());
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('Synthetic complete note');
    expect(container.querySelector('.copy-feedback').textContent).toBe('Entire note copied');
    expect(container.querySelector('.note-meta strong').textContent).toBe('Generated Note');
    act(() => button('Back to Notes').click());
    expect(container.querySelector('.history-panel')).not.toBeNull();
    act(() => button('New Recording').click());
    expect(container.querySelector('.recording-start-card')).not.toBeNull();
    expect(mockManager.startRecording).not.toHaveBeenCalled();
    expect(button('Copy to Clipboard')).toBeNull();
    act(() => button('Recent Notes').click());
    act(() => container.querySelector('.history-item').click());
    act(() => button('New Recording').click());
    expect(container.querySelector('.recording-start-card')).not.toBeNull();
    expect(container.querySelector('.note-document')).toBeNull();
  });

  test('keeps note settings expanded when recording setup opens', () => {
    expect(container.querySelector('.recording-preferences').open).toBe(true);
  });

  test('searches full labels and bodies immediately, including terms split across both', () => {
    mockHistory.notes = [
      { timestamp: '123', noteLabel: 'Alex Morgan — follow-up', note: 'Synthetic findings. '.repeat(20) + 'Positive Spurling test.' },
      { timestamp: '124', noteLabel: 'Taylor Reed — review', note: 'Synthetic shoulder examination.' }
    ];
    act(() => button('Recent Notes').click());
    expect(container.querySelector('.history-search label').textContent).toBe('Search notes');
    expect(container.querySelector('.history-search-field > svg')).not.toBeNull();
    capture('history-search');
    search('  MORGAN  ');
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    expect(container.querySelector('.history-item').textContent).toContain('Alex Morgan');
    search('spurling');
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    search('  Morgan   SPURLING ');
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    expect(container.querySelector('.note-count').getAttribute('aria-label')).toBe('1 of 2 notes match');
    capture('history-search-results');
    act(() => container.querySelector('.history-item').click());
    expect(container.querySelector('.note-document').textContent).toContain('Positive Spurling test.');
    act(() => button('Back to Notes').click());
    expect(container.querySelector('input[type="search"]').value).toBe('  Morgan   SPURLING ');
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    act(() => button('Clear search').click());
    expect(container.querySelectorAll('.history-item')).toHaveLength(2);
    expect(document.activeElement).toBe(container.querySelector('input[type="search"]'));
  });

  test('drags a complete recent note into the parent page as plain text', () => {
    mockHistory.notes = [{ timestamp: '123', noteLabel: 'Synthetic visit', note: '  Complete synthetic note.\nPLAN: Continue care.  ' }];
    act(() => button('Recent Notes').click());
    const historyItem = container.querySelector('.history-item');
    const dataTransfer = { effectAllowed: '', setData: jest.fn() };

    expect(historyItem.draggable).toBe(true);
    expect(historyItem.getAttribute('aria-describedby')).toBe('history-search-hint');
    act(() => Simulate.dragStart(historyItem, { dataTransfer }));
    expect(dataTransfer.effectAllowed).toBe('copy');
    expect(dataTransfer.setData).toHaveBeenCalledWith('text/plain', 'Complete synthetic note.\nPLAN: Continue care.');
    expect(historyItem.classList.contains('dragging')).toBe(true);

    act(() => Simulate.dragEnd(historyItem, { dataTransfer }));
    expect(historyItem.classList.contains('dragging')).toBe(false);
    expect(container.querySelector('.history-panel')).not.toBeNull();
  });

  test('search reveals collapsed weeks and clearing preserves their original state', () => {
    mockHistory.notes = [{ timestamp: '123', noteLabel: 'Synthetic older visit', note: 'Negative Lachman test.' }];
    mockHistory.collapsedWeeks = new Set([formatTimestamp('123').weekStart]);
    act(() => button('Recent Notes').click());
    expect(container.querySelectorAll('.history-item')).toHaveLength(0);
    search('lachman');
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    expect(container.querySelector('button.week-button')).toBeNull();
    act(() => Simulate.keyDown(container.querySelector('input[type="search"]'), { key: 'Escape' }));
    expect(container.querySelector('input[type="search"]').value).toBe('');
    expect(container.querySelectorAll('.history-item')).toHaveLength(0);
    expect(mockHistory.toggleWeekCollapse).not.toHaveBeenCalled();
  });

  test('distinguishes no matches from empty history and handles whitespace and missing labels', () => {
    mockHistory.notes = [{ timestamp: '123', note: 'Synthetic Hawkins test.' }];
    act(() => button('Recent Notes').click());
    search('unmatched');
    expect(container.textContent).toContain('No matching notes.');
    expect(container.textContent).not.toContain('Your completed notes will appear here.');
    capture('history-search-empty');
    search('  \t ');
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    search('hawkins');
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    mockHistory.notes = [];
    render();
    expect(container.textContent).toContain('Your completed notes will appear here.');
    expect(container.textContent).not.toContain('No matching notes.');
  });

  test('updates search results as notes arrive or change without dropping loading and retry feedback', () => {
    act(() => button('Recent Notes').click());
    search('ortho');
    mockHistory.isLoading = true;
    render();
    expect(container.textContent).toContain('Loading notes...');
    expect(container.textContent).not.toContain('No matching notes.');
    mockHistory.notes = [{ timestamp: '123', note: 'Synthetic ortho exam.' }];
    mockHistory.isLoading = false;
    render();
    expect(container.querySelectorAll('.history-item')).toHaveLength(1);
    mockHistory.notes = [{ timestamp: '123', note: 'Synthetic updated examination.' }];
    mockHistory.error = 'History could not be loaded. Please retry.';
    render();
    expect(container.querySelectorAll('.history-item')).toHaveLength(0);
    expect(container.querySelector('[role="alert"]').textContent).toContain(mockHistory.error);
    act(() => container.querySelector('[role="alert"] button').click());
    expect(mockHistory.refresh).toHaveBeenCalledTimes(1);
  });

  test('clears the search when the authenticated account changes', () => {
    act(() => button('Recent Notes').click());
    search('Synthetic name');
    render({ username: 'another-clinician', userId: 'another-user' });
    act(() => button('Recent Notes').click());
    expect(container.querySelector('input[type="search"]').value).toBe('');
  });

  test('shows the Cognito email in the account menu', async () => {
    require('aws-amplify/auth').fetchUserAttributes.mockResolvedValue({ email: 'demo@example.com' });
    render({ ...user, userId: 'email-test-user' });
    await act(async () => {});
    act(() => button('Account menu').click());
    expect(container.querySelector('.account-menu-label span').textContent).toBe('demo@example.com');
  });

  test('sign-out and navigation stay disabled while starting, recording, preparing, or streaming', () => {
    for (const state of ['isStarting', 'isRecording', 'isPreparingTranscript', 'isGeneratingSummary']) {
      mockManager[state] = true;
      render();
      if (!container.querySelector('.account-menu')) act(() => button('Account menu').click());
      const signOutButton = container.querySelector('.account-menu button');
      expect(signOutButton.disabled).toBe(true);
      expect(button('Recent Notes').disabled).toBe(true);
      expect(button('New Recording').disabled).toBe(true);
      act(() => button('New Recording').click());
      expect(mockManager.clearError).not.toHaveBeenCalled();
      act(() => signOutButton.click());
      expect(signOut).not.toHaveBeenCalled();
      mockManager[state] = false;
    }
    render();
    expect(container.querySelector('.account-menu button').disabled).toBe(false);
    act(() => button('Account menu').click());
    mockManager.isRecording = true;
    render();
    capture('recording');
  });

  test('switching accounts clears the previous clinical workspace', () => {
    act(() => {
      mockCallbacks.onTextStreamUpdate('Previous synthetic note', { timestamp: 123, complete: true });
      mockCallbacks.onTransitionToMainApp();
    });
    expect(button('Copy to Clipboard')).not.toBeNull();
    render({ username: 'another-clinician', userId: 'another-user' });
    expect(container.textContent).not.toContain('Previous synthetic note');
    expect(button('Copy to Clipboard')).toBeNull();
  });
});
