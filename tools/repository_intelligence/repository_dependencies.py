import re
from pathlib import Path
from shared import get_all_files

def generate_deps():
    graph = ["# DEPENDENCY_GRAPH", "## Python Imports"]
    for f in Path('.').rglob('*.py'):
        imports = re.findall(r'^from\s+(\S+)', f.read_text(), re.M)
        if imports:
            graph.append(f"- {f.name}: {', '.join(imports)}")
    Path("docs/intelligence/DEPENDENCY_GRAPH.md").write_text("\n".join(graph))

if __name__ == "__main__":
    generate_deps()