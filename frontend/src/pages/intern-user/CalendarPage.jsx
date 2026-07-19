import { useState } from 'react';
import { Box, Typography, Paper, Grid, Chip } from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import { motion } from 'framer-motion';

export default function CalendarPage() {
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  const events = {
    5: [{ title: 'Project Kickoff', type: 'task' }],
    12: [{ title: 'Design Review', type: 'task' }, { title: 'Leave', type: 'leave' }],
    18: [{ title: 'Mock Interview', type: 'milestone' }],
    25: [{ title: 'Weekly Sync', type: 'task' }],
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CalendarMonth color="primary" /> Unified Calendar
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Track your tasks, leaves, and program milestones.
        </Typography>
      </Box>

      <Paper className="glass-card" sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 4, justifyContent: 'center' }}>
          <Chip label="Tasks" sx={{ bgcolor: 'rgba(108,63,224,0.1)', color: 'var(--color-primary)' }} />
          <Chip label="Leave" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#ef4444' }} />
          <Chip label="Milestones" sx={{ bgcolor: 'rgba(0,188,212,0.1)', color: 'var(--color-accent)' }} />
        </Box>

        <Grid container spacing={1}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <Grid xs={12/7} key={d} sx={{ textAlign: 'center', fontWeight: 700, mb: 2, color: 'text.secondary' }}>
              {d}
            </Grid>
          ))}
          {/* Empty slots for visual offset */}
          <Grid xs={12/7}></Grid>
          <Grid xs={12/7}></Grid>
          
          {days.map(day => (
            <Grid xs={12/7} key={day}>
              <Box sx={{ 
                border: '1px solid rgba(255,255,255,0.05)', 
                minHeight: 100, 
                p: 1, 
                borderRadius: 2,
                bgcolor: 'rgba(255,255,255,0.02)',
                transition: 'all 0.2s',
                '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', borderColor: 'primary.main' }
              }}>
                <Typography variant="body2" fontWeight={700} sx={{ mb: 1, opacity: 0.7 }}>{day}</Typography>
                
                {events[day]?.map((ev, i) => (
                  <Box key={i} sx={{ 
                    p: 0.5, 
                    mb: 0.5, 
                    borderRadius: 1, 
                    fontSize: '0.7rem', 
                    fontWeight: 600,
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    bgcolor: ev.type === 'task' ? 'rgba(108,63,224,0.1)' : 
                             ev.type === 'leave' ? 'rgba(239,68,68,0.1)' : 'rgba(0,188,212,0.1)',
                    color: ev.type === 'task' ? 'var(--color-primary)' : 
                           ev.type === 'leave' ? '#ef4444' : 'var(--color-accent)'
                  }}>
                    {ev.title}
                  </Box>
                ))}
              </Box>
            </Grid>
          ))}
        </Grid>
      </Paper>
    </motion.div>
  );
}
