import { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, TextField,
  MenuItem, Chip, CircularProgress, Tooltip, Grid, Rating
} from '@mui/material';
import { Add, Visibility, AutoAwesome } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { feedbackAPI, usersAPI } from '../../services/api';
import { aiUtils } from '../../utils/aiUtils';

export default function PerformanceFeedbackPage() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [interns, setInterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrafting, setIsDrafting] = useState(false);
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [viewDialog, setViewDialog] = useState({ open: false, data: null });
  
  const [formData, setFormData] = useState({
    intern: '',
    qualitative_notes: '',
    scores: { technical: 0, communication: 0, teamwork: 0 },
    recommendation: 'Continue'
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [feedbackRes, internRes] = await Promise.all([
        feedbackAPI.list(),
        usersAPI.interns()
      ]);
      setFeedbacks(feedbackRes.data || []);
      setInterns(internRes.data || []);
    } catch (err) {
      console.error('Failed to fetch data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setFormData({
      intern: '',
      qualitative_notes: '',
      scores: { technical: 0, communication: 0, teamwork: 0 },
      recommendation: 'Continue'
    });
    setDialogOpen(true);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    try {
      await feedbackAPI.create(formData);
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Failed to create feedback', err);
    }
  };

  const handleAIDraft = async () => {
    if (!formData.intern) {
      alert("Please select an intern first.");
      return;
    }
    setIsDrafting(true);
    try {
      const summary = await aiUtils.summarizePerformance(formData.intern);
      setFormData(prev => ({
        ...prev,
        qualitative_notes: summary
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsDrafting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Performance Feedback</Typography>
          <Typography variant="body2" color="text.secondary">
            Review and submit intern performance evaluations.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={handleOpenCreate}>
          Submit Feedback
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
          <CircularProgress sx={{ color: 'var(--color-primary)' }} />
        </Box>
      ) : feedbacks.length === 0 ? (
        <Paper className="glass-card" sx={{ p: 5, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No feedback entries found</Typography>
          <Button variant="outlined" sx={{ mt: 2 }} onClick={handleOpenCreate}>Submit first feedback</Button>
        </Paper>
      ) : (
        <TableContainer component={Paper} className="glass-card">
          <Table>
            <TableHead sx={{ bgcolor: 'var(--bg-primary)' }}>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Intern</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Overall Score</TableCell>
                <TableCell>Recommendation</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feedbacks.map((f) => {
                const totalScore = f.scores ? (f.scores.technical + f.scores.communication + f.scores.teamwork) / 3 : 0;
                return (
                  <TableRow key={f.id} hover>
                    <TableCell>{new Date(f.created_at || f.date).toLocaleDateString()}</TableCell>
                    <TableCell fontWeight="500">{f.intern_name}</TableCell>
                    <TableCell>{f.reviewer_name}</TableCell>
                    <TableCell>
                      <Rating value={totalScore} readOnly precision={0.5} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={f.recommendation} 
                        size="small" 
                        color={f.recommendation === 'Promotion' ? 'success' : f.recommendation === 'Termination' ? 'error' : 'default'} 
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="View Details">
                        <IconButton size="small" onClick={() => setViewDialog({ open: true, data: f })} sx={{ color: 'var(--color-primary)' }}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <form onSubmit={handleCreateSubmit}>
          <DialogTitle>Submit Performance Feedback</DialogTitle>
          <DialogContent dividers>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Select Intern"
                  fullWidth
                  required
                  value={formData.intern}
                  onChange={(e) => setFormData({ ...formData, intern: e.target.value })}
                >
                  {interns.map((i) => (
                    <MenuItem key={i.emp_id} value={i.emp_id}>
                      {i.full_name ? `${i.full_name} (${i.emp_id})` : (i.username || i.emp_id)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  label="Recommendation"
                  fullWidth
                  value={formData.recommendation}
                  onChange={(e) => setFormData({ ...formData, recommendation: e.target.value })}
                >
                  <MenuItem value="Continue">Continue Internship</MenuItem>
                  <MenuItem value="Promotion">Recommend for Promotion</MenuItem>
                  <MenuItem value="Needs Improvement">Needs Improvement</MenuItem>
                  <MenuItem value="Termination">Recommend Termination</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12}>
                <Typography component="legend">Technical Skills</Typography>
                <Rating
                  value={formData.scores.technical}
                  onChange={(event, newValue) => setFormData({ ...formData, scores: { ...formData.scores, technical: newValue } })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography component="legend">Communication</Typography>
                <Rating
                  value={formData.scores.communication}
                  onChange={(event, newValue) => setFormData({ ...formData, scores: { ...formData.scores, communication: newValue } })}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography component="legend">Teamwork</Typography>
                <Rating
                  value={formData.scores.teamwork}
                  onChange={(event, newValue) => setFormData({ ...formData, scores: { ...formData.scores, teamwork: newValue } })}
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography component="legend">Qualitative Notes</Typography>
                  <Button 
                    size="small" 
                    startIcon={isDrafting ? <CircularProgress size={16} /> : <AutoAwesome />}
                    onClick={handleAIDraft}
                    disabled={isDrafting || !formData.intern}
                    sx={{ color: 'var(--color-primary)' }}
                  >
                    AI Draft
                  </Button>
                </Box>
                <TextField
                  multiline
                  rows={4}
                  fullWidth
                  required
                  value={formData.qualitative_notes}
                  onChange={(e) => setFormData({ ...formData, qualitative_notes: e.target.value })}
                  placeholder="Provide detailed feedback on the intern's performance..."
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained">Submit Feedback</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Dialog */}
      {viewDialog.open && viewDialog.data && (
        <Dialog open={viewDialog.open} onClose={() => setViewDialog({ open: false, data: null })} maxWidth="sm" fullWidth>
          <DialogTitle>Feedback Details</DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle2" color="text.secondary">Intern</Typography>
            <Typography variant="body1" mb={2}>{viewDialog.data.intern_name}</Typography>
            
            <Typography variant="subtitle2" color="text.secondary">Reviewer</Typography>
            <Typography variant="body1" mb={2}>{viewDialog.data.reviewer_name}</Typography>
            
            <Typography variant="subtitle2" color="text.secondary" mb={1}>Scores</Typography>
            <Box mb={2}>
              <Typography variant="body2">Technical: <Rating value={viewDialog.data.scores?.technical || 0} readOnly size="small" /></Typography>
              <Typography variant="body2">Communication: <Rating value={viewDialog.data.scores?.communication || 0} readOnly size="small" /></Typography>
              <Typography variant="body2">Teamwork: <Rating value={viewDialog.data.scores?.teamwork || 0} readOnly size="small" /></Typography>
            </Box>

            <Typography variant="subtitle2" color="text.secondary">Qualitative Notes</Typography>
            <Typography variant="body2" mb={2} sx={{ whiteSpace: 'pre-wrap' }}>
              {viewDialog.data.qualitative_notes}
            </Typography>

            <Typography variant="subtitle2" color="text.secondary">Recommendation</Typography>
            <Chip label={viewDialog.data.recommendation} size="small" sx={{ mt: 0.5 }} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setViewDialog({ open: false, data: null })}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </motion.div>
  );
}
