import { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, Button, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Webhook, Add, Edit, Delete, Refresh } from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function WebhooksPage() {
  const [hooks, setHooks] = useState([
    { id: 1, name: 'Slack Notifications', url: 'https://hooks.slack.com/services/T0...', events: ['Task Created', 'SLA Breached'], status: 'Active' },
    { id: 2, name: 'ERP Sync', url: 'https://erp.company.com/api/webhooks/sims', events: ['Intern Onboarded', 'Payment Completed'], status: 'Failed' },
  ]);

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({ name: '', url: '' });

  const handleOpen = (hook = null) => {
    if (hook) {
      setEditId(hook.id);
      setFormData({ name: hook.name, url: hook.url });
    } else {
      setEditId(null);
      setFormData({ name: '', url: '' });
    }
    setOpen(true);
  };

  const handleClose = () => setOpen(false);

  const handleSave = () => {
    if (editId) {
      setHooks(hooks.map(h => h.id === editId ? { ...h, name: formData.name, url: formData.url } : h));
    } else {
      setHooks([...hooks, { id: Date.now(), name: formData.name, url: formData.url, events: ['Custom Event'], status: 'Active' }]);
    }
    handleClose();
  };

  const handleDelete = (id) => {
    if(window.confirm('Are you sure you want to delete this webhook?')) {
      setHooks(hooks.filter(h => h.id !== id));
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Webhook color="primary" /> Webhooks
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure external integrations and event triggers.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} sx={{ background: 'var(--gradient-primary)' }} onClick={() => handleOpen()}>
          Add Webhook
        </Button>
      </Box>

      <Paper className="glass-card" sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Endpoint URL</TableCell>
                <TableCell>Events Subscribed</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {hooks.map((hook) => (
                <TableRow key={hook.id} hover>
                  <TableCell fontWeight={600}>{hook.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace' }}>{hook.url}</TableCell>
                  <TableCell>
                    {hook.events.map(ev => <Chip key={ev} label={ev} size="small" variant="outlined" sx={{ mr: 0.5 }} />)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={hook.status} 
                      size="small" 
                      color={hook.status === 'Active' ? 'success' : 'error'} 
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Test/Refresh"><IconButton size="small"><Refresh /></IconButton></Tooltip>
                    <Tooltip title="Edit"><IconButton size="small" onClick={() => handleOpen(hook)}><Edit /></IconButton></Tooltip>
                    <Tooltip title="Delete"><IconButton size="small" color="error" onClick={() => handleDelete(hook.id)}><Delete /></IconButton></Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {hooks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No webhooks configured.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editId ? 'Edit Webhook' : 'Add Webhook'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Webhook Name"
            fullWidth
            sx={{ mb: 2 }}
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <TextField
            label="Endpoint URL"
            fullWidth
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!formData.name || !formData.url}>
            {editId ? 'Save Changes' : 'Create Webhook'}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
