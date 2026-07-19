import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Avatar, Divider, Switch, FormControlLabel, List, ListItem, ListItemText, ListItemSecondaryAction, MenuItem, CircularProgress, Alert
} from '@mui/material';
import { Save, Notifications, Security, Palette, CorporateFare } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import { motion } from 'framer-motion';
import { orgAPI } from '../../services/api';

export default function Settings() {
  const { user, permissions } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  
  const [loading, setLoading] = useState(false);
  const [entityConfig, setEntityConfig] = useState(null);
  const [configSaving, setConfigSaving] = useState(false);

  const { showToast } = useToast();

  // Use user's entity_id if available, otherwise fallback to 1 (or fetch list of entities)
  // For this implementation, we'll fetch the first entity if user.entity is not available
  useEffect(() => {
    if (permissions?.hasAdminAccess) {
      const fetchConfig = async () => {
        try {
          setLoading(true);
          // If we have a specific entity_id in user, use it, else get the first entity
          let entityId = user?.entity;
          if (!entityId) {
            const entities = await orgAPI.entities();
            if (entities.data && entities.data.length > 0) {
              entityId = entities.data[0].id;
            }
          }
          if (entityId) {
            const res = await orgAPI.entityConfig(entityId);
            setEntityConfig(res.data);
          }
        } catch (err) {
          console.error("Failed to load entity config", err);
          showToast('Failed to load entity config', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchConfig();
    }
  }, [user, permissions]);

  const handleConfigSave = async () => {
    if (!entityConfig) return;
    try {
      setConfigSaving(true);
      await orgAPI.updateEntityConfig(entityConfig.entity, entityConfig);
      showToast('Configuration saved successfully!', 'success');
    } catch (err) {
      console.error("Failed to save config", err);
      showToast('Failed to save configuration', 'error');
    } finally {
      setConfigSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Settings</Typography>
        <Typography variant="body2" color="text.secondary">Manage your preferences and account settings.</Typography>
      </Box>

      <Grid container spacing={4}>
        {/* Profile Settings */}
        <Grid xs={12} md={6}>
          <Box className="glass-card" sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Profile Information</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
              <Avatar sx={{ width: 80, height: 80, bgcolor: 'var(--color-primary)', fontSize: '2rem' }}>
                {user?.username?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <Box>
                <Button variant="outlined" size="small" sx={{ mb: 1 }}>Change Photo</Button>
                <Typography variant="caption" display="block" color="text.secondary">
                  JPG, GIF or PNG. Max size of 800K
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid xs={12} sm={6}>
                <TextField label="First Name" fullWidth defaultValue={user?.first_name || ''} />
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField label="Last Name" fullWidth defaultValue={user?.last_name || ''} />
              </Grid>
              <Grid xs={12}>
                <TextField label="Email Address" fullWidth defaultValue={user?.email || ''} disabled />
              </Grid>
              <Grid xs={12}>
                <Button variant="contained" startIcon={<Save />}>Save Changes</Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>

        {/* Preferences */}
        <Grid xs={12} md={6}>
          <Box className="glass-card" sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Palette sx={{ color: 'var(--color-primary)' }} /> Appearance & Display
            </Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText primary="Compact List View" secondary="Show more rows per page in tables" />
                <ListItemSecondaryAction>
                  <Switch edge="end" defaultChecked={false} />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>

          <Box className="glass-card" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Notifications color="secondary" /> Notifications
            </Typography>
            <List disablePadding>
              <ListItem disableGutters>
                <ListItemText primary="Email Alerts" secondary="Receive daily summaries via email" />
                <ListItemSecondaryAction>
                  <Switch edge="end" defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
              <Divider component="li" sx={{ my: 1 }} />
              <ListItem disableGutters>
                <ListItemText primary="Task Reminders" secondary="Get notified when tasks are overdue" />
                <ListItemSecondaryAction>
                  <Switch edge="end" defaultChecked />
                </ListItemSecondaryAction>
              </ListItem>
            </List>
          </Box>
        </Grid>

        {/* Entity Configuration (Admin Only) */}
        {permissions?.hasAdminAccess && (
          <Grid xs={12}>
            <Box className="glass-card" sx={{ p: 3, mb: 4 }}>
              <Typography variant="h6" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CorporateFare sx={{ color: 'var(--color-primary)' }} /> Entity Configuration
              </Typography>
              
              {loading ? (
                <Box display="flex" justifyContent="center"><CircularProgress size={30} /></Box>
              ) : entityConfig ? (
                <Grid container spacing={3}>
                  <Grid xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight={600} mb={2}>Working Hours & Policy</Typography>
                    <TextField 
                      label="Standard Shift Start" 
                      type="time" 
                      fullWidth 
                      sx={{ mb: 2 }}
                      value={entityConfig.standard_shift_start || '09:00:00'}
                      onChange={(e) => setEntityConfig({...entityConfig, standard_shift_start: e.target.value})}
                    />
                    <TextField 
                      label="Standard Shift End" 
                      type="time" 
                      fullWidth 
                      sx={{ mb: 2 }}
                      value={entityConfig.standard_shift_end || '18:00:00'}
                      onChange={(e) => setEntityConfig({...entityConfig, standard_shift_end: e.target.value})}
                    />
                    <TextField 
                      label="Annual Leave Quota" 
                      type="number" 
                      fullWidth 
                      value={entityConfig.annual_leave_quota || 12}
                      onChange={(e) => setEntityConfig({...entityConfig, annual_leave_quota: e.target.value})}
                    />
                  </Grid>
                  
                  <Grid xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight={600} mb={2}>Feature Flags</Typography>
                    <FormControlLabel 
                      control={<Switch checked={entityConfig.learning_module_enabled} onChange={(e) => setEntityConfig({...entityConfig, learning_module_enabled: e.target.checked})} />} 
                      label="Enable Learning Module" 
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel 
                      control={<Switch checked={entityConfig.ai_features_enabled} onChange={(e) => setEntityConfig({...entityConfig, ai_features_enabled: e.target.checked})} />} 
                      label="Enable AI Features" 
                      sx={{ display: 'block', mb: 1 }}
                    />
                    <FormControlLabel 
                      control={<Switch checked={entityConfig.stipend_enabled} onChange={(e) => setEntityConfig({...entityConfig, stipend_enabled: e.target.checked})} />} 
                      label="Enable Stipend / Payroll" 
                      sx={{ display: 'block', mb: 1 }}
                    />
                  </Grid>
                  
                  <Grid xs={12} md={4}>
                    <Typography variant="subtitle2" fontWeight={600} mb={2}>System Defaults</Typography>
                    <TextField 
                      select 
                      label="Payment Cycle" 
                      fullWidth 
                      sx={{ mb: 2 }}
                      value={entityConfig.payment_cycle || 'monthly'}
                      onChange={(e) => setEntityConfig({...entityConfig, payment_cycle: e.target.value})}
                    >
                      <MenuItem value="weekly">Weekly</MenuItem>
                      <MenuItem value="bi-weekly">Bi-weekly</MenuItem>
                      <MenuItem value="monthly">Monthly</MenuItem>
                    </TextField>
                    <TextField 
                      label="Default SLA Hours" 
                      type="number" 
                      fullWidth 
                      sx={{ mb: 2 }}
                      value={entityConfig.default_sla_hours || 48}
                      onChange={(e) => setEntityConfig({...entityConfig, default_sla_hours: e.target.value})}
                    />
                    <Button 
                      variant="contained" 
                      startIcon={configSaving ? <CircularProgress size={20} color="inherit" /> : <Save />} 
                      onClick={handleConfigSave}
                      disabled={configSaving}
                    >
                      Save Configuration
                    </Button>
                  </Grid>
                </Grid>
              ) : (
                <Alert severity="info">Entity configuration not found or not initialized.</Alert>
              )}
            </Box>
          </Grid>
        )}

        {/* Security */}
        <Grid xs={12}>
          <Box className="glass-card" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Security color="error" /> Security Settings
            </Typography>
            <Grid container spacing={3}>
              <Grid xs={12} md={4}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Change Password</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Ensure your account is using a long, random password to stay secure.
                </Typography>
                <Button variant="outlined" color="primary">Update Password</Button>
              </Grid>
              <Grid xs={12} md={4}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Two-Factor Authentication</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Add additional security to your account using two factor authentication.
                </Typography>
                <Button variant="outlined" color="primary">Enable 2FA</Button>
              </Grid>
              <Grid xs={12} md={4}>
                <Typography variant="subtitle2" fontWeight={600} mb={1}>Active Sessions</Typography>
                <Typography variant="body2" color="text.secondary" mb={2}>
                  Manage and log out your active sessions on other browsers and devices.
                </Typography>
                <Button variant="outlined" color="error">Log Out Other Devices</Button>
              </Grid>
            </Grid>
          </Box>
        </Grid>
      </Grid>
    </motion.div>
  );
}
