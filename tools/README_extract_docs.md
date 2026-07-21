# Documentation Extraction Utility

## Purpose
This tool parses exported conversation files and splits them into individual, production-ready markdown documents based on header identifiers.

## Execution
Run the following command from the repository root:

python3 tools/extract_docs.py

## Logic
- Scans `docs/` for `Pasted*.md` and `*.conversation.md`.
- Supports explicit "Filename:" blocks or standard Markdown H1 headers.
- Implements version control: only overwrites if the source file is newer.
- Generates a full extraction report and file inventory in `docs/generated/`.