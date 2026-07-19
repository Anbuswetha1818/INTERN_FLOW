import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Button, Divider, TextField, CircularProgress, Alert
} from '@mui/material';
import { PlayArrow, Stop, LocalCafe } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { motion } from 'framer-motion';

export default function AttendanceManagement() {
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Clock state
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.myAttendance();
      // Usually returns list, find today's record
      const todayStr = new Date().toISOString().split('T')[0];
      const todayRecord = res.data.find(r => r.date === todayStr);
      setAttendance(todayRecord || null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyAttendance();
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    setError('');
    try {
      await attendanceAPI.checkIn();
      await fetchMyAttendance();
    } catch (err) {
      setError(err.response?.data?.error || "Check-in failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    setError('');
    try {
      await attendanceAPI.checkOut();
      await fetchMyAttendance();
    } catch (err) {
      setError(err.response?.data?.error || "Check-out failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakToggle = async () => {
    setActionLoading(true);
    setError('');
    try {
      if (attendance?.break_start && !attendance?.break_end) {
        await attendanceAPI.breakEnd();
      } else {
        await attendanceAPI.breakStart();
      }
      await fetchMyAttendance();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to log break.");
    } finally {
      setActionLoading(false);
    }
  };

  const isCheckedIn = !!attendance?.check_in;
  const isCheckedOut = !!attendance?.check_out;
  const isOnBreak = !!attendance?.break_start && !attendance?.break_end;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Attendance Management</Typography>
        <Typography variant="body2" color="text.secondary">Log your daily working hours.</Typography>
      </Box>

      <Alert severity="warning" sx={{ mb: 3 }}>
        <strong>Important:</strong> You can only Check In and Check Out <strong>once per day</strong>. Please use carefully.
      </Alert>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Grid container spacing={4}>
        {/* Clock & Controls */}
        <Grid xs={12} md={6}>
          <Box className="glass-card" sx={{ p: 4, textAlign: 'center', height: '100%' }}>
            <Typography variant="h6" color="text.secondary" mb={1}>
              {time.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </Typography>
            <Typography variant="h2" fontWeight={800} sx={{ 
              fontFamily: 'monospace', mb: 4,
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {time.toLocaleTimeString()}
            </Typography>

            {loading ? (
              <CircularProgress />
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, maxWidth: 300, mx: 'auto' }}>
                {!isCheckedIn ? (
                  <Button 
                    variant="contained" 
                    color="primary" 
                    size="large" 
                    fullWidth 
                    startIcon={<PlayArrow />}
                    onClick={handleCheckIn}
                    disabled={actionLoading}
                    sx={{ py: 1.5, fontSize: '1.1rem' }}
                  >
                    Check In
                  </Button>
                ) : (
                  <>
                    <Button 
                      variant="contained" 
                      color="error" 
                      size="large" 
                      fullWidth 
                      startIcon={<Stop />}
                      onClick={handleCheckOut}
                      disabled={actionLoading || isCheckedOut}
                      sx={{ py: 1.5, fontSize: '1.1rem' }}
                    >
                      Check Out
                    </Button>
                    
                      <Button 
                        variant="outlined" 
                        color="warning" 
                        size="large" 
                        fullWidth 
                        startIcon={<LocalCafe />}
                        onClick={handleBreakToggle}
                        disabled={actionLoading || isCheckedOut || !!attendance?.break_end}
                        sx={{ py: 1.5 }}
                      >
                        {attendance?.break_end ? "Break Taken" : (isOnBreak ? "End Break" : "Start Break")}
                      </Button>
                  </>
                )}
              </Box>
            )}
            
            {isCheckedOut && (
              <Typography color="success.main" mt={3} fontWeight={600}>
                You have successfully checked out for the day.
              </Typography>
            )}
          </Box>
        </Grid>

        {/* Today's Log */}
        <Grid xs={12} md={6}>
          <Box className="glass-card" sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Today's Log</Typography>
            
            {!attendance ? (
              <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                <Typography>You haven't checked in yet today.</Typography>
              </Box>
            ) : (
              <Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                       <PlayArrow color="primary" />
                       <Typography variant="body1" fontWeight={600} color="text.secondary">Check In</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {attendance.check_in ? new Date(attendance.check_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                       <LocalCafe color="warning" />
                       <Typography variant="body1" fontWeight={600} color="text.secondary">Break Start</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {attendance.break_start ? new Date(attendance.break_start).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                       <LocalCafe sx={{ color: 'text.disabled' }} />
                       <Typography variant="body1" fontWeight={600} color="text.secondary">Break End</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {attendance.break_end ? new Date(attendance.break_end).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </Typography>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, bgcolor: 'background.default', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                       <Stop color="error" />
                       <Typography variant="body1" fontWeight={600} color="text.secondary">Check Out</Typography>
                    </Box>
                    <Typography variant="h6" fontWeight={700}>
                      {attendance.check_out ? new Date(attendance.check_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '--:--'}
                    </Typography>
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Total Hours</Typography>
                  <Typography variant="h4" fontWeight={800} color="primary.main">
                    {attendance.total_hours} <Typography component="span" variant="body1" color="text.secondary">hrs</Typography>
                  </Typography>
                </Box>
              </Box>
            )}
          </Box>
        </Grid>
      </Grid>
    </motion.div>
  );
}
