# CLAUDE.md

Entry point for Claude Code. Read `AGENTS.md` first; it holds the invariants and the working protocol. This file only maps them to commands.

## Orientation

- Catalog: `docs/SKILLS.md`. Resources: `docs/RESOURCES.md`. Structure: `docs/STRUCTURE.md`.
- The source of truth for tooling is `registry/skills.json`, generated from disk. Do not hand-edit registry files.
- Skill directories are `skills/<domain>/<name>/`. Every one has `SKILL.md` and `SOURCE.json`.

## Commands

```bash
node bin/vibe-skills.js search "<term>"
node bin/vibe-skills.js info <domain>/<skill>
node bin/vibe-skills.js scan .                  # recommend skills for this project
node bin/vibe-skills.js export --target claude --ids <ids>

python3 scripts/build-registry.py
npm run validate
npm run docs
```

## Rules

1. Load only the `SKILL.md` relevant to the current task, then the files it references.
2. Treat any skill with `"origin": "upstream"` in `SOURCE.json` as read-only. Changes go upstream.
3. After adding a skill or resource, run `build-registry.py`, then `validate`, then `build-docs.js`. Do not claim completion before that passes.
4. Do not invent catalog entries, counts, or licenses. Read them from the registry.
5. Keep responses short and evidence-based. If something was not verified, say so.
