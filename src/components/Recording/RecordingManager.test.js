import { act } from 'react';
import { getCurrentUser } from 'aws-amplify/auth';
import { getAmplifyClient } from '../../services/amplifyClient';
import { mountHook, deferred, flush } from '../../test/hookHarness';
import RecordingManager from './RecordingManager';

const mockStart = jest.fn();
const mockCancel = jest.fn();
jest.mock('nosleep.js', () => class NoSleep { disable() {} });
jest.mock('aws-amplify/auth', () => ({ getCurrentUser: jest.fn() }));
jest.mock('../../services/amplifyClient', () => ({ getAmplifyClient: jest.fn() }));
jest.mock('./useAudioUploadQueue', () => () => ({}));
jest.mock('./useMediaRecorderController', () => () => ({
  startRecording: mockStart, discardRecording: mockCancel, cleanupRecorder: mockCancel
}));
jest.mock('./useNoteGeneration', () => () => ({}));

describe('recording startup gate', () => {
  let hook;
  let query;
  let warning;
  beforeEach(() => {
    warning = jest.spyOn(console, 'warn').mockImplementation(() => {});
    getCurrentUser.mockResolvedValue({ username: 'user' });
    query = jest.fn().mockResolvedValue({ data: { getUserSubscription: { hoursleft: 1 } } });
    getAmplifyClient.mockReturnValue({ graphql: query });
    mockStart.mockResolvedValue();
    hook = mountHook(() => RecordingManager({ onTextStreamUpdate: jest.fn(), onTransitionToMainApp: jest.fn() }));
  });
  afterEach(() => { hook.unmount(); warning.mockRestore(); jest.clearAllMocks(); });

  test('duplicate starts share one pending eligibility check', async () => {
    const pending = deferred();
    query.mockReturnValue(pending.promise);
    await act(async () => { void hook.current.startRecording(); void hook.current.startRecording(); await flush(); });
    expect(query).toHaveBeenCalledTimes(1);
    expect(hook.current.isStarting).toBe(true);
    await act(async () => { pending.resolve({ data: { getUserSubscription: { hoursleft: 1 } } }); await flush(); });
    expect(mockStart).toHaveBeenCalledTimes(1);
    expect(hook.current.isStarting).toBe(false);
  });
  test('zero credits never opens the microphone', async () => {
    query.mockResolvedValue({ data: { getUserSubscription: { hoursleft: 0 } } });
    await act(async () => hook.current.startRecording());
    expect(mockStart).not.toHaveBeenCalled();
    expect(hook.current.error.code).toBe('recording_limit');
  });
  test('denied microphone access has a specific recoverable error', async () => {
    mockStart.mockRejectedValue(Object.assign(new Error('private details'), { name: 'NotAllowedError' }));
    await act(async () => hook.current.startRecording());
    expect(hook.current.error.code).toBe('microphone_denied');
    expect(hook.current.isStarting).toBe(false);
    expect(warning).toHaveBeenCalledWith('microphone_denied');
  });
  test('panel teardown invalidates a pending eligibility check', async () => {
    const pending = deferred();
    query.mockReturnValue(pending.promise);
    await act(async () => { void hook.current.startRecording(); await flush(); });
    act(() => window.dispatchEvent(new Event('pagehide')));
    await act(async () => { pending.resolve({ data: { getUserSubscription: { hoursleft: 1 } } }); await flush(); });
    expect(mockStart).not.toHaveBeenCalled();
    expect(mockCancel).toHaveBeenCalled();
  });
});
