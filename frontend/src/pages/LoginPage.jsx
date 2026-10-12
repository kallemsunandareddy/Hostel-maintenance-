import React, { useState } from 'react';
import { Shield, Wrench, GraduationCap, ArrowLeft, Lock, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = ({ initialRole, onBackToLanding }) => {
  const { login } = useAuth();
  const [role, setRole] = useState(initialRole || 'STUDENT');
  const [email, setEmail] = useState(
    initialRole === 'WARDEN_ADMIN'
      ? 'admin@hostelcare.demo'
      : initialRole === 'MAINTENANCE_STAFF'
      ? 'staff@hostelcare.demo'
      : 'student@hostelcare.demo'
  );
  const [password, setPassword] = useState(
    initialRole === 'WARDEN_ADMIN'
      ? 'admin123'
      : initialRole === 'MAINTENANCE_STAFF'
      ? 'staff123'
      : 'student123'
  );
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRoleSelect = (r) => {
    setRole(r);
    setError('');
    if (r === 'WARDEN_ADMIN') {
      setEmail('admin@hostelcare.demo');
      setPassword('admin123');
    } else if (r === 'MAINTENANCE_STAFF') {
      setEmail('staff@hostelcare.demo');
      setPassword('staff123');
    } else {
      setEmail('student@hostelcare.demo');
      setPassword('student123');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div style={{ maxWidth: '440px', width: '100%' }}>
        <button
          onClick={onBackToLanding}
          style={{ background: 'transparent', border: 'none', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', marginBottom: '1.5rem', fontSize: '0.9rem' }}
        >
          <ArrowLeft size={16} /> Back to Landing Page
        </button>

        <div className="card" style={{ padding: '2rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.6rem', fontWeight: '800', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              HOSTELCARE
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: '4px' }}>
              Select portal & enter credentials
            </p>
          </div>

          {/* Role selector tabs */}
          <div style={{ display: 'flex', background: '#0f172a', padding: '4px', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #334155' }}>
            <button
              type="button"
              onClick={() => handleRoleSelect('STUDENT')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', background: role === 'STUDENT' ? '#3b82f6' : 'transparent', color: role === 'STUDENT' ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <GraduationCap size={14} /> Student
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('WARDEN_ADMIN')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', background: role === 'WARDEN_ADMIN' ? '#ef4444' : 'transparent', color: role === 'WARDEN_ADMIN' ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Shield size={14} /> Warden
            </button>
            <button
              type="button"
              onClick={() => handleRoleSelect('MAINTENANCE_STAFF')}
              style={{ flex: 1, padding: '8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600', background: role === 'MAINTENANCE_STAFF' ? '#06b6d4' : 'transparent', color: role === 'MAINTENANCE_STAFF' ? '#fff' : '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
            >
              <Wrench size={14} /> Staff
            </button>
          </div>

          {error && (
            <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#f87171', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="email"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                <input
                  type="password"
                  className="form-input"
                  style={{ paddingLeft: '38px' }}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '0.5rem', padding: '0.8rem' }}
            >
              {submitting ? 'Authenticating...' : `Login as ${role.replace('_', ' ')}`}
            </button>
          </form>

          <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155', fontSize: '0.78rem', color: '#64748b', textAlign: 'center' }}>
            🔒 Public signup disabled. Student & Staff accounts are managed by Hostel Warden Admin.
          </div>
        </div>
      </div>
    </div>
  );
};
