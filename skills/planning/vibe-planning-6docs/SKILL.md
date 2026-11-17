---
name: vibe-planning-6docs
description: Turn an app idea into six connected planning documents before an AI coding agent builds it. Use when starting a new app, scoping version one, writing a PRD/TRD, mapping app flow, defining UI/UX or backend schema, or producing an implementation plan.
license: No source-page license declared; see SOURCE.json
---

# The 6 Documents You Need Before Vibe Coding Any App

Turn an app idea into clear instructions before asking an AI coding agent to build it.

One prompt can describe an idea. It usually cannot make every product, technical, design and data decision consistently.

This skill helps you create six connected documents:

1. Product Requirements Document (PRD)
2. Technical Requirements Document (TRD)
3. App Flow
4. UI/UX Design Brief
5. Backend Schema
6. Implementation Plan

You can create them with Claude, ChatGPT or another capable AI assistant. Generate them one at a time in this order. Review and approve each document before moving to the next one.

> These are practical planning documents for AI-assisted development, not universal industry standards. Adjust their depth to the size and risk of your project.

**Source of truth:** `references/full-guide.md` is the complete source page rendered as Markdown, preserving the title, all 82 source blocks, and rich-text formatting. The original public Notion response is retained in `references/source-page.json`, with block IDs and SHA-256 hashes in `references/extraction.json`. Read it before generating any document. The individual templates and prompts preserve the source code-block text, with one final newline in each Markdown file; the raw text is retained in the snapshot. Do not summarize, merge, reorder, or skip sections.

## Why the Order Matters

```
App idea
↓
PRD — what are we building?
↓
TRD — how will it be built?
↓
App Flow — how does the user move through it?
↓
UI/UX Brief — how should it look and behave?
↓
Backend Schema — how is the data organised?
↓
Implementation Plan — in what order should it be built?
```

If a later document conflicts with an approved earlier document, fix the conflict before starting development.

## Workflow

### Step 0 — Write a small App Brief

Complete this first. Do not make the AI guess missing product decisions.

Use `templates/00-app-brief.md`. Capture app name, one-line idea, problem, audience, main action, must-haves, nice-to-haves, platform, business model, constraints, and references. Save it as `00-app-brief.md`.

### Step 1 — Product Requirements Document (PRD)

The PRD explains the product itself: the problem, users, core experience, features, scope and success criteria. It prevents the coding agent from inventing features or solving a different problem.

- Template: `templates/01-prd.md`
- Prompt: `prompts/01-prd.prompt.md`
- Review the PRD and approve the version-one scope before continuing.

### Step 2 — Technical Requirements Document (TRD)

The TRD records the technical choices: architecture, stack, tools, APIs, authentication, infrastructure and quality requirements. It stops the coding agent from changing technologies halfway through the build.

- Template: `templates/02-trd.md`
- Prompt: `prompts/02-trd.prompt.md`

### Step 3 — App Flow

The App Flow lists every screen, route and important interaction. It explains where a user starts, what happens after each action and how they recover from errors or empty states.

- Template: `templates/03-app-flow.md`
- Prompt: `prompts/03-app-flow.prompt.md`

### Step 4 — UI/UX Design Brief

The UI/UX Brief defines how the product should look, feel and respond. It gives the coding agent a visual system instead of allowing it to generate random gradients, cards and spacing.

- Template: `templates/04-ui-ux-brief.md`
- Prompt: `prompts/04-ui-ux-brief.prompt.md`

### Step 5 — Backend Schema

The Backend Schema explains how the product stores and connects data. It covers users, authentication, tables, columns, relationships, access rules and important data operations.

- Template: `templates/05-backend-schema.md`
- Prompt: `prompts/05-backend-schema.prompt.md`

### Step 6 — Implementation Plan

The Implementation Plan converts the approved documents into a build sequence. It tells the coding agent what to build first, which files and systems are involved, how to verify each phase and when to stop for review.

- Template: `templates/06-implementation-plan.md`
- Prompt: `prompts/06-implementation-plan.prompt.md`

## Final Consistency Check

Run this after all six documents are ready.

- Prompt: `prompts/final-consistency-check.prompt.md`

The check must surface blocking contradictions, important gaps, minor naming inconsistencies, exact corrections required in each file, and a final traceability matrix: PRD feature → screen → data entity → implementation phase.

Do not rewrite the documents or start coding until the user approves the corrections.

## Put the Documents Inside Your Project

Create a `docs` folder:

```
docs/
├── 00-app-brief.md
├── 01-prd.md
├── 02-trd.md
├── 03-app-flow.md
├── 04-ui-ux-brief.md
├── 05-backend-schema.md
└── 06-implementation-plan.md
```

Then give the coding agent the handoff prompt in `prompts/handoff.prompt.md`.

## The Important Part

The goal is not to produce six long files. The goal is to remove six different kinds of guessing before your coding agent starts building.

## Operating Rules for the Agent

1. Generate the documents one at a time, in the order above.
2. Stop for explicit approval after each document before starting the next.
3. Do not write implementation code until the Implementation Plan is approved.
4. Do not silently invent important requirements. If essential information is missing, ask focused questions.
5. Keep version one realistic. Separate must-have features from nice-to-have ideas.
6. If a later document conflicts with an approved earlier document, fix the conflict before continuing.
7. Preserve the user's product decisions. Do not substitute a different problem, stack, screen, or data model.
8. Return clean Markdown that the user can save under the exact filenames above.

## File Map

| Path | Contents |
| :--- | :--- |
| `references/full-guide.md` | Complete source page rendered as Markdown |
| `references/source-page.json` | Original Notion response, including rich-text annotations |
| `references/extraction.json` | Source block IDs, code mapping, and SHA-256 hashes |
| `references/document-order.md` | The dependency diagram |
| `references/project-layout.md` | The `docs/` folder layout |
| `templates/00-app-brief.md` | App Brief template |
| `templates/01-prd.md` | PRD template |
| `templates/02-trd.md` | TRD template |
| `templates/03-app-flow.md` | App Flow template |
| `templates/04-ui-ux-brief.md` | UI/UX Brief template |
| `templates/05-backend-schema.md` | Backend Schema template |
| `templates/06-implementation-plan.md` | Implementation Plan template |
| `prompts/01-prd.prompt.md` | PRD generation prompt |
| `prompts/02-trd.prompt.md` | TRD generation prompt |
| `prompts/03-app-flow.prompt.md` | App Flow generation prompt |
| `prompts/04-ui-ux-brief.prompt.md` | UI/UX Brief generation prompt |
| `prompts/05-backend-schema.prompt.md` | Backend Schema generation prompt |
| `prompts/06-implementation-plan.prompt.md` | Implementation Plan generation prompt |
| `prompts/final-consistency-check.prompt.md` | Cross-document audit prompt |
| `prompts/handoff.prompt.md` | Coding-agent handoff prompt |
