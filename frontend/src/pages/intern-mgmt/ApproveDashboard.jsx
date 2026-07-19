import { useState } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Button, Chip, IconButton } from '@mui/material';
import { motion } from 'framer-motion';
import { CheckCircle, Cancel, PersonAdd, Description, EventNote } from '@mui/icons-material';

const MOCK_APPROVALS = [
  { id: 1, type: 'Onboarding', name: 'Alice Smith', description: 'Pending profile completion and ID verification.', icon: <PersonAdd /> },
  { id: 2, type: 'Leave', name: 'Bob Jones', description: 'Sick leave requested for 2 days (June 20-21).', icon: <EventNote /> },
  { id: 3, type: 'Document', name: 'Charlie Brown', description: 'Uploaded signed NDA document.', icon: <Description /> },
];

export default function ApproveDashboard() {
  const [approvals, setApprovals] = useState(MOCK_APPROVALS);

  const handleAction = (id) => {
    setApprovals(approvals.filter(a => a.id !== id));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Approval Dashboard</Typography>
        <Typography variant="body2" color="text.secondary">
          Review and process pending requests from interns.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {approvals.map(req => (
          <Grid xs={12} md={4} key={req.id}>
            <Card className="glass-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                      {req.icon}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{req.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{req.type} Request</Typography>
                    </Box>
                  </Box>
                  <Chip label="Pending" size="small" color="warning" />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40 }}>
                  {req.description}
                </Typography>
              </CardContent>
              <Box sx={{ p: 2, borderTop: '1px solid var(--border-subtle)', bgcolor: 'rgba(0,0,0,0.02)', display: 'flex', gap: 2 }}>
                <Button 
                  variant="contained" 
                  color="success" 
                  fullWidth 
                  startIcon={<CheckCircle />}
                  onClick={() => handleAction(req.id)}
                >
                  Approve
                </Button>
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth 
                  startIcon={<Cancel />}
                  onClick={() => handleAction(req.id)}
                >
                  Reject
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
        {approvals.length === 0 && (
          <Grid xs={12}>
            <Paper className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
              <Typography variant="h6" color="text.secondary">All caught up! No pending approvals.</Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
}
