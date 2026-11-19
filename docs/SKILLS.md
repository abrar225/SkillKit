# Skill Catalog

Generated from `registry/skills.json` on 2026-11-17. Do not edit by hand: run `npm run build:registry && npm run docs`.

192 skills across 14 domains, 69 featured (marked ★).

| Domain | Skills | Featured |
| :--- | ---: | ---: |
| [Agent Orchestration & Governance](#orchestrator) `orchestrator` | 13 | 7 |
| [Planning, Specs & Requirements](#planning) `planning` | 22 | 5 |
| [Architecture & Knowledge Modeling](#architecture) `architecture` | 6 | 5 |
| [Engineering Operations & Code Quality](#engineering-ops) `engineering-ops` | 36 | 7 |
| [UI/UX, Design Systems & Motion](#ui-ux) `ui-ux` | 31 | 10 |
| [Frontend Engineering](#frontend) `frontend` | 15 | 6 |
| [Mobile Engineering](#mobile) `mobile` | 5 | 2 |
| [Backend, APIs & Data](#backend-api) `backend-api` | 11 | 3 |
| [Security & Reverse Engineering](#security-bug-bounty) `security-bug-bounty` | 4 | 3 |
| [Browser Agents & Automations](#automations) `automations` | 6 | 5 |
| [Scraping & Lead Generation](#scraping-leads) `scraping-leads` | 2 | 2 |
| [Writing & Social Publishing](#social-media) `social-media` | 11 | 4 |
| [Video, Motion & Generative Media](#media) `media` | 8 | 4 |
| [Agent Tooling & Configuration](#agent-tooling) `agent-tooling` | 22 | 6 |

<a id="orchestrator"></a>

## Agent Orchestration & Governance

`skills/orchestrator` — Routing, grilling, multi-agent coordination, context control, and reliability invariants.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **find-skills** | `skills/orchestrator/find-skills` | MIT | Helps users discover and install agent skills when they ask questions like "how do I do X", "find a skill for X", "is there a skill that can...", or express interest in extending capabilities. This skill should be used … |
| ★ **gravitas** | `skills/orchestrator/gravitas` | MIT | Use for software implementation, debugging, refactoring, review, migration, and other repository-changing engineering work where correctness must be verified. Enforces scoped reconnaissance, adaptive planning, evidence-… |
| ★ **grill-me** | `skills/orchestrator/grill-me` | MIT | A relentless interview to sharpen a plan or design. |
| ★ **grilling** | `skills/orchestrator/grilling` | unverified | Grill the user relentlessly about a plan, decision, or idea. Use when the user wants to stress-test their thinking, or uses any 'grill' trigger phrases. |
| ★ **master-router** | `skills/orchestrator/master-router` | unverified | Route a developer's task to SkillKit workflows, skills, resources, and verification steps. Use when starting a build, planning a change, reviewing work, or preparing a release with SkillKit. |
| ★ **model-council** | `skills/orchestrator/model-council` | CC0-1.0 | The user invoked Model Council. Run their query independently across several frontier models in parallel, then synthesize one model-forward answer organized around where the models agree, disagree, and diverge. The synt… |
| ★ **swarm** | `skills/orchestrator/swarm` | unverified | (Preview & Quota Heavy) Run a swarm: several agents working in parallel on one task, each in its own conversation, collaborating through a shared message board. Use when the work splits into pieces that can be done at t… |
| **context-engineering** | `skills/orchestrator/context-engineering` | MIT | Optimizes agent context setup. Use when starting a new session, when agent output quality degrades, when switching between tasks, or when you need to configure rules files and context for a project. |
| **dispatching-parallel-agents** | `skills/orchestrator/dispatching-parallel-agents` | MIT | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| **prompt-engineering-patterns** | `skills/orchestrator/prompt-engineering-patterns` | unverified | This skill should be used when the user asks to "optimize a prompt", "improve prompt performance", "design a prompt template", "write better prompts", "debug prompt issues", "use chain-of-thought", "structured prompting… |
| **subagent-driven-development** | `skills/orchestrator/subagent-driven-development` | MIT | Use when executing implementation plans with independent tasks in the current session |
| **swarm_monitor** | `skills/orchestrator/swarm-monitor` | unverified | ONLY for the native-swarm worker whose brief says it is the monitor. On a timer, it checks whether the whole swarm has stalled and calls on the one member who can unstick it. Coordinators and other workers: do not load … |
| **using-agent-skills** | `skills/orchestrator/using-agent-skills` | MIT | Discovers and invokes agent skills. Use when starting a session, or when you need to decide which skill or workflow applies to the piece of work at hand. This is the meta-skill that governs how all other skills are disc… |

<a id="planning"></a>

## Planning, Specs & Requirements

`skills/planning` — Turning intent into PRDs, specs, tickets, implementation plans, and approved scope.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **brainstorming** | `skills/planning/brainstorming` | MIT | You MUST use this before any creative work - creating features, building components, adding functionality, modifying behavior, or planning anything new, in software or out of it (a talk, a business, a renovation). |
| ★ **planning-and-task-breakdown** | `skills/planning/planning-and-task-breakdown` | MIT | Breaks work into ordered tasks. Use when you have a spec or clear requirements and need to break work into implementable tasks. Use when a task feels too large to start, when you need to estimate scope, or when parallel… |
| ★ **to-spec** | `skills/planning/to-spec` | MIT | Turn the current conversation into a spec and publish it to the project issue tracker: no interview, just synthesis of what you've already discussed. |
| ★ **vibe-planning-6docs** | `skills/planning/vibe-planning-6docs` | unknown | Turn an app idea into six connected planning documents before an AI coding agent builds it. Use when starting a new app, scoping version one, writing a PRD/TRD, mapping app flow, defining UI/UX or backend schema, or pro… |
| ★ **writing-plans** | `skills/planning/writing-plans` | MIT | Use when you have a spec or requirements for a multi-step task, before touching code |
| **autopilot** | `skills/planning/autopilot` | unverified | Keep a PR merge-ready by triaging comments, resolving clear conflicts, and fixing CI in a loop. |
| **constraint-driven-development** | `skills/planning/constraint-driven-development` | MIT | Establishes a project's quality bar as a written contract and stops agents quietly lowering it. Interviews the user on which dimensions matter, supplies sane default thresholds when they have no number in mind, records … |
| **executing-plans** | `skills/planning/executing-plans` | MIT | Use when executing an implementation plan in the current session as the implementer yourself — your human partner chose inline execution, or no subagent tool is available |
| **goal** | `skills/planning/goal` | unverified | Set a goal that Codex will pursue to completion. |
| **greenfield-project-scaffolding** | `skills/planning/greenfield-project-scaffolding` | Apache-2.0 | Use only when all three gates already hold. (1) This same user turn explicitly says to start, implement, build, scaffold, or go ahead with a new project now; prior answers, planning, decisions, and reminders never autho… |
| **idea-refine** | `skills/planning/idea-refine` | MIT | Refines raw ideas into sharp, actionable concepts through structured divergent and convergent thinking. Use when an idea is still vague, when you need to stress-test assumptions before committing to a plan, or when you … |
| **interview-me** | `skills/planning/interview-me` | MIT | Extracts what the user actually wants instead of what they think they should want. Achieves this through one-question-at-a-time interview until ~95% confidence about the underlying intent. Use when an ask is underspecif… |
| **plan** | `skills/planning/meta-plan` | Apache-2.0 | On an explicit planning request, always call `read_skill` for this skill before answering. Research first, then return one concise inline plan; do not create a plan file unless the user explicitly asks or a governing wo… |
| **prototype** | `skills/planning/prototype` | MIT | Build a throwaway prototype to answer a design question. Use when the user wants to sanity-check whether a state model or logic feels right, or explore what a UI should look like. |
| **requirements-clarification** | `skills/planning/requirements-clarification` | Apache-2.0 | Clarify a material user-owned product decision before substantive implementation commitments. Use only when request and named/governing evidence still leave a choice that would materially change scope, platform support,… |
| **research** | `skills/planning/research` | MIT | Investigate a question against high-trust primary sources and capture the findings as a Markdown file in the repo. Use when the user wants a topic researched, docs or API facts gathered, or reading legwork delegated to … |
| **retro** | `skills/planning/retro` | MIT | Conduct a retrospective on a coding session. |
| **spec-driven-development** | `skills/planning/spec-driven-development` | MIT | Creates specs before coding. Use when starting a new project, feature, or significant change and no specification exists yet. Use when drafting a PRD or requirements document with objectives and scope, or when requireme… |
| **to-tickets** | `skills/planning/to-tickets` | MIT | Break a plan, spec, or the current conversation into a set of tracer-bullet tickets, each declaring its blocking edges, published to the configured tracker (edges as text in one file per ticket locally, or native blocki… |
| **triage** | `skills/planning/triage` | MIT | Move issues and external PRs through a state machine of triage roles, categorise, verify, grill if needed, and write agent-ready briefs. |
| **wait-what** | `skills/planning/wait-what` | MIT | Stop. That last message did not land: re-pitch it. |
| **wayfinder** | `skills/planning/wayfinder` | MIT | Plan a huge chunk of work (more than one agent session can hold) as a shared map of decision tickets on your issue tracker, and resolve them one at a time until the way to the destination is clear. |

<a id="architecture"></a>

## Architecture & Knowledge Modeling

`skills/architecture` — Codebase design, domain modeling, ADRs, dependency boundaries, and knowledge graphs.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **codebase-design** | `skills/architecture/codebase-design` | MIT | Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities, decide where a seam goes, make code more testable or AI-navigable, or when a… |
| ★ **documentation-and-adrs** | `skills/architecture/documentation-and-adrs` | MIT | Records decisions and documentation, and detects when documentation has drifted from the code it describes. Use when you need to document an architecture decision (ADR) or the reasoning behind a design choice, when chan… |
| ★ **domain-modeling** | `skills/architecture/domain-modeling` | MIT | Build and sharpen a project's domain model. Use when discussing codebase terminology, writing or editing a GLOSSARY.md, or recording or editing an ADR. |
| ★ **graphify** | `skills/architecture/graphify` | unverified | any input (code, docs, papers, images, videos) to knowledge graph. Use when user asks any question about a codebase, documents, or project content - especially if graphify-out/ exists, treat the question as a /graphify … |
| ★ **improve-codebase-architecture** | `skills/architecture/improve-codebase-architecture` | MIT | Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. |
| **api-and-interface-design** | `skills/architecture/api-and-interface-design` | MIT | Guides stable API and interface design. Use when designing APIs, module boundaries, or any public interface. Use when creating REST or GraphQL endpoints, defining type contracts between modules, or establishing boundari… |

<a id="engineering-ops"></a>

## Engineering Operations & Code Quality

`skills/engineering-ops` — TDD, debugging, review, verification, migrations, performance, and dead-code cleanup.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **code-review** | `skills/engineering-ops/code-review` | MIT | Review the changes since a fixed point (commit, branch, tag, or merge-base) along two axes: Standards (does the code follow this repo's documented coding standards?) and Spec (does the code match what the originating is… |
| ★ **code-review-and-quality** | `skills/engineering-ops/code-review-and-quality` | MIT | Conducts multi-axis code review. Use before merging any change. Use when reviewing code written by yourself, another agent, or a human. Use when you need to assess code quality across multiple dimensions before it enter… |
| ★ **code-simplification** | `skills/engineering-ops/code-simplification` | MIT | Simplifies code for clarity. Use when refactoring code for clarity without changing behavior. Use when code works but is harder to read, maintain, or extend than it should be. Use when reviewing code that has accumulate… |
| ★ **karpathy-guidelines** | `skills/engineering-ops/karpathy-guidelines` | MIT | Behavioral guidelines to reduce common LLM coding mistakes. Use when writing, reviewing, or refactoring code to avoid overcomplication, make surgical changes, surface assumptions, and define verifiable success criteria. |
| ★ **systematic-debugging** | `skills/engineering-ops/systematic-debugging` | MIT | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| ★ **tdd** | `skills/engineering-ops/tdd` | unverified | Test-driven development. Use when the user wants to build features or fix bugs test-first, mentions "red-green-refactor", or wants integration tests. |
| ★ **verification-before-completion** | `skills/engineering-ops/verification-before-completion` | MIT | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and confirming output before making any success claims; evidence before assertions … |
| **code-review (Anthropic)** | `skills/engineering-ops/anthropic-code-review` | CC0-1.0 | Review the current diff, or a PR number/branch/path target, for correctness bugs (plus reuse/simplification/efficiency cleanups where the model's recipe covers them) at the effort level given first, before any target (l… |
| **debug** | `skills/engineering-ops/anthropic-debug` | CC0-1.0 | Enable debug logging for this session and help diagnose issues |
| **simplify** | `skills/engineering-ops/anthropic-simplify` | CC0-1.0 | Review the changed code for reuse, simplification, efficiency, and altitude cleanups, then apply the fixes. Quality only — it does not hunt for bugs; use /code-review for that. |
| **verify** | `skills/engineering-ops/anthropic-verify` | CC0-1.0 | Verify that a code change actually does what it's supposed to by exercising it end-to-end and observing behavior — drive the affected flow, not just tests or typecheck. Run before committing nontrivial changes; bootstra… |
| **debugging-and-error-recovery** | `skills/engineering-ops/debugging-and-error-recovery` | MIT | Guides systematic root-cause debugging. Use when tests fail, builds break, something that worked yesterday broke, behavior doesn't match expectations, or you encounter any unexpected error. Use when you need to figure o… |
| **deprecation-and-migration** | `skills/engineering-ops/deprecation-and-migration` | MIT | Manages deprecation and migration. Use when removing old systems, APIs, or features. Use when migrating users from one implementation to another. Use when migrating a database schema in production, such as renaming or d… |
| **diagnosing-bugs** | `skills/engineering-ops/diagnosing-bugs` | MIT | Diagnosis loop for hard bugs and performance regressions. Use when the user says "diagnose"/"debug this", or reports something broken/throwing/failing/slow. |
| **doubt-driven-development** | `skills/engineering-ops/doubt-driven-development` | MIT | Subjects every non-trivial decision to a fresh-context adversarial review before it stands. Use when you want every assumption cross-examined before proceeding, when stress-testing a plan for hidden failure modes, when … |
| **durable-test-collateral** | `skills/engineering-ops/durable-test-collateral` | Apache-2.0 | Load the body before the first implementation edit for a bug fix or behavior change, or when the user or governing specification makes reusable tests a deliverable. It keeps the smallest focused test with the delivered … |
| **finishing-a-development-branch** | `skills/engineering-ops/finishing-a-development-branch` | MIT | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work |
| **git-guardrails-claude-code** | `skills/engineering-ops/git-guardrails` | MIT | Set up Claude Code hooks to block dangerous git commands (push, reset --hard, clean, branch -D, etc.) before they execute. Use when user wants to prevent destructive git operations, add git safety hooks, or block git pu… |
| **git-workflow-and-versioning** | `skills/engineering-ops/git-workflow-and-versioning` | MIT | Structures git workflow practices. Use when making any code change. Use when committing, branching, resolving conflicts, splitting uncommitted work in a messy working tree into clean atomic commits, opening or reviewing… |
| **implement** | `skills/engineering-ops/implement` | MIT | Implement a piece of work based on a spec or set of tickets. |
| **implement-spec** | `skills/engineering-ops/implement-spec` | MIT | Implement the result of /to-spec and /to-tickets in code. |
| **incremental-implementation** | `skills/engineering-ops/incremental-implementation` | MIT | Delivers changes incrementally in thin, verifiable slices. Use when implementing any feature or change that touches more than one file, or when picking up the next task from a plan. Use when rolling a change out behind … |
| **memory-leak-debugging** | `skills/engineering-ops/memory-leak-debugging` | CC0-1.0 | Diagnoses and resolves memory leaks in JavaScript/Node.js applications. Use when a user reports high memory usage, OOM errors, or wants to capture, compare, or inspect heap snapshots with Chrome DevTools MCP memory tool… |
| **observability-and-instrumentation** | `skills/engineering-ops/observability-and-instrumentation` | MIT | Instruments code so production behavior is visible and diagnosable. Use when adding logging, metrics, tracing, or alerting. Use when shipping any feature that runs in production and you need evidence it works. Use when … |
| **performance-optimization** | `skills/engineering-ops/performance-optimization` | MIT | Optimizes application performance across frontend, backend, queries, and databases. Use when performance requirements exist, when you suspect performance regressions, when Core Web Vitals or load times need improvement,… |
| **pr** | `skills/engineering-ops/pr` | MIT | Use when writing a PR body. |
| **receiving-code-review** | `skills/engineering-ops/receiving-code-review` | MIT | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable - requires technical rigor and verification, not performative agreement or blind… |
| **requesting-code-review** | `skills/engineering-ops/requesting-code-review` | MIT | Use when completing tasks, implementing major features, or before merging to verify work meets requirements |
| **review** | `skills/engineering-ops/review` | unverified | Review code changes with the Bugbot or Security Review subagent. |
| **review-agent** | `skills/engineering-ops/review-agent` | CC0-1.0 | Perform a read-only, defect-first review of a specified code change and return every actionable finding. Use when another agent delegates review of uncommitted changes, a base-branch diff, a commit, or custom review ins… |
| **review-bugbot** | `skills/engineering-ops/review-bugbot` | unverified | Review code changes with Bugbot subagent. |
| **setup-pre-commit** | `skills/engineering-ops/setup-pre-commit` | MIT | Set up Husky pre-commit hooks with lint-staged (Prettier), type checking, and tests in the current repo. Use when user wants to add pre-commit hooks, set up Husky, configure lint-staged, or add commit-time formatting/ty… |
| **shipping-and-launch** | `skills/engineering-ops/shipping-and-launch` | MIT | Prepares production launches. Use when preparing to deploy to production, or when asking what needs to be in place before shipping. Use when you need a pre-launch checklist, when setting up monitoring, when planning a s… |
| **source-driven-development** | `skills/engineering-ops/source-driven-development` | MIT | Grounds every implementation decision in official documentation. Use when you want to verify an approach against the official docs before implementing it, or when you want authoritative, source-cited code free from outd… |
| **test-driven-development** | `skills/engineering-ops/test-driven-development` | MIT | Use when implementing any feature or bugfix, before writing implementation code |
| **using-git-worktrees** | `skills/engineering-ops/using-git-worktrees` | MIT | Use when starting feature work that needs isolation from current workspace or before executing implementation plans - ensures an isolated workspace exists via native tools or git worktree fallback |

<a id="ui-ux"></a>

## UI/UX, Design Systems & Motion

`skills/ui-ux` — Visual hierarchy, design tokens, accessibility, taste, and production motion.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **astryx** | `skills/ui-ux/astryx` | MIT | Astryx, a design system and UI library, is available on this computer through the astryx command; use it when building or changing UI, choosing components, layout, styling or theming, working with a design system, or in… |
| ★ **baseline-ui** | `skills/ui-ux/baseline-ui` | MIT | Quickly deslop UI code by fixing spacing, hierarchy, typography, and small layout issues. Use when the interface needs a fast cleanup or polish pass. |
| ★ **emil-design-eng** | `skills/ui-ux/emil-design-eng` | MIT | Emil Kowalski's design-engineering philosophy for UI polish, component design, animation decisions, and the invisible details that make software feel great. Use when building or reviewing a UI component's interactions a… |
| ★ **framer-motion-animator** | `skills/ui-ux/framer-motion-animator` | unverified | Creates smooth animations and micro-interactions using Framer Motion including page transitions, gestures, scroll-based animations, and orchestrated sequences. Use when users request "add animation", "framer motion", "p… |
| ★ **impeccable** | `skills/ui-ux/impeccable` | Apache-2.0 | Use to design, redesign, critique, audit, polish or animate a frontend: websites, landing pages, dashboards, app UI, components, native iOS/Android screens, or a design system (DESIGN.md). |
| ★ **improve-ui** | `skills/ui-ux/improve-ui` | MIT | Audit an existing product surface against its own design evidence, identify verified UI problems, and write self-contained implementation plans for another agent. Strictly read-only on product source. Use when asked to … |
| ★ **refactoring-ui** | `skills/ui-ux/refactoring-ui` | MIT | Audit and fix visual hierarchy, spacing, color, and depth in web UIs. Use when the user mentions "my UI looks off" (or amateur/unprofessional), "fix the design", "Tailwind styling", "color palette", "visual hierarchy", … |
| ★ **design-taste-frontend** | `skills/ui-ux/taste-skill` | MIT | tasteskill 2.5.1, the anti-slop frontend skill. Builds professional company websites at the level of figma.com and x.ai: plain copy in a voice of its own, one system, one section per screen, equal edges, real photograph… |
| ★ **ui-skills-root** | `skills/ui-ux/ui-skills-root` | MIT | Use before UI-related work to select the smallest useful UI Skills context through the ui-skills CLI. |
| ★ **ui-ux-pro-max** | `skills/ui-ux/ui-ux-pro-max` | MIT | UI/UX design intelligence for web, mobile, and desktop. This skill should be used when designing, building, reviewing, or fixing interfaces, including pages, components, design systems, accessibility, interaction, respo… |
| **animate** | `skills/ui-ux/animate` | MIT | Build an animation from scratch, making the decisions in the order that determines whether it feels right — should it animate at all, what purpose, which tool, which properties, which curve and duration, how it interrup… |
| **animation-vocabulary** | `skills/ui-ux/animation-vocabulary` | MIT | Reverse-lookup glossary that turns a vague description of a web animation or motion effect into its exact term ("the bouncy thing when a popover opens" → Pop in; "the iOS rubber-band scroll" → Rubber-banding). Use when … |
| **design** | `skills/ui-ux/anthropic-design` | CC0-1.0 | Make a new Design artifact from a brief |
| **apple-design** | `skills/ui-ux/apple-design` | MIT | Apple's approach to interface design and fluid, physical motion, translated for the web. Use when building or reviewing gesture-driven UI, spring animations, drag/swipe/sheet interactions, momentum and interruptible tra… |
| **brand-guidelines** | `skills/ui-ux/brand-guidelines` | Apache-2.0 | Applies Anthropic's official brand colors and typography to any sort of artifact that may benefit from having Anthropic's look-and-feel. Use it when brand colors or style guidelines, visual formatting, or company design… |
| **canvas-design** | `skills/ui-ux/canvas-design` | Apache-2.0 | Create beautiful visual art in .png and .pdf documents using design philosophy. You should use this skill when the user asks to create a poster, piece of art, design, or other static piece. Create original visual design… |
| **component-canvas** | `skills/ui-ux/component-canvas` | MIT | Build a full-screen, interactive canvas to explore existing UI components and their variants with pan and zoom. |
| **create-canvas** | `skills/ui-ux/create-canvas` | MIT | Build a freeform canvas to explore, compare, and iterate on anything. |
| **create-design-md** | `skills/ui-ux/create-design-md` | MIT | Create or update a DESIGN.md from an existing product repository or public website. Use when asked to document an interface's design language, reconstruct its visual system, extract design tokens and guidance from curre… |
| **find-animation-opportunities** | `skills/ui-ux/find-animation-opportunities` | MIT | Search a codebase or UI for places that don't animate but should, and reject everything that shouldn't. Read-only; it proposes motion with exact values, it does not implement it. Use when the user asks "what could be an… |
| **fixing-accessibility** | `skills/ui-ux/fixing-accessibility` | MIT | Audit and fix HTML accessibility issues including ARIA labels, keyboard navigation, focus management, color contrast, and form errors. Use when adding interactive controls, forms, dialogs, or reviewing WCAG compliance. |
| **fixing-motion-performance** | `skills/ui-ux/fixing-motion-performance` | MIT | Audit and fix animation performance issues including layout thrashing, compositor properties, scroll-linked motion, and blur effects. Use when animations stutter, transitions jank, or reviewing CSS/JS animation performa… |
| **framer-ui-skills** | `skills/ui-ux/framer-ui-skills` | MIT | Framer's UI design system. Use when building interfaces inspired by Framer's aesthetic - dark mode, Inter font, 4px grid. |
| **gestures** | `skills/ui-ux/gestures` | MIT | Build drag, swipe, and sheet interactions that track the finger 1:1 and stay interruptible. Use when building or fixing anything the user drags, swipes, flings, holds, or dismisses with a gesture — drawers, sheets, swip… |
| **hi-fi-design** | `skills/ui-ux/hi-fi-design` | CC0-1.0 | The design process for high-fidelity, polished work — the system prompt tells Claude to invoke it before starting any design |
| **improve-animations** | `skills/ui-ux/improve-animations` | MIT | Survey a codebase's animation and motion code as a senior motion advisor, then produce a prioritized audit and self-contained implementation plans for other agents (or cheaper models) to execute. Read-only on source cod… |
| **linear-ui-skills** | `skills/ui-ux/linear-ui-skills` | MIT | Linear's UI design system. Use when building interfaces inspired by Linear's aesthetic - dark mode, Inter font, 4px grid. |
| **pick-ui-library** | `skills/ui-ux/pick-ui-library` | MIT | Pick the library for a frontend task from a curated list — primitives, toasts, drawers, command menus, OTP, numbers, charts, virtualization, drag and drop, state, styling. |
| **review-animations** | `skills/ui-ux/review-animations` | MIT | Reviews animation and motion code against a high craft bar derived from Emil Kowalski's design engineering philosophy. Default to flagging; approval is earned. |
| **theme-factory** | `skills/ui-ux/theme-factory` | Apache-2.0 | Toolkit for styling artifacts with a theme. These artifacts can be slides, docs, reportings, HTML landing pages, etc. There are 10 pre-set themes with colors/fonts that you can apply to any artifact that has been creati… |
| **wireframe** | `skills/ui-ux/wireframe` | CC0-1.0 | Explore many ideas with wireframes and storyboards |

<a id="frontend"></a>

## Frontend Engineering

`skills/frontend` — React, Next.js, Three.js, web APIs, performance, and production UI implementation.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **vercel-composition-patterns** | `skills/frontend/composition-patterns` | MIT | React composition patterns that scale. Use when refactoring components with boolean prop proliferation, building flexible component libraries, or designing reusable APIs. Triggers on tasks involving compound components,… |
| ★ **dataviz** | `skills/frontend/dataviz` | CC0-1.0 | Use this skill whenever you are about to create ANY chart, graph, plot, dashboard, or data visualization, in ANY output medium — an HTML or React artifact, inline SVG, plotting code in any library (matplotlib, plotly, d… |
| ★ **frontend-design** | `skills/frontend/frontend-design` | Apache-2.0 | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography, and making choices that don't read as templated defaults. |
| ★ **threejs-fundamentals** | `skills/frontend/threejs-fundamentals` | unverified | Three.js scene setup, cameras, renderer, Object3D hierarchy, coordinate systems. Use when setting up 3D scenes, creating cameras, configuring renderers, managing object hierarchies, or working with transforms. |
| ★ **vercel-react-best-practices** | `skills/frontend/vercel-react-best-practices` | MIT | React and Next.js performance optimization guidelines from Vercel Engineering. This skill should be used when writing, reviewing, or refactoring React/Next.js code to ensure optimal performance patterns. Triggers on tas… |
| ★ **web-design-guidelines** | `skills/frontend/web-design-guidelines` | MIT | Review UI code for Web Interface Guidelines compliance. Use when asked to "review my UI", "check accessibility", "audit design", "review UX", or "check my site against best practices". |
| **debug-optimize-lcp** | `skills/frontend/debug-optimize-lcp` | CC0-1.0 | Guides debugging and optimizing Largest Contentful Paint (LCP) using Chrome DevTools MCP tools. Use this skill whenever the user asks about LCP performance, slow page loads, Core Web Vitals optimization, or wants to und… |
| **deploy-with-vercel** | `skills/frontend/deploy-with-vercel` | unverified | Link this repository to a Vercel project and deploy it using the Vercel MCP tools. |
| **fixing-metadata** | `skills/frontend/fixing-metadata` | MIT | Audit and fix HTML metadata including page titles, meta descriptions, canonical URLs, Open Graph tags, Twitter cards, favicons, JSON-LD structured data, and robots directives. Use when adding SEO metadata, fixing social… |
| **frontend-ui-engineering** | `skills/frontend/frontend-ui-engineering` | MIT | Builds production-quality, accessible, responsive user-facing UIs. Use when building or modifying interfaces and pages, creating components, implementing layouts, meeting WCAG accessibility requirements, managing state,… |
| **generative_ui** | `skills/frontend/generative-ui` | CC0-1.0 | How to render rich interactive HTML widgets inline in the chat or as standalone artifacts. Use this skill when you want to show the user diagrams, data visualizations, interactive controls, educational walkthroughs, or … |
| **vercel-react-view-transitions** | `skills/frontend/react-view-transitions` | MIT | Guide for implementing smooth, native-feeling animations using React's View Transition API (`<ViewTransition>` component, `addTransitionType`, and CSS view transition pseudo-elements). Use this skill whenever the user w… |
| **threejs-interaction** | `skills/frontend/threejs-interaction` | unverified | Three.js interaction - raycasting, controls, mouse/touch input, object selection. Use when handling user input, implementing click detection, adding camera controls, or creating interactive 3D experiences. |
| **vercel-optimize** | `skills/frontend/vercel-optimize` | MIT | Use for Vercel cost and performance optimization on deployed projects, especially Next.js, SvelteKit, Nuxt, and limited Astro apps. Collect Vercel metrics, usage, project config, and code scan results first; investigate… |
| **web-artifacts-builder** | `skills/frontend/web-artifacts-builder` | Apache-2.0 | Suite of tools for creating elaborate, multi-component claude.ai HTML artifacts using modern frontend web technologies (React, Tailwind CSS, shadcn/ui). Use for complex artifacts requiring state management, routing, or … |

<a id="mobile"></a>

## Mobile Engineering

`skills/mobile` — Flutter, React Native, SwiftUI, Jetpack Compose, and native interaction patterns.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **flutter-apply-architecture-best-practices** | `skills/mobile/flutter-architecture` | unverified | Architects a Flutter application using the recommended layered approach (UI, Logic, Data). Use when structuring a new project or refactoring for scalability. |
| ★ **vercel-react-native-skills** | `skills/mobile/react-native-skills` | MIT | React Native and Expo best practices for building performant mobile apps. Use when building React Native components, optimizing list performance, implementing animations, or working with native modules. Triggers on task… |
| **animate-expo** | `skills/mobile/animate-expo` | MIT | Build animations in React Native and Expo, making the decisions in the order that determines whether they feel right — should it animate, which thread it runs on, which properties, spring or timing, how the gesture hand… |
| **mobile-native** | `skills/mobile/mobile-native` | MIT | Make a web app feel native on a phone — the small CSS and meta-tag fixes that separate "a website in a browser" from something that feels installed. Covers sticky hover states, tap highlight flashes, the 100vh bug, inpu… |
| **write-swift** | `skills/mobile/write-swift` | MIT | How to write modern Swift well — modeling with value types, Swift 6 data-race safety and approachable concurrency (@concurrent, main-actor-by-default, actors, task groups), protocols and generics (some vs any), API desi… |

<a id="backend-api"></a>

## Backend, APIs & Data

`skills/backend-api` — API contracts, MCP servers, databases, ORMs, and analytical pipelines.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **mcp-builder** | `skills/backend-api/mcp-builder` | Apache-2.0 | Guide for creating high-quality MCP (Model Context Protocol) servers that enable LLMs to interact with external services through well-designed tools. Use when building MCP servers to integrate external APIs or services,… |
| ★ **prisma-orm-setup** | `skills/backend-api/prisma-orm-setup` | MIT | Set up Prisma ORM in an application, connect its database, or troubleshoot the connection of an existing Prisma 6, 7, or 8 app. Defaults new applications to Prisma ORM 8 and loads the package-owned prisma-8 skill; keeps… |
| ★ **supabase-postgres-best-practices** | `skills/backend-api/supabase-postgres-best-practices` | MIT | Postgres best practices maintained by Supabase, for Postgres running anywhere. Load this skill BEFORE writing or changing anything that lives in a Postgres database: creating or altering tables and columns (including ch… |
| **using-dbt-for-analytics-engineering** | `skills/backend-api/dbt-analytics-engineering` | Apache-2.0 | Builds and modifies dbt models, writes SQL transformations using ref() and source(), creates tests, and validates results with dbt show. Use when doing any dbt work - building or modifying models, debugging errors, expl… |
| **troubleshooting-dbt-job-errors** | `skills/backend-api/dbt-job-troubleshooting` | Apache-2.0 | Diagnoses dbt Cloud/platform job failures by analyzing run logs, querying the Admin API, reviewing git history, and investigating data issues. Use when a dbt Cloud/platform job fails and you need to diagnose the root ca… |
| **adding-dbt-unit-test** | `skills/backend-api/dbt-unit-testing` | Apache-2.0 | Creates unit test YAML definitions that mock upstream model inputs and validate expected outputs. Use when adding unit tests for a dbt model or practicing test-driven development (TDD) in dbt. |
| **neon** | `skills/backend-api/neon` | Apache-2.0 | Overview of Neon, a complete set of cloud backend primitives around Lakebase Postgres: Auth, Object Storage, Functions, the AI Gateway, and Realtime. Start here to choose Neon for undecided login, files, APIs, and LLM c… |
| **neon-auth** | `skills/backend-api/neon-auth` | Apache-2.0 | Add authentication to a new app. Use for "add auth", "add login", Neon Auth (Managed Better Auth), identity routing, sign-up, sign-in, password reset, email OTP, magic links, organizations, phone OTP, OAuth, OAuth serve… |
| **neon-postgres** | `skills/backend-api/neon-postgres` | Apache-2.0 | Guides and best practices for working with Lakebase Postgres on Neon: connections, pooled vs direct, schema migrations, branching (including schema-only, reset-from-parent, and branch-per-PR workflows), autoscaling, sca… |
| **prisma-client-api** | `skills/backend-api/prisma-client-api` | MIT | Prisma Client API reference covering model queries, filters, operators, and client methods. Use when writing database queries, using CRUD operations, filtering data, or configuring Prisma Client. Triggers on "prisma que… |
| **supabase** | `skills/backend-api/supabase` | MIT | Use when doing ANY task involving Supabase. Triggers: Supabase products (Database, Auth, Edge Functions, Realtime, Storage, Vectors, Cron, Queues); client libraries and SSR integrations (supabase-js, @supabase/ssr) in N… |

<a id="security-bug-bounty"></a>

## Security & Reverse Engineering

`skills/security-bug-bounty` — Security review, hardening, reverse engineering, recon, and vulnerability analysis.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **reverse-engineer-anything** | `skills/security-bug-bounty/reverse-engineer-anything` | unverified | Reverse engineer native, managed, Electron/JavaScript, packaged, firmware, and browser targets with REA. Use shipped-artifact or requested runtime evidence to explain features, compare versions, decompile code, or guide… |
| ★ **review-security** | `skills/security-bug-bounty/review-security` | unverified | Review code changes with Security Review subagent. |
| ★ **security-and-hardening** | `skills/security-bug-bounty/security-and-hardening` | MIT | Hardens code against vulnerabilities. Use when auditing an input handler for vulnerabilities, when handling user input, authentication, data storage, or external integrations, or when checking a login flow is safe again… |
| **security-review** | `skills/security-bug-bounty/anthropic-security-review` | CC0-1.0 | Complete a security review of the pending changes on the current branch |

<a id="automations"></a>

## Browser Agents & Automations

`skills/automations` — Browser control, web app testing, DevTools inspection, and agent automation.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **agent-reach** | `skills/automations/agent-reach` | MIT | 只读读取各平台内容：搜索、读帖、看评论、取字幕、查行情和职位。 Use when 用户提到或贴出链接：小红书/xiaohongshu、B站/bilibili、Twitter/X、Reddit、 YouTube（字幕、转录）、GitHub、V2EX、雪球/股票行情、LinkedIn/Boss直聘 职位、 Instagram、Facebook、小宇宙播客；或说"帮我搜/看看/读一下这个链接"而自带网页搜索/读取不可用、失败或拿不到正文； … |
| ★ **browser-testing-with-devtools** | `skills/automations/browser-testing-with-devtools` | MIT | Tests in real browsers via Chrome DevTools MCP. Use when building or debugging anything that runs in a browser. Use when you need to inspect the DOM, capture console errors, analyze network requests, profile performance… |
| ★ **chrome-devtools** | `skills/automations/chrome-devtools` | CC0-1.0 | Uses Chrome DevTools via MCP for efficient debugging, troubleshooting and browser automation. Use when debugging web pages, automating browser interactions, analyzing performance, or inspecting network requests. This sk… |
| ★ **ego-browser** | `skills/automations/ego-browser` | unverified | When you need a browser, read this Skill by default. Use it to open and operate websites, fill forms, click buttons, take screenshots, extract page data, sign in, and perform other browser automation tasks, as well as w… |
| ★ **webapp-testing** | `skills/automations/webapp-testing` | Apache-2.0 | Toolkit for interacting with and testing local web applications using Playwright. Supports verifying frontend functionality, debugging UI behavior, capturing browser screenshots, and viewing browser logs. |
| **a11y-debugging** | `skills/automations/a11y-debugging` | CC0-1.0 | Uses Chrome DevTools MCP for accessibility (a11y) debugging and auditing based on web.dev guidelines. Use when testing semantic HTML, ARIA labels, focus states, keyboard navigation, tap targets, and color contrast. |

<a id="scraping-leads"></a>

## Scraping & Lead Generation

`skills/scraping-leads` — Search visibility, lead enrichment, cold outreach, and structured extraction.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **ai-seo** | `skills/scraping-leads/ai-seo` | unverified | When the user wants to optimize content for AI search engines, get cited by LLMs, or appear in AI-generated answers. Also use when the user mentions 'AI SEO,' 'AEO,' 'GEO,' 'LLMO,' 'answer engine optimization,' 'generat… |
| ★ **cold-email** | `skills/scraping-leads/cold-email` | unverified | Write B2B cold emails and follow-up sequences that get replies. Use when the user wants to write cold outreach emails, prospecting emails, cold email campaigns, sales development emails, or SDR emails. Also use when the… |

<a id="social-media"></a>

## Writing & Social Publishing

`skills/social-media` — Human-sounding writing, platform formatting, and publishing workflows.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **human-writer** | `skills/social-media/human-writer` | unverified | Transforms text into authentic, high-retention human writing using Wikipedia's Manual of Style and human engineering prose. Eliminates AI slop, em dashes, robotic symmetries, and formulaic templates. |
| ★ **instagram-autoposting** | `skills/social-media/instagram-autoposting` | unverified | Rules, vertical 9:16 video specifications, caption structures, deduplication guards, and DOM automation patterns for publishing full-screen Instagram Reels for @abrar_akhunji.py. |
| ★ **linkedin-autoposting** | `skills/social-media/linkedin-autoposting` | unverified | Rules, structure, whitespace guidelines, DOM automation patterns, and video upload specifications for publishing professional AI engineering deep dives to LinkedIn for Abrar Akhunji. |
| ★ **writing-guidelines** | `skills/social-media/writing-guidelines` | MIT | Review docs/prose for Writing Guidelines compliance. Use when asked to "review my docs", "check writing style", "audit prose", "review docs voice and tone", or "check this page against the writing handbook". |
| **docs** | `skills/social-media/anthropic-docs` | CC0-1.0 | docs (editable docs people share and comment on; the default for any document, named as a doc or not: a document, report, proposal, resume, cover letter, letter, contract, policy, form, template, worksheet, essay, handb… |
| **internal-comms** | `skills/social-media/internal-comms` | Apache-2.0 | A set of resources to help me write all kinds of internal communications, using the formats that my company likes to use. Claude should use this skill whenever asked to write some sort of internal communications (status… |
| **linkedin-profile-optimizer** | `skills/social-media/linkedin-profile-optimizer` | unverified | Optimize LinkedIn profile for searchability, recruiter visibility, and engagement |
| **writing-beats** | `skills/social-media/writing-beats` | MIT | Writing, exploit; assemble raw material into a journey of beats, grounding each term before a beat leans on it. |
| **writing-fragments** | `skills/social-media/writing-fragments` | MIT | Writing, explore: mine raw fragments, no structure yet. |
| **writing-shape** | `skills/social-media/writing-shape` | MIT | Writing, exploit: shape raw material into an article, paragraph by paragraph. |
| **x-autoposting** | `skills/social-media/x-autoposting` | unverified | Rules, copywriting frameworks, DOM automation patterns, and media specifications for publishing high-retention technical posts and videos to X (Twitter) for @Abrarakhunji. |

<a id="media"></a>

## Video, Motion & Generative Media

`skills/media` — Programmatic video, motion design, canvas, and generative art.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **canvas** | `skills/media/canvas` | unverified | A Codex Canvas is a live React app that the user can open beside the chat. You MUST use a canvas when the agent produces a standalone analytical artifact — quantitative analyses, billing investigations, security audits,… |
| ★ **hyperframes** | `skills/media/hyperframes` | unverified | Read first to make, edit, animate or render any video with HyperFrames (HTML rendered to video), including launch films, explainers, music videos, charts, maps, vertical clips, title cards, captions and overlays. Holds … |
| ★ **media-use** | `skills/media/media-use` | unverified | Get or make any media for a HyperFrames video - music, sound effects, images, icons, logos, voiceover, avatar and generated video, transcripts, cutouts, colour grades and looks - with HeyGen or free local tools, and mix… |
| ★ **motion-reel** | `skills/media/motion-reel` | unverified | Produce a beat-synced product launch reel / showreel / promo video in code. The pipeline captures a product URL's real brand assets, writes a style guide, measures the beat grid, and gets a shotlist approved. It then bu… |
| **algorithmic-art** | `skills/media/algorithmic-art` | Apache-2.0 | Creating algorithmic art using p5.js with seeded randomness and interactive parameter exploration. Use this when users request creating art using code, generative art, algorithmic art, flow fields, or particle systems. … |
| **hyperframes-cli** | `skills/media/hyperframes-cli` | unverified | The HyperFrames CLI by job - scaffold, check, look at frames, edit the timeline, preview, render locally or in the cloud, publish, project history - plus reading its JSON and recovering from build or render failures. |
| **hyperframes-registry** | `skills/media/hyperframes-registry` | unverified | About 450 ready-made HyperFrames blocks and components installed as editable source - transitions, overlays, titles, kinetic type, captions, charts, map overlays, 3D, camera moves. Use it before hand-building any named … |
| **visualize** | `skills/media/visualize` | unverified | Use /visualize for creating compact charts, diagrams, or other visuals inline as part of the conversation itself. It chooses among Markdown tables, Mermaid, inline HTML, and other supported in-transcript forms. Use Canv… |

<a id="agent-tooling"></a>

## Agent Tooling & Configuration

`skills/agent-tooling` — Creating, configuring, and operating skills, hooks, rules, subagents, and agent CLIs.

| Skill | Path | License | What it does |
| :--- | :--- | :--- | :--- |
| ★ **create-skill** | `skills/agent-tooling/create-skill` | unverified | Create Codex Agent Skills. Use when authoring a new skill or asking about SKILL.md structure. |
| ★ **loop** | `skills/agent-tooling/loop` | unverified | Run a prompt or skill in this session on a recurring or variable interval (e.g. /loop 5m /foo). |
| ★ **sdk** | `skills/agent-tooling/sdk` | unverified | Guide users building apps, scripts, CI pipelines, or automations on top of the Codex SDK - TypeScript (`@cursor/sdk`) or Python (`cursor-sdk` / `cursor_sdk`). Use when the user mentions integrating, installing, or writi… |
| ★ **skill-creator** | `skills/agent-tooling/skill-creator` | Apache-2.0 | Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill p… |
| ★ **split-to-prs** | `skills/agent-tooling/split-to-prs` | unverified | Split current work into small reviewable PRs. Use when the user asks to split a chat, set of changes, branch, or PR. |
| ★ **writing-skills** | `skills/agent-tooling/writing-skills` | MIT | Use when creating new skills, editing existing skills, or verifying skills work before deployment |
| **automate** | `skills/agent-tooling/automate` | unverified | Use this skill to create Codex Automations. |
| **babysit** | `skills/agent-tooling/babysit` | unverified | Keep a PR merge-ready by triaging comments, resolving clear conflicts, and fixing CI in a loop. |
| **create-hook** | `skills/agent-tooling/create-hook` | unverified | Create Codex hooks. Use when you want to create a hook, write hooks.json, add hook scripts, or automate behavior around agent events. |
| **create-rule** | `skills/agent-tooling/create-rule` | unverified | Create Codex rules for persistent AI guidance. Use when you want to create a rule, add coding standards, set up project conventions, configure file-specific patterns, create RULE.md files, or asks about .cursor/rules/ o… |
| **create-subagent** | `skills/agent-tooling/create-subagent` | unverified | Create custom subagents for specialized AI tasks. Use when you want to create a new type of subagent, set up task-specific agents, configure code reviewers, debuggers, or domain-specific assistants with custom prompts. |
| **migrate-to-skills** | `skills/agent-tooling/migrate-to-skills` | unverified | Convert 'Applied intelligently' Codex rules (.cursor/rules/*.mdc) and slash commands (.cursor/commands/*.md) to Agent Skills format (.cursor/skills/). Use when you want to migrate rules or commands to skills, convert .m… |
| **new-repo** | `skills/agent-tooling/new-repo` | unverified | Create a Codex-hosted repo for the current project and push it. Use when a project has no git remote yet and the user asks to create a repo on Codex, push the project to Codex, or set up a Codex-hosted remote; installs … |
| **onboard** | `skills/agent-tooling/onboard` | unverified | Use /onboard for a focused Codex onboarding flow that learns basic preferences, picks a first goal, and routes the user to the right next action. |
| **origin** | `skills/agent-tooling/origin` | unverified | Install, sign in, update, or repair the origin CLI for repos hosted on Codex (origin.cursor.com). Use when the CLI is missing or outdated, git push/pull fails to authenticate against origin.cursor.com, or the user asks … |
| **rename-chat** | `skills/agent-tooling/rename-chat` | unverified | Rename the current chat to match its focus. Use only when the user invokes /rename-chat. Optional text after the command steers the title. |
| **share** | `skills/agent-tooling/share` | unverified | Save, back up, or share the current project on Codex — creates a repo (a saved, versioned copy that isn't public) even for users who have never used git, handling all setup automatically. Use when the user asks to save,… |
| **shell** | `skills/agent-tooling/shell` | unverified | Runs the rest of a /shell request as a literal shell command. Use only when the user explicitly invokes /shell and wants the following text executed directly in the terminal. |
| **statusline** | `skills/agent-tooling/statusline` | unverified | Configure a custom status line in the CLI. Use when the user mentions status line, statusline, statusLine, CLI status bar, prompt footer customization, or wants to add session context above the prompt. |
| **update-cli-config** | `skills/agent-tooling/update-cli-config` | unverified | View and modify Codex CLI configuration settings in ~/.cursor/cli-config.json. Use when the user wants to change CLI settings, configure permissions, switch approval mode, enable vim mode, toggle display options, config… |
| **update-cursor-settings** | `skills/agent-tooling/update-cursor-settings` | unverified | Modify Codex/VSCode user settings in settings.json. Use when you want to change editor settings, preferences, configuration, themes, font size, tab size, format on save, auto save, keybindings, or any settings.json valu… |
| **writing-for-agents** | `skills/agent-tooling/writing-for-agents` | MIT | Writing documents for agents. Use when creating or editing skills, or modifying AGENTS.md or CLAUDE.md. |

