import os
import json
import csv
import re
from pathlib import Path
from datetime import datetime

# Configuration
REPO_ROOT = Path('.')
DOCS_DIR = REPO_ROOT / 'docs'
OUTPUT_DIR = DOCS_DIR
INDEX_MD = OUTPUT_DIR / 'INDEX.md'
INDEX_JSON = OUTPUT_DIR / 'MASTER_INDEX.json'
INDEX_CSV = OUTPUT_DIR / 'MASTER_INDEX.csv'
TAGS_JSON = OUTPUT_DIR / 'MASTER_TAGS.json'
RELATIONS_JSON = OUTPUT_DIR / 'FILE_RELATIONS.json'

def get_stats(file_path):
    content = file_path.read_text(encoding='utf-8', errors='ignore')
    return {
        "words": len(content.split()),
        "lines": len(content.splitlines()),
        "headings": len(re.findall(r'^#+ ', content, re.M)),
        "todos": content.lower().count('todo'),
        "tables": content.count('|---|'),
        "code_blocks": content.count('```'),
        "images": content.count('!['),
    }

def index_repository():
    index = []
    tags = {}
    relations = {}

    for root, _, files in os.walk(REPO_ROOT):
        if any(ignored in root for ignored in ['archive', '.git', 'tools']):
            continue
            
        for file in files:
            path = Path(root) / file
            stats = get_stats(path)
            
            entry = {
                "file_name": file,
                "path": str(path),
                "folder": str(path.parent),
                "extension": path.suffix,
                "size_bytes": path.stat().st_size,
                "created": datetime.fromtimestamp(path.stat().st_ctime).isoformat(),
                "modified": datetime.fromtimestamp(path.stat().st_mtime).isoformat(),
                **stats
            }
            index.append(entry)

    # Save outputs
    with open(INDEX_JSON, 'w') as f: json.dump(index, f, indent=4)
    with open(INDEX_CSV, 'w') as f:
        writer = csv.DictWriter(f, fieldnames=index[0].keys())
        writer.writeheader()
        writer.writerows(index)
        
    # Generate MD
    with open(INDEX_MD, 'w') as f:
        f.write("# Repository Master Index\n\n")
        f.write(f"Total files indexed: {len(index)}\n\n")
        for item in index:
            f.write(f"- [{item['file_name']}]({item['path']})\n")

if __name__ == '__main__':
    DOCS_DIR.mkdir(exist_ok=True)
    index_repository()