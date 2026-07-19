import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, TextField, Button, Alert, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import { Feedback, CheckCircle } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { motion } from 'framer-motion';
import { StatusChip, LoadingSpinner } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';

export default function InternAttendanceClaims() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [claims, setClaims] = useState([]);
  
  const [formData, setFormData] = useState({
    date: '',
    reason: ''
  });

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.myClaims();
      setClaims(res.data || []);
    } catch (err) {
      console.error("Failed to load attendance claims history:", err);
      showToast('Failed to load claim history.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.date || !formData.reason) {
      setError("Date and Reason are required fields.");
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        date: formData.date,
        reason: formData.reason
      };
      await attendanceAPI.submitClaim(payload);
      showToast('Attendance claim submitted successfully!', 'success');
      setFormData({
        date: '',
        reason: ''
      });
      fetchClaims();
    } catch (err) {
      setError(err.response?.data?.error || "Failed to submit attendance claim.");
      showToast('Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && claims.length === 0) return <LoadingSpinner text="Loading claims..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Attendance Claims</Typography>
        <Typography variant="body2" color="text.secondary">Request punch corrections for missed timings or absent logs.</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Claim Form */}
        <Grid item xs={12} md={5}>
          <Box className="glass-card" sx={{ p: 4 }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
              <Feedback color="primary" /> Submit Correction Request
            </Typography>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Date of Correction"
                name="date"
                type="date"
                size="small"
                value={formData.date}
                onChange={handleChange}
                slotProps={{ inputLabel: { shrink: true } }}
                fullWidth
                required
              />

              <TextField
                label="Reason for Claim"
                name="reason"
                multiline
                rows={3}
                size="small"
                placeholder="Explain why you are requesting this punch correction..."
                value={formData.reason}
                onChange={handleChange}
                fullWidth
                required
              />

              <Button 
                variant="contained" 
                color="primary"
                onClick={handleSubmit}
                disabled={submitting}
                fullWidth
                sx={{ py: 1 }}
              >
                {submitting ? 'Submitting...' : 'Submit Claim'}
              </Button>
            </Box>
          </Box>
        </Grid>

        {/* History List */}
        <Grid item xs={12} md={7}>
          <Box className="glass-card" sx={{ p: 0, overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, borderBottom: '1px solid var(--border-subtle)' }}>
              <Typography variant="h6" fontWeight={700}>My Claim History</Typography>
            </Box>
            
            <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', flexGrow: 1, maxHeight: 420 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Review Comment</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {claims.map((row) => (
                    <TableRow key={row.id} hover>
                      <TableCell sx={{ fontWeight: 600 }}>{row.date}</TableCell>
                      <TableCell sx={{ maxWidth: 200, wordWrap: 'break-word' }}>
                        {row.reason}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={row.status} />
                      </TableCell>
                      <TableCell sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                        {row.reviewer_comment || '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {claims.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No attendance claims submitted yet.</Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Grid>
      </Grid>
    </motion.div>
  );
}
