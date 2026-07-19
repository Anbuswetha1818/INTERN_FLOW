import os, re
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            content = content.replace('textAlign="center"', 'align="center"')
            content = content.replace('textAlign="right"', 'align="right"')
            content = content.replace('textAlign="left"', 'align="left"')
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as fw:
                    fw.write(content)
                print(f'Fixed Typography align in {file}')
