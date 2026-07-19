/**
 * SIMS — Dashboard Shell
 * Reusable layout wrapper: Sidebar + Header + scrollable content area.
 *
 * When type='admin' is passed, the shell auto-maps the logged-in user's
 * DB role to the correct sidebar menu:
 *   superadmin → 'admin'
 *   manager    → 'manager'
 *   lead       → 'sme'
 *   mentor     → 'mentor'
 * Other explicit types (task, attendance, asset, payroll, intern-mgmt) pass through.
 */

import { useState, useEffect } from 'react';
import { Box } from '@mui/material';
import Header from './Header';
import Sidebar from './Sidebar';
import AIChatWidget from '../common/AIChatWidget';
import { useAuth } from '../../contexts/AuthContext';

/** Maps DB role → sidebar config key */
const ROLE_TO_SIDEBAR = {
  superadmin: 'superadmin',
  admin: 'admin',
  manager: 'manager',
  sme: 'sme',
  mentor: 'mentor',
  intern: 'intern',
  staff: 'intern', // staff fallback
};

export default function DashboardShell({ type, basePath = '', children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const { user } = useAuth();

  // Resolve the actual sidebar type
  // If the caller passes 'admin', auto-resolve from the logged-in role
  const resolvedType =
    type === 'admin'
      ? ROLE_TO_SIDEBAR[user?.role] || 'admin'
      : type;

  return (
    <Box className="dashboard-layout">
      <Sidebar
        type={resolvedType}
        basePath={basePath}
        collapsed={collapsed}
        mobileOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <Header basePath={basePath} onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
      <Box className="dashboard-content">
        {children}
      </Box>
      <AIChatWidget />
    </Box>
  );
}
