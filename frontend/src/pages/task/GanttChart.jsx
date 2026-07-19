import { Box, Typography, Paper, Grid } from '@mui/material';
import { motion } from 'framer-motion';
import { ViewTimeline } from '@mui/icons-material';

const MOCK_TASKS = [
  { id: 1, name: "Frontend Setup", start: 0, duration: 20, color: "var(--color-primary)" },
  { id: 2, name: "Backend API", start: 10, duration: 30, color: "var(--color-accent)" },
  { id: 3, name: "AI Integration", start: 40, duration: 40, color: "#f59e0b" },
  { id: 4, name: "Testing & QA", start: 70, duration: 20, color: "#22c55e" },
  { id: 5, name: "Deployment", start: 90, duration: 10, color: "#ef4444" },
];

export default function GanttChart() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ViewTimeline sx={{ color: '#8b5cf6' }} /> Timeline & Gantt
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Visualize project timelines and task dependencies across departments.
        </Typography>
      </Box>

      <Paper className="glass-card" sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={700}>Project Alpha - Master Timeline</Typography>
          <Typography variant="body2" color="text.secondary">Q3 2026</Typography>
        </Box>

        {/* Timeline Header */}
        <Box sx={{ display: 'flex', mb: 2, borderBottom: '1px solid rgba(255,255,255,0.1)', pb: 1 }}>
          <Box sx={{ width: 200, flexShrink: 0 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={700}>TASK NAME</Typography>
          </Box>
          <Box sx={{ flexGrow: 1, display: 'flex', justifyContent: 'space-between', px: 2 }}>
            <Typography variant="caption" color="text.secondary">Week 1</Typography>
            <Typography variant="caption" color="text.secondary">Week 2</Typography>
            <Typography variant="caption" color="text.secondary">Week 3</Typography>
            <Typography variant="caption" color="text.secondary">Week 4</Typography>
          </Box>
        </Box>

        {/* Gantt Bars */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {MOCK_TASKS.map(task => (
            <Box key={task.id} sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ width: 200, flexShrink: 0 }}>
                <Typography variant="body2" fontWeight={500}>{task.name}</Typography>
              </Box>
              <Box sx={{ flexGrow: 1, position: 'relative', height: 24, bgcolor: 'rgba(255,255,255,0.02)', borderRadius: 1 }}>
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${task.duration}%` }}
                  transition={{ duration: 1, delay: task.id * 0.1 }}
                  style={{
                    position: 'absolute',
                    left: `${task.start}%`,
                    height: '100%',
                    backgroundColor: task.color,
                    borderRadius: 4,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 8px',
                    boxShadow: `0 0 10px ${task.color}80`
                  }}
                >
                  <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.65rem', fontWeight: 700 }}>
                    {task.duration}d
                  </Typography>
                </motion.div>
              </Box>
            </Box>
          ))}
        </Box>
        
        {/* Legend */}
        <Box sx={{ display: 'flex', gap: 3, mt: 5, justifyContent: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'var(--color-primary)' }} />
            <Typography variant="caption">Planning</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: 'var(--color-accent)' }} />
            <Typography variant="caption">Development</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: '#f59e0b' }} />
            <Typography variant="caption">Review</Typography>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}
