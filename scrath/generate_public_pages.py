import os

base_dir = r"d:\VDart\SIMS\our verision sims\frontend\src\pages\public"

components = [
    "AboutUs1.jsx",
    "ContactUs1.jsx",
    "PublicFeedbackForm.jsx"
]

template = """import {{ Box, Typography, Paper }} from '@mui/material';

export default function {component_name}() {{
  return (
    <Box sx={{{{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 3 }}}}>
      <Paper className="glass-card" sx={{{{ p: 6, textAlign: 'center', maxWidth: 600 }}}}>
        <Typography variant="h4" fontWeight={{800}} gutterBottom>{component_name}</Typography>
        <Typography variant="body1" color="text.secondary">
          Public facing page scaffold ready. UI will be populated in future updates.
        </Typography>
      </Paper>
    </Box>
  );
}}
"""

for file in components:
    file_path = os.path.join(base_dir, file)
    if not os.path.exists(file_path):
        component_name = file.replace(".jsx", "")
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(template.format(component_name=component_name))
        print(f"Created: {file_path}")
    else:
        print(f"Exists: {file_path}")

print("Done generating public pages.")
