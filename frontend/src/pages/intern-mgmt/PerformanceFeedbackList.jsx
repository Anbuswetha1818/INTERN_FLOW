import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Rating, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { Visibility } from '@mui/icons-material';

const MOCK_FEEDBACK = [
  { id: 1, intern: 'Alice Smith', reviewer: 'John Doe', rating: 4.5, date: '2026-06-15' },
  { id: 2, intern: 'Bob Jones', reviewer: 'Sarah Connor', rating: 3.5, date: '2026-06-14' },
];

export default function PerformanceFeedbackList() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Performance Feedback</Typography>
        <Typography variant="body2" color="text.secondary">
          Review feedback submitted for interns by managers and mentors.
        </Typography>
      </Box>

      <Paper className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Intern Name</TableCell>
                <TableCell>Reviewer</TableCell>
                <TableCell>Overall Rating</TableCell>
                <TableCell>Date Submitted</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_FEEDBACK.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{row.intern}</Typography>
                  </TableCell>
                  <TableCell>{row.reviewer}</TableCell>
                  <TableCell>
                    <Rating value={row.rating} readOnly size="small" precision={0.5} />
                  </TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </motion.div>
  );
}
