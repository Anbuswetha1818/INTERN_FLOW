import os
import re

plan_path = r"d:\VDart\SIMS\our verision sims\scrath\implementation_plan.md"
base_dir = r"d:\VDart\SIMS\our verision sims"

def analyze_plan():
    if not os.path.exists(plan_path):
        print(f"Plan not found: {plan_path}")
        return

    with open(plan_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Extract the file map block
    # It usually starts with "### Backend Files" and ends after the frontend section.
    match = re.search(r"## Complete File Map(.*?)(?=## |\Z)", content, re.DOTALL)
    if not match:
        print("Could not find 'Complete File Map' section.")
        return
        
    file_map_content = match.group(1)
    
    # Use regex to find lines like `├── filename.ext` or `│   ├── filename.ext`
    # We will just look for `.py`, `.jsx`, `.js`, `.css`, `.txt`, `.example`
    files = re.findall(r"([a-zA-Z0-9_\-]+\.(?:py|jsx|js|css|txt|example|json|md))", file_map_content)
    
    # We need full paths to truly verify, but the tree structure is complex to parse via regex.
    # Instead, we will search the entire project directory for the existence of these files.
    existing_files = set()
    for root, dirs, filenames in os.walk(base_dir):
        if "node_modules" in root or "venv" in root or ".git" in root or "__pycache__" in root:
            continue
        for name in filenames:
            existing_files.add(name)

    missing = []
    for f in set(files):
        if f not in existing_files:
            missing.append(f)

    if not missing:
        print("SUCCESS! Every single file listed in the implementation plan exists in the project.")
    else:
        print("Missing files found:")
        for m in sorted(missing):
            print(f"- {m}")

analyze_plan()
