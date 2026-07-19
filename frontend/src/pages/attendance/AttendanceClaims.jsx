import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, InputAdornment, Grid
} from '@mui/material';
import { Search, AssignmentLate, Warning } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { motion } from 'framer-motion';
import { useToast } from '../../contexts/ToastContext';

export default function AttendanceClaims() {
  const { showToast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchClaims = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.pendingClaims();
      // If endpoint doesn't return list, fallback to claims list
      setData(res.data || []);
    } catch (err) {
      console.error(err);
      // Fallback
      try {
        const res2 = await attendanceAPI.claims();
        setData(res2.data || []);
      } catch (e) {
        console.error(e);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClaims();
  }, []);

  const handleAction = async (id, isApprove) => {
    try {
      if (isApprove) {
        await attendanceAPI.approveClaim(id);
        showToast('Claim approved successfully!', 'success');
      } else {
        const rejectReason = prompt('Enter reason for rejection:') || 'Rejected by reviewer';
        await attendanceAPI.rejectClaim(id, { reason: rejectReason });
        showToast('Claim rejected.', 'info');
      }
      fetchClaims();
    } catch (err) {
      console.error(err);
      showToast('Failed to update claim status.', 'error');
    }
  };

  const filteredData = data.filter(i => 
    i.user_name?.toLowerCase().includes(search.toLowerCase()) || 
    i.date?.includes(search)
  );

  if (loading) return <LoadingSpinner text="Loading Claims..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Attendance Claims</Typography>
        <Typography variant="body2" color="text.secondary">Review and approve attendance correction requests.</Typography>
      </Box>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name, date..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 250px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Original Status</TableCell>
                <TableCell>Reason for Claim</TableCell>
                <TableCell>Claim Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.user_name || `User ${row.user}`}</Typography>
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>
                    <Typography variant="caption" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <Warning fontSize="small" /> Missed Punch / Absent
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.reason}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell align="right">
                    {row.status === 'pending' ? (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" color="success" onClick={() => handleAction(row.id, true)}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleAction(row.id, false)}>
                          Reject
                        </Button>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="text.secondary">
                        {row.status.toUpperCase()}
                      </Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <AssignmentLate sx={{ fontSize: 40, opacity: 0.5 }} />
                      <Typography>No pending attendance claims found.</Typography>
                    </Box>
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
