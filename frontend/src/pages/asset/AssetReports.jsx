import { Box, Typography, Paper, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { Assessment, DevicesOther, Warning } from '@mui/icons-material';

// We will simulate using the newly created chart components here.
// In a real scenario, these would import actual Recharts/ChartJS wrappers.
import TrendChart from '../../components/charts/TrendChart';
import DonutChart from '../../components/charts/DonutChart';
import BarChart from '../../components/charts/BarChart';

export default function AssetReports() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Assessment sx={{ color: 'var(--color-accent)' }} /> Asset Analytics & Reports
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track asset allocation, depreciation, and issue frequencies.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Top KPI Cards */}
        <Grid xs={12} md={4}>
          <Paper className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'rgba(0,188,212,0.1)', borderRadius: '50%' }}>
              <DevicesOther sx={{ color: 'var(--color-accent)', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>482</Typography>
              <Typography variant="body2" color="text.secondary">Total Active Assets</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid xs={12} md={4}>
          <Paper className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'rgba(245,158,11,0.1)', borderRadius: '50%' }}>
              <Warning sx={{ color: '#f59e0b', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>15</Typography>
              <Typography variant="body2" color="text.secondary">Pending Maintenance</Typography>
            </Box>
          </Paper>
        </Grid>
        <Grid xs={12} md={4}>
          <Paper className="glass-card" sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box sx={{ p: 2, bgcolor: 'rgba(239,68,68,0.1)', borderRadius: '50%' }}>
              <Assessment sx={{ color: '#ef4444', fontSize: 32 }} />
            </Box>
            <Box>
              <Typography variant="h4" fontWeight={800}>$142k</Typography>
              <Typography variant="body2" color="text.secondary">Total Asset Value</Typography>
            </Box>
          </Paper>
        </Grid>

        {/* Charts Row 1 */}
        <Grid xs={12} md={6}>
          <Paper className="glass-card" sx={{ p: 3, height: '100%', minHeight: 300 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Asset Allocation by Category</Typography>
            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DonutChart />
            </Box>
          </Paper>
        </Grid>
        <Grid xs={12} md={6}>
          <Paper className="glass-card" sx={{ p: 3, height: '100%', minHeight: 300 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Issue Reports over Time</Typography>
            <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendChart />
            </Box>
          </Paper>
        </Grid>

        {/* Charts Row 2 */}
        <Grid xs={12}>
          <Paper className="glass-card" sx={{ p: 3, height: '100%', minHeight: 350 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Domain Asset Distribution</Typography>
            <Box sx={{ height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BarChart />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
