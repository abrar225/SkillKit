# SkillKit host verification

The pilot covers portfolio creation, feature improvement, and release preparation. Automated tests validate the planner and MCP contract. Live host trials check whether an agent sees the project rule, calls MCP on its own, and completes the work with evidence.

## Trial method

- Codex CLI 0.154.0 used the same configured model (`gpt-6-astra`) for fresh SkillKit and baseline sessions. Each pair used the same fictional brief, starter files, model, tool permissions, and acceptance checks. The SkillKit arm received the generated project rule and stdio configuration. The baseline had neither. Host-installed skills remained available to both.
- The portfolio brief asked for three case studies, a contact link, responsive layout, and keyboard focus. The feature brief asked for local product search while preserving the original data and URL. The release brief asked for readiness evidence and rollback instructions from a loopback-only staging fixture. No brief authorized an external deployment.
- We inspected MCP tool-call events for activation and workflow IDs. We independently ran the fixture’s available tests after each run. Fixture tests cover the requested functional artifacts. They do not establish visual quality or generalize to other projects and models.
- Claude Code 2.1.212 did not have an authenticated Anthropic session when checked with project-only settings. The default profile points to a third-party endpoint. No fixture prompt was sent there. The Claude Code baseline and SkillKit trials remain unverified.

## Automated checks

The catalog validator, 58 Node tests, 19 Python tests, and 3 website tests passed. The website build generated 204 pages. `node bin/vibe-skills.js mcp-check` verified the discovery of the local tools and a structured portfolio route over stdio.

## Codex results

All three SkillKit sessions called `recommend_workflow` without a reminder and retrieved instructions through MCP. The recorded routes were `new-web-project`, `feature → testing`, and `release`. No deployment stage was selected.

| Task | SkillKit | Baseline |
| :--- | :--- | :--- |
| Portfolio | Built the site, loaded four distinct skills and a test example, and saved a check record. Fixture test passed. Browser interaction remained unverified. | Built the site and passed the same fixture test. Browser interaction remained unverified. |
| Product search | Implemented case-insensitive search and passed six tests. The agent requested clarification about the URL requirement because the fixture lacked a URL contract. | Implemented URL-based search using a query parameter and passed six tests. It made that interface choice without asking. |
| Release preparation | Chose readiness only. Wrote release evidence and rollback guidance. The fixture test passed, and the agent recorded its blocked loopback smoke check. | Wrote release evidence and rollback guidance. The fixture test passed, and the agent reported the same loopback restriction. |

The separate loopback smoke check passed outside the agent sandbox. That result does not replace the blocked check inside either agent session. No deployment was performed. The runs establish automatic consultation in this Codex setup. They do not establish a general improvement in output quality or fewer user interventions. The two-host release criterion remains open until Claude Code is tested with an authorized provider configuration.
