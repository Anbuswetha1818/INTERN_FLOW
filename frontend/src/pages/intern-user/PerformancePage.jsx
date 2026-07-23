import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, Button, Chip, CircularProgress,
  Accordion, AccordionSummary, AccordionDetails, LinearProgress,
  Alert, Tooltip, Divider, List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import {
  Psychology, ExpandMore, TrendingUp, Warning, CheckCircle,
  AutoAwesome, Refresh, FiberManualRecord, School, Star
} from '@mui/icons-material';
import { aiAPI } from '../../services/api';
import { motion } from 'framer-motion';

// AI Score Gauge Component
function AIScoreGauge({ score }) {
  const color = score >= 75 ? '#22c55e' : score >= 50 ? '#f59e0b' : '#ef4444';
  const label = score >= 75 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Average' : 'Needs Improvement';
  return (
    <Box sx={{ textAlign: 'center', position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <Box sx={{ position: 'relative', display: 'inline-flex' }}>
        <CircularProgress
          variant="determinate"
          value={score}
          size={140}
          thickness={6}
          sx={{ color, filter: `drop-shadow(0 0 10px ${color}66)` }}
        />
        <CircularProgress
          variant="determinate"
          value={100}
          size={140}
          thickness={6}
          sx={{ color: 'action.disabledBackground', position: 'absolute', left: 0 }}
        />
        <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <Typography variant="h3" fontWeight={900} sx={{ color }}>{score}</Typography>
          <Typography variant="caption" color="text.secondary">/ 100</Typography>
        </Box>
      </Box>
      <Chip label={label} size="small" sx={{ mt: 1, bgcolor: color + '22', color, fontWeight: 700, border: `1px solid ${color}` }} />
    </Box>
  );
}

// Risk Flag Badge
function RiskFlagBadge({ flag }) {
  const colors = { at_risk: 'error', overloaded: 'warning', disengaged: 'info' };
  return (
    <Tooltip title={flag.reason}>
      <Chip
        icon={<Warning />}
        label={flag.label}
        color={colors[flag.type] || 'default'}
        variant="outlined"
        size="small"
        sx={{ fontWeight: 700 }}
      />
    </Tooltip>
  );
}

// Metric Bar
function MetricBar({ label, value, max = 100, color = 'primary' }) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5, gap: 1.5 }}>
        <Typography variant="body2" fontWeight={600}>{label}</Typography>
        <Typography variant="body2" fontWeight={700} color={`${color}.main`}>{value}%</Typography>
      </Box>
      <LinearProgress
        variant="determinate"
        value={Math.min(value, 100)}
        color={color}
        sx={{ height: 8, borderRadius: 4, bgcolor: 'action.disabledBackground' }}
      />
    </Box>
  );
}

export default function PerformancePage() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  const fetchReport = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await aiAPI.getOwnPerformanceReport();
      setReport(res.data);
    } catch (err) {
      setError('Could not load performance report.');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    setGenerating(true);
    setError('');
    try {
      const res = await aiAPI.analyzeOwnPerformance();
      setReport(res.data);
    } catch (err) {
      setError('Failed to generate AI report. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} sx={{ fontSize: { xs: '1.75rem', sm: '2.125rem' } }}>Performance Dashboard</Typography>
          <Typography variant="body2" color="text.secondary">AI-powered analysis of your internship performance.</Typography>
        </Box>
        <Button
          variant="contained"
          onClick={generateReport}
          disabled={generating}
          startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
          sx={{ 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', 
            fontWeight: 700,
            width: { xs: '100%', sm: 'auto' }
          }}
        >
          {generating ? 'Analyzing with AI...' : 'Generate AI Report'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading performance data...</Typography>
          </Box>
        </Box>
      ) : report ? (
        <Grid container spacing={3}>
          {/* AI Score + Risk Flags */}
          <Grid xs={12} md={4}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, textAlign: 'center', height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'stretch' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'center', mb: 3 }}>
                  <Psychology sx={{ color: '#8b5cf6' }} />
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>AI Performance Score</Typography>
                </Box>
                <AIScoreGauge score={report.ai_score || 0} />

                {report.risk_flags?.length > 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="caption" color="error.main" fontWeight={700} display="block" mb={1}>Risk Flags</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center' }}>
                      {report.risk_flags.map((flag, i) => <RiskFlagBadge key={i} flag={flag} />)}
                    </Box>
                  </Box>
                )}

                {report.risk_flags?.length === 0 && (
                  <Box sx={{ mt: 3 }}>
                    <Chip icon={<CheckCircle />} label="No Risk Flags" color="success" variant="outlined" />
                  </Box>
                )}

                {report.cached && (
                  <Box sx={{ mt: 2 }}>
                    <Button size="small" startIcon={<Refresh />} onClick={generateReport} disabled={generating}>
                      Refresh Analysis
                    </Button>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Metrics Breakdown */}
          <Grid xs={12} md={4}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <TrendingUp color="primary" />
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Key Metrics</Typography>
                </Box>
                {report.metrics && (
                  <>
                    <MetricBar label="Attendance Rate" value={report.metrics.attendance_pct} color={report.metrics.attendance_pct >= 75 ? 'success' : 'error'} />
                    <MetricBar label="Task Completion Rate" value={report.metrics.completion_rate} color={report.metrics.completion_rate >= 70 ? 'success' : 'warning'} />
                    <MetricBar label="Average Task Progress" value={report.metrics.avg_progress} color="primary" />
                    <MetricBar label="Quality Rating" value={report.metrics.quality_rating * 10} color="secondary" />

                    <Divider sx={{ my: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="caption" color="text.secondary">Tasks Completed</Typography>
                      <Typography variant="caption" fontWeight={700}>{report.metrics.completed_tasks}/{report.metrics.total_tasks}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">Days Present (30d)</Typography>
                      <Typography variant="caption" fontWeight={700}>{report.metrics.present_days}/30</Typography>
                    </Box>
                  </>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Score Breakdown */}
          <Grid xs={12} md={4}>
            <Paper className="glass-card" elevation={0} sx={{ p: 3, height: '100%' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, justifyContent: { xs: 'center', md: 'flex-start' } }}>
                  <Star sx={{ color: '#f59e0b' }} />
                  <Typography variant="h6" fontWeight={800} sx={{ fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>Score Breakdown</Typography>
                </Box>
                <Box>
                  {[
                    { label: 'Attendance (25%)', value: Math.round((report.metrics?.attendance_pct || 0) * 0.25), color: '#22c55e' },
                    { label: 'Task Completion (30%)', value: Math.round((report.metrics?.completion_rate || 0) * 0.30), color: '#6366f1' },
                    { label: 'Avg Progress (20%)', value: Math.round((report.metrics?.avg_progress || 0) * 0.20), color: '#f59e0b' },
                    { label: 'Quality Rating (25%)', value: Math.round(Math.min(report.metrics?.quality_rating * 10 || 0, 100) * 0.25), color: '#ec4899' },
                  ].map((item, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: item.color, flexShrink: 0 }} />
                      <Box sx={{ flex: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" fontWeight={600}>{item.label}</Typography>
                          <Typography variant="caption" fontWeight={700} sx={{ color: item.color }}>{item.value} pts</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={item.value} sx={{ height: 6, borderRadius: 3, bgcolor: item.color + '22', '& .MuiLinearProgress-bar': { bgcolor: item.color } }} />
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* AI Narrative Report */}
          {report.report && (
            <Grid xs={12}>
              <Paper className="glass-card" elevation={0} sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <AutoAwesome sx={{ color: '#8b5cf6' }} />
                  <Typography variant="h6" fontWeight={800}>AI Performance Report</Typography>
                  <Chip label="Gemini AI" size="small" sx={{ bgcolor: '#1a73e820', color: '#1a73e8', fontWeight: 700, ml: 1 }} />
                </Box>

                {/* Executive Summary */}
                {report.report.executive_summary && (
                  <Alert severity="info" icon={<AutoAwesome />} sx={{ mb: 3, borderRadius: 2 }}>
                    <Typography variant="body2" fontWeight={500}>{report.report.executive_summary}</Typography>
                  </Alert>
                )}

                <Grid container spacing={3}>
                  {/* Strengths */}
                  {report.report.strengths?.length > 0 && (
                    <Grid xs={12} md={6}>
                      <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'success.light', borderRadius: '12px !important' }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CheckCircle color="success" fontSize="small" />
                            <Typography fontWeight={700} color="success.main">Strengths</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {report.report.strengths.map((s, i) => (
                              <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}><FiberManualRecord sx={{ fontSize: 8, color: 'success.main' }} /></ListItemIcon>
                                <ListItemText primary={s} primaryTypographyProps={{ variant: 'body2' }} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Areas for Improvement */}
                  {report.report.areas_for_improvement?.length > 0 && (
                    <Grid xs={12} md={6}>
                      <Accordion defaultExpanded elevation={0} sx={{ border: '1px solid', borderColor: 'warning.light', borderRadius: '12px !important' }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <TrendingUp color="warning" fontSize="small" />
                            <Typography fontWeight={700} color="warning.main">Areas to Improve</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {report.report.areas_for_improvement.map((a, i) => (
                              <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 24 }}><FiberManualRecord sx={{ fontSize: 8, color: 'warning.main' }} /></ListItemIcon>
                                <ListItemText primary={a} primaryTypographyProps={{ variant: 'body2' }} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}

                  {/* Recommended Actions */}
                  {report.report.recommended_actions_for_intern?.length > 0 && (
                    <Grid xs={12}>
                      <Accordion elevation={0} sx={{ border: '1px solid', borderColor: 'primary.light', borderRadius: '12px !important' }}>
                        <AccordionSummary expandIcon={<ExpandMore />}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <School color="primary" fontSize="small" />
                            <Typography fontWeight={700} color="primary.main">Your Action Plan</Typography>
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails>
                          <List dense>
                            {report.report.recommended_actions_for_intern.map((a, i) => (
                              <ListItem key={i} disablePadding sx={{ mb: 0.5 }}>
                                <ListItemIcon sx={{ minWidth: 28 }}>
                                  <Chip label={i + 1} size="small" color="primary" sx={{ width: 20, height: 20, fontSize: '0.65rem' }} />
                                </ListItemIcon>
                                <ListItemText primary={a} primaryTypographyProps={{ variant: 'body2' }} />
                              </ListItem>
                            ))}
                          </List>
                        </AccordionDetails>
                      </Accordion>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      ) : (
        <Paper className="glass-card" elevation={0} sx={{ p: 6, textAlign: 'center' }}>
          <Psychology sx={{ fontSize: 80, color: '#8b5cf6', mb: 2, opacity: 0.5 }} />
          <Typography variant="h5" fontWeight={700} mb={1}>No AI Report Yet</Typography>
          <Typography variant="body2" color="text.secondary" mb={3}>
            Generate your first AI performance analysis powered by Google Gemini.
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={generateReport}
            disabled={generating}
            startIcon={generating ? <CircularProgress size={18} color="inherit" /> : <AutoAwesome />}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', fontWeight: 700 }}
          >
            {generating ? 'Analyzing...' : 'Generate My AI Performance Report'}
          </Button>
        </Paper>
      )}
    </motion.div>
  );
}
