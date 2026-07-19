import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Grid, Switch, FormControlLabel,
  Autocomplete, Chip
} from '@mui/material';
import { Add, Edit, Delete, Domain } from '@mui/icons-material';
import { orgAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { useToast } from '../../contexts/ToastContext';
import { motion } from 'framer-motion';

export default function EntityManagement() {
  const { showToast } = useToast();
  const [entities, setEntities] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog state
  const [openEntity, setOpenEntity] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState(null);
  
  // Form data
  const [formData, setFormData] = useState({ name: '', description: '', is_active: true, domains: [] });

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

  const handleEntitySubmit = async () => {
    try {
      let entId;
      if (selectedEntity) {
        await orgAPI.updateEntity(selectedEntity.id, { 
          name: formData.name, 
          description: formData.description, 
          is_active: formData.is_active 
        });
        entId = selectedEntity.id;
      } else {
        const res = await orgAPI.createEntity({ 
          name: formData.name, 
          description: formData.description, 
          is_active: formData.is_active 
        });
        entId = res.data.id;
      }

      // Process domains
      if (formData.domains) {
        const existingDomainObjs = domains.filter(d => d.entity === entId);
        const existingDomainNames = existingDomainObjs.map(d => d.name);
        
        const newDomains = formData.domains.filter(d => !existingDomainNames.includes(d));
        const deletedDomainObjs = existingDomainObjs.filter(d => !formData.domains.includes(d.name));
        
        await Promise.all([
          ...newDomains.map(d => orgAPI.createDomain({ name: d, entity: entId })),
          ...deletedDomainObjs.map(d => orgAPI.deleteDomain(d.id))
        ]);
      }

      setOpenEntity(false);
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteEntity = async (id, name) => {
    if (!window.confirm(`Are you sure you want to deactivate the entity "${name}"?`)) return;
    try {
      await orgAPI.deleteEntity(id);
      showToast('Entity deactivated successfully', 'success');
      fetchData();
    } catch (err) {
      console.error(err);
      showToast('Failed to deactivate entity', 'error');
    }
  };

  if (loading) return <LoadingSpinner text="Loading Entities..." />;

  // Quick helper to count domains per entity
  const getDomainCount = (entityId) => {
    return domains.filter(d => d.entity === entityId).length;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Entity Management</Typography>
        <Typography variant="body2" color="text.secondary">Manage multi-tenant organizations and their domains.</Typography>
      </Box>

      <Box className="glass-card" sx={{ p: 3, width: '100%' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
          <Typography variant="h6" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Domain color="primary" /> Entities
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />} 
            onClick={() => {
              setSelectedEntity(null);
              setFormData({ name: '', description: '', is_active: true, domains: [] });
              setOpenEntity(true);
            }}
          >
            New Entity
          </Button>
        </Box>
        
        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Domains</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {entities.map((row) => (
                <TableRow key={row.id}>
                  <TableCell fontWeight={600}>{row.name}</TableCell>
                  <TableCell>
                    <StatusChip status={row.is_active ? 'active' : 'inactive'} />
                  </TableCell>
                  <TableCell>{getDomainCount(row.id)}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => {
                      setSelectedEntity(row);
                      const entDomains = domains.filter(d => d.entity === row.id).map(d => d.name);
                      setFormData({ 
                        name: row.name, 
                        description: row.description, 
                        is_active: row.is_active,
                        domains: entDomains 
                      });
                      setOpenEntity(true);
                    }}>
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteEntity(row.id, row.name)}>
                      <Delete fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* Entity Dialog */}
      <Dialog open={openEntity} onClose={() => setOpenEntity(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedEntity ? 'Edit Entity' : 'Create Entity'}</DialogTitle>
        <DialogContent dividers>
          <TextField
            label="Name"
            fullWidth
            margin="normal"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
          />
          
          <Autocomplete
            multiple
            options={['Full Stack', 'DevOps/Cloud', 'Data Analysis', 'AI/ML', 'Other']}
            value={formData.domains || []}
            onChange={(e, newValue) => setFormData({...formData, domains: newValue})}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => {
                const { key, ...chipProps } = getTagProps({ index });
                return <Chip key={key} variant="outlined" label={option} {...chipProps} />;
              })
            }
            renderInput={(params) => (
              <TextField
                {...params}
                margin="normal"
                label="Domains"
                placeholder="Select Domains"
              />
            )}
          />

          {formData.domains?.includes('Other') && (
            <Box sx={{ display: 'flex', gap: 1, mt: 1, alignItems: 'center' }}>
              <TextField 
                size="small" 
                label="Type Custom Domain" 
                fullWidth 
                id="custom-domain-input"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    document.getElementById('custom-domain-add-btn').click();
                  }
                }}
              />
              <Button 
                id="custom-domain-add-btn"
                variant="outlined"
                onClick={() => {
                  const val = document.getElementById('custom-domain-input').value.trim();
                  if (val) {
                    // Remove 'Other' and add the new custom value
                    const newDomains = formData.domains.filter(d => d !== 'Other');
                    if (!newDomains.includes(val)) newDomains.push(val);
                    setFormData({ ...formData, domains: newDomains });
                    document.getElementById('custom-domain-input').value = '';
                  }
                }}
              >
                Add
              </Button>
            </Box>
          )}

          <FormControlLabel
            control={
              <Switch 
                checked={formData.is_active} 
                onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
              />
            }
            label="Active Status"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEntity(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEntitySubmit} disabled={!formData.name}>
            Save Entity
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
