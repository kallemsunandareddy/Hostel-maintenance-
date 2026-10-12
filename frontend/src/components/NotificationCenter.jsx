import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, X, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const NotificationCenter = ({ isOpen, onClose, onSelectComplaint }) => {
  const { token, fetchNotificationsCount } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && token) {
      loadNotifications();
    }
  }, [isOpen, token]);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: 1 } : n));
      fetchNotificationsCount();
    } catch (e) {}
  };

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, is_read: 1 })));
      fetchNotificationsCount();
    } catch (e) {}
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-content" 
        onClick={e => e.stopPropagation()} 
        style={{ maxWidth: '480px', height: '600px', display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.1rem', fontWeight: '700' }}>
            <Bell size={20} color="#3b82f6" /> Notifications
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              onClick={markAllRead} 
              className="btn btn-secondary btn-sm"
              title="Mark all as read"
            >
              <CheckCheck size={14} /> Read All
            </button>
            <button 
              onClick={onClose} 
              style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 1rem' }}>
              <Bell size={40} style={{ opacity: 0.3, marginBottom: '8px' }} />
              <div>No notifications yet</div>
            </div>
          ) : (
            notifications.map(n => (
              <div 
                key={n.id}
                onClick={() => {
                  markRead(n.id);
                  if (n.complaint_id && onSelectComplaint) {
                    onSelectComplaint(n.complaint_id);
                    onClose();
                  }
                }}
                style={{
                  padding: '0.85rem 1rem',
                  borderRadius: '10px',
                  background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.08)',
                  border: `1px solid ${n.is_read ? '#1e293b' : 'rgba(59, 130, 246, 0.3)'}`,
                  marginBottom: '0.6rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {n.notification_type === 'EMERGENCY' ? (
                      <AlertCircle size={18} color="#ef4444" />
                    ) : n.notification_type === 'SUCCESS' ? (
                      <CheckCircle2 size={18} color="#10b981" />
                    ) : (
                      <Info size={18} color="#3b82f6" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.85rem', color: '#f8fafc', fontWeight: n.is_read ? '400' : '600' }}>
                      {n.message}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px' }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
