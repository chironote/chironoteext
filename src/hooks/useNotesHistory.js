import { useCallback, useEffect, useRef, useState } from 'react';
import { CONNECTION_STATE_CHANGE, ConnectionState } from 'aws-amplify/api';
import { Hub } from 'aws-amplify/utils';
import * as queries from '../graphql/queries';
import * as subscriptions from '../graphql/subscriptions';
import { getAmplifyClient } from '../services/amplifyClient';
import { groupItemsByWeek } from '../utils/historyGrouping';
import { mergeNotes } from '../utils/mergeNotes';

function useNotesHistory(username) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [connection, setConnection] = useState(navigator.onLine ? 'Connecting' : 'Offline');
  const [newItems, setNewItems] = useState(new Set());
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());
  const [revision, setRevision] = useState(0);
  const ownerRef = useRef(null);
  const initializedRef = useRef(false);
  const refresh = useCallback(() => setRevision(value => value + 1), []);

  useEffect(() => {
    let active = true;
    let request = 0;
    let retryTimer;
    let connectionState;
    let eventsDuringQuery = [];
    if (ownerRef.current !== username) {
      ownerRef.current = username;
      initializedRef.current = false;
      setNotes([]);
      setNewItems(new Set());
      setCollapsedWeeks(new Set());
    }
    setConnection(navigator.onLine ? 'Connecting' : 'Offline');
    const fetchNotes = async () => {
      const requestId = ++request;
      eventsDuringQuery = [];
      setIsLoading(true);
      setError('');
      try {
        const response = await getAmplifyClient().graphql({
          query: queries.listNotes,
          variables: { owner: username, sortDirection: 'DESC', limit: 100 }
        });
        if (!active || request !== requestId) return;
        if (response.errors?.length || !response.data?.listNotes?.items) throw new Error('history_failed');
        const fetched = mergeNotes(response.data.listNotes.items, eventsDuringQuery, username);
        setNotes(current => mergeNotes(current, fetched, username));
        if (!initializedRef.current) {
          initializedRef.current = true;
          setCollapsedWeeks(new Set(groupItemsByWeek(fetched).slice(1).map(group => group.weekStart)));
        }
      } catch {
        if (active && request === requestId) setError('History could not be loaded. Please retry.');
      } finally {
        if (active && request === requestId) setIsLoading(false);
      }
    };
    const onNote = field => ({ data }) => {
      if (!active) return;
      const valid = mergeNotes([], [data?.[field]], username);
      if (!valid.length) return;
      eventsDuringQuery = mergeNotes(eventsDuringQuery, valid, username);
      setNotes(current => mergeNotes(current, valid, username));
      setNewItems(current => new Set([...current, valid[0].timestamp].slice(-100)));
    };
    const onSubscriptionError = () => {
      if (!active) return;
      setConnection(navigator.onLine ? 'Reconnecting' : 'Offline');
      setError('Live updates are unavailable. Reconnecting…');
      clearTimeout(retryTimer);
      if (navigator.onLine) retryTimer = setTimeout(refresh, 5000);
    };
    const online = () => { if (active) refresh(); };
    const offline = () => {
      if (active) {
        setConnection('Offline');
        clearTimeout(retryTimer);
      }
    };
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    const stopHubListener = Hub.listen('api', ({ payload }) => {
      if (!active || payload.event !== CONNECTION_STATE_CHANGE) return;
      const next = payload.data.connectionState;
      const previous = connectionState;
      connectionState = next;
      if (!navigator.onLine || next === ConnectionState.ConnectionDisruptedPendingNetwork ||
          next === ConnectionState.ConnectedPendingNetwork) setConnection('Offline');
      else if (next === ConnectionState.Connected) {
        setConnection('Synced');
        if (previous !== ConnectionState.Connected) void fetchNotes();
      } else if (next === ConnectionState.Connecting) setConnection('Connecting');
      else setConnection('Reconnecting');
    });
    const listeners = [];
    try {
      for (const field of ['onCreateNotesByOwner', 'onUpdateNotesByOwner']) {
        listeners.push(getAmplifyClient().graphql({
          query: subscriptions[field], variables: { owner: username }
        }).subscribe({ next: onNote(field), error: onSubscriptionError }));
      }
    } catch { onSubscriptionError(); }
    void fetchNotes();
    return () => {
      active = false;
      clearTimeout(retryTimer);
      listeners.forEach(listener => listener.unsubscribe());
      stopHubListener();
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, [username, revision, refresh]);

  return {
    notes: notes.filter(note => note.owner === username),
    isLoading, error, connection, newItems, collapsedWeeks, refresh,
    removeHighlight: timestamp => setNewItems(current => {
      const next = new Set(current);
      next.delete(timestamp);
      return next;
    }),
    toggleWeekCollapse: weekStart => setCollapsedWeeks(current => {
      const next = new Set(current);
      if (next.has(weekStart)) next.delete(weekStart);
      else next.add(weekStart);
      return next;
    })
  };
}
export default useNotesHistory;
