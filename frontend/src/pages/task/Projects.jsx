import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Grid, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, LinearProgress
} from '@mui/material';
import { Add, AccountTree, MoreVert } from '@mui/icons-material';
import { tasksAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { motion } from 'framer-motion';

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await tasksAPI.projects();
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  if (loading) return <LoadingSpinner text="Loading Projects..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Projects</Typography>
          <Typography variant="body2" color="text.secondary">Manage top-level projects and milestones.</Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />}>New Project</Button>
      </Box>

      {/* Grid of Project Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {projects.slice(0, 3).map(p => (
          <Grid xs={12} md={4} key={p.id}>
            <Box className="glass-card" sx={{ p: 3, cursor: 'pointer', transition: 'all 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccountTree color="primary" />
                  <Typography fontWeight={700} noWrap sx={{ maxWidth: 150 }}>{p.name}</Typography>
                </Box>
                <StatusChip status={p.status || 'active'} />
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, height: 40, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {p.description || 'No description provided.'}
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="caption" fontWeight={600}>Progress</Typography>
                <Typography variant="caption" fontWeight={600}>{p.progress || 0}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={p.progress || 0} sx={{ height: 6, borderRadius: 3, mb: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Domain: {p.domain_name} | Team: {p.team_name || 'Unassigned'}
              </Typography>
            </Box>
          </Grid>
        ))}
      </Grid>

      {/* Full List */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 400 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Project Name</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Team</TableCell>
                <TableCell>Timeline</TableCell>
                <TableCell>Progress</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.name}</Typography>
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'inline-block' }}>
                      {row.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{row.domain_name}</TableCell>
                  <TableCell>{row.team_name || '—'}</TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.start_date}</Typography>
                    <Typography variant="caption" color="text.secondary">To: {row.end_date}</Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 100, bgcolor: 'action.hover', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                        <Box sx={{ width: `${row.progress || 0}%`, height: '100%', bgcolor: 'primary.main' }} />
                      </Box>
                      <Typography variant="caption" fontWeight={700}>{row.progress || 0}%</Typography>
                    </Box>
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small">View</Button>
                  </TableCell>
                </TableRow>
              ))}
              {projects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No projects found.</Typography>
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
