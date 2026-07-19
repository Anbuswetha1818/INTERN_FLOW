import { useState } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, List, ListItem, ListItemText, IconButton, MenuItem } from '@mui/material';
import { motion } from 'framer-motion';
import { Add, Delete, Save } from '@mui/icons-material';

export default function Forms() {
  const [formTitle, setFormTitle] = useState('New Feedback Form');
  const [fields, setFields] = useState([{ id: 1, label: 'Question 1', type: 'text' }]);

  const addField = () => {
    setFields([...fields, { id: Date.now(), label: `Question ${fields.length + 1}`, type: 'text' }]);
  };

  const removeField = (id) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const updateField = (id, key, value) => {
    setFields(fields.map(f => f.id === id ? { ...f, [key]: value } : f));
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>Form Builder</Typography>
          <Typography variant="body2" color="text.secondary">
            Create custom forms for feedback, surveys, and evaluations.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Save />}>Save Form</Button>
      </Box>

      <Grid container spacing={4}>
        <Grid xs={12} md={8}>
          <Paper className="glass-card" sx={{ p: 4 }}>
            <TextField 
              fullWidth 
              label="Form Title" 
              value={formTitle} 
              onChange={(e) => setFormTitle(e.target.value)} 
              sx={{ mb: 4 }}
            />
            
            <Typography variant="h6" fontWeight={700} mb={2}>Fields</Typography>
            <List>
              {fields.map((field, index) => (
                <ListItem key={field.id} sx={{ bgcolor: 'rgba(0,0,0,0.02)', mb: 2, borderRadius: 2, border: '1px solid var(--border-subtle)' }}>
                  <Grid container spacing={2} sx={{ alignItems: "center" }}>
                    <Grid xs={12} sm={6}>
                      <TextField 
                        fullWidth 
                        size="small" 
                        label="Field Label" 
                        value={field.label} 
                        onChange={(e) => updateField(field.id, 'label', e.target.value)}
                      />
                    </Grid>
                    <Grid xs={10} sm={5}>
                      <TextField 
                        select 
                        fullWidth 
                        size="small" 
                        label="Field Type" 
                        value={field.type} 
                        onChange={(e) => updateField(field.id, 'type', e.target.value)}
                      >
                        <MenuItem value="text">Short Text</MenuItem>
                        <MenuItem value="textarea">Long Text</MenuItem>
                        <MenuItem value="rating">Rating (1-5)</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid xs={2} sm={1} sx={{ textAlign: 'right' }}>
                      <IconButton color="error" onClick={() => removeField(field.id)}>
                        <Delete />
                      </IconButton>
                    </Grid>
                  </Grid>
                </ListItem>
              ))}
            </List>
            
            <Button variant="outlined" startIcon={<Add />} onClick={addField} sx={{ mt: 2 }}>
              Add Field
            </Button>
          </Paper>
        </Grid>
        
        <Grid xs={12} md={4}>
          <Paper className="glass-card" sx={{ p: 4, bgcolor: 'primary.light', color: 'primary.main' }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Preview</Typography>
            <Typography variant="body2" mb={2}>
              This is a simplified builder. In the future, this will show a live preview of the generated form.
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 2, color: 'text.primary' }}>
              <Typography variant="subtitle2" fontWeight={700} mb={2}>{formTitle}</Typography>
              {fields.map(f => (
                <Box key={f.id} sx={{ mb: 1 }}>
                  <Typography variant="caption" color="text.secondary">{f.label} ({f.type})</Typography>
                </Box>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
