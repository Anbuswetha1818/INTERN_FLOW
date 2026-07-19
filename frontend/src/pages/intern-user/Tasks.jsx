import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  Slider, Select, MenuItem, FormControl, InputLabel, Divider
} from '@mui/material';
import { AssignmentTurnedIn, PlayArrow, CheckCircle, Description, Close } from '@mui/icons-material';
import { tasksAPI } from '../../services/api';
import { LoadingSpinner, PriorityBadge } from '../../components/common';
import { motion } from 'framer-motion';

export default function InternTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [editProgress, setEditProgress] = useState(0);
  const [editStatus, setEditStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await tasksAPI.list();
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const getStatusColor = (status) => {
    switch(status) {
      case 'todo': return 'error.main';
      case 'inprogress': return 'warning.main';
      case 'completed': return 'success.main';
      case 'verified': return 'info.main';
      default: return 'text.secondary';
    }
  };

  const getStatusLabel = (status) => {
    switch(status) {
      case 'todo': return 'To Do';
      case 'inprogress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'verified': return 'Verified';
      default: return status;
    }
  };

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setEditProgress(task.progress || 0);
    setEditStatus(task.status);
  };

  const handleCloseTask = () => {
    setSelectedTask(null);
  };

  const handleSaveUpdate = async () => {
    if (!selectedTask) return;
    try {
      setSaving(true);
      
      // Auto-adjust status based on progress if user didn't explicitly change it
      let finalStatus = editStatus;
      if (editProgress === 100 && finalStatus !== 'completed' && finalStatus !== 'verified') {
        finalStatus = 'completed';
      } else if (editProgress > 0 && editProgress < 100 && finalStatus === 'todo') {
        finalStatus = 'inprogress';
      }
      
      await tasksAPI.update(selectedTask.id, {
        progress: editProgress,
        status: finalStatus
      });
      
      await fetchTasks();
      handleCloseTask();
    } catch (err) {
      console.error("Failed to update task", err);
    } finally {
      setSaving(false);
    }
  };

  const quickStartTask = async (e, task) => {
    e.stopPropagation();
    try {
      setLoading(true);
      await tasksAPI.update(task.id, { status: 'inprogress', progress: Math.max(task.progress, 5) });
      fetchTasks();
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (loading && tasks.length === 0) return <LoadingSpinner text="Loading your tasks..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>My Tasks</Typography>
          <Typography variant="body2" color="text.secondary">View and manage your assigned tasks.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<AssignmentTurnedIn />}>Task History</Button>
      </Box>

      {/* Kanban-style simple columns */}
      <Grid container spacing={3}>
        {['todo', 'inprogress', 'completed'].map(column => {
          const colTasks = tasks.filter(t => t.status === column);
          return (
            <Grid xs={12} md={4} key={column}>
              <Box className="glass-card" sx={{ p: 2, height: '100%', bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ color: getStatusColor(column) }}>
                    {getStatusLabel(column)}
                  </Typography>
                  <Chip size="small" label={colTasks.length} />
                </Box>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {colTasks.map(task => (
                    <Paper 
                      key={task.id} 
                      elevation={0} 
                      onClick={() => handleOpenTask(task)}
                      sx={{ 
                        p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider', 
                        cursor: 'pointer', transition: 'all 0.2s', 
                        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-2px)' } 
                      }}
                    >
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Chip size="small" label={task.task_type} sx={{ height: 20, fontSize: '0.7rem' }} />
                        <PriorityBadge priority={task.priority} />
                      </Box>
                      <Typography fontWeight={700} variant="body2" mb={1}>{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary" display="block" mb={2} sx={{ lineHeight: 1.6 }}>
                        Due: {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'N/A'} <br />
                        Assigned by: {task.created_by_name || 'System'}
                      </Typography>
                      
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" fontWeight={600} color={task.progress === 100 ? 'success.main' : 'primary.main'}>
                          {task.progress}%
                        </Typography>
                        
                        {task.status === 'todo' ? (
                          <Button 
                            size="small" 
                            variant="outlined" 
                            color="primary" 
                            startIcon={<PlayArrow sx={{ fontSize: 16 }} />}
                            onClick={(e) => quickStartTask(e, task)}
                            sx={{ py: 0, px: 1, minWidth: 0, fontSize: '0.7rem' }}
                          >
                            Start
                          </Button>
                        ) : (
                          <Avatar 
                            title={`Assigned by ${task.created_by_name || 'System'}`}
                            sx={{ width: 24, height: 24, fontSize: '0.7rem', bgcolor: 'secondary.main' }}
                          >
                            {task.created_by_name ? task.created_by_name.charAt(0) : 'S'}
                          </Avatar>
                        )}
                      </Box>
                    </Paper>
                  ))}
                  {colTasks.length === 0 && (
                    <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed', borderColor: 'divider', borderRadius: 2 }}>
                      <Typography variant="caption" color="text.secondary">No tasks in this column</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            </Grid>
          );
        })}
      </Grid>

      {/* Task Detail & Update Modal */}
      <Dialog 
        open={Boolean(selectedTask)} 
        onClose={handleCloseTask}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
      >
        {selectedTask && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
              <Typography variant="h6" fontWeight={800}>{selectedTask.title}</Typography>
              <Box sx={{ cursor: 'pointer', p: 0.5 }} onClick={handleCloseTask}>
                <Close color="action" />
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                <Chip label={getStatusLabel(selectedTask.status)} size="small" sx={{ bgcolor: getStatusColor(selectedTask.status) + '22', color: getStatusColor(selectedTask.status), fontWeight: 700 }} />
                <PriorityBadge priority={selectedTask.priority} />
                <Chip label={selectedTask.task_type} size="small" variant="outlined" />
              </Box>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2, whiteSpace: 'pre-wrap' }}>
                {selectedTask.description || "No description provided."}
              </Typography>

              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 4 }}>
                <strong>Assigned by:</strong> {selectedTask.created_by_name || 'System'}
              </Typography>

              <Divider sx={{ mb: 3 }} />

              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Update Progress</Typography>
              
              <Box sx={{ px: 1, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">Completion</Typography>
                  <Typography variant="body2" fontWeight={700} color="primary">{editProgress}%</Typography>
                </Box>
                <Slider 
                  value={editProgress} 
                  onChange={(e, val) => setEditProgress(val)} 
                  step={5} 
                  marks 
                  min={0} 
                  max={100} 
                  valueLabelDisplay="auto"
                  disabled={selectedTask.status === 'verified'}
                />
              </Box>

              <FormControl fullWidth size="small" disabled={selectedTask.status === 'verified'}>
                <InputLabel>Status</InputLabel>
                <Select
                  value={editStatus}
                  label="Status"
                  onChange={(e) => setEditStatus(e.target.value)}
                >
                  <MenuItem value="todo">To Do</MenuItem>
                  <MenuItem value="inprogress">In Progress</MenuItem>
                  <MenuItem value="completed">Completed (Ready for Review)</MenuItem>
                  {selectedTask.status === 'verified' && <MenuItem value="verified">Verified</MenuItem>}
                </Select>
              </FormControl>

            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 3 }}>
              <Button onClick={handleCloseTask} color="inherit">Cancel</Button>
              <Button 
                variant="contained" 
                onClick={handleSaveUpdate} 
                disabled={saving || selectedTask.status === 'verified'}
                startIcon={saving ? <LoadingSpinner size={20} /> : <CheckCircle />}
              >
                Save Updates
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </motion.div>
  );
}
