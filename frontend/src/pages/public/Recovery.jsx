/**
 * SIMS — Password Recovery (OTP Request)
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';
import { authAPI } from '../../services/api';

export default function Recovery() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      await authAPI.requestOTP({ email });
      setMessage('OTP sent! Check your email.');
      setTimeout(() => navigate('/Reset', { state: { email } }), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally { setLoading(false); }
  };

  return (
    <Box sx={{
      minHeight: '100vh',
      width: '100%',
      boxSizing: 'border-box',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--gradient-hero)', position: 'relative', overflow: 'hidden',
      p: { xs: 2, sm: 3 },
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
        style={{ width: '100%', maxWidth: 420, display: 'flex', justifyContent: 'center' }}
      >
        <Box sx={{
          width: '100%',
          maxWidth: 420,
          mx: 'auto',
          p: { xs: 2.5, sm: 4 },
          my: 2,
          background: 'var(--bg-card)', backdropFilter: 'blur(30px)',
          border: '1px solid var(--border-subtle)', borderRadius: 4, position: 'relative',
          boxShadow: 'var(--shadow-lg)'
        }}>
          <Typography variant="h5" fontWeight={800} align="center" mb={1} className="gradient-text">
            Password Recovery
          </Typography>
          <Typography variant="body2" color="text.secondary" align="center" mb={3}>
            Enter your email to receive a password reset OTP.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
          <form onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} sx={{ mb: 3 }} />
            <Button type="submit" fullWidth variant="contained" disabled={loading} sx={{
              py: 1.3, background: 'var(--gradient-primary)', fontWeight: 700,
            }}>
              {loading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Send OTP'}
            </Button>
          </form>
          <Button fullWidth onClick={() => navigate('/')} sx={{ mt: 2, color: 'text.secondary' }}>
            ← Back to Login
          </Button>
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
