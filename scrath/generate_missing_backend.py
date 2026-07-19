import os

base_dir = r"d:\VDart\SIMS\our verision sims\backend\ai_service"

files_to_create = {
    "": ["serializers.py", "utils.py"],
    "views": [
        "__init__.py",
        "chat_views.py",
        "performance_views.py",
        "learning_views.py",
        "resume_views.py",
        "interview_views.py",
        "task_ai_views.py",
        "attendance_ai_views.py",
        "feedback_ai_views.py",
        "exit_views.py",
        "search_views.py",
        "onboarding_ai_views.py",
        "report_views.py"
    ],
    "prompts": [
        "__init__.py"
    ]
}

template = '''"""
Stub file for {filename}.
Full implementation will utilize the Anthropic Claude API for AI features.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class {class_name}(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({{"status": "ready", "module": "{filename}"}})
        
    def post(self, request):
        return Response({{"status": "ready", "module": "{filename}"}})
'''

for folder, files in files_to_create.items():
    folder_path = os.path.join(base_dir, folder)
    os.makedirs(folder_path, exist_ok=True)
    
    for file in files:
        file_path = os.path.join(folder_path, file)
        if not os.path.exists(file_path):
            with open(file_path, "w", encoding="utf-8") as f:
                if file.endswith("_views.py"):
                    class_name = "".join(word.capitalize() for word in file.replace(".py", "").split("_"))
                    f.write(template.format(filename=file, class_name=class_name))
                elif file == "__init__.py":
                    pass
                else:
                    f.write(f"# Stub for {file}\n")
            print(f"Created: {file_path}")
        else:
            print(f"Exists: {file_path}")

print("Done generating missing backend files.")
