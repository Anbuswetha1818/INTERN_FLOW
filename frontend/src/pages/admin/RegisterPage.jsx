import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, MenuItem, Stepper, Step, StepLabel, Alert
} from '@mui/material';
import { PersonAdd, Save, Key } from '@mui/icons-material';
import { authAPI, orgAPI } from '../../services/api';
import { motion } from 'framer-motion';

export default function RegisterPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Lookups
  const [domains, setDomains] = useState([]);
  const [entities, setEntities] = useState([]);
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    emp_id: '',
    full_name: '',
    role: 'staff',
    domain: '',
    entity: '',
    phone: '',
    shift_timing: 'Standard'
  });

  useEffect(() => {
    // Load lookup data
    Promise.all([
      orgAPI.entities(),
      orgAPI.domains()
    ]).then(([ent, dom]) => {
      setEntities(ent.data);
      setDomains(dom.data);
    }).catch(err => console.error(err));
  }, []);

  const handleChange = (e) => {
    let { name, value } = e.target;
    if (name === 'phone') {
      value = value.replace(/\D/g, '');
      if (value.length > 10) return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleNext = () => setActiveStep((prev) => prev + 1);
  const handleBack = () => setActiveStep((prev) => prev - 1);

  const handleSubmit = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError('');
    setLoading(true);
    try {
      await authAPI.register(formData);
      setSuccess(true);
      setActiveStep(3); // completion step
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.detail || "Registration failed. Please check inputs.");
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { value: 'manager', label: 'Manager' },
    { value: 'sme', label: 'SME' },
    { value: 'mentor', label: 'Mentor' },
    { value: 'staff', label: 'Administrative Staff' }
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Register New User</Typography>
        <Typography variant="body2" color="text.secondary">Create accounts for new administrative and managerial staff.</Typography>
      </Box>

      <Box className="glass-card" sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
          <Step><StepLabel>Account Details</StepLabel></Step>
          <Step><StepLabel>Profile Details</StepLabel></Step>
          <Step><StepLabel>Assignment</StepLabel></Step>
        </Stepper>

        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {activeStep === 0 && (
          <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
              <TextField fullWidth label="Username" name="username" value={formData.username} onChange={handleChange} required />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField fullWidth label="Email Address" type="email" name="email" value={formData.email} onChange={handleChange} required />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField fullWidth label="Password" type="password" name="password" value={formData.password} onChange={handleChange} required />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField fullWidth label="Confirm Password" type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required />
            </Grid>
          </Grid>
        )}

        {activeStep === 1 && (
          <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
              <TextField fullWidth label="Employee ID" name="emp_id" value={formData.emp_id} onChange={handleChange} required />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField fullWidth label="Full Name" name="full_name" value={formData.full_name} onChange={handleChange} required />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField fullWidth label="Phone Number" name="phone" value={formData.phone} onChange={handleChange} />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField select fullWidth label="Role" name="role" value={formData.role} onChange={handleChange}>
                {roles.map((r) => <MenuItem key={r.value} value={r.value}>{r.label}</MenuItem>)}
              </TextField>
            </Grid>
          </Grid>
        )}

        {activeStep === 2 && (
          <Grid container spacing={3}>
            <Grid xs={12} sm={6}>
              <TextField select fullWidth label="Entity" name="entity" value={formData.entity} onChange={handleChange}>
                <MenuItem value=""><em>None</em></MenuItem>
                {entities.map((e) => <MenuItem key={e.id} value={e.id}>{e.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField select fullWidth label="Domain" name="domain" value={formData.domain} onChange={handleChange}>
                <MenuItem value=""><em>None</em></MenuItem>
                {domains.filter(d => !formData.entity || d.entity === formData.entity).map((d) => 
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                )}
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField select fullWidth label="Shift Timing" name="shift_timing" value={formData.shift_timing} onChange={handleChange}>
                <MenuItem value="Standard">Standard (09:00 - 18:00)</MenuItem>
                <MenuItem value="Morning">Morning (06:00 - 15:00)</MenuItem>
                <MenuItem value="Evening">Evening (14:00 - 23:00)</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        )}

        {activeStep === 3 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: 'success.light', color: 'success.main', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <PersonAdd sx={{ fontSize: 40 }} />
            </Box>
            <Typography variant="h5" fontWeight={700} mb={1}>Registration Successful!</Typography>
            <Typography color="text.secondary" mb={4}>The user account for {formData.full_name} has been created.</Typography>
            <Button variant="contained" onClick={() => {
              setActiveStep(0);
              setSuccess(false);
              setFormData({...formData, username: '', email: '', emp_id: '', full_name: ''});
            }}>
              Register Another User
            </Button>
          </Box>
        )}

        {/* Navigation */}
        {activeStep < 3 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 6 }}>
            <Button disabled={activeStep === 0} onClick={handleBack} variant="outlined">
              Back
            </Button>
            {activeStep === 2 ? (
              <Button variant="contained" onClick={handleSubmit} disabled={loading} startIcon={<Save />}>
                Complete Registration
              </Button>
            ) : (
              <Button variant="contained" onClick={handleNext}>
                Continue
              </Button>
            )}
          </Box>
        )}
      </Box>
    </motion.div>
  );
}
