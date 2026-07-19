import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Chip, Grid, TextField, InputAdornment,
  Tabs, Tab, Snackbar, Alert, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { Search, FilterList, Download, CheckCircle, Block, Email } from '@mui/icons-material';
import { onboardingAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { motion } from 'framer-motion';

export default function OnboardingList({ isCombined }) {
  const [onboardingData, setOnboardingData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [processingId, setProcessingId] = useState(null);
  
  // Snackbar state
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const showToast = (message, severity = 'success') => setToast({ open: true, message, severity });
  const handleCloseToast = () => setToast(prev => ({ ...prev, open: false }));

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await onboardingAPI.list();
      setOnboardingData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleApprove = async (id, email) => {
    if (processingId) return;
    setProcessingId(id);
    try {
      const res = await onboardingAPI.enable(id, { action: 'approve' });
      const empId = res.data.emp_id;
      await onboardingAPI.sendCredentials(empId); // Send email trigger using the newly created emp_id
      showToast('Application approved successfully!', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error approving application.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id) => {
    if (processingId) return;
    if (!window.confirm('Are you sure you want to reject this application?')) return;
    
    setProcessingId(id);
    try {
      await onboardingAPI.enable(id, { action: 'reject' });
      showToast('Application rejected successfully.', 'info');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Error rejecting application.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const handleResend = async (empId) => {
    if (!empId) {
      showToast('Cannot resend. Employee ID not found.', 'error');
      return;
    }
    if (processingId) return;
    setProcessingId(empId);
    try {
      await onboardingAPI.sendCredentials(empId);
      showToast('Credentials resent successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Error resending credentials.', 'error');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredData = onboardingData.filter(i => {
    const matchesSearch = 
      i.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      i.email?.toLowerCase().includes(search.toLowerCase());
      
    if (!matchesSearch) return false;
    
    switch (tabValue) {
      case 0: return i.status === 'pending';
      case 1: return i.status === 'approved';
      case 2: return i.status === 'rejected';
      case 3: return true; // All
      default: return true;
    }
  });

  if (loading) return <LoadingSpinner text="Loading Onboarding Requests..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {!isCombined && (
        <Box className="page-header" sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={800}>Onboarding Approvals</Typography>
          <Typography variant="body2" color="text.secondary">Review incoming intern applications and send credentials.</Typography>
        </Box>
      )}

      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>


        {/* Toolbar */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center', p: 3, flexWrap: 'wrap', gap: 2 }}>
            <TextField
              size="small"
              placeholder="Search by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                }
              }}
              sx={{ minWidth: 300 }}
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select value={tabValue} label="Status Filter" onChange={(e) => setTabValue(e.target.value)}>
                <MenuItem value={0}>Pending ({onboardingData.filter(i => i.status === 'pending').length})</MenuItem>
                <MenuItem value={1}>Approved ({onboardingData.filter(i => i.status === 'approved').length})</MenuItem>
                <MenuItem value={2}>Rejected ({onboardingData.filter(i => i.status === 'rejected').length})</MenuItem>
                <MenuItem value={3}>All ({onboardingData.length})</MenuItem>
              </Select>
            </FormControl>
          </Box>
        
        {/* Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Applicant Details</TableCell>
                <TableCell>Academics</TableCell>
                <TableCell>Internship Config</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.length > 0 ? filteredData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.full_name}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.email} | {row.phone}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.degree} - {row.college_department}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.college_name} ({row.year_of_passing})</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.domain_name || 'No Domain'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.start_date} to {row.end_date} | {row.scheme?.toUpperCase()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell align="right">
                    {row.status === 'pending' ? (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button 
                          size="small" 
                          variant="contained" 
                          color="success" 
                          startIcon={<CheckCircle />}
                          onClick={() => handleApprove(row.id, row.email)}
                          disabled={processingId === row.id}
                        >
                          {processingId === row.id ? 'Approving...' : 'Approve'}
                        </Button>
                        <Button 
                          size="small" 
                          variant="outlined" 
                          color="error" 
                          startIcon={<Block />}
                          onClick={() => handleReject(row.id)}
                          disabled={processingId === row.id}
                        >
                          Reject
                        </Button>
                      </Box>
                    ) : row.status === 'approved' ? (
                      <Button 
                        size="small" 
                        variant="outlined" 
                        startIcon={<Email />}
                        onClick={() => handleResend(row.emp_id)}
                        disabled={processingId === row.emp_id}
                      >
                        Resend Credentials
                      </Button>
                    ) : (
                      <Typography variant="caption" color="text.secondary">—</Typography>
                    )}
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No applications found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Snackbar 
        open={toast.open} 
        autoHideDuration={4000} 
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}
