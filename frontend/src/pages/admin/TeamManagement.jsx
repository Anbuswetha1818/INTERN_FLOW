import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Chip, CircularProgress, Tooltip
} from '@mui/material';
import { Add, Edit, Delete, PersonAdd } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { tasksAPI, usersAPI } from '../../services/api';
import { ConfirmDialog, EmptyState } from '../../components/common';
import { useAuth } from '../../contexts/AuthContext';

export default function TeamManagement() {
  const [teams, setTeams] = useState([]);
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const { permissions } = useAuth();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [formData, setFormData] = useState({ name: '', mentor: '' });
  
  const [deleteDialog, setDeleteDialog] = useState({ open: false, teamId: null });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [teamsRes, staffRes] = await Promise.all([
        tasksAPI.teams(),
        usersAPI.staffList()
      ]);
      setTeams(teamsRes.data || []);
      setStaff(staffRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (team = null) => {
    if (team) {
      setEditingTeam(team);
      setFormData({ name: team.name, mentor: team.mentor || '' });
    } else {
      setEditingTeam(null);
      setFormData({ name: '', mentor: '' });
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingTeam(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTeam) {
        await tasksAPI.updateTeam(editingTeam.id, formData);
      } else {
        await tasksAPI.createTeam(formData);
      }
      handleCloseDialog();
      fetchData();
    } catch (err) {
      console.error('Failed to save team', err);
    }
  };

  const handleDelete = async () => {
    try {
      await tasksAPI.deleteTeam(deleteDialog.teamId);
      setDeleteDialog({ open: false, teamId: null });
      fetchData();
    } catch (err) {
      console.error('Failed to delete team', err);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Team Management</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage project teams and assign mentors.
          </Typography>
        </Box>
        {permissions?.canCreateTeam && (
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenDialog()}>
            Create Team
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        </Box>
      ) : teams.length === 0 ? (
        <Paper className="glass-card" sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No teams found</Typography>
          {permissions?.canCreateTeam && (
            <Button variant="outlined" sx={{ mt: 2 }} onClick={() => handleOpenDialog()}>Create your first team</Button>
          )}
        </Paper>
      ) : (
        <TableContainer component={Paper} className="glass-card">
          <Table>
            <TableHead sx={{ bgcolor: 'var(--bg-primary)' }}>
              <TableRow>
                <TableCell>Team Name</TableCell>
                <TableCell>Mentor / Lead</TableCell>
                <TableCell>Interns Count</TableCell>
                {permissions?.canCreateTeam && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id} hover>
                  <TableCell fontWeight="500">{team.name}</TableCell>
                  <TableCell>
                    {team.mentor_name ? (
                      <Chip label={team.mentor_name} size="small" sx={{ bgcolor: 'var(--color-primary)', color: 'white' }} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">Unassigned</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip label={`${team.intern_count || 0} Interns`} size="small" variant="outlined" />
                  </TableCell>
                  {permissions?.canCreateTeam && (
                    <TableCell align="right">
                      <Tooltip title="Edit Team">
                        <IconButton size="small" onClick={() => handleOpenDialog(team)} sx={{ mr: 1, color: 'var(--color-primary)' }}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Team">
                        <IconButton size="small" onClick={() => setDeleteDialog({ open: true, teamId: team.id })} color="error">
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit}>
          <DialogTitle>{editingTeam ? 'Edit Team' : 'Create New Team'}</DialogTitle>
          <DialogContent dividers>
            <TextField
              label="Team Name"
              fullWidth
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              sx={{ mb: 3, mt: 1 }}
            />
            <TextField
              select
              label="Assign Mentor / Lead"
              fullWidth
              value={formData.mentor}
              onChange={(e) => setFormData({ ...formData, mentor: e.target.value })}
              helperText="Optional: You can assign a mentor later."
            >
              <MenuItem value=""><em>Unassigned</em></MenuItem>
              {staff.map((s) => (
                <MenuItem key={s.emp_id} value={s.emp_id}>
                  {s.username || s.emp_id} ({s.role})
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">
              {editingTeam ? 'Save Changes' : 'Create Team'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Note: I'll implement ConfirmDialog and EmptyState later in Phase H. */}
      {deleteDialog.open && (
        <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, teamId: null })}>
          <DialogTitle>Delete Team</DialogTitle>
          <DialogContent>Are you sure you want to delete this team?</DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialog({ open: false, teamId: null })}>Cancel</Button>
            <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      )}
    </motion.div>
  );
}
