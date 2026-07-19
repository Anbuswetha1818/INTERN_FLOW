import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, InputAdornment, Rating, Chip, Dialog
} from '@mui/material';
import { Search, Feedback, Star, ThumbUp, ChatBubbleOutlineRounded } from '@mui/icons-material';
import { feedbackAPI } from '../../services/api';
import { LoadingSpinner, StatCard } from '../../components/common';
import { motion } from 'framer-motion';

export default function FeedbackManagement() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await feedbackAPI.list();
      setFeedbacks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const filteredFeedbacks = feedbacks.filter(f => 
    f.title?.toLowerCase().includes(search.toLowerCase()) || 
    f.submitted_by_name?.toLowerCase().includes(search.toLowerCase()) ||
    f.target_name?.toLowerCase().includes(search.toLowerCase())
  );

  const avgRating = feedbacks.length 
    ? feedbacks.reduce((acc, curr) => acc + (curr.rating || 0), 0) / feedbacks.length 
    : 0;

  if (loading) return <LoadingSpinner text="Loading Feedback..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Feedback & Reviews</Typography>
          <Typography variant="body2" color="text.secondary">Manage internal feedback loops and reviews.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Feedback />}>Request Feedback</Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <StatCard label="Total Feedback Given" value={feedbacks.length} color="var(--color-primary)" icon={<ChatBubbleOutlineRounded />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Average Rating" value={avgRating.toFixed(1)} color="#f59e0b" icon={<Star />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Pending Action" value={feedbacks.filter(f => f.status === 'pending').length} color="#ef4444" icon={<ThumbUp />} />
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3 }}>
          <TextField
            size="small"
            placeholder="Search feedback..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Type & Title</TableCell>
                <TableCell>From → To</TableCell>
                <TableCell>Rating</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredFeedbacks.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.title}</Typography>
                    <Chip label={row.feedback_type.replace(/_/g, ' ').toUpperCase()} size="small" variant="outlined" sx={{ mt: 0.5 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{row.submitted_by_name || 'Anonymous'}</Typography>
                    <Typography variant="caption" color="text.secondary">→ {row.target_name || 'General'}</Typography>
                  </TableCell>
                  <TableCell>
                    {row.rating ? (
                      <Rating value={row.rating} readOnly size="small" />
                    ) : (
                      <Typography variant="caption" color="text.secondary">No Rating</Typography>
                    )}
                  </TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small">Read</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredFeedbacks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No feedback records found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </motion.div>
  );
}
