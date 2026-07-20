import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, IconButton, Badge, Menu, MenuItem, Divider, Button, Avatar 
} from '@mui/material';
import { 
  Notifications as NotifIcon, DoneAll, Settings, EventNote, Task, Warning, Info 
} from '@mui/icons-material';
import { notificationsAPI } from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function NotificationMenu({ unreadCount, setUnreadCount }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isElongated, setIsElongated] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      const notifsList = Array.isArray(res.data) ? res.data : (res.data?.notifications || []);
      setNotifications(notifsList);
      const unread = Array.isArray(res.data) ? res.data.filter(n => !n.is_read).length : (res.data?.unread_count || 0);
      if (setUnreadCount) setUnreadCount(unread);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleOpen = (e) => {
    setAnchorEl(e.currentTarget);
    fetchNotifications();
  };

  const handleClose = () => {
    setAnchorEl(null);
    setIsElongated(false);
  };

  const handleNotificationClick = async (notif, e) => {
    handleClose();
    if (!notif.is_read) {
      await handleMarkRead(notif.id, e);
    }
    const isIntern = user?.role === 'intern';
    const type = notif.related_type || notif.notification_type;
    
    switch (type) {
      case 'onboarding_submission':
      case 'onboarding':
        navigate('/intern/onboarding');
        break;
      case 'task':
      case 'task_assigned':
      case 'task_status':
        navigate(isIntern ? '/intern-user/tasks' : '/admin/tasks');
        break;
      case 'leave':
      case 'leave_status':
      case 'leave_approval':
        navigate(isIntern ? '/intern-user/leave' : '/admin/leaves');
        break;
      case 'document':
      case 'document_status':
        navigate(isIntern ? '/intern-user/documents' : '/intern/documents');
        break;
      case 'payment':
      case 'payment_status':
        navigate(isIntern ? '/intern-user/payments' : '/admin/payment-list');
        break;
      case 'attendance_claim':
        navigate(isIntern ? '/intern-user/attendance' : '/admin/attendance-history');
        break;
      default:
        if (notif.title.toLowerCase().includes('application')) {
          navigate('/intern/onboarding');
        }
        break;
    }
  };

  const handleMarkRead = async (id, e) => {
    e.stopPropagation();
    try {
      await notificationsAPI.markRead(id);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'task': return <Task sx={{ color: 'primary.main', fontSize: 20 }} />;
      case 'leave': return <EventNote sx={{ color: 'warning.main', fontSize: 20 }} />;
      case 'system': return <Warning sx={{ color: 'error.main', fontSize: 20 }} />;
      default: return <Info sx={{ color: 'info.main', fontSize: 20 }} />;
    }
  };

  const unreadNotifications = notifications.filter(n => !n.is_read);
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.is_read === b.is_read) {
      return new Date(b.created_at) - new Date(a.created_at);
    }
    return a.is_read ? 1 : -1;
  });
  const visibleNotifications = isElongated 
    ? sortedNotifications 
    : sortedNotifications.slice(0, 5);

  return (
    <>
      <div 
        className="icon-btn" 
        onClick={handleOpen} 
        style={{ cursor: 'pointer' }}
      >
        <NotifIcon style={{ fontSize: '18px' }} />
        {unreadCount > 0 && <div className="notif-dot" />}
      </div>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        PaperProps={{
          sx: { 
            width: { xs: 'calc(100vw - 32px)', sm: 360 },
            maxWidth: '100vw', 
            maxHeight: isElongated ? '80vh' : 500, 
            mt: 1, 
            borderRadius: 3, 
            boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            transition: 'max-height 0.3s ease-in-out'
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700}>Notifications</Typography>
        </Box>
        <Divider />

        <Box 
          sx={{ 
            height: visibleNotifications.length === 0 ? 'auto' : (isElongated ? '70vh' : 'auto'),
            maxHeight: isElongated ? '70vh' : 380,
            overflowY: 'auto', 
            transition: 'all 0.3s ease-in-out',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          {loading && notifications.length === 0 ? (
            <Box sx={{ p: 4, my: 'auto', textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">Loading...</Typography>
            </Box>
          ) : visibleNotifications.length > 0 ? (
            <Box sx={{ flexGrow: 1 }}>
              {visibleNotifications.map((notif) => (
                <MenuItem 
                  key={notif.id} 
                  onClick={(e) => handleNotificationClick(notif, e)}
                  sx={{ 
                    py: 1.5, px: 2, 
                    bgcolor: notif.is_read ? 'transparent' : 'rgba(108, 63, 224, 0.05)',
                    borderBottom: '1px solid', borderColor: 'divider',
                    whiteSpace: 'normal', display: 'flex', alignItems: 'flex-start', gap: 2
                  }}
                >
                  <Box sx={{ mt: 0.5, p: 1, bgcolor: 'action.hover', borderRadius: '50%' }}>
                    {getIcon(notif.notification_type)}
                  </Box>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" fontWeight={notif.is_read ? 400 : 700} color="text.primary">
                      {notif.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                      {notif.message}
                    </Typography>
                    <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 0.5 }}>
                      {new Date(notif.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                  {!notif.is_read && (
                    <Box 
                      sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main', mt: 1, flexShrink: 0 }}
                      onClick={(e) => handleMarkRead(notif.id, e)}
                      title="Mark as read"
                    />
                  )}
                </MenuItem>
              ))}
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No notifications found.</Typography>
            </Box>
          )}
        </Box>
        
        {notifications.length > 5 && (
          <>
            <Divider />
            <Box sx={{ p: 1, textAlign: 'center' }}>
              <Button 
                size="small" 
                sx={{ fontWeight: 600 }} 
                onClick={() => setIsElongated(!isElongated)}
              >
                {isElongated ? 'Show Less' : 'View All Activity'}
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
}
