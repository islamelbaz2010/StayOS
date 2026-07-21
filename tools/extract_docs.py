import os
import re
import shutil
from pathlib import Path
from datetime import datetime

INPUT_DIR = Path('docs')
OUTPUT_DIR = Path('docs/generated')
ARCHIVE_DIR = Path('docs/archive/generated')
PRODUCT_DIR = Path('docs/02_product')
CX_DIR = Path('docs/03_customer_experience')

def extract_and_organize():
    # Directories setup
    for d in [OUTPUT_DIR, ARCHIVE_DIR, PRODUCT_DIR, CX_DIR]:
        d.mkdir(parents=True, exist_ok=True)
        
    scanned_files = list(INPUT_DIR.glob('Pasted*.md')) + list(INPUT_DIR.glob('*.conversation.md'))
    extracted_docs = {}
    stats = {'scanned': len(scanned_files), 'created': 0, 'duplicates': 0, 'skipped': 0, 'errors': 0}

    # Extraction
    for file_path in scanned_files:
        content = file_path.read_text(encoding='utf-8')
        format_a = re.findall(r'Filename:\s*\n(.*?\.md)\n(.*?)(?=Filename:|$)', content, re.S)
        format_b = re.findall(r'#\s*(.*?\.md)\n(.*?)(?=#\s*.*\.md|$)', content, re.S)
        docs = format_a if format_a else format_b
        
        for name, text in docs:
            name = name.strip()
            path = OUTPUT_DIR / name
            if path.exists() and file_path.stat().st_mtime <= path.stat().st_mtime:
                stats['skipped'] += 1
                continue
            path.write_text(text.strip(), encoding='utf-8')
            extracted_docs[name] = True
            stats['created'] += 1 if not path.exists() else 0
            stats['duplicates'] += 1 if path.exists() else 0

    # Organization Logic
    product_patterns = ['PRODUCT', 'FEATURE', 'USER_STORIES', 'FLOWS', 'BUSINESS_RULES', 
                        'ENGINEERING_BACKLOG', 'LEAN_PRODUCT', 'MVP_FREEZE']
    cx_map = ['CUSTOMER_JOURNEY_BIBLE', 'EXPERIENCE_RULES', 'TRUST_FRAMEWORK', 'DELIGHT_ENGINE']

    for file_path in OUTPUT_DIR.glob('*.md'):
        if file_path.name in ['FILES_CREATED.md', 'EXTRACTION_REPORT.md']:
            continue
            
        stem = file_path.stem
        if any(stem.startswith(p) for p in product_patterns):
            shutil.move(str(file_path), str(PRODUCT_DIR / file_path.name))
        elif stem in cx_map:
            shutil.move(str(file_path), str(CX_DIR / file_path.name))

    # Reports
    with open(OUTPUT_DIR / 'FILES_CREATED.md', 'w', encoding='utf-8') as f:
        f.write('\n'.join(sorted(extracted_docs.keys())))
    
    with open(OUTPUT_DIR / 'EXTRACTION_REPORT.md', 'w', encoding='utf-8') as f:
        f.write(f"Total conversations scanned: {stats['scanned']}\nTotal markdown documents created: {stats['created']}\nDuplicates removed: {stats['duplicates']}\nSkipped documents: {stats['skipped']}\nErrors: {stats['errors']}\n")

    for report in ['FILES_CREATED.md', 'EXTRACTION_REPORT.md']:
        shutil.move(str(OUTPUT_DIR / report), str(ARCHIVE_DIR / report))

if __name__ == '__main__':
    extract_and_organize()