import { useState } from 'react';
import { Box, Typography, Paper, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, MenuItem, IconButton } from '@mui/material';
import { Add, Delete, Save } from '@mui/icons-material';
import { motion } from 'framer-motion';

const MOCK_INTERNS = [
  { id: 1, name: 'Alice Smith' },
  { id: 2, name: 'Bob Jones' },
];

export default function TaskManagerCreation() {
  const [rows, setRows] = useState([
    { id: 1, title: '', assignee: '', deadline: '', priority: 'Medium' }
  ]);

  const handleAddRow = () => {
    setRows([...rows, { id: Date.now(), title: '', assignee: '', deadline: '', priority: 'Medium' }]);
  };

  const handleRemoveRow = (id) => {
    setRows(rows.filter(r => r.id !== id));
  };

  const handleSave = () => {
    console.log('Saving tasks:', rows);
    // API call would go here
    alert('Tasks successfully created!');
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Bulk Task Creation</Typography>
          <Typography variant="body2" color="text.secondary">
            Quickly assign multiple tasks to your team members.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />} onClick={handleSave}>Save All</Button>
      </Box>

      <Paper className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Task Title</TableCell>
                <TableCell>Assignee</TableCell>
                <TableCell>Deadline</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, index) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <TextField 
                      fullWidth size="small" placeholder="Enter task title" 
                      value={row.title} onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index].title = e.target.value;
                        setRows(newRows);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField 
                      select fullWidth size="small" value={row.assignee}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index].assignee = e.target.value;
                        setRows(newRows);
                      }}
                    >
                      {MOCK_INTERNS.map(intern => (
                        <MenuItem key={intern.id} value={intern.id}>{intern.name}</MenuItem>
                      ))}
                    </TextField>
                  </TableCell>
                  <TableCell>
                    <TextField 
                      type="date" fullWidth size="small" value={row.deadline}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index].deadline = e.target.value;
                        setRows(newRows);
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <TextField 
                      select fullWidth size="small" value={row.priority}
                      onChange={(e) => {
                        const newRows = [...rows];
                        newRows[index].priority = e.target.value;
                        setRows(newRows);
                      }}
                    >
                      <MenuItem value="Low">Low</MenuItem>
                      <MenuItem value="Medium">Medium</MenuItem>
                      <MenuItem value="High">High</MenuItem>
                      <MenuItem value="Critical">Critical</MenuItem>
                    </TextField>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" color="error" onClick={() => handleRemoveRow(row.id)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Box sx={{ p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--border-subtle)' }}>
          <Button variant="outlined" startIcon={<Add />} onClick={handleAddRow} size="small">
            Add Another Row
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}
