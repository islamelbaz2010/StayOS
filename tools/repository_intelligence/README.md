# Repository Intelligence Toolkit

A modular Python suite for deep repository analysis.

## Prerequisites
`pip install GitPython rich tqdm pyyaml`

## Execution
Each script can be run independently:
`python3 tools/repository_intelligence/repository_indexer.py`

## Scripts
- **Indexer**: Scans and catalogs assets.
- **Snapshot/Metrics**: Provides structural and volume data.
- **Validator**: Checks for repository hygiene (READMEs, broken links).
- **Graph**: Generates Mermaid diagrams for dependency visualization.