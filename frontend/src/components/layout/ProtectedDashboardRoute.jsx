import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function ProtectedDashboardRoute({ children, requiredPermission }) {
  const { token, loading, permissions } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'var(--bg-primary)' }}>
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  if (!token) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If a required permission is specified, check it against the user's permissions
  if (requiredPermission && permissions && !permissions[requiredPermission]) {
    // Determine the fallback dashboard based on what they *do* have access to
    let fallbackPath = '/intern-user/dashboard';
    
    if (permissions.hasAdminAccess) fallbackPath = '/admin/dashboard';
    else if (permissions.hasTaskAccess) fallbackPath = '/task/dashboard';
    else if (permissions.hasInternAccess) fallbackPath = '/intern/dashboard';

    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', alignItems: 'center', justifyContent: 'center', bgcolor: 'var(--bg-primary)', p: 3, textAlign: 'center' }}>
        <Typography variant="h5" color="error" gutterBottom fontWeight="bold">
          Access Denied
        </Typography>
        <Typography variant="body1" color="text.secondary" mb={3}>
          You do not have permission to view this dashboard.
        </Typography>
        <Typography variant="body2">
          Redirecting to your dashboard...
        </Typography>
        <Navigate to={fallbackPath} replace />
      </Box>
    );
  }

  return children;
}
