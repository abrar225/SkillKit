# Use SkillKit from your coding agent

Tell your agent what you want to build, change, or check. The agent interprets your request and supplies structured intent. SkillKit validates that intent and recommends an ordered set of stages with the relevant skill IDs, resource links, and verification steps. The agent can read them over MCP while working in your project.

## Connect once

Clone SkillKit and run these commands inside its checkout. Use Node.js 20 or newer for the MCP server.

```bash
npm ci
node bin/vibe-skills.js mcp-config
node bin/vibe-skills.js mcp-check
```

The generated configuration uses the absolute Node executable and server paths. Merge its `skillkit` entry into your existing settings. The command prints settings to stdout.

- **Cursor** uses `.cursor/mcp.json` for project settings. [Cursor MCP documentation](https://cursor.com/docs/mcp)
- **Claude Code** supports a project `.mcp.json`. Alternatively, register the entry with `claude mcp add --transport stdio skillkit -- <absolute-node-path> <absolute-server-path>`. Claude Desktop uses its local MCP configuration file. [Claude Code MCP documentation](https://code.claude.com/docs/en/mcp)
- **Antigravity** accepts the JSON in its MCP settings. The workspace file is `.agents/mcp_config.json` on supported surfaces. [Antigravity MCP documentation](https://antigravity.google/docs/mcp)
- **Codex** uses TOML. Run `node bin/vibe-skills.js mcp-config --target codex` and merge the generated table into the appropriate Codex config. [Codex MCP documentation](https://developers.openai.com/codex/mcp)

The check starts the local server over stdio and verifies its tools and a portfolio routing call. Reload the MCP servers or start a new session. Verify that your host lists `recommend_workflow`, `get_skill`, and `read_skill_file`. If the server cannot start, run `npm ci` in the checkout and check that the generated paths exist on the machine where your agent runs.

To make consultation part of ordinary tasks, run `node bin/vibe-skills.js agent-rule` and add the output to the target project's agent instructions, such as `AGENTS.md`, `CLAUDE.md`, or a Cursor project rule. The server also advertises the same guidance and a `skillkit_start` prompt. Whether a host uses the server instructions automatically depends on the client. If your host omits them, the project rule or explicit start prompt supplies the instruction.

## Build a portfolio

Tell your agent, “Design my portfolio website with three project case studies and a contact page. Use the existing stack.”

The route starts with a brief, then selects frontend design, incremental implementation, and browser testing. It includes references such as MDN and Playwright. The design should reflect the actual work, audience, and content. A useful review checks hierarchy, mobile layout, navigation, keyboard behavior, and the contact flow. Add your actual copy and images as they become available. Keep the spec proportional to the site.

```bash
node bin/vibe-skills.js recommend "Design my portfolio website with three case studies" --workflow new-web-project --json
```

## Improve an existing feature

Tell your agent, “Add a filter to the existing product list and preserve the current URL behavior.”

The route starts with the existing feature boundary, proceeds through an implementation slice, and ends with verification. The agent should read project conventions and test the normal flow, empty results, and preservation of the URL behavior. A reported failure such as “Fix the checkout crash when the cart is empty” selects debugging before implementation.

## Prepare a release

Tell your agent, “Prepare the portfolio for a staging release and run smoke tests.”

The agent should identify the delivery target, run the project checks, and document the candidate revision, health checks, and rollback procedure. Keep the release preparation separate from any production action requiring authorization. A request that explicitly combines building and deploying can return both workflows.

## When the brief is incomplete

If the user supplied only a role or hasn’t stated a task, the router asks what they want to do. For a vague request, it can return one focused clarification. The agent should reuse the original brief and the answer together. When the purpose is clear and the catalog has no curated route, send an empty action list with the deliverables and topics. SkillKit returns up to three relevant skills and three resources, or an empty list when the catalog has no fit.

## Structured intent

The host sends the current brief and intent together. The brief records the user’s words. Workflow selection uses the actions the host understood from the conversation and project context.

```json
{
  "task": "Plan and build my portfolio site. Do not deploy.",
  "intent": {
    "actions": ["plan", "new-web-project"],
    "projectState": "new",
    "deliverables": ["A short plan", "A portfolio with three case studies"],
    "stack": ["Next.js"],
    "constraints": ["no-deployment"]
  }
}
```

`actions` preserves the requested order. `release` selects readiness checks. `deploy` adds the delivery stage only when permitted. `design-only` and `no-implementation` restrict changes. Pass short `topics` for relevant references, such as `motion` or `api`. Use `unresolvedDecision` for a single question arising from missing information.

A raw brief alone returns choices. Pass `--workflow <id>` to the standalone CLI for an explicit choice, or use `--intent-json` for a structured request. The three pilot workflows are portfolio, feature improvement, and release preparation. Other catalog workflows are available and marked separately. See the [host trial record](HOST-VERIFICATION.md) for the current level of evidence.

## Read and install skills

Use `get_skill` for the full instructions, provenance, and a preview of supporting file paths. Use `read_skill_file` for a referenced text file under that skill. Its response is limited to 64 KiB. Larger references and executable assets can be read or run from a local checkout when the task authorizes it.

For host-native activation, review export plans and any reported folder or frontmatter issues. The workspace layout for Antigravity is `.agents/skills`. Prior project exports under `.gemini/config/skills` can be exported again to the new destination as needed. Catalog folders and original instructions are preserved, so an entry that fails a host's native layout requirements can still be retrieved by exact ID over MCP. Some skills also depend on tools available only in certain hosts.

## Maintain the routing

Edit `workflows/routes.json` to adjust the stages or contextual skill additions. The CLI and MCP both use the same file. Use existing catalog IDs and choose the smallest set of skills that covers the work. Keep stack-specific recommendations conditional. Add or update examples in the Master Router's evaluation file when behavior changes. `npm run validate` checks references against the registry, and `npm test` runs the route cases and the MCP integration test.
