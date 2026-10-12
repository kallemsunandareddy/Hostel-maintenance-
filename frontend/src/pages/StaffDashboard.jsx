import React, { useState, useEffect } from 'react';
import { Wrench, CheckSquare, Clock, AlertCircle, CheckCircle2, Eye, UploadCloud, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SLABadge } from '../components/SLABadge';
import { ImageUploader } from '../components/ImageUploader';

export const StaffDashboard = ({ activeTab = 'dashboard', selectedComplaintId }) => {
  const { user, token } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [directRequests, setDirectRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewTask, setViewTask] = useState(null);

  // Reply form state
  const [replyText, setReplyText] = useState({});
  const [replyingId, setReplyingId] = useState(null);

  // Status Action Form State
  const [remarks, setRemarks] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchStaffTasks();
    fetchDirectRequests();
  }, [activeTab]);

  const fetchDirectRequests = async () => {
    try {
      const res = await fetch('/api/direct-help', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) setDirectRequests(await res.json());
    } catch (e) {
      console.error('Failed to fetch direct help requests:', e);
    }
  };

  const handleSendReply = async (requestId) => {
    const text = replyText[requestId];
    if (!text) return alert('Enter reply message first');
    try {
      const res = await fetch(`/api/direct-help/${requestId}/reply`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ staff_reply: text, status: 'ANSWERED' })
      });
      if (res.ok) {
        alert('Reply sent to student!');
        setReplyText({ ...replyText, [requestId]: '' });
        fetchDirectRequests();
      }
    } catch (e) {
      alert('Failed to send reply');
    }
  };

  useEffect(() => {
    if (selectedComplaintId) {
      openTaskModal(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  const fetchStaffTasks = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/complaints', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (e) {
      console.error('Failed to fetch staff tasks:', e);
    } finally {
      setLoading(false);
    }
  };

  const openTaskModal = async (id) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setViewTask(data);
        setRemarks('');
        setPhotoFile(null);
      }
    } catch (e) {
      console.error('Failed to fetch task details:', e);
    }
  };

  const handleStatusUpdate = async (nextStatus, photoType) => {
    if (!viewTask) return;
    setUpdating(true);
    try {
      const formData = new FormData();
      formData.append('new_status', nextStatus);
      formData.append('remarks', remarks || `Work status updated to ${nextStatus}`);
      if (photoType) formData.append('photo_type', photoType);
      if (photoFile) formData.append('photo', photoFile);

      const res = await fetch(`/api/complaints/${viewTask.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update status');

      alert(data.message);
      openTaskModal(viewTask.id);
      fetchStaffTasks();
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Metrics
  const total = tasks.length;
  const pending = tasks.filter(t => t.status === 'ASSIGNED').length;
  const inProgress = tasks.filter(t => t.status === 'ACCEPTED' || t.status === 'IN_PROGRESS' || t.status === 'FOLLOW_UP_REQUESTED').length;
  const resolved = tasks.filter(t => t.status === 'RESOLVED' || t.status === 'CLOSED').length;

  return (
    <div className="page-body">
      {/* Welcome Banner */}
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
          Maintenance Staff Workbench 🛠️
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
          Welcome back, {user?.name} ({user?.staff?.department} Specialist • Staff Code: {user?.staff?.staff_code})
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>Assigned Complaints</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>{total}</div>
        </div>
        <div className="card">
          <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: '600' }}>Pending Acceptance</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>{pending}</div>
        </div>
        <div className="card">
          <div style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: '600' }}>Active In-Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c084fc', marginTop: '4px' }}>{inProgress}</div>
        </div>
        <div className="card">
          <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: '600' }}>Completed & Resolved</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>{resolved}</div>
        </div>
      </div>

      {/* Task List */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155', fontWeight: '700', fontSize: '1.1rem', color: '#f8fafc' }}>
          My Maintenance Tasks Inbox
        </div>
        <div className="table-responsive">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Complaint Code</th>
                <th>Student & Room</th>
                <th>Category</th>
                <th>Priority</th>
                <th>Status</th>
                <th>SLA Deadline</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading assigned tasks...</td></tr>
              ) : tasks.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
                    <CheckCircle2 size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
                    <div style={{ fontSize: '1.1rem', color: '#f8fafc', fontWeight: '700' }}>You're all caught up! 🎉</div>
                    <div>No pending maintenance tasks assigned.</div>
                  </td>
                </tr>
              ) : (
                tasks.map(t => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ fontWeight: '800', color: '#3b82f6' }}>{t.complaint_code}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(t.created_at).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <div style={{ fontWeight: '600', color: '#f8fafc' }}>{t.student_name}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{t.hostel_block} • Room {t.room_number}</div>
                    </td>
                    <td>{t.category}</td>
                    <td><PriorityBadge priority={t.priority} /></td>
                    <td><StatusBadge status={t.status} /></td>
                    <td><SLABadge deadline={t.sla_deadline} status={t.status} /></td>
                    <td>
                      <button onClick={() => openTaskModal(t.id)} className="btn btn-primary btn-sm">
                        <Wrench size={14} /> Update Work
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIRECT STAFF ASSISTANCE INBOX */}
      <div className="card" style={{ marginTop: '2rem', padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #334155', fontWeight: '700', fontSize: '1.1rem', color: '#06b6d4', display: 'flex', alignItems: 'center', gap: '8px' }}>
          💬 Student Direct Assistance Messages ({directRequests.length})
        </div>
        <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {directRequests.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
              No direct assistance queries from students at this time.
            </div>
          ) : (
            directRequests.map(req => (
              <div key={req.id} style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <div>
                    <span style={{ fontWeight: '700', color: '#38bdf8', fontSize: '1rem' }}>{req.subject}</span>
                    <span style={{ fontSize: '0.8rem', color: '#94a3b8', marginLeft: '10px' }}>From: <strong>{req.student_name}</strong> ({req.hostel_block} • Room {req.room_number})</span>
                  </div>
                  <span className={`badge ${req.status === 'ANSWERED' ? 'badge-resolved' : 'badge-pending'}`}>
                    {req.status}
                  </span>
                </div>

                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', background: '#1e293b', padding: '8px 12px', borderRadius: '6px', marginBottom: '10px' }}>
                  "{req.message}"
                </p>

                {req.staff_reply ? (
                  <div style={{ fontSize: '0.825rem', color: '#34d399', background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', padding: '8px 10px', borderRadius: '6px' }}>
                    <strong>Your Reply:</strong> "{req.staff_reply}"
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Type direct guidance reply to student..."
                      value={replyText[req.id] || ''}
                      onChange={e => setReplyText({ ...replyText, [req.id]: e.target.value })}
                    />
                    <button onClick={() => handleSendReply(req.id)} className="btn btn-primary btn-sm" style={{ background: '#06b6d4' }}>
                      Send Guidance Reply
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* TASK DETAILS & WORKFLOW MODAL */}
      {viewTask && (
        <div className="modal-overlay" onClick={() => setViewTask(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3b82f6' }}>{viewTask.complaint_code}</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '10px' }}>{viewTask.student_name} • {viewTask.hostel_block} Room {viewTask.room_number}</span>
              </div>
              <button onClick={() => setViewTask(null)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', alignItems: 'center' }}>
              <StatusBadge status={viewTask.status} />
              <PriorityBadge priority={viewTask.priority} />
              <SLABadge deadline={viewTask.sla_deadline} status={viewTask.status} />
            </div>

            <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid #334155', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Student Description</div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#f8fafc', marginTop: '4px' }}>{viewTask.category}</div>
              <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '4px' }}>{viewTask.description}</p>
            </div>

            {/* Evidence Photos */}
            {viewTask.photos && viewTask.photos.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Uploaded Photos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '8px' }}>
                  {viewTask.photos.map(p => (
                    <div key={p.id} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
                      <img src={p.photo_url} alt={p.photo_type} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                      <div style={{ padding: '4px', fontSize: '0.7rem', textAlign: 'center', background: '#0f172a', color: '#38bdf8' }}>{p.photo_type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up Alert if present */}
            {viewTask.status === 'FOLLOW_UP_REQUESTED' && (
              <div style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#fb923c', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={18} /> Student Re-inspection Request
                </h4>
                {viewTask.followups && viewTask.followups[0] && (
                  <p style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: '4px' }}>
                    "{viewTask.followups[0].reason}"
                  </p>
                )}
              </div>
            )}

            {/* STAFF ACTION WORKFLOW CONTROLS */}
            <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '12px', border: '1px solid #3b82f6' }}>
              <h4 style={{ fontSize: '1rem', fontWeight: '700', color: '#f8fafc', marginBottom: '1rem' }}>
                Update Task Execution Progress
              </h4>

              {viewTask.status === 'ASSIGNED' && (
                <button onClick={() => handleStatusUpdate('ACCEPTED')} disabled={updating} className="btn btn-primary" style={{ width: '100%' }}>
                  Accept Maintenance Task Assignment
                </button>
              )}

              {(viewTask.status === 'ACCEPTED' || viewTask.status === 'ASSIGNED') && (
                <div style={{ marginTop: '0.75rem' }}>
                  <button onClick={() => handleStatusUpdate('IN_PROGRESS', 'BEFORE_REPAIR')} disabled={updating} className="btn btn-warning" style={{ width: '100%' }}>
                    Start Work & Mark In Progress
                  </button>
                </div>
              )}

              {(viewTask.status === 'IN_PROGRESS' || viewTask.status === 'FOLLOW_UP_REQUESTED') && (
                <div>
                  <div className="form-group">
                    <label className="form-label">Resolution Remarks / Repair Notes</label>
                    <textarea
                      className="form-textarea"
                      rows={3}
                      placeholder="Describe repair actions performed (e.g. Replaced damaged pipe connector and tested for 15 mins)..."
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Upload After-Repair Photo (Recommended)</label>
                    <ImageUploader onFileSelected={setPhotoFile} onClear={() => setPhotoFile(null)} />
                  </div>

                  <button 
                    onClick={() => handleStatusUpdate('RESOLVED', 'AFTER_REPAIR')} 
                    disabled={updating}
                    className="btn btn-success"
                    style={{ width: '100%', marginTop: '0.75rem' }}
                  >
                    <CheckCircle2 size={16} /> Mark Repair RESOLVED & Send to Student
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
