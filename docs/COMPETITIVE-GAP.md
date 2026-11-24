# SkillKit competitive audit

Reviewed 24 November 2026. The starting implementation is commit `99a5430`. The ratings in the preceding review were a product judgment. The following are documented capabilities, gaps and experiments. Ranking first would require a comparable independent evaluation.

| Alternative | Capability the starting implementation lacks | Smallest testable response |
| --- | --- | --- |
| skills.sh and vercel-labs/skills | A large searchable network, shareable packs, a published CLI and one-off use of an individual skill | Index verified upstream pointers. Measure specialist coverage separately from the number of records. [CLI](https://github.com/vercel-labs/skills), [packs](https://www.skills.sh/docs/packs) |
| obra/superpowers | An integrated implementation methodology with named transitions between design, plans, tests and review | Give the agent an entry condition and an observable check for each selected stage. Test whether the checks improve output. [Workflow](https://github.com/obra/superpowers#the-basic-workflow) |
| Tessl | Built-in baseline-versus-treatment task evaluations and repeatable team workflows | Run paired tasks with identical briefs, model and rubric. Publish losses and ties alongside wins. [Evaluation method](https://docs.tessl.io/support/faqs#how-does-tessl-evaluate-skills) |
| SkillsMP | Large-scale indexed discovery, including occupation, language and creator filters, plus a documented search API | Use its permitted API as a bounded candidate source. Verify licenses, commits and content independently before delivery. [API](https://skillsmp.com/docs/api) |
| rohitg00/SkillKit | Owns the established unscoped CLI identity, translates between agent formats, and recommends from project context | Retain the scoped package, offer a manifest and selective reads, and test known-stack constraints. [Repository](https://github.com/rohitg00/skillkit) |

## Repository audit and cleanup decisions

| Area | Decision and evidence |
| --- | --- |
| CLI, stdio MCP, HTTP server and private Next.js application | Keep. Each is an exercised entry point. Put policy and selection in shared library calls. |
| Legacy workflow command and project scanning | Keep for compatibility with existing users and CLI tests. Apply the same delivery limits. |
| Earlier template under templates/skill-template | Delete the three tracked placeholders already removed in the reviewed worktree. Repository rules forbid authoring new original skills. |
| Agent instructions | Keep AGENTS.md authoritative. CLAUDE.md and .cursorrules were reduced to pointers in the preceding implementation. |
| skills, registry, resources, inherited licenses, import scripts and catalog checks | Keep. The validator checks source files, snapshot integrity and generated metadata. Catalog size alone is insufficient reason to delete material. |
| site/components/mcp/AgentSimulator.tsx, McpSection.tsx, McpConnectModal.tsx and site/components/hero/HeroSection.tsx | Retire the unreachable old demo, clone-first dialog and demo hero after checking import references at cleanup. The live pages use IntegrationPage and KineticHero. Website source is separately maintained and ignored by the public repository. |
| Pre-existing deletion of LANDING_PAGE_PROMPT.md | Leave to its owner. It predates the reviewed platform implementation. |
| Ignored dependency and build directories | Keep local runtime state out of commits. Deleting these would increase rebuild work without affecting users' downloads. |

## Measurement plan

Freeze a baseline implementation and labeled briefs before feature work. Reserve 40 unseen briefs through the final candidate freeze. Compare useful recommendations, false readiness, constraints, clarification, payload size and retrieval time. Run a separate paired evaluation of generated artifacts. A local routing test alone cannot establish improved outcomes on a commercial chat host.
