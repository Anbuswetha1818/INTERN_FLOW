import os

path = r'd:\VDart\SIMS\our verision sims\frontend\src\pages\intern-user\InternDashboard.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """        <Grid item="true" xs={12} md={6}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Box className="glass-card" sx={{ p: 3, cursor: 'pointer', '&:hover': { borderColor: 'var(--color-primary)' } }}>"""

replacement = """        <Grid item="true" xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <Box className="glass-card" sx={{ p: 3, cursor: 'pointer', '&:hover': { borderColor: 'var(--color-primary)' } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <People sx={{ color: 'var(--color-primary)' }} />
                <Typography fontWeight={700}>My Mentor</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                {user?.projects_info && user.projects_info.length > 0 
                  ? `Your Mentor: ${user.projects_info[0].team_lead__full_name || 'Assigned soon'}. Reach out for leaves or doubts!`
                  : 'You will be assigned a mentor shortly.'}
              </Typography>
              {user?.projects_info && user.projects_info.length > 0 && user.projects_info[0].team_lead__user__email && (
                 <Button 
                   variant="outlined" 
                   size="small" 
                   sx={{ mt: 2 }}
                   onClick={(e) => { e.stopPropagation(); window.location.href = `mailto:${user.projects_info[0].team_lead__user__email}`; }}
                 >
                   Contact Mentor
                 </Button>
              )}
            </Box>
          </motion.div>
        </Grid>
        <Grid item="true" xs={12} md={4}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Box className="glass-card" sx={{ p: 3, cursor: 'pointer', '&:hover': { borderColor: 'var(--color-primary)' } }}>"""

if target in content:
    content = content.replace(target, replacement)
    
    # Need to import People icon
    import_target = "from '@mui/icons-material';"
    if "People" not in content and import_target in content:
        content = content.replace(import_target, ", People } from '@mui/icons-material';")
    
    # Also adjust the next Grid item to md={4}
    content = content.replace('<Grid item="true" xs={12} md={6}>\n          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>', '<Grid item="true" xs={12} md={4}>\n          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>')

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully!")
else:
    print("Target block not found.")
