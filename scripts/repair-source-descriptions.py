#!/usr/bin/env python3
"""Repair SOURCE.json descriptions from the skill's own SKILL.md frontmatter.

The original import scripts used a single-line regex for `description`, which
turned multiline YAML blocks into "", ">", ">-", "|", or a truncated fragment.
This pass re-parses each SKILL.md with the same robust parser the registry
build uses, then writes the full description into the provenance sidecar.

Usage:
  python3 scripts/repair-source-descriptions.py [--check]

--check reports what would change without writing.
"""
import importlib.util
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKILLS = ROOT / "skills"
REGISTRY = ROOT / "registry" / "skills.json"

PLACEHOLDERS = {"", ">", ">-", "|", "|-"}
MIN_LENGTH = 10


def load_build_registry():
    path = ROOT / "scripts" / "build-registry.py"
    spec = importlib.util.spec_from_file_location("build_registry", path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def clean(value):
    if not isinstance(value, str):
        return ""
    return " ".join(value.split()).strip()


def resolve_description(build_registry, skill_dir, fallback):
    skill_file = skill_dir / "SKILL.md"
    parsed = ""
    if skill_file.is_file():
        text = skill_file.read_text(encoding="utf-8", errors="replace")
        parsed = clean(build_registry.parse_frontmatter(text).get("description", ""))
        if not parsed:
            parsed = clean(build_registry.body_description(text))
    if parsed in PLACEHOLDERS or len(parsed) < MIN_LENGTH:
        parsed = clean(fallback)
    return parsed


def main():
    check_only = "--check" in sys.argv[1:]
    build_registry = load_build_registry()

    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    registry_descriptions = {s["id"]: s.get("description", "") for s in registry["skills"]}

    total = 0
    placeholder_before = 0
    mismatch_before = 0
    updated = 0
    failures = []
    repaired = []

    for source_file in sorted(SKILLS.glob("*/*/SOURCE.json")):
        total += 1
        skill_dir = source_file.parent
        rel = f"{skill_dir.parent.name}/{skill_dir.name}"

        data = json.loads(source_file.read_text(encoding="utf-8"))
        current = clean(data.get("description"))
        desired = resolve_description(build_registry, skill_dir, registry_descriptions.get(rel, ""))

        if current in PLACEHOLDERS or len(current) < MIN_LENGTH:
            placeholder_before += 1
        elif current != desired:
            mismatch_before += 1

        if not desired or desired in PLACEHOLDERS or len(desired) < MIN_LENGTH:
            failures.append((rel, "no usable description found in SKILL.md or registry"))
            continue

        if current == desired:
            continue

        updated += 1
        repaired.append(rel)
        data["description"] = desired
        if not check_only:
            source_file.write_text(
                json.dumps(data, indent=2, ensure_ascii=False) + "\n",
                encoding="utf-8",
            )

    print(f"SOURCE.json files scanned: {total}")
    print(f"Invalid before (empty/placeholder/short): {placeholder_before}")
    print(f"Stale before (differs from SKILL.md): {mismatch_before}")
    print(f"{'Would repair' if check_only else 'Repaired'}: {updated}")
    for rel in repaired:
        print(f"  {'~' if check_only else '+'} {rel}")
    if failures:
        print(f"\nFAILED — {len(failures)} file(s) have no usable description:")
        for rel, reason in failures:
            print(f"  - {rel}: {reason}")
        return 1

    print("OK — every SOURCE.json has a non-empty description." if not check_only else "OK — dry run only.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
