import os
import re

def fix_jsx_warnings(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.jsx') or file.endswith('.js'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                original = content
                
                # Fix item="true" -> item
                content = content.replace('item="true"', 'item')
                
                # Fix primaryTypographyProps on native elements (if any) or lowercase listItemText
                content = content.replace('<listItemText', '<ListItemText')
                content = content.replace('</listItemText>', '</ListItemText>')
                
                if content != original:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(content)
                    print(f"Fixed {filepath}")

fix_jsx_warnings(r'd:\VDart\SIMS\our verision sims\frontend\src')
