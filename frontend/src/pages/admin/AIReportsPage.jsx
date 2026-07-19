import { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Chip, Divider, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { AutoAwesome, PictureAsPdf, Download } from '@mui/icons-material';
import { aiUtils } from '../../utils/aiUtils';

export default function AIReportsPage() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    if (!query) return;
    setLoading(true);
    try {
      const response = await aiUtils.generateDashboardInsights();
      setReport({
        title: "AI Analysis Report",
        summary: `Based on your query: "${query}". \n\n${response.keyMetrics} ${response.actionItem}`,
        metrics: [
          { label: "System Health", value: response.overallHealth },
          { label: "Confidence", value: "94%" },
          { label: "Generated", value: new Date().toLocaleTimeString() }
        ]
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AutoAwesome sx={{ color: 'var(--color-accent)' }} /> AI Reports Generator
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Generate natural language reports instantly using Claude AI.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Left Side: Input area */}
        <Grid xs={12} md={5}>
          <Paper className="glass-card" sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>What do you want to know?</Typography>
            <TextField
              multiline
              rows={6}
              placeholder="e.g., 'Generate a summary report of attendance anomalies for the IT department this month...'"
              variant="outlined"
              fullWidth
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              sx={{ mb: 3, '& .MuiOutlinedInput-root': { bgcolor: 'rgba(255,255,255,0.05)' } }}
            />
            
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
              <Chip label="Intern Performance" onClick={() => setQuery("Show me the top 5 performing interns this quarter")} sx={{ cursor: 'pointer' }} />
              <Chip label="Attendance Risks" onClick={() => setQuery("Identify any interns with attendance drops below 80%")} sx={{ cursor: 'pointer' }} />
              <Chip label="Task Bottlenecks" onClick={() => setQuery("Which tasks are taking the longest to complete?")} sx={{ cursor: 'pointer' }} />
            </Box>

            <Box sx={{ mt: 'auto' }}>
              <Button 
                variant="contained" 
                fullWidth 
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
                onClick={handleGenerate}
                disabled={!query || loading}
                sx={{ 
                  background: 'var(--gradient-primary)',
                  py: 1.5,
                  fontWeight: 700
                }}
              >
                {loading ? 'Generating Insight...' : 'Generate AI Report'}
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Right Side: Generated Report */}
        <Grid xs={12} md={7}>
          <Paper className="glass-card" sx={{ p: 4, height: '100%', minHeight: 400 }}>
            {loading ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.7 }}>
                <AutoAwesome sx={{ fontSize: 60, mb: 2, color: 'var(--color-accent)', animation: 'spin 2s linear infinite' }} />
                <Typography variant="h6">Analyzing millions of data points...</Typography>
                <Typography variant="body2" color="text.secondary">Claude is drafting your report</Typography>
              </Box>
            ) : report ? (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Typography variant="h5" fontWeight={800}>{report.title}</Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" startIcon={<Download />}>Excel</Button>
                    <Button size="small" variant="contained" color="error" startIcon={<PictureAsPdf />}>PDF</Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 3 }} />
                
                <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8 }}>
                  {report.summary}
                </Typography>

                <Grid container spacing={2}>
                  {report.metrics.map((m, idx) => (
                    <Grid xs={12} sm={4} key={idx}>
                      <Box sx={{ p: 2, bgcolor: 'rgba(0,188,212,0.1)', borderRadius: 2, border: '1px solid rgba(0,188,212,0.2)' }}>
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ textTransform: 'uppercase' }}>
                          {m.label}
                        </Typography>
                        <Typography variant="h6" fontWeight={800} sx={{ mt: 1 }}>
                          {m.value}
                        </Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </motion.div>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', opacity: 0.4 }}>
                <AutoAwesome sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h6">Ready to Analyze</Typography>
                <Typography variant="body2">Enter a query to generate a report.</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
