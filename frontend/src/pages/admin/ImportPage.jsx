import { useState } from 'react';
import { 
  Box, Typography, Paper, Grid, Button, Stepper, Step, StepLabel, LinearProgress, Alert, Chip
} from '@mui/material';
import { CloudUpload, TableView, CheckCircle, WarningAmber } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { usersAPI } from '../../services/api';

const REQUIRED_HEADERS = ['email', 'full_name', 'role'];

export default function ImportPage() {
  const [activeStep, setActiveStep] = useState(0);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [fileHeaders, setFileHeaders] = useState([]);
  const [validationError, setValidationError] = useState('');

  const handleFileDrop = (e) => {
    e.preventDefault();
    setValidationError('');
    const droppedFile = e.dataTransfer?.files[0] || e.target?.files[0];
    
    if (droppedFile && droppedFile.name.endsWith('.csv')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        const firstLine = text.split('\n')[0];
        if (firstLine) {
          const headers = firstLine.split(',').map(h => h.trim().toLowerCase().replace(/["']/g, ''));
          setFileHeaders(headers);
          
          const missing = REQUIRED_HEADERS.filter(req => !headers.includes(req));
          if (missing.length > 0) {
            setValidationError(`Missing required columns: ${missing.join(', ')}`);
          } else {
            setFile(droppedFile);
            setActiveStep(1);
          }
        } else {
          setValidationError("File appears to be empty.");
        }
      };
      reader.readAsText(droppedFile);
    } else {
      setValidationError("Please upload a valid CSV file.");
    }
  };

  const performUpload = async () => {
    setUploading(true);
    setProgress(30); // fake progress before API returns
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const res = await usersAPI.bulkImport(formData);
      setProgress(100);
      setResults(res.data);
      setActiveStep(2);
    } catch (err) {
      console.error(err);
      setValidationError(err.response?.data?.error || 'Failed to import users.');
      setActiveStep(0);
    } finally {
      setUploading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={800}>Bulk Import</Typography>
        <Typography variant="body2" color="text.secondary">Import users, interns, or assets from CSV spreadsheet.</Typography>
      </Box>

      <Box className="glass-card" sx={{ p: 4, maxWidth: 800, mx: 'auto' }}>
        <Stepper activeStep={activeStep} sx={{ mb: 6 }}>
          <Step><StepLabel>Upload CSV</StepLabel></Step>
          <Step><StepLabel>Map & Validate</StepLabel></Step>
          <Step><StepLabel>Import Results</StepLabel></Step>
        </Stepper>

        {activeStep === 0 && (
          <>
            {validationError && (
              <Alert severity="error" sx={{ mb: 3 }} icon={<WarningAmber />}>
                {validationError}
              </Alert>
            )}
            <Box 
              onDragOver={(e) => e.preventDefault()} 
              onDrop={handleFileDrop}
              sx={{ 
                border: '2px dashed', borderColor: validationError ? 'error.main' : 'divider', borderRadius: 4, 
                p: 8, textAlign: 'center', cursor: 'pointer',
                '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' }
              }}
              onClick={() => document.getElementById('csv-upload').click()}
            >
              <CloudUpload sx={{ fontSize: 64, color: validationError ? 'error.main' : 'text.secondary', mb: 2 }} />
              <Typography variant="h6" fontWeight={700}>Drag and drop CSV here</Typography>
              <Typography color="text.secondary" mb={2}>or click to browse</Typography>
              <Button variant="contained">Select File</Button>
              <input type="file" id="csv-upload" hidden accept=".csv" onChange={handleFileDrop} />
            </Box>
            <Box sx={{ mt: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" mb={1}>Required Format:</Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {REQUIRED_HEADERS.map(h => <Chip key={h} label={h} size="small" />)}
              </Box>
            </Box>
          </>
        )}

        {activeStep === 1 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <TableView sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography variant="h6" fontWeight={700}>File Ready: {file?.name}</Typography>
            <Typography color="text.secondary" mb={3}>Click below to begin validation and data import.</Typography>
            
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 4 }}>
              <Typography variant="body2" sx={{ width: '100%' }} color="text.secondary">Detected Columns:</Typography>
              {fileHeaders.map((h, i) => (
                <Chip key={i} label={h} size="small" color={REQUIRED_HEADERS.includes(h) ? "success" : "default"} variant="outlined" />
              ))}
            </Box>

            {uploading ? (
              <Box sx={{ mt: 2 }}>
                <LinearProgress variant="determinate" value={progress} sx={{ height: 10, borderRadius: 5, mb: 1 }} />
                <Typography variant="body2">Processing records... {progress}%</Typography>
              </Box>
            ) : (
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                <Button variant="outlined" onClick={() => {setFile(null); setActiveStep(0); setValidationError('');}}>Cancel</Button>
                <Button variant="contained" onClick={performUpload}>Start Import</Button>
              </Box>
            )}
          </Box>
        )}

        {activeStep === 2 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <CheckCircle color="success" sx={{ fontSize: 64, mb: 2 }} />
            <Typography variant="h5" fontWeight={700} mb={1}>Import Completed Successfully</Typography>
            
            <Grid container spacing={2} sx={{ my: 4, maxWidth: 400, mx: 'auto' }}>
              <Grid xs={4}>
                <Typography variant="h4" color="success.main" fontWeight={800}>{results?.imported}</Typography>
                <Typography variant="body2" color="text.secondary">Imported</Typography>
              </Grid>
              <Grid xs={4}>
                <Typography variant="h4" color="warning.main" fontWeight={800}>{results?.duplicates}</Typography>
                <Typography variant="body2" color="text.secondary">Duplicates</Typography>
              </Grid>
              <Grid xs={4}>
                <Typography variant="h4" color="error.main" fontWeight={800}>{results?.errors}</Typography>
                <Typography variant="body2" color="text.secondary">Errors</Typography>
              </Grid>
            </Grid>

            <Button variant="outlined" onClick={() => {
              setActiveStep(0); setFile(null); setResults(null); setFileHeaders([]); setValidationError('');
            }}>
              Import Another File
            </Button>
          </Box>
        )}
      </Box>
    </motion.div>
  );
}
