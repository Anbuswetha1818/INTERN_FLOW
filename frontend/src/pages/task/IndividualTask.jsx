import { useState } from 'react';
import { Box, Typography, Paper, Grid, Avatar, Divider, Chip, Button, TextField, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Assignment, CalendarToday, CheckCircle, ChatBubble, Send, Link as LinkIcon, Warning } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { PriorityBadge, StatusChip } from '../../components/common';

const MOCK_TASK = {
  id: 101,
  title: 'Implement Authentication API',
  description: 'Design and implement the JWT based authentication API including login, register, and password reset endpoints.',
  status: 'In Progress',
  priority: 'High',
  task_type: 'Development',
  assigned_to_name: 'John Doe',
  created_at: '2026-06-10T10:00:00Z',
  deadline: '2026-06-20T17:00:00Z',
  progress: 60,
  project_name: 'Core Platform',
  dependencies: {
    blocked_by: [{ id: 99, title: 'Database Schema Design', status: 'Completed' }],
    blocking: [{ id: 105, title: 'Frontend Login Page Integration', status: 'Pending' }]
  }
};

const MOCK_ACTIVITIES = [
  { id: 1, type: 'status_change', user: 'Admin', content: 'Changed status from Pending to In Progress', time: '2 hours ago' },
  { id: 2, type: 'comment', user: 'John Doe', content: 'Started working on the login endpoint. Will push a draft PR today.', time: '5 hours ago' },
  { id: 3, type: 'assignment', user: 'Admin', content: 'Assigned task to John Doe', time: '2 days ago' },
  { id: 4, type: 'creation', user: 'Admin', content: 'Created the task', time: '2 days ago' }
];

export default function IndividualTask({ taskId }) {
  const [comment, setComment] = useState('');
  const [activities, setActivities] = useState(MOCK_ACTIVITIES);

  // In a real scenario, fetch task details and activities using taskId
  const task = MOCK_TASK;

  const handleAddComment = () => {
    if (!comment.trim()) return;
    const newActivity = {
      id: Date.now(),
      type: 'comment',
      user: 'Current User',
      content: comment,
      time: 'Just now'
    };
    setActivities([newActivity, ...activities]);
    setComment('');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Typography variant="h4" fontWeight={800}>{task.title}</Typography>
            <StatusChip status={task.status} />
            <PriorityBadge priority={task.priority} />
          </Box>
          <Typography variant="body1" color="text.secondary">
            {task.project_name} • {task.task_type} • Created on {new Date(task.created_at).toLocaleDateString()}
          </Typography>
        </Box>
        <Button variant="contained">Mark as Complete</Button>
      </Box>

      <Grid container spacing={4}>
        <Grid xs={12} md={8}>
          <Paper className="glass-card" sx={{ p: 4, mb: 4 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Description</Typography>
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', mb: 4 }}>
              {task.description}
            </Typography>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" fontWeight={700} mb={3}>Activity & Comments</Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 4 }}>
              <Avatar sx={{ bgcolor: 'var(--color-primary)' }}>U</Avatar>
              <Box sx={{ flex: 1, display: 'flex', gap: 1 }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Add a comment or update..." 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <Button variant="contained" onClick={handleAddComment} sx={{ minWidth: 'auto', px: 3 }}>
                  <Send fontSize="small" />
                </Button>
              </Box>
            </Box>

            {/* Custom Timeline */}
            <Box sx={{ ml: 2, borderLeft: '2px solid var(--border-subtle)', pl: 3, position: 'relative' }}>
              {activities.map((act) => (
                <Box key={act.id} sx={{ mb: 4, position: 'relative' }}>
                  <Box sx={{ 
                    position: 'absolute', left: -33, top: 0, 
                    width: 16, height: 16, borderRadius: '50%', 
                    bgcolor: act.type === 'comment' ? 'var(--color-primary)' : 'var(--color-accent)',
                    border: '3px solid var(--bg-card)'
                  }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      {act.user} <Typography component="span" variant="body2" color="text.secondary" fontWeight={400}>
                        {act.type === 'comment' ? 'commented' : act.type === 'status_change' ? 'updated status' : act.type === 'assignment' ? 'assigned' : 'created'}
                      </Typography>
                    </Typography>
                    <Typography variant="caption" color="text.secondary">{act.time}</Typography>
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2, mt: 1, bgcolor: act.type === 'comment' ? 'var(--bg-primary)' : 'transparent', border: act.type !== 'comment' ? 'none' : undefined }}>
                    <Typography variant="body2">{act.content}</Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
        
        <Grid xs={12} md={4}>
          <Paper className="glass-card" sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Task Details</Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Assigned To</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem' }}>{task.assigned_to_name.charAt(0)}</Avatar>
                <Typography variant="body2" fontWeight={600}>{task.assigned_to_name}</Typography>
              </Box>
            </Box>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Deadline</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <CalendarToday fontSize="small" color="error" />
                <Typography variant="body2" fontWeight={600} color="error.main">
                  {new Date(task.deadline).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="text.secondary">Progress</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                <Box sx={{ flex: 1, bgcolor: 'action.hover', height: 8, borderRadius: 4, overflow: 'hidden' }}>
                  <Box sx={{ width: `${task.progress}%`, height: '100%', bgcolor: 'var(--color-primary)' }} />
                </Box>
                <Typography variant="body2" fontWeight={700}>{task.progress}%</Typography>
              </Box>
            </Box>
          </Paper>

          {/* Dependencies UI */}
          <Paper className="glass-card" sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={700} mb={2} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinkIcon fontSize="small" /> Dependencies
            </Typography>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>BLOCKED BY</Typography>
              <List disablePadding sx={{ mt: 1 }}>
                {task.dependencies.blocked_by.map(dep => (
                  <ListItem key={dep.id} disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      {dep.status === 'Completed' ? <CheckCircle color="success" fontSize="small" /> : <Warning color="warning" fontSize="small" />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={<Typography variant="body2" sx={{ textDecoration: dep.status === 'Completed' ? 'line-through' : 'none' }}>{dep.title}</Typography>} 
                      secondary={dep.status}
                    />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>BLOCKING</Typography>
              <List disablePadding sx={{ mt: 1 }}>
                {task.dependencies.blocking.map(dep => (
                  <ListItem key={dep.id} disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 32 }}>
                      <Assignment color="disabled" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={<Typography variant="body2">{dep.title}</Typography>} secondary={dep.status} />
                  </ListItem>
                ))}
              </List>
            </Box>
            
            <Button variant="outlined" size="small" sx={{ mt: 2, width: '100%' }}>Add Dependency</Button>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
