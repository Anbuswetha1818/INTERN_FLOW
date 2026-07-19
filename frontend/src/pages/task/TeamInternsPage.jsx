import { useState } from 'react';
import { Box, Typography, Paper, Grid, Card, CardContent, Avatar, IconButton, Button, Chip } from '@mui/material';
import { PersonAdd, MoreVert, Email } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MOCK_TEAM_INTERNS = [
  { id: 1, name: 'Alice Smith', role: 'Frontend Intern', email: 'alice@example.com', status: 'Active', performance: 92 },
  { id: 2, name: 'Bob Jones', role: 'Backend Intern', email: 'bob@example.com', status: 'Active', performance: 88 },
  { id: 3, name: 'Charlie Brown', role: 'QA Intern', email: 'charlie@example.com', status: 'On Leave', performance: 75 },
];

export default function TeamInternsPage() {
  const [interns, setInterns] = useState(MOCK_TEAM_INTERNS);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Team Interns</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage interns assigned to your active teams.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<PersonAdd />}>Assign Intern</Button>
      </Box>

      <Grid container spacing={3}>
        {interns.map(intern => (
          <Grid xs={12} sm={6} md={4} key={intern.id}>
            <Card className="glass-card" sx={{ height: '100%', position: 'relative' }}>
              <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }}>
                <MoreVert fontSize="small" />
              </IconButton>
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Avatar sx={{ width: 64, height: 64, mx: 'auto', mb: 2, bgcolor: 'primary.main', fontSize: '1.5rem' }}>
                  {intern.name.charAt(0)}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>{intern.name}</Typography>
                <Typography variant="body2" color="text.secondary" mb={1}>{intern.role}</Typography>
                <Chip 
                  label={intern.status} 
                  size="small" 
                  color={intern.status === 'Active' ? 'success' : 'warning'} 
                  sx={{ mb: 3 }} 
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2, textAlign: 'left' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Performance</Typography>
                    <Typography variant="body2" fontWeight={700} color={intern.performance >= 90 ? 'success.main' : 'text.primary'}>
                      {intern.performance}%
                    </Typography>
                  </Box>
                  <IconButton size="small" color="primary">
                    <Email fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}
