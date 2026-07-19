import { useState } from 'react';
import { Box, Typography, Grid, Paper, Button, LinearProgress, Chip, CircularProgress } from '@mui/material';
import { School, CheckCircle, Lock, PlayCircleOutlineRounded, Psychology, AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { aiUtils } from '../../utils/aiUtils';

export default function LearningPage() {
  const [activeModule, setActiveModule] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const [modules, setModules] = useState([
    { id: 1, title: 'React Fundamentals', status: 'completed', duration: '2h', points: 100 },
    { id: 2, title: 'Advanced State Management', status: 'in-progress', progress: 45, duration: '3h', points: 150 },
    { id: 3, title: 'API Integration & Security', status: 'locked', duration: '1.5h', points: 120 },
    { id: 4, title: 'Performance Optimization', status: 'locked', duration: '2.5h', points: 200 }
  ]);

  const [skills, setSkills] = useState([
    { name: 'React Hooks', value: 90, color: '#22c55e' },
    { name: 'Redux/Context API', value: 45, color: '#f59e0b' },
    { name: 'Performance (Memo/Callback)', value: 20, color: '#ef4444' }
  ]);

  const handleGeneratePath = async () => {
    setIsGenerating(true);
    try {
      const response = await aiUtils.recommendLearning('intern123', 'Frontend Developer');
      // Update UI with mock AI response
      const newModules = response.map((item, index) => ({
        id: Date.now() + index,
        title: item.course,
        status: 'locked',
        duration: '1h',
        points: 50
      }));
      setModules(prev => [...prev, ...newModules]);
      setSkills([
        { name: 'Component Architecture', value: 85, color: '#22c55e' },
        { name: 'State Management', value: 60, color: '#f59e0b' },
        { name: 'Web Vitals & Performance', value: 30, color: '#ef4444' },
      ]);
      setHasGenerated(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>AI Learning Path</Typography>
          <Typography variant="body2" color="text.secondary">
            Personalized curriculum based on your skill gap analysis and project requirements.
          </Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : <AutoAwesome />}
          onClick={handleGeneratePath}
          disabled={isGenerating || hasGenerated}
          sx={{ background: hasGenerated ? 'rgba(255,255,255,0.1)' : 'var(--gradient-primary)', borderRadius: 8, px: 3 }}
        >
          {isGenerating ? "Analyzing Skill Gaps..." : hasGenerated ? "Path Optimized" : "Generate Personalized Path"}
        </Button>
      </Box>

      <Grid container spacing={3}>
        {/* Course Overview & Stats */}
        <Grid xs={12} md={4}>
          <Paper className="glass-card" sx={{ p: 3, mb: 3, textAlign: 'center', background: 'linear-gradient(135deg, rgba(108,63,224,0.1), rgba(0,188,212,0.1))' }}>
            <Psychology sx={{ fontSize: 48, color: 'var(--color-accent)', mb: 1 }} />
            <Typography variant="h6" fontWeight={700}>Domain Readiness</Typography>
            <Typography variant="h3" fontWeight={900} color="primary.main" sx={{ my: 1 }}>68%</Typography>
            <Typography variant="body2" color="text.secondary">
              You're making great progress! Complete 2 more modules to reach target readiness.
            </Typography>
          </Paper>

          <Typography variant="subtitle1" fontWeight={700} mb={2}>Skill Gap Analysis</Typography>
          <Paper className="glass-card" sx={{ p: 3 }}>
            {skills.map((skill, i) => (
              <Box key={i} sx={{ mb: i === skills.length - 1 ? 0 : 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{skill.name}</Typography>
                  <Typography variant="body2" fontWeight={600}>{skill.value}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={skill.value} sx={{ height: 6, borderRadius: 3, '& .MuiLinearProgress-bar': { bgcolor: skill.color } }} />
              </Box>
            ))}
          </Paper>
        </Grid>

        {/* Modules Timeline */}
        <Grid xs={12} md={8}>
          <Paper className="glass-card" sx={{ p: 4, height: '100%' }}>
            <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
              <School /> Up-skilling Pathway
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {modules.map((mod, index) => (
                <Box 
                  key={mod.id} 
                  sx={{ 
                    display: 'flex', 
                    gap: 3, 
                    p: 2, 
                    borderRadius: 3,
                    border: '1px solid',
                    borderColor: mod.status === 'in-progress' ? 'primary.main' : 'rgba(255,255,255,0.05)',
                    bgcolor: mod.status === 'in-progress' ? 'rgba(108,63,224,0.05)' : 'transparent',
                    opacity: mod.status === 'locked' ? 0.6 : 1
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {mod.status === 'completed' && <CheckCircle color="success" fontSize="large" />}
                    {mod.status === 'in-progress' && <PlayCircleOutlineRounded color="primary" fontSize="large" />}
                    {mod.status === 'locked' && <Lock color="action" fontSize="large" />}
                  </Box>
                  
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 0.5 }}>
                      Module {index + 1}: {mod.title || mod.module_name}
                    </Typography>
                    
                    <Box sx={{ display: 'flex', gap: 2, mb: 1 }}>
                      <Chip size="small" label={mod.duration || mod.estimated_hours} variant="outlined" />
                      <Chip size="small" label={`${mod.points || '100'} XP`} variant="outlined" color="secondary" />
                    </Box>

                    {mod.status === 'in-progress' && (
                      <Box sx={{ mt: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="caption" color="text.secondary">Progress</Typography>
                          <Typography variant="caption" fontWeight={600}>{mod.progress}%</Typography>
                        </Box>
                        <LinearProgress variant="determinate" value={mod.progress} sx={{ height: 8, borderRadius: 4 }} />
                        <Button variant="contained" size="small" sx={{ mt: 2, background: 'var(--gradient-primary)' }}>
                          Continue Learning
                        </Button>
                      </Box>
                    )}
                  </Box>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
