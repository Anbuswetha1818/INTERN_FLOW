/**
 * SIMS — Task Dashboard Shell
 */
import { useState } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import DashboardShell from '../../components/layout/DashboardShell';

import TaskList from './TaskList';
import Projects from './Projects';
import Teams from './Teams';

import IndividualTask from './IndividualTask';
import TeamInternsPage from './TeamInternsPage';
import TaskManagerCreation from './TaskManagerCreation';
import GanttChart from './GanttChart';
import CompletionReviewQueue from './CompletionReviewQueue';
import ProjectStatusView from './ProjectStatusView';

export default function TaskDashboard() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  // Extract the active item from the URL path.
  const pathParts = location.pathname.split('/').filter(Boolean);
  const activeItem = pathParts.length > 1 ? pathParts[1] : 'dashboard';

  const renderContent = () => {
    switch (activeItem) {
      case 'tasks': return <TaskList onNavigate={(view, data) => {
        if (view === 'individual-task' && data) setSelectedTaskId(data.id);
        navigate(`/task/${view}`);
      }} />;
      case 'projects': return <Projects />;
      case 'project-status': return <ProjectStatusView />;
      case 'completion-review': return <CompletionReviewQueue />;
      case 'teams': return <Teams />;
      case 'individual-task': return <IndividualTask taskId={selectedTaskId} />;
      case 'team-interns': return <TeamInternsPage />;
      case 'task-manager': return <TaskManagerCreation />;
      case 'gantt': return <GanttChart />;
      default: return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Box className="page-header">
            <Typography variant="h4" fontWeight={800} sx={{ textTransform: 'capitalize' }}>
              {activeItem === 'dashboard' ? 'Tasks Dashboard' : activeItem.replace(/-/g, ' ')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage tasks, projects, and teams.
            </Typography>
          </Box>
          <Box className="glass-card" sx={{ p: 6, textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={700} sx={{
              background: 'var(--gradient-primary)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>
              {activeItem === 'dashboard' ? 'Task Dashboard Ready' : 'Module Scaffold Ready'}
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
    <DashboardShell type="task" basePath="/task">
      <Routes>
        <Route path="/" element={<Navigate to="dashboard" replace />} />
        <Route path="*" element={renderContent()} />
      </Routes>
    </DashboardShell>
  );
}
