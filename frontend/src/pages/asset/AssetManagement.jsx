import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, InputAdornment, Dialog,
  DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select,
  MenuItem, CircularProgress, Alert
} from '@mui/material';
import { 
  Add, Search, Devices, QrCodeScanner, Handyman, 
  AssignmentTurnedIn, Edit, Delete, Download 
} from '@mui/icons-material';
import { assetsAPI, usersAPI, orgAPI } from '../../services/api';
import { LoadingSpinner, StatusChip, StatCard } from '../../components/common';
import { motion } from 'framer-motion';

export default function AssetManagement() {
  const [assets, setAssets] = useState([]);
  const [interns, setInterns] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [domains, setDomains] = useState([]);
  const [dialogError, setDialogError] = useState('');
  
  // Search & Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');

  // Dialog States
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    asset_code: '',
    asset_type: 'laptop',
    name: '',
    serial_number: '',
    condition: 'good',
    status: 'available',
    assigned_to: '',
    notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [listRes, countRes, internRes, domRes] = await Promise.all([
        assetsAPI.list(),
        assetsAPI.counts(),
        usersAPI.internFullList(),
        orgAPI.domains()
      ]);
      setAssets(listRes.data || []);
      setCounts(countRes.data || {});
      setInterns(internRes.data || []);
      setDomains(domRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const generateNextAssetCode = () => {
    const codes = assets
      .map(a => a.asset_code)
      .filter(code => code && code.startsWith('LPT'))
      .map(code => {
        const numPart = code.substring(3);
        const num = parseInt(numPart, 10);
        return isNaN(num) ? 0 : num;
      });
    const maxNum = codes.length > 0 ? Math.max(...codes) : 0;
    const nextNum = maxNum + 1;
    const paddedNum = String(nextNum).padStart(4, '0');
    return `LPT${paddedNum}`;
  };

  const handleOpenAdd = () => {
    setSelectedAsset(null);
    setDialogError('');
    const nextCode = generateNextAssetCode();
    setFormData({
      asset_code: nextCode,
      asset_type: 'laptop',
      name: '',
      serial_number: '',
      condition: 'good',
      status: 'available',
      assigned_to: '',
      notes: ''
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (asset) => {
    setSelectedAsset(asset);
    setDialogError('');
    setFormData({
      asset_code: asset.asset_code || '',
      asset_type: asset.asset_type || 'other',
      name: asset.name || '',
      serial_number: asset.serial_number || '',
      condition: asset.condition || 'good',
      status: asset.status || 'available',
      assigned_to: asset.assigned_to || '',
      notes: asset.notes || ''
    });
    setDialogOpen(true);
  };

  const handleOpenDelete = (asset) => {
    setSelectedAsset(asset);
    setDeleteOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name?.trim() || !formData.serial_number?.trim()) {
      setDialogError('Warning: Please fill in both the Asset Brand/Model Name and the Serial Number / Tag before adding the asset.');
      return;
    }
    setDialogError('');
    if (!formData.asset_code) return;
    try {
      setActionLoading(true);
      const payload = {
        ...formData,
        assigned_to: formData.assigned_to || null,
        issue_date: formData.status === 'assigned' && (!selectedAsset || selectedAsset.status !== 'assigned')
          ? new Date().toISOString().slice(0, 10)
          : (selectedAsset ? selectedAsset.issue_date : null)
      };

      if (selectedAsset) {
        await assetsAPI.update(selectedAsset.id, payload);
      } else {
        await assetsAPI.create(payload);
      }
      setDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data ? JSON.stringify(err.response.data) : 'Error saving asset.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    if (!selectedAsset) return;
    try {
      setActionLoading(true);
      await assetsAPI.delete(selectedAsset.id);
      setDeleteOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deleting asset.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Asset Code', 'Type', 'Name', 'Serial Number', 'Condition', 'Status', 'Assigned To', 'Email', 'Phone', 'Domain', 'Issue Date'];
    const rows = filteredAssets.map(a => [
      a.asset_code || '',
      a.asset_type || '',
      a.name || '',
      a.serial_number || '',
      a.condition || '',
      a.status || '',
      a.assigned_to_name || 'Unassigned',
      a.assigned_to_email || '',
      a.assigned_to_phone || '',
      a.assigned_to_domain || '',
      a.issue_date || ''
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assets_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredAssets = assets.filter(a => {
    const matchesSearch =
      a.asset_code?.toLowerCase().includes(search.toLowerCase()) ||
      a.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.serial_number?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_to_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.assigned_to_emp_id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    const matchesDomain = domainFilter === 'all' || a.assigned_to_domain === domainFilter;

    return matchesSearch && matchesStatus && matchesDomain;
  });

  if (loading) return <LoadingSpinner text="Loading Assets..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Asset Management</Typography>
          <Typography variant="body2" color="text.secondary">Track hardware, badges, and resources assigned to interns.</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleOpenAdd}
          sx={{
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            fontWeight: 700
          }}
        >
          Add New Asset
        </Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Total Assets" value={counts.total || 0} color="var(--color-primary)" icon={<Devices />} delay={0.1} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Available" value={counts.available || 0} color="#22c55e" icon={<AssignmentTurnedIn />} delay={0.15} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Assigned" value={counts.assigned || 0} color="#3b82f6" icon={<QrCodeScanner />} delay={0.2} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard label="Damaged / Issued" value={counts.damaged || 0} color="#ef4444" icon={<Handyman />} delay={0.25} />
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Search code, model, or intern..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                }
              }}
              sx={{ minWidth: 260 }}
            />
            
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="status-filter-label">Status Filter</InputLabel>
              <Select
                labelId="status-filter-label"
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="available">Available</MenuItem>
                <MenuItem value="assigned">Assigned</MenuItem>
                <MenuItem value="damaged">Damaged</MenuItem>
                <MenuItem value="lost">Lost</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel id="domain-filter-label">Domain Filter</InputLabel>
              <Select 
                labelId="domain-filter-label"
                value={domainFilter} 
                label="Domain Filter" 
                onChange={(e) => setDomainFilter(e.target.value)}
              >
                <MenuItem value="all">All Domains</MenuItem>
                {domains.map(d => (
                  <MenuItem key={d.id} value={d.name}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button 
              variant="outlined" 
              startIcon={<Download />} 
              onClick={handleExport}
              sx={{
                textTransform: 'none',
                fontWeight: 600,
                borderColor: 'var(--primary-200)',
                color: 'var(--text-secondary)',
                '&:hover': {
                  borderColor: 'var(--primary-500)',
                  background: 'var(--bg-hover)'
                }
              }}
            >
              Export
            </Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ pl: 3, fontWeight: 600 }}>Intern</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Domain</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Asset Number</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell align="right" sx={{ pr: 3, fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAssets.map((row) => (
                <TableRow key={row.id} hover>
                  {/* 1. Intern ID & Name with Avatar */}
                  <TableCell sx={{ py: 1.5, pl: 3 }}>
                    {row.assigned_to_name ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box 
                          sx={{ 
                            width: 36, height: 36, borderRadius: '50%', 
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '0.8rem'
                          }}
                        >
                          {row.assigned_to_name.charAt(0)}
                        </Box>
                        <Box>
                          <Typography fontWeight={700} variant="body2" color="var(--text-primary)">
                            {row.assigned_to_name}
                          </Typography>
                          {row.assigned_to_emp_id && (
                            <Typography variant="caption" sx={{ color: 'var(--text-tertiary)' }}>
                              {row.assigned_to_emp_id}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    ) : (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box 
                          sx={{ 
                            width: 36, height: 36, borderRadius: '50%', 
                            background: 'var(--glass-bg)',
                            border: '1px solid var(--glass-border)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'var(--text-secondary)', fontWeight: 700, fontSize: '0.8rem'
                          }}
                        >
                          —
                        </Box>
                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                          Unassigned / Stock
                        </Typography>
                      </Box>
                    )}
                  </TableCell>

                  {/* 2. Contact */}
                  <TableCell sx={{ py: 1.5 }}>
                    {row.assigned_to_name ? (
                      <Box>
                        <Typography variant="body2" color="var(--text-secondary)">
                          {row.assigned_to_phone || '—'}
                        </Typography>
                        {row.assigned_to_email && (
                          <Typography variant="caption" sx={{ color: 'var(--text-tertiary)' }}>
                            {row.assigned_to_email}
                          </Typography>
                        )}
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">—</Typography>
                    )}
                  </TableCell>

                  {/* 3. Domain */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography variant="body2" fontWeight={500}>
                      {row.assigned_to_domain || '—'}
                    </Typography>
                  </TableCell>

                  {/* 4. Asset Details */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Typography fontWeight={700} variant="body2" color="var(--primary-500)">
                      {row.asset_code}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {row.name} ({row.asset_type?.replace(/_/g, ' ').toUpperCase()})
                    </Typography>
                  </TableCell>

                  {/* 5. Status & Condition */}
                  <TableCell sx={{ py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <StatusChip status={row.status} />
                      {row.condition !== 'good' && (
                        <StatusChip status={row.condition} />
                      )}
                    </Box>
                  </TableCell>

                  {/* 6. Actions */}
                  <TableCell align="right" sx={{ pr: 3, py: 1.5 }}>
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <IconButton size="small" onClick={() => handleOpenEdit(row)} color="primary">
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleOpenDelete(row)} color="error">
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAssets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No assets found matching the search criteria.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      {/* CREATE / EDIT DIALOG */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => !actionLoading && setDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--glass-shadow)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>
          {selectedAsset ? 'Edit Asset Details' : 'Add New Asset'}
        </DialogTitle>
        <DialogContent>
          {dialogError && (
            <Alert severity="warning" sx={{ mt: 1, borderRadius: 'var(--radius-sm)' }}>
              {dialogError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Asset Code (Auto-generated)"
                value={formData.asset_code}
                disabled={true}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Asset Brand/Model Name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                disabled={actionLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                size="small"
                label="Serial Number / Tag"
                value={formData.serial_number}
                onChange={(e) => setFormData(prev => ({ ...prev, serial_number: e.target.value }))}
                disabled={actionLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={actionLoading} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            disabled={!formData.asset_code || actionLoading}
            startIcon={actionLoading && <CircularProgress size={16} color="inherit" />}
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            }}
          >
            {selectedAsset ? 'Update Asset' : 'Add Asset'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* DELETE CONFIRMATION DIALOG */}
      <Dialog 
        open={deleteOpen} 
        onClose={() => !actionLoading && setDeleteOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            background: 'var(--glass-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border)',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--glass-shadow)',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Delete Asset</DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)' }}>
              Are you sure you want to delete asset <strong>{selectedAsset.asset_code}</strong> ({selectedAsset.name})? This action cannot be undone.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setDeleteOpen(false)} disabled={actionLoading} sx={{ color: 'var(--text-secondary)' }}>
            Cancel
          </Button>
          <Button onClick={handleDeleteSubmit} variant="contained" color="error" disabled={actionLoading} sx={{ fontWeight: 700 }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
