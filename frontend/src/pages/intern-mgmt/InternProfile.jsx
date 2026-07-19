import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Avatar, Chip, Divider, Tabs, Tab, Button, LinearProgress
} from '@mui/material';
import { 
  Email, Phone, School, WorkHistory, Assessment, LocalLibrary, Computer, 
  MonetizationOn, Edit, ArrowUpward
} from '@mui/icons-material';
import { usersAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { motion } from 'framer-motion';
import { useParams } from 'react-router-dom';

export default function InternProfile() {
  const { id } = useParams(); // empId
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState(0);

  useEffect(() => {
    // For demo purposes, we'll fetch full detail and find the intern if no id is provided
    // In reality, this would fetch by ID: usersAPI.userData(id)
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await usersAPI.interns();
        // Just pick the first intern for demo if no ID
        setProfile(res.data[0]); 
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [id]);

  if (loading) return <LoadingSpinner text="Loading Profile..." />;
  if (!profile) return <Typography>Profile not found</Typography>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Intern Profile</Typography>
          <Typography variant="body2" color="text.secondary">Detailed view of intern progression and records.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button variant="outlined" startIcon={<Edit />}>Edit Profile</Button>
          <Button variant="contained" color="secondary" startIcon={<ArrowUpward />}>Promote</Button>
        </Box>
      </Box>

      <Grid container spacing={4}>
        {/* Left Column: Summary Card */}
        <Grid xs={12} md={4} lg={3}>
          <Box className="glass-card" sx={{ p: 4, textAlign: 'center', mb: 4 }}>
            <Avatar 
              src={profile.photo} 
              sx={{ width: 120, height: 120, mx: 'auto', mb: 2, border: '4px solid #fff', boxShadow: '0 8px 24px rgba(108,63,224,0.2)' }}
            />
            <Typography variant="h5" fontWeight={800}>{profile.full_name}</Typography>
            <Typography color="text.secondary" mb={2}>{profile.emp_id}</Typography>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mb: 3 }}>
              <StatusChip status={profile.user_status} />
              <Chip label={profile.scheme?.toUpperCase()} size="small" color="primary" variant="outlined" />
            </Box>

            <Divider sx={{ my: 2 }} />

            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Email fontSize="small" color="action" />
                <Typography variant="body2">{profile.email}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Phone fontSize="small" color="action" />
                <Typography variant="body2">{profile.phone || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <School fontSize="small" color="action" />
                <Typography variant="body2">{profile.college_name || 'N/A'}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <WorkHistory fontSize="small" color="action" />
                <Typography variant="body2">{profile.domain_name}</Typography>
              </Box>
            </Box>
          </Box>

          {/* Quick Metrics */}
          <Box className="glass-card" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Quick Metrics</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Attendance</Typography>
                <Typography variant="body2" color="success.main" fontWeight={700}>92%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={92} color="success" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Task Completion</Typography>
                <Typography variant="body2" color="primary.main" fontWeight={700}>85%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={85} color="primary" sx={{ height: 6, borderRadius: 3 }} />
            </Box>

            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>Learning Path</Typography>
                <Typography variant="body2" color="info.main" fontWeight={700}>45%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={45} color="info" sx={{ height: 6, borderRadius: 3 }} />
            </Box>
          </Box>
        </Grid>

        {/* Right Column: Tabbed Content */}
        <Grid xs={12} md={8} lg={9}>
          <Box className="glass-card" sx={{ p: 0, height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 3, pt: 2 }}>
              <Tabs value={tab} onChange={(e, v) => setTab(v)}>
                <Tab icon={<Assessment />} iconPosition="start" label="Performance & Tasks" />
                <Tab icon={<LocalLibrary />} iconPosition="start" label="Academic Details" />
                <Tab icon={<Computer />} iconPosition="start" label="Assets & Documents" />
                <Tab icon={<MonetizationOn />} iconPosition="start" label="Financials" />
              </Tabs>
            </Box>
            
            <Box sx={{ p: 4 }}>
              {tab === 0 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={3}>Performance Overview</Typography>
                  <Typography color="text.secondary">Detailed performance charts will be populated here via AI analytics.</Typography>
                </Box>
              )}
              {tab === 1 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={3}>Academic Record</Typography>
                  <Typography color="text.secondary">College, degree, and certification records.</Typography>
                </Box>
              )}
              {tab === 2 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={3}>Assigned Assets & Documents</Typography>
                  <Typography color="text.secondary">Laptops, badges, and verified identity documents.</Typography>
                </Box>
              )}
              {tab === 3 && (
                <Box>
                  <Typography variant="h6" fontWeight={700} mb={3}>Payment History</Typography>
                  <Typography color="text.secondary">Fee payment records or stipend payouts based on scheme.</Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Grid>
      </Grid>
    </motion.div>
  );
}
