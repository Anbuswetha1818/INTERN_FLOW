import { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { Calculate, AccessTime } from '@mui/icons-material';
import { attendanceAPI } from '../../services/api';
import { motion } from 'framer-motion';

export default function InternHoursCalculator() {
  const [dates, setDates] = useState({ start: '', end: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalculate = async () => {
    if (!dates.start || !dates.end) return;
    setLoading(true);
    try {
      const res = await attendanceAPI.dateRange({ start_date: dates.start, end_date: dates.end });
      
      // Calculate aggregates
      let total_hours = 0;
      let present_days = 0;
      let half_days = 0;
      let absent_days = 0;
      
      res.data.forEach(r => {
        total_hours += r.total_hours;
        if (r.status === 'present') present_days++;
        if (r.status === 'half-day') half_days++;
        if (r.status === 'absent') absent_days++;
      });
      
      setData({
        records: res.data,
        summary: { total_hours, present_days, half_days, absent_days }
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Hours Calculator</Typography>
        <Typography variant="body2" color="text.secondary">Calculate your total effective working hours over a date range.</Typography>
      </Box>

      <Box className="glass-card" sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={3} sx={{ alignItems: "center" }}>
          <Grid xs={12} sm={4}>
            <TextField fullWidth label="Start Date" type="date" slotProps={{ inputLabel: { shrink: true } }} 
              value={dates.start} onChange={(e) => setDates({...dates, start: e.target.value})} />
          </Grid>
          <Grid xs={12} sm={4}>
            <TextField fullWidth label="End Date" type="date" slotProps={{ inputLabel: { shrink: true } }} 
              value={dates.end} onChange={(e) => setDates({...dates, end: e.target.value})} />
          </Grid>
          <Grid xs={12} sm={4}>
            <Button variant="contained" size="large" fullWidth startIcon={<Calculate />} 
              onClick={handleCalculate} disabled={loading || !dates.start || !dates.end}>
              Calculate
            </Button>
          </Grid>
        </Grid>
      </Box>

      {data && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Grid container spacing={4}>
            {/* Summary */}
            <Grid xs={12} md={4}>
              <Box className="glass-card" sx={{ p: 4, textAlign: 'center', height: '100%', bgcolor: 'primary.main', color: 'white' }}>
                <AccessTime sx={{ fontSize: 64, mb: 2, opacity: 0.8 }} />
                <Typography variant="h6" fontWeight={700} mb={1}>Total Hours Worked</Typography>
                <Typography variant="h2" fontWeight={800} mb={3}>{data.summary.total_hours.toFixed(1)} <Typography component="span" variant="h5">hrs</Typography></Typography>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, bgcolor: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2">Present Days</Typography>
                  <Typography variant="body2" fontWeight={700}>{data.summary.present_days}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, bgcolor: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2">Half Days</Typography>
                  <Typography variant="body2" fontWeight={700}>{data.summary.half_days}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', bgcolor: 'rgba(255,255,255,0.1)', p: 1.5, borderRadius: 2 }}>
                  <Typography variant="body2">Absent</Typography>
                  <Typography variant="body2" fontWeight={700}>{data.summary.absent_days}</Typography>
                </Box>
              </Box>
            </Grid>

            {/* Detailed Table */}
            <Grid xs={12} md={8}>
              <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
                <TableContainer sx={{ maxHeight: 400 }}>
                  <Table stickyHeader size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Date</TableCell>
                        <TableCell>Check In</TableCell>
                        <TableCell>Check Out</TableCell>
                        <TableCell>Hours</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.records.map((r, i) => (
                        <TableRow key={i}>
                          <TableCell>{r.date}</TableCell>
                          <TableCell>{r.check_in ? new Date(r.check_in).toLocaleTimeString() : '—'}</TableCell>
                          <TableCell>{r.check_out ? new Date(r.check_out).toLocaleTimeString() : '—'}</TableCell>
                          <TableCell fontWeight={700}>{r.total_hours}</TableCell>
                          <TableCell sx={{ textTransform: 'capitalize' }}>{r.status}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            </Grid>
          </Grid>
        </motion.div>
      )}
    </motion.div>
  );
}
