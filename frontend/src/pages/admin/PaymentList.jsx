import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Chip, TextField, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Link, CircularProgress, FormControl, InputLabel, Select, MenuItem,
  Grid
} from '@mui/material';
import { Search, CheckCircle, ReceiptLong, Close, QrCode, Download, Upload } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { CSVLink } from 'react-csv';
import { feesAPI, usersAPI, orgAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import QRCode from 'react-qr-code';

function PaymentCard({ row, canEdit, getStatusColor, handleOpenVerify }) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {row.full_name || row.emp_id}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.emp_id}
          </Typography>
        </Box>
        {canEdit && (
          <IconButton size="small" color="primary" title="View details" onClick={() => handleOpenVerify(row)} sx={{ border: '1px solid var(--border-subtle)', borderRadius: '4px' }}>
            <ReceiptLong fontSize="small" />
          </IconButton>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Payment Type</Typography>
          <Box sx={{ mt: 0.5 }}>
            {row.payment_type === 'part' ? (
              <Chip label={`Installment ${row.installment_number}`} size="small" color="secondary" variant="outlined" />
            ) : (
              <Chip label="Full Payment" size="small" color="primary" variant="outlined" />
            )}
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip 
              label={row.status.toUpperCase()} 
              size="small" 
              color={getStatusColor(row.status)} 
              variant="outlined"
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Amount</Typography>
          <Typography variant="body2" fontWeight={700}>₹{row.amount}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Transaction ID</Typography>
          <Typography fontWeight={700} variant="body2" color="primary" sx={{ wordBreak: 'break-all' }}>
            {row.transaction_id || '-'}
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function PaymentList() {
  const { user, permissions } = useAuth();
  const { showToast } = useToast();
  const canEdit = user?.role === 'sme' || !!permissions?.canManagePaymentStatus;
  
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [verifyDialog, setVerifyDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [importing, setImporting] = useState(false);

  // Request Payment Dialog States
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [interns, setInterns] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);
  const [selectedInternEmpId, setSelectedInternEmpId] = useState('');
  const [selectedStructureId, setSelectedStructureId] = useState('');
  const [amount, setAmount] = useState('');
  const [paymentType, setPaymentType] = useState('full');
  const [installmentNum, setInstallmentNum] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // QR Code / UPI Config States
  const [configUpiId, setConfigUpiId] = useState('');
  const [updatingConfig, setUpdatingConfig] = useState(false);
  const [testAmount, setTestAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const payRes = await feesAPI.list();
      setPayments(payRes.data);

      if (user?.role === 'sme' && user?.entityId) {
        const configRes = await orgAPI.entityConfig(user.entityId);
        setConfigUpiId(configRes.data.company_upi_id || '');
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load transaction or configuration data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveUpiId = async () => {
    if (!user?.entityId) return;
    setUpdatingConfig(true);
    try {
      await orgAPI.updateEntityConfig(user.entityId, { company_upi_id: configUpiId });
      showToast('UPI configuration saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast('Failed to save UPI configuration.', 'error');
    } finally {
      setUpdatingConfig(false);
    }
  };

  const handleOpenVerify = (payment) => {
    setSelectedPayment(payment);
    setVerifyDialog(true);
  };

  const handleVerify = async (status) => {
    try {
      await feesAPI.update(selectedPayment.id, { status });
      showToast(`Payment marked as ${status}.`, 'success');
      setVerifyDialog(false);
      fetchData();
    } catch (e) {
      console.error(e);
      showToast('Failed to update payment status.', 'error');
    }
  };

  const handleOpenRequestDialog = async () => {
    try {
      setSelectedInternEmpId('');
      setSelectedStructureId('');
      setAmount('');
      setPaymentType('full');
      setInstallmentNum(1);
      setDueDate('');

      const [internRes, structRes] = await Promise.all([
        usersAPI.internFullList(),
        feesAPI.feeStructures()
      ]);

      let list = internRes.data || [];
      if (user?.role !== 'superadmin' && user?.entityId) {
        list = list.filter(i => String(i.entity) === String(user.entityId) || String(i.entity_id) === String(user.entityId));
      }
      setInterns(list);
      setFeeStructures(structRes.data || []);
      setOpenRequestDialog(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to load request dialog parameters.', 'error');
    }
  };

  const handleStructureChange = (id) => {
    setSelectedStructureId(id);
    const selected = feeStructures.find(fs => fs.id === id);
    if (selected) {
      setAmount(selected.amount);
    }
  };

  const handleCreateRequest = async () => {
    if (!selectedInternEmpId) {
      showToast('Please select an intern.', 'warning');
      return;
    }
    if (!amount || Number(amount) <= 0) {
      showToast('Please enter a valid amount.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        emp_id: selectedInternEmpId,
        amount: Number(amount),
        payment_type: paymentType,
        installment_number: paymentType === 'part' ? Number(installmentNum) : 1,
        status: 'pending',
        due_date: dueDate || null
      };
      if (selectedStructureId) {
        payload.fee_structure = selectedStructureId;
      }

      await feesAPI.create(payload);
      showToast('Payment request created successfully!', 'success');
      setOpenRequestDialog(false);
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to create payment request.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await feesAPI.bulkImport(formData);
      showToast(`Import complete! Imported: ${res.data.imported}, Duplicates: ${res.data.duplicates}, Errors: ${res.data.errors}`, 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.error || 'Failed to import payments.', 'error');
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset input
    }
  };



  const filtered = payments.filter(p => 
    (p.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
    (p.transaction_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'success';
      case 'submitted': return 'info';
      case 'pending': return 'warning';
      case 'overdue': return 'error';
      default: return 'default';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-head">
        <div>
          <div className="page-title-row">
            <QrCode sx={{ color: '#f59e0b', fontSize: 28 }} />
            <h1 className="page-title">Fee & Payment Management</h1>
          </div>
          <p className="page-sub">Configure payment settings and verify intern fee submissions.</p>
        </div>
      </div>

      {user?.role === 'sme' && (
        <Box className="glass-card" sx={{ p: 3, mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>UPI QR Code Configuration</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Configure the primary UPI ID for your entity and optionally preview the QR Code with a specific amount.
          </Typography>
          <Box sx={{ display: 'flex', gap: 4, alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <Box sx={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <TextField
                label="Company UPI ID"
                size="small"
                value={configUpiId}
                onChange={(e) => setConfigUpiId(e.target.value)}
                placeholder="e.g. company@bank"
                fullWidth
              />
              <TextField
                label="Preview Amount (Optional, ₹)"
                type="number"
                size="small"
                value={testAmount}
                onChange={(e) => setTestAmount(e.target.value)}
                placeholder="e.g. 5000"
                fullWidth
              />
              <Button
                variant="contained"
                color="primary"
                onClick={handleSaveUpiId}
                disabled={updatingConfig}
                sx={{ alignSelf: 'flex-start', mt: 1 }}
              >
                {updatingConfig ? 'Saving...' : 'Save Configuration'}
              </Button>
            </Box>
            {configUpiId && (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2, bgcolor: '#fff', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                <QRCode 
                  value={`upi://pay?pa=${configUpiId}&pn=InternFlow${testAmount ? `&am=${testAmount}` : ''}&cu=INR`} 
                  size={140} 
                />
                <Typography variant="caption" sx={{ mt: 1.5, fontWeight: 700, color: '#444', wordBreak: 'break-all', textAlign: 'center', maxWidth: '140px' }}>
                  {configUpiId}
                </Typography>
                {testAmount && (
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'var(--color-primary)' }}>
                    Amount: ₹{testAmount}
                  </Typography>
                )}
              </Box>
            )}
          </Box>
        </Box>
      )}

      <Box className="glass-card" sx={{ p: 3 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' }, 
          mb: 3, 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2 
        }}>
          <TextField
            size="small"
            placeholder="Search by ID or Intern Name..."
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
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            flexWrap: 'wrap', 
            width: { xs: '100%', md: 'auto' } 
          }}>
            <Button 
              variant="outlined" 
              startIcon={<Upload />} 
              onClick={() => document.getElementById('payment-csv-upload').click()}
              disabled={importing}
              sx={{ flex: { xs: 1, sm: 'none' }, whiteSpace: 'nowrap' }}
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </Button>
            <input type="file" id="payment-csv-upload" hidden accept=".csv" onChange={handleFileChange} />
            
            <CSVLink 
              data={payments.filter(p => 
                (p.full_name || p.intern_name || '').toLowerCase().includes(search.toLowerCase()) ||
                p.emp_id?.toLowerCase().includes(search.toLowerCase())
              )} 
              filename="payments_export.csv" 
              style={{ textDecoration: 'none', flex: 1, display: 'inline-block' }}
            >
              <Button variant="outlined" startIcon={<Download />} sx={{ width: '100%', whiteSpace: 'nowrap' }}>
                Export CSV
              </Button>
            </CSVLink>
            {user?.role === 'sme' && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleOpenRequestDialog}
                sx={{ flex: { xs: '1 1 100%', sm: 'none' }, whiteSpace: 'nowrap' }}
              >
                Request Payment
              </Button>
            )}
          </Box>
        </Box>
        
        {/* Desktop Table View */}
        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', display: { xs: 'none', md: 'block' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Intern Name</TableCell>
                <TableCell>Payment Type</TableCell>
                <TableCell>Transaction ID</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
                {canEdit && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} align="center"><CircularProgress size={30} sx={{ my: 2 }} /></TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEdit ? 6 : 5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No transactions found.</Typography>
                  </TableCell>
                </TableRow>
              ) : filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{row.full_name || row.emp_id}</Typography>
                    <Typography variant="caption" color="text.secondary">{row.emp_id}</Typography>
                  </TableCell>
                  <TableCell>
                    {row.payment_type === 'part' ? (
                      <Chip label={`Installment ${row.installment_number}`} size="small" color="secondary" variant="outlined" />
                    ) : (
                      <Chip label="Full Payment" size="small" color="primary" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2" color="primary">{row.transaction_id || '-'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>₹{row.amount}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status.toUpperCase()} 
                      size="small" 
                      color={getStatusColor(row.status)} 
                      variant="outlined"
                    />
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <IconButton size="small" color="primary" title="View details" onClick={() => handleOpenVerify(row)}>
                        <ReceiptLong fontSize="small" />
                      </IconButton>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={30} />
            </Box>
          ) : filtered.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No transactions found.</Typography>
            </Box>
          ) : filtered.map((row) => (
            <PaymentCard 
              key={row.id} 
              row={row} 
              canEdit={canEdit}
              getStatusColor={getStatusColor}
            />
          ))}
        </Box>
      </Box>

      {/* Verification Dialog */}
      <Dialog open={verifyDialog} onClose={() => setVerifyDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent dividers>
          {selectedPayment && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary">Intern Name</Typography>
              <Typography variant="body1" mb={2}>{selectedPayment.full_name || selectedPayment.emp_id}</Typography>
              
              <Typography variant="subtitle2" color="text.secondary">Amount</Typography>
              <Typography variant="body1" mb={2} fontWeight={700}>₹{selectedPayment.amount}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Transaction / UTR ID</Typography>
              <Typography variant="body1" mb={2}>{selectedPayment.transaction_id || 'Not provided'}</Typography>

              <Typography variant="subtitle2" color="text.secondary">Payment Proof / Screenshot</Typography>
              {selectedPayment.screenshot ? (
                <Box mt={1}>
                  <img src={selectedPayment.screenshot} alt="Payment Proof" style={{ maxWidth: '100%', borderRadius: 8, border: '1px solid #ddd' }} />
                  <Link href={selectedPayment.screenshot} target="_blank" display="block" mt={1}>Open Original Image</Link>
                </Box>
              ) : (
                <Typography variant="body2" color="error">No screenshot uploaded.</Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerifyDialog(false)}>Cancel</Button>
          {selectedPayment?.status === 'submitted' && (
            <>
              <Button onClick={() => handleVerify('pending')} color="error">Reject (Mark Pending)</Button>
              <Button onClick={() => handleVerify('paid')} variant="contained" color="success">Verify & Mark Paid</Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Request Payment Dialog */}
      <Dialog open={openRequestDialog} onClose={() => setOpenRequestDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Request Fee Payment</DialogTitle>
        <DialogContent dividers sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="select-intern-label">Select Intern</InputLabel>
              <Select
                labelId="select-intern-label"
                value={selectedInternEmpId}
                label="Select Intern"
                onChange={(e) => setSelectedInternEmpId(e.target.value)}
              >
                {interns.map((i) => (
                  <MenuItem key={i.emp_id} value={i.emp_id}>
                    {i.full_name} ({i.emp_id}) — {i.domain_name || 'No Domain'}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="select-structure-label">Fee Structure (Optional)</InputLabel>
              <Select
                labelId="select-structure-label"
                value={selectedStructureId}
                label="Fee Structure (Optional)"
                onChange={(e) => handleStructureChange(e.target.value)}
              >
                <MenuItem value="">Custom Payment</MenuItem>
                {feeStructures.map((fs) => (
                  <MenuItem key={fs.id} value={fs.id}>
                    {fs.name} (₹{fs.amount})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Amount (₹)"
              type="number"
              size="small"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth size="small">
              <InputLabel id="select-payment-type-label">Payment Type</InputLabel>
              <Select
                labelId="select-payment-type-label"
                value={paymentType}
                label="Payment Type"
                onChange={(e) => setPaymentType(e.target.value)}
              >
                <MenuItem value="full">Full Payment</MenuItem>
                <MenuItem value="part">Installment / Part Payment</MenuItem>
              </Select>
            </FormControl>

            {paymentType === 'part' && (
              <TextField
                label="Installment Number"
                type="number"
                size="small"
                value={installmentNum}
                onChange={(e) => setInstallmentNum(e.target.value)}
                fullWidth
              />
            )}

            <TextField
              label="Due Date"
              type="date"
              size="small"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDialog(false)} disabled={submitting}>Cancel</Button>
          <Button 
            onClick={handleCreateRequest} 
            variant="contained" 
            color="primary" 
            disabled={submitting}
          >
            {submitting ? 'Requesting...' : 'Request Payment'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
