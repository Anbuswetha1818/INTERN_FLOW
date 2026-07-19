import os

path = r'd:\VDart\SIMS\our verision sims\frontend\src\components\layout\Sidebar.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """  intern: [
    { key: 'dashboard',      label: 'Dashboard',       icon: Dashboard },
    { key: 'tasks',          label: 'Tasks',            icon: Task },"""

replacement = """  intern: [
    { key: 'dashboard',      label: 'Dashboard',       icon: Dashboard },
    { key: 'my-projects',    label: 'My Projects & Mentor', icon: FolderSpecial },
    { key: 'tasks',          label: 'Tasks',            icon: Task },"""

if target in content:
    content = content.replace(target, replacement)
    
    # Import FolderSpecial if missing
    if 'FolderSpecial' not in content:
        import_target = "from '@mui/icons-material';"
        content = content.replace(import_target, ", FolderSpecial } from '@mui/icons-material';")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Replaced successfully!")
else:
    print("Target block not found.")
