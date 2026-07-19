import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, MenuItem, CircularProgress, 
  Tooltip, IconButton
} from '@mui/material';
import { AutoAwesome } from '@mui/icons-material';
import { tasksAPI, usersAPI } from '../../services/api';
import { aiUtils } from '../../utils/aiUtils';

export default function CreateTaskDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [interns, setInterns] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assigned_to: '',
    priority: 'Medium',
    task_type: 'Development',
    deadline: ''
  });

  useEffect(() => {
    if (open) {
      usersAPI.interns().then(res => setInterns(res.data)).catch(console.error);
    }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await tasksAPI.create(formData);
      if (onSuccess) onSuccess();
      onClose();
      setFormData({
        title: '', description: '', assigned_to: '', priority: 'Medium', task_type: 'Development', deadline: ''
      });
    } catch (err) {
      console.error(err);
      alert('Error creating task');
    } finally {
      setLoading(false);
    }
  };

  const handleAISuggest = async () => {
    if (!formData.title) {
      alert("Please enter a Task Title first.");
      return;
    }
    setIsSuggesting(true);
    try {
      const suggestion = await aiUtils.suggestTaskAssignment({ title: formData.title, type: formData.task_type });
      setFormData({
        ...formData,
        description: suggestion.suggestedDescription + '\n\n[AI Breakdown]:\n' + suggestion.subtasks.join('\n'),
        priority: suggestion.priority,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSuggesting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <form onSubmit={handleSubmit}>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Create New Task
          <Tooltip title="AI Suggest Description">
            <IconButton onClick={handleAISuggest} disabled={isSuggesting} sx={{ color: 'var(--color-primary)' }}>
              {isSuggesting ? <CircularProgress size={24} /> : <AutoAwesome />}
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3} sx={{ pt: 1 }}>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Assign To"
                required
                value={formData.assigned_to}
                onChange={(e) => setFormData({...formData, assigned_to: e.target.value})}
              >
                {interns.map(i => (
                  <MenuItem key={i.emp_id} value={i.emp_id}>{i.full_name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                type="date"
                fullWidth
                label="Deadline"
                required
                slotProps={{ inputLabel: { shrink: true } }}
                value={formData.deadline}
                onChange={(e) => setFormData({...formData, deadline: e.target.value})}
              />
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Priority"
                value={formData.priority}
                onChange={(e) => setFormData({...formData, priority: e.target.value})}
              >
                <MenuItem value="Low">Low</MenuItem>
                <MenuItem value="Medium">Medium</MenuItem>
                <MenuItem value="High">High</MenuItem>
                <MenuItem value="Critical">Critical</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Task Type"
                value={formData.task_type}
                onChange={(e) => setFormData({...formData, task_type: e.target.value})}
              >
                <MenuItem value="Development">Development</MenuItem>
                <MenuItem value="Testing">Testing</MenuItem>
                <MenuItem value="Documentation">Documentation</MenuItem>
                <MenuItem value="Design">Design</MenuItem>
              </TextField>
            </Grid>
            <Grid xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">Cancel</Button>
          <Button type="submit" variant="contained" disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}>
            Create Task
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
