/**
 * SIMS — App Root
 * React Router v7 with all route definitions and context providers.
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeContextProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';

import ProtectedDashboardRoute from './components/layout/ProtectedDashboardRoute';

// Public Pages
import InternHomePage from './pages/public/InternHomePage';
import LoginPage from './pages/public/LoginPage';
import Recovery from './pages/public/Recovery';
import Reset from './pages/public/Reset';
import InternOnboarding from './pages/public/InternOnboarding';
import AboutUs1 from './pages/public/AboutUs1';
import ContactUs1 from './pages/public/ContactUs1';
import PublicFeedbackForm from './pages/public/PublicFeedbackForm';

// Dashboard Shells
import AdminDashboard from './pages/admin/AdminDashboard';
import InternDashboard from './pages/intern-user/InternDashboard';
import TaskDashboard from './pages/task/TaskDashboard';
import AttendanceDashboard from './pages/attendance/AttendanceDashboard';
import AssetDashboard from './pages/asset/AssetDashboard';
import PayrollDashboard from './pages/payroll/PayrollDashboard';
import InternMgmtDashboard from './pages/intern-mgmt/InternMgmtDashboard';
import Settings from './pages/admin/Settings';

function App() {
  return (
    <ThemeContextProvider>
      <ToastProvider>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* ============================================ */}
              {/* Public Routes */}
              {/* ============================================ */}
              <Route path="/" element={<LoginPage />} />
              <Route path="/loginpage" element={<Navigate to="/" replace />} />
              <Route path="/Recovery" element={<Recovery />} />
              <Route path="/Reset" element={<Reset />} />
              <Route path="/InternOnboarding" element={<InternOnboarding />} />
              <Route path="/about" element={<AboutUs1 />} />
              <Route path="/contact" element={<ContactUs1 />} />
              <Route path="/feedback" element={<PublicFeedbackForm />} />

              {/* ============================================ */}
              {/* Admin Dashboard */}
              {/* ============================================ */}
              <Route path="/admin/*" element={
                <ProtectedDashboardRoute requiredPermission="hasAdminAccess"><AdminDashboard /></ProtectedDashboardRoute>
              } />

              {/* ============================================ */}
              {/* Intern Management Dashboard (Staff Side) */}
              {/* ============================================ */}
              <Route path="/intern/*" element={
                <ProtectedRoute><InternMgmtDashboard /></ProtectedRoute>
              } />

              {/* ============================================ */}
              {/* Task Dashboard */}
              {/* ============================================ */}
              <Route path="/task/*" element={
                <ProtectedDashboardRoute requiredPermission="hasTaskAccess"><TaskDashboard /></ProtectedDashboardRoute>
              } />

              {/* ============================================ */}
              {/* Attendance Dashboard */}
              {/* ============================================ */}
              <Route path="/attendance/*" element={
                <ProtectedDashboardRoute requiredPermission="hasAttendanceAccess"><AttendanceDashboard /></ProtectedDashboardRoute>
              } />

              {/* ============================================ */}
              {/* Asset Dashboard */}
              {/* ============================================ */}
              <Route path="/asset/*" element={
                <ProtectedDashboardRoute requiredPermission="hasAssetAccess"><AssetDashboard /></ProtectedDashboardRoute>
              } />

              {/* ============================================ */}
              {/* Payroll Dashboard */}
              {/* ============================================ */}
              <Route path="/payroll/*" element={
                <ProtectedDashboardRoute requiredPermission="hasPayrollAccess"><PayrollDashboard /></ProtectedDashboardRoute>
              } />

              {/* ============================================ */}
              {/* Intern Self-Service Dashboard */}
              {/* ============================================ */}
              <Route path="/intern-user/*" element={
                <ProtectedRoute><InternDashboard /></ProtectedRoute>
              } />

              {/* ============================================ */}
              {/* Settings */}
              {/* ============================================ */}
              <Route path="/Settings" element={
                <ProtectedRoute><Settings /></ProtectedRoute>
              } />

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeContextProvider>
  );
}

export default App;
