import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, IconButton, Button, CircularProgress
} from '@mui/material';
import { CheckCircle, Timer, EventNote, Schedule, Refresh, FilterList } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { StatCard, LoadingSpinner, StatusChip } from '../../components/common';
import { motion } from 'framer-motion';

export default function DailyAttendance() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ present: 0, absent: 0, onLeave: 0, total: 0 });

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.list();
      setData(res.data);
      
      // Calculate basic stats for today
      const todayStr = new Date().toISOString().split('T')[0];
      const todayData = res.data.filter(r => r.date === todayStr);
      
      const present = todayData.filter(r => r.status === 'present' || r.status === 'half-day').length;
      const absent = todayData.filter(r => r.status === 'absent').length;
      // Real app would fetch leave count from leave API, mock for now
      const total = res.data.length || 0; // rough total if no pagination
      
      setStats({ present, absent, onLeave: 2, total: present + absent + 2 });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Attendance..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Daily Attendance</Typography>
          <Typography variant="body2" color="text.secondary">Monitor today's check-ins and hours tracking.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FilterList />} onClick={() => alert('Filter options coming soon!')}>Filter</Button>
          <Button variant="contained" startIcon={<Refresh />} onClick={fetchAttendance}>Refresh</Button>
        </Box>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={6} md={3}>
          <Box className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.main' }}>
              <CheckCircle />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{stats.present}</Typography>
              <Typography variant="body2" color="text.secondary">Present Today</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Box className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'error.light', color: 'error.main' }}>
              <Timer />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{stats.absent}</Typography>
              <Typography variant="body2" color="text.secondary">Absent</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Box className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.light', color: 'info.main' }}>
              <EventNote />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{stats.onLeave}</Typography>
              <Typography variant="body2" color="text.secondary">On Leave</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <Box className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.main' }}>
              <Schedule />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{Math.round((stats.present / (stats.total || 1)) * 100)}%</Typography>
              <Typography variant="body2" color="text.secondary">Attendance Rate</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Check In</TableCell>
                <TableCell>Check Out</TableCell>
                <TableCell>Breaks</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.user_name || `User ${row.user}`}</Typography>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.check_in ? new Date(row.check_in).toLocaleTimeString() : '—'}</TableCell>
                  <TableCell>{row.check_out ? new Date(row.check_out).toLocaleTimeString() : '—'}</TableCell>
                  <TableCell>
                    {row.break_start ? (
                      <Typography variant="caption" color="warning.main">
                        On Break ({new Date(row.break_start).toLocaleTimeString()})
                      </Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">None</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={600} color={row.total_hours >= 8 ? 'success.main' : 'warning.main'}>
                      {row.total_hours} hrs
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No attendance records found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </motion.div>
  );
}
