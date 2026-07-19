import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { Visibility, Download } from '@mui/icons-material';

const MOCK_RESPONSES = [
  { id: 1, formName: 'Mid-term Evaluation', respondent: 'Alice Smith', date: '2026-06-15' },
  { id: 2, formName: 'Program Feedback', respondent: 'Anonymous', date: '2026-06-16' },
];

export default function FormResponses() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Form Responses</Typography>
          <Typography variant="body2" color="text.secondary">
            View submitted responses for your custom forms.
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Download />}>Export CSV</Button>
      </Box>

      <Paper className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Form Name</TableCell>
                <TableCell>Respondent</TableCell>
                <TableCell>Submission Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {MOCK_RESPONSES.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{row.formName}</Typography>
                  </TableCell>
                  <TableCell>{row.respondent}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="primary">
                      <Visibility fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {MOCK_RESPONSES.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    No responses found.
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
