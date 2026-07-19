import os

path = r'd:\VDart\SIMS\our verision sims\frontend\src\pages\admin\role-dashboards\MentorContent.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const handleAssignInterns = (projectId, currentTeamId, selectedInternIds, projectName) => {
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
  };"""

replacement = """  const handleAssignInterns = (projectId, currentTeamId, selectedInternIds, projectName) => {
    const project = projects.find(p => p.id === projectId);
    const oldInternIds = project?.team_interns || [];
    const newlyAssigned = selectedInternIds.filter(id => !oldInternIds.includes(id));

    const notifyNewInterns = () => {
      if (newlyAssigned.length > 0) {
        api.post('/Sims/notifications/create/', {
          user_ids: newlyAssigned,
          title: 'New Project Assignment',
          message: `You have been assigned to project: ${projectName}. Check your Dashboard for Mentor details.`,
          type: 'general'
        }).catch(() => {});
      }
    };

    if (currentTeamId) {
      api.patch(`/Sims/teams/${currentTeamId}/`, { interns: selectedInternIds })
        .then(() => {
          notifyNewInterns();
          load();
        });
    } else {
      api.post('/Sims/teams/', { name: `${projectName} Team`, interns: selectedInternIds })
        .then(res => {
          api.post(`/Sims/projects/${projectId}/assign-team/`, { team_id: res.data.id })
            .then(() => {
              notifyNewInterns();
              load();
            });
        });
    }
  };"""

if target in content:
    content = content.replace(target, replacement)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced handleAssignInterns successfully!")
else:
    print("Target block not found.")
