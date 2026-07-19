import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Avatar, 
  Button, 
  Grid, 
  TextField, 
  CircularProgress, 
  IconButton,
  Chip,
  Divider,
  Card,
  CardContent,
  Tooltip,
  MenuItem,
  FormControl,
  Select,
  Stack
} from '@mui/material';
import { 
  PhotoCamera, 
  Edit, 
  Save, 
  Cancel,
  FolderOpen,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { authAPI, usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function UserProfile() {
  const { fetchMe } = useAuth(); // To refresh context after photo upload
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Edit states
  const [isEditingPersonal, setIsEditingPersonal] = useState(false);
  const [isEditingAcademic, setIsEditingAcademic] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Form states
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    gender: '',
    date_of_birth: '',
    aadhar_number: ''
  });
  
  const [academicFormData, setAcademicFormData] = useState({
    registration_number: '',
    college_name: '',
    college_location: '',
    degree: '',
    college_department: '',
    year_of_passing: ''
  });



  // Validation state
  const [errors, setErrors] = useState({});

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await authAPI.me();
      setProfile(res.data);
      
      setFormData({
        full_name: res.data.full_name || res.data.username || '',
        phone: res.data.phone || '',
        gender: res.data.gender || '',
        date_of_birth: res.data.date_of_birth || '',
        aadhar_number: res.data.aadhar_number || ''
      });
      
      setAcademicFormData({
        registration_number: res.data.registration_number || '',
        college_name: res.data.college_name || '',
        college_location: res.data.college_location || '',
        degree: res.data.degree || '',
        college_department: res.data.college_department || '',
        year_of_passing: res.data.year_of_passing || ''
      });
      

    } catch (err) {
      console.error('Failed to fetch profile', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handlePhoneChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // only digits
    if (val.length <= 10) {
      setFormData({ ...formData, phone: val });
      if (val.length > 0 && val.length < 10) {
        setErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.phone;
          return next;
        });
      }
    }
  };

  const handleAadharChange = (e) => {
    const val = e.target.value.replace(/\D/g, ''); // only digits
    if (val.length <= 12) {
      setFormData({ ...formData, aadhar_number: val });
      if (val.length > 0 && val.length < 12) {
        setErrors(prev => ({ ...prev, aadhar_number: 'Aadhar must be exactly 12 digits.' }));
      } else {
        setErrors(prev => {
          const next = { ...prev };
          delete next.aadhar_number;
          return next;
        });
      }
    }
  };

  const handleSavePersonal = async () => {
    if (formData.phone && formData.phone.length !== 10) {
      setErrors(prev => ({ ...prev, phone: 'Phone number must be exactly 10 digits.' }));
      return;
    }
    if (formData.aadhar_number && formData.aadhar_number.length !== 12) {
      setErrors(prev => ({ ...prev, aadhar_number: 'Aadhar must be exactly 12 digits.' }));
      return;
    }

    try {
      if (profile && profile.emp_id) {
        const payload = { ...formData };
        if (!payload.date_of_birth) payload.date_of_birth = null;
        if (!payload.gender) payload.gender = '';
        
        await usersAPI.updatePersonal(profile.emp_id, payload);
        await fetchProfile();
        if (fetchMe) await fetchMe(); // update global context
      }
      setIsEditingPersonal(false);
    } catch (err) {
      console.error('Failed to update personal details', err);
    }
  };

  const handleSaveAcademic = async () => {
    try {
      if (profile && profile.emp_id) {
        const payload = { ...academicFormData };
        if (payload.year_of_passing === '') {
          payload.year_of_passing = null;
        } else {
          payload.year_of_passing = parseInt(payload.year_of_passing) || null;
        }
        await usersAPI.updateCollege(profile.emp_id, payload);
        await fetchProfile();
      }
      setIsEditingAcademic(false);
    } catch (err) {
      console.error('Failed to update college details', err);
    }
  };



  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.emp_id) return;
    
    try {
      setUploading(true);
      await usersAPI.updateProfilePhoto(profile.emp_id, file);
      await fetchProfile();
      if (fetchMe) await fetchMe(); // update global context
    } catch (err) {
      console.error('Failed to upload photo', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
        <CircularProgress sx={{ color: 'var(--color-primary)' }} />
      </Box>
    );
  }

  // Format Helper for masked Aadhar
  const maskAadhar = (num) => {
    if (!num) return 'Not set';
    const digits = String(num).replace(/\D/g, '');
    if (digits.length < 4) return digits;
    return `XXXX-XXXX-${digits.slice(-4)}`;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {profile && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          
          {/* Header Banner Card (Full Width) */}
          <Box 
            sx={{ 
              background: 'linear-gradient(135deg, #1b73e8 0%, #1a5eae 100%)', 
              borderRadius: '16px', 
              p: 4, 
              color: '#fff', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              boxShadow: '0 4px 20px rgba(27, 115, 232, 0.15)'
            }}
          >
            <Box sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
              <Box sx={{ position: 'relative' }}>
                <Avatar 
                  src={profile.photo || ''} 
                  sx={{ 
                    width: 90, 
                    height: 90, 
                    border: '3px solid rgba(255,255,255,0.6)', 
                    bgcolor: 'rgba(255,255,255,0.2)', 
                    fontSize: '2.5rem',
                    fontWeight: 600
                  }}
                >
                  {!profile.photo && (profile.full_name ? profile.full_name[0].toUpperCase() : 'U')}
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  ref={fileInputRef}
                  onChange={handlePhotoUpload}
                />
                <IconButton
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  size="small"
                  sx={{
                    position: 'absolute',
                    bottom: -4,
                    right: -4,
                    bgcolor: '#fff',
                    color: '#1b73e8',
                    '&:hover': { bgcolor: '#f0f0f0' },
                    width: 28,
                    height: 28,
                    boxShadow: '0 2px 6px rgba(0,0,0,0.15)'
                  }}
                >
                  {uploading ? <CircularProgress size={14} color="primary" /> : <PhotoCamera sx={{ fontSize: 16 }} />}
                </IconButton>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="h5" fontWeight={700}>
                    {profile.full_name || profile.username || 'User'}
                  </Typography>
                  <Chip 
                    label={profile.role === 'superadmin' ? 'Admin' : (profile.role === 'sme' ? 'SME' : profile.role || 'User')} 
                    size="small"
                    sx={{ 
                      bgcolor: 'rgba(255, 255, 255, 0.25)', 
                      color: '#fff', 
                      fontWeight: 700, 
                      textTransform: 'uppercase',
                      fontSize: '0.65rem' 
                    }} 
                  />
                </Box>
                <Typography sx={{ opacity: 0.9, fontSize: '0.9rem' }}>
                  {profile.email} &middot; {profile.entity_name || 'InternFlow Digital'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Three Summary Cards (No Role/Entity/Email duplication) */}
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid var(--border-color)', bgcolor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                  Employee ID
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--text-primary)' }}>
                  {profile.emp_id || '—'}
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid var(--border-color)', bgcolor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                  Organization Assignment
                </Typography>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--text-primary)', fontSize: '1.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {profile.role === 'intern' 
                    ? `${profile.entity_name || 'InternFlow'} · ${profile.domain_name || '—'}` 
                    : profile.entity_name || '—'
                  }
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: '12px', border: '1px solid var(--border-color)', bgcolor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 1, fontWeight: 600, textTransform: 'uppercase' }}>
                  Account Status
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: profile.user_status === 'active' ? '#22c55e' : '#eab308' }} />
                  <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--text-primary)', textTransform: 'capitalize', fontSize: '1.1rem' }}>
                    {profile.user_status === 'active' ? 'Active' : (profile.user_status === 'inprogress' ? 'In Progress' : profile.user_status || 'Pending')}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Personal Information Panel */}
          <Paper sx={{ p: 4, borderRadius: '12px', border: '1px solid var(--border-color)', bgcolor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--text-primary)' }}>
                Personal Information
              </Typography>
              {!isEditingPersonal ? (
                <Button 
                  startIcon={<Edit />} 
                  variant="outlined" 
                  size="small" 
                  onClick={() => setIsEditingPersonal(true)}
                  sx={{ textTransform: 'none', borderRadius: '8px', color: '#1b73e8', borderColor: '#1b73e8' }}
                >
                  Edit Details
                </Button>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button 
                    startIcon={<Save />} 
                    variant="contained" 
                    size="small" 
                    onClick={handleSavePersonal}
                    sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#1b73e8', '&:hover': { bgcolor: '#154b8c' } }}
                  >
                    Save
                  </Button>
                  <Button 
                    startIcon={<Cancel />} 
                    variant="outlined" 
                    size="small" 
                    onClick={() => {
                      setIsEditingPersonal(false);
                      setErrors({});
                    }}
                    sx={{ textTransform: 'none', borderRadius: '8px', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                  >
                    Cancel
                  </Button>
                </Box>
              )}
            </Box>

            <Grid container spacing={4}>
              <Grid item xs={12} sm={4}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                  Full Name
                </Typography>
                {isEditingPersonal ? (
                  <TextField
                    fullWidth
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    size="small"
                  />
                ) : (
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                    {profile.full_name || profile.username || 'Not set'}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                  Email Address
                </Typography>
                <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)', opacity: isEditingPersonal ? 0.6 : 1 }}>
                  {profile.email || 'Not set'}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                  Phone Number
                </Typography>
                {isEditingPersonal ? (
                  <TextField
                    fullWidth
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    inputProps={{ maxLength: 10 }}
                    size="small"
                  />
                ) : (
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                    {profile.phone || 'Not set'}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                  Gender
                </Typography>
                {isEditingPersonal ? (
                  <FormControl fullWidth size="small">
                    <Select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      displayEmpty
                    >
                      <MenuItem value=""><em>Not Selected</em></MenuItem>
                      <MenuItem value="male">Male</MenuItem>
                      <MenuItem value="female">Female</MenuItem>
                      <MenuItem value="other">Other</MenuItem>
                    </Select>
                  </FormControl>
                ) : (
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {profile.gender || 'Not set'}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                  Date of Birth
                </Typography>
                {isEditingPersonal ? (
                  <TextField
                    fullWidth
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    InputLabelProps={{ shrink: true }}
                    size="small"
                  />
                ) : (
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                    {profile.date_of_birth || 'Not set'}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                  Aadhar Number
                </Typography>
                {isEditingPersonal ? (
                  <TextField
                    fullWidth
                    value={formData.aadhar_number}
                    onChange={handleAadharChange}
                    error={!!errors.aadhar_number}
                    helperText={errors.aadhar_number}
                    inputProps={{ maxLength: 12 }}
                    size="small"
                  />
                ) : (
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                    {maskAadhar(profile.aadhar_number)}
                  </Typography>
                )}
              </Grid>
            </Grid>
          </Paper>

          {/* Academic details (Interns) or Professional details (Staff) */}
          {profile.role === 'intern' ? (
            <Paper sx={{ p: 4, borderRadius: '12px', border: '1px solid var(--border-color)', bgcolor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--text-primary)' }}>
                  College & Academic Credentials
                </Typography>
                {!isEditingAcademic ? (
                  <Button 
                    startIcon={<Edit />} 
                    variant="outlined" 
                    size="small" 
                    onClick={() => setIsEditingAcademic(true)}
                    sx={{ textTransform: 'none', borderRadius: '8px', color: '#1b73e8', borderColor: '#1b73e8' }}
                  >
                    Edit Academic Info
                  </Button>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button 
                      startIcon={<Save />} 
                      variant="contained" 
                      size="small" 
                      onClick={handleSaveAcademic}
                      sx={{ textTransform: 'none', borderRadius: '8px', bgcolor: '#1b73e8', '&:hover': { bgcolor: '#154b8c' } }}
                    >
                      Save
                    </Button>
                    <Button 
                      startIcon={<Cancel />} 
                      variant="outlined" 
                      size="small" 
                      onClick={() => setIsEditingAcademic(false)}
                      sx={{ textTransform: 'none', borderRadius: '8px', color: 'var(--text-primary)', borderColor: 'var(--border-color)' }}
                    >
                      Cancel
                    </Button>
                  </Box>
                )}
              </Box>

              <Grid container spacing={4}>
                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    College Name
                  </Typography>
                  {isEditingAcademic ? (
                    <TextField
                      fullWidth
                      value={academicFormData.college_name}
                      onChange={(e) => setAcademicFormData({ ...academicFormData, college_name: e.target.value })}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                      {profile.college_name || 'Not set'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    College Location
                  </Typography>
                  {isEditingAcademic ? (
                    <TextField
                      fullWidth
                      value={academicFormData.college_location}
                      onChange={(e) => setAcademicFormData({ ...academicFormData, college_location: e.target.value })}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                      {profile.college_location || 'Not set'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    Registration ID
                  </Typography>
                  {isEditingAcademic ? (
                    <TextField
                      fullWidth
                      value={academicFormData.registration_number}
                      onChange={(e) => setAcademicFormData({ ...academicFormData, registration_number: e.target.value })}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                      {profile.registration_number || 'Not set'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    Degree
                  </Typography>
                  {isEditingAcademic ? (
                    <TextField
                      fullWidth
                      value={academicFormData.degree}
                      onChange={(e) => setAcademicFormData({ ...academicFormData, degree: e.target.value })}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                      {profile.degree || 'Not set'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    Department
                  </Typography>
                  {isEditingAcademic ? (
                    <TextField
                      fullWidth
                      value={academicFormData.college_department}
                      onChange={(e) => setAcademicFormData({ ...academicFormData, college_department: e.target.value })}
                      size="small"
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                      {profile.college_department || 'Not set'}
                    </Typography>
                  )}
                </Grid>

                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    Year of Passing
                  </Typography>
                  {isEditingAcademic ? (
                    <TextField
                      fullWidth
                      value={academicFormData.year_of_passing}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        if (val.length <= 4) {
                          setAcademicFormData({ ...academicFormData, year_of_passing: val });
                        }
                      }}
                      size="small"
                      inputProps={{ maxLength: 4 }}
                    />
                  ) : (
                    <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                      {profile.year_of_passing || 'Not set'}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Paper>
          ) : (
            <Paper sx={{ p: 4, borderRadius: '12px', border: '1px solid var(--border-color)', bgcolor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--text-primary)', mb: 3 }}>
                Professional Details
              </Typography>
              <Grid container spacing={4}>
                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    Role Title
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {profile.role === 'superadmin' ? 'Admin' : (profile.role === 'sme' ? 'SME' : profile.role || '—')}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    Organization Entity
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                    {profile.entity_name || '—'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.75rem', mb: 0.75, fontWeight: 600, textTransform: 'uppercase' }}>
                    Work Shift Timing
                  </Typography>
                  <Typography variant="body1" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>
                    {profile.shift_timing || 'Standard Work Shift'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          )}

          {/* Assigned Projects Section (Interns Only) */}
          {profile.role === 'intern' && (
            <Paper sx={{ p: 4, borderRadius: '12px', border: '1px solid var(--border-color)', bgcolor: 'var(--bg-card)', boxShadow: 'var(--shadow-sm)' }}>
              <Typography variant="h6" fontWeight={700} sx={{ color: 'var(--text-primary)', mb: 3 }}>
                Assigned Projects
              </Typography>
              
              {profile.projects_info && profile.projects_info.length > 0 ? (
                <Grid container spacing={3}>
                  {profile.projects_info.map((project) => (
                    <Grid item xs={12} md={6} key={project.id}>
                      <Card sx={{ bgcolor: 'var(--bg-card)', border: '1px solid var(--border-color)', boxShadow: 'none', borderRadius: '12px' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                            <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'var(--text-primary)' }}>
                              {project.name}
                            </Typography>
                            <Chip 
                              label={project.status || 'Active'} 
                              size="small" 
                              sx={{ 
                                textTransform: 'capitalize', 
                                fontWeight: 600,
                                bgcolor: project.status === 'completed' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(27, 115, 232, 0.1)',
                                color: project.status === 'completed' ? '#22c55e' : '#1b73e8',
                              }} 
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: 'var(--text-secondary)', mb: 2 }}>
                            {project.description || 'No project description provided.'}
                          </Typography>
                          <Divider sx={{ my: 1.5, borderColor: 'var(--border-color)' }} />
                          <Grid container spacing={2} sx={{ fontSize: '0.8rem', mb: 1.5 }}>
                            <Grid item xs={6}>
                              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>TEAM NAME</Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>{project.team__name || '—'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>TEAM LEAD</Typography>
                              <Typography variant="body2" fontWeight={600} sx={{ color: 'var(--text-primary)' }}>{project.team_lead__full_name || '—'}</Typography>
                            </Grid>
                          </Grid>
                          {project.team_members && project.team_members.length > 0 && (
                            <Box>
                              <Typography sx={{ color: 'var(--text-secondary)', fontSize: '0.7rem', fontWeight: 600, mb: 1, textTransform: 'uppercase' }}>TEAM MEMBERS</Typography>
                              <Stack direction="row" spacing={1}>
                                {project.team_members.map((member) => (
                                  <Tooltip title={`${member.full_name} (${member.emp_id})`} key={member.id}>
                                    <Avatar 
                                      src={member.photo || ''} 
                                      sx={{ width: 28, height: 28, fontSize: '0.75rem', border: '1px solid var(--border-color)' }}
                                    >
                                      {member.full_name ? member.full_name[0].toUpperCase() : 'U'}
                                    </Avatar>
                                  </Tooltip>
                                ))}
                              </Stack>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              ) : (
                <Box sx={{ py: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-secondary)' }}>
                  <FolderOpen sx={{ fontSize: 40, opacity: 0.5, mb: 1.5 }} />
                  <Typography variant="body2">No active projects assigned to you yet.</Typography>
                </Box>
              )}
            </Paper>
          )}


        </Box>
      )}
    </motion.div>
  );
}
