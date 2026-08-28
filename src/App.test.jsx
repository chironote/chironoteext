import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

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
    act(() => button('Recent Notes').click());
    expect(container.querySelector('.history-panel')).not.toBeNull();
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
