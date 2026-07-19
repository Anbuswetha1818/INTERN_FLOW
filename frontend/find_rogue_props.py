import os, re
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                if 'item' in content or 'textAlign' in content:
                    lines = content.split('\n')
                    for i, line in enumerate(lines):
                        if 'textAlign=' in line and 'Typography' not in line and 'sx=' not in line:
                            print(f'Match textAlign in {file}:{i+1}: {line.strip()}')
                        if re.search(r'<\w+[^>]*\bitem\b[^>]*>', line) and 'Grid' not in line:
                            print(f'Match item on non-Grid in {file}:{i+1}: {line.strip()}')
                        if re.search(r'<\w+[^>]*\bitem={true}[^>]*>', line) and 'Grid' not in line:
                            print(f'Match item={{true}} in {file}:{i+1}: {line.strip()}')
                        if re.search(r'<\w+[^>]*\bitem=[\'"`]\w+[\'"`][^>]*>', line):
                            print(f'Match item=string in {file}:{i+1}: {line.strip()}')
