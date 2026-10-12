import React from 'react';
import { Shield, Wrench, GraduationCap, ArrowRight, CheckCircle2, Clock, BarChart3, AlertOctagon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LandingPage = ({ onSelectLoginRole }) => {
  const { login } = useAuth();

  const handleQuickLogin = async (email, password) => {
    try {
      await login(email, password);
    } catch (err) {
      alert('Quick login failed: ' + err.message);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(ellipse at top, #1e293b 0%, #0f172a 100%)', color: '#f8fafc' }}>
      {/* Header */}
      <header style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Wrench size={20} color="#fff" />
          </div>
          <span style={{ fontSize: '1.5rem', fontWeight: '800', letterSpacing: '-0.03em', background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            HOSTELCARE
          </span>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => onSelectLoginRole('STUDENT')} 
            className="btn btn-secondary btn-sm"
          >
            <GraduationCap size={16} /> Student Portal
          </button>
          <button 
            onClick={() => onSelectLoginRole('WARDEN_ADMIN')} 
            className="btn btn-primary btn-sm"
          >
            <Shield size={16} /> Warden Admin
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{ maxWidth: '1000px', margin: '3rem auto 4rem', textAlign: 'center', padding: '0 1.5rem' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.3)', color: '#60a5fa', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '600', marginBottom: '1.5rem' }}>
          Smart Hostel Maintenance, Made Simple.
        </div>

        <h1 style={{ fontSize: '3.5rem', fontWeight: '800', lineHeight: 1.1, marginBottom: '1rem' }}>
          Report. Resolve. Relax.
        </h1>

        <p style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '750px', margin: '0 auto 2.5rem', lineHeight: 1.6 }}>
          A digital hostel complaint and maintenance platform that makes reporting, tracking, assigning, and resolving hostel problems simple, transparent, and SLA-tracked.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <button 
            onClick={() => onSelectLoginRole('STUDENT')} 
            className="btn btn-primary btn-lg"
            style={{ minWidth: '180px' }}
          >
            Student Login <ArrowRight size={18} />
          </button>
          <button 
            onClick={() => onSelectLoginRole('WARDEN_ADMIN')} 
            className="btn btn-secondary btn-lg"
            style={{ minWidth: '180px' }}
          >
            Admin / Warden Login
          </button>
          <button 
            onClick={() => onSelectLoginRole('MAINTENANCE_STAFF')} 
            className="btn btn-secondary btn-lg"
            style={{ minWidth: '180px' }}
          >
            Staff Login
          </button>
        </div>
      </section>

      {/* Quick Demo Credentials Panel */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <div className="card" style={{ background: 'rgba(30, 41, 59, 0.6)', backdropFilter: 'blur(10px)', border: '1px solid #334155' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>⚡ One-Click Instant Demo Login</h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Click any card below to log in directly as a pre-seeded demo user:</p>
          </div>

          <div className="grid-3">
            <div 
              className="card card-hover" 
              onClick={() => handleQuickLogin('student@hostelcare.demo', 'student123')}
              style={{ cursor: 'pointer', borderColor: 'rgba(59, 130, 246, 0.4)', background: 'rgba(15, 23, 42, 0.8)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', padding: '8px', borderRadius: '8px' }}>
                  <GraduationCap size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#f8fafc' }}>Student Demo</h4>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>student@hostelcare.demo</div>
                </div>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>Yash Sharma • Block A (Room A-204)</p>
              <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: '600', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Login as Student <ArrowRight size={14} />
              </div>
            </div>

            <div 
              className="card card-hover" 
              onClick={() => handleQuickLogin('admin@hostelcare.demo', 'admin123')}
              style={{ cursor: 'pointer', borderColor: 'rgba(239, 68, 68, 0.4)', background: 'rgba(15, 23, 42, 0.8)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#f87171', padding: '8px', borderRadius: '8px' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#f8fafc' }}>Warden Admin Demo</h4>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>admin@hostelcare.demo</div>
                </div>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>Chief Warden Management Portal</p>
              <div style={{ fontSize: '0.75rem', color: '#f87171', fontWeight: '600', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Login as Warden <ArrowRight size={14} />
              </div>
            </div>

            <div 
              className="card card-hover" 
              onClick={() => handleQuickLogin('staff@hostelcare.demo', 'staff123')}
              style={{ cursor: 'pointer', borderColor: 'rgba(6, 182, 212, 0.4)', background: 'rgba(15, 23, 42, 0.8)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <div style={{ background: 'rgba(6, 182, 212, 0.2)', color: '#38bdf8', padding: '8px', borderRadius: '8px' }}>
                  <Wrench size={20} />
                </div>
                <div>
                  <h4 style={{ fontSize: '1rem', color: '#f8fafc' }}>Maintenance Staff Demo</h4>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>staff@hostelcare.demo</div>
                </div>
              </div>
              <p style={{ fontSize: '0.825rem', color: '#cbd5e1' }}>Ravi Kumar • Plumbing Specialist</p>
              <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: '600', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                Login as Staff <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Demo Statistics Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 4rem', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#f8fafc' }}>Hostel Performance & Statistics</h2>
          <span style={{ fontSize: '0.8rem', color: '#64748b' }}>* Sample operational metrics</span>
        </div>

        <div className="grid-4">
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#3b82f6' }}>2,500+</div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>Complaints Managed</div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#10b981' }}>96%</div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>Resolution Rate</div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#f59e0b' }}>4.7 / 5</div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>Student Satisfaction</div>
          </div>

          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '2.2rem', fontWeight: '800', color: '#06b6d4' }}>35%</div>
            <div style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '4px' }}>Faster Resolution</div>
          </div>
        </div>
      </section>

      {/* Workflow Section */}
      <section style={{ maxWidth: '1100px', margin: '0 auto 5rem', padding: '0 1.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', color: '#f8fafc' }}>End-to-End Maintenance Workflow</h2>
          <p style={{ color: '#94a3b8', fontSize: '0.95rem' }}>Transparent complaint lifecycle from submission to verification</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', background: '#1e293b', padding: '2rem', borderRadius: '16px', border: '1px solid #334155' }}>
          {[
            { step: '01', title: 'Report', desc: 'Category, room & photo' },
            { step: '02', title: 'Assign', desc: 'Smart workload rule matching' },
            { step: '03', title: 'Repair', desc: 'Before & after evidence photos' },
            { step: '04', title: 'Verify', desc: 'Student confirms or requests help' },
            { step: '05', title: 'Resolve', desc: 'Rating, feedback & analytics' }
          ].map((s, idx) => (
            <React.Fragment key={s.step}>
              <div style={{ flex: 1, minWidth: '160px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.15)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '1.1rem', margin: '0 auto 10px', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
                  {s.step}
                </div>
                <div style={{ fontWeight: '700', fontSize: '1rem', color: '#f8fafc' }}>{s.title}</div>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '2px' }}>{s.desc}</div>
              </div>
              {idx < 4 && <ArrowRight size={20} color="#475569" style={{ display: 'none', minWidth: '20px' }} className="workflow-arrow" />}
            </React.Fragment>
          ))}
        </div>
      </section>
    </div>
  );
};
