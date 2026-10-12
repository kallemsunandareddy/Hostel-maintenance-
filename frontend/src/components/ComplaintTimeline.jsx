import React from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle } from 'lucide-react';

const STAGES = [
  { key: 'SUBMITTED', label: 'Complaint Submitted' },
  { key: 'PENDING', label: 'Admin Reviewed' },
  { key: 'ASSIGNED', label: 'Staff Assigned' },
  { key: 'ACCEPTED', label: 'Staff Accepted' },
  { key: 'IN_PROGRESS', label: 'Repair In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'STUDENT_VERIFICATION', label: 'Student Verification' },
  { key: 'CLOSED', label: 'Closed' }
];

export const ComplaintTimeline = ({ currentStatus, history = [] }) => {
  const getStageIndex = (status) => {
    switch (status) {
      case 'SUBMITTED': return 0;
      case 'PENDING': return 1;
      case 'ASSIGNED': return 2;
      case 'ACCEPTED': return 3;
      case 'IN_PROGRESS': return 4;
      case 'RESOLVED': return 5;
      case 'STUDENT_VERIFICATION': return 6;
      case 'CLOSED': return 7;
      case 'FOLLOW_UP_REQUESTED': return 5; // loop back to inspection
      default: return 0;
    }
  };

  const activeIndex = getStageIndex(currentStatus);
  const isFollowUp = currentStatus === 'FOLLOW_UP_REQUESTED';

  return (
    <div style={{ padding: '1rem 0' }}>
      <h4 style={{ fontSize: '0.95rem', color: '#94a3b8', marginBottom: '1.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Complaint Progress Timeline
      </h4>

      {isFollowUp && (
        <div style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', padding: '0.75rem 1rem', borderRadius: '8px', color: '#fb923c', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={18} />
          <strong>Follow-up Active:</strong> Student requested additional re-inspection/repair.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
        {STAGES.map((stage, idx) => {
          const isDone = idx < activeIndex;
          const isCurrent = idx === activeIndex;

          // Find history entry if available
          const histItem = history.find(h => h.new_status === stage.key);

          return (
            <div key={stage.key} style={{ display: 'flex', gap: '1rem', minHeight: '52px' }}>
              {/* Timeline Indicator Column */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px' }}>
                <div style={{ marginTop: '2px' }}>
                  {isDone ? (
                    <CheckCircle2 size={20} color="#10b981" />
                  ) : isCurrent ? (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 10px rgba(59,130,246,0.6)' }}>
                      <Clock size={12} color="#fff" />
                    </div>
                  ) : (
                    <Circle size={18} color="#475569" />
                  )}
                </div>
                {idx < STAGES.length - 1 && (
                  <div 
                    style={{ 
                      flex: 1, 
                      width: '2px', 
                      background: isDone ? '#10b981' : isCurrent ? 'linear-gradient(to bottom, #3b82f6, #334155)' : '#334155',
                      margin: '4px 0'
                    }} 
                  />
                )}
              </div>

              {/* Text content */}
              <div style={{ paddingBottom: '1rem' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: isCurrent ? '700' : isDone ? '600' : '400', color: isCurrent ? '#60a5fa' : isDone ? '#f8fafc' : '#64748b' }}>
                  {stage.label} {isCurrent && <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.2)', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>Current</span>}
                </div>

                {histItem && (
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>
                    {histItem.changed_by_name} ({histItem.changed_by_role}) • {new Date(histItem.timestamp).toLocaleString()}
                    {histItem.remarks && <div style={{ color: '#cbd5e1', fontStyle: 'italic', marginTop: '1px' }}>"{histItem.remarks}"</div>}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
