import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Grid, TextField, InputAdornment,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, Checkbox, Tooltip, Menu, Chip, TablePagination, Switch
} from '@mui/material';
import { Search, FilterList, Download, Upload, Visibility, Edit, Delete, Add, TrendingUp, MoreVert, Check, Close, Description } from '@mui/icons-material';
import { usersAPI, authAPI, orgAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import PromotionModal from '../../components/common/PromotionModal';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

function InternCard({ row, readOnly, userRole, handleOpenEdit, setDeleteDialog, setDetailsDialog }) {
  return (
    <Box 
      className="glass-card"
      sx={{ 
        p: 2, 
        mb: 2, 
        display: 'flex',
        flexDirection: 'column',
        gap: 1.5,
        border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.3))',
        background: 'var(--glass-bg, rgba(255, 255, 255, 0.6))',
        boxShadow: 'var(--glass-shadow, 0 4px 12px rgba(0,0,0,0.05))',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box 
            sx={{ 
              width: 36, height: 36, borderRadius: '50%', 
              background: 'var(--gradient-primary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white', fontWeight: 700, fontSize: '0.8rem'
            }}
          >
            {row.full_name?.charAt(0) || 'I'}
          </Box>
          <Box>
            <Typography fontWeight={700} variant="subtitle1" sx={{ lineHeight: 1.2 }}>{row.full_name}</Typography>
            <Typography variant="caption" color="text.secondary">{row.emp_id}</Typography>
          </Box>
        </Box>
        {!readOnly && (userRole === 'admin' || userRole === 'superadmin') && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}>
              <Edit fontSize="small" color="primary" />
            </IconButton>
            <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, empId: row.emp_id, name: row.full_name }); }}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Domain</Typography>
          <Typography variant="body2" fontWeight={600}>{row.domain_name || 'N/A'}</Typography>
          <Typography variant="caption" color="text.secondary">{row.scheme?.toUpperCase()} Scheme</Typography>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
          <Box sx={{ mt: 0.5 }}>
            <StatusChip status={row.user_status} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" display="block">Contact</Typography>
          <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>{row.email}</Typography>
          <Typography variant="caption" color="text.secondary">{row.phone || 'No phone'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" display="block">Timeline</Typography>
          <Typography variant="body2" fontWeight={500}>From: {row.start_date || '—'}</Typography>
          <Typography variant="body2" fontWeight={500}>To: {row.end_date || '—'}</Typography>
        </Grid>
      </Grid>

      <Button 
        variant="contained" 
        color="primary"
        size="small" 
        onClick={() => setDetailsDialog({ open: true, intern: row })}
        sx={{ 
          textTransform: 'none', 
          fontWeight: 600, 
          borderRadius: '6px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          }
        }}
      >
        Details
      </Button>
    </Box>
  );
}

export default function InternLists({ readOnly = false, isCombined = false }) {
  const { user } = useAuth();
  const location = useLocation();
  const [interns, setInterns] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('all');
  
  const initialTab = location.state?.internTab !== undefined ? location.state.internTab : 1;
  const [tabValue, setTabValue] = useState(initialTab);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  useEffect(() => {
    if (location.state?.internTab !== undefined) {
      setTabValue(location.state.internTab);
    }
  }, [location.state]);

  // Modals state
  const [openModal, setOpenModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentEmpId, setCurrentEmpId] = useState('');
  const [formData, setFormData] = useState({
    emp_id: '', full_name: '', username: '', password: '', email: '', role: 'intern', domain_id: '', custom_permissions: {}
  });
  const [deleteDialog, setDeleteDialog] = useState({ open: false, empId: '', name: '' });
  const [promotionDialog, setPromotionDialog] = useState({ open: false, intern: null });
  const [detailsDialog, setDetailsDialog] = useState({ open: false, intern: null });
  const activeIntern = detailsDialog.intern ? interns.find(i => i.emp_id === detailsDialog.intern.emp_id) : null;

  // Bulk Selection
  const [selected, setSelected] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [importing, setImporting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [internRes, domRes] = await Promise.all([
        usersAPI.interns(),
        orgAPI.domains()
      ]);
      setInterns(internRes.data);
      setDomains(domRes.data);
      setSelected([]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleToggleField = async (empId, fieldName, currentValue) => {
    try {
      const nextValue = !currentValue;
      // Optimistically update the UI state
      setInterns(prev => prev.map(i => i.emp_id === empId ? { ...i, [fieldName]: nextValue } : i));
      
      // Send API update
      await usersAPI.updateUser(empId, { [fieldName]: nextValue });
    } catch (err) {
      console.error(err);
      // Revert UI state on error
      setInterns(prev => prev.map(i => i.emp_id === empId ? { ...i, [fieldName]: currentValue } : i));
      alert('Failed to update verification status.');
    }
  };

  const handleOpenAdd = () => {
    setIsEdit(false);
    setFormData({ emp_id: '', full_name: '', username: '', password: '', email: '', role: 'intern', domain_id: '', custom_permissions: {} });
    setOpenModal(true);
  };

  const handleOpenEdit = (intern) => {
    setIsEdit(true);
    setCurrentEmpId(intern.emp_id);
    setFormData({
      emp_id: intern.emp_id || '',
      full_name: intern.full_name || '',
      username: intern.username || '',
      password: '',
      email: intern.email || '',
      role: 'intern',
      domain_id: intern.domain || '',
      custom_permissions: intern.custom_permissions || {}
    });
    setOpenModal(true);
  };

  const handleSubmit = async () => {
    try {
      const payload = { ...formData, domain: formData.domain_id || null };
      delete payload.domain_id;
      if (isEdit) {
        await usersAPI.updateUser(currentEmpId, payload);
      } else {
        await authAPI.register(payload);
      }
      setOpenModal(false);
      fetchData(); 
    } catch (err) {
      console.error(err);
      const msg = err.response?.data ? JSON.stringify(err.response.data) : 'Error saving intern.';
      alert('Error: ' + msg);
    }
  };

  const handleDelete = async () => {
    try {
      await usersAPI.deleteUser(deleteDialog.empId);
      setDeleteDialog({ open: false, empId: '', name: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deleting intern.');
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setSelected([]); // Clear selection when switching tabs
  };

  // Checkbox handlers
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelecteds = filteredInterns.map((n) => n.emp_id);
      setSelected(newSelecteds);
      return;
    }
    setSelected([]);
  };

  const handleClick = (event, id) => {
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.length === 0) return;
    try {
      setLoading(true);
      await Promise.all(selected.map(id => usersAPI.updateUser(id, { user_status: bulkAction })));
      setSelected([]);
      setBulkAction('');
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error updating interns.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await usersAPI.bulkImport(formData);
      alert(`Import complete! Imported: ${res.data.imported}, Duplicates: ${res.data.duplicates}, Errors: ${res.data.errors}`);
      fetchData();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Failed to import users.');
    } finally {
      setImporting(false);
      e.target.value = ''; // Reset input
    }
  };

  const handleExport = () => {
    if (filteredInterns.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Employee ID",
      "Full Name",
      "Email",
      "Phone",
      "Domain",
      "Scheme",
      "Start Date",
      "End Date",
      "Status"
    ];

    const rows = filteredInterns.map(i => [
      i.emp_id || '',
      i.full_name || '',
      i.email || '',
      i.phone || '',
      i.domain_name || 'N/A',
      i.scheme ? i.scheme.toUpperCase() : 'FREE',
      i.start_date || '—',
      i.end_date || '—',
      (i.user_status || '').toUpperCase()
    ]);

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `interns_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Filter
  const filteredInterns = interns.filter(i => {
    const matchesSearch = 
      i.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      i.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
      i.domain_name?.toLowerCase().includes(search.toLowerCase());
      
    if (!matchesSearch) return false;
    
    const matchesDomain = domainFilter === 'all' || i.domain === domainFilter;
    if (!matchesDomain) return false;
    
    switch (tabValue) {
      case 0: return i.user_status !== 'yettojoin'; 
      case 1: return ['active', 'inprogress'].includes(i.user_status);
      case 2: return ['onleave', 'discontinued'].includes(i.user_status);
      case 3: return i.user_status === 'yettojoin';
      case 4: return i.user_status === 'completed';
      case 5: return i.user_status === 'onleave';
      case 6: return i.user_status === 'discontinued';
      default: return true;
    }
  });

  if (loading) return <LoadingSpinner text="Loading Interns..." />;

  const headCellSx = {
    backgroundColor: '#ffffff !important',
    color: 'text.primary',
    zIndex: 10,
    position: 'sticky',
    top: 0,
    borderTop: 'none',
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {!isCombined && (
        <div className="page-head">
          <div>
            <h1 className="page-title">{readOnly ? 'Intern Directory' : 'Intern Management'}</h1>
            <p className="page-sub">{readOnly ? 'View all interns and their details across all domains.' : 'View and manage the complete intern lifecycle.'}</p>
          </div>
        </div>
      )}

      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>


        {/* Toolbar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' }, 
          p: 3, 
          flexDirection: { xs: 'column', md: 'row' }, 
          gap: 2 
        }}>
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            flexWrap: 'wrap', 
            flex: 1, 
            width: '100%' 
          }}>
            <TextField
              size="small"
              placeholder="Search interns by name, ID, domain..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
                }
              }}
              sx={{ 
                flex: { xs: '1 1 100%', sm: '1 1 200px' }, 
                width: { xs: '100%', sm: 'auto' } 
              }}
            />
            <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 150px' }, minWidth: { xs: '0', sm: 150 } }}>
              <InputLabel>Status Filter</InputLabel>
              <Select value={tabValue} label="Status Filter" onChange={(e) => setTabValue(e.target.value)}>
                <MenuItem value={0}>All ({interns.filter(i => i.user_status !== 'yettojoin').length})</MenuItem>
                <MenuItem value={1}>Active ({interns.filter(i => ['active', 'inprogress'].includes(i.user_status)).length})</MenuItem>
                <MenuItem value={3}>Yet to Join ({interns.filter(i => i.user_status === 'yettojoin').length})</MenuItem>
                <MenuItem value={4}>Completed ({interns.filter(i => i.user_status === 'completed').length})</MenuItem>
                <MenuItem value={5}>On Leave ({interns.filter(i => i.user_status === 'onleave').length})</MenuItem>
                <MenuItem value={6}>Discontinued ({interns.filter(i => i.user_status === 'discontinued').length})</MenuItem>
                <MenuItem value={2}>Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 150px' }, minWidth: { xs: '0', sm: 150 } }}>
              <InputLabel>Domain Filter</InputLabel>
              <Select 
                value={domainFilter} 
                label="Domain Filter" 
                onChange={(e) => setDomainFilter(e.target.value)}
              >
                <MenuItem value="all">All Domains</MenuItem>
                {domains.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!readOnly && selected.length > 0 && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: 'primary.50', p: 0.5, borderRadius: 1, px: 2, flex: { xs: '1 1 100%', sm: 'none' } }}>
                <Typography variant="body2" fontWeight={600} color="primary">{selected.length} selected</Typography>
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Bulk Action</InputLabel>
                  <Select value={bulkAction} label="Bulk Action" onChange={(e) => setBulkAction(e.target.value)}>
                    <MenuItem value="active">Mark Active</MenuItem>
                    <MenuItem value="completed">Mark Completed</MenuItem>
                    <MenuItem value="discontinued">Mark Discontinued</MenuItem>
                  </Select>
                </FormControl>
                <Button variant="contained" size="small" disabled={!bulkAction} onClick={handleBulkAction}>Apply</Button>
              </Box>
            )}
          </Box>
          <Box sx={{ 
            display: 'flex', 
            gap: 1.5, 
            flexWrap: 'wrap', 
            width: { xs: '100%', md: 'auto' } 
          }}>
            <Button 
              variant="outlined" 
              startIcon={<Upload />} 
              onClick={() => document.getElementById('intern-csv-upload').click()}
              disabled={importing}
              sx={{ flex: { xs: 1, sm: 'none' }, whiteSpace: 'nowrap' }}
            >
              {importing ? 'Importing...' : 'Import CSV'}
            </Button>
            <input type="file" id="intern-csv-upload" hidden accept=".csv" onChange={handleFileChange} />
            
            <Button 
              variant="outlined" 
              startIcon={<Download />} 
              onClick={handleExport}
              sx={{ flex: { xs: 1, sm: 'none' }, whiteSpace: 'nowrap' }}
            >
              Export
            </Button>
          </Box>
        </Box>
        
        {/* Desktop Table View */}
        <TableContainer sx={!isCombined ? { maxHeight: 'calc(100vh - 280px)', overflow: 'auto', pt: 0, mt: 0, display: { xs: 'none', md: 'block' } } : { pt: 0, mt: 0, display: { xs: 'none', md: 'block' } }}>
          <Table stickyHeader={!isCombined} sx={{ mt: 0, pt: 0, borderCollapse: 'collapse' }}>
            <TableHead>
              <TableRow>
                <TableCell sx={headCellSx}>Intern</TableCell>
                <TableCell sx={headCellSx}>Contact</TableCell>
                <TableCell sx={headCellSx}>Domain</TableCell>
                <TableCell sx={headCellSx}>Timeline</TableCell>
                <TableCell sx={headCellSx}>Status</TableCell>
                {(user?.role === 'sme' || user?.role === 'admin' || user?.role === 'superadmin') && (
                  <TableCell sx={headCellSx} align="right">Actions</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInterns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length > 0 ? 
                filteredInterns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => {
                const isItemSelected = selected.indexOf(row.emp_id) !== -1;
                return (
                  <TableRow key={row.emp_id} hover selected={isItemSelected}>

                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box 
                          sx={{ 
                            width: 36, height: 36, borderRadius: '50%', 
                            background: 'var(--gradient-primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: 'white', fontWeight: 700, fontSize: '0.8rem'
                          }}
                        >
                          {row.full_name?.charAt(0) || 'I'}
                        </Box>
                        <Box>
                          <Typography fontWeight={700} variant="body2">{row.full_name}</Typography>
                          <Typography variant="caption" color="text.secondary">{row.emp_id}</Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.email}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.phone || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{row.domain_name || 'N/A'}</Typography>
                      <Typography variant="caption" color="text.secondary">{row.scheme?.toUpperCase()} Scheme</Typography>
                    </TableCell>
                     <TableCell>
                      <Typography variant="body2">From: {row.start_date || '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">To: {row.end_date || '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={row.user_status} />
                    </TableCell>
                    {(user?.role === 'sme' || user?.role === 'admin' || user?.role === 'superadmin') && (
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                          <Button 
                            variant="contained" 
                            color="primary"
                            size="small" 
                            onClick={() => setDetailsDialog({ open: true, intern: row })}
                            sx={{ 
                              textTransform: 'none', 
                              fontWeight: 600, 
                              borderRadius: '6px',
                              boxShadow: 'none',
                              '&:hover': {
                                boxShadow: 'none',
                              }
                            }}
                          >
                            Details
                          </Button>
                          {(user?.role === 'admin' || user?.role === 'superadmin') && (
                            <>
                              <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenEdit(row); }}>
                                <Edit fontSize="small" color="primary" />
                              </IconButton>
                              <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); setDeleteDialog({ open: true, empId: row.emp_id, name: row.full_name }); }}>
                                <Delete fontSize="small" />
                              </IconButton>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                );
              }) : (
                <TableRow>
                  <TableCell colSpan={(user?.role === 'sme' || user?.role === 'admin' || user?.role === 'superadmin') ? 6 : 5} align="center" sx={{ py: 6 }}>
                    <Box sx={{ color: 'text.secondary', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                      <Search sx={{ fontSize: 40, opacity: 0.5 }} />
                      <Typography>No interns found matching your criteria</Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' }, p: 2 }}>
          {filteredInterns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).length > 0 ? 
            filteredInterns.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
              <InternCard 
                key={row.emp_id} 
                row={row} 
                readOnly={readOnly}
                userRole={user?.role}
                handleOpenEdit={handleOpenEdit}
                setDeleteDialog={setDeleteDialog}
                setDetailsDialog={setDetailsDialog}
              />
            )) : (
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <Typography color="text.secondary">No interns found matching your criteria</Typography>
              </Box>
            )}
        </Box>

        <TablePagination
          sx={{ '& .MuiTablePagination-toolbar': { pr: { xs: 2, sm: 10 } } }}
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredInterns.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      {/* Add/Edit Modal */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEdit ? 'Edit Intern' : 'Add New Intern'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            {!isEdit && (
              <>
                <TextField 
                  label="Employee ID (e.g. VDI001)" 
                  value={formData.emp_id} 
                  onChange={e => setFormData({...formData, emp_id: e.target.value})} 
                  fullWidth 
                  autoComplete="off"
                />
                <TextField 
                  label="Username" 
                  value={formData.username} 
                  onChange={e => setFormData({...formData, username: e.target.value})} 
                  fullWidth 
                  autoComplete="off"
                />
              </>
            )}
            <TextField 
              label="Full Name" 
              value={formData.full_name} 
              onChange={e => setFormData({...formData, full_name: e.target.value})} 
              fullWidth 
              autoComplete="off"
            />
            <TextField 
              label="Email" 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              fullWidth 
              autoComplete="off"
            />
            <FormControl fullWidth>
              <InputLabel>Domain</InputLabel>
              <Select
                value={formData.domain_id || ''}
                label="Domain"
                onChange={e => setFormData({...formData, domain_id: e.target.value})}
              >
                {domains.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            {!isEdit && (
              <TextField 
                label="Password" 
                type="password"
                value={formData.password} 
                onChange={e => setFormData({...formData, password: e.target.value})} 
                fullWidth 
                autoComplete="new-password"
              />
            )}
            
            <Box sx={{ mt: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 2, bgcolor: 'background.default' }}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Intern Feature Access</Typography>
              <Grid container spacing={2}>
                {[
                  { key: 'intern_feature_performance', label: 'Performance Analytics' },
                  { key: 'intern_feature_ai_assistant', label: 'AI Assistant' },
                  { key: 'intern_feature_ai_interview', label: 'AI Mock Interview' },
                  { key: 'intern_feature_resume_builder', label: 'Resume Builder' },
                  { key: 'intern_feature_exit_summary', label: 'Exit Summary' },
                  { key: 'intern_feature_learning', label: 'Learning Path' },
                ].map((perm) => (
                  <Grid xs={12} sm={6} size={{ xs: 12, sm: 6 }} key={perm.key}>
                    <Paper variant="outlined" sx={{ p: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: 'background.paper' }}>
                      <Typography variant="body2" fontWeight={500}>{perm.label}</Typography>
                      <Switch
                        size="small"
                        checked={formData.custom_permissions[perm.key] !== false}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_permissions: {
                            ...formData.custom_permissions,
                            [perm.key]: e.target.checked
                          }
                        })}
                        color="primary"
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenModal(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSubmit}>
            {isEdit ? 'Save Changes' : 'Create Intern'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, empId: '', name: '' })}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to deactivate and remove intern <b>{deleteDialog.name}</b>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, empId: '', name: '' })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Promotion Modal */}
      <PromotionModal 
        open={promotionDialog.open} 
        intern={promotionDialog.intern} 
        onClose={() => setPromotionDialog({ open: false, intern: null })} 
        onSuccess={() => {
          setPromotionDialog({ open: false, intern: null });
          fetchData();
        }}
      />

      {/* More Details Dialog */}
      <Dialog 
        open={detailsDialog.open} 
        onClose={() => setDetailsDialog({ open: false, intern: null })}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: 'var(--glass-bg, rgba(255, 255, 255, 0.8))',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.3))',
            borderRadius: '16px',
            boxShadow: 'var(--glass-shadow, 0 8px 32px rgba(0,0,0,0.1))',
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)', pb: 1 }}>
          More Details of the Intern
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.3))' }}>
          {activeIntern && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, py: 1 }}>
              {/* Header profile info */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box 
                  sx={{ 
                    width: 54, height: 54, borderRadius: '50%', 
                    background: 'var(--gradient-primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 800, fontSize: '1.2rem'
                  }}
                >
                  {activeIntern.full_name?.charAt(0) || 'I'}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={700}>{activeIntern.full_name}</Typography>
                  <Typography variant="body2" color="text.secondary">ID: {activeIntern.emp_id}</Typography>
                </Box>
              </Box>

              {/* Document verification checklist */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  Documents Verification Checklist
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: '12px', 
                    bgcolor: 'rgba(255, 255, 255, 0.02)', 
                    borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.1))',
                    overflow: 'hidden'
                  }}
                >
                  {[
                    { label: 'Aadhar Card', key: 'doc_aadhar_submitted' },
                    { label: 'Resume / CV', key: 'doc_resume_submitted' },
                    { label: 'College ID', key: 'doc_college_id_submitted' },
                    { label: 'Passport Photo', key: 'doc_photo_submitted' },
                  ].map((item, idx) => {
                    const isSubmitted = activeIntern[item.key];
                    return (
                      <Box 
                        key={item.key} 
                        sx={{ 
                          display: 'flex', 
                          justifyContent: 'space-between', 
                          alignItems: 'center', 
                          p: 2,
                          borderBottom: idx < 3 ? '1px solid' : 'none',
                          borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.05))',
                          '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.01)' }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Description sx={{ color: isSubmitted ? 'var(--success, #2e7d32)' : 'var(--text-tertiary)', fontSize: 20 }} />
                          <Typography variant="body2" fontWeight={600} color="var(--text-primary)">
                            {item.label}
                          </Typography>
                        </Box>
                        <Chip 
                          label={isSubmitted ? "Verified" : "Pending"}
                          sx={{ 
                            cursor: 'default', 
                            fontWeight: 700,
                            borderRadius: '8px',
                            fontSize: '0.75rem',
                            height: '28px',
                            backgroundColor: isSubmitted ? 'rgba(46, 125, 50, 0.15)' : 'rgba(211, 47, 47, 0.15)',
                            color: isSubmitted ? '#2e7d32 !important' : '#d32f2f !important',
                            border: '1px solid',
                            borderColor: isSubmitted ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.3)',
                          }}
                        />
                      </Box>
                    );
                  })}
                </Paper>
              </Box>

              {/* Payment Section */}
              <Box>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                  Payment Details
                </Typography>
                <Paper 
                  variant="outlined" 
                  sx={{ 
                    borderRadius: '12px', 
                    p: 2,
                    bgcolor: 'rgba(255, 255, 255, 0.02)', 
                    borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.1))',
                  }}
                >
                  <Grid container spacing={2} sx={{ alignItems: "center" }}>
                    <Grid item xs={12} sm={7}>
                      <Box 
                        sx={{ 
                          display: 'flex', 
                          flexDirection: 'column', 
                          bgcolor: 'rgba(255, 255, 255, 0.03)', 
                          border: '1px solid var(--glass-border, rgba(255, 255, 255, 0.08))',
                          borderRadius: '8px',
                          p: '8px 16px',
                        }}
                      >
                        <Typography variant="caption" sx={{ color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600, mb: 0.25 }}>
                          Total Amount
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: 'primary.main', fontSize: '1.05rem' }}>
                          ₹{(activeIntern.payment_amount || 0).toLocaleString()}
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={12} sm={5} sx={{ display: 'flex', justifyContent: { xs: 'flex-start', sm: 'flex-end' } }}>
                      <Chip 
                        label={activeIntern.payment_completed ? "Paid" : "Unpaid"}
                        sx={{ 
                          cursor: 'default', 
                          fontWeight: 700,
                          borderRadius: '8px',
                          fontSize: '0.75rem',
                          height: '36px',
                          width: '100%',
                          backgroundColor: activeIntern.payment_completed ? 'rgba(46, 125, 50, 0.15)' : 'rgba(211, 47, 47, 0.15)',
                          color: activeIntern.payment_completed ? '#2e7d32 !important' : '#d32f2f !important',
                          border: '1px solid',
                          borderColor: activeIntern.payment_completed ? 'rgba(46, 125, 50, 0.3)' : 'rgba(211, 47, 47, 0.3)',
                        }}
                      />
                    </Grid>
                  </Grid>
                </Paper>
              </Box>

              {/* Row actions inside details popup */}
              {!readOnly && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                    Actions
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button 
                      variant="outlined" 
                      color="primary"
                      startIcon={<TrendingUp />} 
                      onClick={() => {
                        setDetailsDialog({ open: false, intern: null });
                        setPromotionDialog({ open: true, intern: activeIntern });
                      }}
                      fullWidth
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      Promote
                    </Button>
                    <Button 
                      variant="outlined" 
                      color="error"
                      startIcon={<Delete />} 
                      onClick={() => {
                        setDetailsDialog({ open: false, intern: null });
                        setDeleteDialog({ open: true, empId: activeIntern.emp_id, name: activeIntern.full_name });
                      }}
                      fullWidth
                      sx={{ textTransform: 'none', fontWeight: 600, borderRadius: 2 }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailsDialog({ open: false, intern: null })} sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
