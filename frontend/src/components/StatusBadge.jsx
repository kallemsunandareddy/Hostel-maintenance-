import React from 'react';

const statusLabels = {
  SUBMITTED: 'Submitted',
  PENDING: 'Pending Review',
  ASSIGNED: 'Staff Assigned',
  ACCEPTED: 'Task Accepted',
  IN_PROGRESS: 'Work In Progress',
  RESOLVED: 'Work Resolved',
  STUDENT_VERIFICATION: 'Verification Pending',
  CLOSED: 'Closed',
  FOLLOW_UP_REQUESTED: 'Follow-Up Requested',
  ESCALATED: 'Escalated'
};

export const StatusBadge = ({ status }) => {
  const normalized = status ? status.toUpperCase() : 'PENDING';
  const label = statusLabels[normalized] || normalized;
  const className = `badge badge-${normalized.toLowerCase()}`;

  return <span className={className}>{label}</span>;
};
