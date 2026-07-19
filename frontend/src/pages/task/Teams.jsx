import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Avatar, AvatarGroup, IconButton,
  Card, CardContent, CardActions
} from '@mui/material';
import { Add, Group, PersonRemove, Email } from '@mui/icons-material';
import { tasksAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/common';
import { motion } from 'framer-motion';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await tasksAPI.teams();
      setTeams(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Teams..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Teams</Typography>
          <Typography variant="body2" color="text.secondary">Manage working groups and mentor assignments.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>Create Team</Button>
      </Box>

      <Grid container spacing={3}>
        {teams.map(team => (
          <Grid xs={12} sm={6} md={4} key={team.id}>
            <motion.div whileHover={{ y: -5 }}>
              <Card className="glass-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Group color="secondary" />
                      <Typography variant="h6" fontWeight={700}>{team.name}</Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3, height: 40, overflow: 'hidden' }}>
                    {team.description || 'No description provided.'}
                  </Typography>

                  <Box sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
                      Lead / Mentor
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.9rem' }}>
                        {team.mentor_name?.charAt(0) || '?'}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{team.mentor_name || 'Unassigned'}</Typography>
                    </Box>
                  </Box>

                  <Box>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" display="block" mb={1}>
                      Interns ({team.intern_count})
                    </Typography>
                    {team.intern_count > 0 ? (
                      <AvatarGroup max={5} sx={{ justifyContent: 'flex-end', '& .MuiAvatar-root': { width: 32, height: 32, fontSize: '0.8rem' } }}>
                        {/* We would map over team.interns here if available in list response, otherwise just show count */}
                        {Array.from({ length: Math.min(team.intern_count, 5) }).map((_, i) => (
                          <Avatar key={i} sx={{ bgcolor: 'secondary.main' }}>I</Avatar>
                        ))}
                      </AvatarGroup>
                    ) : (
                      <Typography variant="body2" color="text.secondary" fontStyle="italic">No interns assigned</Typography>
                    )}
                  </Box>
                </CardContent>
                <CardActions sx={{ p: 2, pt: 0, justifyContent: 'flex-end' }}>
                  <Button size="small" variant="outlined">Manage Members</Button>
                </CardActions>
              </Card>
            </motion.div>
          </Grid>
        ))}
        {teams.length === 0 && (
          <Grid xs={12}>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">No teams have been created yet.</Typography>
              <Button variant="contained" sx={{ mt: 2 }} startIcon={<Add />}>Create Your First Team</Button>
            </Box>
          </Grid>
        )}
      </Grid>
    </motion.div>
  );
}
