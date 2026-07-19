/**
 * SIMS — SME (lead) Dashboard Content
 * Capabilities:
 *   - All-domain access and intern view
 *   - Create projects and assign to mentor by domain
 *   - Maintain payment status / finalize intern payments
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Chip, Button, Dialog, DialogTitle,
         DialogContent, DialogActions, TextField, MenuItem, Select,
         InputLabel, FormControl, Table, TableBody, TableCell, TableHead,
         TableRow, IconButton, Alert, CircularProgress } from '@mui/material';
import { Add, FolderSpecial, Payment, People, Domain,
         AttachMoney, CheckCircle, Group, HowToReg, CalendarToday } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner, StatCard } from '../../../components/common';

import TeamManagement from '../TeamManagement';
import InternLists from '../InternLists';
import PaymentList from '../PaymentList';
import DepartmentManagement from '../DepartmentManagement';
import UserProfile from '../UserProfile';
import AttendanceHistory from '../AttendanceHistory';
import AttendanceClaims from '../../attendance/AttendanceClaims';
import api, { dashboardAPI } from '../../../services/api';

// ── Project Management Panel ─────────────────────────────────────────────────
function ProjectsPanel() {
  const [projects, setProjects]     = useState([]);
  const [teams, setTeams]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [creating, setCreating]     = useState(false);
  const [form, setForm]             = useState({ name: '', description: '', status: 'planning', domain: '', team_lead: '', document: null });
  const [domains, setDomains]       = useState([]);
  const [teamLeads, setTeamLeads]   = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  // Assign Mentor Dialog states
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedProject, setSelectedProject]   = useState(null);
  const [selectedMentorId, setSelectedMentorId] = useState('');

  const handleOpenAssignDialog = (project) => {
    setSelectedProject(project);
    setSelectedMentorId(project.team_lead || '');
    setOpenAssignDialog(true);
  };

  const getMentorDisplayName = (p) => {
    const mentor = teamLeads.find(l => l.id === p.team_lead);
    if (mentor) {
      return `${mentor.full_name} (${mentor.emp_id})`;
    }
    return p.team_lead_name || 'Unassigned';
  };

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/Sims/projects/'),
      api.get('/Sims/teams/'),
      api.get('/Sims/domains/'),
      api.get('/Sims/team-leads/'),
    ])
      .then(([p, t, d, tl]) => { 
        setProjects(p.data); 
        setTeams(t.data); 
        setDomains(d.data); 
        setTeamLeads(tl.data); 
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.append('name', form.name);
    formData.append('description', form.description);
    formData.append('status', form.status);
    if (form.domain) formData.append('domain', form.domain);
    if (form.team_lead) formData.append('team_lead', form.team_lead);
    if (form.document) formData.append('document', form.document);

    api.post('/Sims/projects/', formData)
      .then(() => { 
        setOpenDialog(false); 
        setForm({ name: '', description: '', status: 'planning', domain: '', team_lead: '', document: null }); 
        load(); 
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to create project'))
      .finally(() => setSaving(false));
  };

  const handleAssignTeam = (projectId, teamId) => {
    api.post(`/Sims/projects/${projectId}/assign-team/`, { team_id: teamId })
      .then(() => load())
      .catch(() => {});
  };

  const handleAssignMentor = (projectId, leadId) => {
    api.post(`/Sims/projects/${projectId}/assign-team-lead/`, { lead_id: leadId })
      .then(() => load())
      .catch(() => {});
  };

  const handleStatusChange = (projectId, newStatus) => {
    api.patch(`/Sims/projects/${projectId}/`, { status: newStatus })
      .then(() => load())
      .catch(() => {});
  };

  const statusColor = (s) => ({ active: 'success', completed: 'primary', planning: 'warning', on_hold: 'default' }[s] || 'default');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Projects</Typography>
          <Typography variant="body2" color="text.secondary">Create projects and assign to mentors by domain</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ background: 'var(--gradient-primary)', borderRadius: 2 }}>
          New Project
        </Button>
      </Box>

      {loading ? <LoadingSpinner text="Loading projects..." /> : (
        <Box className="glass-card" sx={{ p: 3 }}>
          {projects.length === 0 ? (
            <Alert severity="info">No projects yet. Create your first project above.</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Project</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Domain</TableCell>
                  <TableCell>Assigned Mentor</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map(p => (
                  <TableRow key={p.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{p.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{p.description}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={p.status || 'planning'} 
                        color={statusColor(p.status || 'planning')} 
                        size="small"
                        sx={{ fontWeight: 600, textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>{p.domain_name || '—'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {getMentorDisplayName(p)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', alignItems: 'center' }}>
                        {p.team_lead ? (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            onClick={() => handleOpenAssignDialog(p)}
                            sx={{ borderRadius: 1.5 }}
                          >
                            Edit Mentor
                          </Button>
                        ) : (
                          <Button 
                            size="small" 
                            variant="contained" 
                            onClick={() => handleOpenAssignDialog(p)}
                            sx={{ borderRadius: 1.5, background: 'var(--gradient-primary)' }}
                          >
                            Add Mentor
                          </Button>
                        )}
                        {p.status !== 'completed' && (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="success"
                            startIcon={<CheckCircle />}
                            onClick={() => handleStatusChange(p.id, 'completed')}
                            sx={{ borderRadius: 1.5 }}
                          >
                            Mark as Completed
                          </Button>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* Create Project Dialog */}
      <Dialog open={openDialog} onClose={() => { setOpenDialog(false); setForm({ name: '', description: '', status: 'planning', domain: '', team_lead: '', document: null }); }} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Project Name" fullWidth value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            sx={{ mt: 1 }} />
          <TextField label="Description" fullWidth multiline rows={3} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <FormControl fullWidth>
            <InputLabel>Domain</InputLabel>
            <Select value={form.domain} label="Domain"
              onChange={e => setForm(f => ({ ...f, domain: e.target.value, team_lead: '' }))}>
              {domains.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={!form.domain}>
            <InputLabel>Mentor</InputLabel>
            <Select value={form.team_lead || ''} label="Mentor"
              onChange={e => setForm(f => ({ ...f, team_lead: e.target.value }))}>
              <MenuItem value="">Select mentor…</MenuItem>
              {teamLeads
                .filter(tl => {
                  if (!form.domain) return true;
                  const selDomain = domains.find(d => d.id === form.domain);
                  return selDomain ? tl.domain_name === selDomain.name : true;
                })
                .map(tl => (
                  <MenuItem key={tl.id} value={tl.id}>{tl.full_name}</MenuItem>
                ))}
            </Select>
          </FormControl>
          <TextField
            label="Upload Document"
            fullWidth
            onClick={() => document.getElementById('project-document').click()}
            value={form.document ? form.document.name : ''}
            helperText="Only PDF files are allowed"
            InputProps={{
              readOnly: true,
            }}
            sx={{ 
              cursor: 'pointer', 
              '& *': { cursor: 'pointer !important' } 
            }}
          />
          <input
            id="project-document"
            type="file"
            accept=".pdf"
            hidden
            onChange={e => {
              const file = e.target.files[0];
              if (file && !file.name.toLowerCase().endsWith('.pdf')) {
                alert('Only PDF files are allowed.');
                e.target.value = null;
                return;
              }
              setForm(f => ({ ...f, document: file }));
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDialog(false); setForm({ name: '', description: '', status: 'planning', domain: '', team_lead: '', document: null }); }}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !form.name}>
            {saving ? <CircularProgress size={20} /> : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Assign Mentor Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>
          {selectedProject?.team_lead ? 'Edit Mentor' : 'Assign Mentor'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Project: <strong>{selectedProject?.name}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Domain: <strong>{selectedProject?.domain_name || '—'}</strong>
          </Typography>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Mentor</InputLabel>
            <Select
              value={selectedMentorId}
              label="Mentor"
              onChange={e => setSelectedMentorId(e.target.value)}
            >
              <MenuItem value=""><em>Unassigned</em></MenuItem>
              {teamLeads
                .filter(l => !selectedProject?.domain_name || l.domain_name === selectedProject?.domain_name)
                .map(l => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.full_name} ({l.emp_id})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              handleAssignMentor(selectedProject.id, selectedMentorId || 'unassigned');
              setOpenAssignDialog(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}

// ── SME Overview ─────────────────────────────────────────────────────────────
function SMEOverview() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ projects: 0 });
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/Sims/projects/dashboard/'),
      dashboardAPI.summary(),
    ])
      .then(([pRes, sRes]) => {
        setStats({
          projects: pRes.data.active || 0,
        });
        setSummaryData(sRes.data);
      })
      .catch((err) => {
        console.error("Error loading SME dashboard stats:", err);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner text="Loading dashboard data..." />;

  const ic = summaryData?.intern_counts || {};
  const att = summaryData?.attendance || {};
  const pay = summaryData?.payment_summary || {};
  const domainDistribution = summaryData?.dept_active_counts || [];
  const monthlyPayments = summaryData?.monthly_payments || [];

  const totalInterns = ic.active || 0;
  const attendanceToday = att.present || 0;
  const attendanceTotal = att.total_active || 0;
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

  const domainColors = ['#8B5CF6', '#3B9EFF', '#22D3B5', '#FF8A5C', '#F0625C', '#64748b'];
  const totalDomainCount = domainDistribution.reduce((acc, curr) => acc + curr.count, 0) || totalInterns || 1;

  // Calculate offsets array for donut chart
  let accumulatedOffset = 0;
  const accumulatedOffsets = domainDistribution.map(d => {
    const count = d.count || 0;
    const pct = totalDomainCount > 0 ? count / totalDomainCount : 0;
    const length = pct * 364.4;
    const offset = accumulatedOffset;
    accumulatedOffset -= length;
    return offset;
  });

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
            <h1 className="page-title">SME Dashboard</h1>
            <span className="live-badge"><span className="live-dot"></span>Live</span>
          </div>
          <p className="page-sub">Projects · All domains · Payment management</p>
        </div>
        <div className="date-pill"><CalendarToday />{dateStr}</div>
      </div>

      <div className="hero-grid">
        <div className="hero-card purple" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/projects')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Active Projects</span>
            <div className="hero-icon"><FolderSpecial /></div>
          </div>
          <div>
            <div className="hero-value mono">{stats.projects}</div>
            <div className="hero-foot">Across all domains</div>
          </div>
        </div>
        <div className="hero-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/interns')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Active Interns</span>
            <div className="hero-icon"><People /></div>
          </div>
          <div>
            <div className="hero-value mono">{totalInterns}</div>
            <div className="hero-foot">Onboarded in domains</div>
          </div>
        </div>
        <div className="hero-card teal" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/attendance-history')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Attendance Today</span>
            <div className="hero-icon"><HowToReg /></div>
          </div>
          <div>
            <div className="hero-value mono">{attendanceToday}</div>
            <div className="hero-foot">{attendancePct}% of {attendanceTotal} active</div>
          </div>
        </div>
      </div>

      {/* Row 2: Charts and distribution */}
      <div className="panel-grid" style={{ marginBottom: '24px' }}>
        {/* Transactions overview / Payment summary */}
        <div className="panel">
          <div className="panel-head">
            <h3 className="panel-title">Transactions overview</h3>
            <div className="legend">
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--grad-1-a)' }}></span>Stipends</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--grad-2-a)' }}></span>Reimbursements</span>
              <span className="legend-item"><span className="legend-dot" style={{ background: 'var(--grad-3-a)' }}></span>Other</span>
            </div>
          </div>
          <div className="chart-area" style={{ height: '170px' }}>
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
              <b className="mono" style={{ color: 'var(--success)' }}>{pay.completed || 0}</b> paid · <b className="mono" style={{ color: 'var(--warning)' }}>{pay.pending || 0}</b> pending · <b className="mono" style={{ color: 'var(--danger)' }}>{pay.overdue || 0}</b> overdue
            </span>
            <span>Total disbursed: <b className="mono" style={{ color: 'var(--text-primary)' }}>₹{(pay.total_amount || 0).toLocaleString()}</b></span>
          </div>
        </div>

        {/* Domain distribution */}
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
                const offset = accumulatedOffsets[idx];
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
              {domainDistribution.slice(0, 4).map((d, idx) => {
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

      {/* Row 3: Quick Navigation Modules */}
      <div className="panel" style={{ marginBottom: '24px' }}>
        <div className="panel-head" style={{ marginBottom: '16px' }}>
          <h3 className="panel-title">Quick Access Tools</h3>
        </div>
        <Grid container spacing={2.5}>
          {[
            { icon: <FolderSpecial sx={{ fontSize: 32 }} />, title: 'Project Management',
              desc: 'Create projects, upload docs, assign mentors', color: '#8B5CF6', path: '/admin/projects' },
            { icon: <Group sx={{ fontSize: 32 }} />, title: 'Team Directory',
              desc: 'View teams and assign interns across your domains', color: '#3B9EFF', path: '/admin/teams' },
            { icon: <People sx={{ fontSize: 32 }} />, title: 'Intern Directory',
              desc: 'View active interns and check progress across all domains', color: '#22D3B5', path: '/admin/interns' },
            { icon: <AttachMoney sx={{ fontSize: 32 }} />, title: 'Payment Management',
              desc: 'Track stipends, process payments, and finalize payouts', color: '#FF8A5C', path: '/admin/payment-list' },
          ].map((card, i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
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

export default function SMEContent({ activeItem }) {
  switch (activeItem) {
    case 'dashboard':          return <SMEOverview />;
    case 'attendance-history': return <AttendanceHistory />;
    case 'attendance-claims':  return <AttendanceClaims />;
    case 'projects':           return <ProjectsPanel />;
    case 'teams':              return <TeamManagement />;
    case 'interns':            return <InternLists />;
    case 'payment-list':       return <PaymentList />;
    case 'domains':            return <DepartmentManagement />;
    case 'profile':            return <UserProfile />;
    default:                   return <SMEOverview />;
  }
}
