import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { SmartToy, Lightbulb, TrendingUp, Warning } from '@mui/icons-material';
import { aiUtils } from '../../utils/aiUtils';

export default function AIInsightsPage() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      const data = await aiUtils.generateDashboardInsights();
      setInsights(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SmartToy color="primary" /> AI Insights
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI-driven recommendations for intern performance and team health.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<SmartToy />} onClick={fetchInsights} disabled={loading}>
          {loading ? 'Analyzing...' : 'Generate New Report'}
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
          <CircularProgress />
        </Box>
      ) : insights ? (
        <Grid container spacing={3}>
          <Grid xs={12} md={4}>
            <Paper className="glass-card" sx={{ p: 4, height: '100%', borderTop: '4px solid', borderColor: 'primary.main' }}>
              <Typography variant="h6" fontWeight={700} mb={2}>Overall Health</Typography>
              <Typography variant="h3" fontWeight={800} color="primary.main">{insights.overallHealth}</Typography>
            </Paper>
          </Grid>
          <Grid xs={12} md={8}>
            <Paper className="glass-card" sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp fontSize="small" /> Key Metrics
                </Typography>
                <Typography variant="body1" fontWeight={500} mt={1}>{insights.keyMetrics}</Typography>
              </Box>
              <Box>
                <Typography variant="subtitle2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning fontSize="small" /> Recommended Action
                </Typography>
                <Typography variant="body1" fontWeight={500} mt={1}>{insights.actionItem}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      ) : (
        <Typography>No insights available.</Typography>
      )}
    </motion.div>
  );
}
