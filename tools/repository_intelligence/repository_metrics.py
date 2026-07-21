from shared import load_index, save_report

def metrics():
    data = load_index()
    total_loc = sum(d['lines'] for d in data)
    py_loc = sum(d['lines'] for d in data if d['ext'] == '.py')
    
    report = f"# PROJECT_METRICS\n\n- Total LOC: {total_loc}\n- Python LOC: {py_loc}\n- File Count: {len(data)}"
    save_report("PROJECT_METRICS.md", report)

if __name__ == "__main__": metrics()