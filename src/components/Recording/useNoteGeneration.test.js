import { act } from 'react';
import { TextDecoder } from 'util';
import { mountHook, deferred, flush } from '../../test/hookHarness';
import useNoteGeneration from './useNoteGeneration';
import { getAmplifyClient } from '../../services/amplifyClient';
import { generateToken } from './recordingAuth';

jest.mock('../../services/amplifyClient', () => ({ getAmplifyClient: jest.fn() }));
jest.mock('./recordingAuth', () => ({ generateToken: jest.fn() }));

describe('note generation lifecycle', () => {
  let hook;
  let listener;
  let unsubscribe;
  let callbacks;
  let reader;
  beforeEach(() => {
    jest.useFakeTimers();
    global.TextDecoder = TextDecoder;
    global.fetch = jest.fn();
    unsubscribe = jest.fn();
    getAmplifyClient.mockReturnValue({ graphql: () => ({ subscribe: value => {
      listener = value;
      return { unsubscribe };
    } }) });
    generateToken.mockResolvedValue('synthetic-token');
    callbacks = Object.fromEntries(['setTextStream', 'setIsPreparingTranscript', 'setIsGeneratingSummary',
      'setIsTranscriptCompleted', 'onTextStreamUpdate', 'onTransitionToMainApp', 'onError'].map(key => [key, jest.fn()]));
    hook = mountHook(() => useNoteGeneration({ ...callbacks, noSleepRef: { current: { disable: jest.fn() } } }));
    reader = { read: jest.fn(), cancel: jest.fn().mockResolvedValue() };
    fetch.mockResolvedValue({ ok: true, body: { getReader: () => reader } });
  });
  afterEach(() => {
    act(() => hook.current.cleanupNoteGeneration());
    hook.unmount();
    jest.useRealTimers();
    jest.clearAllMocks();
  });
  const start = async () => {
    await act(async () => {
      hook.current.subscribeToNoteCompletion('user', 123);
      listener.next({ data: { onUpdateNotesByOwner: { timestamp: '123', isCompleted: true } } });
      await flush();
    });
  };
  const chunk = text => ({ value: new Uint8Array(Buffer.from(text)), done: false });

  test('holds generation busy until EOF and emits a completed identity only then', async () => {
    const tail = deferred();
    reader.read.mockResolvedValueOnce(chunk('SUBJECTIVE: Synthetic note')).mockReturnValueOnce(tail.promise);
    await start();
    expect(callbacks.setIsGeneratingSummary).not.toHaveBeenCalledWith(false);
    expect(callbacks.onTextStreamUpdate).toHaveBeenLastCalledWith('SUBJECTIVE: Synthetic note', { timestamp: 123, complete: false });
    await act(async () => { tail.resolve({ done: true }); await flush(); });
    expect(callbacks.onTextStreamUpdate).toHaveBeenLastCalledWith('SUBJECTIVE: Synthetic note', { timestamp: 123, complete: true });
    expect(callbacks.onTransitionToMainApp).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ userId: 'user', timeStamp: 123 });
  });

  test.each([
    ['partial note', '\u0000ERR', 'OR:{"message":"synthetic failure"}'],
    ['{"error', 'Message":"synthetic failure"}']
  ])('preserves a clinical preview but removes split error payloads: %j', async (...parts) => {
    parts.forEach(part => reader.read.mockResolvedValueOnce(chunk(part)));
    reader.read.mockResolvedValue({ done: true });
    await start();
    expect(callbacks.onError).toHaveBeenCalledTimes(1);
    const preview = parts[0] === 'partial note' ? 'partial note' : '';
    expect(callbacks.onTextStreamUpdate).toHaveBeenLastCalledWith(preview, { timestamp: 123, complete: Boolean(preview), unsaved: true });
    expect(callbacks.onTransitionToMainApp).toHaveBeenCalledTimes(1);
  });

  test('transcript timeout triggers exactly one fallback and cleanup stops its timer', async () => {
    reader.read.mockResolvedValue({ done: true });
    await act(async () => {
      hook.current.subscribeToNoteCompletion('user', 123);
      jest.advanceTimersByTime(40000);
      listener.error(new Error('synthetic'));
      await flush();
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(callbacks.onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'generation_empty' }));
    act(() => { hook.current.subscribeToNoteCompletion('user', 456); hook.current.cleanupNoteGeneration(); });
    await act(async () => { jest.advanceTimersByTime(40000); await flush(); });
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  test('generation timeout aborts the request and ignores a late read', async () => {
    const pending = deferred();
    reader.read.mockReturnValue(pending.promise);
    await start();
    await act(async () => { jest.advanceTimersByTime(120000); await flush(); });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    expect(callbacks.onError).toHaveBeenCalledWith(expect.objectContaining({ code: 'generation_timeout' }));
    callbacks.onTextStreamUpdate.mockClear();
    await act(async () => { pending.resolve(chunk('late synthetic note')); await flush(); });
    expect(callbacks.onTextStreamUpdate).not.toHaveBeenCalled();
  });

  test('cleanup while waiting for authentication prevents a late fetch', async () => {
    const pending = deferred();
    generateToken.mockReturnValue(pending.promise);
    await start();
    act(() => hook.current.cleanupNoteGeneration());
    await act(async () => { pending.resolve('late-token'); await flush(); });
    expect(fetch).not.toHaveBeenCalled();
    expect(callbacks.onError).not.toHaveBeenCalled();
  });
});
