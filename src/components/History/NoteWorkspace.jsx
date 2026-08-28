import React from 'react';
import Icon from '../Icon';
import { splitNoteIntoSections } from '../../utils/noteSections';

function noteTimestamp(timestamp) {
  const date = new Date(Number(timestamp));
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function NoteWorkspace({ note, copyState, onCopySection, onCopyNote, canCopy, onNewRecording }) {
  const noteText = note?.note?.trim() || '';
  const sections = splitNoteIntoSections(noteText);
  const hasSections = sections.some(section => section.label);

  if (!noteText) {
    return (
      <section className="note-workspace empty-workspace">
        <div className="empty-icon"><Icon name="mic" size={25} /></div>
        <h1>Ready for the next patient</h1>
        <p>Your usual note settings are already selected.</p>
        <button type="button" className="primary-button" onClick={onNewRecording}>
          <Icon name="mic" size={19} /> Start recording
        </button>
      </section>
    );
  }

  return (
    <section className="note-workspace">
      <div className="note-meta">
        <div className="note-meta-details">
          <strong>Generated Note</strong>
          <time>{noteTimestamp(note.timestamp)}</time>
        </div>
        <button type="button" className="secondary-button note-copy-button"
          aria-label="Copy to Clipboard" disabled={!canCopy} onClick={onCopyNote}>
          <Icon name={copyState.target === 'all' && copyState.status === 'copied' ? 'check' : 'copy'} size={17} />
          Copy to Clipboard
        </button>
      </div>

      <p className={`copy-feedback ${copyState.status}`} role="status" aria-live="polite">
        {copyState.target === 'all' && copyState.status === 'copied' ? 'Entire note copied' :
          copyState.target === 'all' && copyState.status === 'error' ? 'Copy failed. Select the note text and copy manually.' : ''}
      </p>

      <article className="note-document" aria-label="Generated clinical note">
        {hasSections ? sections.map((section, index) => (
          <section className="note-section" key={`${section.label || 'introduction'}-${index}`}>
            {section.label && (
              <div className="section-heading-row">
                <button
                  type="button"
                  className="section-copy-link"
                  onClick={() => onCopySection(section.text, section.label)}
                  title={`Copy ${section.label} section`}
                >
                  {section.label.toUpperCase()}:
                </button>
                <span className={`section-feedback ${copyState.status}`} role="status" aria-live="polite">
                  {copyState.target === section.label && copyState.status === 'copied'
                    ? `${section.label} copied`
                    : copyState.target === section.label && copyState.status === 'error'
                      ? 'Copy failed'
                      : ''}
                </span>
              </div>
            )}
            <p>{section.text}</p>
          </section>
        )) : <p className="unsectioned-note">{noteText}</p>}
      </article>

      <p className="review-reminder">
        Review clinical accuracy before copying into the EHR.{' '}
        {hasSections
          ? 'Click a green section heading to copy that section.'
          : 'Use Copy to Clipboard above to copy the complete note.'}
      </p>
    </section>
  );
}

export default NoteWorkspace;
