import { useState, useEffect } from 'react';
import { 
  CalendarToday, Group, CheckCircle, AccessTime,
  PersonAdd, EventNote, PersonRemove
} from '@mui/icons-material';
import { LoadingSpinner } from '../../../components/common';
import { dashboardAPI } from '../../../services/api';

import EntityManagement from '../EntityManagement';
import StaffList from '../StaffList';
import StaffForm from '../StaffForm';
import InternLists from '../InternLists';
import TeamManagement from '../TeamManagement';
import InternDirectory from '../../intern-mgmt/InternDirectory';
import UserProfile from '../UserProfile';
import AuditLogPage from '../AuditLogPage';
import PaymentList from '../PaymentList';
import RegisterPage from '../RegisterPage';
import AIReportsPage from '../AIReportsPage';
import DelegationPage from '../DelegationPage';
import WebhooksPage from '../WebhooksPage';
import ImportPage from '../ImportPage';
import PerformanceFeedbackPage from '../PerformanceFeedbackPage';
import AttendanceHistory from '../AttendanceHistory';
import Settings from '../Settings';

function AdminOverview() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const summaryRes = await dashboardAPI.summary();
        setData(summaryRes.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard..." />;

  const ic = data?.intern_counts || {};
  const att = data?.attendance || {};
  const pay = data?.payment_summary || {};
  const domainDistribution = data?.dept_active_counts || [];
  const monthlyPayments = data?.monthly_payments || [];

  const totalCount = ic.total || 0;
  const activeCount = ic.active || 0;
  const attendancePct = att.pct || 0;

  // Find max payment value for scaling chart bar heights
  const maxPaymentVal = Math.max(
    ...monthlyPayments.flatMap(m => [m.stipends, m.reimbursements, m.other]), 
    10000
  );

  const getBarHeight = (value) => {
    if (value <= 0) return '0%';
    const percentage = (value / maxPaymentVal) * 100;
    return `${Math.min(percentage, 100).toFixed(1)}%`;
  };

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Calculate SVG circular arc dash arrays for domain distribution donut
  const domainColors = ['#8B5CF6', '#3B9EFF', '#22D3B5', '#FF8A5C', '#F0625C', '#64748b'];
  const totalDomainCount = domainDistribution.reduce((acc, curr) => acc + curr.count, 0) || activeCount || 15;
  let accumulatedOffset = 0;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="page-title-row">
            <h1 className="page-title">Admin dashboard</h1>
            <span className="live-badge"><span className="live-dot"></span>Live</span>
          </div>
          <p className="page-sub">System overview, all entities · Updated just now</p>
        </div>
        <div className="date-pill"><CalendarToday />{dateStr}</div>
      </div>

      <div className="hero-grid">
        <div className="hero-card purple">
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Total interns</span>
            <div className="hero-icon"><Group /></div>
          </div>
          <div>
            <div className="hero-value mono">{totalCount}</div>
            <div className="hero-foot">Across {domainDistribution.length} domains</div>
          </div>
        </div>
        <div className="hero-card blue">
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Active interns</span>
            <div className="hero-icon"><CheckCircle /></div>
          </div>
          <div>
            <div className="hero-value mono">{activeCount}</div>
            <div className="hero-foot">{totalCount > 0 ? Math.round((activeCount / totalCount) * 100) : 0}% of total</div>
          </div>
        </div>
        <div className="hero-card teal">
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Attendance today</span>
            <div className="hero-icon"><AccessTime /></div>
          </div>
          <div>
            <div className="hero-value mono">{attendancePct}%</div>
            <div className="hero-foot">{att.present || 0} of {att.total_active || 0} present</div>
          </div>
        </div>
      </div>

      <div className="stat-row">
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Yet to join</span>
            <div className="stat-card-icon gray"><PersonAdd /></div>
          </div>
          <div className="stat-card-value mono">{ic.yet_to_join || 0}</div>
          <div className="stat-card-foot">Onboarding pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">On leave</span>
            <div className="stat-card-icon amber"><EventNote /></div>
          </div>
          <div className="stat-card-value mono">{ic.on_leave || 0}</div>
          <div className="stat-card-foot">Away today</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-top">
            <span className="stat-card-label">Discontinued</span>
            <div className="stat-card-icon red"><PersonRemove /></div>
          </div>
          <div className="stat-card-value mono">{ic.discontinued || 0}</div>
          <div className="stat-card-foot">No longer active</div>
        </div>
      </div>

      <div className="panel-grid">
        <div className="panel">
          <div className="panel-head">
            <h3 className="panel-title">Transactions overview</h3>
            <div className="legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--grad-1-a)' }}></span>Stipends</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--grad-2-a)' }}></span>Reimbursements</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--grad-3-a)' }}></span>Other</span>
            </div>
          </div>
          <div className="chart-area">
            {monthlyPayments.map((item, idx) => (
              <div key={idx} className="chart-month" title={item.month}>
                <div 
                  className="bar b-purple" 
                  style={{ height: getBarHeight(item.stipends) }} 
                  title={`Stipends: ₹${item.stipends.toLocaleString()}`}
                ></div>
                <div 
                  className="bar b-blue" 
                  style={{ height: getBarHeight(item.reimbursements) }} 
                  title={`Reimbursements: ₹${item.reimbursements.toLocaleString()}`}
                ></div>
                <div 
                  className="bar b-teal" 
                  style={{ height: getBarHeight(item.other) }} 
                  title={`Other: ₹${item.other.toLocaleString()}`}
                ></div>
              </div>
            ))}
          </div>
          <div className="chart-labels">
            {monthlyPayments.map((item, idx) => (
              <span key={idx}>{item.month}</span>
            ))}
          </div>
          <div className="domain-total" style={{ marginTop: '14px', display: 'flex', justifyContent: 'space-between', fontSize: '12.5px', color: 'var(--text-tertiary)' }}>
            <span>
              <b className="mono" style={{ color: 'var(--success)' }}>{pay.completed || 0}</b> done · <b className="mono" style={{ color: 'var(--warning)' }}>{pay.pending || 0}</b> pending · <b className="mono" style={{ color: 'var(--danger)' }}>{pay.overdue || 0}</b> overdue
            </span>
            <span>Total this month: <b className="mono" style={{ color: 'var(--text-primary)' }}>₹{(pay.total_amount || 0).toLocaleString()}</b></span>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head">
            <h3 className="panel-title">Domain distribution</h3>
          </div>
          <div className="donut-wrap">
            <svg className="donut-svg" width="148" height="148" viewBox="0 0 148 148">
              <circle cx="74" cy="74" r="58" fill="none" stroke="#F2F1F8" strokeWidth="20"/>
              {domainDistribution.map((d, idx) => {
                const count = d.count || 0;
                const pct = totalDomainCount > 0 ? count / totalDomainCount : 0;
                const length = pct * 364.4;
                const offset = accumulatedOffset;
                accumulatedOffset -= length;
                const color = domainColors[idx % domainColors.length];
                return (
                  <circle
                    key={idx}
                    cx="74"
                    cy="74"
                    r="58"
                    fill="none"
                    stroke={color}
                    strokeWidth="20"
                    strokeDasharray={`${length.toFixed(1)} ${364.4 - length}`}
                    strokeDashoffset={offset.toFixed(1)}
                    strokeLinecap="round"
                    transform="rotate(-90 74 74)"
                  />
                );
              })}
              <text x="74" y="70" textAnchor="middle" fontSize="22" fontWeight="800" fill="#241F3D" fontFamily="JetBrains Mono, monospace">{totalDomainCount}</text>
              <text x="74" y="88" textAnchor="middle" fontSize="10.5" fill="#A6A2BC" fontFamily="Inter, sans-serif" fontWeight="600">interns</text>
            </svg>
            <div className="donut-legend">
              {domainDistribution.map((d, idx) => {
                const color = domainColors[idx % domainColors.length];
                return (
                  <div key={idx} className="donut-legend-row">
                    <div className="donut-legend-left">
                      <span className="donut-dot" style={{ background: color }}></span>
                      <span className="donut-legend-name">{d.domain__name || 'Unassigned'}</span>
                    </div>
                    <span className="donut-legend-count mono">{d.count}</span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="donut-total-row">
            {domainDistribution.length} domains tracked
            <b className="mono">{totalDomainCount} total</b>
          </div>
        </div>
      </div>
    </>
  );
}

export default function AdminContent({ activeItem, subAction, subId }) {
  switch (activeItem) {
    case 'dashboard':   return <AdminOverview />;
    case 'staff':       
      if (subAction === 'edit' || subAction === 'new') {
        return <StaffForm subAction={subAction} empId={subId} />;
      }
      return <StaffList />;
    case 'register':    return <RegisterPage />;
    case 'payments':    return <PaymentList />;
    case 'entities':    return <EntityManagement />;
    case 'intern-lists':return <InternLists />;
    case 'teams':       return <TeamManagement />;
    case 'attendance-history': return <AttendanceHistory />;
    case 'performance': return <PerformanceFeedbackPage />;
    case 'ai-reports':  return <AIReportsPage />;
    case 'delegation':  return <DelegationPage />;
    case 'import':      return <ImportPage />;
    case 'webhooks':    return <WebhooksPage />;
    case 'settings':    return <Settings />;
    case 'intern-directory': return <InternDirectory />;
    case 'profile':     return <UserProfile />;
    case 'audit-log':   return <AuditLogPage />;
    default:            return <AdminOverview />;
  }
}
