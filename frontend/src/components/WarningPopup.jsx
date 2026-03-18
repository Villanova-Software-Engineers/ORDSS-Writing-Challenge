import { useState, useEffect } from 'react';

function WarningPopup() {
  const [showWarning, setShowWarning] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const checkTime = () => {
      // Get current time in EST
      const now = new Date();
      const estTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }));

      const hours = estTime.getHours();
      const minutes = estTime.getMinutes();

      // Check if we're between 11:54 PM and 11:59 PM EST (23:54 - 23:59)
      const isWarningTime = hours === 23 && minutes >= 54 && minutes < 60;

      // Reset dismissal when we're outside the warning window
      if (!isWarningTime) {
        setIsDismissed(false);
      }

      // Show warning if we're in the time window and it hasn't been dismissed
      setShowWarning(isWarningTime && !isDismissed);
    };

    // Check immediately
    checkTime();

    // Check every 30 seconds
    const interval = setInterval(checkTime, 30000);

    return () => clearInterval(interval);
  }, [isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setShowWarning(false);
  };

  if (!showWarning) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '8px',
        maxWidth: '450px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{ color: '#d32f2f', marginTop: 0 }}>⚠️ Warning</h2>
        <p style={{ fontSize: '18px', margin: '20px 0', color: '#333' }}>
          It's almost 11:59 PM EST!
        </p>
        <p style={{ fontSize: '14px', margin: '20px 0', color: '#666' }}>
          Less than 5 minutes remaining until the daily cutoff.
        </p>
        <p style={{ fontSize: '14px', margin: '10px 0', color: '#d32f2f', fontWeight: 'bold' }}>
          Your timer will automatically stop at 11:59 PM EST.
        </p>
        <p style={{ fontSize: '13px', margin: '10px 0', color: '#666' }}>
          Make sure to save your session before the cutoff!
        </p>
        <button
          onClick={handleDismiss}
          style={{
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            padding: '10px 30px',
            borderRadius: '4px',
            fontSize: '16px',
            cursor: 'pointer',
            marginTop: '10px'
          }}
        >
          OK
        </button>
      </div>
    </div>
  );
}

export default WarningPopup;
