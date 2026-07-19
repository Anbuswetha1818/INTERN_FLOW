import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Card, CardContent, IconButton, Button, Chip, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, CircularProgress } from '@mui/material';
import { Description, CloudUpload, Download, MoreVert } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { documentsAPI } from '../../services/api';

const DOC_TYPES = [
  { value: 'offer_letter', label: 'Offer Letter' },
  { value: 'nda', label: 'NDA' },
  { value: 'resume', label: 'Resume / CV' },
  { value: 'id_proof', label: 'ID Proof' },
  { value: 'education_cert', label: 'Educational Certificate' },
  { value: 'photo', label: 'Photo' },
  { value: 'other', label: 'Other' },
];

export default function DocumentView() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    doc_type: 'other',
    file: null
  });

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await documentsAPI.list();
      setDocs(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleUploadClick = () => setUploadOpen(true);
  
  const handleUploadClose = () => {
    setUploadOpen(false);
    setFormData({ title: '', doc_type: 'other', file: null });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFormData(prev => ({ ...prev, file: e.target.files[0], title: prev.title || e.target.files[0].name }));
    }
  };

  const handleUploadSubmit = async () => {
    if (!formData.file) return alert('Please select a file to upload.');
    
    setUploading(true);
    try {
      const data = new FormData();
      data.append('file', formData.file);
      data.append('title', formData.title || formData.file.name);
      data.append('doc_type', formData.doc_type);
      
      await documentsAPI.upload(data);
      handleUploadClose();
      fetchDocs();
    } catch (err) {
      console.error(err);
      alert('Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc) => {
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

  const formatSize = (bytes) => {
    if (!bytes) return 'Unknown Size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>My Documents</Typography>
          <Typography variant="body2" color="text.secondary">
            View and manage your official documents.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<CloudUpload />} onClick={handleUploadClick}>Upload Document</Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
      ) : docs.length === 0 ? (
        <Box sx={{ textAlign: 'center', p: 4, color: 'text.secondary' }}>
          <Typography>No documents found. Upload your first document!</Typography>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {docs.map(doc => (
            <Grid xs={12} sm={6} md={4} key={doc.id}>
              <Card className="glass-card" sx={{ height: '100%', position: 'relative' }}>
                <IconButton size="small" sx={{ position: 'absolute', top: 8, right: 8 }}>
                  <MoreVert fontSize="small" />
                </IconButton>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'primary.light', color: 'primary.main' }}>
                      <Description />
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ maxWidth: 180 }} title={doc.title}>
                        {doc.title || doc.doc_type}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3 }}>
                    <Chip 
                      label={doc.status ? doc.status.toUpperCase() : 'PENDING'} 
                      size="small" 
                      color={doc.status === 'approved' ? 'success' : doc.status === 'rejected' ? 'error' : 'warning'} 
                    />
                    <IconButton size="small" color="primary" onClick={() => handleDownload(doc)}>
                      <Download fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onClose={handleUploadClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Document</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            <Grid xs={12}>
              <TextField 
                select 
                fullWidth 
                label="Document Type" 
                value={formData.doc_type}
                onChange={(e) => setFormData({ ...formData, doc_type: e.target.value })}
              >
                {DOC_TYPES.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid xs={12}>
              <TextField 
                fullWidth 
                label="Document Title" 
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="E.g., ID Card Scan"
              />
            </Grid>
            <Grid xs={12}>
              <Button variant="outlined" component="label" fullWidth sx={{ py: 2 }}>
                {formData.file ? formData.file.name : "Choose File"}
                <input type="file" hidden onChange={handleFileChange} />
              </Button>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose} color="inherit">Cancel</Button>
          <Button onClick={handleUploadSubmit} variant="contained" disabled={!formData.file || uploading}>
            {uploading ? <CircularProgress size={24} /> : "Upload"}
          </Button>
        </DialogActions>
      </Dialog>
    </motion.div>
  );
}
