import React, { useEffect, useRef } from 'react';
import Icon from '../Icon';
import './Recording.css';

function ConfirmationPopup({ onConfirm, onCancel }) {
  const cancelButtonRef = useRef(null);
  const dialogRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  onCancelRef.current = onCancel;

  useEffect(() => {
    const previousFocus = document.activeElement;
    cancelButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onCancelRef.current();
      }
      if (event.key === 'Tab') {
        const buttons = dialogRef.current.querySelectorAll('button');
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  return (
    <div className="confirmation-popup" role="presentation">
      <div ref={dialogRef} className="confirmation-content" role="alertdialog" aria-modal="true" aria-labelledby="discard-title" aria-describedby="discard-description">
        <div className="confirmation-icon"><Icon name="trash" size={20} /></div>
        <h3 id="discard-title">Discard this recording?</h3>
        <p id="discard-description">Stop recording and cancel pending uploads? Audio already submitted cannot be recalled; submitted work may still appear in Recent notes.</p>
        <div className="confirmation-buttons">
          <button ref={cancelButtonRef} type="button" className="cancel-btn" onClick={onCancel}>Keep recording</button>
          <button type="button" className="confirm-btn" onClick={onConfirm}>Discard</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmationPopup;
