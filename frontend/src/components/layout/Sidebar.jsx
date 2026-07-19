/**
 * SIMS — Sidebar Component
 * Role-based navigation with collapsible mobile support.
 *
 * Role → Sidebar type mapping:
 *   superadmin → 'admin'      : View all data + transactions, add staff
 *   manager    → 'manager'    : Intern approval, payment history, certs, assets
 *   lead       → 'sme'        : Projects, domains, payment management
 *   mentor     → 'mentor'     : Team, tasks, leave approvals
 *   intern     → 'intern'     : Self-service dashboard
 */

import { useState, useEffect } from 'react';
import { 
  Box, Typography, Tooltip, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, FormControl, InputLabel, Select, MenuItem, 
  Alert, CircularProgress, Grid 
} from '@mui/material';
import { NavLink } from 'react-router-dom';
import {
  Dashboard, People, Assignment, Schedule, Inventory,
  Payment, Description, Feedback, Group, PersonAdd,
  Settings, Assessment, BarChart, AdminPanelSettings,
  Task, CalendarMonth, SmartToy, TrendingUp,
  FolderSpecial, Workspaces, Approval, Verified,
  AccountBalance, Domain, SupervisedUserCircle, LaptopMac,
  CloudUpload, Webhook, SwapHoriz
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';


const MENU_CONFIG = {
  // ── Super Admin ────────────────────────────────────────────────────────────
  superadmin: [
    { section: 'Overview' },
    { key: 'dashboard',         label: 'Dashboard',         icon: Dashboard },
    { section: 'Management' },
    { key: 'staff',             label: 'Staff Management',  icon: People },
    { key: 'intern-directory',  label: 'Intern Directory',  icon: SupervisedUserCircle },

    { key: 'payments',          label: 'Transactions',      icon: Payment },
    { key: 'entities',          label: 'Entities',          icon: Domain },
    { key: 'teams',             label: 'Teams',             icon: Group },
    { key: 'attendance-history',label: 'Attendance History',icon: Schedule },
    { key: 'performance',       label: 'Performance Feedback', icon: Feedback },
    { section: 'System' },
    { key: 'audit-log',         label: 'Audit Log',         icon: Description },
    { key: 'profile',           label: 'Profile',           icon: Settings },
  ],

  // ── Admin (limited) ────────────────────────────────────────────────────────
  admin: [
    { section: 'Overview' },
    { key: 'dashboard',         label: 'Dashboard',         icon: Dashboard },
    { section: 'Management' },
    { key: 'staff',             label: 'Staff Management',  icon: People },
    { key: 'intern-directory',  label: 'Intern Directory',  icon: SupervisedUserCircle },
    { key: 'attendance-history',label: 'Attendance Management', icon: Schedule },
    { key: 'payments',          label: 'Transaction History',icon: Payment },
    { section: 'System' },
    { key: 'audit-log',         label: 'Audit Log',         icon: Description },
    { key: 'profile',           label: 'Profile',           icon: Settings },
  ],

  // ── Manager ────────────────────────────────────────────────────────────────
  manager: [
    { section: 'Overview' },
    { key: 'dashboard',       label: 'Dashboard',             icon: Dashboard },
    { section: 'Management' },
    { key: 'staff',            label: 'Staff Management',      icon: SupervisedUserCircle },
    { key: 'intern-directory', label: 'Intern Directory',      icon: People },
    { key: 'payment-list',    label: 'Payment History',        icon: Payment },
    { key: 'certificates',    label: 'Certificate Approvals',  icon: Verified },
    { key: 'assets',          label: 'Asset Overview',         icon: Inventory },
    { section: 'System' },
    { key: 'profile',         label: 'Profile',                icon: Settings },
  ],

  // ── SME (lead) ─────────────────────────────────────────────────────────────
  sme: [
    { key: 'dashboard',     label: 'Dashboard',           icon: Dashboard },
    { key: 'attendance-history', label: 'Attendance History',  icon: Schedule },
    { key: 'attendance-claims',  label: 'Attendance Claims',   icon: Feedback },
    { key: 'projects',      label: 'Projects',             icon: FolderSpecial },
    { key: 'teams',         label: 'Teams',                icon: Group },
    { key: 'interns',       label: 'Intern Directory', icon: People },
    { key: 'payment-list',  label: 'Payment Management',   icon: Payment },
    { key: 'profile',       label: 'Profile',              icon: Settings },
  ],

  // ── Mentor ─────────────────────────────────────────────────────────────────
  mentor: [
    { key: 'dashboard',  label: 'Dashboard',          icon: Dashboard },
    { key: 'attendance-history', label: 'Attendance History',  icon: Schedule },
    { key: 'projects',   label: 'Assigned Projects',   icon: FolderSpecial },
    { key: 'interns',    label: 'My Interns',          icon: People },
    { key: 'tasks',      label: 'Task Assignment',     icon: Task },
    { key: 'leaves',     label: 'Leave Approvals',     icon: Approval },
    { key: 'profile',    label: 'Profile',             icon: Settings },
  ],

  // ── Intern (self-service) ──────────────────────────────────────────────────
  intern: [
    { key: 'dashboard',      label: 'Dashboard',       icon: Dashboard },
    { key: 'my-projects',    label: 'My Projects & Mentor', icon: FolderSpecial },
    { key: 'tasks',          label: 'Tasks',            icon: Task },
    { key: 'attendance',     label: 'Attendance',       icon: Schedule },
    { key: 'attendance-claims', label: 'Attendance Claims', icon: Feedback },
    { key: 'leave',          label: 'Leave',            icon: CalendarMonth },
    { key: 'documents',      label: 'Documents',        icon: Description },
    { key: 'payments',       label: 'Payments',         icon: Payment },
    { key: 'assets',         label: 'Assets',           icon: Inventory },
    { key: 'performance',    label: 'Performance',      icon: Assessment },
    { key: 'ai-assistant',   label: 'AI Assistant',     icon: SmartToy },
    { key: 'mock-interview', label: 'AI Interview',     icon: SmartToy },
    { key: 'resume-builder', label: 'Resume Builder',   icon: Assignment },
    { key: 'exit-summary',   label: 'Exit Summary',     icon: TrendingUp },
    { key: 'learning',       label: 'Learning Path',    icon: Dashboard },
    { key: 'calendar',       label: 'Calendar',         icon: CalendarMonth },
    { key: 'profile',        label: 'Profile',          icon: Settings },
  ],

  // ── Legacy dashboard sidebars Kept for backward compatibility ──────────────
  task: [
    { key: 'dashboard',        label: 'Tasks Dashboard',   icon: Dashboard },
    { key: 'tasks',            label: 'Task List',          icon: Task },
    { key: 'projects',         label: 'Projects',           icon: FolderSpecial },
    { key: 'project-status',   label: 'Project Status',     icon: BarChart },
    { key: 'completion-review',label: 'Completion Review',  icon: Assignment },
    { key: 'teams',            label: 'Teams',              icon: Group },
  ],
  attendance: [
    { key: 'dashboard', label: 'Dashboard',        icon: Dashboard },
    { key: 'daily',     label: 'Daily Attendance', icon: Schedule },
    { key: 'log',       label: 'Attendance Log',   icon: Description },
    { key: 'leaves',    label: 'Leave Requests',   icon: CalendarMonth },
    { key: 'claims',    label: 'Attendance Claims', icon: Feedback },
    { key: 'profile',   label: 'Profile',          icon: Settings },
  ],
  asset: [
    { key: 'dashboard',    label: 'Dashboard',        icon: Dashboard },
    { key: 'management',   label: 'Asset Management', icon: Inventory },
    { key: 'intern-status',label: 'Intern Status',    icon: People },
    { key: 'reports',      label: 'Reports',          icon: BarChart },
  ],
  payroll: [
    { key: 'dashboard',  label: 'Dashboard',           icon: Dashboard },
    { key: 'management', label: 'Payment Management',  icon: Payment },
  ],
  'intern-mgmt': [
    { key: 'dashboard',   label: 'Dashboard',            icon: Dashboard },
    { key: 'assets',      label: 'Asset Management',     icon: Inventory },
    { key: 'laptops',     label: 'Assigned Laptops',     icon: LaptopMac },
    { key: 'interns',     label: 'Intern List',           icon: People },
    { key: 'documents',   label: 'Documents',             icon: Description },
    { key: 'feedback',    label: 'Feedback & Reviews',    icon: Feedback },
    { key: 'evaluations', label: 'Performance Evals',     icon: Assessment },
    { key: 'certificates',label: 'Certificates',          icon: Task },
    { key: 'forms',       label: 'Forms',                 icon: Assignment },
  ],
};

import { Block } from '@mui/icons-material';

export default function Sidebar({ type = 'admin', basePath = '', collapsed = false, mobileOpen = false, onClose }) {
  const { user, permissions } = useAuth();
  const rawItems = MENU_CONFIG[type] || MENU_CONFIG.admin;
  
  const shouldShow = (item) => {
    if (item.section) return true;
    if (item.key === 'intern-directory' || item.key === 'interns') return permissions?.hasInternAccess !== false;
    if (item.key === 'payments' || item.key === 'payment-list') return permissions?.canViewPaymentHistory !== false && permissions?.hasPayrollAccess !== false;
    if (item.key === 'assets' || item.key === 'management') return permissions?.hasAssetAccess !== false;
    if (item.key === 'attendance-history' || item.key === 'leaves' || item.key === 'daily') return permissions?.hasAttendanceAccess !== false;
    if (item.key === 'projects' || item.key === 'tasks') return permissions?.hasTaskAccess !== false;

    // Intern specific feature checks
    if (item.key === 'performance') return permissions?.intern_feature_performance !== false;
    if (item.key === 'ai-assistant') return permissions?.intern_feature_ai_assistant !== false;
    if (item.key === 'mock-interview') return permissions?.intern_feature_ai_interview !== false;
    if (item.key === 'resume-builder') return permissions?.intern_feature_resume_builder !== false;
    if (item.key === 'exit-summary') return permissions?.intern_feature_exit_summary !== false;
    if (item.key === 'learning') return permissions?.intern_feature_learning !== false;

    return true;
  };

  let items = rawItems.filter(shouldShow);
  
  if (type === 'intern-mgmt' && user?.role !== 'staff' && user?.role !== 'superadmin') {
    items = items.filter(item => item.key !== 'laptops' && item.key !== 'assets');
  }

  // Restrict super admin view for placeholder entities (VDart Inc, VDart Digital, etc)
  if (user?.role === 'superadmin' && user?.entityId && user.entityId !== 'all') {
    const allowedKeys = ['dashboard', 'staff', 'entities', 'profile'];
    items = items.filter(item => item.section || allowedKeys.includes(item.key));
  }

  // Filter out empty sections
  items = items.filter((item, index, array) => {
    if (!item.section) return true; // keep normal items
    // keep section only if there is at least one non-section item before the next section
    for (let i = index + 1; i < array.length; i++) {
      if (array[i].section) return false;
      if (!array[i].section) return true;
    }
    return false;
  });

  const renderIcon = (icon) => {
    if (!icon) return null;
    if (typeof icon === 'string') {
      return <i className={icon} />;
    }
    const IconComponent = icon;
    return <IconComponent className="icon" />;
  };

  return (
    <>
      {mobileOpen && (
        <Box
          sx={{ position: 'fixed', inset: 0, bgcolor: 'rgba(0,0,0,0.5)', zIndex: 1150, display: { md: 'none' } }}
          onClick={onClose}
        />
      )}
      <aside className={`dashboard-sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'open' : ''}`}>
        <div className="brand" style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            padding: '20px 8px 16px' 
          }}
        >
          {!collapsed && (
            <div className="brand-text" style={{ textAlign: 'center' }}>
              <div className="brand-name" style={{ fontSize: '20px', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Intern<span style={{ color: '#0EA5E9' }}>Flow</span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="brand-name" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>
              IF
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <div className="sidebar-nav">
          {items.map((item, idx) => {
            if (item.section) {
              return !collapsed ? (
                <div key={`sec-${idx}`} className="nav-section-label">
                  {item.section}
                </div>
              ) : null;
            }

            const linkPath = `${basePath}/${item.key}`;

            if (item.disabled) {
              return collapsed ? (
                <Tooltip key={item.key} title={`${item.label} (Coming Soon)`} placement="right">
                  <div
                    style={{ justifyContent: 'center', padding: '12px', display: 'flex', opacity: 0.6, cursor: 'not-allowed' }}
                  >
                    {renderIcon(item.icon)}
                  </div>
                </Tooltip>
              ) : (
                <div
                  key={item.key}
                  className="sidebar-item"
                  style={{ display: 'flex', opacity: 0.6, cursor: 'not-allowed' }}
                >
                  {renderIcon(item.icon)}
                  <span>{item.label}</span>
                  {item.badge && <span className="sidebar-badge">{item.badge}</span>}
                </div>
              );
            }

            return collapsed ? (
              <Tooltip key={item.key} title={item.label} placement="right">
                <NavLink
                  to={linkPath}
                  className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                  onClick={onClose}
                  style={{ justifyContent: 'center', padding: '12px', display: 'flex', textDecoration: 'none' }}
                >
                  {renderIcon(item.icon)}
                </NavLink>
              </Tooltip>
            ) : (
              <NavLink
                key={item.key}
                to={linkPath}
                className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
                style={{ display: 'flex', textDecoration: 'none' }}
              >
                {renderIcon(item.icon)}
                <span>{item.label}</span>
                {item.badge && <span className="sidebar-badge">{item.badge}</span>}
              </NavLink>
            );
          })}
        </div>

        {/* Bottom User Info matching prototype */}
        {!collapsed && (
          <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%', mt: 'auto' }}>
            <div className="sidebar-footer" style={{ marginTop: 0 }}>
              <div className="avatar-sm">
                {user?.fullName?.charAt(0) || user?.username?.charAt(0) || '?'}
              </div>
              <div className="sidebar-footer-text">
                <div className="sidebar-footer-name">{user?.fullName || user?.username}</div>
                {(!user?.fullName || user.fullName.toLowerCase() !== (user?.role === 'superadmin' ? 'super admin' : user?.role)?.toLowerCase()) && (
                  <div className="sidebar-footer-role">
                    {user?.role === 'superadmin' ? 'Super Admin' : (user?.role === 'admin' ? 'Admin' : (user?.role === 'sme' ? 'SME' : (user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : '')))}
                  </div>
                )}
                {user?.entityName && user?.role !== 'superadmin' && (
                  <div className="sidebar-footer-role" style={{ fontSize: '0.7rem', opacity: 0.8, marginTop: '2px' }}>
                    {user.entityName}
                  </div>
                )}
              </div>
            </div>

          </Box>
        )}
      </aside>


    </>
  );
}


