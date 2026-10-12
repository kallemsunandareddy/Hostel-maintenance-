import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

export const SLABadge = ({ deadline, status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isBreached, setIsBreached] = useState(false);
  const [percentRemaining, setPercentRemaining] = useState(100);

  useEffect(() => {
    if (!deadline || status === 'CLOSED' || status === 'RESOLVED') {
      return;
    }

    const calculateTime = () => {
      const now = new Date().getTime();
      const target = new Date(deadline).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setIsBreached(true);
        setTimeLeft('SLA BREACHED');
        setPercentRemaining(0);
      } else {
        setIsBreached(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeLeft(`${hours}h ${mins}m remaining`);
        
        // Assume total SLA window max 48 hours for progress calculation
        const totalMs = 48 * 3600 * 1000;
        const pct = Math.min(100, Math.max(0, (diff / totalMs) * 100));
        setPercentRemaining(pct);
      }
    };

    calculateTime();
    const interval = setInterval(calculateTime, 30000);
    return () => clearInterval(interval);
  }, [deadline, status]);

  if (status === 'CLOSED' || status === 'RESOLVED') {
    return (
      <span style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
        <Clock size={13} /> SLA Completed
      </span>
    );
  }

  if (!deadline) return null;

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '3px' }}>
      <div 
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          fontSize: '0.78rem',
          fontWeight: '600',
          padding: '2px 8px',
          borderRadius: '4px',
          background: isBreached ? 'rgba(239, 68, 68, 0.2)' : 'rgba(59, 130, 246, 0.15)',
          color: isBreached ? '#f87171' : '#60a5fa',
          border: isBreached ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(59, 130, 246, 0.3)'
        }}
      >
        {isBreached ? <AlertTriangle size={13} /> : <Clock size={13} />}
        {timeLeft}
      </div>
      {!isBreached && (
        <div style={{ height: '3px', background: '#334155', borderRadius: '2px', overflow: 'hidden', width: '100%' }}>
          <div 
            style={{ 
              height: '100%', 
              width: `${percentRemaining}%`, 
              background: percentRemaining < 25 ? '#ef4444' : percentRemaining < 50 ? '#f59e0b' : '#3b82f6',
              transition: 'width 0.3s ease'
            }} 
          />
        </div>
      )}
    </div>
  );
};
