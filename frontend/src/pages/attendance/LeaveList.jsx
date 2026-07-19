import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, Grid, TextField, InputAdornment, Chip
} from '@mui/material';
import { Search, FilterList, EventNote, FlightTakeoff, LocalHospital, Warning } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { motion } from 'framer-motion';

export default function LeaveList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const res = await attendanceAPI.leaveApprovalList();
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleAction = async (id, status) => {
    try {
      await attendanceAPI.approveLeave(id, { status, comment: `Leave ${status}` });
      fetchLeaves();
    } catch (err) {
      console.error(err);
    }
  };

  const getLeaveIcon = (type) => {
    switch(type) {
      case 'casual': return <FlightTakeoff fontSize="small" />;
      case 'sick': return <LocalHospital fontSize="small" />;
      default: return <EventNote fontSize="small" />;
    }
  };

  const filteredData = data.filter(i => 
    i.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    i.leave_type?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading Leave Requests..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Leave Management</Typography>
        <Typography variant="body2" color="text.secondary">Review and approve intern leave requests.</Typography>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <Box className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'warning.light', color: 'warning.main' }}>
              <Warning />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{data.filter(d => d.status === 'pending').length}</Typography>
              <Typography variant="body2" color="text.secondary">Pending Requests</Typography>
            </Box>
          </Box>
        </Grid>
        <Grid xs={12} sm={4}>
          <Box className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.light', color: 'success.main' }}>
              <FlightTakeoff />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>{data.filter(d => d.status === 'approved').length}</Typography>
              <Typography variant="body2" color="text.secondary">Approved Leaves</Typography>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <TextField
            size="small"
            placeholder="Search by name, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
          <Button variant="outlined" startIcon={<FilterList />} onClick={() => alert('Filter options coming soon!')}>Filter</Button>
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 400px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Leave Type</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell>Reason</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredData.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.full_name || `User ${row.user}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      icon={getLeaveIcon(row.leave_type)} 
                      label={row.leave_type ? row.leave_type.toUpperCase() : 'UNKNOWN'} 
                      size="small" 
                      color="primary" 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.start_date}</Typography>
                    <Typography variant="caption" color="text.secondary">To: {row.end_date}</Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.reason}
                  </TableCell>
                  <TableCell>
                    <StatusChip status={row.status} />
                  </TableCell>
                  <TableCell align="right">
                    {row.status === 'pending' ? (
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                        <Button size="small" variant="contained" color="success" onClick={() => handleAction(row.id, 'approved')}>
                          Approve
                        </Button>
                        <Button size="small" variant="outlined" color="error" onClick={() => handleAction(row.id, 'rejected')}>
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
                    <Typography color="text.secondary">No leave requests found.</Typography>
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
