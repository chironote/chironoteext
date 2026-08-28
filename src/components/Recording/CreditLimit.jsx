import React, { useEffect, useState } from 'react';
import Icon from '../Icon';
import './CreditLimit.css';

function CreditPopup({ onClose }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const updateStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', updateStatus);
    window.addEventListener('offline', updateStatus);
    return () => {
      window.removeEventListener('online', updateStatus);
      window.removeEventListener('offline', updateStatus);
    };
  }, []);

  const openAccount = () => {
    window.open('https://chironote.ai/app/account', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="credit-card">
      <div className="credit-icon"><Icon name="warning" size={22} /></div>
      <h3>{isOffline ? 'No internet connection' : 'Recording limit reached'}</h3>
      <p>
        {isOffline
          ? 'Reconnect to the internet so ChiroNote can verify your account.'
          : 'Your plan has no recording time remaining. Open your account to review plan options.'}
      </p>
      {!isOffline && (
        <button type="button" className="primary-button" onClick={openAccount}>Open Account</button>
      )}
      <button type="button" className="secondary-button" onClick={onClose}>Back</button>
    </div>
  );
}

export default CreditPopup;
