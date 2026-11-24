# Cleanup log

Reviewed on 24 November 2026 against the cleanup decisions in docs/COMPETITIVE-GAP.md.

| Removed | Reason |
| --- | --- |
| templates/skill-template/SKILL.md | Placeholder for authoring original skills, which the repository rules prohibit. |
| templates/skill-template/metadata.json | Sole consumer was the removed original-skill template. |
| templates/skill-template/evals/eval.json | Empty example evaluations for that template. |
| Private site components/mcp/McpConnectModal.tsx | The unused dialog directed users through the retired connection flow. |
| Private site components/mcp/McpSection.tsx and AgentSimulator.tsx | No live page imported the section, which was the only user of the simulator. The live task page calls the engine. |
| Private site components/hero/HeroSection.tsx | The active homepage imports KineticHero. No active component imported this earlier hero. |

The website is maintained outside the public Git tree. Its source changes and build are local to the private checkout. CLAUDE.md and .cursorrules already refer to AGENTS.md. The unrelated deletion of LANDING_PAGE_PROMPT.md was left unstaged. No vendored instruction bytes changed.

## Catalog exceptions

Catalog validation passes with 55 explicit warnings across 192 unique skill IDs and 157 resource IDs. The 53 license warnings remain traceable in THIRD_PARTY_NOTICES.md. Those 53 skills, one custom-license entry, and three entries whose pinned frontmatter omits the license claimed in source metadata are metadata-only under the default delivery policy. Confirmed permission or a reviewed upstream update is required to change their status.

The pinned upstream orchestrator/model-council document lacks YAML frontmatter. The index derives the description and preserves the source bytes. Two upstream skills share the frontmatter name code-review. Their fully qualified IDs, engineering-ops/code-review and engineering-ops/anthropic-code-review, and their display names are distinct. Resources use validated JSON records. Rewriting upstream files to silence either warning would invalidate their recorded hashes.
