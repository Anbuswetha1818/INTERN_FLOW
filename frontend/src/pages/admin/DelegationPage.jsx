import { useState } from 'react';
import { Box, Typography, Paper, Grid, Button, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { SwapHoriz, Add, AccessTime } from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function DelegationPage() {
  const [delegations, setDelegations] = useState([
    { id: 1, delegator: 'John Admin', delegate: 'Sarah Manager', role: 'Approvals', expires: '2026-06-30', status: 'Active' },
    { id: 2, delegator: 'Finance Lead', delegate: 'Alex Accountant', role: 'Payroll Review', expires: '2026-06-20', status: 'Active' },
  ]);

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({ delegate: '', role: '', expires: '' });

  const handleOpen = () => {
    setFormData({ delegate: '', role: '', expires: '' });
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    setDelegations([...delegations, { 
      id: Date.now(), 
      delegator: 'Current User', 
      delegate: formData.delegate, 
      role: formData.role, 
      expires: formData.expires || '2026-12-31', 
      status: 'Active' 
    }]);
    handleClose();
  };

  const handleRevoke = (id) => {
    if(window.confirm('Are you sure you want to revoke this delegation?')) {
      setDelegations(delegations.filter(d => d.id !== id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SwapHoriz color="primary" /> Role Delegation
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Temporarily delegate authorities and approvals.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} sx={{ background: 'var(--gradient-primary)' }} onClick={handleOpen}>
          New Delegation
        </Button>
      </Box>

      <Grid container spacing={3}>
        {delegations.map((del) => (
          <Grid xs={12} md={6} key={del.id}>
            <Paper className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'primary.main', mb: 1 }}>{del.delegator[0]}</Avatar>
                  <Typography variant="caption" fontWeight={600}>{del.delegator}</Typography>
                </Box>
                <SwapHoriz sx={{ color: 'text.secondary' }} />
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Avatar sx={{ bgcolor: 'secondary.main', mb: 1 }}>{del.delegate[0]}</Avatar>
                  <Typography variant="caption" fontWeight={600}>{del.delegate}</Typography>
                </Box>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Chip label={del.role} size="small" sx={{ mb: 1 }} />
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary', justifyContent: 'flex-end' }}>
                  <AccessTime fontSize="small" />
                  <Typography variant="caption">Until {del.expires}</Typography>
                </Box>
                <Button size="small" color="error" sx={{ mt: 1 }} onClick={() => handleRevoke(del.id)}>Revoke</Button>
              </Box>
            </Paper>
          </Grid>
        ))}
        {delegations.length === 0 && (
          <Grid xs={12}>
            <Paper className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No active role delegations.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Delegation</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Delegate Name"
            fullWidth
            sx={{ mb: 2 }}
            value={formData.delegate}
            onChange={(e) => setFormData({ ...formData, delegate: e.target.value })}
            placeholder="e.g. Sarah Manager"
          />
          <TextField
            label="Role / Authority"
            fullWidth
            sx={{ mb: 2 }}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            placeholder="e.g. Timesheet Approvals"
          />
          <TextField
            label="Expiry Date"
            type="date"
            fullWidth
            value={formData.expires}
            onChange={(e) => setFormData({ ...formData, expires: e.target.value })}
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.delegate || !formData.role}>
            Delegate
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
