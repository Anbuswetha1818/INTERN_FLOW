import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, InputAdornment, Chip, Dialog, ToggleButton, ToggleButtonGroup
} from '@mui/material';
import { Add, Search, FilterList, ViewList, ViewKanban, AddTask, MoreVert } from '@mui/icons-material';
import { tasksAPI } from '../../services/api';
import { LoadingSpinner, StatusChip, PriorityBadge } from '../../components/common';
import CreateTaskDialog from './CreateTaskDialog';
import TaskCard from './TaskCard';
import { motion } from 'framer-motion';

const COLUMNS = ['Pending', 'In Progress', 'In Review', 'Completed'];

export default function TaskList({ onNavigate }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'board'

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await tasksAPI.list();
      setTasks(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const filteredTasks = tasks.filter(t => 
    t.title?.toLowerCase().includes(search.toLowerCase()) || 
    t.assigned_to_name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading Tasks..." />;

  const handleTaskClick = (task) => {
    if (onNavigate) onNavigate('individual-task', task);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Tasks</Typography>
          <Typography variant="body2" color="text.secondary">Manage and track all assignments.</Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <ToggleButtonGroup
            value={viewMode}
            exclusive
            onChange={(e, val) => val && setViewMode(val)}
            size="small"
            sx={{ bgcolor: 'var(--bg-card)' }}
          >
            <ToggleButton value="list"><ViewList /></ToggleButton>
            <ToggleButton value="board"><ViewKanban /></ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>Create Task</Button>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <TextField
          size="small"
          placeholder="Search tasks..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
          }}
          sx={{ minWidth: 300, bgcolor: 'var(--bg-card)', borderRadius: 1 }}
        />
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" startIcon={<FilterList />} sx={{ bgcolor: 'var(--bg-card)' }} onClick={() => alert('Filter options coming soon!')}>Filter</Button>
        </Box>
      </Box>

      {viewMode === 'list' ? (
        <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
          <TableContainer sx={{ maxHeight: 'calc(100vh - 300px)' }}>
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Assignee</TableCell>
                  <TableCell>Priority</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Progress</TableCell>
                  <TableCell>Deadline</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTasks.map((row) => (
                  <TableRow key={row.id} hover onClick={() => handleTaskClick(row)} sx={{ cursor: 'pointer' }}>
                    <TableCell>
                      <Typography fontWeight={700} variant="body2">{row.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {row.project_name || 'No Project'} | {row.task_type}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.assigned_to_name || 'Unassigned'}</Typography>
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={row.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.status} />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box sx={{ width: '100%', bgcolor: 'action.hover', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <Box sx={{ width: `${row.progress}%`, height: '100%', bgcolor: row.progress === 100 ? 'success.main' : 'primary.main' }} />
                        </Box>
                        <Typography variant="caption" fontWeight={700}>{row.progress}%</Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {row.deadline ? new Date(row.deadline).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={(e) => { e.stopPropagation(); }}><MoreVert fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredTasks.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                      <Box sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                        <AddTask sx={{ fontSize: 40, opacity: 0.5 }} />
                        <Typography>No tasks found.</Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ) : (
        <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 2, minHeight: 'calc(100vh - 250px)' }}>
          {COLUMNS.map(col => {
            const colTasks = filteredTasks.filter(t => t.status?.toLowerCase() === col.toLowerCase());
            return (
              <Box key={col} sx={{ minWidth: 320, maxWidth: 320, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 1 }}>
                  <Typography variant="subtitle1" fontWeight={700}>{col}</Typography>
                  <Chip size="small" label={colTasks.length} />
                </Box>
                <Box sx={{ 
                  flex: 1, 
                  bgcolor: 'rgba(0,0,0,0.02)', 
                  borderRadius: 3, 
                  p: 1.5,
                  border: '1px dashed var(--border-subtle)',
                  overflowY: 'auto'
                }}>
                  {colTasks.length > 0 ? colTasks.map(task => (
                    <TaskCard key={task.id} task={task} onClick={handleTaskClick} />
                  )) : (
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <Typography variant="body2">No tasks</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            );
          })}
        </Box>
      )}

      <CreateTaskDialog 
        open={openCreate} 
        onClose={() => setOpenCreate(false)} 
        onSuccess={fetchTasks} 
      />
    </motion.div>
  );
}
