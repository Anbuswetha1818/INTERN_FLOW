/**
 * SIMS — Payroll Dashboard Shell
 */
import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardShell from '../../components/layout/DashboardShell';

import PaymentManagement from './PaymentManagement';

export default function PayrollDashboard() {
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeItem = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard': return <PaymentManagement />;
      case 'stipends': return <Box sx={{ p: 4 }}><Typography variant="h5">Stipend Details</Typography></Box>;
      case 'fees': return <Box sx={{ p: 4 }}><Typography variant="h5">Fee Structures</Typography></Box>;
      default: return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box className="page-header">
            <Typography variant="h4" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
              {activeItem === 'dashboard' ? 'Payroll Dashboard' : activeItem.replace(/-/g, ' ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage payments, fee structures, and stipends.
            </Typography>
          </Box>
          <Box className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} sx={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              Payroll Dashboard Ready
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Payment CRUD, fee structures, and history APIs are live. Full UI coming in Phase 7.
            </Typography>
          </Box>
        </motion.div>
      );
    }
  };

  return (
    <DashboardShell type="payroll" basePath="/payroll">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={renderContent()} />
      </Routes>
    </DashboardShell>
  );
}
