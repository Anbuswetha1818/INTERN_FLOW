/**
 * SIMS — Login Page
 * Premium glassmorphism login with animated gradient background.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, TextField, Button, Typography, IconButton, InputAdornment,
  Alert, CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';


export default function LoginPage() {
  const navigate = useNavigate();
  const { login, verifyLoginOTP } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await login(username, password);
      
      // Role-based redirect
      // All staff roles (superadmin, manager, lead/SME, mentor) → /admin/dashboard
      // DashboardShell auto-resolves the correct sidebar & AdminDashboard picks the right content
      const role = data.role;
      if (role === 'intern') {
        navigate('/intern-user/dashboard');
      } else {
        // superadmin, manager, lead (SME), mentor, staff → unified admin shell
        navigate('/admin/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--gradient-hero)',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Animated background orbs */}
      <Box sx={{
        position: 'absolute', top: '-20%', right: '-10%',
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)',
        filter: 'blur(60px)', animation: 'float 8s ease-in-out infinite',
      }} />
      <Box sx={{
        position: 'absolute', bottom: '-20%', left: '-10%',
        width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, var(--shadow-glow) 0%, transparent 70%)',
        filter: 'blur(60px)', animation: 'float 10s ease-in-out infinite reverse',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <Box sx={{
          width: 420,
          maxWidth: '92vw',
          p: { xs: 3, sm: 3.5 },
          my: 3,
          background: 'var(--bg-card)',
          backdropFilter: 'blur(30px)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 4, position: 'relative',
          boxShadow: 'var(--shadow-lg)'
        }}>
          {/* Header */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight={800} sx={{
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em'
            }}>
              Intern<span style={{ color: '#0EA5E9' }}>Flow</span>
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5} fontSize="0.875rem">
              Internship & Student Management Platform
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>
          )}

            <form onSubmit={handleLogin}>
              <TextField
                fullWidth
                size="small"
                label="Username, Email or Employee ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                sx={{ mb: 2 }}
                autoFocus
                id="login-username"
              />
              <TextField
                fullWidth
                size="small"
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                sx={{ mb: 0.75 }}
                id="login-password"
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} size="small">
                          {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }
                }}
              />

              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Typography
                  variant="caption"
                  sx={{ color: 'var(--color-accent)', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                  onClick={() => navigate('/Recovery')}
                >
                  Forgot Password?
                </Typography>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="medium"
                disabled={loading}
                id="login-submit"
                sx={{
                  py: 1.2, fontWeight: 700, fontSize: '0.95rem',
                  background: 'var(--gradient-primary)',
                  borderRadius: 2.5,
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb, #0284c7)',
                    boxShadow: '0 6px 25px rgba(37,99,235,0.4)',
                  },
                }}
              >
                {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Sign In'}
              </Button>
            </form>

          {/* Simple Clean Demo Helper */}
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Demo Login: <Typography component="span" variant="caption" sx={{ color: '#0EA5E9', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setUsername('ADM0001'); setPassword('InternFlow@123'); }}>Admin</Typography> &middot; <Typography component="span" variant="caption" sx={{ color: '#0EA5E9', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setUsername('manager'); setPassword('InternFlow@123'); }}>Manager</Typography> &middot; <Typography component="span" variant="caption" sx={{ color: '#0EA5E9', cursor: 'pointer', fontWeight: 700 }} onClick={() => { setUsername('INT001'); setPassword('InternFlow@123'); }}>Intern</Typography>
            </Typography>
          </Box>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" display="block">
              Looking to join us?
            </Typography>
            <Button
              fullWidth
              variant="outlined"
              size="small"
              onClick={() => navigate('/InternOnboarding')}
              sx={{
                mt: 0.75, py: 0.75, fontWeight: 600, fontSize: '0.825rem',
                borderColor: 'var(--color-primary)',
                color: 'var(--color-primary)',
                borderRadius: 2,
                '&:hover': {
                  background: 'rgba(108,63,224,0.05)',
                  borderColor: 'var(--color-primary)',
                }
              }}
            >
              Apply for Internship
            </Button>
          </Box>

          <Box sx={{ mt: 2, width: '100%', textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary" fontSize="0.7rem">
              © 2026 InternFlow
            </Typography>
          </Box>
        </Box>
      </motion.div>

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
