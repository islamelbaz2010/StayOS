import os
import shutil
from pathlib import Path

def repository_cleanup():
    archive_base = Path('archive')
    legacy_dir = archive_base / 'legacy'
    raw_ai_dir = archive_base / 'raw-ai-output'
    raw_prompts_dir = archive_base / 'raw-prompts'
    
    report = {'Moved': [], 'Skipped': [], 'Errors': []}
    
    for d in [legacy_dir, raw_ai_dir, raw_prompts_dir]:
        d.mkdir(parents=True, exist_ok=True)

    def safe_move(src, dst_dir):
        if not src.exists(): return
        dst = dst_dir / src.name
        if dst.exists():
            report['Skipped'].append(str(src))
            return
        try:
            shutil.move(str(src), str(dst))
            report['Moved'].append(f"{src} -> {dst}")
        except Exception as e:
            report['Errors'].append(f"{src}: {e}")

    # Move folders to legacy
    for folder_name in ['phase-2-product', 'phase-3-customer', 'phase-4-egypt']:
        src = Path('docs') / folder_name
        if src.exists():
            dest = legacy_dir / folder_name
            if not dest.exists():
                shutil.move(str(src), str(dest))
                report['Moved'].append(f"{src} -> {dest}")
            else:
                report['Skipped'].append(str(src))

    # Move specific file types
    for root, dirs, files in os.walk('.'):
        for name in files:
            file_path = Path(root) / name
            if name.startswith('Pasted') and name.endswith('.md'):
                safe_move(file_path, raw_ai_dir)
            elif name.endswith('.csv'):
                safe_move(file_path, raw_prompts_dir)

    # Remove empty directories
    for root, dirs, files in os.walk('docs', topdown=False):
        if not os.listdir(root):
            os.rmdir(root)

    # Write Report
    with open(archive_base / 'CLEANUP_REPORT.md', 'w', encoding='utf-8') as f:
        f.write("Moved:\n" + "\n".join(report['Moved']) + "\n\n")
        f.write("Skipped:\n" + "\n".join(report['Skipped']) + "\n\n")
        f.write("Errors:\n" + "\n".join(report['Errors']))

if __name__ == '__main__':
    repository_cleanup()