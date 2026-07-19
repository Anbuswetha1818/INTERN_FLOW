import { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, Rating, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import { Send, Feedback } from '@mui/icons-material';

export default function StudentStaffFeedback() {
  const [feedback, setFeedback] = useState({
    type: 'Staff',
    target: '',
    rating: 0,
    comments: ''
  });

  const handleSubmit = () => {
    console.log('Submitting feedback:', feedback);
    alert('Feedback submitted successfully!');
    setFeedback({ type: 'Staff', target: '', rating: 0, comments: '' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Feedback</Typography>
        <Typography variant="body2" color="text.secondary">
          Provide anonymous or named feedback on staff, mentors, and the program.
        </Typography>
      </Box>

      <Grid container spacing={4} justifyContent="center">
        <Grid xs={12} md={8}>
          <Paper className="glass-card" sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
              <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                <Feedback />
              </Box>
              <Typography variant="h6" fontWeight={700}>Submit Feedback</Typography>
            </Box>

            <Grid container spacing={3}>
              <Grid xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Feedback Type"
                  value={feedback.type}
                  onChange={(e) => setFeedback({ ...feedback, type: e.target.value })}
                >
                  <MenuItem value="Staff">Staff / Mentor</MenuItem>
                  <MenuItem value="Program">Internship Program</MenuItem>
                  <MenuItem value="Facility">Facility / Assets</MenuItem>
                </TextField>
              </Grid>
              <Grid xs={12} sm={6}>
                <TextField
                  fullWidth
                  label={feedback.type === 'Staff' ? 'Staff Name (Optional)' : 'Topic'}
                  value={feedback.target}
                  onChange={(e) => setFeedback({ ...feedback, target: e.target.value })}
                />
              </Grid>
              <Grid xs={12}>
                <Typography component="legend" variant="body2" color="text.secondary" mb={1}>Overall Rating</Typography>
                <Rating
                  value={feedback.rating}
                  onChange={(event, newValue) => {
                    setFeedback({ ...feedback, rating: newValue });
                  }}
                  size="large"
                />
              </Grid>
              <Grid xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Detailed Comments"
                  placeholder="Share your thoughts..."
                  value={feedback.comments}
                  onChange={(e) => setFeedback({ ...feedback, comments: e.target.value })}
                />
              </Grid>
              <Grid xs={12}>
                <Button 
                  variant="contained" 
                  startIcon={<Send />} 
                  onClick={handleSubmit}
                  disabled={!feedback.comments || feedback.rating === 0}
                >
                  Submit Feedback
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
