import React, { useState, useEffect } from 'react';
import { PlusCircle, Search, Filter, AlertCircle, CheckCircle2, Star, Clock, Eye, Wrench, MessageSquare, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SLABadge } from '../components/SLABadge';
import { ComplaintTimeline } from '../components/ComplaintTimeline';
import { ImageUploader } from '../components/ImageUploader';
import { DirectHelpModal } from '../components/DirectHelpModal';

const CATEGORIES = [
  { id: '⚡ Electrical', name: '⚡ Electrical' },
  { id: '🚰 Plumbing', name: '🚰 Plumbing' },
  { id: '🪑 Furniture', name: '🪑 Furniture' },
  { id: '🧹 Cleaning', name: '🧹 Cleaning' },
  { id: '🚿 Bathroom', name: '🚿 Bathroom' },
  { id: '🏠 Room Maintenance', name: '🏠 Room Maintenance' },
  { id: '📶 Wi-Fi / Internet', name: '📶 Wi-Fi / Internet' },
  { id: '❄️ AC / Fan', name: '❄️ AC / Fan' },
  { id: '💡 Lights', name: '💡 Lights' },
  { id: '🔧 Other', name: '🔧 Other' }
];

export const StudentDashboard = ({ selectedComplaintId, onClearSelectedComplaint }) => {
  const { user, token } = useAuth();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [showDirectHelpModal, setShowDirectHelpModal] = useState(false);
  const [viewComplaint, setViewComplaint] = useState(null);

  // Raise Form State
  const [category, setCategory] = useState('🚰 Plumbing');
  const [roomNumber, setRoomNumber] = useState(user?.student?.room_number || 'A-204');
  const [priority, setPriority] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Verification Form State
  const [verifying, setVerifying] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [followUpReason, setFollowUpReason] = useState('');
  const [showFollowUpInput, setShowFollowUpInput] = useState(false);

  useEffect(() => {
    fetchStudentComplaints();
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    if (selectedComplaintId) {
      openComplaintDetail(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  const fetchStudentComplaints = async () => {
    setLoading(true);
    try {
      let url = '/api/complaints?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints(data);
      }
    } catch (err) {
      console.error('Failed to load complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const openComplaintDetail = async (id) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setViewComplaint(data);
        setShowFollowUpInput(false);
      }
    } catch (e) {
      console.error('Failed to fetch detail:', e);
    }
  };

  const handleRaiseSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('room_number', roomNumber);
      formData.append('priority', priority);
      formData.append('description', description);
      if (photoFile) formData.append('photo', photoFile);

      const res = await fetch('/api/complaints', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit complaint');

      alert(data.message);
      setShowRaiseModal(false);
      setDescription('');
      setPhotoFile(null);
      fetchStudentComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async (action) => {
    if (!viewComplaint) return;
    setVerifying(true);
    try {
      const res = await fetch(`/api/complaints/${viewComplaint.id}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          action,
          rating: action === 'CONFIRM' ? rating : null,
          comment: action === 'CONFIRM' ? comment : null,
          follow_up_reason: action === 'NEED_HELP' ? followUpReason : null
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification failed');

      alert(data.message);
      openComplaintDetail(viewComplaint.id);
      fetchStudentComplaints();
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  // Metrics calculation
  const total = complaints.length;
  const pending = complaints.filter(c => c.status === 'PENDING' || c.status === 'SUBMITTED').length;
  const inProgress = complaints.filter(c => ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'FOLLOW_UP_REQUESTED'].includes(c.status)).length;
  const resolved = complaints.filter(c => ['RESOLVED', 'CLOSED'].includes(c.status)).length;

  return (
    <div className="page-body">
      {/* Welcome Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
            Good Day, {user?.name || 'Student'} 👋
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            {user?.student?.hostel_block || 'Hostel'} • Room {user?.student?.room_number || 'N/A'} • Roll No: {user?.student?.roll_number || 'N/A'}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => setShowDirectHelpModal(true)} 
            className="btn btn-secondary btn-lg"
            style={{ border: '1px solid #06b6d4', color: '#38bdf8' }}
          >
            💬 Direct Staff Assistance
          </button>
          <button 
            onClick={() => setShowRaiseModal(true)} 
            className="btn btn-primary btn-lg"
          >
            <PlusCircle size={20} /> Raise New Complaint
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>Total Complaints</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>{total}</div>
        </div>
        <div className="card">
          <div style={{ color: '#fbbf24', fontSize: '0.85rem', fontWeight: '600' }}>Pending Review</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#fbbf24', marginTop: '4px' }}>{pending}</div>
        </div>
        <div className="card">
          <div style={{ color: '#c084fc', fontSize: '0.85rem', fontWeight: '600' }}>In Progress</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#c084fc', marginTop: '4px' }}>{inProgress}</div>
        </div>
        <div className="card">
          <div style={{ color: '#34d399', fontSize: '0.85rem', fontWeight: '600' }}>Resolved & Closed</div>
          <div style={{ fontSize: '2rem', fontWeight: '800', color: '#34d399', marginTop: '4px' }}>{resolved}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search complaint code, room, or issue description..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '200px' }}
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
          <option value="FOLLOW_UP_REQUESTED">Follow-Up Requested</option>
        </select>
      </div>

      {/* Complaint List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>Loading your complaints...</div>
      ) : complaints.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
          <h3 style={{ fontSize: '1.4rem', color: '#f8fafc' }}>No complaints found</h3>
          <p style={{ color: '#94a3b8', marginTop: '4px', marginBottom: '1.5rem' }}>Your hostel room is in great shape!</p>
          <button onClick={() => setShowRaiseModal(true)} className="btn btn-primary">
            <PlusCircle size={18} /> Raise Your First Complaint
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {complaints.map(c => (
            <div 
              key={c.id} 
              className="card card-hover" 
              style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', borderLeft: `4px solid ${c.priority === 'EMERGENCY' ? '#ef4444' : c.priority === 'HIGH' ? '#f97316' : '#3b82f6'}` }}
            >
              <div style={{ flex: 1, minWidth: '280px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '1rem', fontWeight: '800', color: '#3b82f6' }}>{c.complaint_code}</span>
                  <StatusBadge status={c.status} />
                  <PriorityBadge priority={c.priority} />
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: '700', color: '#f8fafc', marginBottom: '4px' }}>
                  {c.category} • Room {c.room_number}
                </div>
                <p style={{ fontSize: '0.875rem', color: '#94a3b8', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                  {c.description}
                </p>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '8px' }}>
                  Submitted: {new Date(c.created_at).toLocaleString()}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                <SLABadge deadline={c.sla_deadline} status={c.status} />
                <button 
                  onClick={() => openComplaintDetail(c.id)} 
                  className="btn btn-secondary btn-sm"
                >
                  <Eye size={15} /> View Progress
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* RAISE COMPLAINT MODAL */}
      {showRaiseModal && (
        <div className="modal-overlay" onClick={() => setShowRaiseModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.25rem', color: '#f8fafc' }}>Raise Hostel Complaint</h3>
              <button onClick={() => setShowRaiseModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleRaiseSubmit}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Complaint Category</label>
                  <select 
                    className="form-select" 
                    value={category} 
                    onChange={e => setCategory(e.target.value)}
                    required
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input
                    type="text"
                    className="form-input"
                    value={roomNumber}
                    onChange={e => setRoomNumber(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Initial Priority Selection</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['LOW', 'MEDIUM', 'HIGH', 'EMERGENCY'].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      style={{
                        flex: 1,
                        padding: '8px',
                        borderRadius: '6px',
                        fontSize: '0.78rem',
                        fontWeight: '700',
                        background: priority === p ? (p === 'EMERGENCY' ? '#ef4444' : p === 'HIGH' ? '#f97316' : p === 'MEDIUM' ? '#f59e0b' : '#3b82f6') : '#0f172a',
                        color: priority === p ? '#fff' : '#94a3b8',
                        border: `1px solid ${priority === p ? 'transparent' : '#334155'}`
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div style={{ fontSize: '0.725rem', color: '#64748b', marginTop: '4px' }}>
                  * Final priority subject to Warden review
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Detailed Description</label>
                <textarea
                  className="form-textarea"
                  rows={4}
                  placeholder="Describe the issue clearly (e.g. Water leaking from pipe joint under bathroom sink...)"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Upload Photo (Optional)</label>
                <ImageUploader 
                  onFileSelected={setPhotoFile} 
                  onClear={() => setPhotoFile(null)} 
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
                <button type="button" onClick={() => setShowRaiseModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn btn-primary">
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT DETAIL & VERIFICATION MODAL */}
      {viewComplaint && (
        <div className="modal-overlay" onClick={() => { setViewComplaint(null); if (onClearSelectedComplaint) onClearSelectedComplaint(); }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3b82f6' }}>{viewComplaint.complaint_code}</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '10px' }}>{viewComplaint.hostel_block} • Room {viewComplaint.room_number}</span>
              </div>
              <button onClick={() => { setViewComplaint(null); if (onClearSelectedComplaint) onClearSelectedComplaint(); }} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', alignItems: 'center' }}>
              <StatusBadge status={viewComplaint.status} />
              <PriorityBadge priority={viewComplaint.priority} />
              <SLABadge deadline={viewComplaint.sla_deadline} status={viewComplaint.status} />
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Issue Description</div>
                <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#f8fafc', marginTop: '4px' }}>{viewComplaint.category}</div>
                <p style={{ fontSize: '0.875rem', color: '#cbd5e1', marginTop: '6px' }}>{viewComplaint.description}</p>
              </div>

              <div style={{ background: '#0f172a', padding: '1rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Assigned Maintenance Staff</div>
                {viewComplaint.staff_name ? (
                  <div style={{ marginTop: '6px' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#38bdf8' }}>{viewComplaint.staff_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{viewComplaint.staff_department} ({viewComplaint.staff_code})</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Phone: {viewComplaint.staff_phone || 'N/A'}</div>
                  </div>
                ) : (
                  <div style={{ fontSize: '0.85rem', color: '#f59e0b', marginTop: '8px' }}>Waiting for Warden Staff Assignment</div>
                )}
              </div>
            </div>

            {/* Evidence Photos Grid */}
            {viewComplaint.photos && viewComplaint.photos.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  Evidence Photos
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
                  {viewComplaint.photos.map(p => (
                    <div key={p.id} style={{ borderRadius: '8px', overflow: 'hidden', border: '1px solid #334155', background: '#0f172a' }}>
                      <img src={p.photo_url} alt={p.photo_type} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                      <div style={{ padding: '6px 8px', fontSize: '0.7rem', fontWeight: '700', color: p.photo_type === 'BEFORE_REPAIR' ? '#fbbf24' : p.photo_type === 'AFTER_REPAIR' ? '#34d399' : '#60a5fa', textAlign: 'center', background: '#1e293b' }}>
                        {p.photo_type.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Timeline Component */}
            <ComplaintTimeline currentStatus={viewComplaint.status} history={viewComplaint.history} />

            {/* STUDENT VERIFICATION ACTION BAR */}
            {viewComplaint.status === 'RESOLVED' && (
              <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', borderRadius: '12px', padding: '1.25rem', marginTop: '1.5rem' }}>
                <h4 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#34d399', marginBottom: '6px' }}>
                  Resolution Verification Required
                </h4>
                <p style={{ fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '1rem' }}>
                  Staff marked this work as resolved. Please verify if the issue is solved to your satisfaction.
                </p>

                {!showFollowUpInput ? (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '220px' }}>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '4px' }}>Rating (1 - 5 Stars)</div>
                      <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star
                            key={s}
                            size={22}
                            onClick={() => setRating(s)}
                            color={s <= rating ? '#f59e0b' : '#475569'}
                            fill={s <= rating ? '#f59e0b' : 'none'}
                            style={{ cursor: 'pointer' }}
                          />
                        ))}
                      </div>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Optional rating feedback comment..."
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                      />
                      <button 
                        onClick={() => handleVerify('CONFIRM')} 
                        disabled={verifying}
                        className="btn btn-success"
                        style={{ marginTop: '8px', width: '100%' }}
                      >
                        <CheckCircle2 size={16} /> Confirm Resolution & Close
                      </button>
                    </div>

                    <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <p style={{ fontSize: '0.78rem', color: '#fb923c', marginBottom: '6px' }}>
                        Is the issue still persisting or making noise?
                      </p>
                      <button 
                        onClick={() => setShowFollowUpInput(true)} 
                        className="btn btn-warning"
                      >
                        <AlertCircle size={16} /> Need Help / Follow-up
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="form-group">
                      <label className="form-label" style={{ color: '#fb923c' }}>State the Follow-up / Remaining Problem</label>
                      <textarea
                        className="form-textarea"
                        rows={3}
                        placeholder="e.g. The fan was repaired but now it is making a loud screeching noise when turned on high..."
                        value={followUpReason}
                        onChange={e => setFollowUpReason(e.target.value)}
                        required
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button onClick={() => setShowFollowUpInput(false)} className="btn btn-secondary btn-sm">Cancel</button>
                      <button 
                        onClick={() => handleVerify('NEED_HELP')} 
                        disabled={verifying || !followUpReason}
                        className="btn btn-warning btn-sm"
                      >
                        Submit Follow-up Request
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* DIRECT STAFF ASSISTANCE MODAL */}
      <DirectHelpModal 
        isOpen={showDirectHelpModal} 
        onClose={() => setShowDirectHelpModal(false)} 
      />
    </div>
  );
};
