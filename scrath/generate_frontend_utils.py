import os

base_dir = r"d:\VDart\SIMS\our verision sims\frontend\src\utils"
os.makedirs(base_dir, exist_ok=True)

files = {
    "formatters.js": "export const formatDate = (date) => new Date(date).toLocaleDateString();\n",
    "validators.js": "export const isValidEmail = (email) => /^\S+@\S+\.\S+$/.test(email);\n",
    "constants.js": "export const APP_NAME = 'SIMS';\n"
}

for file, content in files.items():
    file_path = os.path.join(base_dir, file)
    if not os.path.exists(file_path):
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Created: {file_path}")
    else:
        print(f"Exists: {file_path}")

print("Done generating frontend utils.")
