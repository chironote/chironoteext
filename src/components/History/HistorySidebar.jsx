import React, { useMemo, useState } from 'react';
import { formatTimestamp, getFirstSentenceOrSubstring, groupItemsByWeek } from '../../utils/historyGrouping';
import Icon from '../Icon';

function HistorySidebar({
  notes,
  searchQuery = '',
  isLoading,
  error,
  collapsedWeeks,
  newItems,
  selectedTimestamp,
  onItemClick,
  onToggleWeek,
  onRetry
}) {
  const [draggedTimestamp, setDraggedTimestamp] = useState(null);
  const terms = searchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const isSearching = terms.length > 0;
  // Search the complete label and body, not the truncated text shown in each row.
  const searchIndex = useMemo(() => notes.map(note => ({
    note,
    text: `${note.noteLabel || ''} ${note.note || ''}`.toLowerCase()
  })), [notes]);
  const visibleNotes = isSearching
    ? searchIndex.filter(item => terms.every(term => item.text.includes(term))).map(item => item.note)
    : notes;

  return (
    <section className="history-panel" aria-label="Recent notes">
      <div className="history-heading">
        <h1>Recent notes</h1>
        <span className="note-count" role="status" aria-live="polite" aria-atomic="true"
          aria-label={isSearching ? `${visibleNotes.length} of ${notes.length} notes match` : `${notes.length} notes`}>
          {isSearching ? `${visibleNotes.length} / ${notes.length}` : notes.length}
        </span>
      </div>
      <p className="history-search-hint" id="history-search-hint">
        Search labels and full content in your loaded recent notes. Drag a note into your EHR to transfer its complete text,
        or select it to review and copy.
      </p>

      <div className="history-scroll">
        {isLoading && <p className="history-message" role="status">Loading notes...</p>}
        {error && <div className="history-message error" role="alert">
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={onRetry}>Retry history</button>
        </div>}
        {!isLoading && !error && notes.length === 0 && (
          <div className="history-empty">
            <Icon name="file" size={20} />
            <p>Your completed notes will appear here.</p>
          </div>
        )}
        {!isLoading && notes.length > 0 && isSearching && visibleNotes.length === 0 && (
          <div className="history-empty">
            <Icon name="search" size={20} />
            <p>No matching notes. Try another name or test, or clear the search.</p>
          </div>
        )}

        {groupItemsByWeek(visibleNotes).map(group => {
          const collapsed = !isSearching && collapsedWeeks.has(group.weekStart);
          return (
            <section className="history-week" key={group.weekStart}>
              {isSearching ? <div className="week-button search-week-heading">{group.weekLabel}</div> : <button
                type="button"
                className="week-button"
                onClick={() => onToggleWeek(group.weekStart)}
                aria-expanded={!collapsed}
              >
                <span>{group.weekLabel}</span>
                <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={14} />
              </button>}

              {!collapsed && group.items.map(note => {
                const timestamp = formatTimestamp(note.timestamp);
                const isSelected = selectedTimestamp === note.timestamp;
                return (
                  <button
                    type="button"
                    className={`history-item ${isSelected ? 'selected' : ''} ${newItems.has(note.timestamp) ? 'new' : ''} ${draggedTimestamp === note.timestamp ? 'dragging' : ''}`}
                    key={note.timestamp}
                    onClick={() => onItemClick(note)}
                    draggable={Boolean(note.note?.trim())}
                    onDragStart={event => {
                      const noteText = note.note?.trim();
                      if (!noteText) {
                        event.preventDefault();
                        return;
                      }
                      event.dataTransfer.effectAllowed = 'copy';
                      event.dataTransfer.setData('text/plain', noteText);
                      setDraggedTimestamp(note.timestamp);
                    }}
                    onDragEnd={() => setDraggedTimestamp(null)}
                    aria-describedby="history-search-hint"
                    aria-current={isSelected ? 'page' : undefined}
                    title="Drag complete note into the EHR, or select it to review"
                  >
                    <span className="history-item-main">
                      <span className="history-item-text">
                        {note.noteLabel || getFirstSentenceOrSubstring(note.note, 54)}
                      </span>
                      <span className="history-item-time">
                        <span>{timestamp.time}</span>
                        <span aria-hidden="true"> | </span>
                        {timestamp.isToday ? (
                          <span>Today</span>
                        ) : (
                          <>
                            <span>{timestamp.day}</span>
                            <span aria-hidden="true"> | </span>
                            <span>{timestamp.date}</span>
                          </>
                        )}
                      </span>
                    </span>
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>
    </section>
  );
}

export default HistorySidebar;
