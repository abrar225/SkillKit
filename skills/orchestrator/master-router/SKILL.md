---
name: master-router
description: Route a developer's task to SkillKit workflows, skills, resources, and verification steps. Use when starting a build, planning a change, reviewing work, or preparing a release with SkillKit.
---

# Master Router

Read the existing conversation and relevant project context. Identify the requested actions, project state, deliverables, known stack, and any constraints. Use the action IDs listed in the MCP tool schema. For example, adding to a portfolio is `feature`, writing its README is `documentation`, and creating the first site is `new-web-project`.

1. Call MCP `recommend_workflow` with the original `task` and your structured `intent`. Use `release` for preparation and include `deploy` only when requested. Preserve explicit deployment and implementation restrictions.
2. If the user supplied no actual work, ask what they want to do. If a decision would materially change the result, ask one question and retain the earlier answers when resubmitting the intent. When a known task has no curated workflow, submit an empty action list with the deliverables so SkillKit can rank relevant catalog entries.
3. Load each applicable skill by exact ID with `get_skill` and follow the references needed for that stage with `read_skill_file`. Use a fallback suggestion only when it fits the task and the host can use it.
4. Follow project rules and permissions. Stage recommendations do not authorize installation, deployment, or external actions. Report each applicable check as passed, failed, or skipped with a concrete reason and evidence.

From a local checkout, use `node bin/vibe-skills.js recommend "<task>" --workflow <id> --json` for one explicit workflow, or `--intent-json` for ordered actions and constraints. A raw brief alone returns choices.
