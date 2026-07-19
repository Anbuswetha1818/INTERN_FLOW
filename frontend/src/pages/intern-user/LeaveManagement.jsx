import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, TextField, Button, MenuItem, Stepper, Step, StepLabel, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, IconButton
} from '@mui/material';
import { DateRange, CheckCircle, Delete } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

export default function LeaveManagement() {
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [leaves, setLeaves] = useState([]);
  
  const [formData, setFormData] = useState({
    leave_type: 'casual',
    start_date: '',
    end_date: '',
    reason: ''
  });

  const fetchLeaves = async () => {
    try {
      const res = await attendanceAPI.leaveHistory();
      setLeaves(res.data);
    } catch (err) {
      console.error("Failed to load leave history:", err);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date || !formData.reason) {
      setError("Please fill out all fields.");
      return;
    }
    setLoading(true);
    setError('');
    try {
      await attendanceAPI.requestLeave(formData);
      setActiveStep(1);
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit leave request.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLeave = async (id) => {
    if (!window.confirm("Are you sure you want to cancel this leave request?")) return;
    setLoading(true);
    try {
      await attendanceAPI.cancelLeave(id);
      fetchLeaves();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to cancel leave request.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'rejected': return 'error';
      case 'pending': return 'warning';
      default: return 'default';
    }
  };

  // An intern is considered to have a mentor if any of their projects has a team_lead assigned
  const hasMentor = user?.projects_info?.some(p => p.team_lead__full_name);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Apply for Leave</Typography>
        <Typography variant="body2" color="text.secondary">Request time off and view your leave history.</Typography>
      </Box>

      <Box className="glass-card" sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 3 }}>New Request</Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
          <Step><StepLabel>Details</StepLabel></Step>
          <Step><StepLabel>Confirmation</StepLabel></Step>
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
        
        {!hasMentor && activeStep === 0 && (
          <Alert severity="warning" sx={{ mb: 3 }}>
            You cannot apply for leave because you are not currently assigned to a mentor. Please contact your administrator.
          </Alert>
        )}

        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid xs={12} md={4}>
              <TextField select fullWidth label="Leave Type" name="leave_type" value={formData.leave_type} onChange={handleChange} disabled={!hasMentor}>
                <MenuItem value="casual">Casual Leave</MenuItem>
                <MenuItem value="sick">Sick Leave</MenuItem>
                <MenuItem value="personal">Personal Leave</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6} md={4}>
              <TextField fullWidth label="Start Date" type="date" slotProps={{ inputLabel: { shrink: true } }} name="start_date" value={formData.start_date} onChange={handleChange} required disabled={!hasMentor} />
            </Grid>
            <Grid xs={12} sm={6} md={4}>
              <TextField fullWidth label="End Date" type="date" slotProps={{ inputLabel: { shrink: true } }} name="end_date" value={formData.end_date} onChange={handleChange} required disabled={!hasMentor} />
            </Grid>
            <Grid xs={12}>
              <TextField fullWidth multiline rows={2} label="Reason" name="reason" value={formData.reason} onChange={handleChange} required disabled={!hasMentor} />
            </Grid>
            <Grid xs={12} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="contained" size="large" onClick={handleSubmit} disabled={loading || !hasMentor} startIcon={<DateRange />}>
                Submit Request
              </Button>
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} mb={1}>Request Submitted</Typography>
            <Typography color="text.secondary" mb={4}>Your leave request has been sent to your mentor for approval.</Typography>
            <Button variant="outlined" onClick={() => {
              setFormData({ leave_type: 'casual', start_date: '', end_date: '', reason: '' });
              setActiveStep(0);
            }}>
              Submit Another Request
            </Button>
          </Box>
        )}
      </Box>

      {/* Leave History Table */}
      <Typography variant="h6" fontWeight={800} sx={{ mb: 2 }}>Leave History</Typography>
      <TableContainer component={Paper} className="glass-card" elevation={0}>
        <Table>
          <TableHead sx={{ bgcolor: 'var(--color-background-muted)' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Duration</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Reason</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Applied On</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 700, textAlign: 'right' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leaves.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No leave requests found.
                </TableCell>
              </TableRow>
            ) : (
              leaves.map(leave => (
                <TableRow key={leave.id}>
                  <TableCell sx={{ textTransform: 'capitalize' }}>{leave.leave_type}</TableCell>
                  <TableCell>{new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}</TableCell>
                  <TableCell>{leave.reason}</TableCell>
                  <TableCell>{new Date(leave.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip size="small" label={leave.status} color={getStatusColor(leave.status)} sx={{ textTransform: 'capitalize' }} />
                  </TableCell>
                  <TableCell align="right">
                    {leave.status === 'pending' && (
                      <IconButton size="small" color="error" onClick={() => handleDeleteLeave(leave.id)} disabled={loading}>
                        <Delete fontSize="small" />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </motion.div>
  );
}
