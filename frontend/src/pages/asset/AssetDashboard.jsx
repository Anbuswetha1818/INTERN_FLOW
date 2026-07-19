/**
 * SIMS — Asset Dashboard Shell
 */
import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardShell from '../../components/layout/DashboardShell';

import AssetManagement from './AssetManagement';
import InternAssetStatus from './InternAssetStatus';
import AssetReports from './AssetReports';

export default function AssetDashboard() {
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeItem = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  const renderContent = () => {
    switch (activeItem) {
      case 'management': return <AssetManagement />;
      case 'intern-status': return <InternAssetStatus />;
      case 'reports': return <AssetReports />;
      case 'my-assets': return <Box sx={{ p: 4 }}><Typography variant="h5">My Assigned Assets (Intern View)</Typography></Box>;
      case 'dashboard': return <AssetManagement />;
      default: return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box className="page-header">
            <Typography variant="h4" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
              {activeItem === 'dashboard' ? 'Asset Dashboard' : activeItem.replace(/-/g, ' ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Track and manage organizational assets.
            </Typography>
          </Box>
          <Box className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} sx={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              📦 Asset Dashboard Ready
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Asset CRUD, issue reporting, and replacement flow APIs are live. Full UI coming in Phase 7.
            </Typography>
          </Box>
        </motion.div>
      );
    }
  };

  return (
    <DashboardShell type="asset" basePath="/asset">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={renderContent()} />
      </Routes>
    </DashboardShell>
  );
}
