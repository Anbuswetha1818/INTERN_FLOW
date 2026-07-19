/**
 * SIMS — Landing Page (InternHomePage)
 * Premium hero section with glassmorphism, animated features, and CTA.
 */

import { Box, Typography, Button, Grid, Container } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  School, Assignment, Schedule, SmartToy, Assessment, Security,
  Speed, Group, Description, Payment,
} from '@mui/icons-material';

const features = [
  { icon: <School />, title: 'Intern Lifecycle', desc: 'End-to-end management from onboarding to certification.' },
  { icon: <Assignment />, title: 'Task Management', desc: 'Projects, tasks, Kanban boards with SLA tracking.' },
  { icon: <Schedule />, title: 'Attendance', desc: 'Real-time check-in/out, breaks, leave management.' },
  { icon: <SmartToy />, title: 'AI Assistant', desc: '16 AI features: chatbot, mock interviews, resume builder.' },
  { icon: <Assessment />, title: 'Performance', desc: 'Auto-calculated metrics with AI-powered insights.' },
  { icon: <Security />, title: 'Role-Based Access', desc: '6-level hierarchy with entity-scoped permissions.' },
  { icon: <Speed />, title: 'Real-Time Dashboard', desc: 'Live stats, charts, and actionable analytics.' },
  { icon: <Group />, title: 'Team Management', desc: 'Teams, projects, mentors with collaboration tools.' },
  { icon: <Description />, title: 'Documents', desc: 'Upload, approval workflow, version tracking.' },
  { icon: <Payment />, title: 'Payroll', desc: 'Fee structures, payment tracking, stipend management.' },
];

const stats = [
  { value: '200+', label: 'API Endpoints' },
  { value: '16', label: 'AI Features' },
  { value: '6', label: 'Dashboard Shells' },
  { value: '25+', label: 'Data Models' },
];

export default function InternHomePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ overflow: 'hidden' }}>
      {/* ============================================================ */}
      {/* Hero Section */}
      {/* ============================================================ */}
      <Box sx={{
        minHeight: '100vh', display: 'flex', alignItems: 'center',
        position: 'relative',
        background: 'linear-gradient(135deg, var(--bg-primary) 0%, #302b63 40%, #24243e 100%)',
      }}>
        {/* Animated orbs */}
        <Box sx={{
          position: 'absolute', top: '10%', right: '5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(108,63,224,0.25) 0%, transparent 70%)',
          filter: 'blur(80px)', animation: 'float 12s ease-in-out infinite',
        }} />
        <Box sx={{
          position: 'absolute', bottom: '10%', left: '5%',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(0,188,212,0.2) 0%, transparent 70%)',
          filter: 'blur(80px)', animation: 'float 15s ease-in-out infinite reverse',
        }} />
        <Box sx={{
          position: 'absolute', top: '50%', left: '40%',
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
          filter: 'blur(60px)', animation: 'float 10s ease-in-out infinite',
        }} />

        {/* Nav Bar */}
        <Box sx={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 4, py: 2,
          background: 'rgba(15,12,41,0.6)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 900, color: '#fff', fontSize: '0.9rem',
            }}>S</Box>
            <Typography fontWeight={800} fontSize="1.1rem" sx={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>SIMS</Typography>
          </Box>
          <Button
            variant="contained"
            onClick={() => navigate('/loginpage')}
            sx={{
              background: 'var(--gradient-primary)',
              fontWeight: 700, px: 3, borderRadius: 3,
            }}
          >
            Sign In
          </Button>
        </Box>

        <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
          <Grid container spacing={6} sx={{ alignItems: "center" }}>
            <Grid xs={12} md={7}>
              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8 }}
              >
                <Typography variant="overline" sx={{
                  color: 'var(--color-accent)', fontWeight: 700, letterSpacing: 3, mb: 2, display: 'block',
                }}>
                  AI-POWERED INTERN MANAGEMENT
                </Typography>
                <Typography variant="h2" fontWeight={900} sx={{
                  lineHeight: 1.1, mb: 3,
                  background: 'linear-gradient(135deg, #ffffff 0%, #a0a0c0 100%)',
                  WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                  fontSize: { xs: '2.2rem', md: '3.5rem' },
                }}>
                  Student Intern<br />
                  Management System
                </Typography>
                <Typography variant="h6" sx={{
                  color: 'rgba(255,255,255,0.6)', fontWeight: 400,
                  maxWidth: 500, lineHeight: 1.6, mb: 4, fontSize: '1.05rem',
                }}>
                  A full-stack ERP for managing the complete intern lifecycle — from
                  onboarding to certification, powered by 16 AI features including
                  chatbot, mock interviews, and performance analysis.
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained" size="large"
                    onClick={() => navigate('/loginpage')}
                    sx={{
                      background: 'var(--gradient-primary)',
                      fontWeight: 700, px: 4, py: 1.5, borderRadius: 3, fontSize: '1rem',
                      boxShadow: '0 8px 30px rgba(108,63,224,0.4)',
                      '&:hover': { boxShadow: '0 12px 40px rgba(108,63,224,0.5)', transform: 'translateY(-2px)' },
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Get Started →
                  </Button>
                  <Button
                    variant="outlined" size="large"
                    sx={{
                      borderColor: 'rgba(255,255,255,0.2)', color: '#fff',
                      fontWeight: 600, px: 4, py: 1.5, borderRadius: 3,
                      '&:hover': { borderColor: 'var(--color-accent)', bgcolor: 'rgba(0,188,212,0.1)' },
                    }}
                  >
                    Learn More
                  </Button>
                </Box>
              </motion.div>
            </Grid>
            <Grid xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
              >
                <Box sx={{
                  p: 4, borderRadius: 4,
                  background: 'rgba(26,26,62,0.5)', backdropFilter: 'blur(30px)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                    {['#ef4444', '#f59e0b', '#22c55e'].map((c) => (
                      <Box key={c} sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: c }} />
                    ))}
                  </Box>
                  <Typography variant="caption" sx={{ color: 'var(--color-accent)', fontFamily: "'JetBrains Mono', monospace" }}>
                    // AI-Powered Dashboard
                  </Typography>
                  <Grid container spacing={1.5} sx={{ mt: 1 }}>
                    {[
                      { label: 'Active Interns', val: '247', c: '#22c55e' },
                      { label: 'Tasks Done', val: '1,834', c: 'var(--color-primary)' },
                      { label: 'Attendance', val: '94.2%', c: 'var(--color-accent)' },
                      { label: 'AI Score', val: '87/100', c: '#f59e0b' },
                    ].map((s) => (
                      <Grid xs={6} key={s.label}>
                        <Box sx={{
                          p: 2, borderRadius: 2, bgcolor: 'rgba(255,255,255,0.03)',
                          border: '1px solid rgba(255,255,255,0.05)',
                        }}>
                          <Typography variant="h5" fontWeight={800} sx={{ color: s.c }}>{s.val}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* ============================================================ */}
      {/* Stats Bar */}
      {/* ============================================================ */}
      <Box sx={{
        py: 5, background: 'linear-gradient(135deg, #1a1145, #0d0b2e)',
        borderTop: '1px solid rgba(108,63,224,0.2)',
        borderBottom: '1px solid rgba(108,63,224,0.2)',
      }}>
        <Container maxWidth="lg">
          <Grid container spacing={4} justifyContent="center">
            {stats.map((s, i) => (
              <Grid xs={6} md={3} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                >
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h3" fontWeight={900} sx={{
                      background: 'var(--gradient-primary)',
                      WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    }}>{s.value}</Typography>
                    <Typography color="text.secondary" fontWeight={500}>{s.label}</Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ============================================================ */}
      {/* Features Grid */}
      {/* ============================================================ */}
      <Box sx={{ py: 10, background: 'var(--bg-primary)' }}>
        <Container maxWidth="lg">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" fontWeight={800} align="center" mb={1}>
              Everything You Need
            </Typography>
            <Typography variant="h6" color="text.secondary" align="center" mb={6} fontWeight={400}>
              A complete suite of tools for managing interns at scale
            </Typography>
          </motion.div>

          <Grid container spacing={3}>
            {features.map((f, i) => (
              <Grid xs={12} sm={6} md={4} key={i}>
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Box className="glass-card" sx={{
                    p: 3, height: '100%',
                    '&:hover .feature-icon': {
                      background: 'var(--gradient-primary)',
                      color: '#fff',
                    },
                  }}>
                    <Box className="feature-icon" sx={{
                      width: 48, height: 48, borderRadius: 3, mb: 2,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      bgcolor: 'rgba(108,63,224,0.1)', color: 'var(--color-primary)',
                      transition: 'all 0.3s ease',
                    }}>
                      {f.icon}
                    </Box>
                    <Typography fontWeight={700} mb={0.5}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                      {f.desc}
                    </Typography>
                  </Box>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ============================================================ */}
      {/* CTA Section */}
      {/* ============================================================ */}
      <Box sx={{
        py: 10, textAlign: 'center',
        background: 'linear-gradient(135deg, var(--bg-primary), #302b63)',
        position: 'relative',
      }}>
        <Container maxWidth="md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <Typography variant="h3" fontWeight={800} mb={2} sx={{ color: '#fff' }}>
              Ready to Transform Intern Management?
            </Typography>
            <Typography variant="h6" color="text.secondary" mb={4} fontWeight={400}>
              Join organizations using AI-powered tools to manage and develop their intern talent.
            </Typography>
            <Button
              variant="contained" size="large"
              onClick={() => navigate('/loginpage')}
              sx={{
                background: 'var(--gradient-primary)',
                fontWeight: 700, px: 5, py: 1.8, borderRadius: 3, fontSize: '1.1rem',
                boxShadow: '0 8px 30px rgba(108,63,224,0.4)',
              }}
            >
              Get Started Now →
            </Button>
          </motion.div>
        </Container>
      </Box>

      {/* Footer */}
      <Box sx={{
        py: 4, textAlign: 'center',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-secondary)',
      }}>
        <Typography variant="body2" color="text.secondary">
          © 2026 SIMS — Student Intern Management System.
        </Typography>
      </Box>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -30px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
        }
      `}</style>
    </Box>
  );
}
