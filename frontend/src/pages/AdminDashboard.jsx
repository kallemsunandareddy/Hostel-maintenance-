import React, { useState, useEffect } from 'react';
import { 
  Shield, Users, FileText, BarChart3, Settings, Search, Filter, PlusCircle, 
  AlertOctagon, CheckCircle2, Clock, AlertTriangle, Eye, UserPlus, Download, 
  Wrench, Check, RefreshCw, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { SLABadge } from '../components/SLABadge';
import { ComplaintTimeline } from '../components/ComplaintTimeline';

export const AdminDashboard = ({ activeTab = 'dashboard', setActiveTab, selectedComplaintId }) => {
  const { token } = useAuth();

  // Stats & Lists State
  const [analytics, setAnalytics] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [students, setStudents] = useState([]);
  const [staffMembers, setStaffMembers] = useState([]);
  const [slaConfigs, setSlaConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterBlock, setFilterBlock] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Complaint for Modal / Assignment / Review / Dispute
  const [viewComplaint, setViewComplaint] = useState(null);
  const [recommendedStaff, setRecommendedStaff] = useState([]);
  const [selectedStaffToAssign, setSelectedStaffToAssign] = useState('');

  // Modals
  const [showCreateStudentModal, setShowCreateStudentModal] = useState(false);
  const [showCreateStaffModal, setShowCreateStaffModal] = useState(false);

  // Create Student Form
  const [studentForm, setStudentForm] = useState({
    name: '', email: '', password: 'student123', phone: '', roll_number: '', hostel_block: 'Block A', room_number: ''
  });

  // Create Staff Form
  const [staffForm, setStaffForm] = useState({
    name: '', email: '', password: 'staff123', phone: '', department: 'Plumbing', specialization: 'Pipe Repair'
  });

  // Edit Priority/Category State
  const [editCategory, setEditCategory] = useState('');
  const [editPriority, setEditPriority] = useState('');
  const [reviewRemarks, setReviewRemarks] = useState('');

  // Dispute state
  const [disputeDecision, setDisputeDecision] = useState('FORCE_CLOSE');
  const [disputeRemarks, setDisputeRemarks] = useState('');

  useEffect(() => {
    loadAllData();
  }, [activeTab, filterStatus, filterCategory, filterPriority, filterBlock, searchQuery]);

  useEffect(() => {
    if (selectedComplaintId) {
      openComplaintModal(selectedComplaintId);
    }
  }, [selectedComplaintId]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Analytics
      const analyticsRes = await fetch('/api/analytics', { headers: { Authorization: `Bearer ${token}` } });
      if (analyticsRes.ok) setAnalytics(await analyticsRes.json());

      // 2. Fetch Complaints
      let url = '/api/complaints?';
      if (filterStatus) url += `status=${filterStatus}&`;
      if (filterCategory) url += `category=${encodeURIComponent(filterCategory)}&`;
      if (filterPriority) url += `priority=${filterPriority}&`;
      if (filterBlock) url += `hostel_block=${encodeURIComponent(filterBlock)}&`;
      if (searchQuery) url += `search=${encodeURIComponent(searchQuery)}`;

      const complaintsRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      if (complaintsRes.ok) setComplaints(await complaintsRes.json());

      // 3. Fetch Staff Members
      const staffRes = await fetch('/api/users/staff', { headers: { Authorization: `Bearer ${token}` } });
      if (staffRes.ok) setStaffMembers(await staffRes.json());

      // 4. Fetch Students if in users tab
      if (activeTab === 'users') {
        const stuRes = await fetch('/api/users/students', { headers: { Authorization: `Bearer ${token}` } });
        if (stuRes.ok) setStudents(await stuRes.json());
      }

      // 5. Fetch SLA Configs
      if (activeTab === 'sla') {
        const slaRes = await fetch('/api/sla/config', { headers: { Authorization: `Bearer ${token}` } });
        if (slaRes.ok) setSlaConfigs(await slaRes.json());
      }
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const openComplaintModal = async (id) => {
    try {
      const res = await fetch(`/api/complaints/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setViewComplaint(data);
        setEditCategory(data.category);
        setEditPriority(data.priority);
        setSelectedStaffToAssign(data.assigned_staff_id || '');

        // Rule-Based Staff Recommendation
        // Map category keywords to department
        const categoryDept = data.category.includes('Plumbing') ? 'Plumbing'
          : data.category.includes('Electrical') || data.category.includes('Lights') ? 'Electrical'
          : data.category.includes('Furniture') ? 'Furniture'
          : data.category.includes('Wi-Fi') ? 'Wi-Fi / Internet'
          : 'General';

        // Filter and sort staff by matching department & lowest active workload
        const staffRes = await fetch('/api/users/staff', { headers: { Authorization: `Bearer ${token}` } });
        if (staffRes.ok) {
          const allStaff = await staffRes.json();
          const filtered = allStaff
            .filter(s => s.department.toLowerCase().includes(categoryDept.toLowerCase()) || categoryDept === 'General')
            .sort((a, b) => a.current_workload - b.current_workload);

          setRecommendedStaff(filtered.length > 0 ? filtered : allStaff);
        }
      }
    } catch (e) {
      console.error('Error opening detail:', e);
    }
  };

  const handleAdminReviewUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/complaints/${viewComplaint.id}/admin-review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ category: editCategory, priority: editPriority, remarks: reviewRemarks })
      });
      if (res.ok) {
        alert('Complaint review & SLA updated!');
        openComplaintModal(viewComplaint.id);
        loadAllData();
      }
    } catch (e) {
      alert('Failed to update review');
    }
  };

  const handleAssignStaff = async () => {
    if (!selectedStaffToAssign) return alert('Select a staff member first');
    try {
      const res = await fetch(`/api/complaints/${viewComplaint.id}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ staff_id: selectedStaffToAssign })
      });
      if (res.ok) {
        alert('Staff assigned successfully!');
        openComplaintModal(viewComplaint.id);
        loadAllData();
      }
    } catch (e) {
      alert('Failed to assign staff');
    }
  };

  const handleResolveDispute = async () => {
    try {
      const res = await fetch(`/api/complaints/${viewComplaint.id}/resolve-dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          decision: disputeDecision,
          remarks: disputeRemarks,
          reassign_staff_id: disputeDecision === 'REASSIGN' ? selectedStaffToAssign : null
        })
      });
      if (res.ok) {
        alert('Dispute resolved by Warden!');
        openComplaintModal(viewComplaint.id);
        loadAllData();
      }
    } catch (e) {
      alert('Failed to resolve dispute');
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(studentForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create student');

      alert(data.message);
      setShowCreateStudentModal(false);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateStaff = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/users/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(staffForm)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create maintenance staff');

      alert(data.message);
      setShowCreateStaffModal(false);
      loadAllData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateSLAConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/sla/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ configs: slaConfigs })
      });
      if (res.ok) {
        alert('SLA configurations saved successfully!');
      }
    } catch (e) {
      alert('Failed to update SLA config');
    }
  };

  const downloadCSVReport = () => {
    window.open(`/api/reports/export-csv?token=${token}`, '_blank');
  };

  const summary = analytics?.summary || {};

  return (
    <div className="page-body">
      {/* Header Banner */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.75rem' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: '800' }}>
            Warden Control Center
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>
            Hostel Complaint & Maintenance Management Dashboard
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setShowCreateStudentModal(true)} className="btn btn-secondary btn-sm">
            <UserPlus size={15} /> Add Student Account
          </button>
          <button onClick={() => setShowCreateStaffModal(true)} className="btn btn-primary btn-sm">
            <Wrench size={15} /> Add Staff Account
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: '#94a3b8', fontSize: '0.85rem', fontWeight: '600' }}>Total Complaints</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f8fafc', marginTop: '4px' }}>{summary.total || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertOctagon size={14} /> Emergency Pending
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ef4444', marginTop: '4px' }}>{summary.emergency || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: '#f87171', fontSize: '0.85rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <AlertTriangle size={14} /> SLA Breached
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#f87171', marginTop: '4px' }}>{summary.overdue || 0}</div>
        </div>
        <div className="card">
          <div style={{ color: '#fb923c', fontSize: '0.85rem', fontWeight: '600' }}>Follow-Up Requests</div>
          <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#fb923c', marginTop: '4px' }}>{summary.followups || 0}</div>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div style={{ display: 'flex', borderBottom: '1px solid #334155', marginBottom: '1.5rem', gap: '1rem', overflowX: 'auto' }}>
        {[
          { id: 'dashboard', label: 'Overview Complaints', icon: FileText },
          { id: 'users', label: 'User Directory', icon: Users },
          { id: 'analytics', label: 'Analytics & Insights', icon: BarChart3 },
          { id: 'reports', label: 'Reports & Export', icon: Download },
          { id: 'sla', label: 'SLA Settings', icon: Settings }
        ].map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '0.75rem 1rem',
                border: 'none',
                borderBottom: `2px solid ${active ? '#3b82f6' : 'transparent'}`,
                background: 'transparent',
                color: active ? '#60a5fa' : '#94a3b8',
                fontWeight: active ? '700' : '500',
                fontSize: '0.9rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              <Icon size={16} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* TAB 1: COMPLAINTS MANAGEMENT */}
      {activeTab === 'dashboard' && (
        <div>
          {/* Filters Bar */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1, minWidth: '220px', position: 'relative' }}>
              <Search size={16} color="#64748b" style={{ position: 'absolute', left: '12px', top: '12px' }} />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '38px' }}
                placeholder="Search complaint ID, room, or description..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <select className="form-select" style={{ width: '160px' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="FOLLOW_UP_REQUESTED">Follow-Up</option>
            </select>

            <select className="form-select" style={{ width: '160px' }} value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="EMERGENCY">Emergency</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>

            <select className="form-select" style={{ width: '160px' }} value={filterBlock} onChange={e => setFilterBlock(e.target.value)}>
              <option value="">All Blocks</option>
              <option value="Block A">Block A</option>
              <option value="Block B">Block B</option>
              <option value="Block C">Block C</option>
            </select>
          </div>

          {/* Complaints Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ID & Date</th>
                    <th>Student & Room</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Assigned Staff</th>
                    <th>SLA Countdown</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                        No complaints match your filters
                      </td>
                    </tr>
                  ) : (
                    complaints.map(c => (
                      <tr key={c.id}>
                        <td>
                          <div style={{ fontWeight: '800', color: '#3b82f6' }}>{c.complaint_code}</div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{new Date(c.created_at).toLocaleDateString()}</div>
                        </td>
                        <td>
                          <div style={{ fontWeight: '600', color: '#f8fafc' }}>{c.student_name}</div>
                          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{c.hostel_block} • Room {c.room_number}</div>
                        </td>
                        <td>{c.category}</td>
                        <td><PriorityBadge priority={c.priority} /></td>
                        <td><StatusBadge status={c.status} /></td>
                        <td>
                          {c.staff_name ? (
                            <span style={{ fontSize: '0.85rem', color: '#38bdf8', fontWeight: '600' }}>{c.staff_name}</span>
                          ) : (
                            <span style={{ fontSize: '0.8rem', color: '#f59e0b', fontStyle: 'italic' }}>Unassigned</span>
                          )}
                        </td>
                        <td><SLABadge deadline={c.sla_deadline} status={c.status} /></td>
                        <td>
                          <button onClick={() => openComplaintModal(c.id)} className="btn btn-secondary btn-sm">
                            <Eye size={14} /> Review / Assign
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: USER MANAGEMENT */}
      {activeTab === 'users' && (
        <div className="grid-2">
          {/* Maintenance Staff List */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Maintenance Staff Directory</h3>
              <button onClick={() => setShowCreateStaffModal(true)} className="btn btn-primary btn-sm">
                <PlusCircle size={14} /> Add Staff
              </button>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staff Name</th>
                    <th>Dept & Specialization</th>
                    <th>Active Workload</th>
                  </tr>
                </thead>
                <tbody>
                  {staffMembers.map(st => (
                    <tr key={st.staff_id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#38bdf8' }}>{st.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{st.staff_code} • {st.email}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: '600', color: '#f8fafc' }}>{st.department}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{st.specialization}</div>
                      </td>
                      <td>
                        <span className={`badge ${st.current_workload === 0 ? 'badge-resolved' : 'badge-pending'}`}>
                          {st.current_workload} Active Tasks
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Students List */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.1rem', color: '#f8fafc' }}>Registered Students</h3>
              <button onClick={() => setShowCreateStudentModal(true)} className="btn btn-secondary btn-sm">
                <PlusCircle size={14} /> Add Student
              </button>
            </div>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Roll No</th>
                    <th>Hostel Room</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr key={s.student_id}>
                      <td>
                        <div style={{ fontWeight: '700', color: '#f8fafc' }}>{s.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{s.email}</div>
                      </td>
                      <td>{s.roll_number}</td>
                      <td>{s.hostel_block} • Room {s.room_number}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ANALYTICS & INSIGHTS */}
      {activeTab === 'analytics' && analytics && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="grid-2">
            {/* Category Distribution */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#f8fafc' }}>Complaint Category Breakdown</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics.categories.map(cat => (
                  <div key={cat.category}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ color: '#f8fafc', fontWeight: '600' }}>{cat.category}</span>
                      <span style={{ color: '#3b82f6', fontWeight: '700' }}>{cat.count} complaints</span>
                    </div>
                    <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (cat.count / (summary.total || 1)) * 100)}%`, background: '#3b82f6' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Block-wise Breakdown */}
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#f8fafc' }}>Hostel Block Frequency Analysis</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analytics.blocks.map(b => (
                  <div key={b.hostel_block}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                      <span style={{ color: '#f8fafc', fontWeight: '600' }}>{b.hostel_block}</span>
                      <span style={{ color: '#06b6d4', fontWeight: '700' }}>{b.count} complaints</span>
                    </div>
                    <div style={{ height: '8px', background: '#0f172a', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${Math.min(100, (b.count / (summary.total || 1)) * 100)}%`, background: '#06b6d4' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Staff Performance Leaderboard */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: '#f8fafc' }}>Maintenance Staff Performance Metrics</h3>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Department</th>
                    <th>Total Assigned</th>
                    <th>Closed Resolved</th>
                    <th>Follow-Up Requests</th>
                    <th>Student Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.staff_performance.map(s => (
                    <tr key={s.staff_id}>
                      <td style={{ fontWeight: '700', color: '#38bdf8' }}>{s.name}</td>
                      <td>{s.department}</td>
                      <td>{s.assigned_count}</td>
                      <td style={{ color: '#34d399', fontWeight: '700' }}>{s.resolved_count}</td>
                      <td style={{ color: s.followup_count > 0 ? '#fb923c' : '#94a3b8' }}>{s.followup_count}</td>
                      <td style={{ color: '#f59e0b', fontWeight: '700' }}>⭐ {s.avg_rating} / 5.0</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: REPORTS & EXPORT */}
      {activeTab === 'reports' && (
        <div className="card" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
          <Download size={48} color="#3b82f6" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.5rem', color: '#f8fafc' }}>Generate & Export Maintenance Reports</h2>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0.5rem auto 1.5rem' }}>
            Export comprehensive CSV logs containing complaint history, resolution timelines, staff assignments, SLA statuses, and student feedback.
          </p>

          <button onClick={downloadCSVReport} className="btn btn-primary btn-lg">
            <Download size={18} /> Export Full Complaint Report (.CSV)
          </button>
        </div>
      )}

      {/* TAB 5: SLA CONFIGURATION */}
      {activeTab === 'sla' && (
        <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#f8fafc' }}>Configure Service Level Agreements (SLA)</h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
            Set maximum resolution target hours for each complaint priority level.
          </p>

          <form onSubmit={handleUpdateSLAConfig}>
            {slaConfigs.map((cfg, idx) => (
              <div key={cfg.priority} className="form-group" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#0f172a', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                <PriorityBadge priority={cfg.priority} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-input"
                    style={{ width: '80px', textAlign: 'center' }}
                    value={cfg.resolution_hours}
                    onChange={e => {
                      const val = parseInt(e.target.value) || 1;
                      setSlaConfigs(prev => prev.map((item, i) => i === idx ? { ...item, resolution_hours: val } : item));
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>Hours</span>
                </div>
              </div>
            ))}

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}>
              Save SLA Settings
            </button>
          </form>
        </div>
      )}

      {/* CREATE STUDENT MODAL */}
      {showCreateStudentModal && (
        <div className="modal-overlay" onClick={() => setShowCreateStudentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Create Student Account</h3>
              <button onClick={() => setShowCreateStudentModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateStudent}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-input" value={studentForm.name} onChange={e => setStudentForm({ ...studentForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Roll Number / Student ID</label>
                  <input type="text" className="form-input" value={studentForm.roll_number} onChange={e => setStudentForm({ ...studentForm, roll_number: e.target.value })} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" value={studentForm.email} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input type="text" className="form-input" value={studentForm.password} onChange={e => setStudentForm({ ...studentForm, password: e.target.value })} required />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Hostel Block</label>
                  <select className="form-select" value={studentForm.hostel_block} onChange={e => setStudentForm({ ...studentForm, hostel_block: e.target.value })}>
                    <option value="Block A">Block A</option>
                    <option value="Block B">Block B</option>
                    <option value="Block C">Block C</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Room Number</label>
                  <input type="text" className="form-input" value={studentForm.room_number} onChange={e => setStudentForm({ ...studentForm, room_number: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateStudentModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Student</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE STAFF MODAL */}
      {showCreateStaffModal && (
        <div className="modal-overlay" onClick={() => setShowCreateStaffModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#f8fafc' }}>Create Maintenance Staff Account</h3>
              <button onClick={() => setShowCreateStaffModal(false)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <form onSubmit={handleCreateStaff}>
              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Staff Full Name</label>
                  <input type="text" className="form-input" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select className="form-select" value={staffForm.department} onChange={e => setStaffForm({ ...staffForm, department: e.target.value })}>
                    <option value="Plumbing">Plumbing</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Furniture">Furniture</option>
                    <option value="Wi-Fi / Internet">Wi-Fi / Internet</option>
                    <option value="Cleaning">Cleaning</option>
                    <option value="General Maintenance">General Maintenance</option>
                  </select>
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input type="email" className="form-input" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Temporary Password</label>
                  <input type="text" className="form-input" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Specialization / Expertise</label>
                <input type="text" className="form-input" placeholder="e.g. Water Leakage & High Voltage Switchboards" value={staffForm.specialization} onChange={e => setStaffForm({ ...staffForm, specialization: e.target.value })} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setShowCreateStaffModal(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" className="btn btn-primary">Create Maintenance Staff</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLAINT REVIEW & SMART RULE-BASED ASSIGNMENT DRAWER */}
      {viewComplaint && (
        <div className="modal-overlay" onClick={() => setViewComplaint(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '850px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #334155', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3b82f6' }}>{viewComplaint.complaint_code}</span>
                <span style={{ fontSize: '0.85rem', color: '#94a3b8', marginLeft: '10px' }}>{viewComplaint.student_name} ({viewComplaint.student_roll}) • {viewComplaint.hostel_block} Room {viewComplaint.room_number}</span>
              </div>
              <button onClick={() => setViewComplaint(null)} style={{ background: 'transparent', color: '#94a3b8', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '1.25rem', alignItems: 'center' }}>
              <StatusBadge status={viewComplaint.status} />
              <PriorityBadge priority={viewComplaint.priority} />
              <SLABadge deadline={viewComplaint.sla_deadline} status={viewComplaint.status} />
            </div>

            <div className="grid-2" style={{ marginBottom: '1.5rem' }}>
              {/* Category & Priority Warden Review Panel */}
              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#3b82f6', marginBottom: '10px' }}>1. Review Category & Modify Priority</h4>
                <form onSubmit={handleAdminReviewUpdate}>
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input type="text" className="form-input" value={editCategory} onChange={e => setEditCategory(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Warden Priority Level</label>
                    <select className="form-select" value={editPriority} onChange={e => setEditPriority(e.target.value)}>
                      <option value="LOW">LOW (48 Hours)</option>
                      <option value="MEDIUM">MEDIUM (24 Hours)</option>
                      <option value="HIGH">HIGH (8 Hours)</option>
                      <option value="EMERGENCY">EMERGENCY (2 Hours)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-secondary btn-sm" style={{ width: '100%' }}>Save Review</button>
                </form>
              </div>

              {/* SMART RULE-BASED STAFF ASSIGNMENT PANEL */}
              <div style={{ background: '#0f172a', padding: '1.25rem', borderRadius: '10px', border: '1px solid #334155' }}>
                <h4 style={{ fontSize: '0.9rem', color: '#06b6d4', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Wrench size={16} /> 2. Rule-Based Staff Assignment
                </h4>
                <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginBottom: '8px' }}>
                  Matches staff by department & ranks by lowest active task workload:
                </div>

                <div style={{ maxHeight: '160px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px' }}>
                  {recommendedStaff.map((st, idx) => (
                    <div
                      key={st.staff_id}
                      onClick={() => setSelectedStaffToAssign(st.staff_id)}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '6px',
                        border: `1px solid ${selectedStaffToAssign === st.staff_id ? '#3b82f6' : '#334155'}`,
                        background: selectedStaffToAssign === st.staff_id ? 'rgba(59, 130, 246, 0.15)' : '#1e293b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '700', color: '#f8fafc' }}>
                          {st.name} {idx === 0 && <span style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', fontSize: '0.7rem', padding: '2px 6px', borderRadius: '4px', marginLeft: '6px' }}>⭐ Recommended</span>}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{st.department} • {st.specialization}</div>
                      </div>
                      <span className="badge badge-pending">{st.current_workload} Active Tasks</span>
                    </div>
                  ))}
                </div>

                <button onClick={handleAssignStaff} className="btn btn-primary btn-sm" style={{ width: '100%' }}>
                  Assign Selected Staff
                </button>
              </div>
            </div>

            {/* Evidence & History */}
            {viewComplaint.photos && viewComplaint.photos.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '6px' }}>Uploaded Evidence Photos</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '8px' }}>
                  {viewComplaint.photos.map(p => (
                    <div key={p.id} style={{ borderRadius: '6px', overflow: 'hidden', border: '1px solid #334155' }}>
                      <img src={p.photo_url} alt={p.photo_type} style={{ width: '100%', height: '110px', objectFit: 'cover' }} />
                      <div style={{ padding: '4px', fontSize: '0.7rem', textAlign: 'center', background: '#0f172a', color: '#38bdf8' }}>{p.photo_type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Follow-up / Dispute Handling */}
            {viewComplaint.status === 'FOLLOW_UP_REQUESTED' && (
              <div style={{ background: 'rgba(249, 115, 22, 0.15)', border: '1px solid #f97316', borderRadius: '10px', padding: '1rem', marginTop: '1rem' }}>
                <h4 style={{ fontSize: '1rem', color: '#fb923c', fontWeight: '700' }}>⚠️ Active Follow-Up / Dispute Request</h4>
                {viewComplaint.followups && viewComplaint.followups[0] && (
                  <p style={{ fontSize: '0.85rem', color: '#f8fafc', margin: '6px 0' }}>
                    <strong>Student Reason:</strong> "{viewComplaint.followups[0].reason}"
                  </p>
                )}
                
                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <select className="form-select" style={{ width: '200px' }} value={disputeDecision} onChange={e => setDisputeDecision(e.target.value)}>
                    <option value="FORCE_CLOSE">Force Close Complaint</option>
                    <option value="REASSIGN">Reassign to New Staff</option>
                  </select>
                  <input type="text" className="form-input" placeholder="Warden decision remarks..." value={disputeRemarks} onChange={e => setDisputeRemarks(e.target.value)} />
                  <button onClick={handleResolveDispute} className="btn btn-warning btn-sm">Submit Decision</button>
                </div>
              </div>
            )}

            <ComplaintTimeline currentStatus={viewComplaint.status} history={viewComplaint.history} />
          </div>
        </div>
      )}
    </div>
  );
};
