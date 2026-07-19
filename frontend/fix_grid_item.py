import os, re
for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.jsx'):
            filepath = os.path.join(root, file)
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            
            # Remove 'item' from <Grid item ...>
            # We match <Grid followed by spaces, then 'item', then space or >
            content = re.sub(r'<Grid\s+item\b', '<Grid', content)
            
            if content != original:
                with open(filepath, 'w', encoding='utf-8') as fw:
                    fw.write(content)
                print(f'Removed item prop from Grid in {file}')
