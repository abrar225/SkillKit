# Adding a Resource

Resources are developer-relevant links that cannot be vendored: paid products, unlicensed repositories, living docs, tools, datasets, and collections. They live in `resources/<category>.json` and are indexed into `registry/resources.json`.

## When a resource is the right call

Use a resource entry instead of a skill when:

- the license is missing, unclear, or non-permissive
- the content is paid, or only a free sample is available
- it is a tool, service, or site rather than an instruction set
- it changes often enough that a copy would mislead

Do not add a resource to pad a category. An entry needs a reason to exist and a reason someone would open it.

## Entry schema

```json
{
  "id": "unique-kebab-case-id",
  "name": "Display Name",
  "url": "https://example.com/resource",
  "type": "article | tool | skill | skill-registry | docs | course | dataset | product | video | newsletter | book",
  "pricing": "free | freemium | paid | free-sample",
  "license": "MIT, CC0-1.0, commercial, or a short description",
  "description": "What it is, in one or two sentences.",
  "why": "Why a developer or agent should care.",
  "install": "optional command, if the resource is installable",
  "tags": ["short", "lowercase", "tags"]
}
```

Notes:

- `category` is added by the build script from the filename. Do not set it by hand.
- `id` must be unique across every file, not just the current one.
- `url` must be `https://`. Validation rejects anything else.
- `type` and `license` should be present. Missing values produce warnings, not failures.

## Categories

| File | Category ID | Scope |
| :--- | :--- | :--- |
| `resources/agent-workflows.json` | `agent-workflows` | Skills ecosystems, agent orchestration, MCP, skill authoring |
| `resources/planning-docs.json` | `planning-docs` | PRDs, specs, planning frameworks, documentation practice |
| `resources/architecture-code-quality.json` | `architecture-code-quality` | Architecture references, code quality, dead code, testing |
| `resources/design-ui.json` | `design-ui` | Design systems, UI critique, motion, typography |
| `resources/frontend.json` | `frontend` | React, Next.js, performance, browser platform |
| `resources/backend-data.json` | `backend-data` | Databases, ORMs, APIs, data pipelines |
| `resources/mobile.json` | `mobile` | Flutter, React Native, native platforms |
| `resources/security.json` | `security` | Security research, recon, vulnerability references |
| `resources/automation-scraping.json` | `automation-scraping` | Browser automation, scraping, lead generation |
| `resources/media-video.json` | `media-video` | Video tooling, motion, generative media |
| `resources/learning-reference.json` | `learning-reference` | Curated learning paths and reference material |

To add a category, create the JSON file and add its ID and title to the `CATEGORY_TITLES` map in `scripts/build-registry.py` if a nicer title than the filename is needed.

## Steps

1. Add the entry to the correct array.
2. Check the URL resolves before committing. Do not record a URL you have not opened.
3. Rebuild and validate:

```bash
python3 scripts/build-registry.py
npm run validate
npm run docs
```

4. Confirm the rendered row: `node bin/vibe-skills.js resources <category> <query>`.

## Quality bar

- One solid entry beats five thin ones.
- The `description` explains the content; the `why` explains the use.
- Prefer the canonical source over an aggregator.
- If the resource is a skill you could vendor, vendor it and skip the resource entry.
- If the resource is paid, say so in `pricing` and never copy its content into the repository.
