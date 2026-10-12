import React, { useState, useEffect } from 'react';
import { MessageSquare, Phone, Send, X, CheckCircle2, Clock, Wrench, Info, HelpCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const DirectHelpModal = ({ isOpen, onClose }) => {
  const { user, token } = useAuth();
  const [activeTab, setActiveTab] = useState('new'); // 'new', 'directory', 'my_requests'
  const [staffList, setStaffList] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Form state
  const [department, setDepartment] = useState('Electrical');
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [roomNumber, setRoomNumber] = useState(user?.student?.room_number || 'A-204');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && token) {
      fetchDirectory();
      fetchMyRequests();
    }
  }, [isOpen, token]);

  const fetchDirectory = async () => {
    try {
      const res = await fetch('/api/users/staff', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setStaffList(await res.json());
      }
    } catch (e) {
      console.error('Failed to load staff directory:', e);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const res = await fetch('/api/direct-help', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setMyRequests(await res.json());
      }
    } catch (e) {
      console.error('Failed to load my help requests:', e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/direct-help', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          department,
          staff_id: selectedStaffId || null,
          subject,
          message,
          room_number: roomNumber
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit request');

      alert(data.message);
      setSubject('');
      setMessage('');
      setActiveTab('my_requests');
      fetchMyRequests();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HelpCircle size={22} color="#06b6d4" /> Direct Staff Assistance (No Complaint Escalation)
            </div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '2px' }}>
              Communicate directly with maintenance staff for operational guidance or minor queries without filing a formal complaint.
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        {/* Tab Selection */}
        <div style={{ display: 'flex', gap: '8px', background: '#0f172a', padding: '4px', borderRadius: '8px', marginBottom: '1.25rem', border: '1px solid #334155' }}>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: '700',
              background: activeTab === 'new' ? '#06b6d4' : 'transparent',
              color: activeTab === 'new' ? '#fff' : '#94a3b8'
            }}
          >
            💬 Send Direct Message
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('directory')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: '700',
              background: activeTab === 'directory' ? '#06b6d4' : 'transparent',
              color: activeTab === 'directory' ? '#fff' : '#94a3b8'
            }}
          >
            📞 Staff Phone Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('my_requests')}
            style={{
              flex: 1,
              padding: '8px',
              borderRadius: '6px',
              fontSize: '0.825rem',
              fontWeight: '700',
              background: activeTab === 'my_requests' ? '#06b6d4' : 'transparent',
              color: activeTab === 'my_requests' ? '#fff' : '#94a3b8'
            }}
          >
            📋 My Direct Queries ({myRequests.length})
          </button>
        </div>

        {/* TAB 1: SEND DIRECT MESSAGE */}
        {activeTab === 'new' && (
          <form onSubmit={handleSubmit}>
            <div style={{ background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.825rem', color: '#38bdf8', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Info size={18} />
              <span>
                Use this form if you made a minor mistake or need quick guidance on operating equipment. This does <strong>NOT</strong> raise a Warden SLA penalty complaint against the staff!
              </span>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Target Department</label>
                <select
                  className="form-select"
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                >
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Furniture">Furniture</option>
                  <option value="Wi-Fi / Internet">Wi-Fi / Internet</option>
                  <option value="AC / Fan">AC / Fan</option>
                  <option value="Room Maintenance">Room Maintenance</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Specific Staff Member (Optional)</label>
                <select
                  className="form-select"
                  value={selectedStaffId}
                  onChange={e => setSelectedStaffId(e.target.value)}
                >
                  <option value="">-- Any Available Staff in Dept --</option>
                  {staffList
                    .filter(s => s.department.toLowerCase().includes(department.toLowerCase()) || department === 'General')
                    .map(s => (
                      <option key={s.staff_id} value={s.staff_id}>
                        {s.name} ({s.specialization})
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Subject / Purpose</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Need help operating new AC remote switch..."
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  required
                />
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
              <label className="form-label">Message / Operational Clarification Request</label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Explain what guidance you need directly from the maintenance staff..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={submitting} className="btn btn-primary" style={{ background: 'linear-gradient(135deg, #06b6d4, #0284c7)' }}>
                <Send size={15} /> Send Direct Message to Staff
              </button>
            </div>
          </form>
        )}

        {/* TAB 2: STAFF PHONE DIRECTORY */}
        {activeTab === 'directory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '380px', overflowY: 'auto' }}>
            <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '4px' }}>
              Direct contact phone numbers of hostel maintenance staff:
            </div>
            {staffList.map(s => (
              <div
                key={s.staff_id}
                style={{
                  background: '#0f172a',
                  border: '1px solid #334155',
                  padding: '1rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ fontWeight: '700', fontSize: '1rem', color: '#38bdf8' }}>
                    {s.name} <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: '400' }}>({s.staff_code})</span>
                  </div>
                  <div style={{ fontSize: '0.825rem', color: '#f8fafc', marginTop: '2px' }}>
                    Dept: <strong>{s.department}</strong> • {s.specialization}
                  </div>
                </div>

                <a
                  href={`tel:${s.phone || '+919876544444'}`}
                  className="btn btn-secondary btn-sm"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#10b981', border: '1px solid #10b981' }}
                >
                  <Phone size={14} /> {s.phone || '+91 98765 44444'}
                </a>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: MY DIRECT QUERIES & REPLIES */}
        {activeTab === 'my_requests' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '380px', overflowY: 'auto' }}>
            {myRequests.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem' }}>
                No direct help requests sent yet.
              </div>
            ) : (
              myRequests.map(r => (
                <div
                  key={r.id}
                  style={{
                    background: '#0f172a',
                    border: '1px solid #334155',
                    padding: '1rem',
                    borderRadius: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <div style={{ fontWeight: '700', fontSize: '0.95rem', color: '#f8fafc' }}>
                      {r.subject}
                    </div>
                    <span className={`badge ${r.status === 'ANSWERED' ? 'badge-resolved' : 'badge-pending'}`}>
                      {r.status}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.825rem', color: '#94a3b8', marginBottom: '6px' }}>
                    Dept: {r.department} • Room {r.room_number} • Sent: {new Date(r.created_at).toLocaleString()}
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', background: '#1e293b', padding: '8px 10px', borderRadius: '6px', marginBottom: '8px' }}>
                    "{r.message}"
                  </p>

                  {r.staff_reply ? (
                    <div style={{ background: 'rgba(16, 185, 129, 0.12)', border: '1px solid #10b981', padding: '8px 10px', borderRadius: '6px' }}>
                      <div style={{ fontSize: '0.78rem', color: '#34d399', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <CheckCircle2 size={13} /> Reply from Staff ({r.staff_name || 'Maintenance Staff'}):
                      </div>
                      <p style={{ fontSize: '0.85rem', color: '#f8fafc', marginTop: '2px' }}>
                        "{r.staff_reply}"
                      </p>
                    </div>
                  ) : (
                    <div style={{ fontSize: '0.78rem', color: '#f59e0b', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Clock size={13} /> Waiting for staff response or call back...
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};
