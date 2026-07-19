import { Box, Typography, Paper, Grid, LinearProgress, Avatar, AvatarGroup } from '@mui/material';
import { motion } from 'framer-motion';

const MOCK_PROJECTS = [
  { id: 1, name: 'Core Platform v2', status: 'On Track', progress: 65, team: ['A', 'B', 'C'], deadline: 'Q4 2026' },
  { id: 2, name: 'Mobile App Refactor', status: 'At Risk', progress: 30, team: ['D', 'E'], deadline: 'Q3 2026' },
];

export default function ProjectStatusView() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Project Status</Typography>
        <Typography variant="body2" color="text.secondary">
          High-level view of all active projects and their health.
        </Typography>
      </Box>

      <Grid container spacing={4}>
        {MOCK_PROJECTS.map(proj => (
          <Grid xs={12} md={6} key={proj.id}>
            <Paper className="glass-card" sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>{proj.name}</Typography>
                <Typography 
                  variant="caption" 
                  fontWeight={700}
                  sx={{ color: proj.status === 'On Track' ? 'success.main' : 'warning.main' }}
                >
                  {proj.status}
                </Typography>
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">Progress</Typography>
                  <Typography variant="caption" fontWeight={700}>{proj.progress}%</Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={proj.progress} 
                  sx={{ height: 8, borderRadius: 4, bgcolor: 'action.hover', '& .MuiLinearProgress-bar': { bgcolor: proj.status === 'On Track' ? 'success.main' : 'warning.main' } }} 
                />
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.8rem' } }}>
                  {proj.team.map(member => (
                    <Avatar key={member}>{member}</Avatar>
                  ))}
                </AvatarGroup>
                <Typography variant="body2" fontWeight={600} color="text.secondary">
                  Due: {proj.deadline}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}
