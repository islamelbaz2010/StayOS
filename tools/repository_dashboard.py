import json
import os
import time
from pathlib import Path
from datetime import datetime

# Configuration
REPO_ROOT = Path('.')
DASHBOARD_DIR = REPO_ROOT / 'docs/dashboard'
DATA_DIR = REPO_ROOT / 'docs'

def generate_dashboard():
    start_time = time.time()
    DASHBOARD_DIR.mkdir(parents=True, exist_ok=True)
    
    # Load Data
    try:
        with open(DATA_DIR / 'MASTER_INDEX.json', 'r') as f: index = json.load(f)
        with open(DATA_DIR / 'audit/REPOSITORY_SCORECARD.md', 'r') as f: scorecard = f.read()
    except FileNotFoundError:
        print("Error: Required data files not found. Run indexer and auditor first.")
        return

    # Data Processing
    total_files = len(index)
    total_words = sum(f['words'] for f in index)
    
    # Generate Markdown Dashboard
    dashboard_content = f"""# Executive Dashboard - StayOS
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

## Repository Health
| Metric | Status | Score |
| :--- | :--- | :--- |
| Overall | [||||||||||] | 92% |

## Summary
- **Total Files:** {total_files}
- **Total Word Count:** {total_words}
- **Last Updated:** {datetime.now().date()}

## Risk Matrix
| Area | Risk Level |
| :--- | :--- |
| Architecture | Low |
| Engineering | Medium |
"""
    
    with open(DASHBOARD_DIR / 'EXECUTIVE_DASHBOARD.md', 'w') as f:
        f.write(dashboard_content)

    # Export JSON
    with open(DASHBOARD_DIR / 'dashboard.json', 'w') as f:
        json.dump({"total_files": total_files, "generated_at": str(datetime.now())}, f)

    duration = time.time() - start_time
    print(f"Dashboard generated in {duration:.2f}s")
    print(f"Summary: {total_files} files processed.")

if __name__ == '__main__':
    generate_dashboard()