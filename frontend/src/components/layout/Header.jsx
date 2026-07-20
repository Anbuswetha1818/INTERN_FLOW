/**
 * SIMS — Header Component
 * Fixed top bar with search, notifications, dark mode toggle, and user avatar.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Box, IconButton, Avatar, Typography,
  Menu, MenuItem, Divider, Tooltip, Select, FormControl, CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { orgAPI, usersAPI } from '../../services/api';
import {
  DarkMode as DarkIcon,
  LightMode as LightIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeMode } from '../../contexts/ThemeContext';
import { useToast } from '../../contexts/ToastContext';
import NotificationMenu from './NotificationMenu';
import GlobalSearch from '../common/GlobalSearch';

export default function Header({ basePath = '', onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [entities, setEntities] = useState([]);
  const [changingEntity, setChangingEntity] = useState(false);
  const warningShownRef = useRef(false);

  useEffect(() => {
    if (user?.role === 'superadmin') {
      orgAPI.entities().then(res => setEntities(res.data)).catch(console.error);
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'superadmin' && user?.entityId && user.entityId !== 'all' && !warningShownRef.current) {
      warningShownRef.current = true;
      setTimeout(() => {
        showToast('This workspace is currently in the setup phase and awaits future module updates.', 'info');
      }, 1000);
    }
  }, [user?.role, user?.entityId, showToast]);

  const handleEntityChange = async (e) => {
    const newEntityId = e.target.value;
    
    setChangingEntity(true);
    try {
      // Pass null to clear entity if 'all' is selected
      await usersAPI.updateUser(user.empId, { entity: newEntityId === 'all' ? null : newEntityId });
      
      // Update sessionStorage so the new state persists after reload
      if (newEntityId === 'all') {
        sessionStorage.setItem('entityId', '');
      } else {
        sessionStorage.setItem('entityId', newEntityId);
      }
      
      // Redirect to the dashboard to avoid getting stuck on a restricted page
      const targetUrl = basePath ? `${basePath}/dashboard` : '/dashboard';
      window.location.href = targetUrl;
    } catch (err) {
      console.error('Failed to change entity scope', err);
      setChangingEntity(false);
    }
  };

  const handleLogout = async () => {
    setAnchorEl(null);
    await logout();
    window.location.href = '/';
  };

  return (
    <div className="dashboard-header">
      {/* Left: Menu toggle + Search */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          flex: 1,
          minWidth: 0,
          overflow: "hidden"
        }}
      >
        <IconButton onClick={onToggleSidebar} sx={{ display: { md: 'none' }, color: 'var(--text-primary)', p: { xs: 0.5, sm: 1 } }}>
          <MenuIcon />
        </IconButton>

        <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', mr: 0.5, flexShrink: 0 }} onClick={() => navigate('/')}>
          <Typography variant="h6" fontWeight={800} sx={{ fontSize: '1.05rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Intern<span style={{ color: '#0EA5E9' }}>Flow</span>
          </Typography>
        </Box>

        <GlobalSearch />
      </div>

      {/* Right: Actions */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "10px",
          flexShrink: 0,
          whiteSpace: "nowrap"
        }}
      >

        {user?.role === 'superadmin' && (
          <FormControl size="small" sx={{ minWidth: { xs: 90, sm: 120, md: 160 } }}>
            <Select
              value={(entities.find(e => String(e.id) === String(user.entityId))?.name === 'InternFlow') ? 'all' : (user.entityId || 'all')}
              onChange={handleEntityChange}
              disabled={changingEntity}
              sx={{
                bgcolor: 'var(--glass-bg)',
                borderRadius: 'var(--radius-full)',
                height: 36,
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: 'var(--text-primary)',
                '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
                '&:hover': { bgcolor: 'rgba(0,0,0,0.04)' }
              }}
            >
              <MenuItem value="all">
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' }} />
                  InternFlow
                </Box>
              </MenuItem>
              {user.entityId && !entities.some(e => String(e.id) === String(user.entityId)) && (
                <MenuItem value={user.entityId} style={{ display: 'none' }}>Loading...</MenuItem>
              )}
              {entities.filter(ent => ent.name !== 'InternFlow').map(ent => (
                <MenuItem key={ent.id} value={ent.id}>{ent.name}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        <NotificationMenu unreadCount={unreadCount} setUnreadCount={setUnreadCount} />

        <div
          className="topbar-user"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            minWidth: 0,
            maxWidth: "220px",
            overflow: "hidden",
            cursor: "pointer"
          }}
        >
          <div className="avatar-topbar">
            {user.fullName?.charAt(0) || user.username?.charAt(0) || '?'}
          </div>
          <Box
            className="topbar-user-text"
            sx={{
              display: {
                xs: "none",
                sm: "block"
              },
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0
            }}
          >
            <div className="topbar-user-name">{user.fullName || user.username}</div>
            {(!user?.fullName || user.fullName.toLowerCase() !== (user?.role === 'superadmin' ? 'super admin' : user?.role)?.toLowerCase()) && (
              <div className="topbar-user-role">
                {user.role === 'superadmin' ? 'Super Admin' : (user.role === 'admin' ? 'Admin' : (user.role === 'sme' ? 'SME' : (user.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '')))}
              </div>
            )}
            {user?.entityName && user?.role !== 'superadmin' && (
              <div className="topbar-user-role" style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>
                {user.entityName}
              </div>
            )}
          </Box>
        </div>


        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              minWidth: 220,
              mt: 1.5,
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--glass-shadow)',
              padding: '4px 0',
              overflow: 'visible',
              fontFamily: '"Poppins", sans-serif',
              '& *': {
                fontFamily: '"Poppins", sans-serif !important',
              },
              '& .MuiList-root': {
                padding: 0,
              },
            }
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          {/* User Info Header */}
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'flex-start', 
            py: 2, 
            px: 2.5, 
            borderBottom: '1px solid var(--glass-border)',
            background: 'rgba(255, 255, 255, 0.02)',
          }}>
            <Typography variant="subtitle2" color="var(--text-primary)" fontWeight={700} sx={{ textTransform: 'capitalize', fontSize: '14.5px', letterSpacing: '-0.01em', mb: 0.5 }}>
              {user.fullName || user.username}
            </Typography>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
              <Typography variant="caption" sx={{ color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>
                ID: {user.empId}
              </Typography>
              {user.email && (
                <Typography variant="caption" sx={{ color: 'var(--text-secondary)', fontSize: '11.5px', wordBreak: 'break-all' }}>
                  {user.email}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Menu Items */}
          <MenuItem 
            onClick={() => { setAnchorEl(null); navigate(`${basePath}/profile`); }}
            sx={{
              py: 1.25,
              px: 2.5,
              gap: 1.5,
              color: 'var(--text-secondary)',
              fontSize: '13.5px',
              fontWeight: 500,
              transition: 'all var(--transition-fast)',
              '&:hover': {
                background: 'var(--bg-hover)',
                color: 'var(--text-primary)',
                '& svg': {
                  color: 'var(--primary-500)',
                  transform: 'scale(1.05)',
                }
              },
              '& svg': {
                color: 'var(--primary-500)',
                fontSize: '18px',
                transition: 'all var(--transition-fast)',
              }
            }}
          >
            <PersonIcon /> Profile
          </MenuItem>

          <MenuItem 
            onClick={handleLogout} 
            sx={{ 
              py: 1.25,
              px: 2.5,
              gap: 1.5,
              color: 'var(--error-500)',
              fontSize: '13.5px',
              fontWeight: 600,
              transition: 'all var(--transition-fast)',
              borderTop: '1px solid var(--glass-border)',
              '&:hover': { 
                background: 'var(--error-bg)',
                color: 'var(--error-500)',
                '& svg': {
                  transform: 'scale(1.05)',
                }
              },
              '& svg': {
                fontSize: '18px',
                transition: 'all var(--transition-fast)',
              }
            }}
          >
            <LogoutIcon /> Logout
          </MenuItem>
        </Menu>
      </div>
    </div>
  );
}
