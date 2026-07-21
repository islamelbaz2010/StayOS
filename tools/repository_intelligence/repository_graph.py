from shared import load_index, save_report

def graph():
    data = load_index()
    mermaid = ["# FOLDER_GRAPH", "```mermaid", "graph TD"]
    for d in data:
        parent = Path(d['path']).parent
        mermaid.append(f"  {parent.name} --> {Path(d['path']).name}")
    mermaid.append("```")
    save_report("FOLDER_GRAPH.md", "\n".join(mermaid))

if __name__ == "__main__": graph()