import React, { useEffect, useRef } from 'react';
import Icon from '../Icon';
import './Recording.css';

function ConfirmationPopup({ onConfirm, onCancel }) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onCancel]);

  return (
    <div className="confirmation-popup" role="presentation">
      <div className="confirmation-content" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description">
        <div className="confirmation-icon"><Icon name="trash" size={20} /></div>
        <h3 id="discard-title">Discard this recording?</h3>
        <p id="discard-description">The conversation audio will be deleted and no note will be created.</p>
        <div className="confirmation-buttons">
          <button ref={cancelButtonRef} type="button" className="cancel-btn" onClick={onCancel}>Keep recording</button>
          <button type="button" className="confirm-btn" onClick={onConfirm}>Discard</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationPopup;
