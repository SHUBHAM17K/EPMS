import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  
  // States
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [clockStatus, setClockStatus] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());

  // Forms states
  const [employeeForm, setEmployeeForm] = useState({ email: '', password: '', name: '', role: 'EMPLOYEE', department: '', managerId: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'ACTIVE', priority: 'MEDIUM', startDate: '', endDate: '', members: [] });
  const [reviewForm, setReviewForm] = useState({ employeeId: '', communication: 3, technical: 3, delivery: 3, teamwork: 3, leadership: 3, comments: '' });
  
  // UI views
  const [activeTab, setActiveTab] = useState('overview');

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (user.role === 'ADMIN' || user.role === 'MANAGER') {
        const [empRes, projRes, attRes] = await Promise.all([
          api.get('/api/v1/employees'),
          api.get('/api/v1/projects'),
          api.get('/api/v1/attendance/matrix')
        ]);
        setEmployees(empRes.data);
        setProjects(projRes.data);
        setAttendance(attRes.data);
      } else {
        const [projRes, attRes, statusRes, reviewRes] = await Promise.all([
          api.get('/api/v1/projects'),
          api.get('/api/v1/attendance/matrix'),
          api.get('/api/v1/attendance/status'),
          api.get(`/api/v1/reviews/target/${user.id}`)
        ]);
        setProjects(projRes.data);
        setAttendance(attRes.data);
        setClockStatus(statusRes.data);
        setReviewHistory(reviewRes.data);
      }
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  // Clock Actions
  const handleCheckIn = async () => {
    try {
      const res = await api.post('/api/v1/attendance/check-in');
      setClockStatus(res.data);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      const res = await api.put('/api/v1/attendance/check-out');
      setClockStatus(res.data);
      fetchDashboardData();
    } catch (err) {
      alert(err.response?.data?.message || 'Check-out failed');
    }
  };

  // Submit Admin/Manager Forms
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/employees', employeeForm);
      alert('Employee created successfully');
      setEmployeeForm({ email: '', password: '', name: '', role: 'EMPLOYEE', department: '', managerId: '' });
      fetchDashboardData();
      setActiveTab('employees');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add employee');
    }
  };

  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/projects', projectForm);
      alert('Project created successfully');
      setProjectForm({ name: '', description: '', status: 'ACTIVE', priority: 'MEDIUM', startDate: '', endDate: '', members: [] });
      fetchDashboardData();
      setActiveTab('projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add project');
    }
  };

  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/reviews', reviewForm);
      alert('Competency review committed to persistence ledger');
      setReviewForm({ employeeId: '', communication: 3, technical: 3, delivery: 3, teamwork: 3, leadership: 3, comments: '' });
      fetchDashboardData();
      alert('Appraisal submitted successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review');
    }
  };

  // Helper to format local date string (YYYY-MM-DD)
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(liveTime);

  // Custom Chart Renderers (Pure React inline SVG for React 19 compatibility & robust visual layout)
  const renderRadarChart = (review) => {
    if (!review) return null;
    const scores = [
      { name: 'Comm', val: review.communication },
      { name: 'Tech', val: review.technical },
      { name: 'Deliv', val: review.delivery },
      { name: 'Team', val: review.teamwork },
      { name: 'Lead', val: review.leadership }
    ];

    const width = 220;
    const height = 200;
    const cx = width / 2;
    const cy = height / 2;
    const radius = 70;

    const getPointPath = (scoreList, scalar = 1) => {
      return scoreList.map((s, idx) => {
        const angle = (idx * 2 * Math.PI) / scoreList.length - Math.PI / 2;
        const dist = (s.val / 5) * radius * scalar;
        const x = cx + dist * Math.cos(angle);
        const y = cy + dist * Math.sin(angle);
        return `${x},${y}`;
      }).join(' ');
    };

    const bgWebs = [0.2, 0.4, 0.6, 0.8, 1].map((scale, i) => {
      const points = getPointPath(scores.map(s => ({ ...s, val: 5 })), scale);
      return <polygon key={i} points={points} fill="none" stroke="#cbd5e1" strokeWidth="0.5" strokeDasharray="2,2" />;
    });

    const activePoints = getPointPath(scores);

    return (
      <svg width={width} height={height} style={{ display: 'block', margin: '0.5rem auto' }}>
        {bgWebs}
        {scores.map((s, idx) => {
          const angle = (idx * 2 * Math.PI) / scores.length - Math.PI / 2;
          const x = cx + radius * Math.cos(angle);
          const y = cy + radius * Math.sin(angle);
          const lx = cx + (radius + 20) * Math.cos(angle);
          const ly = cy + (radius + 10) * Math.sin(angle);
          return (
            <g key={idx}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="#e2e8f0" strokeWidth="1" />
              <text x={lx} y={ly} textAnchor="middle" fontSize="10" fill="#475569" fontWeight="600">
                {s.name}
              </text>
            </g>
          );
        })}
        <polygon points={activePoints} fill="rgba(29, 78, 216, 0.15)" stroke="#1d4ed8" strokeWidth="2" />
      </svg>
    );
  };

  const renderTrendLineChart = (reviews) => {
    if (!reviews || reviews.length === 0) return <div style={{ fontSize: '0.8rem', color: '#64748b' }}>No appraisal history available yet.</div>;
    const width = 500;
    const height = 180;
    const padding = 35;

    const points = reviews.map((r, idx) => {
      const x = padding + (idx * (width - 2 * padding)) / Math.max(reviews.length - 1, 1);
      const y = height - padding - ((r.overallScore - 1) * (height - 2 * padding)) / 4;
      return { x, y, score: r.overallScore, date: new Date(r.createdAt).toLocaleDateString() };
    });

    const pathD = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
        {[1, 2, 3, 4, 5].map((level) => {
          const y = height - padding - ((level - 1) * (height - 2 * padding)) / 4;
          return (
            <g key={level}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#f1f5f9" strokeWidth="1" />
              <text x={padding - 10} y={y + 4} fontSize="9" fill="#94a3b8" textAnchor="end">{level}</text>
            </g>
          );
        })}
        {points.length > 1 && <path d={pathD} fill="none" stroke="#1d4ed8" strokeWidth="2.5" />}
        {points.map((p, idx) => (
          <g key={idx}>
            <circle cx={p.x} cy={p.y} r="4" fill="#15803d" stroke="#ffffff" strokeWidth="1.5" />
            <text x={p.x} y={p.y - 8} fontSize="9" fontWeight="bold" fill="#0f172a" textAnchor="middle" className="metric-value">
              {p.score}
            </text>
            <text x={p.x} y={height - 10} fontSize="8" fill="#64748b" textAnchor="middle" className="date-string">
              {p.date}
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ transition: 'width 0.2s ease' }}>
        <div style={{ height: '54px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: sidebarCollapsed ? 'center' : 'space-between', backgroundColor: '#1e3a8a' }}>
          {!sidebarCollapsed && <span style={{ fontWeight: 800, color: '#ffffff', fontSize: '0.9rem', letterSpacing: '0.05em' }}>EPMS WORKSPACE</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', fontSize: '1.1rem' }}>
            {sidebarCollapsed ? '➡️' : '⬅️'}
          </button>
        </div>

        <div style={{ flex: 1, padding: '1.25rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'overview' ? '#dbeafe' : 'transparent', color: activeTab === 'overview' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            📊 {!sidebarCollapsed && <span style={{ marginLeft: '0.5rem' }}>Overview Dashboard</span>}
          </button>
          <button 
            onClick={() => setActiveTab('projects')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'projects' ? '#dbeafe' : 'transparent', color: activeTab === 'projects' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            📂 {!sidebarCollapsed && <span style={{ marginLeft: '0.5rem' }}>Projects Tracking</span>}
          </button>
          
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <>
              <button 
                onClick={() => setActiveTab('employees')}
                className="btn" 
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'employees' ? '#dbeafe' : 'transparent', color: activeTab === 'employees' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
              >
                👥 {!sidebarCollapsed && <span style={{ marginLeft: '0.5rem' }}>Employee Directory</span>}
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className="btn" 
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'reviews' ? '#dbeafe' : 'transparent', color: activeTab === 'reviews' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
              >
                📝 {!sidebarCollapsed && <span style={{ marginLeft: '0.5rem' }}>Competency Appraisals</span>}
              </button>
            </>
          )}

          <button 
            onClick={() => setActiveTab('attendance')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'attendance' ? '#dbeafe' : 'transparent', color: activeTab === 'attendance' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            ⏱️ {!sidebarCollapsed && <span style={{ marginLeft: '0.5rem' }}>Presence Logs</span>}
          </button>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc' }}>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>{user.role}</div>
            </div>
          )}
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#cbd5e1' }}>
            🚪 {!sidebarCollapsed && 'Sign Out'}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className={`main-viewport ${sidebarCollapsed ? 'main-viewport-expanded' : ''}`} style={{ transition: 'margin-left 0.2s ease' }}>
        <div className="top-control-bar" style={{ height: '54px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span className="metric-value" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              Live Time: {liveTime.toLocaleTimeString()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-active" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
              {user.department || 'GENERAL'}
            </span>
          </div>
        </div>

        <div className="content-container" style={{ padding: '1.5rem' }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Performance Overview</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Real-time operations, evaluation tracking, and metrics center.</p>
                </div>
              </div>
              
              {/* Employee Dashboard Overview */}
              {user.role === 'EMPLOYEE' && (
                <div className="grid-dashboard">
                  {/* Attendance Card */}
                  <div className={`card clock-card ${clockStatus?.checkIn && !clockStatus?.checkOut ? 'checked-in' : 'checked-out'}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.5rem' }}>
                    <div>
                      <h2 style={{ color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Presence Control</h2>
                      <div className="clock-time" style={{ fontSize: '2.25rem', color: clockStatus?.checkIn && !clockStatus?.checkOut ? '#059669' : '#475569', margin: '0.5rem 0' }}>
                        {clockStatus?.checkIn && !clockStatus?.checkOut ? 'CLOCKED IN' : 'OFF DUTY'}
                      </div>
                      {clockStatus?.checkIn && (
                        <p style={{ fontSize: '0.8rem', color: '#475569' }}>
                          Clock-in recorded at: <span className="time-stamp" style={{ fontWeight: 'bold' }}>{new Date(clockStatus.checkIn).toLocaleTimeString()}</span>
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.5rem' }}>
                      <button 
                        onClick={handleCheckIn} 
                        className="btn btn-success" 
                        style={{ flex: 1, padding: '0.6rem 0', fontWeight: 600 }}
                        disabled={!!clockStatus?.checkIn}
                      >
                        ⏱️ Check In
                      </button>
                      <button 
                        onClick={handleCheckOut} 
                        className="btn btn-secondary" 
                        style={{ flex: 1, padding: '0.6rem 0', fontWeight: 600 }}
                        disabled={!clockStatus?.checkIn || !!clockStatus?.checkOut}
                      >
                        ⏱️ Check Out
                      </button>
                    </div>
                  </div>

                  {/* Latest Appraisal Card */}
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Competency appraisal</h2>
                    {reviewHistory.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className="clock-time" style={{ color: '#1d4ed8', fontSize: '2rem' }}>
                          {reviewHistory[reviewHistory.length - 1].overallScore} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ 5.0</span>
                        </div>
                        {renderRadarChart(reviewHistory[reviewHistory.length - 1])}
                        <p style={{ fontSize: '0.75rem', fontStyle: 'italic', color: '#475569', textAlign: 'center', marginTop: '0.25rem', borderTop: '1px dashed #cbd5e1', paddingTop: '0.5rem', width: '100%' }}>
                          "{reviewHistory[reviewHistory.length - 1].comments}"
                        </p>
                      </div>
                    ) : (
                      <div style={{ padding: '3rem 0', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>No evaluations recorded.</div>
                    )}
                  </div>
                  
                  {/* Historical Trend Line Graph */}
                  <div className="card" style={{ gridColumn: 'span 2', padding: '1.5rem' }}>
                    <h2 style={{ color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>Historical Performance Trajectory</h2>
                    <div style={{ marginTop: '1rem' }}>
                      {renderTrendLineChart(reviewHistory)}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin or Manager Overview */}
              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <div className="grid-dashboard">
                  <div className="card" style={{ borderLeft: '4px solid #1d4ed8' }}>
                    <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Active Personnel</h2>
                    <div className="clock-time" style={{ fontSize: '2.5rem', color: '#1e293b' }}>
                      {employees.length}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Active Corporate Profiles</span>
                  </div>

                  <div className="card" style={{ borderLeft: '4px solid #d97706' }}>
                    <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Active Projects</h2>
                    <div className="clock-time" style={{ fontSize: '2.5rem', color: '#d97706' }}>
                      {projects.filter(p => p.status === 'ACTIVE').length}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Allocated Portfolios</span>
                  </div>

                  {/* FIXED Clock In Rate Card */}
                  <div className="card" style={{ borderLeft: '4px solid #059669' }}>
                    <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Clock-in Rate Today</h2>
                    <div className="clock-time" style={{ fontSize: '2.5rem', color: '#059669' }}>
                      {attendance.filter(a => a.checkDate === todayStr).length} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {employees.length}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Checked-in Team Members</span>
                  </div>

                  <div className="card" style={{ gridColumn: 'span 3', padding: '1.25rem' }}>
                    <h2>Recent Operations Matrix</h2>
                    <div className="data-table-container" style={{ marginTop: '0.5rem' }}>
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Employee Name</th>
                            <th>Target Date</th>
                            <th>In Time</th>
                            <th>Out Time</th>
                            <th>Work Metric</th>
                          </tr>
                        </thead>
                        <tbody>
                          {attendance.slice(0, 8).map((a) => (
                            <tr key={a.id}>
                              <td style={{ fontWeight: 600 }}>{a.user?.name}</td>
                              <td className="date-string">{a.checkDate}</td>
                              <td className="time-stamp">{new Date(a.checkIn).toLocaleTimeString()}</td>
                              <td className="time-stamp">{a.checkOut ? new Date(a.checkOut).toLocaleTimeString() : '--:--'}</td>
                              <td className="metric-value" style={{ fontWeight: 'bold', color: a.hoursWorked >= 8 ? '#15803d' : '#d97706' }}>
                                {a.hoursWorked} hrs
                              </td>
                            </tr>
                          ))}
                          {attendance.length === 0 && (
                            <tr>
                              <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>No operations logged today.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROJECTS */}
          {activeTab === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Project Tracking</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage corporate deliverables and resource mappings.</p>
                </div>
                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                  <button onClick={() => setActiveTab('create-project')} className="btn btn-primary" style={{ fontWeight: 600 }}>
                    ➕ New Project
                  </button>
                )}
              </div>

              <div className="grid-dashboard">
                {projects.map((p) => (
                  <div className="card" key={p.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.05rem', color: '#1e293b' }}>{p.name}</h2>
                        <span className={`badge badge-${p.status.toLowerCase() === 'active' ? 'active' : 'completed'}`} style={{ fontSize: '0.65rem' }}>
                          {p.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4 }}>{p.description}</p>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', marginTop: '1rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Assigned Team:</span>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {p.members?.map((m) => (
                          <span key={m.id} className="badge badge-completed" style={{ textTransform: 'none', fontSize: '0.65rem', backgroundColor: '#e2e8f0', color: '#334155' }}>
                            {m.user?.name} ({m.role})
                          </span>
                        ))}
                        {p.members?.length === 0 && <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Unassigned</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: CREATE PROJECT */}
          {activeTab === 'create-project' && (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
              <h1>Create Project</h1>
              <form onSubmit={handleAddProject}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Project Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Description</label>
                  <textarea
                    className="form-input"
                    value={projectForm.description}
                    onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Status</label>
                    <select
                      className="form-input"
                      value={projectForm.status}
                      onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="ON_HOLD">ON_HOLD</option>
                      <option value="COMPLETED">COMPLETED</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Priority</label>
                    <select
                      className="form-input"
                      value={projectForm.priority}
                      onChange={(e) => setProjectForm({ ...projectForm, priority: e.target.value })}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>Start Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={projectForm.startDate}
                      onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569' }}>End Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={projectForm.endDate}
                      onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontWeight: 600 }}>Save Project</button>
                  <button type="button" onClick={() => setActiveTab('projects')} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: DIRECTORY */}
          {activeTab === 'employees' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Employee Directory</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Review corporate hierarchy and active employee accounts.</p>
                </div>
                {user.role === 'ADMIN' && (
                  <button onClick={() => setActiveTab('create-employee')} className="btn btn-primary" style={{ fontWeight: 600 }}>
                    ➕ Add Personnel
                  </button>
                )}
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Reporting Manager</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.map((emp) => (
                      <tr key={emp.id}>
                        <td style={{ fontWeight: 600 }}>{emp.name}</td>
                        <td className="metric-value">{emp.email}</td>
                        <td>
                          <span className={`badge ${emp.role === 'ADMIN' ? 'badge-critical' : emp.role === 'MANAGER' ? 'badge-warning' : 'badge-completed'}`}>
                            {emp.role}
                          </span>
                        </td>
                        <td>{emp.department || 'N/A'}</td>
                        <td>{emp.manager?.name || <span style={{ color: '#94a3b8' }}>--</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CREATE EMPLOYEE */}
          {activeTab === 'create-employee' && (
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '1.5rem' }}>
              <h1>Add New Personnel</h1>
              <form onSubmit={handleAddEmployee}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Full Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={employeeForm.name}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, name: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Corporate Email</label>
                  <input
                    type="email"
                    className="form-input"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, email: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Secure Password</label>
                  <input
                    type="password"
                    className="form-input"
                    value={employeeForm.password}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, password: e.target.value })}
                    required
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Role</label>
                    <select
                      className="form-input"
                      value={employeeForm.role}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, role: e.target.value })}
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="MANAGER">MANAGER</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Department</label>
                    <input
                      type="text"
                      className="form-input"
                      value={employeeForm.department}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                      placeholder="e.g., Engineering"
                    />
                  </div>
                </div>
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Reporting Manager</label>
                  <select
                    className="form-input"
                    value={employeeForm.managerId}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, managerId: e.target.value })}
                  >
                    <option value="">No Manager Assigned</option>
                    {employees.filter(emp => emp.role === 'MANAGER' || emp.role === 'ADMIN').map(mgr => (
                      <option key={mgr.id} value={mgr.id}>{mgr.name} ({mgr.role})</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1.25rem', fontWeight: 600 }}>Create User</button>
                  <button type="button" onClick={() => setActiveTab('employees')} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 4: APPRAISALS */}
          {activeTab === 'reviews' && (
            <div className="card" style={{ maxWidth: '600px', margin: '0 auto', padding: '1.5rem' }}>
              <h1>Competency Matrix Appraisal</h1>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '1.25rem' }}>Commit skill performance ratings directly to the database.</p>
              <form onSubmit={handleAddReview}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Select Employee</label>
                  <select
                    className="form-input"
                    value={reviewForm.employeeId}
                    onChange={(e) => setReviewForm({ ...reviewForm, employeeId: e.target.value })}
                    required
                  >
                    <option value="">Choose User...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.department || 'N/A'})</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
                  {['communication', 'technical', 'delivery', 'teamwork', 'leadership'].map((metric) => (
                    <div key={metric} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.85rem', textTransform: 'capitalize', fontWeight: 500 }}>{metric}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          style={{ accentColor: '#1d4ed8', width: '150px' }}
                          value={reviewForm[metric]}
                          onChange={(e) => setReviewForm({ ...reviewForm, [metric]: Number(e.target.value) })}
                        />
                        <span className="metric-value" style={{ fontWeight: 'bold', width: '20px' }}>{reviewForm[metric]}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Review Comments</label>
                  <textarea
                    className="form-input"
                    value={reviewForm.comments}
                    onChange={(e) => setReviewForm({ ...reviewForm, comments: e.target.value })}
                    rows={3}
                    placeholder="Provide professional feedback..."
                  />
                </div>

                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.6rem 0', fontWeight: 600 }}>
                  Commit Evaluation Matrix
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: ATTENDANCE LOGS */}
          {activeTab === 'attendance' && (
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h1>Attendance Tracking Matrix</h1>
                <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Review chronologically sorted daily presence and hours metrics.</p>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Employee Name</th>
                      <th>Target Date</th>
                      <th>Check-in Time</th>
                      <th>Check-out Time</th>
                      <th>Calculated Hours</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendance.map((rec) => (
                      <tr key={rec.id}>
                        <td style={{ fontWeight: 600 }}>{rec.user?.name || 'Self'}</td>
                        <td className="date-string">{rec.checkDate}</td>
                        <td className="time-stamp">{new Date(rec.checkIn).toLocaleTimeString()}</td>
                        <td className="time-stamp">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Active</span>}</td>
                        <td className="metric-value" style={{ fontWeight: 'bold', color: rec.hoursWorked >= 8 ? '#15803d' : '#d97706' }}>
                          {rec.hoursWorked} hrs
                        </td>
                      </tr>
                    ))}
                    {attendance.length === 0 && (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No presence logs found in the database.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Dashboard;
