import git
from pathlib import Path

def generate_timeline():
    repo = git.Repo('.')
    timeline = ["# PROJECT_TIMELINE", "## Recent Commits"]
    for commit in repo.iter_commits(max_count=20):
        timeline.append(f"- {commit.hexsha[:7]} - {commit.summary} ({commit.author.name})")
    Path("docs/intelligence/PROJECT_TIMELINE.md").write_text("\n".join(timeline))

if __name__ == "__main__":
    generate_timeline()