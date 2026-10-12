import React from 'react';
import { LayoutDashboard, FileText, Users, BarChart3, Settings, Shield, PlusCircle, CheckSquare, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ activeTab, setActiveTab, isOpen }) => {
  const { user } = useAuth();

  if (!user) return null;

  const role = user.role;

  const renderNavItems = () => {
    if (role === 'STUDENT') {
      return (
        <>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> My Dashboard
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`sidebar-item ${activeTab === 'complaints' ? 'active' : ''}`}
          >
            <FileText size={18} /> My Complaints
          </button>
          <button
            onClick={() => setActiveTab('raise')}
            className={`sidebar-item ${activeTab === 'raise' ? 'active' : ''}`}
            style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#60a5fa', fontWeight: '700' }}
          >
            <PlusCircle size={18} /> Raise Complaint
          </button>
        </>
      );
    }

    if (role === 'MAINTENANCE_STAFF') {
      return (
        <>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> Staff Dashboard
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`sidebar-item ${activeTab === 'tasks' ? 'active' : ''}`}
          >
            <CheckSquare size={18} /> Assigned Tasks
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`sidebar-item ${activeTab === 'followups' ? 'active' : ''}`}
          >
            <Clock size={18} /> Follow-Up Inbox
          </button>
        </>
      );
    }

    if (role === 'WARDEN_ADMIN') {
      return (
        <>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <LayoutDashboard size={18} /> Overview Dashboard
          </button>
          <button
            onClick={() => setActiveTab('complaints')}
            className={`sidebar-item ${activeTab === 'complaints' ? 'active' : ''}`}
          >
            <FileText size={18} /> Complaint Management
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`sidebar-item ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users size={18} /> User Management
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`sidebar-item ${activeTab === 'analytics' ? 'active' : ''}`}
          >
            <BarChart3 size={18} /> Analytics & Insights
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`sidebar-item ${activeTab === 'reports' ? 'active' : ''}`}
          >
            <FileText size={18} /> Report Generator
          </button>
          <button
            onClick={() => setActiveTab('sla')}
            className={`sidebar-item ${activeTab === 'sla' ? 'active' : ''}`}
          >
            <Settings size={18} /> SLA Configurations
          </button>
        </>
      );
    }
  };

  return (
    <aside
      style={{
        width: isOpen ? '240px' : '0px',
        overflow: 'hidden',
        background: '#0f172a',
        borderRight: '1px solid #334155',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.25s ease',
        zIndex: 80
      }}
    >
      <div style={{ padding: '1.25rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        <style>{`
          .sidebar-item {
            display: flex;
            align-items: center;
            gap: 10px;
            width: 100%;
            padding: 0.7rem 0.9rem;
            border-radius: 8px;
            background: transparent;
            color: #94a3b8;
            font-size: 0.875rem;
            font-weight: 500;
            text-align: left;
            transition: all 0.15s ease;
          }
          .sidebar-item:hover {
            background: rgba(255, 255, 255, 0.05);
            color: #f8fafc;
          }
          .sidebar-item.active {
            background: rgba(59, 130, 246, 0.18);
            color: #60a5fa;
            font-weight: 600;
          }
        `}</style>
        {renderNavItems()}
      </div>

      <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid #334155', fontSize: '0.75rem', color: '#64748b' }}>
        <div>HOSTELCARE Platform</div>
        <div>Smart Hostel Maintenance</div>
      </div>
    </aside>
  );
};
