import { Box, Typography } from '@mui/material';

export default function TrendChart() {
  return (
    <Box sx={{ p: 2, border: '1px solid rgba(108,63,224,0.3)', borderRadius: 2, bgcolor: 'rgba(108,63,224,0.05)', textAlign: 'center' }}>
      <Typography variant="body2" color="secondary">📊 TrendChart</Typography>
    </Box>
  );
}
