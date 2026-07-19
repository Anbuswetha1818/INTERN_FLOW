/**
 * SIMS — Intern Self-Service Dashboard
 * Main intern dashboard shell with attendance widget, tasks, and AI features.
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Button, Chip, Table, TableHead, TableRow, TableCell, TableBody, Alert } from '@mui/material';
import { Schedule, Task, Assessment, SmartToy, People, HourglassEmpty, CheckCircle, Pending, CalendarToday } from '@mui/icons-material';
import { motion } from 'framer-motion';
import DashboardShell from '../../components/layout/DashboardShell';
import { StatCard, LoadingSpinner, StatusChip } from '../../components/common';
import { dashboardAPI, attendanceAPI, tasksAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

function InternDashContent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState(null);
  const [dueTodayTasks, setDueTodayTasks] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      dashboardAPI.general().catch(() => ({ data: {} })),
      tasksAPI.dueToday().catch(() => ({ data: [] })),
      attendanceAPI.myAttendance().catch(() => ({ data: [] })),
    ]).then(([dashRes, dueRes, attRes]) => {
      setTasks(dashRes.data);
      setDueTodayTasks(dueRes.data || []);
      // Check if already checked in today
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = attRes.data.find((r) => r.date === today);
      if (todayRecord?.check_in) setCheckedIn(true);
      setAttendance(attRes.data);
    }).finally(() => setLoading(false));
  }, []);

  const handleCheckIn = async () => {
    try {
      await attendanceAPI.checkIn();
      setCheckedIn(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Check-in failed');
    }
  };

  const handleCheckOut = async () => {
    try {
      await attendanceAPI.checkOut();
      setCheckedIn(false);
    } catch (err) {
      alert(err.response?.data?.error || 'Check-out failed');
    }
  };

  if (loading) return <LoadingSpinner />;

  // Calculate attendance rate
  const presentDays = (attendance || []).filter(r => r.status === 'present' || r.status === 'halfday').length;
  const totalDays = (attendance || []).length;
  const attPct = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="page-head">
        <div>
          <div className="page-title-row">
            <h1 className="page-title">Welcome, {user.fullName || user.username}!</h1>
            <span className="live-badge"><span className="live-dot"></span>Live</span>
          </div>
          <p className="page-sub">Your intern dashboard — here's what's happening today.</p>
        </div>
        <div className="date-pill"><CalendarToday />{dateStr}</div>
      </div>

      {/* Check-in Widget */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Box 
          sx={{ 
            p: 3, 
            mb: 3, 
            borderRadius: '18px', 
            border: '1px solid var(--border)', 
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between',
            boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ 
              p: 1.5, 
              borderRadius: '12px', 
              background: '#eff6ff', 
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Schedule sx={{ fontSize: 28 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} sx={{ color: 'var(--text-primary)' }}>Attendance Check-in</Typography>
              <Typography variant="body2" color="text.secondary">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            {!checkedIn ? (
              <Button 
                variant="contained" 
                onClick={handleCheckIn} 
                sx={{
                  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                  fontWeight: 700, 
                  px: 4,
                  py: 1,
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(34, 197, 94, 0.2)'
                }}
              >
                Check In
              </Button>
            ) : (
              <Button 
                variant="contained" 
                onClick={handleCheckOut} 
                color="error" 
                sx={{ 
                  fontWeight: 700, 
                  px: 4, 
                  py: 1,
                  borderRadius: '10px',
                  boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)'
                }}
              >
                Check Out
              </Button>
            )}
          </Box>
        </Box>
      </motion.div>

      {/* Hero Stats Grid */}
      <div className="hero-grid">
        <div className="hero-card purple" style={{ cursor: 'pointer' }} onClick={() => navigate('/intern-user/tasks')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Total Tasks</span>
            <div className="hero-icon"><Task /></div>
          </div>
          <div>
            <div className="hero-value mono">{tasks?.total_tasks || 0}</div>
            <div className="hero-foot">Completed: {tasks?.completed_tasks || 0}</div>
          </div>
        </div>
        <div className="hero-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/intern-user/tasks')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">In Progress</span>
            <div className="hero-icon"><HourglassEmpty /></div>
          </div>
          <div>
            <div className="hero-value mono">{tasks?.in_progress_tasks || 0}</div>
            <div className="hero-foot">Pending: {tasks?.pending_tasks || 0}</div>
          </div>
        </div>
        <div className="hero-card teal" style={{ cursor: 'pointer' }} onClick={() => navigate('/intern-user/attendance')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Attendance Rate</span>
            <div className="hero-icon"><CheckCircle /></div>
          </div>
          <div>
            <div className="hero-value mono">{attPct}%</div>
            <div className="hero-foot">{presentDays} of {totalDays} days present</div>
          </div>
        </div>
      </div>

      {/* Row 2: Tasks Due Today & Mentor Card */}
      <div className="panel-grid" style={{ marginBottom: '24px' }}>
        {/* Due Today Tasks */}
        <div className="panel" style={{ flex: 1.5 }}>
          <div className="panel-head">
            <h3 className="panel-title">Tasks Due Today</h3>
            <Chip label={`${dueTodayTasks.length} Due`} color={dueTodayTasks.length > 0 ? 'error' : 'default'} size="small" />
          </div>
          {dueTodayTasks.length === 0 ? (
            <Alert severity="success" icon={<CheckCircle />}>
              No tasks due today. Keep up the good work!
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell align="right">Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dueTodayTasks.map(t => (
                  <TableRow key={t.id} hover onClick={() => navigate('/intern-user/tasks')} style={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} fontSize="0.8rem">{t.title}</Typography>
                      <Typography variant="caption" color="text.secondary" fontSize="0.7rem">{t.project_name || 'Individual Task'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={t.priority} 
                        color={t.priority === 'high' ? 'error' : t.priority === 'medium' ? 'warning' : 'primary'} 
                        size="small" 
                        sx={{ fontSize: '0.7rem', height: 18, textTransform: 'capitalize' }} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Chip label={t.status} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 18, textTransform: 'capitalize' }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Mentor / Project Card */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head">
            <h3 className="panel-title">My Mentor & Project</h3>
          </div>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 1, justifyContent: 'center' }}>
            <Box>
              <Typography variant="caption" color="text.tertiary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Assigned Project</Typography>
              <Box sx={{ mt: 0.5, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {user?.projects_info && user.projects_info.length > 0 ? (
                  user.projects_info.map(p => (
                    <Chip key={p.id} label={p.name} size="small" color="primary" sx={{ fontWeight: 600, fontSize: '0.75rem' }} />
                  ))
                ) : (
                  <Chip label="No Active Project" size="small" variant="outlined" sx={{ fontSize: '0.75rem' }} />
                )}
              </Box>
            </Box>
            <Box>
              <Typography variant="caption" color="text.tertiary" fontWeight={600} sx={{ textTransform: 'uppercase', fontSize: '0.7rem' }}>Mentor Name</Typography>
              <Typography variant="body2" fontWeight={600} mt={0.25} sx={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>
                {user?.projects_info && user.projects_info.length > 0 && user.projects_info[0].team_lead__full_name
                  ? user.projects_info[0].team_lead__full_name
                  : 'Awaiting Assignment'}
              </Typography>
            </Box>
            {user?.projects_info && user.projects_info.length > 0 && user.projects_info[0].team_lead__user__email && (
              <Button 
                variant="outlined" 
                size="small" 
                fullWidth
                sx={{ borderRadius: '8px', mt: 1, fontSize: '0.75rem' }}
                onClick={() => window.location.href = `mailto:${user.projects_info[0].team_lead__user__email}`}
              >
                Contact Mentor
              </Button>
            )}
          </Box>
        </div>
      </div>

      {/* Row 3: Quick Navigation Modules */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-head" style={{ marginBottom: '16px' }}>
          <h3 className="panel-title">Quick Access Tools</h3>
        </div>
        <Grid container spacing={2.5}>
          {[
            { icon: <SmartToy sx={{ fontSize: 32 }} />, title: 'AI Assistant',
              desc: 'Get Gemini AI insights, learning paths and mock interviews', color: '#8B5CF6', path: '/intern-user/ai-assistant' },
            { icon: <Assessment sx={{ fontSize: 32 }} />, title: 'Performance Analytics',
              desc: 'Analyze your tasks, scores and overall performance metrics', color: '#3B9EFF', path: '/intern-user/performance' },
            { icon: <Task sx={{ fontSize: 32 }} />, title: 'My Tasks List',
              desc: 'View all active, completed and pending assignments', color: '#22D3B5', path: '/intern-user/tasks' },
          ].map((card, i) => (
            <Grid item xs={12} sm={4} key={i}>
              <motion.div 
                whileHover={{ y: -5, boxShadow: '0 12px 20px rgba(0,0,0,0.08)' }} 
                initial={{ opacity: 0, y: 15 }} 
                animate={{ opacity: 1, y: 0 }} 
                transition={{ delay: 0.1 * i }}
              >
                <Box 
                  onClick={() => navigate(card.path)}
                  sx={{ 
                    p: 2.5, 
                    borderRadius: '16px', 
                    border: '1px solid var(--border)', 
                    background: '#fff',
                    cursor: 'pointer',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 1.5,
                    transition: 'all 0.3s ease',
                    '&:hover': {
                      borderColor: card.color,
                    }
                  }}
                >
                  <Box sx={{ 
                    alignSelf: 'flex-start',
                    p: 1.25, 
                    borderRadius: '12px', 
                    background: `${card.color}15`, 
                    color: card.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {card.icon}
                  </Box>
                  <Box>
                    <Typography fontWeight={700} sx={{ color: 'var(--text-primary)', mb: 0.5, fontSize: '15px' }}>
                      {card.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'var(--text-secondary)', fontSize: '12.5px', lineHeight: 1.4 }}>
                      {card.desc}
                    </Typography>
                  </Box>
                </Box>
              </motion.div>
            </Grid>
          ))}
        </Grid>
      </div>
    </motion.div>
  );
}

import AttendanceManagement from './AttendanceManagement';
import LeaveManagement from './LeaveManagement';
import InternHoursCalculator from './InternHoursCalculator';
import InternTasks from './Tasks';
import AiAssistant from './AiAssistant';
import MockInterviewPage from './MockInterviewPage';
import ResumeBuilderPage from './ResumeBuilderPage';
import LearningPage from './LearningPage';
import CalendarPage from './CalendarPage';
import DocumentView from './DocumentView';
import PaymentStatusPage from './PaymentStatusPage';
import AssetReport from './AssetReport';
import PerformancePage from './PerformancePage';
import StudentStaffFeedback from './StudentStaffFeedback';
import TeamsManagement from './TeamsManagement';
import ExitSummaryPage from './ExitSummaryPage';
import UserProfile from '../admin/UserProfile';
import MyProjectsMentorView from './MyProjectsMentorView';
import InternAttendanceClaims from './InternAttendanceClaims';

export default function InternDashboard() {
  const location = useLocation();

  // Extract the active item from the URL path.
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeItem = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard': return <InternDashContent />;
      case 'my-projects': return <MyProjectsMentorView />;
      case 'attendance': return <AttendanceManagement />;
      case 'attendance-claims': return <InternAttendanceClaims />;
      case 'leave': return <LeaveManagement />;
      case 'calculator': return <InternHoursCalculator />;
      case 'tasks': return <InternTasks />;
      case 'ai-assistant': return <AiAssistant />;
      case 'mock-interview': return <MockInterviewPage />;
      case 'resume-builder': return <ResumeBuilderPage />;
      case 'exit-summary': return <ExitSummaryPage />;
      case 'learning': return <LearningPage />;
      case 'calendar': return <CalendarPage />;
      case 'documents': return <DocumentView />;
      case 'payments': return <PaymentStatusPage />;
      case 'assets': return <AssetReport />;
      case 'performance': return <PerformancePage />;
      case 'feedback': return <StudentStaffFeedback />;
      case 'teams': return <TeamsManagement />;
      case 'profile': return <UserProfile />;
      default: return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box className="page-header">
            <Typography variant="h4" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
              {activeItem.replace(/-/g, ' ')}
            </Typography>
          </Box>
          <Box className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h6" color="text.secondary">Module ready</Typography>
            <Typography variant="body2" color="text.tertiary" mt={1}>
              Backend API is live. Full UI coming in next phases.
            </Typography>
          </Box>
        </motion.div>
      );
    }
  };

  return (
    <DashboardShell type="intern" basePath="/intern-user">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={renderContent()} />
      </Routes>
    </DashboardShell>
  );
}
