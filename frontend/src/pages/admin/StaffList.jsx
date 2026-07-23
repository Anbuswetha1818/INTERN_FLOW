import { useState, useEffect } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, Chip, TextField, InputAdornment,
  MenuItem, Select, FormControl, InputLabel, Collapse, Grid,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { Add, Edit, Delete, Search, AdminPanelSettings, KeyboardArrowDown, KeyboardArrowUp } from '@mui/icons-material';
import { usersAPI, authAPI, orgAPI } from '../../services/api';
import { LoadingSpinner, StatusChip } from '../../components/common';
import { motion } from 'framer-motion';
import { CSVLink } from 'react-csv';
import { Download, Upload } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

function StaffRow({ row, getRoleColor, handleOpenEdit, setDeleteDialog, userRole }) {
  let canEditRow = false;
  if (userRole === 'superadmin') {
    canEditRow = row.role === 'admin';
  } else if (userRole === 'admin') {
    canEditRow = row.role !== 'superadmin' && row.role !== 'admin';
  }
  const [openDetails, setOpenDetails] = useState(false);

  return (
    <>
      <TableRow hover>
        <TableCell>
          <Typography fontWeight={700}>{row.full_name}</Typography>
          <Typography variant="caption" color="text.secondary">{row.emp_id}</Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2">{row.email}</Typography>
          <Typography variant="caption" color="text.secondary">{row.phone || 'No phone'}</Typography>
        </TableCell>
        <TableCell>
          <Chip 
            label={row.role?.toUpperCase()} 
            size="small" 
            color={getRoleColor(row.role)} 
            icon={row.role === 'superadmin' ? <AdminPanelSettings fontSize="small" /> : undefined}
            variant={row.role === 'superadmin' ? 'filled' : 'outlined'}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2">{row.domain_name || 'N/A'}</Typography>
        </TableCell>
        <TableCell>
          <StatusChip status={row.user_status} />
        </TableCell>
        <TableCell align="right">
          {canEditRow && (
            <>
              <IconButton size="small" onClick={() => handleOpenEdit(row)}>
                <Edit fontSize="small" />
              </IconButton>
              <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, empId: row.emp_id, name: row.full_name })}>
                <Delete fontSize="small" />
              </IconButton>
            </>
          )}
        </TableCell>
        <TableCell>
          <Button 
            variant="contained" 
            color="primary"
            size="small" 
            onClick={() => setOpenDetails(true)}
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
            More details
          </Button>
        </TableCell>
      </TableRow>

      {/* More Details Dialog */}
      <Dialog 
        open={openDetails} 
        onClose={() => setOpenDetails(false)}
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
          More Details of the Staff
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.3))' }}>
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
                {row.full_name?.charAt(0) || 'S'}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>{row.full_name}</Typography>
                <Typography variant="body2" color="text.secondary">ID: {row.emp_id}</Typography>
              </Box>
            </Box>

            {/* Additional details list */}
            <Paper 
              variant="outlined" 
              sx={{ 
                borderRadius: '12px', 
                bgcolor: 'rgba(0, 0, 0, 0.02)', 
                borderColor: 'var(--glass-border, rgba(0, 0, 0, 0.08))',
                overflow: 'hidden'
              }}
            >
              {[
                { label: 'Username', value: row.username },
                { label: 'Entity', value: row.entity_name },
                { label: 'Shift Timing', value: row.shift_timing || 'Standard' },
                { label: 'Gender', value: row.gender ? row.gender.charAt(0).toUpperCase() + row.gender.slice(1) : '' },
                { label: 'Date of Birth', value: row.date_of_birth },
                { label: 'Aadhar Number', value: row.aadhar_number },
                { label: 'Start Date', value: row.start_date },
                { label: 'End Date', value: row.end_date },
              ].map((item, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 1.5,
                    px: 2,
                    borderBottom: idx < 7 ? '1px solid' : 'none',
                    borderColor: 'var(--glass-border, rgba(0, 0, 0, 0.08))',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                  }}
                >
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="var(--text-primary)">
                    {item.value || '—'}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)} sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

function StaffCard({ row, getRoleColor, handleOpenEdit, setDeleteDialog, userRole }) {
  let canEditRow = false;
  if (userRole === 'superadmin') {
    canEditRow = row.role === 'admin';
  } else if (userRole === 'admin') {
    canEditRow = row.role !== 'superadmin' && row.role !== 'admin';
  }
  const [openDetails, setOpenDetails] = useState(false);

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
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.2 }}>
            {row.full_name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {row.emp_id}
          </Typography>
        </Box>
        {canEditRow && (
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton size="small" onClick={() => handleOpenEdit(row)}>
              <Edit fontSize="small" />
            </IconButton>
            <IconButton size="small" color="error" onClick={() => setDeleteDialog({ open: true, empId: row.emp_id, name: row.full_name })}>
              <Delete fontSize="small" />
            </IconButton>
          </Box>
        )}
      </Box>

      <Grid container spacing={2}>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Role</Typography>
          <Box sx={{ mt: 0.5 }}>
            <Chip 
              label={row.role?.toUpperCase()} 
              size="small" 
              color={getRoleColor(row.role)} 
              icon={row.role === 'superadmin' ? <AdminPanelSettings fontSize="small" /> : undefined}
              variant={row.role === 'superadmin' ? 'filled' : 'outlined'}
            />
          </Box>
        </Grid>
        <Grid item xs={6}>
          <Typography variant="caption" color="text.secondary" display="block">Status</Typography>
          <Box sx={{ mt: 0.5 }}>
            <StatusChip status={row.user_status} />
          </Box>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" display="block">Domain</Typography>
          <Typography variant="body2" fontWeight={500}>{row.domain_name || 'N/A'}</Typography>
        </Grid>
        <Grid item xs={12}>
          <Typography variant="caption" color="text.secondary" display="block">Contact</Typography>
          <Typography variant="body2" fontWeight={500} sx={{ wordBreak: 'break-all' }}>{row.email}</Typography>
          <Typography variant="caption" color="text.secondary">{row.phone || 'No phone'}</Typography>
        </Grid>
      </Grid>

      <Button 
        variant="contained" 
        color="primary"
        size="small" 
        onClick={() => setOpenDetails(true)}
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
        More details
      </Button>

      {/* More Details Dialog */}
      <Dialog 
        open={openDetails} 
        onClose={() => setOpenDetails(false)}
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
            width: { xs: '90%', sm: 'auto' },
            mx: { xs: 'auto', sm: 'inherit' }
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: 'var(--text-primary)', pb: 1 }}>
          More Details of the Staff
        </DialogTitle>
        <DialogContent dividers sx={{ borderColor: 'var(--glass-border, rgba(255, 255, 255, 0.3))' }}>
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
                {row.full_name?.charAt(0) || 'S'}
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={700}>{row.full_name}</Typography>
                <Typography variant="body2" color="text.secondary">ID: {row.emp_id}</Typography>
              </Box>
            </Box>

            {/* Additional details list */}
            <Paper 
              variant="outlined" 
              sx={{ 
                borderRadius: '12px', 
                bgcolor: 'rgba(0, 0, 0, 0.02)', 
                borderColor: 'var(--glass-border, rgba(0, 0, 0, 0.08))',
                overflow: 'hidden'
              }}
            >
              {[
                { label: 'Username', value: row.username },
                { label: 'Entity', value: row.entity_name },
                { label: 'Shift Timing', value: row.shift_timing || 'Standard' },
                { label: 'Gender', value: row.gender ? row.gender.charAt(0).toUpperCase() + row.gender.slice(1) : '' },
                { label: 'Date of Birth', value: row.date_of_birth },
                { label: 'Aadhar Number', value: row.aadhar_number },
                { label: 'Start Date', value: row.start_date },
                { label: 'End Date', value: row.end_date },
              ].map((item, idx) => (
                <Box 
                  key={idx} 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    p: 1.5,
                    px: 2,
                    borderBottom: idx < 7 ? '1px solid' : 'none',
                    borderColor: 'var(--glass-border, rgba(0, 0, 0, 0.08))',
                    '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.02)' }
                  }}
                >
                  <Typography variant="body2" fontWeight={500} color="text.secondary">
                    {item.label}
                  </Typography>
                  <Typography variant="body2" fontWeight={600} color="var(--text-primary)">
                    {item.value || '—'}
                  </Typography>
                </Box>
              ))}
            </Paper>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetails(false)} sx={{ fontWeight: 600 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default function StaffList() {
  const { user } = useAuth();
  const canEdit = user?.role === 'superadmin' || user?.role === 'admin';
  const navigate = useNavigate();
  const [staff, setStaff] = useState([]);
  const [domains, setDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filter state
  const [roleFilter, setRoleFilter] = useState('all');
  const [domainFilter, setDomainFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals state
  const [deleteDialog, setDeleteDialog] = useState({ open: false, empId: '', name: '' });
  const [importing, setImporting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [staffRes, domRes] = await Promise.all([
        usersAPI.staffList(),
        orgAPI.domains()
      ]);
      setStaff(staffRes.data);
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

  const handleOpenAdd = () => {
    navigate('/admin/staff/new');
  };

  const handleOpenEdit = (user) => {
    navigate(`/admin/staff/edit/${user.emp_id}`);
  };

  const handleDelete = async () => {
    try {
      await usersAPI.deleteUser(deleteDialog.empId);
      setDeleteDialog({ open: false, empId: '', name: '' });
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Error deleting staff.');
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

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
                          s.emp_id?.toLowerCase().includes(search.toLowerCase()) ||
                          s.domain_name?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    const matchesDomain = domainFilter === 'all' || String(s.domain) === String(domainFilter);
    const matchesStatus = statusFilter === 'all' || s.user_status === statusFilter;
    return matchesSearch && matchesRole && matchesDomain && matchesStatus;
  });

  if (loading) return <LoadingSpinner text="Loading Staff..." />;

  const getRoleColor = (role) => {
    switch (role) {
      case 'superadmin': return 'error';
      case 'manager': return 'secondary';
      case 'sme': return 'primary';
      case 'mentor': return 'info';
      default: return 'default';
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="page-head">
        <div>
          <h1 className="page-title">Staff Management</h1>
          <p className="page-sub">Manage managers, leads, mentors and administrative staff.</p>
        </div>
      </div>

      <Box className="glass-card" sx={{ p: 3 }}>
        {/* Toolbar */}
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: { xs: 'stretch', md: 'center' }, 
          mb: 3, 
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
              placeholder="Search staff..."
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
            
            <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 120px' }, minWidth: { xs: '0', sm: 120 } }}>
              <InputLabel id="role-label">Role</InputLabel>
              <Select
                labelId="role-label"
                value={roleFilter}
                label="Role"
                onChange={e => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
                <MenuItem value="mentor">Mentor</MenuItem>
                <MenuItem value="sme">SME</MenuItem>
                <MenuItem value="manager">Manager</MenuItem>
                <MenuItem value="superadmin">Super Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: { xs: '1 1 calc(50% - 6px)', sm: '0 0 120px' }, minWidth: { xs: '0', sm: 120 } }}>
              <InputLabel id="domain-label">Domain</InputLabel>
              <Select
                labelId="domain-label"
                value={domainFilter}
                label="Domain"
                onChange={e => setDomainFilter(e.target.value)}
              >
                <MenuItem value="all">All Domains</MenuItem>
                {domains.map(d => (
                  <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ flex: { xs: '1 1 100%', sm: '0 0 120px' }, minWidth: { xs: '0', sm: 120 } }}>
              <InputLabel id="status-label">Status</InputLabel>
              <Select
                labelId="status-label"
                value={statusFilter}
                label="Status"
                onChange={e => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {canEdit && (
            <Box sx={{ 
              display: 'flex', 
              gap: 1.5, 
              flexWrap: 'wrap', 
              width: { xs: '100%', md: 'auto' } 
            }}>
              <Button 
                variant="outlined" 
                size="small"
                startIcon={<Upload fontSize="small" />} 
                onClick={() => document.getElementById('staff-csv-upload').click()}
                disabled={importing}
                sx={{ 
                  flex: { xs: 1, sm: 'none' }, 
                  whiteSpace: 'nowrap' 
                }}
              >
                {importing ? 'Importing...' : 'Import CSV'}
              </Button>
              <input type="file" id="staff-csv-upload" hidden accept=".csv" onChange={handleFileChange} />
              
              <CSVLink 
                data={filteredStaff} 
                filename="staff_list.csv" 
                style={{ 
                  textDecoration: 'none', 
                  flex: 1,
                  display: 'inline-block'
                }}
              >
                <Button 
                  size="small" 
                  variant="outlined" 
                  startIcon={<Download fontSize="small" />} 
                  sx={{ 
                    width: '100%', 
                    whiteSpace: 'nowrap' 
                  }}
                >
                  Export CSV
                </Button>
              </CSVLink>
              
              <Button 
                size="small" 
                variant="contained" 
                startIcon={<Add fontSize="small" />} 
                onClick={handleOpenAdd} 
                sx={{ 
                  background: 'var(--gradient-primary)', 
                  flex: { xs: '1 1 100%', sm: 'none' }, 
                  whiteSpace: 'nowrap' 
                }}
              >
                Add Staff
              </Button>
            </Box>
          )}
        </Box>
        
        {/* Desktop Table View */}
        <TableContainer component={Paper} elevation={0} sx={{ background: 'transparent', display: { xs: 'none', md: 'block' } }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Employee</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Domain</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStaff.length > 0 ? filteredStaff.map((row) => (
                <StaffRow 
                  key={row.id || row.emp_id} 
                  row={row} 
                  getRoleColor={getRoleColor} 
                  handleOpenEdit={handleOpenEdit} 
                  setDeleteDialog={setDeleteDialog} 
                  userRole={user?.role}
                />
              )) : (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    <Typography color="text.secondary">No staff found matching "{search}"</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Mobile Card View */}
        <Box sx={{ display: { xs: 'block', md: 'none' } }}>
          {filteredStaff.length > 0 ? filteredStaff.map((row) => (
            <StaffCard 
              key={row.id || row.emp_id} 
              row={row} 
              getRoleColor={getRoleColor} 
              handleOpenEdit={handleOpenEdit} 
              setDeleteDialog={setDeleteDialog} 
              userRole={user?.role}
            />
          )) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No staff found matching "{search}"</Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Delete Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, empId: '', name: '' })}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to deactivate and remove <b>{deleteDialog.name}</b>?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, empId: '', name: '' })}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>Delete</Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
