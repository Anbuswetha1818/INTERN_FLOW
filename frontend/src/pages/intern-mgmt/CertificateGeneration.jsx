import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, TextField, InputAdornment, Chip, Dialog, Select, MenuItem,
  FormControl, InputLabel
} from '@mui/material';
import { Search, CardMembership, QrCode, Download, Send } from '@mui/icons-material';
import { feedbackAPI, certificatesAPI, usersAPI } from '../../services/api';
import { LoadingSpinner, StatCard } from '../../components/common';
import { motion } from 'framer-motion';

export default function CertificateGeneration() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openGen, setOpenGen] = useState(false);
  const [interns, setInterns] = useState([]);
  const [selectedIntern, setSelectedIntern] = useState('');
  const [certType, setCertType] = useState('completion');
  const [taskName, setTaskName] = useState('');

  const fetchCerts = async () => {
    try {
      setLoading(true);
      const res = await feedbackAPI.certificates();
      setCertificates(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchInterns = async () => {
    try {
      const res = await usersAPI.internFullList();
      setInterns(res.data || []);
    } catch (err) {
      console.error('Error fetching interns:', err);
    }
  };

  useEffect(() => {
    fetchCerts();
    fetchInterns();
  }, []);

  const handleGenerate = async () => {
    if (!selectedIntern) {
      alert("Please select an intern.");
      return;
    }
    try {
      let response;
      const payload = { emp_id: selectedIntern };
      
      if (certType === 'completion') {
        response = await certificatesAPI.generateCompletion(payload);
      } else if (certType === 'offer_letter') {
        response = await certificatesAPI.generateOffer(payload);
      } else if (certType === 'task') {
        response = await certificatesAPI.generateTask({ ...payload, task_name: taskName });
      } else if (certType === 'attendance') {
        response = await certificatesAPI.generateAttendance(payload);
      } else if (certType === 'partial') {
        response = await certificatesAPI.generatePartial(payload);
      }
      
      // Download the PDF
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certType}_${selectedIntern}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      alert('Certificate generated successfully!');
      setOpenGen(false);
      // Reset form
      setSelectedIntern('');
      setCertType('completion');
      setTaskName('');
      fetchCerts();
    } catch (err) {
      console.error('Error generating certificate:', err);
      alert('Failed to generate certificate.');
    }
  };

  const filteredCerts = certificates.filter(c => 
    c.user_name?.toLowerCase().includes(search.toLowerCase()) || 
    c.certificate_type?.toLowerCase().includes(search.toLowerCase()) ||
    c.certificate_number?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingSpinner text="Loading Certificates..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Certificates</Typography>
          <Typography variant="body2" color="text.secondary">Generate and manage official intern certificates.</Typography>
        </Box>
        <Button variant="contained" startIcon={<CardMembership />} onClick={() => setOpenGen(true)}>Generate New</Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <StatCard label="Total Generated" value={certificates.length} color="var(--color-primary)" icon={<CardMembership />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Completion Certs" value={certificates.filter(c => c.certificate_type === 'completion').length} color="#22c55e" icon={<Download />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Excellence Awards" value={certificates.filter(c => c.certificate_type === 'excellence').length} color="#f59e0b" icon={<Star />} />
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by ID, name, type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
            }}
            sx={{ minWidth: 300 }}
          />
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Certificate ID</TableCell>
                <TableCell>Intern</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Issue Date</TableCell>
                <TableCell>QR Verified</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCerts.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {row.certificate_number}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{row.user_name || `User ${row.user}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={row.certificate_type.toUpperCase()} 
                      size="small" 
                      color={row.certificate_type === 'excellence' ? 'warning' : 'primary'}
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell>{new Date(row.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {row.qr_code_url ? <QrCode color="success" /> : <Typography variant="caption" color="text.secondary">Pending</Typography>}
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button size="small" variant="outlined" startIcon={<Download />}>PDF</Button>
                      <Button size="small" variant="contained" startIcon={<Send />}>Email</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {filteredCerts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No certificates generated yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <Dialog open={openGen} onClose={() => setOpenGen(false)} maxWidth="sm" fullWidth>
        <Box sx={{ p: 4 }}>
          <Typography variant="h6" fontWeight={700} mb={2} align="center">Generate Certificate</Typography>
          <Typography color="text.secondary" mb={3} align="center">
            Select an intern and certificate type to generate an official document.
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="select-intern-label">Select Intern</InputLabel>
              <Select
                labelId="select-intern-label"
                value={selectedIntern}
                label="Select Intern"
                onChange={(e) => setSelectedIntern(e.target.value)}
              >
                {interns.map((intern) => (
                  <MenuItem key={intern.emp_id} value={intern.emp_id}>
                    {intern.full_name} ({intern.emp_id})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth size="small">
              <InputLabel id="select-cert-type-label">Certificate Type</InputLabel>
              <Select
                labelId="select-cert-type-label"
                value={certType}
                label="Certificate Type"
                onChange={(e) => setCertType(e.target.value)}
              >
                <MenuItem value="completion">Completion Certificate</MenuItem>
                <MenuItem value="offer_letter">Offer Letter</MenuItem>
                <MenuItem value="task">Task Certificate</MenuItem>
                <MenuItem value="attendance">Attendance Certificate</MenuItem>
                <MenuItem value="partial">Partial Completion Certificate</MenuItem>
              </Select>
            </FormControl>

            {certType === 'task' && (
              <TextField
                fullWidth
                size="small"
                label="Task Name"
                placeholder="e.g. Full Stack Project, Django API Task"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            )}
          </Box>

          <Button variant="contained" onClick={handleGenerate} size="large" fullWidth>
            Generate Now
          </Button>
        </Box>
      </Dialog>
    </motion.div>
  );
}

// Missing icon import fallback for Star
function Star(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}
