import React from 'react';
import { formatTimestamp, getFirstSentenceOrSubstring, groupItemsByWeek } from '../../utils/historyGrouping';
import Icon from '../Icon';

function HistorySidebar({
  notes,
  isLoading,
  error,
  collapsedWeeks,
  newItems,
  selectedTimestamp,
  onItemClick,
  onToggleWeek,
  onRetry
}) {
  return (
    <section className="history-panel" aria-label="Recent notes">
      <div className="history-heading">
        <h1>Recent notes</h1>
        <span className="note-count" aria-label={`${notes.length} notes`}>{notes.length}</span>
      </div>

      <div className="history-scroll">
        {isLoading && <p className="history-message" role="status">Loading notes...</p>}
        {error && <div className="history-message error" role="alert">
          <p>{error}</p>
          <button type="button" className="secondary-button" onClick={onRetry}>Retry history</button>
        </div>}
        {!isLoading && notes.length === 0 && (
          <div className="history-empty">
            <Icon name="file" size={20} />
            <p>Your completed notes will appear here.</p>
          </div>
        )}

        {groupItemsByWeek(notes).map(group => {
          const collapsed = collapsedWeeks.has(group.weekStart);
          return (
            <section className="history-week" key={group.weekStart}>
              <button
                type="button"
                className="week-button"
                onClick={() => onToggleWeek(group.weekStart)}
                aria-expanded={!collapsed}
              >
                <span>{group.weekLabel}</span>
                <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={14} />
              </button>

              {!collapsed && group.items.map(note => {
                const timestamp = formatTimestamp(note.timestamp);
                const isSelected = selectedTimestamp === note.timestamp;
                return (
                  <button
                    type="button"
                    className={`history-item ${isSelected ? 'selected' : ''} ${newItems.has(note.timestamp) ? 'new' : ''}`}
                    key={note.timestamp}
                    onClick={() => onItemClick(note)}
                    aria-current={isSelected ? 'page' : undefined}
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
