#!/usr/bin/env python3
"""Compatibility entry point: verify pinned provenance, never infer authorship.

The old script assigned current HEAD commits to existing files without comparing
bytes, and could overwrite corrected license records. Use the pinned importer
for explicit imports/refreshes. This legacy command is now read-only.
"""
import subprocess
import sys
from pathlib import Path

if __name__ == '__main__':
    command = [sys.executable, str(Path(__file__).with_name('import-skills.py')), '--check', *sys.argv[1:]]
    sys.exit(subprocess.run(command).returncode)
