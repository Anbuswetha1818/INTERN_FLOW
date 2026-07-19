import { useState, useRef, useEffect } from 'react';
import { Box, Typography, TextField, IconButton, Paper, CircularProgress } from '@mui/material';
import { Send, SmartToy, Person } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { aiAPI } from '../../services/api';

export default function AIChatWidget() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: "Hi! I'm the SIMS AI. How can I help you today?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.chat({ message: userMsg });
      setMessages(prev => [...prev, { role: 'ai', content: res.data.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'ai', content: "Error: Could not connect to AI service." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper 
      elevation={0}
      sx={{ 
        height: 500, 
        display: 'flex', 
        flexDirection: 'column',
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 4,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <Box sx={{ p: 2, bgcolor: 'rgba(0,188,212,0.1)', display: 'flex', alignItems: 'center', gap: 1 }}>
        <SmartToy sx={{ color: 'var(--color-accent)' }} />
        <Typography fontWeight={700}>SIMS AI Assistant</Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {messages.map((msg, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ 
              alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            <Box sx={{ 
              p: 1.5, 
              borderRadius: 3,
              bgcolor: msg.role === 'user' ? 'var(--color-primary)' : 'rgba(255,255,255,0.05)',
              borderBottomRightRadius: msg.role === 'user' ? 4 : 24,
              borderBottomLeftRadius: msg.role === 'ai' ? 4 : 24,
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                {msg.role === 'user' ? <Person sx={{ fontSize: 14 }} /> : <SmartToy sx={{ fontSize: 14, color: 'var(--color-accent)' }} />}
                <Typography variant="caption" sx={{ opacity: 0.7 }}>
                  {msg.role === 'user' ? 'You' : 'Claude'}
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                {msg.content}
              </Typography>
            </Box>
          </motion.div>
        ))}
        {loading && (
          <Box sx={{ alignSelf: 'flex-start', p: 2 }}>
            <CircularProgress size={20} sx={{ color: 'var(--color-accent)' }} />
          </Box>
        )}
        <div ref={endRef} />
      </Box>

      {/* Input */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Ask me anything..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={!input.trim() || loading}
          sx={{ bgcolor: 'rgba(0,188,212,0.1)', borderRadius: 3 }}
        >
          <Send />
        </IconButton>
      </Box>
    </Paper>
  );
}
