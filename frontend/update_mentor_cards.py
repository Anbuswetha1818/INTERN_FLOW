import os

path = r'd:\VDart\SIMS\our verision sims\frontend\src\pages\admin\role-dashboards\MentorContent.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target1 = "{ label: 'My Teams',       value: stats.teams,         color: '#6366f1', icon: <Workspaces /> },"
replacement1 = ""

target2 = """          { icon: <Workspaces sx={{ fontSize: 40 }} />, title: 'My Team',
            desc: 'Create teams and assign team leads from your interns', color: '#6366f1' },"""
replacement2 = ""

target3 = "case 'teams':     return <TeamManagement />;"
replacement3 = ""

content = content.replace(target1, replacement1)
content = content.replace(target2, replacement2)
content = content.replace(target3, replacement3)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Replaced!")
