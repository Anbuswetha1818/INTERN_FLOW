import os

base_dir = r"d:\VDart\SIMS\our verision sims\frontend\src\pages"

files_to_create = {
    "admin": ["PaymentList.jsx", "PerformanceFeedbackPage.jsx"],
    "intern-mgmt": ["InternManagementLists.jsx", "DocumentView.jsx", "PerformanceFeedbackList.jsx", "Forms.jsx", "FormResponses.jsx", "FormAnalytics.jsx", "ApproveDashboard.jsx", "CompletionList.jsx", "AIInsightsPage.jsx"],
    "task": ["CreateTaskDialog.jsx", "TaskCard.jsx", "IndividualTask.jsx", "TeamInternsPage.jsx", "Departments.jsx", "TaskManagerCreation.jsx", "GanttChart.jsx"],
    "attendance": ["DailyAttendance.jsx", "AttendanceLog.jsx", "LeaveList.jsx", "AttendanceClaims.jsx"],
    "asset": ["InternAssetStatus.jsx", "AssetReports.jsx"],
    "intern-user": ["DocumentView.jsx", "PaymentStatusPage.jsx", "AssetReport.jsx", "PerformancePage.jsx", "StudentStaffFeedback.jsx", "TeamsManagement.jsx"],
}

template = """import {{ Box, Typography, Paper }} from '@mui/material';
import {{ motion }} from 'framer-motion';

export default function {component_name}() {{
  return (
    <motion.div initial={{{{ opacity: 0 }}}} animate={{{{ opacity: 1 }}}}>
      <Box className="page-header" sx={{{{ mb: 3 }}}}>
        <Typography variant="h4" fontWeight={{800}}>{component_name}</Typography>
        <Typography variant="body2" color="text.secondary">
          This module is ready. UI to be populated in future updates.
        </Typography>
      </Box>
      <Paper className="glass-card" sx={{{{ p: 4, textAlign: 'center' }}}}>
        <Typography variant="h6" color="text.secondary">🚀 {component_name} Ready</Typography>
      </Paper>
    </motion.div>
  );
}}
"""

for folder, files in files_to_create.items():
    folder_path = os.path.join(base_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    for file in files:
        file_path = os.path.join(folder_path, file)
        if not os.path.exists(file_path):
            component_name = file.replace(".jsx", "")
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(template.format(component_name=component_name))
            print(f"Created: {file_path}")
        else:
            print(f"Exists: {file_path}")

print("Done generating missing files.")
