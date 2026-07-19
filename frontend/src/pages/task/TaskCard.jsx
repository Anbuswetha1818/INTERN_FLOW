import { Box, Typography, Paper, Avatar, Tooltip } from '@mui/material';
import { motion } from 'framer-motion';
import { PriorityBadge, SLABadge } from '../../components/common';
import { CalendarToday, Message } from '@mui/icons-material';

export default function TaskCard({ task, onClick }) {
  if (!task) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Paper 
        className="glass-card" 
        sx={{ 
          p: 2, mb: 2, cursor: 'pointer', 
          borderLeft: '4px solid',
          borderColor: 
            task.priority === 'High' || task.priority === 'Critical' ? 'error.main' : 
            task.priority === 'Medium' ? 'warning.main' : 'success.main',
          '&:hover': { boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }
        }}
        onClick={() => onClick && onClick(task)}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <PriorityBadge priority={task.priority} />
            <SLABadge deadline={task.deadline} status={task.status} />
          </Box>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            {task.task_type}
          </Typography>
        </Box>

        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1, lineHeight: 1.2 }}>
          {task.title}
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ 
          mb: 2, 
          display: '-webkit-box', 
          WebkitLineClamp: 2, 
          WebkitBoxOrient: 'vertical', 
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {task.description || 'No description provided.'}
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary' }}>
            <CalendarToday sx={{ fontSize: 14 }} />
            <Typography variant="caption" fontWeight={600}>
              {task.deadline ? new Date(task.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date'}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {task.comments_count > 0 && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: 'text.secondary' }}>
                <Message sx={{ fontSize: 14 }} />
                <Typography variant="caption" fontWeight={600}>{task.comments_count}</Typography>
              </Box>
            )}
            <Tooltip title={task.assigned_to_name || 'Unassigned'}>
              <Avatar 
                sx={{ 
                  width: 24, height: 24, 
                  bgcolor: 'var(--color-primary)', 
                  fontSize: '0.75rem', fontWeight: 700 
                }}
              >
                {task.assigned_to_name ? task.assigned_to_name.charAt(0).toUpperCase() : '?'}
              </Avatar>
            </Tooltip>
          </Box>
        </Box>
      </Paper>
    </motion.div>
  );
}
