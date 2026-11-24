# SkillKit

Describe the work to your agent. SkillKit selects a small set of instructions, reference links and checks from **192 skills and 157 resources across 14 domains**. Discovery writes zero files to the consuming project. You can request a single asset or a lockfile.

## Start with one task

From a maintainer checkout, run `node bin/vibe-skills.js use "Redesign my portfolio website"`. A connected agent calls `find_kit`. The first response names the current stage, selected items, and any missing capabilities. Use `explain_match` for decision evidence. For a consuming project, the separate dependency-free CLI talks to an existing server and downloads one asset only on request. [Delivery and setup](docs/DELIVERY.md) · [Routing benchmark](bench/README.md) · [Federated catalog](docs/FEDERATION.md)

## Use it from a chat

Give a browsing assistant this prompt alongside your brief:

> Use SkillKit at https://github.com/abrar225/SkillKit. Read its llms.txt task map, select the route for my deliverable and read the skill for the current stage. Use the linked resources where they fit. I want to redesign my existing portfolio website.

The map works directly from GitHub. Each skill has its own instructions and source record. If a chat cannot open links, the website’s **Find my task kit** page can prepare the selected instructions and links as one copyable handoff. [Agent task map](llms.txt)

## Connect an agent

On a running SkillKit service, copy the **MCP URL** from the integration page into a client that accepts remote Streamable HTTP. Give the agent a task and ask it to call `find_kit`. The server returns skill IDs, resource purposes, pricing and checks. The agent retrieves instructions and supporting text as needed. Discovery and reading write zero files to the consuming project.

A portfolio redesign starts with frontend design and UI refactoring. A brief that identifies React can add React-specific implementation guidance. A print brief can return a partial kit if a native format or verified instruction is missing. A footage trim can use FFmpeg on its own. An ambiguous format prompts a focused question.

## Try it from this checkout

```bash
node bin/vibe-skills.js find "Redesign my portfolio website in React"
node bin/vibe-skills.js find "Create a print poster using only free resources" --json
node bin/vibe-skills.js find "Trim my interview footage"
```

The CLI runs with Node.js 18+. To host MCP locally, use Node.js 20+, run `npm ci` once in a separate SkillKit checkout, then `npm run serve`. Use `http://127.0.0.1:3737/api/mcp` from a local client. For cloud clients, the operator must make the service reachable over HTTPS. The standalone server also serves a short web-reader guide at `/llms.txt` and the task API at `/api/kit`. The website adds the interactive finder. [Connection options and examples](docs/WORKFLOWS.md)

## Install a selected skill

Reading a skill over MCP or the web is sufficient for instruction-only use. For fonts, scripts or other assets, choose **Download this skill** on a kit result. Each archive contains one skill folder with its provenance and bundled notices. From a maintainer checkout, you can also export selected IDs to an agent’s native layout:

```bash
node bin/vibe-skills.js export --target claude \
  --ids frontend/frontend-design --out ~/code/my-portfolio
```

Use `--target cursor`, `--target antigravity` or `--target agents` for other layouts. A full-library export requires `--all`. Existing differing installs are skipped unless you pass `--force`. [CLI guide](docs/GETTING-STARTED.md)

## The collection

| Start with | What you will find |
| :--- | :--- |
| [Orchestration](docs/SKILLS.md#orchestrator) & [planning](docs/SKILLS.md#planning) | Requirements, specs, routing, and context management |
| [Engineering](docs/SKILLS.md#engineering-ops) & [architecture](docs/SKILLS.md#architecture) | Debugging, verification, review, and system design |
| [UI/UX](docs/SKILLS.md#ui-ux), [frontend](docs/SKILLS.md#frontend) & [mobile](docs/SKILLS.md#mobile) | Interfaces, motion, React, Three.js, Flutter, and SwiftUI |
| [Backend](docs/SKILLS.md#backend-api) & [security](docs/SKILLS.md#security-bug-bounty) | Data, APIs, MCP, hardening, and reverse engineering |
| [Automation](docs/SKILLS.md#automations), [media](docs/SKILLS.md#media) & [social](docs/SKILLS.md#social-media) | Browser workflows, creative tools, and publishing |
| [Agent tooling](docs/SKILLS.md#agent-tooling) & [search visibility](docs/SKILLS.md#scraping-leads) | Skills, rules, hooks, discovery, and outreach |

## A catalog you can audit

```text
skills/<domain>/<skill>/
├── SKILL.md       Instructions and activation guidance
├── SOURCE.json    Origin, source, pinned commit, and license metadata
└── …              Supporting files supplied by the source
```

Vendored instructions remain byte-for-byte copies of their pinned sources. Generated registries and catalogs describe what is on disk. License status varies by entry: 53 entries have unverified, unknown, or unlicensed status. Check [third-party notices](THIRD_PARTY_NOTICES.md) before reuse.

```bash
npm ci
npm run validate
npm test
npm run verify:upstream  # independently compare pinned source archives
```

Validation currently reports 55 warnings: 53 license-provenance warnings, one missing frontmatter warning, and one disambiguated-name warning. Warnings are disclosed, not hidden.

## Explore further

[Getting started](docs/GETTING-STARTED.md) · [CLI and installation](docs/GETTING-STARTED.md#install-into-an-agent) · [Add a vendored skill](docs/ADDING-A-SKILL.md) · [Add a resource](docs/ADDING-A-RESOURCE.md) · [Licensing](docs/LICENSING.md)

The public repository contains the skill collection, CLI, MCP server, and documentation. The hosted website's implementation is maintained separately and excluded from this repository.

---

Curated and maintained by [Abrar Akhunji](https://github.com/abrar225). Repository-owned code and curation: [MIT](LICENSE). Copied materials retain their source terms.
