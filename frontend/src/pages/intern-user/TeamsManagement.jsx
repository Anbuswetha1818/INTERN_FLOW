import { Box, Typography, Paper, Grid, Card, CardContent, Avatar, AvatarGroup, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { Group as GroupIcon } from '@mui/icons-material';

const MOCK_TEAMS = [
  { id: 1, name: 'Frontend Guild', lead: 'Alice Smith', members: ['A', 'B', 'C', 'D'], activeProjects: 2 },
  { id: 2, name: 'Core API Team', lead: 'Bob Jones', members: ['B', 'E'], activeProjects: 1 },
];

export default function TeamsManagement() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>My Teams</Typography>
        <Typography variant="body2" color="text.secondary">
          View your assigned teams and collaborate with peers.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {MOCK_TEAMS.map(team => (
          <Grid xs={12} md={6} key={team.id}>
            <Card className="glass-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                      <GroupIcon />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>{team.name}</Typography>
                      <Typography variant="caption" color="text.secondary">Lead: {team.lead}</Typography>
                    </Box>
                  </Box>
                  <Chip label={`${team.activeProjects} Projects`} size="small" color="primary" variant="outlined" />
                </Box>
                
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto', p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                  <Typography variant="body2" fontWeight={600} color="text.secondary">Team Members</Typography>
                  <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.85rem' } }}>
                    {team.members.map((member, idx) => (
                      <Avatar key={idx}>{member}</Avatar>
                    ))}
                  </AvatarGroup>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}
