<div align="center">

# SkillKit

### Better instructions. Better builds.

A curated toolkit for people who build with AI agents.
Find a skill, inspect its source, and bring it into your next project.

**192 skills · 14 domains · 157 developer resources**

[Explore the catalog](docs/SKILLS.md) · [Browse resources](docs/RESOURCES.md) · [Get started](docs/GETTING-STARTED.md) · [Source & licensing](docs/LICENSING.md)

</div>

---

## From “how do I do this?” to a skill you can use

SkillKit brings planning, engineering, design, security, automation, and media workflows into one searchable library. Every vendored skill has a source repository, pinned commit, and provenance file so you can inspect what you install.

- **Search by the work.** Find skills by task, domain, or capability.
- **Inspect before installing.** Read the full instructions, supporting files, source, and license.
- **Use your agent.** Export to Claude Code, Cursor, Antigravity, or the `.agents/skills` convention.
- **Connect through MCP.** Let your agent search the catalog and read instructions through a local stdio server.

## Your first skill in a minute

Requires Node.js 18+ for the dependency-free CLI. The optional MCP server and test dependencies require Node.js 20+.

```bash
git clone https://github.com/abrar225/SkillKit.git
cd SkillKit

node bin/vibe-skills.js search "code review"
node bin/vibe-skills.js info engineering-ops/code-review

# Install into your project's Claude Code skills directory.
node bin/vibe-skills.js export --target claude \
  --ids engineering-ops/code-review --out ~/code/my-app
```

Choose `--target cursor`, `--target antigravity`, or `--target agents` for another agent. Existing differing installs are skipped; use `--force` only when you intend to replace them.

## Let the project tell you what it needs

```bash
node bin/vibe-skills.js scan ~/code/my-app
node bin/vibe-skills.js domains
node bin/vibe-skills.js list --featured
node bin/vibe-skills.js resources
node bin/vibe-skills.js stats
```

`scan` recommends catalog entries based on project files. Review the suggestions, then run the export command it prints.

## Give your agent a workflow

Connect the local MCP server, then describe the work in your own words. For example, “Design my portfolio website with three case studies and a contact page.” The coding agent interprets the brief in context. SkillKit validates the intent and returns source-traceable skills, resources, and checks for each applicable step.

```bash
npm ci
node bin/vibe-skills.js mcp-config                 # JSON for stdio clients
node bin/vibe-skills.js mcp-config --target codex    # TOML for Codex
node bin/vibe-skills.js agent-rule                 # paste into project instructions
```

Use the project instruction when you want your agent to consult SkillKit on normal requests. Start a new chat after configuring the server. Clients vary in how they expose MCP server instructions and prompts.

Try the same router locally without setting up MCP.

```bash
node bin/vibe-skills.js recommend "Design my portfolio website" --workflow new-web-project --json
```

See [client setup and example workflows](docs/WORKFLOWS.md).

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
