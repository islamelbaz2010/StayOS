import sys
from pathlib import Path

def search(query: str):
    for p in Path('.').rglob('*'):
        if query.lower() in p.name.lower():
            print(f"Found: {p}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        search(sys.argv[1])