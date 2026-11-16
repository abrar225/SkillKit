# AGENTS.md — Agent-First Operations Protocol

Welcome, Agent. You have entered the **Agent-First Skills Monorepo** maintained by **Abrar Akhunji**.
This repository is an organized collection of battle-tested development skills, evaluation benchmarks, and automation runtimes designed for vibe coders and AI agents.

---

## 1. The Core Invariants (Governed by `/gravitas`)

When operating in this repository or utilizing its skills:
1. **Ground before mutating**: Always read the target file, its tests, and its callers before editing. Never act on assumed state.
2. **Stay in declared scope**: Only edit files directly related to the user's explicit task.
3. **Completion requires evidence**: A task is never "done" until a verifiable test, eval, or runtime check passes *after* the latest edit.
4. **No Hallucinated Success**: If something was not verified via shell or inspect tool, state clearly that it was not checked.
5. **Human Voice**: In documentation and public writing, write naturally. Eliminate AI slop, redundant em dashes, and robotic symmetries.

---

## 2. Orchestration Protocol (Master Router)

Whenever an agent visits this repository or is requested to perform a task:
1. **Step 1: Intent Triage**  
   Match the user request against the Domain Registry (`registry/domains.json` and `registry/skills.json`).
2. **Step 2: Ambiguity Grilling (`/grill-me`)**  
   If the user's prompt leaves critical architectural decisions unresolved, pause and ask targeted multiple-choice questions one at a time.
3. **Step 3: Surgical Skill Injection**  
   Load *only* the specific domain skill required for the task. Do not load the entire repository into context.
4. **Step 4: Verification Against Evals**  
   Verify that the resulting code satisfies the assertions defined in the skill's `evals/eval.json`.

---

## 3. Directory Map

| Path | Purpose |
| :--- | :--- |
| `skills/orchestrator/` | Master routing, intent grilling (`grill-me`), reliability gates (`gravitas`) |
| `skills/ui-ux/` | High-polish UI systems, Framer Motion, Linear dark themes, Refactoring UI |
| `skills/frontend/` | React, Next.js App Router, Astryx components, Three.js WebGL scenes |
| `skills/mobile/` | Flutter architecture, Bloc/Riverpod patterns, Android CLI previews |
| `skills/backend-api/` | PacketLark workbench, HTTP testing, BigQuery dbt, data cleaning |
| `skills/security-bug-bounty/`| Security SAST auditing, protocol reverse engineering, bug bounty recon |
| `skills/automations/` | Headless browser automation, background task schedulers, Firecrawl |
| `skills/scraping-leads/` | Social media data scraping, company enrichment, cold email automation |
| `skills/social-media/` | Human writer, Instagram Reels automation, LinkedIn deep-dives, X threads |
| `skills/engineering-ops/` | Karpathy simplicity rules, Graphify knowledge graphs, TDD |
| `registry/` | Machine-readable JSON indexes (`skills.json`, `domains.json`) |
| `bin/` | Interactive CLI dispatcher (`vibe-skills`) |
| `templates/` | Standard starter scaffolds with eval suites |

---

## 4. Multi-Agent Adaptor Shortcuts
- For **Antigravity**: Skills map to `.gemini/config/skills/<skill-name>/SKILL.md`.
- For **Claude Code**: Refer to `CLAUDE.md` and `.claude/skills/`.
- For **Cursor**: Refer to `.cursorrules` and `.cursor/skills/`.
- For **Skills CLI**: Run `npx skills add abrar225/Skills/<domain>/<skill-name>`.
