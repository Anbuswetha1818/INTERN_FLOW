import os
import re

path = r'd:\VDart\SIMS\our verision sims\frontend\src\pages\admin\role-dashboards\SMEContent.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

pattern = r'<FormControl fullWidth>\s*<InputLabel>Domain</InputLabel>.*?</Select>\s*</FormControl>'
content = re.sub(pattern, '', content, flags=re.DOTALL)

pattern2 = r'<FormControl fullWidth disabled=\{!form\.domain\}>\s*<InputLabel>Mentor</InputLabel>.*?</Select>\s*</FormControl>'
replacement2 = """<FormControl fullWidth>
            <InputLabel>Mentor</InputLabel>
            <Select value={form.team_lead || ''} label="Mentor"
              onChange={e => setForm(f => ({ ...f, team_lead: e.target.value }))}>
              <MenuItem value="">Select mentor...</MenuItem>
              {teamLeads.map(tl => (
                  <MenuItem key={tl.id} value={tl.id}>{tl.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>"""
content = re.sub(pattern2, replacement2, content, flags=re.DOTALL)

content = content.replace("if (form.domain) formData.append('domain', form.domain);", "// backend auto-assigns domain")
content = content.replace("domain: '', ", "")

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated SMEContent.jsx successfully via regex!")
