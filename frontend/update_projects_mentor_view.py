import os

path = r'd:\VDart\SIMS\our verision sims\frontend\src\pages\admin\role-dashboards\MentorContent.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """function ProjectsMentorView() {
  const [projects, setProjects] = useState([]);
  const [teams, setTeams]       = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/Sims/projects/'),
      api.get('/Sims/teams/')
    ])
      .then(([pRes, tRes]) => {
        setProjects(pRes.data);
        setTeams(tRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAssignTeam = (projectId, teamId) => {
    api.post(`/Sims/projects/${projectId}/assign-team/`, { team_id: teamId })
      .then(() => load())
      .catch(() => {});
  };

  const statusColor = (s) => ({ active: 'success', completed: 'primary', planning: 'warning', on_hold: 'default' }[s] || 'default');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header">
        <Typography variant="h4" fontWeight={800}>Assigned Projects</Typography>
        <Typography variant="body2" color="text.secondary">Assign your teams to projects assigned to you</Typography>
      </Box>
      {loading ? <LoadingSpinner text="Loading projects..." /> : (
        <Box className="glass-card" sx={{ p: 3 }}>
          {projects.length === 0 ? (
            <Alert severity="info">No projects assigned to you or your teams yet.</Alert>
          ) : (
            <Grid container spacing={2}>
              {projects.map(p => (
                <Grid item="true" xs={12} sm={6} key={p.id}>
                  <Box sx={{ p: 2.5, border: '1px solid var(--border-subtle)', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography fontWeight={700}>{p.name}</Typography>
                      <Chip label={p.status} color={statusColor(p.status)} size="small" />
                    </Box>
                    <Typography variant="body2" color="text.secondary">{p.description || 'No description'}</Typography>
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Domain: {p.domain_name || '—'}
                      </Typography>
                      <FormControl size="small" sx={{ minWidth: 160 }}>
                        <Select
                          displayEmpty
                          value={p.team || ""}
                          onChange={e => handleAssignTeam(p.id, e.target.value)}
                        >
                          <MenuItem value="" disabled>Select team...</MenuItem>
                          <MenuItem value="unassigned"><em>Unassigned</em></MenuItem>
                          {teams.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                        </Select>
                      </FormControl>
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>
      )}
    </motion.div>
  );
}"""

replacement = """function ProjectsMentorView() {
  const [projects, setProjects] = useState([]);
  const [availableInterns, setAvailableInterns] = useState([]);
  const [myInterns, setMyInterns] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get('/Sims/projects/'),
      api.get('/Sims/teams/available-interns/'),
      api.get('/Sims/interns/')
    ])
      .then(([pRes, aRes, mRes]) => {
        setProjects(pRes.data);
        setAvailableInterns(aRes.data);
        setMyInterns(mRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAssignInterns = (projectId, currentTeamId, selectedInternIds, projectName) => {
    if (currentTeamId) {
      api.patch(`/Sims/teams/${currentTeamId}/`, { interns: selectedInternIds })
        .then(() => load());
    } else {
      api.post('/Sims/teams/', { name: `${projectName} Team`, interns: selectedInternIds })
        .then(res => {
          api.post(`/Sims/projects/${projectId}/assign-team/`, { team_id: res.data.id })
            .then(() => load());
        });
    }
  };

  const statusColor = (s) => ({ active: 'success', completed: 'primary', planning: 'warning', on_hold: 'default' }[s] || 'default');

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Box className="page-header">
        <Typography variant="h4" fontWeight={800}>Assigned Projects</Typography>
        <Typography variant="body2" color="text.secondary">Assign interns directly to your projects</Typography>
      </Box>
      {loading ? <LoadingSpinner text="Loading projects..." /> : (
        <Box className="glass-card" sx={{ p: 3 }}>
          {projects.length === 0 ? (
            <Alert severity="info">No projects assigned to you yet.</Alert>
          ) : (
            <Grid container spacing={2}>
              {projects.map(p => {
                const teamInternIds = p.team_interns || [];
                const currentInternsObj = myInterns.filter(i => teamInternIds.includes(i.id));
                // Ensure unique objects
                const allOptionsMap = new Map();
                [...availableInterns, ...currentInternsObj].forEach(i => allOptionsMap.set(i.id, i));
                const allOptions = Array.from(allOptionsMap.values());
                const domainOptions = allOptions.filter(i => i.domain_name === p.domain_name);

                return (
                  <Grid item="true" xs={12} sm={6} key={p.id}>
                    <Box sx={{ p: 2.5, border: '1px solid var(--border-subtle)', borderRadius: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography fontWeight={700}>{p.name}</Typography>
                        <Chip label={p.status} color={statusColor(p.status)} size="small" />
                      </Box>
                      <Typography variant="body2" color="text.secondary">{p.description || 'No description'}</Typography>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                          Domain: {p.domain_name || '—'}
                        </Typography>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <Select
                            multiple
                            displayEmpty
                            value={p.team_interns || []}
                            onChange={e => handleAssignInterns(p.id, p.team, e.target.value, p.name)}
                            renderValue={(selected) => {
                              if (!selected || selected.length === 0) return <em>Select interns...</em>;
                              return `${selected.length} intern${selected.length > 1 ? 's' : ''} assigned`;
                            }}
                          >
                            <MenuItem disabled value=""><em>Select interns...</em></MenuItem>
                            {domainOptions.map(i => (
                              <MenuItem key={i.id} value={i.id}>
                                {i.full_name} ({i.emp_id})
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Box>
                    </Box>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}
    </motion.div>
  );
}"""

content = content.replace(target, replacement)
content = content.replace("Domain: {p.domain_name || ''}", "Domain: {p.domain_name || '—'}") # Handle encoding issue

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced!")
