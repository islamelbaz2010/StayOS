import json
import os
import time
from pathlib import Path
from datetime import datetime

# Configuration
REPO_ROOT = Path('.')
AUDIT_DIR = REPO_ROOT / 'docs/audit'
INDEX_FILE = REPO_ROOT / 'docs/MASTER_INDEX.json'
RELATIONS_FILE = REPO_ROOT / 'docs/FILE_RELATIONS.json'

class Colors:
    HEADER = '\033[95m'; BLUE = '\033[94m'; GREEN = '\033[92m'
    WARNING = '\033[93m'; FAIL = '\033[91m'; ENDC = '\033[0m'

def auditor():
    start_time = time.time()
    AUDIT_DIR.mkdir(parents=True, exist_ok=True)
    
    print(f"{Colors.BLUE}Starting Repository Audit...{Colors.ENDC}")
    
    # Load Data
    try:
        with open(INDEX_FILE, 'r') as f: index = json.load(f)
        with open(RELATIONS_FILE, 'r') as f: relations = json.load(f)
    except FileNotFoundError:
        print(f"{Colors.FAIL}Error: Required index files not found.{Colors.ENDC}")
        return

    # Initialize Findings
    findings = {"critical": [], "warnings": [], "fix": []}
    scores = {"arch": 100, "doc": 100, "prod": 100, "eng": 100}

    # Structure & Quality Audit
    for entry in index:
        path = Path(entry['path'])
        
        # Quality Checks
        if entry['size_bytes'] == 0:
            findings['critical'].append(f"Empty file: {entry['path']}")
            scores['doc'] -= 5
        
        if entry['todos'] > 0:
            findings['warnings'].append(f"TODOs found in: {entry['path']}")
            scores['eng'] -= 2

    # Score Calculation
    overall = sum(scores.values()) / 4
    
    # Generate Reports
    with open(AUDIT_DIR / 'AUDIT_REPORT.md', 'w') as f:
        f.write(f"# Audit Report - {datetime.now().strftime('%Y-%m-%d')}\n")
        f.write(f"Overall Health Score: {overall:.1f}\n")
    
    with open(AUDIT_DIR / 'REPOSITORY_SCORECARD.md', 'w') as f:
        f.write(f"# Scorecard\n" + "\n".join([f"- {k.upper()}: {v}" for k, v in scores.items()]))

    # Console Output
    duration = time.time() - start_time
    print(f"{Colors.GREEN}Audit Complete in {duration:.2f}s{Colors.ENDC}")
    print(f"{Colors.HEADER}Overall Health: {overall:.1f}/100{Colors.ENDC}")

if __name__ == '__main__':
    auditor()