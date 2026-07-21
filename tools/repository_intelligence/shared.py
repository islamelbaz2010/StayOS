import logging
import json
from pathlib import Path
from typing import Any, Dict, List
import git

logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')
logger = logging.getLogger("RepoIntel")

def get_repo() -> git.Repo:
    return git.Repo(Path('.'), search_parent_directories=True)

def get_all_files(root: Path = Path('.')) -> List[Path]:
    return [p for p in root.rglob('*') if p.is_file() and '.git' not in p.parts]

def save_json(name: str, data: Any):
    Path("docs/intelligence").mkdir(parents=True, exist_ok=True)
    (Path("docs/intelligence") / name).write_text(json.dumps(data, indent=2))

def save_md(name: str, content: str):
    Path("docs/intelligence").mkdir(parents=True, exist_ok=True)
    (Path("docs/intelligence") / name).write_text(content, encoding='utf-8')