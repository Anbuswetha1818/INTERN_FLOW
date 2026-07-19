/**
 * SIMS — Common UI Components
 * Reusable status chips, priority badges, empty states, confirm dialogs, loaders.
 */

import { Chip, Box, Typography, Dialog, DialogTitle, DialogContent, DialogActions, Button, CircularProgress } from '@mui/material';
import { motion } from 'framer-motion';

// =============================================================================
// Status Chip — color-coded by status string
// =============================================================================
const STATUS_COLORS = {
  active: 'success', present: 'success', approved: 'success', paid: 'success',
  completed: 'success', verified: 'success',
  pending: 'warning', inprogress: 'warning', todo: 'warning',
  rejected: 'error', overdue: 'error', discontinued: 'error', lost: 'error',
  damaged: 'error', absent: 'error',
  yettojoin: 'info', onleave: 'info', planning: 'info',
};

export function StatusChip({ status, size = 'small', ...props }) {
  const color = STATUS_COLORS[status?.toLowerCase()] || 'default';
  const label = status?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown';

  return (
    <Chip
      label={label}
      color={color}
      size={size}
      variant="outlined"
      sx={{ fontWeight: 600, fontSize: '0.72rem', borderRadius: '20px' }}
      {...props}
    />
  );
}

// =============================================================================
// Priority Badge
// =============================================================================
const PRIORITY_STYLES = {
  high: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
  medium: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: 'rgba(245,158,11,0.3)' },
  low: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
};

export function PriorityBadge({ priority }) {
  const style = PRIORITY_STYLES[priority?.toLowerCase()] || PRIORITY_STYLES.medium;
  return (
    <Box sx={{
      display: 'inline-flex', alignItems: 'center', gap: 0.5,
      px: 1.5, py: 0.3, borderRadius: '20px', fontSize: '0.72rem',
      fontWeight: 700, bgcolor: style.bg, color: style.color,
      border: `1px solid ${style.border}`, textTransform: 'capitalize',
    }}>
      ● {priority}
    </Box>
  );
}

// =============================================================================
// Empty State
// =============================================================================
export function EmptyState({ icon, title = 'No data found', subtitle = '' }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Box sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        py: 8, px: 4, textAlign: 'center',
      }}>
        {icon && <Box sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }}>{icon}</Box>}
        <Typography variant="h6" fontWeight={600} gutterBottom>{title}</Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" maxWidth={400}>
            {subtitle}
          </Typography>
        )}
      </Box>
    </motion.div>
  );
}

// =============================================================================
// Confirm Dialog
// =============================================================================
export function ConfirmDialog({ open, title, message, onConfirm, onCancel, confirmText = 'Confirm', danger = false }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle fontWeight={700}>{title}</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel} variant="outlined" size="small">Cancel</Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          size="small"
          color={danger ? 'error' : 'primary'}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// =============================================================================
// Loading Spinner
// =============================================================================
export function LoadingSpinner({ text = 'Loading...' }) {
  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', py: 8, gap: 2,
    }}>
      <CircularProgress sx={{ color: 'var(--color-primary)' }} />
      <Typography variant="body2" color="text.secondary">{text}</Typography>
    </Box>
  );
}

// =============================================================================
// Stat Card with animation
// =============================================================================
export function StatCard({ label, value, color = 'var(--color-primary)', icon, trend, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      style={{ display: 'flex', flex: 1, width: '100%', height: '100%' }}
    >
      <Box className="stat-card" sx={{ position: 'relative', overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%', minHeight: '110px' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', gap: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <Typography className="stat-value" sx={{ color, fontSize: '1.8rem', fontWeight: 800, lineHeight: 1.2 }}>{value}</Typography>
            <Typography className="stat-label" sx={{ fontSize: '0.85rem', fontWeight: 500, mt: 0.5, color: 'text.secondary', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{label}</Typography>
          </Box>
          {icon && (
            <Box sx={{
              width: 40, height: 40, borderRadius: '10px',
              background: `${color}15`, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color, flexShrink: 0
            }}>
              {icon}
            </Box>
          )}
        </Box>
        {trend && (
          <Typography variant="caption" sx={{
            color: trend > 0 ? '#22c55e' : '#ef4444',
            fontWeight: 600,
            mt: 1,
            display: 'block'
          }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month
          </Typography>
        )}
      </Box>
    </motion.div>
  );
}

// =============================================================================
// SLA Badge Component
// =============================================================================
export function SLABadge({ deadline, status }) {
  if (!deadline || status?.toLowerCase() === 'completed') return null;

  const now = new Date();
  const taskDeadline = new Date(deadline);
  const diffTime = taskDeadline - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let label = 'On Track';
  let color = 'success';

  if (diffDays < 0) {
    label = `Breached (${Math.abs(diffDays)}d)`;
    color = 'error';
  } else if (diffDays <= 2) {
    label = `At Risk (${diffDays}d)`;
    color = 'warning';
  }

  return (
    <Chip 
      label={label} 
      color={color} 
      size="small" 
      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }} 
    />
  );
}
