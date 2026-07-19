/**
 * SIMS — Admin Dashboard (role-aware shell)
 *
 * Routes the logged-in staff user to their role-specific content:
 *   superadmin → AdminContent   (view all, add staff)
 *   manager    → ManagerContent (onboarding, payment history, certs, assets)
 *   lead (SME) → SMEContent     (projects, domains, payment management)
 *   mentor     → MentorContent  (team, tasks, leave approvals)
 */

import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import DashboardShell from '../../components/layout/DashboardShell';

// Role-specific dashboard content
import AdminContent   from './role-dashboards/AdminContent';
import ManagerContent from './role-dashboards/ManagerContent';
import SMEContent     from './role-dashboards/SMEContent';
import MentorContent  from './role-dashboards/MentorContent';

export default function AdminDashboard() {
  const { user } = useAuth();
  const location = useLocation();

  // Extract the active item from the URL path.
  // Assuming the path is like /admin/staff or /admin/dashboard
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeItem = pathParts.length > 1 ? pathParts[1] : 'dashboard';
  const subAction = pathParts.length > 2 ? pathParts[2] : null;
  const subId = pathParts.length > 3 ? pathParts[3] : null;

  // Resolve which content component + active-item handler to use
  const renderContent = () => {
    switch (user?.role) {
      case 'superadmin': return <AdminContent   activeItem={activeItem} subAction={subAction} subId={subId} />;
      case 'manager':    return <ManagerContent activeItem={activeItem} subAction={subAction} subId={subId} />;
      case 'sme':        return <SMEContent     activeItem={activeItem} subAction={subAction} subId={subId} />;
      case 'mentor':     return <MentorContent  activeItem={activeItem} subAction={subAction} subId={subId} />;
      default:           return <AdminContent   activeItem={activeItem} subAction={subAction} subId={subId} />;
    }
  };

  return (
    <DashboardShell type="admin" basePath="/admin">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={renderContent()} />
      </Routes>
    </DashboardShell>
  );
}
