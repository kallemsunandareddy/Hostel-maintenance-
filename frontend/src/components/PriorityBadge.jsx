import React from 'react';
import { AlertTriangle, Clock, AlertOctagon, Info } from 'lucide-react';

export const PriorityBadge = ({ priority }) => {
  const p = priority ? priority.toUpperCase() : 'MEDIUM';

  const getIcon = () => {
    switch (p) {
      case 'EMERGENCY':
        return <AlertOctagon size={13} />;
      case 'HIGH':
        return <AlertTriangle size={13} />;
      case 'MEDIUM':
        return <Clock size={13} />;
      default:
        return <Info size={13} />;
    }
  };

  return (
    <span className={`badge priority-${p.toLowerCase()}`}>
      {getIcon()}
      {p}
    </span>
  );
};
