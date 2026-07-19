import pdfplumber

path = r'd:\VDart\SIMS\our verision sims\scrath\SIMS_Complete_Spec_With_AI_Final (1).pdf'
out_path = r'd:\VDart\SIMS\our verision sims\scrath\spec_extracted.txt'

with pdfplumber.open(path) as pdf:
    all_text = []
    for i, page in enumerate(pdf.pages):
        text = page.extract_text()
        if text:
            all_text.append(f"\n\n=== PAGE {i+1} ===\n{text}")

with open(out_path, 'w', encoding='utf-8') as f:
    f.write('\n'.join(all_text))

print(f"Extracted {len(pdf.pages)} pages. Output saved to spec_extracted.txt")
print(f"Total characters: {sum(len(t) for t in all_text)}")
