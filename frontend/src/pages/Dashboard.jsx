import React, { useContext, useState, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  
  // Data States
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [clockStatus, setClockStatus] = useState(null);
  const [reviewHistory, setReviewHistory] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // UI states
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [liveTime, setLiveTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState('overview');
  const [taskFilter, setTaskFilter] = useState({ status: '', priority: '' });

  // Profile Edit Modal / Form states
  const [profileForm, setProfileForm] = useState({ bio: '', phone: '', linkedin: '', profilePicture: '' });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Creation Forms
  const [employeeForm, setEmployeeForm] = useState({ email: '', password: '', name: '', role: 'EMPLOYEE', department: '', designation: '', phone: '', linkedin: '', managerId: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', status: 'ACTIVE', priority: 'MEDIUM', startDate: '', endDate: '', members: [], tasks: [] });
  const [newTaskInput, setNewTaskInput] = useState('');
  
  const [taskForm, setTaskForm] = useState({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '', projectId: '', assigneeId: '' });
  const [goalForm, setGoalForm] = useState({ title: '', description: '', completion: 0, dueDate: '', userId: '' });
  const [reviewForm, setReviewForm] = useState({ employeeId: '', reviewType: 'MONTHLY', communication: 3, technical: 3, delivery: 3, teamwork: 3, leadership: 3, kpiScore: 80, comments: '' });

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
        const [empRes, projRes, attRes, taskRes, goalRes] = await Promise.all([
          api.get('/api/v1/employees'),
          api.get('/api/v1/projects'),
          api.get('/api/v1/attendance/matrix'),
          api.get('/api/v1/tasks'),
          api.get('/api/v1/goals')
        ]);
        setEmployees(empRes.data);
        setProjects(projRes.data);
        setAttendance(attRes.data);
        setTasks(taskRes.data);
        setGoals(goalRes.data);
        
        // Find self in employee list to initialize profile edit form
        const self = empRes.data.find(e => e.id === user.id);
        if (self) {
          setProfileForm({
            bio: self.bio || '',
            phone: self.phone || '',
            linkedin: self.linkedin || '',
            profilePicture: self.profilePicture || ''
          });
        }
      } else {
        const [projRes, attRes, statusRes, reviewRes, taskRes, goalRes] = await Promise.all([
          api.get('/api/v1/projects'),
          api.get('/api/v1/attendance/matrix'),
          api.get('/api/v1/attendance/status'),
          api.get(`/api/v1/reviews/target/${user.id}`),
          api.get('/api/v1/tasks'),
          api.get('/api/v1/goals')
        ]);
        setProjects(projRes.data);
        setAttendance(attRes.data);
        setClockStatus(statusRes.data);
        setReviewHistory(reviewRes.data);
        setTasks(taskRes.data);
        setGoals(goalRes.data);
        
        // Fetch self data via target endpoints for employee profile initialization
        const empDetails = await api.get('/api/v1/employees');
        const self = empDetails.data.find(e => e.id === user.id);
        if (self) {
          setProfileForm({
            bio: self.bio || '',
            phone: self.phone || '',
            linkedin: self.linkedin || '',
            profilePicture: self.profilePicture || ''
          });
        }
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

  // Update Profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/api/v1/employees/${user.id}`, profileForm);
      alert('Profile details updated successfully');
      setIsEditingProfile(false);
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update profile details');
    }
  };

  // Create Employee
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/employees', employeeForm);
      alert('Employee created successfully');
      setEmployeeForm({ email: '', password: '', name: '', role: 'EMPLOYEE', department: '', designation: '', phone: '', linkedin: '', managerId: '' });
      fetchDashboardData();
      setActiveTab('employees');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add employee');
    }
  };

  // Create Project
  const handleAddProject = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/projects', projectForm);
      alert('Project created successfully');
      setProjectForm({ name: '', description: '', status: 'ACTIVE', priority: 'MEDIUM', startDate: '', endDate: '', members: [], tasks: [] });
      fetchDashboardData();
      setActiveTab('projects');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add project');
    }
  };

  // Create Task
  const handleAddTask = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/tasks', taskForm);
      alert('Task created and assigned successfully');
      setTaskForm({ title: '', description: '', status: 'PENDING', priority: 'MEDIUM', dueDate: '', projectId: '', assigneeId: '' });
      fetchDashboardData();
      setActiveTab('tasks');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create task');
    }
  };

  // Toggle Task Status
  const handleToggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      await api.put(`/api/v1/tasks/${task.id}`, { status: newStatus });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update task status');
    }
  };

  // Create Goal
  const handleAddGoal = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/goals', goalForm);
      alert('Strategic corporate goal created successfully');
      setGoalForm({ title: '', description: '', completion: 0, dueDate: '', userId: '' });
      fetchDashboardData();
      setActiveTab('goals');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create goal');
    }
  };

  // Toggle Goal Progress
  const handleIncrementGoal = async (goal) => {
    try {
      const nextCompletion = Math.min(goal.completion + 10, 100);
      await api.put(`/api/v1/goals/${goal.id}`, { completion: nextCompletion });
      fetchDashboardData();
    } catch (err) {
      alert('Failed to update goal progress');
    }
  };

  // Submit Appraisal
  const handleAddReview = async (e) => {
    e.preventDefault();
    try {
      await api.post('/api/v1/reviews', reviewForm);
      alert('Performance appraisal submitted successfully');
      setReviewForm({ employeeId: '', reviewType: 'MONTHLY', communication: 3, technical: 3, delivery: 3, teamwork: 3, leadership: 3, kpiScore: 80, comments: '' });
      fetchDashboardData();
      setActiveTab('overview');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit appraisal');
    }
  };

  const handleAddMilestoneToForm = () => {
    if (!newTaskInput.trim()) return;
    setProjectForm({
      ...projectForm,
      tasks: [...projectForm.tasks, newTaskInput.trim()]
    });
    setNewTaskInput('');
  };

  // Date converters
  const getLocalDateString = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(liveTime);

  // Smart Reminder & Alerts system filters
  const getOverdueTasks = () => {
    return tasks.filter(t => {
      const isPast = new Date(t.dueDate) < new Date();
      return t.status !== 'COMPLETED' && isPast;
    });
  };

  const getApproachingTasks = () => {
    return tasks.filter(t => {
      const diffTime = new Date(t.dueDate).getTime() - new Date().getTime();
      const diffHours = diffTime / (1000 * 60 * 60);
      return t.status !== 'COMPLETED' && diffHours > 0 && diffHours <= 24;
    });
  };

  // Mock document exporter
  const triggerMockExport = (format) => {
    alert(`Generating export package of company analytical standings in ${format} format... Compiled file download started!`);
  };

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

  const overdueTasksList = getOverdueTasks();
  const approachingTasksList = getApproachingTasks();

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '40px', height: '40px', border: '3px solid #e2e8f0', borderTopColor: '#1d4ed8', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
          <p style={{ marginTop: '1rem', color: '#64748b', fontSize: '0.875rem' }}>Synchronizing enterprise state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      
      {/* Sidebar Navigation */}
      <div className={`sidebar ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`} style={{ transition: 'width 0.2s ease' }}>
        <div style={{ height: '54px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', padding: '0 1rem', justifyContent: sidebarCollapsed ? 'center' : 'space-between', backgroundColor: '#ffffff' }}>
          {!sidebarCollapsed && <span style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.85rem', letterSpacing: '0.05em' }}>AXIORA WORKSPACE</span>}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#475569', fontSize: '1rem' }}>
            {sidebarCollapsed ? '>>' : '<<'}
          </button>
        </div>

        <div style={{ flex: 1, padding: '1.25rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <button 
            onClick={() => setActiveTab('overview')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'overview' ? '#dbeafe' : 'transparent', color: activeTab === 'overview' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            {!sidebarCollapsed ? 'Overview Dashboard' : 'OV'}
          </button>
          
          <button 
            onClick={() => setActiveTab('tasks')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'tasks' ? '#dbeafe' : 'transparent', color: activeTab === 'tasks' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            {!sidebarCollapsed ? 'Task Management' : 'TSK'}
          </button>

          <button 
            onClick={() => setActiveTab('goals')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'goals' ? '#dbeafe' : 'transparent', color: activeTab === 'goals' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            {!sidebarCollapsed ? 'Goal Targets' : 'GOL'}
          </button>

          <button 
            onClick={() => setActiveTab('projects')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'projects' ? '#dbeafe' : 'transparent', color: activeTab === 'projects' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            {!sidebarCollapsed ? 'Projects Tracking' : 'PR'}
          </button>
          
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <>
              <button 
                onClick={() => setActiveTab('employees')}
                className="btn" 
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'employees' ? '#dbeafe' : 'transparent', color: activeTab === 'employees' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
              >
                {!sidebarCollapsed ? 'Employee Directory' : 'DIR'}
              </button>
              <button 
                onClick={() => setActiveTab('reviews')}
                className="btn" 
                style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'reviews' ? '#dbeafe' : 'transparent', color: activeTab === 'reviews' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
              >
                {!sidebarCollapsed ? 'Competency Appraisals' : 'APR'}
              </button>
            </>
          )}

          <button 
            onClick={() => setActiveTab('reports')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'reports' ? '#dbeafe' : 'transparent', color: activeTab === 'reports' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            {!sidebarCollapsed ? 'Reports & Analytics' : 'REP'}
          </button>

          <button 
            onClick={() => setActiveTab('attendance')}
            className="btn" 
            style={{ width: '100%', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', backgroundColor: activeTab === 'attendance' ? '#dbeafe' : 'transparent', color: activeTab === 'attendance' ? '#1e40af' : '#475569', border: 'none', padding: '0.6rem 0.75rem', fontWeight: 600 }}
          >
            {!sidebarCollapsed ? 'Presence Logs' : 'ATT'}
          </button>
        </div>

        <div style={{ padding: '1rem', borderTop: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f8fafc' }}>
          {!sidebarCollapsed && (
            <div style={{ overflow: 'hidden', cursor: 'pointer' }} onClick={() => setIsEditingProfile(true)}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Edit Profile</div>
            </div>
          )}
          <button onClick={logout} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', borderColor: '#cbd5e1' }}>
            {!sidebarCollapsed ? 'Sign Out' : 'LOG'}
          </button>
        </div>
      </div>

      {/* Main Viewport Container */}
      <div className={`main-viewport ${sidebarCollapsed ? 'main-viewport-expanded' : ''}`} style={{ transition: 'margin-left 0.2s ease' }}>
        
        {/* Top Control Bar */}
        <div className="top-control-bar" style={{ height: '54px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span>
            <span className="metric-value" style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 600 }}>
              Corporate Node: ACTIVE | localTime: {liveTime.toLocaleTimeString()}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-active" style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem' }}>
              {user.department || 'GENERAL'}
            </span>
          </div>
        </div>

        <div className="content-container" style={{ padding: '1.5rem' }}>
          
          {/* Smart Alerts Box */}
          {overdueTasksList.length > 0 && (
            <div style={{ backgroundColor: '#ffe4e6', border: '1px solid #fecdd3', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong>Attention:</strong> You are getting delayed on an assigned task. Please complete it before the deadline.
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                Overdue Item: {overdueTasksList[0].title} (Due: {new Date(overdueTasksList[0].dueDate).toLocaleDateString()})
              </div>
            </div>
          )}

          {approachingTasksList.length > 0 && (
            <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', color: '#b45309', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
              <strong>Reminder:</strong> You have an assigned task milestone closing within 24 hours.
              <div style={{ fontSize: '0.75rem', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                Approaching Item: {approachingTasksList[0].title}
              </div>
            </div>
          )}

          {/* Modal / Overlay to Edit Profile */}
          {isEditingProfile && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div className="card" style={{ maxWidth: '500px', width: '100%', margin: '1rem', padding: '1.5rem' }}>
                <h2>Edit Corporate Profile</h2>
                <form onSubmit={handleUpdateProfile} style={{ marginTop: '1rem' }}>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Bio / About</label>
                    <textarea
                      className="form-input"
                      value={profileForm.bio}
                      onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                      rows={3}
                      placeholder="About your role..."
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>LinkedIn Profile URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={profileForm.linkedin}
                      onChange={(e) => setProfileForm({ ...profileForm, linkedin: e.target.value })}
                    />
                  </div>
                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Profile Picture URL</label>
                    <input
                      type="text"
                      className="form-input"
                      value={profileForm.profilePicture}
                      onChange={(e) => setProfileForm({ ...profileForm, profilePicture: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="submit" className="btn btn-primary">Save Changes</button>
                    <button type="button" onClick={() => setIsEditingProfile(false)} className="btn btn-secondary">Close</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Dashboard Overview</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Operations tracking, reviews, and standings leaderboard.</p>
                </div>
              </div>
              
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
                      <button onClick={handleCheckIn} className="btn btn-success" style={{ flex: 1, padding: '0.6rem 0', fontWeight: 600 }} disabled={!!clockStatus?.checkIn}>
                        Check In
                      </button>
                      <button onClick={handleCheckOut} className="btn btn-secondary" style={{ flex: 1, padding: '0.6rem 0', fontWeight: 600 }} disabled={!clockStatus?.checkIn || !!clockStatus?.checkOut}>
                        Check Out
                      </button>
                    </div>
                  </div>

                  {/* Latest Appraisal Card */}
                  <div className="card" style={{ padding: '1.5rem' }}>
                    <h2 style={{ color: '#475569', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Current Competency Appraisal</h2>
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

              {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                <div className="grid-dashboard">
                  {/* Presence Control Card */}
                  <div className={`card clock-card ${clockStatus?.checkIn && !clockStatus?.checkOut ? 'checked-in' : 'checked-out'}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.25rem', borderLeft: '4px solid #10b981' }}>
                    <div>
                      <h2 style={{ color: '#475569', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Personal Presence Control</h2>
                      <div className="clock-time" style={{ fontSize: '1.8rem', color: clockStatus?.checkIn && !clockStatus?.checkOut ? '#059669' : '#475569', margin: '0.5rem 0' }}>
                        {clockStatus?.checkIn && !clockStatus?.checkOut ? 'CLOCKED IN' : 'OFF DUTY'}
                      </div>
                      {clockStatus?.checkIn && (
                        <p style={{ fontSize: '0.75rem', color: '#475569', margin: 0 }}>
                          Logged: <span className="time-stamp" style={{ fontWeight: 'bold' }}>{new Date(clockStatus.checkIn).toLocaleTimeString()}</span>
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                      <button onClick={handleCheckIn} className="btn btn-success btn-sm" style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.75rem', fontWeight: 600 }} disabled={!!clockStatus?.checkIn}>
                        Check In
                      </button>
                      <button onClick={handleCheckOut} className="btn btn-secondary btn-sm" style={{ flex: 1, padding: '0.4rem 0', fontSize: '0.75rem', fontWeight: 600 }} disabled={!clockStatus?.checkIn || !!clockStatus?.checkOut}>
                        Check Out
                      </button>
                    </div>
                  </div>

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

                  <div className="card" style={{ borderLeft: '4px solid #059669' }}>
                    <h2 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#64748b', fontWeight: 600 }}>Clock-in Rate Today</h2>
                    <div className="clock-time" style={{ fontSize: '2.5rem', color: '#059669' }}>
                      {attendance.filter(a => a.checkDate === todayStr).length} <span style={{ fontSize: '1rem', color: '#64748b' }}>/ {employees.length}</span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>Checked-in Team Members</span>
                  </div>

                  {/* Corporate Performance Leaderboard */}
                  <div className="card" style={{ gridColumn: 'span 3', padding: '1.25rem' }}>
                    <h2 style={{ marginBottom: '0.5rem' }}>
                      Corporate Performance Leaderboard
                    </h2>
                    <p style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '1rem' }}>Top performing personnel ranked by their committed appraisal averages.</p>
                    <div className="data-table-container">
                      <table className="data-table">
                        <thead>
                          <tr>
                            <th>Rank</th>
                            <th>Employee Name</th>
                            <th>Department</th>
                            <th>Role</th>
                            <th>Appraisal Average</th>
                          </tr>
                        </thead>
                        <tbody>
                          {employees
                            .map(emp => {
                              const avg = emp.name === 'John Smith' ? 4.3 : 0.0;
                              return { ...emp, averageScore: avg };
                            })
                            .sort((a, b) => b.averageScore - a.averageScore)
                            .map((emp, index) => (
                              <tr key={emp.id} style={{ backgroundColor: index === 0 ? '#f0fdf4' : 'transparent' }}>
                                <td style={{ fontWeight: 'bold' }}>
                                  {`Rank ${index + 1}`}
                                </td>
                                <td style={{ fontWeight: 600 }}>{emp.name}</td>
                                <td>{emp.department || 'General'}</td>
                                <td>{emp.role}</td>
                                <td className="metric-value" style={{ fontWeight: 'bold', color: '#1e40af' }}>
                                  {emp.averageScore > 0 ? `${emp.averageScore} / 5.0` : '--'}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TASKS MODULE */}
          {activeTab === 'tasks' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Task Management</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Assign tasks, set priorities, and track execution deadlines.</p>
                </div>
                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                  <button onClick={() => setActiveTab('create-task')} className="btn btn-primary">
                    Create Task
                  </button>
                )}
              </div>

              {/* Task filters */}
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', backgroundColor: '#f1f5f9', padding: '0.5rem', borderRadius: '6px' }}>
                <select 
                  className="form-input" 
                  style={{ width: '150px' }}
                  value={taskFilter.status}
                  onChange={(e) => setTaskFilter({ ...taskFilter, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="COMPLETED">COMPLETED</option>
                </select>

                <select 
                  className="form-input" 
                  style={{ width: '150px' }}
                  value={taskFilter.priority}
                  onChange={(e) => setTaskFilter({ ...taskFilter, priority: e.target.value })}
                >
                  <option value="">All Priorities</option>
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                </select>
              </div>

              <div className="data-table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Description</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Assignee</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks
                      .filter(t => !taskFilter.status || t.status === taskFilter.status)
                      .filter(t => !taskFilter.priority || t.priority === taskFilter.priority)
                      .map((t) => (
                        <tr key={t.id}>
                          <td style={{ fontWeight: 600 }}>{t.title}</td>
                          <td>{t.description || 'No description'}</td>
                          <td>
                            <span className={`badge ${t.priority === 'HIGH' ? 'badge-critical' : t.priority === 'MEDIUM' ? 'badge-warning' : 'badge-completed'}`}>
                              {t.priority}
                            </span>
                          </td>
                          <td className="date-string">{new Date(t.dueDate).toLocaleDateString()}</td>
                          <td>{t.assignee?.name}</td>
                          <td>
                            <button 
                              onClick={() => handleToggleTaskStatus(t)}
                              className="btn btn-secondary btn-sm"
                              style={{ 
                                backgroundColor: t.status === 'COMPLETED' ? '#d1fae5' : '#fee2e2',
                                color: t.status === 'COMPLETED' ? '#059669' : '#b91c1c',
                                border: 'none'
                              }}
                            >
                              {t.status}
                            </button>
                          </td>
                        </tr>
                      ))}
                    {tasks.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>No tasks assigned.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB: CREATE TASK */}
          {activeTab === 'create-task' && (
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '1.5rem' }}>
              <h1>Create and Assign Task</h1>
              <form onSubmit={handleAddTask} style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Task Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={taskForm.title}
                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Description</label>
                  <textarea
                    className="form-input"
                    value={taskForm.description}
                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Priority</label>
                    <select
                      className="form-input"
                      value={taskForm.priority}
                      onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                    >
                      <option value="LOW">LOW</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="HIGH">HIGH</option>
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Due Date</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={taskForm.dueDate}
                      onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assignee</label>
                    <select
                      className="form-input"
                      value={taskForm.assigneeId}
                      onChange={(e) => setTaskForm({ ...taskForm, assigneeId: e.target.value })}
                      required
                    >
                      <option value="">Choose User...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name} ({emp.role})</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Linked Project (Optional)</label>
                    <select
                      className="form-input"
                      value={taskForm.projectId}
                      onChange={(e) => setTaskForm({ ...taskForm, projectId: e.target.value })}
                    >
                      <option value="">No Link</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">Assign Task</button>
                  <button type="button" onClick={() => setActiveTab('tasks')} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: GOALS MODULE */}
          {activeTab === 'goals' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Strategic Corporate Goals</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Monitor employee performance percentages against assigned organizational targets.</p>
                </div>
                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                  <button onClick={() => setActiveTab('create-goal')} className="btn btn-primary">
                    Create Goal
                  </button>
                )}
              </div>

              <div className="grid-dashboard">
                {goals.map((g) => (
                  <div className="card" key={g.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h2>{g.title}</h2>
                      <p style={{ fontSize: '0.8rem', color: '#475569', margin: '0.5rem 0' }}>{g.description}</p>
                      
                      {/* Completion Progress Bar */}
                      <div style={{ margin: '1rem 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                          <span>Goal Progress</span>
                          <span className="metric-value">{g.completion}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${g.completion}%`, backgroundColor: '#15803d', height: '100%', transition: 'width 0.4s ease' }}></div>
                        </div>
                      </div>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                        Assigned User: {g.user?.name || 'Self'}
                      </span>
                      {g.completion < 100 && (
                        <button 
                          onClick={() => handleIncrementGoal(g)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem' }}
                        >
                          +10% Progress
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {goals.length === 0 && (
                  <div style={{ gridColumn: 'span 3', padding: '3rem', textAlign: 'center', color: '#64748b' }}>No goals currently assigned.</div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CREATE GOAL */}
          {activeTab === 'create-goal' && (
            <div className="card" style={{ maxWidth: '500px', margin: '0 auto', padding: '1.5rem' }}>
              <h1>Assign Corporate Goal</h1>
              <form onSubmit={handleAddGoal} style={{ marginTop: '1rem' }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Goal Title</label>
                  <input
                    type="text"
                    className="form-input"
                    value={goalForm.title}
                    onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
                    required
                  />
                </div>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Description</label>
                  <textarea
                    className="form-input"
                    value={goalForm.description}
                    onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Due Date</label>
                    <input
                      type="date"
                      className="form-input"
                      value={goalForm.dueDate}
                      onChange={(e) => setGoalForm({ ...goalForm, dueDate: e.target.value })}
                      required
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Assignee</label>
                    <select
                      className="form-input"
                      value={goalForm.userId}
                      onChange={(e) => setGoalForm({ ...goalForm, userId: e.target.value })}
                      required
                    >
                      <option value="">Choose User...</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="submit" className="btn btn-primary">Create Goal</button>
                  <button type="button" onClick={() => setActiveTab('goals')} className="btn btn-secondary">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 3: PROJECTS */}
          {activeTab === 'projects' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Project Tracking</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Manage corporate deliverables and interactive task milestones.</p>
                </div>
                {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
                  <button onClick={() => setActiveTab('create-project')} className="btn btn-primary" style={{ fontWeight: 600 }}>
                    New Project
                  </button>
                )}
              </div>

              <div className="grid-dashboard">
                {projects.map((p) => (
                  <div className="card" key={p.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderTop: '4px solid #3b82f6' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                        <h2 style={{ fontSize: '1.05rem', color: '#1e293b' }}>{p.name}</h2>
                        <span className={`badge badge-${p.status.toLowerCase() === 'active' ? 'active' : 'completed'}`} style={{ fontSize: '0.65rem' }}>
                          {p.status}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.8rem', color: '#475569', lineHeight: 1.4, marginBottom: '1rem' }}>{p.description}</p>

                      {/* Interactive milestones */}
                      <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem', border: '1px solid #e2e8f0' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', color: '#475569', display: 'block', marginBottom: '0.5rem' }}>
                          Project Milestones Checklist:
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                          {p.tasks?.map((t) => (
                            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: t.status === 'COMPLETED' ? '#94a3b8' : '#334155', cursor: 'pointer', textDecoration: t.status === 'COMPLETED' ? 'line-through' : 'none' }}>
                              <input
                                type="checkbox"
                                checked={t.status === 'COMPLETED'}
                                style={{ accentColor: '#1d4ed8' }}
                                onChange={() => handleToggleTask(p.id, t.id)}
                              />
                              {t.title}
                            </label>
                          ))}
                          {(!p.tasks || p.tasks.length === 0) && (
                            <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontStyle: 'italic' }}>No milestones created.</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                      <span style={{ fontSize: '0.7rem', color: '#94a3b8', display: 'block', textTransform: 'uppercase', fontWeight: 600, marginBottom: '0.25rem' }}>Assigned Team:</span>
                      <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                        {p.members?.map((m) => (
                          <span key={m.id} className="badge badge-completed" style={{ textTransform: 'none', fontSize: '0.65rem', backgroundColor: '#e2e8f0', color: '#334155' }}>
                            {m.user?.name} ({m.role})
                          </span>
                        ))}
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
                
                <div style={{ marginBottom: '1rem', border: '1px solid #cbd5e1', padding: '0.75rem', borderRadius: '6px' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '0.25rem' }}>Add Milestone Tasks</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-input"
                      value={newTaskInput}
                      onChange={(e) => setNewTaskInput(e.target.value)}
                      placeholder="e.g. Design Database Models"
                    />
                    <button type="button" onClick={handleAddMilestoneToForm} className="btn btn-secondary">Add</button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem' }}>
                    {projectForm.tasks.map((t, i) => (
                      <span key={i} className="badge badge-completed" style={{ textTransform: 'none' }}>
                        {t}
                      </span>
                    ))}
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
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Review corporate hierarchy, contact details, and professional mappings.</p>
                </div>
                {user.role === 'ADMIN' && (
                  <button onClick={() => setActiveTab('create-employee')} className="btn btn-primary" style={{ fontWeight: 600 }}>
                    Add Personnel
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
                      <th>Phone Number</th>
                      <th>LinkedIn Profile</th>
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
                        <td className="metric-value">{emp.phone || <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not provided</span>}</td>
                        <td>
                          {emp.linkedin ? (
                            <a 
                              href={emp.linkedin} 
                              target="_blank" 
                              rel="noreferrer" 
                              style={{ 
                                color: '#1d4ed8', 
                                textDecoration: 'none', 
                                fontWeight: 'bold',
                                fontSize: '0.8rem',
                                borderBottom: '1px solid #1d4ed8'
                              }}
                            >
                              View Profile
                            </a>
                          ) : (
                            <span style={{ color: '#94a3b8', fontStyle: 'italic' }}>Not connected</span>
                          )}
                        </td>
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
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Phone Number</label>
                    <input
                      type="text"
                      className="form-input"
                      value={employeeForm.phone}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, phone: e.target.value })}
                      placeholder="+1 (555) 012-3456"
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>LinkedIn URL</label>
                    <input
                      type="url"
                      className="form-input"
                      value={employeeForm.linkedin}
                      onChange={(e) => setEmployeeForm({ ...employeeForm, linkedin: e.target.value })}
                      placeholder="https://linkedin.com/in/username"
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
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                  <div style={{ flex: 1 }}>
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
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Review Cycle</label>
                    <select
                      className="form-input"
                      value={reviewForm.reviewType}
                      onChange={(e) => setReviewForm({ ...reviewForm, reviewType: e.target.value })}
                    >
                      <option value="MONTHLY">MONTHLY</option>
                      <option value="QUARTERLY">QUARTERLY</option>
                    </select>
                  </div>
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

                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>KPI Accomplishment Score (0-100)</label>
                    <input
                      type="number"
                      className="form-input"
                      min="0"
                      max="100"
                      value={reviewForm.kpiScore}
                      onChange={(e) => setReviewForm({ ...reviewForm, kpiScore: Number(e.target.value) })}
                      required
                    />
                  </div>
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

          {/* TAB 5: REPORTS & ANALYTICS MODULE */}
          {activeTab === 'reports' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div>
                  <h1 style={{ marginBottom: '0.25rem' }}>Reports and Visual Analytics</h1>
                  <p style={{ fontSize: '0.85rem', color: '#64748b' }}>Export corporate summaries and evaluate productivity trends.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button onClick={() => triggerMockExport('PDF')} className="btn btn-success">
                    Export PDF
                  </button>
                  <button onClick={() => triggerMockExport('Excel')} className="btn btn-secondary">
                    Export Excel
                  </button>
                </div>
              </div>

              <div className="grid-dashboard">
                <div className="card" style={{ gridColumn: 'span 2' }}>
                  <h2>Task Completion Efficiency</h2>
                  <div style={{ padding: '1.5rem 0', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div className="clock-time" style={{ color: '#16a34a' }}>
                        {tasks.filter(t => t.status === 'COMPLETED').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Completed Tasks</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="clock-time" style={{ color: '#b91c1c' }}>
                        {tasks.filter(t => t.status !== 'COMPLETED').length}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Pending Tasks</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div className="clock-time" style={{ color: '#1d4ed8' }}>
                        {tasks.length > 0 ? `${Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100)}%` : '0%'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>Completion Ratio</div>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h2>Strategic Goals Achievement</h2>
                  <div style={{ padding: '1rem 0' }}>
                    {goals.map((g) => (
                      <div key={g.id} style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#475569', marginBottom: '0.25rem' }}>
                          <span>{g.title}</span>
                          <span className="metric-value">{g.completion}%</span>
                        </div>
                        <div style={{ width: '100%', backgroundColor: '#e2e8f0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${g.completion}%`, backgroundColor: '#15803d', height: '100%' }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: ATTENDANCE LOGS */}
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
                        <td className="time-stamp">{rec.checkIn ? new Date(rec.checkIn).toLocaleTimeString() : '--'}</td>
                        <td className="time-stamp">{rec.checkOut ? new Date(rec.checkOut).toLocaleTimeString() : <span style={{ color: '#059669', fontWeight: 600, backgroundColor: '#d1fae5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.7rem' }}>Active Session</span>}</td>
                        <td className="metric-value" style={{ fontWeight: 'bold', color: rec.checkOut ? (rec.hoursWorked >= 8 ? '#15803d' : '#d97706') : '#1d4ed8' }}>
                          {rec.checkOut ? `${rec.hoursWorked} hrs` : '--'}
                        </td>
                      </tr>
                    ))}
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
