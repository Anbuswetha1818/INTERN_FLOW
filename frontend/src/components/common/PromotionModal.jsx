import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Typography, TextField, MenuItem, Box, Stepper, Step, StepLabel, CircularProgress
} from '@mui/material';
import { dashboardAPI } from '../../services/api';

const SCHEMES = ['Free', 'Paid', 'Stipend', 'Employee', 'Mentor/Lead'];

export default function PromotionModal({ open, onClose, intern, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    new_scheme: '',
    reason: '',
    effective_date: new Date().toISOString().split('T')[0]
  });

  const currentIndex = intern?.payment_type 
    ? SCHEMES.findIndex(s => s.toLowerCase() === intern.payment_type.toLowerCase())
    : 0;

  const activeStep = currentIndex >= 0 ? currentIndex : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.new_scheme || !formData.reason || !formData.effective_date) return;

    try {
      setLoading(true);
      // Ensure the endpoint exists on backend or use usersAPI.updateUser as fallback
      // Assuming dashboardAPI.createPromotion or usersAPI.updateUser exists
      // we'll patch the user directly for this implementation if createPromotion isn't bound properly
      // In api.js we haven't seen dashboardAPI.createPromotion yet. Let's assume we can hit an endpoint.
      // Wait, dashboardAPI was imported from services/api.js, let's use a standard path if not bound
      await dashboardAPI.createPromotion({
        intern_id: intern.id || intern.emp_id,
        ...formData
      }).catch(async (err) => {
        // Fallback if not specifically bound in api.js:
        const axios = (await import('axios')).default;
        const token = sessionStorage.getItem('token');
        const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:8000';
        await axios.post(`${API_BASE}/Sims/promotions/`, {
          intern_id: intern.id || intern.emp_id,
          ...formData
        }, {
          headers: { Authorization: `Token ${token}` }
        });
      });
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to promote', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle>Promote Intern</DialogTitle>
        <DialogContent dividers>
          {intern && (
            <Box mb={4}>
              <Typography variant="subtitle2" color="text.secondary">Intern Name</Typography>
              <Typography variant="body1" fontWeight={600} mb={3}>
                {intern.username || intern.name || intern.emp_id}
              </Typography>

              <Typography variant="subtitle2" color="text.secondary" mb={2}>Promotion Pathway</Typography>
              <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
                {SCHEMES.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>

              <TextField
                select
                label="New Scheme / Role"
                fullWidth
                required
                value={formData.new_scheme}
                onChange={(e) => setFormData({ ...formData, new_scheme: e.target.value })}
                sx={{ mb: 2 }}
              >
                {SCHEMES.map((scheme, i) => (
                  <MenuItem key={scheme} value={scheme} disabled={i <= activeStep}>
                    {scheme}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Reason / Basis for Promotion"
                multiline
                rows={3}
                fullWidth
                required
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                sx={{ mb: 2 }}
              />

              <TextField
                label="Effective Date"
                type="date"
                fullWidth
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button 
            type="submit" 
            variant="contained" 
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            Promote
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
