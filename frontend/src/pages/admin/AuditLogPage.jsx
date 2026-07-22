import { useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, TextField, Grid } from '@mui/material';
import { History, Search } from '@mui/icons-material';
import { motion } from 'framer-motion';

function AuditLogCard({ log }) {
  return (
    <Box 
      className="glass-card"
      sx={{ 
        p: 2, 
        mb: 2, 
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.3))',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
        boxShadow: 'var(--glass-shadow, 0 4px 12px rgba(0,0,0,0.05))',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary">{log.timestamp}</Typography>
        <Chip 
          label={log.action} 
          size="small" 
          color={log.action === 'DELETE' ? 'error' : log.action === 'CREATE' ? 'success' : 'primary'} 
          variant="outlined"
        />
      </Box>

      <Grid container spacing={1.5}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Table</Typography>
          <Typography variant="body2" fontWeight={600}>{log.table}</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">User</Typography>
          <Typography variant="body2" fontWeight={600}>{log.user}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" display="block">Details</Typography>
          <Typography variant="body2">{log.details}</Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

export default function AuditLogPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const mockLogs = [
    { id: 1, action: 'UPDATE', table: 'UserProfile', user: 'admin1', timestamp: '2026-06-15 10:23 AM', details: 'Changed status to Active' },
    { id: 2, action: 'DELETE', table: 'Task', user: 'manager_john', timestamp: '2026-06-15 09:15 AM', details: 'Deleted task #142' },
    { id: 3, action: 'CREATE', table: 'Entity', user: 'superadmin', timestamp: '2026-06-14 16:45 PM', details: 'Created branch "North HQ"' },
    { id: 4, action: 'UPDATE', table: 'PaymentRecord', user: 'finance_lead', timestamp: '2026-06-14 11:30 AM', details: 'Marked payment #88 as Completed' },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-head">
        <div>
          <div className="page-title-row">
            <History color="primary" sx={{ fontSize: 28 }} />
            <h1 className="page-title">System Audit Log</h1>
          </div>
          <p className="page-sub">Immutable record of all critical system actions.</p>
        </div>
      </div>

      <Paper className="glass-card" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search logs by user, action, or table..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} /> }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Box>

        {/* Desktop Table View */}
        <TableContainer sx={{ display: { xs: 'none', md: 'block' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Timestamp</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Table</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {mockLogs.filter(log => 
                log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                log.details.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((log) => (
                <TableRow key={log.id} hover>
                  <TableCell sx={{ color: 'text.secondary' }}>{log.timestamp}</TableCell>
                  <TableCell>
                    <Chip 
                      label={log.action} 
                      size="small" 
                      color={log.action === 'DELETE' ? 'error' : log.action === 'CREATE' ? 'success' : 'primary'} 
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell fontWeight={600}>{log.table}</TableCell>
                  <TableCell>{log.user}</TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {mockLogs.filter(log => 
            log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.table.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.details.toLowerCase().includes(searchTerm.toLowerCase())
          ).map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))}
        </Box>
      </Paper>
    </motion.div>
  );
}
