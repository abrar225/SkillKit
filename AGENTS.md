# AGENTS.md — Operating Rules

This repository is a curated library of agent skills and developer resources. It is also a working tool: the registries, CLI, and docs are generated from what is on disk and validated against it.

Maintained by Abrar Akhunji.

## 1. Core invariants

1. **Ground before mutating.** Read the target file, its `SOURCE.json`, and the registry entry before editing. Never act on assumed state.
2. **Stay in scope.** Edit only files related to the task. Vendored instructions are read-only; restore or update them only through the pinned importer, without editorial changes. Do not create original skills. The explicitly authorized six-document source extraction is the exception.
3. **Completion requires evidence.** Run `npm run validate` after any change to `skills/`, `resources/`, or `registry/`. A task is not done because the edit applied.
4. **No invented success.** If a command was not run, say it was not run. If a URL was not checked, say it was not checked.
5. **Human voice.** Write plainly. No filler, no robotic symmetry, no em dash chains.

## 2. Where things live

| Path | Contents |
| :--- | :--- |
| `skills/orchestrator/` | Routing, grilling, multi-model councils, context control, reliability rules |
| `skills/planning/` | PRDs, specs, tickets, plans, brainstorming, the 6-docs workflow |
| `skills/architecture/` | Codebase design, domain modeling, ADRs, interfaces, knowledge graphs |
| `skills/engineering-ops/` | TDD, debugging, review, verification, migrations, performance |
| `skills/ui-ux/` | Layout, design systems, typography, motion, critique |
| `skills/frontend/` | React, Next.js, Three.js, browser APIs |
| `skills/mobile/` | Flutter, React Native, SwiftUI |
| `skills/backend-api/` | Postgres, Supabase, Neon, Prisma, dbt, MCP |
| `skills/security-bug-bounty/` | Security review, hardening, reverse engineering |
| `skills/automations/` | Browser agents, web app testing, DevTools |
| `skills/scraping-leads/` | Search visibility, enrichment, cold outreach |
| `skills/social-media/` | Writing and publishing workflows |
| `skills/media/` | Video, motion, canvas, generative art |
| `skills/agent-tooling/` | Skills, hooks, rules, subagents, CLI configuration |
| `workflows/routes.json` | Curated task paths composed from existing skill and resource IDs |
| `lib/` | Shared routing, supporting-file access, and project export layouts |
| `registry/` | Generated indexes: `skills.json`, `domains.json`, `resources.json` |
| `resources/` | Hand-curated resource sources, one file per category |
| `scripts/` | Import, registry build, docs build, validation |
| `bin/vibe-skills.js` | CLI: list, search, info, domains, resources, scan, validate, export, stats |
| `docs/` | Guides plus generated catalogs |

For agents consuming the library for another project, start with `find_kit` or the compact `llms.txt` task map. The rules below apply to maintaining SkillKit.

## 3. Working protocol

1. **Triage.** For a developer task, call `recommend_workflow` with the existing brief and structured intent, or use `node bin/vibe-skills.js recommend "<task>" --workflow <id>`. Use focused catalog search when no curated route fits.
2. **Grill ambiguity.** If the request leaves a consequential decision open, ask focused questions one at a time. Use `skills/orchestrator/grill-me` when the decision is architectural.
3. **Load narrowly.** Read the one `SKILL.md` the task needs, plus the supporting files its body points at. Do not load the repository into context.
4. **Check provenance.** Before reusing or modifying a skill, read its `SOURCE.json`. `origin: upstream` means read-only. `origin: local-original` means the content belongs to this repository.
5. **Verify.** Run the commands in section 4. Report what passed and what did not.

## 4. Commands

```bash
node bin/vibe-skills.js recommend "<task>" --workflow <id> # task stages, skills, resources, and checks
node bin/vibe-skills.js stats            # totals and license breakdown
node bin/vibe-skills.js search "<term>"  # skills and resources
node bin/vibe-skills.js info <id>        # one skill, with provenance
node bin/vibe-skills.js scan <dir>       # recommend skills for a project
node bin/vibe-skills.js validate         # registry-vs-disk check
node bin/vibe-skills.js export --target <claude|cursor|antigravity|agents> (--ids ... | --all)

python3 scripts/build-registry.py        # regenerate registries from disk
node scripts/build-docs.js               # regenerate catalogs and notices
python3 scripts/import-skills.py         # import newly listed upstream skills
```

Order matters: import or edit first, then `build-registry.py`, then `validate`, then `build-docs.js`.

## 5. Adding things

- **Vendored skill.** Add the repo, license, and paths to `scripts/import-manifest.json`, run `import-skills.py`, rebuild, validate. Never edit the copied files. See `docs/ADDING-A-SKILL.md`.
- **Original skill.** Do not author new skills. Existing legacy local copies retain their provenance. Only the explicitly requested six-document page may be packaged as an attributed source extraction.
- **Resource.** Add an entry to the matching `resources/*.json` with `id`, `name`, `url`, `type`, `pricing`, `license`, `description`, `why`, `tags`. HTTPS only. See `docs/ADDING-A-RESOURCE.md`.
- **Domain.** Add it once in `scripts/build-registry.py`, create `skills/<domain>/`, rebuild.

## 6. What validation enforces

Errors include full registry/source drift, missing directories or entry points, provenance disagreement with the pinned manifest, invalid commit/path metadata, changed upstream content or executable bits, missing inherited notices, unrecorded upstream files, ID/display-name collisions, count mismatches, and invalid resource URLs.

Warnings: unverified or missing license, skill without frontmatter, duplicate upstream name handled by `displayName`, missing resource metadata.

Warnings are disclosed, not suppressed. The 53 unverified licenses are catalogued in `THIRD_PARTY_NOTICES.md`.

## 7. Multi-agent entry points

- **Claude Code:** `CLAUDE.md`
- **Cursor:** `.cursorrules`
- **Antigravity:** `.agents/skills/<skill>/SKILL.md` within the project
- **Skills CLI:** install from the repository with the convention documented in `vercel-labs/skills`

All of them should point back to this file rather than restating it.
