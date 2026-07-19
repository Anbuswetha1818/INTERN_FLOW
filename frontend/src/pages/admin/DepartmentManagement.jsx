import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Chip, TextField, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add, Edit, Delete, Assessment } from '@mui/icons-material';
import { orgAPI } from '../../services/api';
import { LoadingSpinner } from '../../components/common';
import { motion } from 'framer-motion';

export default function DepartmentManagement() {
  const [entities, setEntities] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog
  const [openDom, setOpenDom] = useState(false);
  const [selectedDom, setSelectedDom] = useState(null);
  const [domData, setDomData] = useState({ name: '', description: '', entity: '' });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [entRes, domRes] = await Promise.all([
        orgAPI.entities(),
        orgAPI.domains()
      ]);
      setEntities(entRes.data);
      setDomains(domRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDomSubmit = async () => {
    try {
      if (selectedDom) {
        await orgAPI.updateDomain(selectedDom.id, domData);
      } else {
        await orgAPI.createDomain(domData);
      }
      setOpenDom(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <LoadingSpinner text="Loading Domains..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Domain Management</Typography>
        <Typography variant="body2" color="text.secondary">Configure specialization domains and associate them with entities.</Typography>
      </Box>

      <Box className="glass-card" sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Assessment color="primary" /> Domains
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => {
              setSelectedDom(null);
              setDomData({ name: '', description: '', entity: entities[0]?.id || '' });
              setOpenDom(true);
            }}
          >
            New Domain
          </Button>
        </Box>
        
        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Entity</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {domains.map((row) => (
                <TableRow key={row.id}>
                  <TableCell sx={{ fontWeight: 600 }}>{row.name}</TableCell>
                  <TableCell sx={{ color: 'text.secondary', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {row.description || 'No description'}
                  </TableCell>
                  <TableCell>
                    <Chip label={row.entity_name || 'N/A'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => {
                      setSelectedDom(row);
                      setDomData({ name: row.name, description: row.description || '', entity: row.entity || '' });
                      setOpenDom(true);
                    }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={async () => {
                      if (window.confirm(`Are you sure you want to delete ${row.name}?`)) {
                        await orgAPI.deleteDomain(row.id);
                        fetchData();
                      }
                    }}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {domains.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ color: 'text.secondary', py: 3 }}>
                    No domains found. Create one to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Domain Dialog */}
      <Dialog open={openDom} onClose={() => setOpenDom(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedDom ? 'Edit Domain' : 'Create Domain'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Domain Name"
            fullWidth
            margin="normal"
            value={domData.name}
            onChange={(e) => setDomData({...domData, name: e.target.value})}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={domData.description}
            onChange={(e) => setDomData({...domData, description: e.target.value})}
          />
          <TextField
            select
            label="Entity"
            fullWidth
            margin="normal"
            value={domData.entity}
            onChange={(e) => setDomData({...domData, entity: e.target.value})}
          >
            <MenuItem value="">Select an Entity</MenuItem>
            {entities.map(ent => (
              <MenuItem key={ent.id} value={ent.id}>{ent.name}</MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDom(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleDomSubmit} disabled={!domData.name || !domData.entity}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
