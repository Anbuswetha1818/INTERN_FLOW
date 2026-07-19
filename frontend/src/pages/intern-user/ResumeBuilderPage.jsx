import { useState } from 'react';
import { Box, Typography, Grid, Paper, Button, TextField, Chip, Divider, IconButton, CircularProgress } from '@mui/material';
import { AutoAwesome, Download, Edit, ContentCopy } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { aiUtils } from '../../utils/aiUtils';

export default function ResumeBuilderPage() {
  const [activeSection, setActiveSection] = useState('experience');
  const [isGenerating, setIsGenerating] = useState(false);
  const [resumeData, setResumeData] = useState({
    summary: "Professional summary will appear here.",
    experience: [
      { role: "Software Engineering Intern", duration: "June 2026 - Present", description: "• Developed a high-performance React dashboard with 50+ views.\n• Integrated REST APIs reducing load time by 30%.\n• Collaborated with UX team to implement glassmorphism design." }
    ],
    skills: "JavaScript, Python, SQL, React, Django"
  });

  const handleAutoFill = async () => {
    setIsGenerating(true);
    try {
      // Simulate reading SIMS profile and generating ATS resume
      const aiResponse = await aiUtils.chatResponse("Generate a professional resume summary and experience bullets based on my SIMS profile.");
      // We'll mock the extraction here for UI purposes
      setResumeData(prev => ({
        ...prev,
        summary: "Motivated Software Engineering Intern with hands-on experience building full-stack web applications using React and Django. Proven ability to optimize application performance and collaborate with cross-functional teams to deliver modern UI/UX.",
        experience: [
          { role: "Software Engineering Intern", duration: "June 2026 - Present", description: "• Built a comprehensive Intern Management System using React 18 and Django REST Framework.\n• Integrated Anthropic Claude API to provide 16 unique AI features.\n• Improved rendering performance by 40% through efficient state management." }
        ]
      }));
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header" sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>AI Resume Builder</Typography>
        <Typography variant="body2" color="text.secondary">
          Craft an ATS-optimized resume auto-populated with your SIMS achievements.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Editor Sidebar */}
        <Grid xs={12} md={5}>
          <Paper className="glass-card" sx={{ p: 0, height: 'calc(100vh - 180px)', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <Button 
                fullWidth 
                variant="outlined" 
                startIcon={isGenerating ? <CircularProgress size={20} /> : <AutoAwesome />} 
                onClick={handleAutoFill}
                disabled={isGenerating}
                sx={{ borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
              >
                {isGenerating ? "Analyzing SIMS Profile..." : "Auto-fill from SIMS Profile"}
              </Button>
            </Box>
            
            <Box sx={{ display: 'flex', p: 1, gap: 1, overflowX: 'auto', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              {['summary', 'experience', 'projects', 'skills', 'education'].map(s => (
                <Chip 
                  key={s} 
                  label={s.charAt(0).toUpperCase() + s.slice(1)} 
                  onClick={() => setActiveSection(s)}
                  sx={{ 
                    bgcolor: activeSection === s ? 'primary.main' : 'transparent',
                    color: activeSection === s ? '#fff' : 'text.primary',
                    border: '1px solid',
                    borderColor: activeSection === s ? 'primary.main' : 'rgba(255,255,255,0.1)'
                  }} 
                />
              ))}
            </Box>

            <Box sx={{ flexGrow: 1, p: 3, overflowY: 'auto' }}>
              {activeSection === 'experience' && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Internship at SIMS</Typography>
                  <TextField fullWidth label="Role" value={resumeData.experience[0].role} onChange={(e) => setResumeData(prev => ({...prev, experience: [{...prev.experience[0], role: e.target.value}]}))} size="small" sx={{ mb: 2 }} />
                  <TextField fullWidth label="Duration" value={resumeData.experience[0].duration} onChange={(e) => setResumeData(prev => ({...prev, experience: [{...prev.experience[0], duration: e.target.value}]}))} size="small" sx={{ mb: 2 }} />
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={4} 
                    label="Description" 
                    value={resumeData.experience[0].description} 
                    onChange={(e) => setResumeData(prev => ({...prev, experience: [{...prev.experience[0], description: e.target.value}]}))}
                  />
                  
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(108,63,224,0.05)', borderRadius: 2, border: '1px solid rgba(108,63,224,0.1)' }}>
                    <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <AutoAwesome fontSize="small" /> AI Suggestion
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      "Developed a React dashboard serving 500+ daily active users, optimizing bundle size and achieving 98 performance score on Lighthouse."
                    </Typography>
                    <Button size="small" variant="contained" sx={{ bgcolor: 'var(--color-primary)' }}>Apply Change</Button>
                  </Box>
                </Box>
              )}
              {activeSection === 'summary' && (
                <Box>
                  <Typography variant="subtitle1" fontWeight={600} mb={2}>Professional Summary</Typography>
                  <TextField 
                    fullWidth 
                    multiline 
                    rows={6} 
                    label="Summary" 
                    value={resumeData.summary} 
                    onChange={(e) => setResumeData(prev => ({...prev, summary: e.target.value}))}
                  />
                  <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(108,63,224,0.05)', borderRadius: 2, border: '1px solid rgba(108,63,224,0.1)' }}>
                    <Typography variant="caption" color="primary.main" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                      <AutoAwesome fontSize="small" /> AI Suggestion
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                      "Add a sentence emphasizing your leadership in cross-functional projects to strengthen your profile."
                    </Typography>
                    <Button size="small" variant="contained" sx={{ bgcolor: 'var(--color-primary)' }}>Apply Change</Button>
                  </Box>
                </Box>
              )}
              {activeSection !== 'experience' && activeSection !== 'summary' && (
                <Typography color="text.secondary" align="center" mt={4}>
                  Section editor coming soon.
                </Typography>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Live Preview Pane */}
        <Grid xs={12} md={7}>
          <Paper 
            className="glass-card" 
            sx={{ 
              p: 4, 
              height: 'calc(100vh - 180px)', 
              overflowY: 'auto',
              bgcolor: '#fff', // White background for resume preview
              color: '#000',
              borderRadius: 2
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<Download />} color="secondary" size="small">Export PDF</Button>
            </Box>
            
            {/* Resume Template */}
            <Box sx={{ maxWidth: '800px', margin: '0 auto', fontFamily: '"Inter", sans-serif' }}>
              <Typography variant="h4" fontWeight={800} align="center" sx={{ color: '#111' }}>JOHN DOE</Typography>
              <Typography variant="body2" align="center" sx={{ color: '#555', mb: 3 }}>
                johndoe@example.com | (555) 123-4567 | linkedin.com/in/johndoe | GitHub: johndoe
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ borderBottom: '2px solid #222', mb: 1, pb: 0.5 }}>PROFESSIONAL EXPERIENCE</Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography fontWeight={700}>{resumeData.experience[0].role}</Typography>
                  <Typography fontWeight={600} sx={{ color: '#555' }}>{resumeData.experience[0].duration}</Typography>
                </Box>
                <Typography fontStyle="italic" sx={{ mb: 1 }}>SIMS Project</Typography>
                <Box sx={{ color: '#333', fontSize: '0.9rem', whiteSpace: 'pre-line' }}>
                  {resumeData.experience[0].description}
                </Box>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" fontWeight={700} sx={{ borderBottom: '2px solid #222', mb: 1, pb: 0.5 }}>SKILLS</Typography>
                <Typography variant="body2" sx={{ color: '#333' }}>
                  <strong>Languages:</strong> JavaScript, Python, SQL<br/>
                  <strong>Frameworks:</strong> React, Django, Material UI, Tailwind CSS<br/>
                  <strong>Tools:</strong> Git, Docker, AWS
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </motion.div>
  );
}
