import os

base_dir = r"d:\VDart\SIMS\our verision sims\frontend\src\components\charts"
os.makedirs(base_dir, exist_ok=True)

components = [
    "TrendChart.jsx",
    "DonutChart.jsx",
    "BarChart.jsx",
    "CircularProgress.jsx"
]

template = """import {{ Box, Typography }} from '@mui/material';

export default function {component_name}() {{
  return (
    <Box sx={{{{ p: 2, border: '1px solid rgba(108,63,224,0.3)', borderRadius: 2, bgcolor: 'rgba(108,63,224,0.05)', textAlign: 'center' }}}}>
      <Typography variant="body2" color="secondary">📊 {component_name}</Typography>
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

print("Done generating frontend chart components.")
