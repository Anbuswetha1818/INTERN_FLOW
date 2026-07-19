import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, InputAdornment, Chip
} from '@mui/material';
import { Add, Search, FilterList, AccountBalanceWallet, RequestQuote, CheckCircle } from '@mui/icons-material';
import { payrollAPI } from '../../services/api';
import { LoadingSpinner, StatusChip, StatCard } from '../../components/common';
import { motion } from 'framer-motion';

export default function PaymentManagement() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const res = await payrollAPI.payments();
      setPayments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => 
    p.transaction_id?.toLowerCase().includes(search.toLowerCase()) || 
    p.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCollected = payments.filter(p => p.status === 'completed' && p.payment_type === 'fee_payment')
                                 .reduce((sum, p) => sum + parseFloat(p.amount), 0);
  
  const totalStipend = payments.filter(p => p.status === 'completed' && p.payment_type === 'stipend')
                               .reduce((sum, p) => sum + parseFloat(p.amount), 0);

  if (loading) return <LoadingSpinner text="Loading Payments..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Payment Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage intern fees, stipends, and transactions.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>Record Payment</Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <StatCard label="Total Fees Collected" value={`₹${totalCollected.toLocaleString()}`} color="#22c55e" icon={<AccountBalanceWallet />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Stipends Disbursed" value={`₹${totalStipend.toLocaleString()}`} color="#3b82f6" icon={<RequestQuote />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Pending Transactions" value={payments.filter(p => p.status === 'pending').length} color="#f59e0b" icon={<CheckCircle />} />
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by ID or User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<FilterList />} onClick={() => alert('Filter options coming soon!')}>Filter</Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Transaction ID</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPayments.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.transaction_id || `TXN-${row.id}`}</Typography>
                    <Typography variant="caption" color="text.secondary">Via {row.payment_method || 'Offline'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.user_name || `User ${row.user}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.payment_type.replace('_', ' ').toUpperCase()} 
                      size="small" 
                      color={row.payment_type === 'fee_payment' ? 'success' : 'info'} 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700}>₹{parseFloat(row.amount).toLocaleString()}</Typography>
                  </TableCell>
                  <TableCell>{row.payment_date ? new Date(row.payment_date).toLocaleDateString() : '—'}</TableCell>
                  <TableCell><StatusChip status={row.status} /></TableCell>
                  <TableCell align="right">
                    <Button size="small">View Receipt</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No transactions found.</Typography>
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
