import hashlib
from pathlib import Path
from shared import get_repo, get_all_files, save_json, save_md

def index():
    repo = get_repo()
    index_data = []
    
    for p in get_all_files():
        stat = p.stat()
        content = p.read_text(errors='ignore')
        fhash = hashlib.sha256(p.read_bytes()).hexdigest()
        
        index_data.append({
            "path": str(p),
            "ext": p.suffix,
            "size": stat.st_size,
            "sha256": fhash,
            "modified": stat.st_mtime,
            "lines": len(content.splitlines()),
            "words": len(content.split()) if p.suffix == '.md' else 0,
            "git_status": repo.git.execute(['git', 'status', '--porcelain', str(p)])
        })
    
    save_json("MASTER_INDEX.json", index_data)
    save_md("MASTER_INDEX.md", "# MASTER_INDEX\n\n- Total files: " + str(len(index_data)))

if __name__ == "__main__": index()