import { useCallback, useEffect, useState } from 'react';
import { CONNECTION_STATE_CHANGE } from 'aws-amplify/api';
import { Hub } from 'aws-amplify/utils';
import * as queries from '../graphql/queries';
import * as subscriptions from '../graphql/subscriptions';
import { getAmplifyClient } from '../services/amplifyClient';
import { groupItemsByWeek } from '../utils/historyGrouping';

function useNotesHistory(username, setIsConnecting) {
  const [notes, setNotes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItems, setNewItems] = useState(new Set());
  const [collapsedWeeks, setCollapsedWeeks] = useState(new Set());

  const upsertNote = useCallback((note, highlight = true) => {
    if (!note?.note?.trim()) return;

    setNotes(current => [
      note,
      ...current.filter(item => item.timestamp !== note.timestamp)
    ].slice(0, 100));

    if (highlight) {
      setNewItems(current => new Set([...current, note.timestamp]));
    }
  }, []);

  useEffect(() => {
    let active = true;

    const fetchNotes = async () => {
      setIsLoading(true);
      setError('');

      try {
        const response = await getAmplifyClient().graphql({
          query: queries.listNotes,
          variables: {
            owner: username,
            sortDirection: 'DESC',
            limit: 100
          }
        });

        if (!active) return;
        const fetchedNotes = response.data.listNotes.items
          .filter(item => item.note?.trim())
          .slice(0, 100);

        setNotes(fetchedNotes);
        const groups = groupItemsByWeek(fetchedNotes);
        setCollapsedWeeks(new Set(groups.slice(1).map(group => group.weekStart)));
      } catch (fetchError) {
        console.error('Unable to load note history:', fetchError);
        if (active) setError('History could not be loaded.');
      } finally {
        if (active) setIsLoading(false);
      }
    };

    fetchNotes();
    return () => {
      active = false;
    };
  }, [username]);

  useEffect(() => {
    const client = getAmplifyClient();
    const stopHubListener = Hub.listen('api', ({ payload }) => {
      if (payload.event === CONNECTION_STATE_CHANGE) {
        setIsConnecting(payload.data.connectionState === 'connecting');
      }
    });

    const noteListener = (field) => ({ data }) => upsertNote(data[field]);
    const subscriptionErrors = (subscriptionError) => {
      console.warn('Note history subscription error:', subscriptionError);
      setError('Live updates are reconnecting.');
    };

    const created = client.graphql({
      query: subscriptions.onCreateNotesByOwner,
      variables: { owner: username }
    }).subscribe({
      next: noteListener('onCreateNotesByOwner'),
      error: subscriptionErrors
    });

    const updated = client.graphql({
      query: subscriptions.onUpdateNotesByOwner,
      variables: { owner: username }
    }).subscribe({
      next: noteListener('onUpdateNotesByOwner'),
      error: subscriptionErrors
    });

    return () => {
      created.unsubscribe();
      updated.unsubscribe();
      stopHubListener();
    };
  }, [setIsConnecting, upsertNote, username]);

  const removeHighlight = (timestamp) => {
    setNewItems(current => {
      const next = new Set(current);
      next.delete(timestamp);
      return next;
    });
  };

  const toggleWeekCollapse = (weekStart) => {
    setCollapsedWeeks(current => {
      const next = new Set(current);
      if (next.has(weekStart)) next.delete(weekStart);
      else next.add(weekStart);
      return next;
    });
  };

  return {
    notes,
    isLoading,
    error,
    newItems,
    collapsedWeeks,
    removeHighlight,
    toggleWeekCollapse
  };
}

export default useNotesHistory;
