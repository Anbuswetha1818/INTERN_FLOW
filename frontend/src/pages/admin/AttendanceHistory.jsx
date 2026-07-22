import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, InputAdornment, 
  FormControl, InputLabel, Select, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, Grid, Chip
} from '@mui/material';
import { Search, Download, CalendarToday, Refresh, Edit } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { usersAPI, attendanceAPI, orgAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';

function AttendanceCard({ row, record, todayStatus, userRole, handleOpenEdit, renderTimeline }) {
  return (
    <Box 
      className="glass-card"
      sx={{ 
        p: 2, 
        mb: 2, 
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.3))',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
        boxShadow: 'var(--glass-shadow, 0 4px 12px rgba(0,0,0,0.05))',
      }}
    >
      {/* Header: Intern Info and Edit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box 
            sx={{ 
              width: 36, height: 36, borderRadius: '50%', 
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.8rem'
            }}
          >
            {row.full_name?.charAt(0) || 'I'}
          </Box>
          <Box>
            <Typography fontWeight={700} variant="subtitle1" sx={{ lineHeight: 1.2 }}>{row.full_name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.emp_id}</Typography>
          </Box>
        </Box>
        {userRole === 'sme' && (
          <IconButton 
            size="small" 
            color="primary" 
            onClick={() => handleOpenEdit(row, record, todayStatus)}
            sx={{ border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
          >
            <Edit fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Details grid */}
      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Domain</Typography>
          <Typography variant="body2" fontWeight={600}>{row.domain_name || 'N/A'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.scheme?.toUpperCase()} Scheme</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Today's Status</Typography>
          <Box sx={{ mt: 0.5 }}>
            <StatusChip status={todayStatus} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" display="block">Internship Timeline</Typography>
          <Typography variant="body2" fontWeight={500}>From: {row.start_date || '—'}</Typography>
          <Typography variant="body2" fontWeight={500}>To: {row.end_date || '—'}</Typography>
        </Grid>
      </Grid>

      {/* Attendance timeline steps */}
      {todayStatus === 'present' && record && (
        <Box sx={{ 
          mt: 1, 
          p: 1.5, 
          borderRadius: '8px', 
          border: '1px solid var(--glass-border, rgba(0, 0, 0, 0.05))',
          background: 'rgba(0, 0, 0, 0.01)',
          overflowX: 'auto',
          width: '100%',
          boxSizing: 'border-box'
        }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
            Timings Timeline:
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            {renderTimeline(record, todayStatus)}
          </Box>
        </Box>
      )}
    </Box>
  );
}

export default function AttendanceHistory() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [interns, setInterns] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [mentorDomain, setMentorDomain] = useState(null);

  // Edit Dialog States
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedIntern, setSelectedIntern] = useState(null);
  const [editStatus, setEditStatus] = useState('absent');
  const [editCheckIn, setEditCheckIn] = useState('');
  const [editBreakStart, setEditBreakStart] = useState('');
  const [editBreakEnd, setEditBreakEnd] = useState('');
  const [editCheckOut, setEditCheckOut] = useState('');
  const [saving, setSaving] = useState(false);

  const getTimeStringFromISO = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleOpenEdit = (intern, record, todayStatus) => {
    setSelectedIntern(intern);
    setEditStatus(todayStatus || 'absent');
    if (record) {
      setEditCheckIn(getTimeStringFromISO(record.check_in));
      setEditBreakStart(getTimeStringFromISO(record.break_start));
      setEditBreakEnd(getTimeStringFromISO(record.break_end));
      setEditCheckOut(getTimeStringFromISO(record.check_out));
    } else {
      setEditCheckIn('');
      setEditBreakStart('');
      setEditBreakEnd('');
      setEditCheckOut('');
    }
    setOpenEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedIntern) return;
    setSaving(true);
    try {
      const getISOString = (timeStr) => {
        if (!timeStr) return null;
        const dateObj = new Date(`${selectedDate}T${timeStr}`);
        return isNaN(dateObj.getTime()) ? null : dateObj.toISOString();
      };

      const payload = {
        emp_id: selectedIntern.emp_id,
        date: selectedDate,
        status: editStatus,
        check_in: editStatus === 'present' || editStatus === 'halfday' ? getISOString(editCheckIn) : null,
        break_start: editStatus === 'present' || editStatus === 'halfday' ? getISOString(editBreakStart) : null,
        break_end: editStatus === 'present' || editStatus === 'halfday' ? getISOString(editBreakEnd) : null,
        check_out: editStatus === 'present' || editStatus === 'halfday' ? getISOString(editCheckOut) : null,
      };

      await attendanceAPI.update(payload);
      showToast('Attendance record updated successfully!', 'success');
      setOpenEditDialog(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to update attendance record', 'error');
    } finally {
      setSaving(false);
    }
  };
  


  const fetchData = async () => {
    setLoading(true);
    try {
      let currentMentorDomain = mentorDomain;
      if (user?.role === 'mentor' && !currentMentorDomain) {
        const userRes = await usersAPI.userData(user.empId);
        currentMentorDomain = userRes.data.domain;
        setMentorDomain(currentMentorDomain);
      }

      const [internRes, attendanceRes, domRes] = await Promise.all([
        usersAPI.internFullList(),
        attendanceAPI.list({ start_date: selectedDate, end_date: selectedDate }),
        orgAPI.domains()
      ]);

      if (user?.role === 'mentor' && currentMentorDomain) {
        setInterns(internRes.data.filter(i => i.domain === currentMentorDomain));
      } else {
        setInterns(internRes.data);
      }

      setAttendance(attendanceRes.data);
      setDomains(domRes.data);
    } catch (e) {
      console.error('Error fetching attendance history data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Map backend status or fallback based on record / user_status
  const getTodayStatus = (intern, record) => {
    if (record) {
      if (record.status === 'present' || record.status === 'halfday') return 'present';
      if (record.status === 'absent') return 'absent';
      if (record.status === 'onleave') return 'onleave';
      return record.status;
    }
    // Fallbacks if no record exists for the selected date
    if (intern.user_status === 'yettojoin') return 'yettojoin';
    if (intern.user_status === 'completed') return 'completed';
    if (intern.user_status === 'onleave') return 'onleave';
    if (intern.user_status === 'discontinued') return 'discontinued';
    return 'absent'; // Active but no record => Absent
  };

  const getRecordForIntern = (empId) => {
    return attendance.find(record => record.emp_id === empId);
  };



  // Filter interns
  const filteredInterns = interns.filter(intern => {
    const record = getRecordForIntern(intern.emp_id);
    const todayStatus = getTodayStatus(intern, record);

    const matchesSearch = 
      (intern.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (intern.emp_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (intern.domain_name || '').toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    const matchesDomain = domainFilter === 'all' || intern.domain === domainFilter;
    if (!matchesDomain) return false;

    if (statusFilter !== 'all') {
      if (statusFilter === 'present' && todayStatus !== 'present') return false;
      if (statusFilter === 'absent' && todayStatus !== 'absent') return false;
      if (statusFilter === 'onleave' && todayStatus !== 'onleave') return false;
      if (statusFilter === 'yettojoin' && todayStatus !== 'yettojoin') return false;
      if (statusFilter === 'completed' && todayStatus !== 'completed') return false;
      if (statusFilter === 'discontinued' && todayStatus !== 'discontinued') return false;
    }

    return true;
  });

  const handleExport = () => {
    if (filteredInterns.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "Full Name",
      "Domain",
      "Scheme",
      "Start Date",
      "End Date",
      "Status on Selected Date",
      "Check-In Time",
      "Break Start",
      "Break End",
      "Check-Out Time"
    ];

    const rows = filteredInterns.map(intern => {
      const record = getRecordForIntern(intern.emp_id);
      const todayStatus = getTodayStatus(intern, record);
      
      const formatTime = (isoString) => {
        if (!isoString) return '';
        return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      };

      return [
        intern.emp_id || '',
        intern.full_name || '',
        intern.domain_name || 'N/A',
        intern.scheme ? intern.scheme.toUpperCase() : 'FREE',
        intern.start_date || '—',
        intern.end_date || '—',
        todayStatus.toUpperCase(),
        record ? formatTime(record.check_in) : '',
        record ? formatTime(record.break_start) : '',
        record ? formatTime(record.break_end) : '',
        record ? formatTime(record.check_out) : ''
      ];
    });

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `attendance_export_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderTimeline = (record, todayStatus) => {
    if (todayStatus !== 'present') {
      return null;
    }

    if (!record) return null;

    const { check_in, break_start, break_end, check_out } = record;

    const formatTime = (isoString) => {
      if (!isoString) return null;
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const tCheckIn = formatTime(check_in);
    const tBreakStart = formatTime(break_start);
    const tBreakEnd = formatTime(break_end);
    const tCheckOut = formatTime(check_out);

    const steps = [
      { label: 'Check-In', time: tCheckIn, completed: !!tCheckIn },
      { label: 'Break Start', time: tBreakStart, completed: !!tBreakStart },
      { label: 'Break End', time: tBreakEnd, completed: !!tBreakEnd },
      { label: 'Check-Out', time: tCheckOut, completed: !!tCheckOut },
    ];

    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: '260px' }}>
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <Box
                sx={{
                  flexGrow: 1,
                  height: '2px',
                  bgcolor: steps[index].completed ? 'var(--color-primary)' : 'var(--border-subtle)',
                  minWidth: '10px',
                  maxWidth: '30px',
                }}
              />
            )}
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  bgcolor: step.completed ? 'var(--color-primary)' : 'transparent',
                  border: step.completed ? 'none' : '2px solid var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {step.completed && <Box sx={{ width: 4, height: 4, borderRadius: '50%', bgcolor: '#fff' }} />}
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 0.2 }}>
                <Typography variant="caption" sx={{ fontSize: '0.65rem', fontWeight: 600, color: step.completed ? 'text.primary' : 'text.secondary', whiteSpace: 'nowrap' }}>
                  {step.label}
                </Typography>
                {step.time && (
                  <Typography variant="caption" sx={{ fontSize: '0.6rem', color: 'var(--color-primary)', fontWeight: 700 }}>
                    {step.time}
                  </Typography>
                )}
              </Box>
            </Box>
          </React.Fragment>
        ))}
      </Box>
    );
  };

  if (loading) return <LoadingSpinner text="Loading Attendance History..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Attendance History</h1>
          <p className="page-sub">Track active interns, their domains, and their daily check-in, break, and check-out timelines.</p>
        </div>
      </div>

      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        {/* Toolbar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' }, 
          p: 3, 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2 
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            flexWrap: 'wrap', 
            flex: 1, 
            width: '100%' 
          }}>
            <TextField
              size="small"
              placeholder="Search interns by name, ID, domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                }
              }}
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 200px' }, 
                width: { xs: '100%', sm: 'auto' } 
              }}
            />
            
            <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 150px' }, minWidth: { xs: '0', sm: 150 } }}>
              <InputLabel>Status Filter</InputLabel>
              <Select 
                value={statusFilter} 
                label="Status Filter" 
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="onleave">On Leave</MenuItem>
                <MenuItem value="yettojoin">Yet to Join</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="discontinued">Discontinued</MenuItem>
              </Select>
            </FormControl>

            {user?.role !== 'mentor' ? (
              <>
                <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 150px' }, minWidth: { xs: '0', sm: 150 } }}>
                  <InputLabel>Domain Filter</InputLabel>
                  <Select 
                    value={domainFilter} 
                    label="Domain Filter" 
                    onChange={(e) => setDomainFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Domains</MenuItem>
                    {domains.map(d => (
                      <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                <TextField
                  type="date"
                  size="small"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <CalendarToday fontSize="small" />
                        </InputAdornment>
                      ),
                    }
                  }}
                  sx={{ flex: { xs: '1 1 calc(100% - 56px)', sm: '0 0 200px' }, width: { xs: 'calc(100% - 56px)', sm: 'auto' } }}
                />
              </>
            ) : (
              <TextField
                type="date"
                size="small"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarToday fontSize="small" />
                      </InputAdornment>
                    ),
                  }
                }}
                sx={{ flex: { xs: '1 1 calc(100% - 56px)', sm: '0 0 200px' }, width: { xs: 'calc(100% - 56px)', sm: 'auto' } }}
              />
            )}

            <IconButton onClick={fetchData} color="primary" sx={{ border: '1px solid var(--border-subtle)', height: 40, width: 40, flexShrink: 0 }}>
              <Refresh fontSize="small" />
            </IconButton>
          </Box>

          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            flexWrap: 'wrap', 
            width: { xs: '100%', md: 'auto' } 
          }}>
            <Button 
              variant="outlined" 
              startIcon={<Download />} 
              onClick={handleExport}
              sx={{ flex: { xs: 1, sm: 'none' }, width: '100%', whiteSpace: 'nowrap' }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Desktop Table View */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Intern</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell>Today's Attendance</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInterns.length > 0 ? filteredInterns.map((row) => {
                const record = getRecordForIntern(row.emp_id);
                const todayStatus = getTodayStatus(row, record);

                return (
                  <TableRow key={row.emp_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box 
                          sx={{ 
                            width: 36, height: 36, borderRadius: '50%', 
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '0.8rem'
                          }}
                        >
                          {row.full_name?.charAt(0) || 'I'}
                        </Box>
                        <Box>
                          <Typography fontWeight={700} variant="body2">{row.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.emp_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.domain_name || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.scheme?.toUpperCase()} Scheme</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.start_date || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">To: {row.end_date || '—'}</Typography>
                    </TableCell>
                    <TableCell sx={{ verticalAlign: 'middle', py: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                        <StatusChip status={todayStatus} />
                        {renderTimeline(record, todayStatus)}
                        {user?.role === 'sme' && (
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleOpenEdit(row, record, todayStatus)}
                            sx={{ border: '1px solid var(--border-subtle)', borderRadius: '4px' }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                    <Box sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Search sx={{ fontSize: 40, opacity: 0.5 }} />
                      <Typography>No interns found matching your criteria</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
          {filteredInterns.length > 0 ? filteredInterns.map((row) => {
            const record = getRecordForIntern(row.emp_id);
            const todayStatus = getTodayStatus(row, record);
            return (
              <AttendanceCard 
                key={row.emp_id} 
                row={row} 
                record={record}
                todayStatus={todayStatus}
                userRole={user?.role}
                handleOpenEdit={handleOpenEdit}
                renderTimeline={renderTimeline}
              />
            );
          }) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No interns found matching your criteria</Typography>
            </Box>
          )}
        </Box>
      </Box>

      <Dialog 
        open={openEditDialog} 
        onClose={() => setOpenEditDialog(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '12px',
            padding: 1,
            bgcolor: 'var(--bg-surface, #fff)',
            backgroundImage: 'none',
            boxShadow: 'var(--shadow-lg)'
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 1 }}>
          Edit Attendance — {selectedIntern?.full_name} ({selectedIntern?.emp_id})
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Modify the attendance status and timestamp records for <strong>{selectedDate}</strong>.
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth>
              <InputLabel>Attendance Status</InputLabel>
              <Select
                value={editStatus}
                label="Attendance Status"
                onChange={(e) => setEditStatus(e.target.value)}
              >
                <MenuItem value="present">Present</MenuItem>
                <MenuItem value="absent">Absent</MenuItem>
                <MenuItem value="onleave">On Leave</MenuItem>
                <MenuItem value="halfday">Half Day</MenuItem>
              </Select>
            </FormControl>

            {(editStatus === 'present' || editStatus === 'halfday') && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Check-In Time"
                    type="time"
                    value={editCheckIn}
                    onChange={(e) => setEditCheckIn(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    label="Check-Out Time"
                    type="time"
                    value={editCheckOut}
                    onChange={(e) => setEditCheckOut(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                </Box>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Break Start"
                    type="time"
                    value={editBreakStart}
                    onChange={(e) => setEditBreakStart(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                  <TextField
                    label="Break End"
                    type="time"
                    value={editBreakEnd}
                    onChange={(e) => setEditBreakEnd(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    fullWidth
                  />
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, gap: 1 }}>
          <Button 
            onClick={() => setOpenEditDialog(false)} 
            variant="outlined" 
            disabled={saving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSaveEdit} 
            variant="contained" 
            color="primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
