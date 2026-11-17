# Repository Structure

```
Skills/
├── bin/vibe-skills.js          CLI: list, search, info, domains, resources, scan, validate, export, stats
├── registry/
│   ├── skills.json             generated index of every skill on disk (source of truth for tooling)
│   ├── domains.json            the 14-domain taxonomy with counts and flagship skills
│   └── resources.json          generated aggregate of every resource entry
├── resources/*.json            hand-curated resource sources, one file per category
├── skills/<domain>/<skill>/    vendored or original skills, each with SKILL.md and SOURCE.json
├── scripts/
│   ├── import-manifest.json    reproducible source-to-destination map for every vendored skill
│   ├── import-skills.py        clones upstream repos, copies skills verbatim, writes SOURCE.json
│   ├── build-registry.py       regenerates the three registry files from disk
│   ├── build-docs.js           regenerates docs/SKILLS.md, docs/RESOURCES.md, THIRD_PARTY_NOTICES.md
│   └── validate-registry.js    checks registries against disk, licenses, counts, and URLs
├── docs/                       human documentation plus generated catalogs
├── templates/skill-template/   starter files for a new original skill
├── AGENTS.md                   operating rules for agents working in this repo
├── CLAUDE.md                   Claude Code entry point
├── .cursorrules                Cursor entry point
└── THIRD_PARTY_NOTICES.md      upstream projects, commits, licenses, and unverified entries
```

## What counts as a skill

A skill is a directory containing `SKILL.md`. The file starts with YAML frontmatter and usually carries `name` and `description`, sometimes `license` and other metadata. The body is the instruction set the agent loads.

Supporting files are optional and stay inside the skill directory:

| Folder | Purpose |
| :--- | :--- |
| `references/` | long-form source material the skill points at |
| `rules/` | granular rule files loaded on demand |
| `scripts/` | executable helpers the skill tells the agent to run |
| `assets/` | images, fonts, or fixtures |
| `templates/`, `prompts/` | scaffolds and prompt fragments |
| `evals/` | test assertions, present only in some original skills |

`SOURCE.json` is required in this repository and is not part of the upstream skill format. It records origin, license, upstream repository, path, and commit. The build script fails without it.

## What counts as a resource

Resources are links, not vendored code. Each entry in `resources/*.json` has an `id`, `name`, `url`, `type`, `pricing`, `license`, `description`, `why`, and `tags`. The build script adds `category` from the filename and refuses entries without `id` or `url`.

Resources exist for material that cannot be vendored responsibly: paid products, unlicensed repositories, living documentation, and tools that change faster than a copy would.

## The 14 domains

| Domain | Scope |
| :--- | :--- |
| `orchestrator` | Routing, requirements grilling, multi-agent coordination, context control, reliability rules |
| `planning` | PRDs, specs, tickets, implementation plans, brainstorming |
| `architecture` | Codebase design, domain modeling, ADRs, interface boundaries, knowledge graphs |
| `engineering-ops` | TDD, debugging, review, verification, migrations, performance, dead-code cleanup |
| `ui-ux` | Visual hierarchy, design tokens, accessibility, motion, critique |
| `frontend` | React, Next.js, Three.js, browser APIs, performance |
| `mobile` | Flutter, React Native, SwiftUI |
| `backend-api` | API contracts, MCP servers, Postgres, ORMs, dbt |
| `security-bug-bounty` | Security review, hardening, reverse engineering, recon |
| `automations` | Browser control, web app testing, DevTools inspection |
| `scraping-leads` | Search visibility, lead enrichment, cold outreach |
| `social-media` | Human-sounding writing, platform formatting, publishing |
| `media` | Programmatic video, motion design, canvas, generative art |
| `agent-tooling` | Skills, hooks, rules, subagents, agent CLI configuration |

Domains are declared once in `scripts/build-registry.py`. Adding one means adding an entry there and a directory under `skills/`, then rebuilding.

## Generated versus handwritten

Generated and safe to overwrite:

- `registry/skills.json`, `registry/domains.json`, `registry/resources.json`
- `docs/SKILLS.md`, `docs/RESOURCES.md`
- `THIRD_PARTY_NOTICES.md`

Handwritten and safe to edit:

- everything under `skills/` (treat vendored skills as read-only)
- `resources/*.json`
- `docs/GETTING-STARTED.md`, `docs/STRUCTURE.md`, `docs/ADDING-A-SKILL.md`, `docs/ADDING-A-RESOURCE.md`, `docs/LICENSING.md`
- `README.md`, `AGENTS.md`, `CLAUDE.md`, `.cursorrules`
- `bin/`, `scripts/`, `templates/`
