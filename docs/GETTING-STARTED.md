# Getting Started

The repository is a catalog plus a CLI. Skills live in `skills/<domain>/<skill>/`, the generated index is `registry/skills.json`, and `bin/vibe-skills.js` browses, searches, scans, validates, and exports them.

Nothing here needs a build step or install to read. The CLI runs on Node 18 or newer and has no dependencies.

## Start with a task

Connect MCP and give your agent a normal task brief, or run the CLI router directly. [Setup and worked examples](WORKFLOWS.md).

```bash
node bin/vibe-skills.js recommend "Design my portfolio website" --workflow new-web-project
```

## Browse

```bash
node bin/vibe-skills.js stats                 # totals and license breakdown
node bin/vibe-skills.js domains               # 14 domains with counts
node bin/vibe-skills.js list                  # every skill, grouped
node bin/vibe-skills.js list engineering-ops  # one domain
node bin/vibe-skills.js list --featured       # the curated shortlist
```

## Search

```bash
node bin/vibe-skills.js search "dead code"
node bin/vibe-skills.js search playwright
node bin/vibe-skills.js info engineering-ops/code-review
```

Search covers skill IDs, names, descriptions, and capabilities, then repeats the query against the resource catalog.

For agent integrations, `search <query> --json` always returns an object with `query`, `skills`, and `resources`. Both result arrays are present even when empty; resource matches are included in JSON as well as human-readable output.

## Recommend skills for a project

```bash
cd ~/code/my-app
node ~/Desktop/SkillKit/bin/vibe-skills.js scan
```

`scan` reads `package.json`, selected framework and project config files. It recommends skills that exist in this registry, and prints the export command for the list.

## Install into an agent

Skills are plain directories with a `SKILL.md`, so installing means placing the directory where your agent looks for skills.

| Agent | Default location | Command |
| :--- | :--- | :--- |
| Claude Code | `.claude/skills/` | `node bin/vibe-skills.js export --target claude` |
| Cursor | `.cursor/skills/` | `node bin/vibe-skills.js export --target cursor` |
| Antigravity project | `.agents/skills/` | `node bin/vibe-skills.js export --target antigravity` |
| Agents CLI convention | `.agents/skills/` | `node bin/vibe-skills.js export --target agents` |

Export copies into the current directory unless you pass `--out`:

```bash
node bin/vibe-skills.js export --target claude --ids orchestrator/gravitas,engineering-ops/tdd --out ~/code/my-app
```

Existing directories are compared with the catalog. Exact copies are retained and verified; differing directories are skipped without being counted as verified installs. Pass `--force` to replace a selected directory completely, including removing obsolete files. Unrelated skill directories are preserved. Exports reject symlink destinations and source/destination overlap.

Every export writes a version 2 `vibe-skills.export.json`. Its `skills` array lists only tracked directories whose names, file types, permissions, and bytes match the current catalog. Earlier tracked installs are rechecked and preserved in that list when they still match. `verified` records their SHA-256 tree digests; `requestedSkills`, `written`, `retained`, `skipped`, and `unverified` distinguish this run's selections and results from verified installed contents. The manifest describes the check at export time; later user edits can change those contents. Pass `--json` to receive the same manifest on stdout.

You can also copy a single skill by hand:

```bash
cp -R skills/engineering-ops/tdd ~/code/my-app/.claude/skills/
```

## Verify the catalog

```bash
python3 scripts/build-registry.py   # regenerate from disk
npm run validate                    # fail on drift, broken paths, bad URLs
npm run docs                        # regenerate docs/SKILLS.md, docs/RESOURCES.md, notices
```

`validate` exits non-zero when a registry entry points at a missing directory, `SKILL.md` is missing, a `SOURCE.json` is absent, IDs or display names collide, counts disagree with disk, or a resource URL is not HTTPS. Warnings cover unverified licenses, a skill without frontmatter, and duplicate upstream names that are disambiguated in the registry.

## Read a skill correctly

Load only the `SKILL.md` needed for the task. Many skills have supporting folders (`references/`, `rules/`, `scripts/`, `templates/`, `prompts/`) that the skill body points at. Read those only when the body tells you to.

The frontmatter `description` is the activation contract. If a request does not match it, the skill is probably the wrong tool.
