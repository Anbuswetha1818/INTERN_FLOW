import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { CloudUpload, QrCode } from '@mui/icons-material';
import QRCode from 'react-qr-code';
import { useAuth } from '../../contexts/AuthContext';
import { feesAPI } from '../../services/api';

export default function PaymentStatusPage() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(true);

  const [payDialog, setPayDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  
  const [transactionId, setTransactionId] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const res = await feesAPI.byUser(user.empId);
      setPayments(res.data.payments);
      setUpiId(res.data.company_upi_id);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPay = (payment) => {
    setSelectedPayment(payment);
    setTransactionId('');
    setScreenshot(null);
    setPayDialog(true);
  };

  const handleSubmitPayment = async () => {
    if (!transactionId && !screenshot) return alert('Please provide either a Transaction ID or upload a screenshot.');
    setSubmitting(true);
    const formData = new FormData();
    if (transactionId) formData.append('transaction_id', transactionId);
    if (screenshot) formData.append('screenshot', screenshot);

    try {
      await feesAPI.submit(selectedPayment.id, formData);
      setPayDialog(false);
      fetchPayments();
    } catch (e) {
      console.error(e);
      alert('Failed to submit payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'paid': return 'success';
      case 'submitted': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Fee Payments</Typography>
        <Typography variant="body2" color="text.secondary">
          Track your fee payments, upload receipts, and view payment history.
        </Typography>
      </Box>

      {loading ? (
        <CircularProgress sx={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <Paper className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date / Cycle</TableCell>
                  <TableCell>Payment Type</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>No payment records found.</TableCell>
                  </TableRow>
                ) : (
                  payments.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>
                          {row.due_date || new Date(row.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {row.payment_type === 'part' ? (
                          <Chip label={`Installment ${row.installment_number}`} size="small" color="secondary" variant="outlined" />
                        ) : (
                          <Chip label="Full Payment" size="small" color="primary" variant="outlined" />
                        )}
                      </TableCell>
                      <TableCell>₹{row.amount}</TableCell>
                      <TableCell>
                        <Chip 
                          label={row.status.toUpperCase()} 
                          size="small" 
                          color={getStatusColor(row.status)} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        {(row.status === 'pending' || row.status === 'overdue') && (
                          <Button variant="contained" size="small" onClick={() => handleOpenPay(row)}>
                            Pay Now
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Pay Dialog */}
      <Dialog open={payDialog} onClose={() => !submitting && setPayDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Make a Payment</DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" mb={2}>Amount Due: ₹{selectedPayment.amount}</Typography>
              
              {upiId ? (
                <Box sx={{ p: 3, bgcolor: '#fff', borderRadius: 2, display: 'inline-block', border: '1px solid #ddd', mb: 3 }}>
                  <QRCode value={`upi://pay?pa=${upiId}&pn=InternFlow&am=${selectedPayment.amount}&cu=INR`} size={180} />
                  <Typography variant="body2" mt={2} color="text.secondary">Scan to pay with any UPI App</Typography>
                  <Typography variant="caption" display="block" fontWeight="bold">{upiId}</Typography>
                </Box>
              ) : (
                <Box sx={{ p: 3, bgcolor: 'background.paper', borderRadius: 2, border: '1px solid #ddd', mb: 3 }}>
                  <Typography color="error">UPI ID is not configured by the institution yet.</Typography>
                </Box>
              )}

              <Typography variant="subtitle1" fontWeight="bold" align="left" gutterBottom>Submit Payment Proof</Typography>
              <TextField
                fullWidth
                label="Transaction / UTR Number"
                variant="outlined"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                sx={{ mb: 3 }}
              />

              <Button
                component="label"
                variant="outlined"
                startIcon={<CloudUpload />}
                fullWidth
                sx={{ py: 1.5, borderStyle: 'dashed' }}
              >
                {screenshot ? screenshot.name : 'Upload Screenshot (Optional)'}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => setScreenshot(e.target.files[0])}
                />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPayDialog(false)} disabled={submitting}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmitPayment} disabled={submitting || (!transactionId && !screenshot)}>
            {submitting ? 'Submitting...' : 'Submit Proof'}
          </Button>
        </DialogActions>
      </Dialog>

    </motion.div>
  );
}
