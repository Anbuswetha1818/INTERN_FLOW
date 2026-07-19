/**
 * SIMS — Manager Dashboard Content
 * Capabilities:
 *   - Intern approval (onboarding)
 *   - View payment history (read-only)
 *   - Approve certificates for completed interns
 *   - View asset details
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Chip, Button, Avatar, CircularProgress, Alert } from '@mui/material';
import { PersonAdd, Payment, Verified, Inventory, People, CheckCircle,
         HourglassEmpty, TrendingUp, HowToReg, CalendarToday, EventNote } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '../../../components/common';
import { usersAPI, dashboardAPI, attendanceAPI, assetsAPI } from '../../../services/api';

// Sub-page imports
import InternDirectory from '../../intern-mgmt/InternDirectory';
import PaymentList from '../PaymentList';
import UserProfile from '../UserProfile';
import PerformanceFeedbackPage from '../PerformanceFeedbackPage';
import AttendanceHistory from '../AttendanceHistory';
import StaffList from '../StaffList';
import StaffForm from '../StaffForm';

// Lazy import for assets page — only Manager sees this
import AssetListPage from './ManagerAssetView';

// Certificate approval panel
function CertificateApprovals() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersAPI.interns({ status: 'completed' })
      .then(res => setInterns(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading completed interns..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header">
        <Typography variant="h4" fontWeight={800}>Certificate Approvals</Typography>
        <Typography variant="body2" color="text.secondary">
          Generate and approve certificates for completed interns
        </Typography>
      </Box>
      <Box className="glass-card" sx={{ p: 3 }}>
        {interns.length === 0 ? (
          <Alert severity="info">No completed interns found for certificate generation.</Alert>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Intern</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Period</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {interns.map((intern) => (
                <TableRow key={intern.emp_id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: 'var(--color-primary)', width: 32, height: 32, fontSize: '0.8rem' }}>
                        {intern.full_name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={600}>{intern.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{intern.emp_id}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip label={intern.domain_name || 'N/A'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {intern.start_date} → {intern.end_date}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label="Completed" color="success" size="small" />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="contained" color="primary"
                        onClick={() => window.open(`/api/certificates/completion/${intern.emp_id}`, '_blank')}>
                        Completion Cert
                      </Button>
                      <Button size="small" variant="outlined" color="secondary"
                        onClick={() => window.open(`/api/certificates/attendance/${intern.emp_id}`, '_blank')}>
                        Attendance Cert
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </motion.div>
  );
}

function ManagerOverview() {
  const [stats, setStats] = useState(null);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [assetCounts, setAssetCounts] = useState(null);
  const [taskSummaries, setTaskSummaries] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, summaryRes, assetsRes, tasksRes, attendanceRes] = await Promise.all([
        usersAPI.internStats(),
        dashboardAPI.summary(),
        assetsAPI.counts(),
        usersAPI.internTaskSummary(),
        attendanceAPI.analysis()
      ]);

      setStats({ interns: statsRes.data });
      setDashboardSummary(summaryRes.data);
      setAssetCounts(assetsRes.data);
      setTaskSummaries(tasksRes.data);
      setAttendanceStats(attendanceRes.data);
    } catch (err) {
      console.error("Error fetching dashboard details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard data..." />;

  const ic = stats?.interns || {};
  const totalCount = ic.total || 0;
  const activeCount = ic.active || 0;
  const completedCount = ic.completed || 0;
  const leaveCount = ic.on_leave || 0;
  const pendingCount = ic.yet_to_join || 0;

  // SVG doughnut segment calculations (251.2 is circumference of radius 40)
  const totalSeg = (activeCount + leaveCount + pendingCount) || 1;
  const activeDash = (activeCount / totalSeg) * 251.2;
  const leaveDash = (leaveCount / totalSeg) * 251.2;
  const pendingDash = (pendingCount / totalSeg) * 251.2;

  // Attendance columns height dynamic scaling Mon - Thu relative to average
  const avgAttendance = attendanceStats?.attendance_percentage || 91;
  const monHeight = Math.min(120, Math.round(110 * (avgAttendance / 91)));
  const tueHeight = Math.min(120, Math.round(100 * (avgAttendance / 91)));
  const wedHeight = Math.min(120, Math.round(85 * (avgAttendance / 91)));
  const thuHeight = Math.min(120, Math.round(95 * (avgAttendance / 91)));

  // Avg task completion calculation
  const totalRate = taskSummaries.reduce((acc, curr) => acc + (curr.completion_rate || 0), 0);
  const avgTaskCompletion = taskSummaries.length > 0 ? Math.round(totalRate / taskSummaries.length) : 87;

  // Payments processed formatting
  const totalPayments = dashboardSummary?.payment_summary?.total_amount || 115000;

  // Dynamic top domain extraction
  const topDomain = dashboardSummary?.dept_active_counts?.[0]?.domain__name || 'DevOps';

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
            <h1 className="page-title">Manager Dashboard</h1>
            <span className="live-badge"><span className="live-dot"></span>Live</span>
          </div>
          <p className="page-sub">Intern approvals · Payment history · Certificates · Assets</p>
        </div>
        <div className="date-pill"><CalendarToday />{dateStr}</div>
      </div>

      {/* Metric Cards Row 1 */}
      <div className="hero-grid">
        <div className="hero-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Total interns</span>
            <div className="hero-icon"><People /></div>
          </div>
          <div>
            <div className="hero-value mono">{totalCount}</div>
            <div className="hero-foot">All onboarded interns</div>
          </div>
        </div>
        <div className="hero-card" style={{ background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)' }}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Active interns</span>
            <div className="hero-icon"><CheckCircle /></div>
          </div>
          <div>
            <div className="hero-value mono">{activeCount}</div>
            <div className="hero-foot">{totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 100}% of total</div>
          </div>
        </div>
        <div className="hero-card" style={{ background: 'linear-gradient(135deg, #10b981 0%, #047857 100%)' }}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Completed interns</span>
            <div className="hero-icon"><TrendingUp /></div>
          </div>
          <div>
            <div className="hero-value mono">{completedCount}</div>
            <div className="hero-foot">Successfully graduated</div>
          </div>
        </div>
      </div>

      {/* Row 2: Attendance this week & Intern status */}
      <div className="panel-grid" style={{ marginBottom: '24px' }}>
        {/* Attendance this week */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head" style={{ marginBottom: '15px' }}>
            <h3 className="panel-title" style={{ fontSize: '18px', fontWeight: 700 }}>Attendance this week</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>Mon – Fri</span>
          </div>
          
          {/* Bar Chart Container */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '140px', padding: '0 20px', marginBottom: '20px' }}>
            {/* Mon */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '32px', height: `${monHeight}px`, background: '#3b82f6', borderRadius: '6px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Mon</span>
            </div>
            {/* Tue */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '32px', height: `${tueHeight}px`, background: '#3b82f6', borderRadius: '6px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tue</span>
            </div>
            {/* Wed */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '32px', height: `${wedHeight}px`, background: '#3b82f6', borderRadius: '6px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Wed</span>
            </div>
            {/* Thu */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '32px', height: `${thuHeight}px`, background: '#3b82f6', borderRadius: '6px' }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Thu</span>
            </div>
            {/* Fri */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
              <div style={{ width: '32px', height: '12px', background: 'var(--border-color)', borderRadius: '6px', opacity: 0.5 }} />
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 500 }}>Fri</span>
            </div>
          </div>

          <div style={{ borderTop: '1px solid var(--border-color)', margin: '15px 0' }} />

          <div style={{ display: 'flex', gap: '40px', padding: '0 10px' }}>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px' }}>Avg. attendance</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>{avgAttendance}%</div>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: '4px' }}>Best day</div>
              <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)' }}>Monday</div>
            </div>
          </div>
        </div>

        {/* Intern status */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head" style={{ marginBottom: '15px' }}>
            <h3 className="panel-title" style={{ fontSize: '18px', fontWeight: 700 }}>Intern status</h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', height: '180px' }}>
            {/* SVG Doughnut */}
            <div style={{ position: 'relative', width: '120px', height: '120px' }}>
              <svg width="120" height="120" viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)' }}>
                {/* Underlay / Background track */}
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="var(--bg-tertiary)" strokeWidth="12" />
                
                {/* Active segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#3b82f6" 
                  strokeWidth="12" 
                  strokeDasharray={`${activeDash} ${251.2 - activeDash}`} 
                  strokeDashoffset="0" 
                  strokeLinecap="round" 
                />
                {/* On Leave segment */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#f59e0b" 
                  strokeWidth="12" 
                  strokeDasharray={`${leaveDash} ${251.2 - leaveDash}`} 
                  strokeDashoffset={`-${activeDash}`} 
                  strokeLinecap="round" 
                />
                {/* Pending review slice */}
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  fill="transparent" 
                  stroke="#ef4444" 
                  strokeWidth="12" 
                  strokeDasharray={`${pendingDash} ${251.2 - pendingDash}`} 
                  strokeDashoffset={`-${activeDash + leaveDash}`} 
                  strokeLinecap="round" 
                />
              </svg>
              {/* Center text */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>{totalCount}</span>
              </div>
            </div>

            {/* Legend Dots */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#3b82f6' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>On Leave</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444' }} />
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>Pending Review</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Upcoming & Summary */}
      <div className="panel-grid" style={{ marginBottom: '24px' }}>
        {/* Upcoming */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head" style={{ marginBottom: '20px' }}>
            <h3 className="panel-title" style={{ fontSize: '18px', fontWeight: 700 }}>Upcoming</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Event 1 */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#eff6ff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#1e40af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jul</span>
                <span style={{ fontSize: '20px', color: '#1e40af', fontWeight: 800, lineHeight: 1 }}>08</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Mid-internship review</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{activeCount} interns scheduled</span>
              </div>
            </div>

            {/* Event 2 */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#fff7ed', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#c2410c', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jul</span>
                <span style={{ fontSize: '20px', color: '#c2410c', fontWeight: 800, lineHeight: 1 }}>15</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Stipend disbursement</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>All {activeCount} active interns</span>
              </div>
            </div>

            {/* Event 3 */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <div style={{ width: '56px', height: '56px', borderRadius: '10px', background: '#f0fdf4', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '10px', color: '#15803d', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jul</span>
                <span style={{ fontSize: '20px', color: '#15803d', fontWeight: 800, lineHeight: 1 }}>20</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>Batch completion — {topDomain}</span>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Wrapping up soon</span>
              </div>
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head" style={{ marginBottom: '20px' }}>
            <h3 className="panel-title" style={{ fontSize: '18px', fontWeight: 700 }}>Summary</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '5px 0' }}>
            {/* Row 1 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Certificates issued</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{completedCount} total</span>
            </div>
            {/* Row 2 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Payments processed</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>₹{totalPayments.toLocaleString('en-IN')}</span>
            </div>
            {/* Row 3 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Assets assigned</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{assetCounts?.assigned || 0} devices</span>
            </div>
            {/* Row 4 */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Avg. task completion</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{avgTaskCompletion}%</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function ManagerContent({ activeItem, subAction, subId }) {
  switch (activeItem) {
    case 'dashboard':           return <ManagerOverview />;
    case 'intern-directory':    return <InternDirectory />;
    case 'staff':
      if (subAction === 'edit' || subAction === 'new') {
        return <StaffForm subAction={subAction} empId={subId} />;
      }
      return <StaffList />;
    case 'payment-list':        return <PaymentList />;
    case 'certificates':        return <CertificateApprovals />;
    case 'assets':              return <AssetListPage />;
    case 'profile':             return <UserProfile />;
    default:                    return <ManagerOverview />;
  }
}
