import { Box, Typography, Paper } from '@mui/material';

export default function ContactUs1() {
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}>
      <Paper className="glass-card" sx={{ p: 6, textAlign: 'center', maxWidth: 600 }}>
        <Typography variant="h4" fontWeight={800} gutterBottom>ContactUs1</Typography>
        <Typography variant="body1" color="text.secondary">
          Public facing page scaffold ready. UI will be populated in future updates.
        </Typography>
      </Paper>
    </Box>
  );
}
