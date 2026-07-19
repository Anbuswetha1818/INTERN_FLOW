import { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton, Chip } from '@mui/material';
import { CheckCircle, Cancel, Visibility } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MOCK_REVIEWS = [
  { id: 1, title: 'Authentication API', assignee: 'John Doe', completedAt: '2026-06-16T10:00:00Z', status: 'Pending Review' },
  { id: 2, type: 'Database Migration', assignee: 'Jane Smith', completedAt: '2026-06-15T14:30:00Z', status: 'Pending Review' },
];

export default function CompletionReviewQueue() {
  const [reviews, setReviews] = useState(MOCK_REVIEWS);

  const handleAction = (id, action) => {
    setReviews(reviews.filter(r => r.id !== id));
    // API Call would happen here
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Completion Review Queue</Typography>
        <Typography variant="body2" color="text.secondary">
          Review tasks marked as complete by interns before closing them.
        </Typography>
      </Box>

      <Paper className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task Title</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Completed Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reviews.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{row.title || row.type}</Typography>
                  </TableCell>
                  <TableCell>{row.assignee}</TableCell>
                  <TableCell>{new Date(row.completedAt).toLocaleString()}</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color="warning" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary"><Visibility fontSize="small" /></IconButton>
                    <IconButton size="small" color="success" onClick={() => handleAction(row.id, 'approve')}><CheckCircle fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => handleAction(row.id, 'reject')}><Cancel fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {reviews.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No tasks pending review.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </motion.div>
  );
}
