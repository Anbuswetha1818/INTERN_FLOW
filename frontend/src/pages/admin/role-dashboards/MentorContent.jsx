/**
 * SIMS — Mentor Dashboard Content
 * Capabilities:
 *   - Single domain access (own domain only)
 *   - Create team and assign team lead from interns
 *   - Assign tasks from assigned project to interns
 *   - Receive, validate, and approve intern leave requests
 */

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Chip, Button, Avatar, Table, TableBody,
         TableCell, TableHead, TableRow, Dialog, DialogTitle, DialogContent,
         DialogActions, TextField, MenuItem, Select, InputLabel, FormControl,
         CircularProgress, Alert, Divider } from '@mui/material';
import { Group, Task, CalendarMonth, People, Add, CheckCircle,
         Cancel, FolderSpecial, Workspaces, HowToReg, CalendarToday } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner, StatCard } from '../../../components/common';
import api from '../../../services/api';
import UserProfile from '../UserProfile';
import TeamManagement from '../TeamManagement';
import AttendanceHistory from '../AttendanceHistory';

// ── Leave Approvals Panel ────────────────────────────────────────────────────
function LeaveApprovalsPanel() {
  const [leaves, setLeaves]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [processing, setProcessing] = useState({});

  const load = () => {
    setLoading(true);
    api.get('/Sims/attendances/leave_approval/')
      .then(res => setLeaves(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = (leaveId, status) => {
    setProcessing(p => ({ ...p, [leaveId]: true }));
    api.patch(`/Sims/attendances/leave_approval/${leaveId}/`, { status })
      .then(() => load())
      .catch(() => {})
      .finally(() => setProcessing(p => ({ ...p, [leaveId]: false })));
  };

  const typeColor = (t) => ({ casual: 'primary', sick: 'warning', emergency: 'error' }[t] || 'default');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header">
        <Box>
          <Typography variant="h4" fontWeight={800}>Leave Approvals</Typography>
          <Typography variant="body2" color="text.secondary">
            Pending leave requests from your team interns
          </Typography>
        </Box>
        <Chip label={`${leaves.length} Pending`} color={leaves.length > 0 ? 'warning' : 'default'} />
      </Box>

      {loading ? <LoadingSpinner text="Loading leave requests..." /> : (
        <Box className="glass-card" sx={{ p: 3 }}>
          {leaves.length === 0 ? (
            <Alert severity="success" icon={<CheckCircle />}>
              No pending leave requests from your team.
            </Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Intern</TableCell>
                  <TableCell>Leave Type</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell>Reason</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map(l => (
                  <TableRow key={l.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ bgcolor: 'var(--color-primary)', width: 32, height: 32, fontSize: '0.8rem' }}>
                          {l.user_name?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{l.user_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{l.user_emp_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={l.leave_type} color={typeColor(l.leave_type)} size="small" />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption">{l.start_date} → {l.end_date}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {l.reason || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Button size="small" variant="contained" color="success"
                          startIcon={processing[l.id] ? <CircularProgress size={14} /> : <CheckCircle />}
                          disabled={!!processing[l.id]}
                          onClick={() => handleAction(l.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error"
                          startIcon={<Cancel />}
                          disabled={!!processing[l.id]}
                          onClick={() => handleAction(l.id, 'rejected')}>
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}
    </motion.div>
  );
}

// ── Task Assignment Panel ─────────────────────────────────────────────────────
function TaskAssignmentPanel() {
  const [projects, setProjects]     = useState([]);
  const [interns, setInterns]       = useState([]);
  const [tasks, setTasks]           = useState([]);
  const [loading, setLoading]       = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [form, setForm]             = useState({ title: '', description: '', project: '', assigned_to: '', due_date: '', priority: 'medium' });
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/Sims/projects/'),
      api.get('/Sims/interns/'),
      api.get('/Sims/tasks/'),
    ])
      .then(([p, i, t]) => { setProjects(p.data); setInterns(i.data); setTasks(t.data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = () => {
    setSaving(true);
    setError('');
    api.post('/Sims/tasks/', form)
      .then(() => {
        setOpenDialog(false);
        setForm({ title: '', description: '', project: '', assigned_to: '', due_date: '', priority: 'medium' });
        load();
      })
      .catch(e => setError(e.response?.data?.error || 'Failed to create task'))
      .finally(() => setSaving(false));
  };

  const statusColor   = (s) => ({ todo: 'default', inprogress: 'warning', completed: 'success', verified: 'primary' }[s] || 'default');
  const priorityColor = (p) => ({ high: 'error', medium: 'warning', low: 'success' }[p] || 'default');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Task Assignment</Typography>
          <Typography variant="body2" color="text.secondary">Assign tasks from your projects to team interns</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenDialog(true)}
          sx={{ background: 'var(--gradient-primary)', borderRadius: 2 }}>
          Assign Task
        </Button>
      </Box>

      {loading ? <LoadingSpinner text="Loading tasks..." /> : (
        <Box className="glass-card" sx={{ p: 3 }}>
          {tasks.length === 0 ? (
            <Alert severity="info">No tasks yet. Create your first task assignment above.</Alert>
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Task</TableCell>
                  <TableCell>Project</TableCell>
                  <TableCell>Assigned To</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map(t => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{t.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.description?.slice(0, 60)}</Typography>
                    </TableCell>
                    <TableCell>{t.project_name || '—'}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'var(--color-accent)' }}>
                          {t.assigned_to_name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">{t.assigned_to_name || '—'}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell><Chip label={t.priority} color={priorityColor(t.priority)} size="small" /></TableCell>
                    <TableCell><Typography variant="caption">{t.due_date || '—'}</Typography></TableCell>
                    <TableCell><Chip label={t.status} color={statusColor(t.status)} size="small" /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Box>
      )}

      {/* Create Task Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Task to Intern</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Task Title" fullWidth value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          <TextField label="Description" fullWidth multiline rows={2} value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <FormControl fullWidth>
            <InputLabel>Project</InputLabel>
            <Select value={form.project} label="Project"
              onChange={e => setForm(f => ({ ...f, project: e.target.value, assigned_to: '' }))}>
              {projects.map(p => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={!form.project}>
            <InputLabel>Assign To</InputLabel>
            <Select value={form.assigned_to} label="Assign To"
              onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}>
              <MenuItem value="">Select intern...</MenuItem>
              {interns
                .filter(i => {
                  if (!form.project) return true;
                  const proj = projects.find(p => p.id === form.project);
                  return proj ? i.domain_name === proj.domain_name : true;
                })
                .map(i => <MenuItem key={i.id} value={i.id}>{i.full_name} ({i.emp_id})</MenuItem>)}
            </Select>
          </FormControl>
          <Grid container spacing={2}>
            <Grid xs={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={form.priority} label="Priority"
                  onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {['low', 'medium', 'high'].map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid xs={6}>
              <TextField type="date" label="Due Date" fullWidth slotProps={{ inputLabel: { shrink: true } }}
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !form.title || !form.assigned_to}>
            {saving ? <CircularProgress size={20} /> : 'Assign Task'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}

// ── Interns sub-view ─────────────────────────────────────────────────────────
function InternsMentorView() {
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.get('/Sims/interns/')
      .then(res => setInterns(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header">
        <Typography variant="h4" fontWeight={800}>My Interns</Typography>
        <Typography variant="body2" color="text.secondary">Interns currently assigned to your projects</Typography>
      </Box>
      {loading ? <LoadingSpinner text="Loading interns..." /> : (
        <Box className="glass-card" sx={{ p: 3 }}>
          {interns.length === 0 ? (
            <Alert severity="info">You haven't assigned any interns to your projects yet.</Alert>
          ) : (
            <Grid container spacing={2}>
              {interns.map(intern => {
                const currentProjects = intern.projects_info || [];
                
                return (
                  <Grid xs={12} sm={6} md={4} key={intern.emp_id}>
                    <Box sx={{ p: 2, border: '1px solid var(--border-subtle)', borderRadius: 2, display: 'flex', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'var(--color-primary)', width: 44, height: 44 }}>
                        {intern.full_name?.charAt(0)}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" fontWeight={600}>{intern.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{intern.emp_id}</Typography>
                        <Box sx={{ mt: 0.5, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip label={intern.user_status || 'active'} size="small" color="success" />
                          {currentProjects.map(cp => (
                            <Chip key={cp.id} label={cp.name} size="small" color="primary" variant="outlined" />
                          ))}
                        </Box>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
    </motion.div>
  );
}

// ── Projects sub-view ─────────────────────────────────────────────────────────
function ProjectsMentorView() {
  const [projects, setProjects] = useState([]);
  const [availableInterns, setAvailableInterns] = useState([]);
  const [myInterns, setMyInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/Sims/projects/'),
      api.get('/Sims/teams/available-interns/'),
      api.get('/Sims/interns/')
    ])
      .then(([pRes, aRes, mRes]) => {
        setProjects(pRes.data);
        setAvailableInterns(aRes.data);
        setMyInterns(mRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAssignInterns = (projectId, currentTeamId, selectedInternIds, projectName) => {
    const project = projects.find(p => p.id === projectId);
    const oldInternIds = project?.team_interns || [];
    const newlyAssigned = selectedInternIds.filter(id => !oldInternIds.includes(id));

    const notifyNewInterns = () => {
      if (newlyAssigned.length > 0) {
        api.post('/Sims/notifications/create/', {
          user_ids: newlyAssigned,
          title: 'New Project Assignment',
          message: `You have been assigned to project: ${projectName}. Check your Dashboard for Mentor details.`,
          type: 'general'
        }).catch(() => {});
      }
    };

    if (currentTeamId) {
      api.patch(`/Sims/teams/${currentTeamId}/`, { interns: selectedInternIds })
        .then(() => {
          notifyNewInterns();
          load();
        });
    } else {
      api.post('/Sims/teams/', { name: `${projectName} Team`, interns: selectedInternIds })
        .then(res => {
          api.post(`/Sims/projects/${projectId}/assign-team/`, { team_id: res.data.id })
            .then(() => {
              notifyNewInterns();
              load();
            });
        });
    }
  };

  const statusColor = (s) => ({ active: 'success', completed: 'primary', planning: 'warning', on_hold: 'default' }[s] || 'default');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header">
        <Typography variant="h4" fontWeight={800}>Assigned Projects</Typography>
        <Typography variant="body2" color="text.secondary">Assign interns directly to your projects</Typography>
      </Box>
      {loading ? <LoadingSpinner text="Loading projects..." /> : (
        <Box className="glass-card" sx={{ p: 3 }}>
          {projects.length === 0 ? (
            <Alert severity="info">No projects assigned to you yet.</Alert>
          ) : (
            <Grid container spacing={2}>
              {projects.map(p => {
                const teamInternIds = p.team_interns || [];
                const currentInternsObj = myInterns.filter(i => teamInternIds.includes(i.id));
                // Ensure unique objects
                const allOptionsMap = new Map();
                [...availableInterns, ...currentInternsObj].forEach(i => allOptionsMap.set(i.id, i));
                const allOptions = Array.from(allOptionsMap.values());
                const domainOptions = p.domain_name ? allOptions.filter(i => i.domain_name === p.domain_name) : allOptions;

                return (
                  <Grid xs={12} sm={6} key={p.id}>
                    <Box sx={{ p: 2.5, border: '1px solid var(--border-subtle)', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontWeight={700}>{p.name}</Typography>
                        <Chip label={p.status} color={statusColor(p.status)} size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">{p.description || 'No description'}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Domain: {p.domain_name || '—'}
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <Select
                            multiple
                            displayEmpty
                            value={p.team_interns || []}
                            onChange={e => handleAssignInterns(p.id, p.team, e.target.value, p.name)}
                            renderValue={(selected) => {
                              if (!selected || selected.length === 0) return <em>Select interns...</em>;
                              return `${selected.length} intern${selected.length > 1 ? 's' : ''} assigned`;
                            }}
                          >
                            <MenuItem disabled value=""><em>Select interns...</em></MenuItem>
                            {domainOptions.map(i => (
                              <MenuItem key={i.id} value={i.id}>
                                {i.full_name} ({i.emp_id})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
    </motion.div>
  );
}

// ── Mentor Overview ──────────────────────────────────────────────────────────
function MentorOverview() {
  const navigate = useNavigate();
  const [stats, setStats]     = useState({ teams: 0, interns: 0, pendingLeaves: 0, tasks: 0, present_today: 0 });
  const [leaves, setLeaves]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const loadStatsAndLeaves = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const empId = sessionStorage.getItem('empId');
    Promise.all([
      api.get('/Sims/teams/'),
      api.get('/Sims/attendances/leave_approval/'),
      api.get('/Sims/tasks/'),
      api.get(`/Sims/user-data/${empId}/`),
      api.get('/Sims/interns/full-list/'),
      api.get('/Sims/attendance/', { params: { start_date: todayStr, end_date: todayStr } }),
    ])
      .then(([teamsRes, leaveRes, taskRes, userRes, internRes, attRes]) => {
        const mentorDomainId = userRes.data.domain;
        const domainInterns = (internRes.data || []).filter(i => i.domain === mentorDomainId);
        
        const myInternsCount = domainInterns.length;
        const myInternsEmpIds = domainInterns.map(i => i.emp_id);
        
        const presentToday = (attRes.data || []).filter(
          r => myInternsEmpIds.includes(r.emp_id) && (r.status === 'present' || r.status === 'halfday')
        ).length;

        setStats({
          teams:        teamsRes.data.length,
          interns:      myInternsCount,
          pendingLeaves:leaveRes.data.length,
          tasks:        taskRes.data.length,
          present_today:presentToday,
        });
        setLeaves(leaveRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadStatsAndLeaves();
  }, []);

  const handleAction = (leaveId, status) => {
    setProcessing(p => ({ ...p, [leaveId]: true }));
    api.patch(`/Sims/attendances/leave_approval/${leaveId}/`, { status })
      .then(() => loadStatsAndLeaves())
      .catch(() => {})
      .finally(() => setProcessing(p => ({ ...p, [leaveId]: false })));
  };

  const dateStr = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const typeColor = (t) => ({ casual: 'primary', sick: 'warning', emergency: 'error' }[t] || 'default');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="page-head">
        <div>
          <div className="page-title-row">
            <h1 className="page-title">Mentor Dashboard</h1>
            <span className="live-badge"><span className="live-dot"></span>Live</span>
          </div>
          <p className="page-sub">Team management · Task assignment · Leave approvals</p>
        </div>
        <div className="date-pill"><CalendarToday />{dateStr}</div>
      </div>

      <div className="hero-grid">
        <div className="hero-card purple" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/interns')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">My Interns</span>
            <div className="hero-icon"><People /></div>
          </div>
          <div>
            <div className="hero-value mono">{stats.interns}</div>
            <div className="hero-foot">Active tasks: {stats.tasks}</div>
          </div>
        </div>
        <div className="hero-card blue" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/attendance-history')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Attendance Today</span>
            <div className="hero-icon"><HowToReg /></div>
          </div>
          <div>
            <div className="hero-value mono">{stats.present_today}</div>
            <div className="hero-foot">Out of {stats.interns} total interns</div>
          </div>
        </div>
        <div className="hero-card teal" style={{ cursor: 'pointer' }} onClick={() => navigate('/admin/leaves')}>
          <div className="hero-blob b1"></div><div className="hero-blob b2"></div>
          <div className="hero-top">
            <span className="hero-label">Pending Leaves</span>
            <div className="hero-icon"><CalendarToday /></div>
          </div>
          <div>
            <div className="hero-value mono">{stats.pendingLeaves}</div>
            <div className="hero-foot">Requires your review</div>
          </div>
        </div>
      </div>

      {/* Row 2: Leave Requests Panel & Stats */}
      <div className="panel-grid" style={{ marginBottom: '24px' }}>
        {/* Leave approvals panel (interactive) */}
        <div className="panel" style={{ flex: 1.5 }}>
          <div className="panel-head">
            <h3 className="panel-title">Pending Leave Requests</h3>
            <Chip label={`${stats.pendingLeaves} Pending`} color={stats.pendingLeaves > 0 ? 'warning' : 'default'} size="small" />
          </div>
          {leaves.length === 0 ? (
            <Alert severity="success" icon={<CheckCircle />}>
              No pending leave requests from your team.
            </Alert>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Intern</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Dates</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {leaves.map(l => (
                  <TableRow key={l.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Avatar sx={{ bgcolor: 'var(--color-primary)', width: 24, height: 24, fontSize: '0.7rem' }}>
                          {l.user_name?.charAt(0) || '?'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600} fontSize="0.8rem">{l.user_name}</Typography>
                          <Typography variant="caption" color="text.secondary" fontSize="0.65rem">{l.user_emp_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip label={l.leave_type} color={typeColor(l.leave_type)} size="small" sx={{ fontSize: '0.7rem', height: 18 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>{l.start_date} → {l.end_date}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" color="success"
                          sx={{ fontSize: '0.7rem', py: 0.25, minWidth: 50 }}
                          disabled={!!processing[l.id]}
                          onClick={() => handleAction(l.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error"
                          sx={{ fontSize: '0.7rem', py: 0.25, minWidth: 50 }}
                          disabled={!!processing[l.id]}
                          onClick={() => handleAction(l.id, 'rejected')}>
                          Reject
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Right Panel: Domain Overview & Quick Summary */}
        <div className="panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-head">
            <h3 className="panel-title">Summary & Quick Navigation</h3>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '5px 0', flex: 1, justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Active Interns</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.interns} total</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Attendance Today</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {stats.interns > 0 ? Math.round((stats.present_today / stats.interns) * 100) : 100}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Total Teams</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.teams} active</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>Tasks Assigned</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)' }}>{stats.tasks} tasks</span>
            </div>
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
            { icon: <Task sx={{ fontSize: 32 }} />, title: 'Task Assignment',
              desc: 'Assign and review tasks for interns in your domain', color: '#8B5CF6', path: '/admin/tasks' },
            { icon: <CalendarToday sx={{ fontSize: 32 }} />, title: 'Leave Approvals',
              desc: 'Review, approve or reject pending leave requests', color: '#3B9EFF', path: '/admin/leaves' },
            { icon: <People sx={{ fontSize: 32 }} />, title: 'My Interns',
              desc: 'View profiles and check progress of domain interns', color: '#22D3B5', path: '/admin/interns' },
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

// ── Main router ───────────────────────────────────────────────────────────────
export default function MentorContent({ activeItem }) {
  switch (activeItem) {
    case 'dashboard':          return <MentorOverview />;
    case 'attendance-history': return <AttendanceHistory />;
    case 'tasks':              return <TaskAssignmentPanel />;
    case 'leaves':             return <LeaveApprovalsPanel />;
    case 'leave-approvals':    return <LeaveApprovalsPanel />;
    case 'feedback':           return <PerformanceFeedbackPage />;
    case 'profile':            return <UserProfile />;
    case 'audit-log':          return <MentorOverview />;
    case 'interns':            return <InternsMentorView />;
    case 'projects':           return <ProjectsMentorView />;
    default:                   return <MentorOverview />;
  }
}
