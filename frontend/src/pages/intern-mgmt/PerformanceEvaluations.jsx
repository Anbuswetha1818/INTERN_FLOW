import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, InputAdornment, Chip, CircularProgress, Dialog
} from '@mui/material';
import { Search, Assessment, TrendingUp, FilterList, RateReview } from '@mui/icons-material';
import { feedbackAPI } from '../../services/api';
import { LoadingSpinner, StatCard } from '../../components/common';
import { motion } from 'framer-motion';

export default function PerformanceEvaluations() {
  const [evaluations, setEvaluations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEvals = async () => {
    try {
      setLoading(true);
      const res = await feedbackAPI.list();
      setEvaluations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvals();
  }, []);

  const filteredEvals = evaluations.filter(e => 
    e.intern_name?.toLowerCase().includes(search.toLowerCase()) || 
    (e.is_final_evaluation ? 'final' : 'periodic').includes(search.toLowerCase())
  );

  const avgScore = evaluations.length
    ? evaluations.reduce((acc, curr) => acc + (curr.average_score || 0), 0) / evaluations.length
    : 0;

  if (loading) return <LoadingSpinner text="Loading Evaluations..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Performance Evaluations</Typography>
          <Typography variant="body2" color="text.secondary">Track and manage intern performance metrics.</Typography>
        </Box>
        <Button variant="contained" startIcon={<RateReview />}>New Evaluation</Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <StatCard label="Total Evaluations" value={evaluations.length} color="var(--color-primary)" icon={<Assessment />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Average Overall Score" value={`${avgScore.toFixed(1)}/10`} color="#22c55e" icon={<TrendingUp />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Pending Review" value={evaluations.filter(e => e.recommendation === 'pending').length} color="#f59e0b" icon={<RateReview />} />
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by intern or type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<FilterList />} onClick={() => alert('Filter options coming soon!')}>Filter</Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Intern</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Evaluator</TableCell>
                <TableCell>Overall Score</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredEvals.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.intern_name || `Intern ${row.intern}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.is_final_evaluation ? 'FINAL' : 'PERIODIC'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.reviewer_name || 'System'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CircularProgress 
                        variant="determinate" 
                        value={((row.average_score || 0) / 10) * 100} 
                        size={24} 
                        thickness={5}
                        sx={{ color: (row.average_score || 0) >= 8 ? 'success.main' : (row.average_score || 0) >= 5 ? 'warning.main' : 'error.main' }}
                      />
                      <Typography fontWeight={700}>{row.average_score || 0} / 10</Typography>
                    </Box>
                  </TableCell>
                  <TableCell>{new Date(row.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Button size="small">View Report</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredEvals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No evaluations found.</Typography>
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
