import os

path = r'd:\VDart\SIMS\our verision sims\frontend\src\pages\admin\role-dashboards\SMEContent.jsx'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

target = """          <FormControl fullWidth>
            <InputLabel>Domain</InputLabel>
            <Select value={form.domain} label="Domain"
              onChange={e => setForm(f => ({ ...f, domain: e.target.value, team_lead: '' }))}>
              {domains.map(d => <MenuItem key={d.id} value={d.id}>{d.name}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth disabled={!form.domain}>
            <InputLabel>Mentor</InputLabel>
            <Select value={form.team_lead || ''} label="Mentor"
              onChange={e => setForm(f => ({ ...f, team_lead: e.target.value }))}>
              <MenuItem value="">Select mentor</MenuItem>
              {teamLeads
                .filter(tl => {
                  if (!form.domain) return true;
                  const selDomain = domains.find(d => d.id === form.domain);
                  return selDomain ? tl.domain_name === selDomain.name : true;
                })
                .map(tl => (
                  <MenuItem key={tl.id} value={tl.id}>{tl.full_name}</MenuItem>
                ))}
            </Select>
          </FormControl>"""

replacement = """          <FormControl fullWidth>
            <InputLabel>Mentor</InputLabel>
            <Select value={form.team_lead || ''} label="Mentor"
              onChange={e => setForm(f => ({ ...f, team_lead: e.target.value }))}>
              <MenuItem value="">Select mentor...</MenuItem>
              {teamLeads.map(tl => (
                  <MenuItem key={tl.id} value={tl.id}>{tl.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>"""

# Also remove 'domain' from form payload
target2 = "if (form.domain) formData.append('domain', form.domain);"
replacement2 = "// backend auto-assigns domain"

if target in content:
    content = content.replace(target, replacement)
    content = content.replace(target2, replacement2)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("SMEContent.jsx updated successfully!")
else:
    print("Target block not found.")
