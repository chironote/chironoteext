import { act } from 'react';
import { ConnectionState, CONNECTION_STATE_CHANGE } from 'aws-amplify/api';
import { Hub } from 'aws-amplify/utils';
import { getAmplifyClient } from '../services/amplifyClient';
import { mountHook, deferred, flush } from '../test/hookHarness';
import useNotesHistory from './useNotesHistory';

jest.mock('aws-amplify/utils', () => ({ Hub: { listen: jest.fn() } }));
jest.mock('../services/amplifyClient', () => ({ getAmplifyClient: jest.fn() }));
describe('recent note synchronization', () => {
  let hook;
  let query;
  let subscriptions;
  let hubListener;
  let unsubscribe;
  const note = (timestamp, text = 'Synthetic note') => ({ owner: 'user', timestamp: String(timestamp), note: text });
  beforeEach(() => {
    subscriptions = [];
    unsubscribe = jest.fn();
    query = jest.fn().mockResolvedValue({ data: { listNotes: { items: [] } } });
    Hub.listen.mockImplementation((channel, listener) => { hubListener = listener; return jest.fn(); });
    getAmplifyClient.mockReturnValue({ graphql: input => {
      if (input.query.includes('subscription')) return { subscribe: listener => {
        subscriptions.push(listener);
        return { unsubscribe };
      } };
      return query(input);
    } });
  });
  afterEach(() => { hook?.unmount(); jest.useRealTimers(); jest.clearAllMocks(); });
  const event = data => subscriptions[0].next({ data: { onCreateNotesByOwner: data } });
  const connection = state => hubListener({ payload: { event: CONNECTION_STATE_CHANGE, data: { connectionState: state } } });

  test('a late initial query cannot overwrite a newer subscription event', async () => {
    const pending = deferred();
    query.mockReturnValue(pending.promise);
    hook = mountHook(() => useNotesHistory('user'));
    act(() => { event(note(2, 'New content')); event(note(3)); });
    await act(async () => { pending.resolve({ data: { listNotes: { items: [note(2, 'Old content'), note(1)] } } }); await flush(); });
    expect(hook.current.notes.map(item => item.timestamp)).toEqual(['3', '2', '1']);
    expect(hook.current.notes[1].note).toBe('New content');
  });
  test('reconnection refetches with actual Amplify enum values', async () => {
    hook = mountHook(() => useNotesHistory('user'));
    await act(flush);
    act(() => connection(ConnectionState.Connecting));
    expect(hook.current.connection).toBe('Connecting');
    await act(async () => { connection(ConnectionState.Connected); await flush(); });
    expect(hook.current.connection).toBe('Synced');
    expect(query).toHaveBeenCalledTimes(2);
    act(() => window.dispatchEvent(new Event('offline')));
    expect(hook.current.connection).toBe('Offline');
    await act(async () => { window.dispatchEvent(new Event('online')); await flush(); });
    expect(query).toHaveBeenCalledTimes(3);
  });
  test('sorts and deduplicates before limiting to the latest 100 notes', async () => {
    query.mockResolvedValue({ data: { listNotes: { items: Array.from({ length: 100 }, (_, index) => note(index + 1)) } } });
    hook = mountHook(() => useNotesHistory('user'));
    await act(flush);
    act(() => { event(note(2, 'Updated old note')); event(note(101)); });
    expect(hook.current.notes).toHaveLength(100);
    expect(hook.current.notes[0].timestamp).toBe('101');
    expect(hook.current.notes[99].timestamp).toBe('2');
  });
  test('explicit retry recovers a failed query', async () => {
    query.mockRejectedValueOnce(new Error('synthetic error'));
    hook = mountHook(() => useNotesHistory('user'));
    await act(flush);
    expect(hook.current.error).toMatch(/could not be loaded/);
    query.mockResolvedValue({ data: { listNotes: { items: [note(1)] } } });
    await act(async () => { hook.current.refresh(); await flush(); });
    expect(hook.current.error).toBe('');
    expect(hook.current.notes).toHaveLength(1);
  });
  test('ignores other owners and callbacks after teardown', async () => {
    hook = mountHook(() => useNotesHistory('user'));
    await act(flush);
    act(() => event({ ...note(1), owner: 'other-user' }));
    expect(hook.current.notes).toEqual([]);
    const old = subscriptions[0];
    hook.unmount();
    hook = null;
    expect(unsubscribe).toHaveBeenCalledTimes(2);
    expect(() => old.next({ data: { onCreateNotesByOwner: note(2) } })).not.toThrow();
  });
});
