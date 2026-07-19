import { useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, TextField, InputAdornment, Tooltip
} from '@mui/material';
import { Search, Warning, EventAvailable, AccessTime, Autorenew } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MOCK_LOGS = [
  { id: 1, intern: 'John Doe', date: '2026-06-15', checkIn: '09:00 AM', checkOut: '05:00 PM', hours: 8, status: 'present', flag: null },
  { id: 2, intern: 'Jane Smith', date: '2026-06-15', checkIn: '10:30 AM', checkOut: '06:00 PM', hours: 7.5, status: 'present', flag: 'late_arrival' },
  { id: 3, intern: 'Alice Johnson', date: '2026-06-15', checkIn: '--', checkOut: '--', hours: 0, status: 'absent', flag: 'unexcused' },
  { id: 4, intern: 'Robert Brown', date: '2026-06-15', checkIn: '08:50 AM', checkOut: '02:00 PM', hours: 5.1, status: 'half_day', flag: 'early_departure' },
  { id: 5, intern: 'Michael Davis', date: '2026-06-15', checkIn: '09:15 AM', checkOut: '05:15 PM', hours: 8, status: 'present', flag: null },
];

export default function AttendanceLog() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_LOGS.filter(p => p.intern.toLowerCase().includes(search.toLowerCase()));

  const getStatusChip = (status) => {
    switch (status) {
      case 'present': return <Chip size="small" label="Present" color="success" variant="outlined" />;
      case 'absent': return <Chip size="small" label="Absent" color="error" variant="outlined" />;
      case 'half_day': return <Chip size="small" label="Half Day" color="warning" variant="outlined" />;
      default: return <Chip size="small" label={status} />;
    }
  };

  const getFlagIcon = (flag) => {
    if (!flag) return null;
    let text = flag.replace('_', ' ').toUpperCase();
    return (
      <Tooltip title={`AI Flag: ${text}`}>
        <Chip 
          icon={<Warning fontSize="small" />} 
          label={text} 
          size="small" 
          color="error" 
          sx={{ height: 20, fontSize: '0.65rem' }} 
        />
      </Tooltip>
    );
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventAvailable sx={{ color: '#22c55e' }} /> Daily Attendance Logs
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor check-ins, check-outs, and AI anomaly flags for today.
        </Typography>
      </Box>

      <Box className="glass-card" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search Intern..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 250 }}
          />
          <Chip icon={<Autorenew fontSize="small" />} label="Live Sync Active" color="primary" variant="outlined" />
        </Box>

        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Intern Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Check-In <AccessTime fontSize="inherit" sx={{verticalAlign:'middle', ml:0.5}}/></TableCell>
                <TableCell>Check-Out</TableCell>
                <TableCell>Total Hours</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>AI Flags</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.intern}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.date}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={row.checkIn === '--' ? 'text.secondary' : 'text.primary'}>
                      {row.checkIn}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={row.checkOut === '--' ? 'text.secondary' : 'text.primary'}>
                      {row.checkOut}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700} color={row.hours < 8 ? 'warning.main' : 'text.primary'}>
                      {row.hours}h
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {getStatusChip(row.status)}
                  </TableCell>
                  <TableCell>
                    {getFlagIcon(row.flag) || <Typography variant="caption" color="text.secondary">Clean</Typography>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </motion.div>
  );
}
