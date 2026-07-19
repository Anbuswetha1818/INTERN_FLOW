import { useState } from 'react';
import { Box, IconButton, Paper, Typography, TextField, Button, Avatar } from '@mui/material';
import { SmartToy, Close, Send } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { aiUtils } from '../../utils/aiUtils';

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([{ text: 'Hi! I am your SIMS AI Assistant. How can I help you today?', sender: 'ai' }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await aiUtils.chatResponse(userMsg);
      setMessages(prev => [...prev, { text: response, sender: 'ai' }]);
    } catch (error) {
      setMessages(prev => [...prev, { text: 'Sorry, I am having trouble connecting right now.', sender: 'ai' }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  return (
    <>
      {/* Floating Action Button */}
      <Box sx={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
        <IconButton 
          color="primary" 
          onClick={() => setIsOpen(true)}
          sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            width: 56, 
            height: 56, 
            boxShadow: '0 8px 16px rgba(37, 99, 235, 0.25)',
            '&:hover': { bgcolor: 'primary.dark' },
            display: isOpen ? 'none' : 'flex'
          }}
        >
          <SmartToy fontSize="large" />
        </IconButton>
      </Box>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 10000 }}
          >
            <Paper 
              elevation={24} 
              sx={{ 
                width: 350, 
                height: 500, 
                display: 'flex', 
                flexDirection: 'column', 
                borderRadius: 4, 
                overflow: 'hidden',
                bgcolor: 'var(--bg-card)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              {/* Header */}
              <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 32, height: 32 }}>
                    <SmartToy fontSize="small" />
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={700}>SIMS AI</Typography>
                </Box>
                <IconButton size="small" onClick={() => setIsOpen(false)} sx={{ color: 'white' }}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>

              {/* Messages Area */}
              <Box sx={{ flexGrow: 1, p: 2, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
                {messages.map((msg, idx) => (
                  <Box key={idx} sx={{ display: 'flex', justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                    <Box sx={{ 
                      maxWidth: '80%', 
                      p: 1.5, 
                      borderRadius: 2, 
                      bgcolor: msg.sender === 'user' ? 'primary.main' : 'rgba(0,0,0,0.05)',
                      color: msg.sender === 'user' ? 'white' : 'text.primary',
                      borderBottomRightRadius: msg.sender === 'user' ? 4 : 16,
                      borderBottomLeftRadius: msg.sender === 'ai' ? 4 : 16,
                    }}>
                      <Typography variant="body2">{msg.text}</Typography>
                    </Box>
                  </Box>
                ))}
                {isTyping && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'rgba(0,0,0,0.05)', borderBottomLeftRadius: 4 }}>
                      <Typography variant="body2" color="text.secondary">...</Typography>
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Input Area */}
              <Box sx={{ p: 2, borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 1, bgcolor: 'background.paper' }}>
                <TextField 
                  fullWidth 
                  size="small" 
                  placeholder="Ask me anything..." 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  variant="outlined"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 4 } }}
                />
                <IconButton color="primary" onClick={handleSend} disabled={!input.trim() || isTyping}>
                  <Send />
                </IconButton>
              </Box>
            </Paper>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
