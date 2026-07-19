import { Box, Typography, Paper, Grid, Card, CardContent, Button, Chip } from '@mui/material';
import { motion } from 'framer-motion';
import { LaptopMac, ReportProblem } from '@mui/icons-material';

const MOCK_ASSETS = [
  { id: 1, type: 'Laptop', model: 'MacBook Pro 14"', serial: 'C02HG5XYQ05D', status: 'Assigned', issueReported: false },
  { id: 2, type: 'Monitor', model: 'Dell UltraSharp 27"', serial: 'CN-0HG5XY-Q05D', status: 'Assigned', issueReported: true },
];

export default function AssetReport() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>My Assets</Typography>
        <Typography variant="body2" color="text.secondary">
          Track hardware assigned to you and report any issues.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {MOCK_ASSETS.map(asset => (
          <Grid xs={12} sm={6} md={4} key={asset.id}>
            <Card className="glass-card" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                  <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                    <LaptopMac />
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={700} sx={{ lineHeight: 1.2 }}>{asset.type}</Typography>
                    <Typography variant="caption" color="text.secondary">{asset.model}</Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" display="block">Serial Number</Typography>
                  <Typography variant="body2" fontWeight={600}>{asset.serial}</Typography>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Chip 
                    label={asset.status} 
                    size="small" 
                    color="success" 
                  />
                  {asset.issueReported && (
                    <Chip 
                      icon={<ReportProblem fontSize="small" />} 
                      label="Issue Reported" 
                      size="small" 
                      color="error" 
                      variant="outlined"
                    />
                  )}
                </Box>
              </CardContent>
              <Box sx={{ p: 2, borderTop: '1px solid var(--border-subtle)', bgcolor: 'rgba(0,0,0,0.02)' }}>
                <Button 
                  variant="outlined" 
                  color="error" 
                  fullWidth 
                  size="small"
                  disabled={asset.issueReported}
                  startIcon={<ReportProblem />}
                >
                  {asset.issueReported ? 'Issue Under Review' : 'Report Issue'}
                </Button>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
    </motion.div>
  );
}
