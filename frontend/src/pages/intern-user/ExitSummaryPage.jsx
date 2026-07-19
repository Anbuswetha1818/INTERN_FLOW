import { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, Button, CircularProgress, Divider, LinearProgress, Chip } from '@mui/material';
import { School, TrendingUp, AutoAwesome, Download, Work } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { aiUtils } from '../../utils/aiUtils';

export default function ExitSummaryPage() {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const growth = await aiUtils.trackSkillGrowth('intern123');
      setReport({
        careerReadinessScore: growth.currentMonthScore + 5, // mock calculation
        topSkill: growth.topSkill,
        previousScore: growth.previousMonthScore,
        currentScore: growth.currentMonthScore,
        summary: `You have shown exceptional growth during this internship, particularly in ${growth.topSkill}. Your task completion rate and overall engagement indicate strong readiness for an associate-level position.`
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>AI Exit Summary & Career Readiness</Typography>
          <Typography variant="body2" color="text.secondary">
            Your final internship performance report and career readiness assessment.
          </Typography>
        </Box>
        {!report && (
          <Button 
            variant="contained" 
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
            onClick={handleGenerate}
            disabled={loading}
            sx={{ background: 'var(--gradient-primary)', borderRadius: 8, px: 3 }}
          >
            {loading ? "Analyzing Internship Data..." : "Generate Exit Report"}
          </Button>
        )}
      </Box>

      {!report && !loading && (
        <Paper className="glass-card" sx={{ p: 8, textAlign: 'center' }}>
          <School sx={{ fontSize: 80, color: 'var(--color-primary)', mb: 2, opacity: 0.8 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>Ready to conclude your internship?</Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 600, mx: 'auto', mb: 4 }}>
            Our AI will aggregate your tasks, attendance, performance feedback, and learning path data to generate a comprehensive Career Readiness Report. This report can be used for your job applications.
          </Typography>
          <Button 
            variant="contained" 
            size="large"
            startIcon={<AutoAwesome />}
            onClick={handleGenerate}
            sx={{ background: 'var(--gradient-primary)', borderRadius: 8, px: 4, py: 1.5 }}
          >
            Generate AI Exit Summary
          </Button>
        </Paper>
      )}

      {loading && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 10 }}>
          <CircularProgress size={60} thickness={4} sx={{ color: 'var(--color-primary)', mb: 3 }} />
          <Typography variant="h6" fontWeight={600}>Synthesizing Your Journey...</Typography>
          <Typography color="text.secondary">Evaluating tasks, attendance, and feedback metrics.</Typography>
        </Box>
      )}

      {report && (
        <Grid container spacing={3}>
          <Grid xs={12} md={4}>
            <Paper className="glass-card" sx={{ p: 4, textAlign: 'center', height: '100%' }}>
              <Work sx={{ fontSize: 60, color: 'var(--color-accent)', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>Career Readiness Score</Typography>
              
              <Box sx={{ position: 'relative', display: 'inline-flex', my: 3 }}>
                <CircularProgress variant="determinate" value={100} size={150} thickness={4} sx={{ color: 'rgba(255,255,255,0.05)' }} />
                <CircularProgress variant="determinate" value={report.careerReadinessScore} size={150} thickness={4} sx={{ color: 'var(--color-success)', position: 'absolute', left: 0 }} />
                <Box sx={{ top: 0, left: 0, bottom: 0, right: 0, position: 'absolute', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
                  <Typography variant="h3" fontWeight={900} color="primary.main">{report.careerReadinessScore}</Typography>
                  <Typography variant="caption" color="text.secondary">out of 100</Typography>
                </Box>
              </Box>
              
              <Chip label="Ready for Placement" color="success" sx={{ fontWeight: 700, px: 2, py: 2.5, borderRadius: 2 }} />
            </Paper>
          </Grid>
          
          <Grid xs={12} md={8}>
            <Paper className="glass-card" sx={{ p: 4, height: '100%' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" fontWeight={800}>Performance Summary</Typography>
                <Button variant="outlined" startIcon={<Download />} size="small">Export PDF</Button>
              </Box>
              <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.1)' }} />
              
              <Typography variant="body1" sx={{ mb: 4, lineHeight: 1.8, fontSize: '1.1rem' }}>
                {report.summary}
              </Typography>
              
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <TrendingUp color="primary" /> Skill Growth Trajectory
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Month 1 Baseline</Typography>
                  <Typography variant="body2" fontWeight={600}>{report.previousScore}/100</Typography>
                </Box>
                <LinearProgress variant="determinate" value={report.previousScore} sx={{ height: 8, borderRadius: 4, mb: 2 }} color="inherit" />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Current Level</Typography>
                  <Typography variant="body2" fontWeight={600}>{report.currentScore}/100</Typography>
                </Box>
                <LinearProgress variant="determinate" value={report.currentScore} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: 'var(--color-primary)' } }} />
              </Box>
              
              <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(0,188,212,0.05)', borderRadius: 2, border: '1px solid rgba(0,188,212,0.2)' }}>
                <Typography variant="subtitle2" color="primary" fontWeight={700} mb={1}>Key Strength Identified</Typography>
                <Typography variant="body2">Based on task evaluations, your strongest competency is <strong>{report.topSkill}</strong>. We recommend highlighting this prominently on your resume and during interviews.</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}
    </motion.div>
  );
}
