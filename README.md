# Skills

[![Agent-First](https://img.shields.io/badge/Architecture-Agent--First-blue.svg)](AGENTS.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Vibe Coding Ready](https://img.shields.io/badge/Vibe%20Coding-Optimized-purple.svg)](#the-vibe-coding-workflow)

An **Agent-First Skills Monorepo** designed for vibe coders and modern AI coding agents (Antigravity, Claude Code, Cursor, Codex, OpenCode).

Curated by [Abrar Akhunji](https://github.com/abrar225), this repository turns raw agent interactions into reliable, disciplined, test-verified software engineering.

---

## The Philosophy: Disciplined Vibe Coding

Vibe coding is the fastest way to build ambitious software, but speed without guardrails leads to architectural drift, hallucinated dependencies, and broken edge cases.

This repository bridges that gap by providing:
1. **Curated Domain Knowledge**: Battle-tested instructions for UI/UX, Flutter, Next.js, reverse engineering, and automations.
2. **The Orchestrator Protocol**: Before touching code, visiting agents grill ambiguous prompts, enforce boundaries, and load only the minimum needed context.
3. **Evidence-Based Completion**: Grounded in the `gravitas` runtime. A feature is only considered done when an observable test or eval passes after the last edit.

```
Developer Intent ➔ Master Orchestrator ➔ Socratic Grilling ➔ Targeted Skill ➔ Gravitas Verification
```

---

## Domain Taxonomy

All skills are organized into focused domain directories under `skills/`:

| Domain | Description | Key Skills |
| :--- | :--- | :--- |
| **`orchestrator/`** | Intent triage, requirements grilling, and engineering invariants | `master-router`, `gravitas`, `grill-me` |
| **`ui-ux/`** | Design system tokens, micro-interactions, layout polish, and motion | `ui-ux-pro-max`, `framer-motion-animator`, `linear-ui` |
| **`frontend/`** | Modern React, Next.js App Router, Astryx components, Three.js WebGL | `frontend-design`, `astryx`, `vercel-react-best-practices` |
| **`mobile/`** | Flutter enterprise architecture, Bloc/Riverpod, Compose previews | `flutter-architecture`, `android-cli`, `compose-preview` |
| **`backend-api/`** | PacketLark local API workbench, HTTP contracts, BigQuery dbt | `packetlark-workbench`, `dbt-bigquery`, `data-autocleaning` |
| **`security-bug-bounty/`** | Static security audits, protocol reverse engineering, bug bounty recon | `review-security`, `reverse-engineer-anything` |
| **`automations/`** | Headless browser automation, background workers, Firecrawl scraping | `task-scheduler`, `browser-automation`, `firecrawl` |
| **`scraping-leads/`** | Data scraping, lead qualification, cold email pipelines, programmatic SEO | `cold-email-pipeline`, `ai-seo`, `lead-enrichment` |
| **`social-media/`** | High-retention human writing, Instagram Reels DOM, LinkedIn tech deep-dives | `human-writer`, `instagram-autoposting`, `linkedin-autoposting` |
| **`engineering-ops/`** | Surgical code edits, codebase knowledge graphs, red-green TDD | `karpathy-guidelines`, `graphify`, `tdd` |

---

## Quickstart for Developers

Clone this repository or use the companion CLI dispatcher:

```bash
# Clone the monorepo
git clone https://github.com/abrar225/Skills.git ~/Desktop/Skills
cd ~/Desktop/Skills

# List all available domains and skills
node bin/vibe-skills.js list

# Scan any local project to detect what skills it needs
cd ~/path-to-your-project
node ~/Desktop/Skills/bin/vibe-skills.js scan
```

---

## How AI Agents Use This Repository

Every AI agent that visits this repository starts by reading [`AGENTS.md`](AGENTS.md).

1. **Claude Code**: Reads `CLAUDE.md` and routes queries to relevant skill paths.
2. **Antigravity**: Discovers and triggers skills via frontmatter metadata.
3. **Cursor & Codex**: Enforces repository conventions via `.cursorrules`.

### Anatomy of a Skill
Every skill follows a standardized, test-verifiable format:
- `SKILL.md`: Core instructions, invariants, and implementation patterns.
- `metadata.json`: Machine-readable properties, triggers, and prerequisites.
- `evals/eval.json`: Scenario benchmarks and golden test assertions that verify agent execution.

---

## Tested on Real-World Workspaces

These skills are extracted directly from active production projects:
- **PacketLark**: Open-source local API workbench and HTTP contract engine.
- **Fixo Flow**: Voice-first AI desktop workflow assistant.
- **Social Media Manager**: Multi-platform automated publishing and Reels engine.
- **FrameCast Studio**: Video composition and browser media tooling.
- **Abrar Portfolio**: High-performance interactive 3D and canvas web application.
- **Reverse Engineer**: Protocol audit and binary analysis workbench.

---

## License

MIT © [Abrar Akhunji](https://github.com/abrar225)
