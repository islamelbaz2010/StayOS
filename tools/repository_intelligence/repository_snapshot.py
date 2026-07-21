from datetime import datetime
from shared import get_repo, save_md

def snapshot():
    repo = get_repo()
    content = f"""# PROJECT_SNAPSHOT
- Branch: {repo.active_branch}
- Latest Commit: {repo.head.commit.hexsha[:7]}
- Repository Age: {(datetime.now() - datetime.fromtimestamp(repo.head.commit.committed_date)).days} days
"""
    save_md("PROJECT_SNAPSHOT.md", content)

if __name__ == "__main__": snapshot()