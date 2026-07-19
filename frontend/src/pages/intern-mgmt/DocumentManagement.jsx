import { useState, useEffect } from 'react';
import { 
  Box, Typography, Grid, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Button, IconButton, TextField, InputAdornment, Chip
} from '@mui/material';
import { Add, Search, FilterList, FilePresent, VerifiedUser, AccessTime, FileDownload } from '@mui/icons-material';
import { documentsAPI } from '../../services/api';
import { LoadingSpinner, StatusChip, StatCard } from '../../components/common';
import { motion } from 'framer-motion';

export default function DocumentManagement() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await documentsAPI.list();
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleVerify = async (id) => {
    try {
      await documentsAPI.approve(id);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const handleViewFile = async (doc) => {
    try {
      const res = await documentsAPI.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', doc.title || doc.file.split('/').pop());
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
      // Fallback: just open the file URL directly
      if (doc.file) {
        window.open(doc.file, '_blank');
      }
    }
  };

  const filteredDocs = documents.filter(d => 
    d.title?.toLowerCase().includes(search.toLowerCase()) || 
    d.user_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleExport = () => {
    if (filteredDocs.length === 0) {
      alert("No data available to export.");
      return;
    }

    const headers = [
      "Document ID",
      "Intern Name",
      "Employee ID",
      "Document Title",
      "Status",
      "Uploaded At"
    ];

    const rows = filteredDocs.map(d => [
      d.id || '',
      d.user_name || '',
      d.emp_id || '',
      d.title || '',
      (d.status || 'pending').toUpperCase(),
      d.uploaded_at || ''
    ]);

    const csvContent = [
      headers.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `documents_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const pendingCount = documents.filter(d => d.status === 'pending' || !d.status).length;
  const verifiedCount = documents.filter(d => d.status === 'approved').length;

  if (loading) return <LoadingSpinner text="Loading Documents..." />;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Document Verification</Typography>
          <Typography variant="body2" color="text.secondary">Review uploaded intern documents.</Typography>
        </Box>
        <Button variant="outlined" startIcon={<FileDownload />} onClick={handleExport}>Export Report</Button>
      </Box>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid xs={12} sm={4}>
          <StatCard label="Total Documents" value={documents.length} color="var(--color-primary)" icon={<FilePresent />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Pending Verification" value={pendingCount} color="#f59e0b" icon={<AccessTime />} />
        </Grid>
        <Grid xs={12} sm={4}>
          <StatCard label="Verified" value={verifiedCount} color="#22c55e" icon={<VerifiedUser />} />
        </Grid>
      </Grid>

      {/* Main Table */}
      <Box className="glass-card" sx={{ p: 0, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Search by title or user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            slotProps={{
              input: {
                startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>,
              }
            }}
            sx={{ minWidth: 300 }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" startIcon={<FilterList />} onClick={() => alert('Filter options coming soon!')}>Filter</Button>
          </Box>
        </Box>

        <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Document Details</TableCell>
                <TableCell>User</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Uploaded On</TableCell>
                <TableCell>Verification</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocs.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography fontWeight={700} variant="body2">{row.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{row.user_name || `User ${row.user}`}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={row.doc_type ? row.doc_type.toUpperCase() : 'UNKNOWN'} size="small" variant="outlined" />
                  </TableCell>
                  <TableCell>{row.uploaded_at ? new Date(row.uploaded_at).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    {row.status === 'approved' ? (
                      <Chip label="Verified" color="success" size="small" />
                    ) : (
                      <Chip label="Pending" color="warning" size="small" />
                    )}
                  </TableCell>
                  <TableCell align="right">
                    {row.status !== 'approved' && (
                      <Button size="small" variant="contained" color="success" sx={{ mr: 1 }} onClick={() => handleVerify(row.id)}>
                        Verify
                      </Button>
                    )}
                    <Button size="small" variant="outlined" onClick={() => handleViewFile(row)}>View File</Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredDocs.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Typography color="text.secondary">No documents found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </motion.div>
  );
}
