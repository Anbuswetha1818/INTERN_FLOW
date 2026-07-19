import React, { useState, useEffect } from 'react';
import { Box, Typography, Grid, Chip, Button, Avatar, AvatarGroup, Tooltip, Divider } from '@mui/material';
import { motion } from 'framer-motion';
import { FolderSpecial, People, Mail, TaskAlt } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function MyProjectsMentorView() {
  const { user, fetchMe } = useAuth();
  const navigate = useNavigate();
  const projects = user?.projects_info || [];

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>My Projects & Mentor</Typography>
        <Typography variant="body2" color="text.secondary">View your active project assignments and mentor details</Typography>
      </Box>

      {projects.length === 0 ? (
        <Box className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
          <FolderSpecial sx={{ fontSize: 48, color: 'text.secondary', mb: 2, opacity: 0.5 }} />
          <Typography variant="h6" fontWeight={700}>No Active Projects</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            You haven't been assigned to any projects yet. Please wait for your mentor to assign you.
          </Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {/* Mentor Profile Card */}
          <Grid item xs={12} md={4}>
            <Box className="glass-card" sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', justifyContent: 'center', gap: 1 }}>
              <Avatar sx={{ width: 90, height: 90, bgcolor: 'var(--color-primary)', mb: 1, fontSize: '2.5rem', boxShadow: 'var(--shadow-md)', background: 'linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%)' }}>
                {projects[0].team_lead__full_name?.charAt(0) || 'M'}
              </Avatar>
              <Typography variant="h5" fontWeight={800} sx={{ mt: 1 }}>{projects[0].team_lead__full_name || 'Assigned Soon'}</Typography>
              <Typography variant="body2" color="text.secondary">Your Assigned Mentor</Typography>
              <Chip label="Mentor" size="small" color="primary" sx={{ my: 1, fontWeight: 600 }} />
              {projects[0].team_lead__user__email && (
                <Box sx={{ mt: 2, width: '100%' }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, wordBreak: 'break-all', fontWeight: 500 }}>
                    {projects[0].team_lead__user__email}
                  </Typography>
                  <Button 
                    variant="outlined" 
                    size="small" 
                    startIcon={<Mail />}
                    onClick={() => window.location.href = `mailto:${projects[0].team_lead__user__email}`}
                    sx={{ textTransform: 'none', borderRadius: '8px', width: '80%' }}
                  >
                    Contact Mentor
                  </Button>
                </Box>
              )}
            </Box>
          </Grid>

          {/* Projects List */}
          <Grid item xs={12} md={8}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, color: 'var(--text-primary)' }}>
                <FolderSpecial sx={{ color: 'var(--color-primary)' }} /> Assigned Projects & Teams
              </Typography>
              
              {projects.map(p => (
                <motion.div key={p.id} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                  <Box className="glass-card" sx={{ p: 3.5, borderLeft: '5px solid var(--color-primary)', boxShadow: 'var(--shadow-sm)' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                      <Box>
                        <Typography variant="h6" fontWeight={800} sx={{ color: 'var(--text-primary)' }}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>Project ID: #{p.id}</Typography>
                        
                        {p.team__name && (
                          <Typography variant="body2" sx={{ mt: 1, fontWeight: 600, color: 'var(--text-secondary)' }}>
                            Team: {p.team__name}
                          </Typography>
                        )}
                      </Box>
                      <Chip 
                        label={p.status ? p.status.toUpperCase() : 'ACTIVE'} 
                        color={p.status === 'completed' ? 'success' : 'primary'} 
                        size="small" 
                        sx={{ fontWeight: 700, fontSize: '0.7rem', px: 1 }}
                      />
                    </Box>
                    
                    {p.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                        {p.description}
                      </Typography>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', pt: 2.5 }}>
                      {p.domain__name && (
                        <Chip label={p.domain__name} size="small" variant="outlined" sx={{ fontWeight: 600 }} />
                      )}
                      
                      {p.team_members && p.team_members.length > 0 && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Typography variant="caption" fontWeight={700} color="text.secondary">
                            Team:
                          </Typography>
                          <AvatarGroup max={5} sx={{ '& .MuiAvatar-root': { width: 30, height: 30, fontSize: '0.75rem', border: '2px solid var(--bg-card)' } }}>
                            {p.team_members.map(member => (
                              <Tooltip key={member.id} title={`${member.full_name} (${member.emp_id})`}>
                                <Avatar src={member.photo || ''} alt={member.full_name}>
                                  {member.full_name.charAt(0).toUpperCase()}
                                </Avatar>
                              </Tooltip>
                            ))}
                          </AvatarGroup>
                        </Box>
                      )}

                      <Button 
                        variant="contained" 
                        size="small" 
                        startIcon={<TaskAlt />}
                        onClick={() => navigate('/intern-user/tasks')}
                        sx={{ textTransform: 'none', borderRadius: '8px', px: 2 }}
                      >
                        View Tasks
                      </Button>
                    </Box>
                  </Box>
                </motion.div>
              ))}
            </Box>
          </Grid>
        </Grid>
      )}
    </motion.div>
  );
}
