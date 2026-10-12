import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { StudentDashboard } from './pages/StudentDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { StaffDashboard } from './pages/StaffDashboard';

const MainApp = () => {
  const { user, loading } = useAuth();
  const [loginRole, setLoginRole] = useState(null); // 'STUDENT', 'WARDEN_ADMIN', 'MAINTENANCE_STAFF' or null
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', marginBottom: '8px' }}>
            HOSTELCARE
          </div>
          <div style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading application...</div>
        </div>
      </div>
    );
  }

  // Unauthenticated routing
  if (!user) {
    if (loginRole) {
      return <LoginPage initialRole={loginRole} onBackToLanding={() => setLoginRole(null)} />;
    }
    return <LandingPage onSelectLoginRole={setLoginRole} />;
  }

  // Handle selecting complaint from Notification center
  const handleSelectComplaint = (id) => {
    setSelectedComplaintId(id);
    setActiveTab('dashboard');
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isOpen={sidebarOpen} 
      />

      <div className="main-content">
        <Navbar 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onSelectComplaint={handleSelectComplaint}
        />

        {/* Role-aware main content view */}
        {user.role === 'STUDENT' && (
          <StudentDashboard 
            selectedComplaintId={selectedComplaintId}
            onClearSelectedComplaint={() => setSelectedComplaintId(null)}
          />
        )}

        {user.role === 'WARDEN_ADMIN' && (
          <AdminDashboard 
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedComplaintId={selectedComplaintId}
          />
        )}

        {user.role === 'MAINTENANCE_STAFF' && (
          <StaffDashboard 
            activeTab={activeTab}
            selectedComplaintId={selectedComplaintId}
          />
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
