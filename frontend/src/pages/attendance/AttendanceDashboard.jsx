/**
 * SIMS — Attendance Dashboard Shell
 */
import { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardShell from '../../components/layout/DashboardShell';

import DailyAttendance from './DailyAttendance';
import LeaveList from './LeaveList';
import AttendanceClaims from './AttendanceClaims';
import AttendanceLog from './AttendanceLog';

export default function AttendanceDashboard() {
  const location = useLocation();

  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeItem = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  const renderContent = () => {
    switch (activeItem) {
      case 'daily': return <DailyAttendance />;
      case 'leave-list': return <LeaveList />;
      case 'claims': return <AttendanceClaims />;
      case 'log': return <AttendanceLog />;
      default: return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box className="page-header">
            <Typography variant="h4" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
              {activeItem === 'dashboard' ? 'Attendance Dashboard' : activeItem.replace(/-/g, ' ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Monitor attendance, leaves, and claims.
            </Typography>
          </Box>
          <Box className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} sx={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              📅 {activeItem === 'dashboard' ? 'Attendance Dashboard Ready' : 'Module Scaffold Ready'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Backend API is fully functional. Frontend UI coming in the next phase.
            </Typography>
          </Box>
        </motion.div>
      );
    }
  };

  return (
    <DashboardShell type="attendance" basePath="/attendance">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={renderContent()} />
      </Routes>
    </DashboardShell>
  );
}
