import os

base_dir = r"d:\VDart\SIMS\our verision sims\frontend\src\components\ai"
os.makedirs(base_dir, exist_ok=True)

components = [
    "AIChatWidget.jsx",
    "AIScoreBadge.jsx",
    "AIRiskFlag.jsx",
    "AIQuizCard.jsx",
    "SkillGapChart.jsx",
    "SLABadge.jsx",
    "EscalationTimeline.jsx",
    "GlobalSearchBar.jsx",
    "NaturalLanguageReportInput.jsx"
]

template = """import {{ Box, Typography }} from '@mui/material';

export default function {component_name}() {{
  return (
    <Box sx={{{{ p: 2, border: '1px solid rgba(0,188,212,0.3)', borderRadius: 2, bgcolor: 'rgba(0,188,212,0.05)' }}}}>
      <Typography variant="body2" color="primary">{component_name} (AI Component Stub)</Typography>
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

print("Done generating frontend AI components.")
