import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Chip, Grid, TextField, InputAdornment, Alert,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, FormControl,
  InputLabel, Select, MenuItem, CircularProgress
} from '@mui/material';
import { 
  Search as SearchIcon, LaptopMac as LaptopIcon, CheckCircle, 
  Build, SwapHoriz as SwapIcon, ReportProblem as DamageIcon,
  CloudUpload as UploadIcon, Download as DownloadIcon
} from '@mui/icons-material';
import { assetsAPI, orgAPI } from '../../services/api';
import { LoadingSpinner, StatCard } from '../../components/common';
import { motion } from 'framer-motion';

export default function AssignedLaptops() {
  const [laptops, setLaptops] = useState([]);
  const [availableLaptops, setAvailableLaptops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [conditionFilter, setConditionFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [domains, setDomains] = useState([]);

  // Dialog States
  const [swapOpen, setSwapOpen] = useState(false);
  const [damageOpen, setDamageOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState(null);
  
  // Form States
  const [newAssetId, setNewAssetId] = useState('');
  const [damageDesc, setDamageDesc] = useState('Laptop reported as damaged by staff.');
  const [damageType, setDamageType] = useState('Physical / Body Damage');
  const [damageImage, setDamageImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDamageImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Toast/Feedback state
  const [feedback, setFeedback] = useState({ open: false, message: '', severity: 'success' });

  const showFeedback = (message, severity = 'success') => {
    setFeedback({ open: true, message, severity });
    // Auto-close after 4 seconds
    setTimeout(() => setFeedback(prev => ({ ...prev, open: false })), 4000);
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const [res, domRes] = await Promise.all([
        assetsAPI.list(),
        orgAPI.domains()
      ]);
      
      // Filter for laptops and status is assigned
      const assignedLaptops = res.data.filter(a => 
        a.asset_type && 
        a.asset_type.toLowerCase().includes('laptop') && 
        a.status === 'assigned'
      );
      setLaptops(assignedLaptops);

      // Filter for available laptops for swap dropdown
      const availLaptops = res.data.filter(a =>
        a.asset_type &&
        a.asset_type.toLowerCase().includes('laptop') &&
        a.status === 'available'
      );
      setAvailableLaptops(availLaptops);
      setDomains(domRes.data || []);
    } catch (err) {
      console.error('Failed to fetch laptops', err);
      showFeedback('Failed to load assets from server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const headers = ['Intern Name', 'Intern ID', 'Email', 'Phone', 'Domain', 'Asset Code', 'Laptop Name', 'Condition'];
    const rows = filteredLaptops.map(l => [
      l.assigned_to_name || '',
      l.assigned_to_emp_id || '',
      l.assigned_to_email || '',
      l.assigned_to_phone || '',
      l.assigned_to_domain || '',
      l.asset_code || '',
      l.name || '',
      l.condition || ''
    ]);
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.map(val => `"${val.toString().replace(/"/g, '""')}"`).join(','))].join('\n');
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `assigned_laptops_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenSwap = (asset) => {
    setSelectedAsset(asset);
    setNewAssetId('');
    setSwapOpen(true);
  };

  const handleOpenDamage = (asset) => {
    setSelectedAsset(asset);
    setDamageDesc('Laptop reported as damaged by staff.');
    setDamageType('Physical / Body Damage');
    setDamageImage(null);
    setImagePreview(null);
    setDamageOpen(true);
  };

  const handleSwapSubmit = async () => {
    if (!newAssetId || !selectedAsset) return;
    try {
      setActionLoading(true);
      // 1. Unassign current laptop
      await assetsAPI.update(selectedAsset.id, { 
        assigned_to: null, 
        status: 'available' 
      });

      // 2. Assign the new laptop to the same intern
      await assetsAPI.update(newAssetId, { 
        assigned_to: selectedAsset.assigned_to, 
        status: 'assigned' 
      });

      showFeedback(`Successfully swapped laptop with ${availableLaptops.find(l => l.id === newAssetId)?.asset_code}`, 'success');
      setSwapOpen(false);
      fetchData(); // Reload list
    } catch (err) {
      console.error(err);
      showFeedback('Failed to swap laptops.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDamageSubmit = async () => {
    if (!selectedAsset) return;
    try {
      setActionLoading(true);
      
      const formData = new FormData();
      formData.append('asset', selectedAsset.id);
      formData.append('description', damageDesc);
      formData.append('issue_type', 'damage');
      formData.append('damage_type', damageType);
      formData.append('status', 'reported');
      if (damageImage) {
        formData.append('damage_image', damageImage);
      }
      
      // 1. Report issue in database
      await assetsAPI.reportIssue(formData);

      // 2. Update asset status to damaged & unassign from user
      await assetsAPI.update(selectedAsset.id, {
        status: 'damaged',
        condition: 'damaged',
        assigned_to: null
      });

      showFeedback(`Laptop ${selectedAsset.asset_code} has been reported as damaged and unassigned.`, 'success');
      setDamageOpen(false);
      fetchData(); // Reload list
    } catch (err) {
      console.error(err);
      showFeedback('Failed to report laptop damage.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredLaptops = laptops.filter(laptop => {
    // 1. Search text filter
    const matchesSearch = 
      laptop.asset_code?.toLowerCase().includes(search.toLowerCase()) ||
      laptop.assigned_to_name?.toLowerCase().includes(search.toLowerCase()) ||
      laptop.name?.toLowerCase().includes(search.toLowerCase()) ||
      laptop.assigned_to_emp_id?.toLowerCase().includes(search.toLowerCase()) ||
      laptop.assigned_to_domain?.toLowerCase().includes(search.toLowerCase());
      
    // 2. Condition filter
    let matchesCondition = true;
    const isGood = laptop.condition?.toLowerCase() === 'new' || laptop.condition?.toLowerCase() === 'good';
    if (conditionFilter === 'good') {
      matchesCondition = isGood;
    } else if (conditionFilter === 'maintenance') {
      matchesCondition = !isGood;
    }
    
    // 3. Domain filter
    let matchesDomain = true;
    if (domainFilter !== 'all') {
      matchesDomain = laptop.assigned_to_domain === domainFilter;
    }
    
    return matchesSearch && matchesCondition && matchesDomain;
  });

  const totalAssigned = laptops.length;
  const goodCondition = laptops.filter(l => l.condition?.toLowerCase() === 'new' || l.condition?.toLowerCase() === 'good').length;
  const needAttention = totalAssigned - goodCondition;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Assigned Laptops</Typography>
          <Typography variant="body2" color="text.secondary">
            Manage and track laptop assets currently assigned to active interns.
          </Typography>
        </Box>
      </Box>

      {/* Summary Stat Cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 3, mb: 4, width: '100%' }}>
        <StatCard 
          label="Total Assigned Laptops" 
          value={totalAssigned} 
          color="var(--color-primary)" 
          icon={<LaptopIcon sx={{ fontSize: 24 }} />} 
          delay={0.05} 
        />
        <StatCard 
          label="Good Condition" 
          value={goodCondition} 
          color="var(--success-500)" 
          icon={<CheckCircle sx={{ fontSize: 24 }} />} 
          delay={0.1} 
        />
        <StatCard 
          label="Needs Maintenance" 
          value={needAttention} 
          color="var(--warning-500)" 
          icon={<Build sx={{ fontSize: 24 }} />} 
          delay={0.15} 
        />
      </Box>

      {feedback.open && (
        <Alert severity={feedback.severity} sx={{ mb: 3, borderRadius: 'var(--radius-md)' }}>
          {feedback.message}
        </Alert>
      )}

      {loading ? (
        <LoadingSpinner text="Loading laptops..." />
      ) : (
        <>
          {/* List Area */}
          <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
            {/* Toolbar */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextField
                  size="small"
                  placeholder="Search code, domain, or intern..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment>,
                    }
                  }}
                  sx={{ minWidth: 300 }}
                />
                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel id="condition-filter-label">Condition Filter</InputLabel>
                  <Select
                    labelId="condition-filter-label"
                    value={conditionFilter}
                    label="Condition Filter"
                    onChange={(e) => setConditionFilter(e.target.value)}
                  >
                    <MenuItem value="all">All Conditions</MenuItem>
                    <MenuItem value="good">Good Condition ({laptops.filter(l => l.condition?.toLowerCase() === 'new' || l.condition?.toLowerCase() === 'good').length})</MenuItem>
                    <MenuItem value="maintenance">Needs Maintenance ({laptops.filter(l => !(l.condition?.toLowerCase() === 'new' || l.condition?.toLowerCase() === 'good')).length})</MenuItem>
                  </Select>
                </FormControl>
                <FormControl size="small" sx={{ minWidth: 150 }}>
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
                  startIcon={<DownloadIcon />} 
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

            {filteredLaptops.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="info">No assigned laptops found matching search criteria.</Alert>
              </Box>
            ) : (
              <TableContainer component={Paper} sx={{ background: 'transparent', boxShadow: 'none' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, pl: 3 }}>Intern</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Contact</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Domain</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Asset Number</TableCell>
                      <TableCell sx={{ fontWeight: 600, textAlign: 'center', pr: 3 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredLaptops.map((laptop) => (
                      <TableRow key={laptop.id} hover>
                        {/* 1. Intern ID & Name with Avatar */}
                        <TableCell sx={{ py: 1.5, pl: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                            <Box 
                              sx={{ 
                                width: 36, height: 36, borderRadius: '50%', 
                                background: 'var(--gradient-primary)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 700, fontSize: '0.8rem'
                              }}
                            >
                              {laptop.assigned_to_name?.charAt(0) || 'I'}
                            </Box>
                            <Box>
                              <Typography fontWeight={700} variant="body2" color="var(--text-primary)">
                                {laptop.assigned_to_name || '—'}
                              </Typography>
                              {laptop.assigned_to_emp_id && (
                                <Typography variant="caption" sx={{ color: 'var(--text-tertiary)' }}>
                                  {laptop.assigned_to_emp_id}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        </TableCell>
                        
                        {/* 2. Contact */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" color="var(--text-secondary)">
                            {laptop.assigned_to_phone || '—'}
                          </Typography>
                          {laptop.assigned_to_email && (
                            <Typography variant="caption" sx={{ color: 'var(--text-tertiary)' }}>
                              {laptop.assigned_to_email}
                            </Typography>
                          )}
                        </TableCell>
                        
                        {/* 3. Domain */}
                        <TableCell sx={{ py: 1.5, fontWeight: 500 }}>
                          {laptop.assigned_to_domain || '—'}
                        </TableCell>

                        {/* 4. Asset Number */}
                        <TableCell sx={{ py: 1.5 }}>
                          <Typography variant="body2" fontWeight={700} color="var(--primary-500)">
                            {laptop.asset_code}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {laptop.name}
                          </Typography>
                        </TableCell>

                        {/* 5. Actions */}
                        <TableCell sx={{ py: 1.5, textAlign: 'center', pr: 3 }}>
                          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                            <Button 
                              variant="outlined" 
                              size="small" 
                              startIcon={<SwapIcon />}
                              onClick={() => handleOpenSwap(laptop)}
                              sx={{ 
                                color: 'var(--primary-500)', 
                                borderColor: 'var(--primary-200)',
                                textTransform: 'none',
                                fontWeight: 600,
                                '&:hover': {
                                  borderColor: 'var(--primary-500)',
                                  background: 'var(--bg-hover)',
                                }
                              }}
                            >
                              Change Asset
                            </Button>
                            
                            <Button 
                              variant="outlined" 
                              size="small" 
                              color="error"
                              startIcon={<DamageIcon />}
                              onClick={() => handleOpenDamage(laptop)}
                              sx={{ 
                                textTransform: 'none',
                                fontWeight: 600,
                              }}
                            >
                              Damage
                            </Button>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
        </>
      )}

      {/* SWAP ASSET DIALOG */}
      <Dialog 
        open={swapOpen} 
        onClose={() => !actionLoading && setSwapOpen(false)}
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
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Change Asset</DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Select a replacement laptop for <strong>{selectedAsset.assigned_to_name}</strong>. Currently using <strong>{selectedAsset.asset_code}</strong>.
            </Typography>
          )}
          
          <FormControl fullWidth size="small">
            <InputLabel id="swap-laptop-select-label">Available Laptops</InputLabel>
            <Select
              labelId="swap-laptop-select-label"
              value={newAssetId}
              label="Available Laptops"
              onChange={(e) => setNewAssetId(e.target.value)}
              disabled={actionLoading}
            >
              {availableLaptops.length === 0 ? (
                <MenuItem disabled>No available laptops in inventory</MenuItem>
              ) : (
                availableLaptops.map(l => (
                  <MenuItem key={l.id} value={l.id}>
                    {l.asset_code} ({l.name})
                  </MenuItem>
                ))
              )}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setSwapOpen(false)} 
            disabled={actionLoading}
            sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSwapSubmit} 
            variant="contained"
            disabled={!newAssetId || actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <SwapIcon />}
            sx={{ 
              fontWeight: 700,
              background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            }}
          >
            Confirm Swap
          </Button>
        </DialogActions>
      </Dialog>

      {/* REPORT DAMAGE DIALOG */}
      <Dialog 
        open={damageOpen} 
        onClose={() => !actionLoading && setDamageOpen(false)}
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
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)' }}>Report Asset Damage</DialogTitle>
        <DialogContent>
          {selectedAsset && (
            <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 3 }}>
              Are you sure you want to mark laptop <strong>{selectedAsset.asset_code}</strong> ({selectedAsset.name}) as damaged? This will unassign it from {selectedAsset.assigned_to_name}.
            </Typography>
          )}
          
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            label="Damage Details / Notes"
            value={damageDesc}
            onChange={(e) => setDamageDesc(e.target.value)}
            disabled={actionLoading}
            sx={{ mb: 2 }}
          />

          <FormControl fullWidth size="small" sx={{ mb: 2 }}>
            <InputLabel id="damage-type-select-label">Type of Damage</InputLabel>
            <Select
              labelId="damage-type-select-label"
              value={damageType}
              label="Type of Damage"
              onChange={(e) => setDamageType(e.target.value)}
              disabled={actionLoading}
            >
              <MenuItem value="Physical / Body Damage">Physical / Body Damage</MenuItem>
              <MenuItem value="Screen Damage">Screen Damage</MenuItem>
              <MenuItem value="Keyboard / Touchpad Issue">Keyboard / Touchpad Issue</MenuItem>
              <MenuItem value="Liquid Spillage / Water Damage">Liquid Spillage / Water Damage</MenuItem>
              <MenuItem value="Battery / Port / Charging Issue">Battery / Port / Charging Issue</MenuItem>
              <MenuItem value="Software / Operating System Crash">Software / Operating System Crash</MenuItem>
              <MenuItem value="Other Damage">Other Damage</MenuItem>
            </Select>
          </FormControl>

          <Box>
            <Typography variant="caption" sx={{ display: 'block', mb: 1, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Upload Damage Image
            </Typography>
            <Button
              variant="outlined"
              component="label"
              fullWidth
              startIcon={<UploadIcon />}
              sx={{
                borderStyle: 'dashed',
                borderWidth: 2,
                borderColor: damageImage ? 'var(--success-500)' : 'var(--primary-200)',
                color: damageImage ? 'var(--success-600)' : 'var(--text-secondary)',
                py: 1.5,
                borderRadius: 'var(--radius-md)',
                textTransform: 'none',
                fontWeight: 600,
                '&:hover': {
                  borderColor: 'var(--primary-500)',
                  backgroundColor: 'var(--bg-hover)'
                }
              }}
            >
              {damageImage ? 'Change Image' : 'Select Image'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={handleImageChange}
                disabled={actionLoading}
              />
            </Button>
            {damageImage && (
              <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'var(--text-tertiary)' }}>
                Selected: {damageImage.name}
              </Typography>
            )}
            {imagePreview && (
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={imagePreview} 
                  alt="Damage Preview" 
                  style={{ 
                    maxWidth: '100%', 
                    maxHeight: 120, 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--glass-border)',
                    objectFit: 'contain'
                  }} 
                />
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setDamageOpen(false)} 
            disabled={actionLoading}
            sx={{ color: 'var(--text-secondary)', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDamageSubmit} 
            variant="contained"
            color="error"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={16} color="inherit" /> : <DamageIcon />}
            sx={{ fontWeight: 700 }}
          >
            Report Damage
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
