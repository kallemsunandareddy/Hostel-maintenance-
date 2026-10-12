import React, { useState } from 'react';
import { Bell, User, LogOut, Shield, Wrench, GraduationCap, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { NotificationCenter } from './NotificationCenter';

export const Navbar = ({ onToggleSidebar, onSelectComplaint }) => {
  const { user, logout, unreadNotifications } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);

  const getRoleBadge = () => {
    if (!user) return null;
    switch (user.role) {
      case 'WARDEN_ADMIN':
        return <span style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Shield size={12} /> Warden Admin</span>;
      case 'MAINTENANCE_STAFF':
        return <span style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><Wrench size={12} /> Staff</span>;
      case 'STUDENT':
        return <span style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px' }}><GraduationCap size={12} /> Student</span>;
      default:
        return null;
    }
  };

  return (
    <>
      <header
        style={{
          height: '64px',
          background: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          position: 'sticky',
          top: 0,
          zIndex: 90
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={onToggleSidebar}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Menu size={22} />
          </button>
          
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{ fontSize: '1.4rem', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HOSTELCARE
            </span>
            <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>v2.4</span>
          </div>
        </div>

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            {getRoleBadge()}

            {/* Notification Bell */}
            <button
              onClick={() => setShowNotifications(true)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid #334155',
                borderRadius: '8px',
                padding: '8px',
                color: '#f8fafc',
                position: 'relative',
                cursor: 'pointer'
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadNotifications > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-4px',
                    right: '-4px',
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {unreadNotifications}
                </span>
              )}
            </button>

            {/* User Profile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '8px', borderLeft: '1px solid #334155' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>{user.name}</div>
                <div style={{ fontSize: '0.725rem', color: '#94a3b8' }}>{user.email}</div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Logout"
                style={{ padding: '6px 10px' }}
              >
                <LogOut size={15} />
              </button>
            </div>
          </div>
        )}
      </header>

      <NotificationCenter
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
        onSelectComplaint={onSelectComplaint}
      />
    </>
  );
};
