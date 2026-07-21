from pathlib import Path
from shared import save_md

def validate():
    files = list(Path('.').rglob('*'))
    report = ["# VALIDATION_REPORT"]
    
    if not any(f.name.lower() == 'readme.md' for f in files):
        report.append("- Missing README.md")
    
    # Check for empty files
    for f in files:
        if f.is_file() and f.stat().st_size == 0:
            report.append(f"- Empty file: {f}")
            
    save_md("VALIDATION_REPORT.md", "\n".join(report))

if __name__ == "__main__": validate()