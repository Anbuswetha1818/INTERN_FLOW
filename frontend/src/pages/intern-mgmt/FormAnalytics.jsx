import { Box, Typography, Paper, Grid, LinearProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { StatCard } from '../../components/common';
import { BarChart, Assessment, Group } from '@mui/icons-material';

export default function FormAnalytics() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Form Analytics</Typography>
        <Typography variant="body2" color="text.secondary">
          Analyze responses and feedback trends across the organization.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <StatCard label="Total Responses" value="1,245" icon={<Assessment />} trend={15} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Average Rating" value="4.6/5" icon={<BarChart />} trend={2} color="#f59e0b" />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Active Forms" value="8" icon={<Group />} color="#8b5cf6" />
        </Grid>
      </Grid>

      <Grid container spacing={4}>
        <Grid xs={12} md={6}>
          <Paper className="glass-card" sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Response Distribution</Typography>
            
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>5 Stars</Typography>
                <Typography variant="body2" fontWeight={700}>65%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={65} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: 'success.main' } }} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>4 Stars</Typography>
                <Typography variant="body2" fontWeight={700}>20%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={20} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: 'info.main' } }} />
            </Box>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" fontWeight={600}>3 Stars & Below</Typography>
                <Typography variant="body2" fontWeight={700}>15%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={15} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: 'warning.main' } }} />
            </Box>
          </Paper>
        </Grid>
        <Grid xs={12} md={6}>
          <Paper className="glass-card" sx={{ p: 4, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">Charts & Graphs Component</Typography>
              <Typography variant="body2" color="text.secondary">Will be rendered using Chart.js in future updates.</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
