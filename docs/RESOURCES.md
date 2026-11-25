# Resource Catalog

Generated from `registry/resources.json` on 2026-11-17. Do not edit by hand: run `npm run build:registry && npm run docs`.

164 developer resources across 11 categories. These are links and references, not vendored code.

| Category | Entries |
| :--- | ---: |
| [Agent Workflows & Skill Ecosystems](#agent-workflows) `agent-workflows` | 20 |
| [Architecture, Code Quality & Dead Code](#architecture-code-quality) `architecture-code-quality` | 19 |
| [Automation, Scraping & Leads](#automation-scraping) `automation-scraping` | 10 |
| [Backend, Databases & Data](#backend-data) `backend-data` | 18 |
| [Design, UI & Motion](#design-ui) `design-ui` | 27 |
| [Frontend Platform & Performance](#frontend) `frontend` | 20 |
| [Learning & Reference](#learning-reference) `learning-reference` | 6 |
| [Media, Video & Generative Art](#media-video) `media-video` | 10 |
| [Mobile Platforms](#mobile) `mobile` | 8 |
| [Planning, Specs & Documentation](#planning-docs) `planning-docs` | 9 |
| [Security & Reverse Engineering](#security) `security` | 17 |

<a id="agent-workflows"></a>

## Agent Workflows & Skill Ecosystems

Source file: `resources/agent-workflows.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [skills.sh](https://www.skills.sh/) | skill-registry | free | index of community skills; per-skill licenses vary | The open agent-skills ecosystem: leaderboard, topics, official packs, audits, and install commands. |
| [vercel-labs/skills](https://github.com/vercel-labs/skills) | skill | free | MIT | The find-skills skill and the Skills CLI source. |
| [Anthropic Skills](https://github.com/anthropics/skills) | skill-library | free | Apache-2.0 per skill | Anthropic's official skill collection: frontend design, skill creator, MCP builder, webapp testing, canvas, documents, and more. |
| [Superpowers](https://github.com/obra/superpowers) | skill-library | free | MIT | A large skill system for planning, debugging, TDD, code review, parallel agents, and verification. |
| [Matt Pocock skills](https://github.com/mattpocock/skills) | skill-library | free | MIT | Engineering and productivity skills including grilling, domain modeling, codebase design, triage, and spec writing. |
| [Addy Osmani Agent Skills](https://github.com/addyosmani/agent-skills) | skill-library | free | MIT | Broad engineering skill set covering planning, specs, code quality, debugging, performance, security, and shipping. |
| [system_prompts_leaks](https://github.com/asgeirtj/system_prompts_leaks) | prompt-archive | free | CC0-1.0 | Archive of public system prompts and agent skills from Anthropic, OpenAI, Google, Meta, and others, updated frequently. |
| [Agent-Reach](https://github.com/Panniantong/Agent-Reach) | agent-tool | free | MIT | One CLI for reading and searching Twitter/X, Reddit, YouTube, GitHub, Bilibili, and XiaoHongShu without API fees. |
| [ego lite](https://lite.ego.app/) | agent-browser | free | commercial product | A Chromium browser designed for humans and agents, with a dedicated ego-browser skill. |
| [Vercel Agent Browser](https://github.com/vercel-labs/agent-browser) | agent-browser | free | Apache-2.0 | Browser automation CLI built for AI agents, with snapshots and ref-based interaction. |
| [Playwright MCP](https://github.com/microsoft/playwright-mcp) | mcp-server | free | Apache-2.0 | Playwright's accessibility-tree browser automation exposed as an MCP server. |
| [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp) | mcp-server | free | Apache-2.0 | Chrome DevTools exposed to agents for performance traces, console, network, and DOM inspection. |
| [Browser Use](https://github.com/browser-use/browser-use) | agent-browser | free | MIT | Python library that lets agents control a browser through natural-language actions. |
| [Firecrawl](https://github.com/mendableai/firecrawl) | scraping-tool | freemium | AGPL-3.0 | Turn websites into LLM-ready markdown or structured data. |
| [Crawl4AI](https://github.com/unclecode/crawl4ai) | scraping-tool | free | Apache-2.0 | Open-source, LLM-friendly web crawler and scraper. |
| [Context7](https://github.com/upstash/context7) | mcp-server | free | MIT | Up-to-date library documentation exposed to agents through MCP. |
| [Repomix](https://github.com/yamadashy/repomix) | context-tool | free | MIT | Packs a repository into a single AI-friendly file with structure and token counts. |
| [Serena](https://github.com/oraios/serena) | mcp-server | free | MIT | Semantic code retrieval and editing tools exposed through MCP. |
| [Antigravity Boost (/boost)](https://antigravity.google/docs/boost/) | builtin-agent-command | paid Antigravity plans | Google documentation; no portable skill license established | Built-in Antigravity command for difficult engineering tasks, with specialized subagents, improvement rounds, and independent verification. |
| [Antigravity Custom Subagents](https://antigravity.google/docs/subagents) | official-documentation | see Antigravity plan availability | Google documentation; linked only | Official guide to background subagents and the Boost, Swarm, and Teamwork orchestrators. |

<a id="architecture-code-quality"></a>

## Architecture, Code Quality & Dead Code

Source file: `resources/architecture-code-quality.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [Refactoring Guru](https://refactoring.guru/) | reference | freemium | commercial site | Illustrated catalog of design patterns, refactoring techniques, and code smells. |
| [Martin Fowler](https://martinfowler.com/) | reference | free | commercial site; articles copyrighted | Foundational writing on refactoring, architecture, domain modeling, and evolutionary design. |
| [System Design Primer](https://github.com/donnemartin/system-design-primer) | learning-resource | free | CC-BY-4.0 | Open-source guide to large-scale system design with diagrams and tradeoffs. |
| [C4 Model](https://c4model.com/) | architecture-method | free | CC-BY-4.0 | A hierarchical way to diagram software architecture: context, containers, components, code. |
| [Architecture Decision Records](https://adr.github.io/) | architecture-practice | free | open community resources | Lightweight templates and conventions for recording architectural decisions. |
| [Best Dead Code Detection Tools (2026)](https://repowise.dev/blog/comparisons/best-dead-code-detection-tools) | comparison-guide | free | commercial site; article copyrighted | Language-by-language comparison of dead-code tools: Knip, Vulture, deadcode, deptry, ts-prune, Go deadcode, PMD, PHPStan, cargo-machete, and repowise. |
| [Knip](https://knip.dev/) | code-quality-tool | free | ISC | Finds unused files, exports, and dependencies in JavaScript and TypeScript projects, including monorepos. |
| [Vulture](https://github.com/jendrikseipp/vulture) | code-quality-tool | free | MIT | Python dead-code finder with confidence scores and whitelist support. |
| [deadcode](https://github.com/albertas/deadcode) | code-quality-tool | free | MIT | Python dead-code detector with a `--fix` mode. |
| [deptry](https://github.com/fpgmaas/deptry) | code-quality-tool | free | MIT | Reports missing, unused, and misplaced Python dependencies. |
| [ts-prune](https://github.com/nadeesha/ts-prune) | code-quality-tool | free | MIT | Prints unused exports from a TypeScript project. |
| [dependency-cruiser](https://github.com/sverweij/dependency-cruiser) | architecture-tool | free | MIT | Validates and visualizes JavaScript/TypeScript dependency graphs and architectural rules. |
| [madge](https://github.com/pahen/madge) | architecture-tool | free | MIT | Generates dependency graphs and detects circular dependencies in JS/TS projects. |
| [jscpd](https://github.com/kucherenko/jscpd) | code-quality-tool | free | MIT | Copy/paste detector for many languages. |
| [Semgrep](https://semgrep.dev/) | static-analysis-tool | freemium | LGPL-2.1 (OSS engine) | Pattern-based static analysis for security and code-quality rules across many languages. |
| [CodeQL](https://codeql.github.com/) | static-analysis-tool | free for public repos | GitHub terms | Semantic code analysis engine used by GitHub code scanning. |
| [SonarQube](https://www.sonarsource.com/products/sonarqube/) | code-quality-platform | freemium | LGPL-3.0 (Community Build) | Continuous code-quality and security analysis with quality gates. |
| [Andrej Karpathy Guidelines & Skills](https://github.com/multica-ai/andrej-karpathy-skills) | repository | free | MIT | Community-maintained coding guidelines inspired by Andrej Karpathy, covering surgical changes, explicit assumptions, and verifiable outcomes. |
| [Docker build best practices](https://docs.docker.com/build/building/best-practices/) | documentation | free | Publisher terms (reference link only) | Docker documents multi-stage builds, base image choice, dependency management and Dockerfile instructions. |

<a id="automation-scraping"></a>

## Automation, Scraping & Leads

Source file: `resources/automation-scraping.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [Playwright](https://playwright.dev/) | browser-automation | free | Apache-2.0 | Cross-browser automation with reliable locators, tracing, and test runner. |
| [Puppeteer](https://pptr.dev/) | browser-automation | free | Apache-2.0 | Chrome/Chromium automation library for Node.js. |
| [Scrapy](https://scrapy.org/) | scraping-framework | free | BSD-3-Clause | Python framework for large-scale structured crawling. |
| [Apify](https://apify.com/) | scraping-platform | freemium | commercial service | Hosted scraping and automation platform with ready-made actors. |
| [Browserbase](https://www.browserbase.com/) | browser-infrastructure | freemium | commercial service | Hosted headless browser infrastructure for agents. |
| [Stagehand](https://github.com/browserbase/stagehand) | browser-automation | free | MIT | AI-native browser automation with a Playwright-compatible core. |
| [Steel Browser](https://github.com/steel-dev/steel-browser) | browser-infrastructure | free | Apache-2.0 | Open-source browser API for agents. |
| [Trigger.dev](https://trigger.dev/) | background-jobs | freemium | Apache-2.0 | Background jobs and durable workflows for TypeScript. |
| [Inngest](https://www.inngest.com/) | background-jobs | freemium | Apache-2.0 | Event-driven durable functions with steps and retries. |
| [Temporal](https://temporal.io/) | workflow-engine | freemium | MIT | Durable execution platform for long-running workflows. |

<a id="backend-data"></a>

## Backend, Databases & Data

Source file: `resources/backend-data.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [Prisma](https://www.prisma.io/) | orm | free | Apache-2.0 | Type-safe ORM and schema tooling for Node.js and TypeScript. |
| [Drizzle ORM](https://orm.drizzle.team/) | orm | free | Apache-2.0 | SQL-first TypeScript ORM with a lightweight runtime. |
| [Supabase](https://supabase.com/) | backend-platform | freemium | Apache-2.0 (self-hosted) | Postgres backend with auth, storage, realtime, and generated APIs. |
| [Neon](https://neon.tech/) | database-platform | freemium | Apache-2.0 (open-source components) | Serverless Postgres with branching and scale-to-zero. |
| [PlanetScale](https://planetscale.com/) | database-platform | freemium | commercial service | Managed MySQL-compatible database with branching workflows. |
| [PostgreSQL](https://www.postgresql.org/) | database | free | PostgreSQL License | Open-source relational database with strong correctness and extension support. |
| [Redis](https://redis.io/) | database | freemium | RSALv2 / SSPLv1 for current versions | In-memory data store for caching, queues, and realtime state. |
| [Zod](https://zod.dev/) | validation-library | free | MIT | TypeScript-first schema validation with static type inference. |
| [OpenAPI](https://www.openapis.org/) | api-specification | free | Apache-2.0 | Standard specification for describing HTTP APIs. |
| [Postman](https://www.postman.com/) | api-tool | freemium | commercial service | API client, collections, and collaboration platform. |
| [Hoppscotch](https://hoppscotch.io/) | api-tool | freemium | MIT | Open-source API client that runs in the browser or self-hosted. |
| [dbt](https://www.getdbt.com/) | data-transform-tool | freemium | Apache-2.0 (dbt Core) | SQL-based transformation framework with tests, docs, and lineage. |
| [BigQuery](https://cloud.google.com/bigquery) | data-warehouse | paid | commercial service | Google Cloud's serverless analytics warehouse. |
| [DuckDB](https://duckdb.org/) | analytics-database | free | MIT | In-process analytical SQL database. |
| [Apache Airflow](https://airflow.apache.org/) | workflow-orchestrator | free | Apache-2.0 | Programmatic workflow scheduling and orchestration. |
| [n8n](https://n8n.io/) | automation-platform | freemium | Sustainable Use License (fair-code) | Visual workflow automation with code nodes and self-hosting. |
| [Laravel Boost](https://github.com/laravel/boost) | agent-toolkit | free | MIT | Laravel's MCP server and agent guidelines for application-aware coding. |
| [PacketLark](https://github.com/abrar225/PacketLark) | api-workbench | free | check repository | Local API workbench and HTTP contract engine maintained by this repository's author. |

<a id="design-ui"></a>

## Design, UI & Motion

Source file: `resources/design-ui.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [UI Skills](https://www.ui-skills.com/) | skill-library | free | MIT (skills repo) | Curated design-engineering skills, Design.md references, playbooks, and an MCP/CLI catalog for agents. |
| [ibelick/ui-skills](https://github.com/ibelick/ui-skills) | skill-library | free | MIT | Source repository for UI Skills: routing, baseline UI, canvas, accessibility, metadata, motion performance, and improve-ui skills. |
| [shadcn/ui](https://github.com/shadcn-ui/ui) | component-library | free | MIT | Copy-paste React components built on Radix primitives and Tailwind CSS. |
| [Radix UI](https://www.radix-ui.com/) | component-primitives | free | MIT | Unstyled, accessible React primitives for dialogs, menus, popovers, tabs, and more. |
| [Tailwind CSS](https://tailwindcss.com/) | css-framework | free | MIT | Utility-first CSS framework with a design-token-friendly configuration. |
| [Motion](https://motion.dev/) | animation-library | free | MIT | Production animation library for React and JavaScript, formerly Framer Motion. |
| [Aceternity UI](https://ui.aceternity.com/) | component-library | freemium | mixed / commercial terms | Copy-paste animated components and landing-page sections for React and Next.js. |
| [Magic UI](https://magicui.design/) | component-library | free | MIT | Open-source animated React components built with Tailwind and Motion. |
| [21st.dev](https://21st.dev/) | component-registry | freemium | mixed / per-component | Community registry of React UI components and agent-ready component prompts. |
| [Uiverse](https://uiverse.io/) | component-library | free | mixed / per-element | Community library of CSS and Tailwind UI elements. |
| [Lucide](https://lucide.dev/) | icon-library | free | ISC | Consistent open-source icon set with framework packages. |
| [Phosphor Icons](https://phosphoricons.com/) | icon-library | free | MIT | Flexible icon family with multiple weights and framework packages. |
| [Heroicons](https://heroicons.com/) | icon-library | free | MIT | SVG icons from the Tailwind CSS team, in outline, solid, and mini variants. |
| [Google Fonts](https://fonts.google.com/) | font-library | free | open font licenses | Large catalog of open-source typefaces with web embedding. |
| [Fontshare](https://www.fontshare.com/) | font-library | free | free for personal and commercial use (per font) | Curated free typefaces from Indian Type Foundry. |
| [Coolors](https://coolors.co/) | color-tool | freemium | commercial service | Palette generator with contrast and export tools. |
| [Realtime Colors](https://realtimecolors.com/) | color-tool | free | commercial service | Preview color palettes and typography on a realistic page layout. |
| [Astryx](https://github.com/meta/astryx) | design-system | free | MIT | Meta's open-source, customizable, agent-ready design system with React components, themes, and an Astryx CLI. |
| [dqnamo](https://www.dqnamo.com/) | design-engineering-lab | free | commercial site; code per experiment | Interaction experiments and component ideas from a London design-engineering studio. |
| [Refactoring UI](https://www.refactoringui.com/) | design-book | paid | commercial | Design book and resources by Adam Wathan and Steve Schoger for developers. |
| [Emil Kowalski skills](https://github.com/emilkowalski/skills) | skill-library | free | MIT | Animation, motion review, Apple-design, gestures, and UI-library selection skills. |
| [Impeccable](https://github.com/pbakaus/impeccable) | skill | free | Apache-2.0 | A flagship design skill for production-grade, anti-generic frontend interfaces. |
| [Taste Skill](https://github.com/leonxlnx/taste-skill) | skill | free | MIT | High-agency UX/UI guidance with layout variance, typography, and GSAP motion constraints. |
| [Vivid Sites](https://www.vividsites.app/) | template-library | paid with free samples | commercial | Cinematic Three.js and scroll-film website templates with copy-paste prompts. |
| [GetLayers](https://www.getlayers.ai/) | template-library | paid | commercial | Cinematic AI website template library with prompt-based workflows and an MCP/Figma surface. |
| [Inkscape PDF export guide](https://inkscape-manuals.readthedocs.io/en/latest/export-pdf.html) | documentation | free | Publisher terms (reference link only) | The Inkscape guide explains saving a PDF from an editable SVG and choosing export settings for text and filters. |
| [Figma component naming and organization](https://help.figma.com/hc/en-us/articles/360038663994-Name-and-organize-components) | documentation | freemium | Publisher terms (reference link only) | Figma documents component naming and organization within the Assets panel. |

<a id="frontend"></a>

## Frontend Platform & Performance

Source file: `resources/frontend.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [React](https://react.dev/) | framework | free | MIT | Component-based UI library with the official modern documentation. |
| [Next.js](https://nextjs.org/) | framework | free | MIT | React framework with App Router, server components, routing, and deployment conventions. |
| [Vercel Agent Skills](https://github.com/vercel-labs/agent-skills) | skill-library | free | MIT (per-skill frontmatter) | React best practices, composition patterns, view transitions, React Native, deployment, and writing guidelines. |
| [Three.js](https://threejs.org/) | 3d-library | free | MIT | WebGL renderer and scene graph for 3D browser experiences. |
| [React Three Fiber](https://github.com/pmndrs/react-three-fiber) | 3d-library | free | MIT | React renderer for Three.js with a declarative scene API. |
| [Drei](https://github.com/pmndrs/drei) | 3d-library | free | MIT | Useful helpers and abstractions for React Three Fiber. |
| [GSAP](https://gsap.com/) | animation-library | freemium | standard no-charge license; some plugins paid | Professional-grade JavaScript animation platform with timelines and ScrollTrigger. |
| [Lenis](https://github.com/darkroomengineering/lenis) | scroll-library | free | MIT | Smooth-scroll library that integrates with GSAP and native scrolling. |
| [Rough.js](https://roughjs.com/) | graphics-library | free | MIT | Create hand-drawn, sketchy graphics on canvas and SVG. |
| [Remotion](https://www.remotion.dev/) | video-framework | freemium | company license for companies; free for individuals | Create videos programmatically with React. |
| [HyperFrames](https://github.com/heygen-com/hyperframes) | video-framework | free | Apache-2.0 | HTML-rendered video framework with skills for composition, animation, captions, charts, and rendering. |
| [Astro](https://astro.build/) | framework | free | MIT | Content-focused web framework with islands and minimal client JavaScript. |
| [Svelte](https://svelte.dev/) | framework | free | MIT | Compiled UI framework with reactive language primitives. |
| [Vue](https://vuejs.org/) | framework | free | MIT | Progressive JavaScript framework with a mature ecosystem. |
| [Nuxt](https://nuxt.com/) | framework | free | MIT | Vue framework with routing, server routes, and rendering modes. |
| [Vite](https://vite.dev/) | build-tool | free | MIT | Fast frontend build tool and dev server. |
| [TypeScript](https://www.typescriptlang.org/) | language | free | Apache-2.0 | Typed superset of JavaScript with a mature compiler and language service. |
| [Biome](https://biomejs.dev/) | lint-format-tool | free | MIT | Fast formatter and linter for JavaScript, TypeScript, and web files. |
| [ESLint](https://eslint.org/) | lint-tool | free | MIT | Pluggable static analysis for JavaScript and TypeScript. |
| [Prettier](https://prettier.io/) | format-tool | free | MIT | Opinionated code formatter with broad language support. |

<a id="learning-reference"></a>

## Learning & Reference

Source file: `resources/learning-reference.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [MDN Web Docs](https://developer.mozilla.org/) | reference | free | CC-BY-SA-2.5 for docs | The authoritative reference for HTML, CSS, JavaScript, and web APIs. |
| [web.dev](https://web.dev/) | learning-resource | free | CC-BY-4.0 | Google's guidance on performance, accessibility, and modern web capabilities. |
| [JavaScript.info](https://javascript.info/) | learning-resource | free | CC-BY-NC-SA | Deep, modern JavaScript tutorial from fundamentals to advanced topics. |
| [roadmap.sh](https://roadmap.sh/) | learning-resource | free | community resources | Community roadmaps for frontend, backend, DevOps, AI, and more. |
| [freeCodeCamp](https://www.freecodecamp.org/) | learning-resource | free | BSD-3-Clause for curriculum | Free interactive coding curriculum and certifications. |
| [Awesome Selfhosted](https://github.com/awesome-selfhosted/awesome-selfhosted) | awesome-list | free | CC-BY-SA-3.0 | Large curated list of self-hostable software. |

<a id="media-video"></a>

## Media, Video & Generative Art

Source file: `resources/media-video.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [Motion Canvas](https://motioncanvas.io/) | animation-tool | free | MIT | Programmatic animation with a TypeScript generator API and live editor. |
| [Manim](https://www.manim.community/) | animation-tool | free | MIT | Python animation engine for mathematical and technical explainers. |
| [FFmpeg](https://ffmpeg.org/) | media-tool | free | LGPL/GPL depending on build | The standard command-line toolkit for audio and video processing. |
| [p5.js](https://p5js.org/) | creative-coding | free | LGPL-2.1 | Creative coding library for canvas sketches and generative art. |
| [HyperFrames Skills](https://github.com/heygen-com/hyperframes) | skill-library | free | Apache-2.0 | Video skills for launch films, explainers, music videos, charts, maps, captions, and rendering. |
| [Remotion Skills](https://github.com/remotion-dev/skills) | skill-library | free | see repository | Skills for creating, animating, captioning, and rendering Remotion videos. |
| [DaVinci Resolve editing and post-production training](https://www.blackmagicdesign.com/products/davinciresolve/training) | documentation | free | Publisher terms (reference link only) | Blackmagic Design publishes editor, colorist and Fairlight training with downloadable project exercises for DaVinci Resolve. |
| [After Effects expression basics](https://helpx.adobe.com/after-effects/desktop/work-with-expressions/expression-basics/expression-basics.html) | documentation | paid | Publisher terms (reference link only) | Adobe explains how to add expressions to animation properties, link values and inspect the result in After Effects. |
| [Premiere text-based editing](https://helpx.adobe.com/premiere-pro/using/text-based-editing.html) | documentation | paid | Publisher terms (reference link only) | Adobe documents transcript-based rough cuts, source media transcription and edits to a Premiere sequence. |
| [Remotion caption data and rendering](https://www.remotion.dev/docs/captions/) | documentation | freemium | Publisher terms (reference link only) | Remotion documents timed caption data, subtitle utilities and displaying captions in a composition. |

<a id="mobile"></a>

## Mobile Platforms

Source file: `resources/mobile.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [Flutter](https://flutter.dev/) | mobile-framework | free | BSD-3-Clause | Cross-platform UI toolkit for iOS, Android, web, and desktop. |
| [Dart](https://dart.dev/) | language | free | BSD-3-Clause | The language and toolchain behind Flutter. |
| [Expo](https://expo.dev/) | mobile-framework | freemium | MIT | React Native toolchain with builds, updates, and native module access. |
| [React Native](https://reactnative.dev/) | mobile-framework | free | MIT | Build native mobile apps with React. |
| [Jetpack Compose](https://developer.android.com/compose) | ui-toolkit | free | Apache-2.0 | Android's declarative UI toolkit in Kotlin. |
| [SwiftUI](https://developer.apple.com/xcode/swiftui/) | ui-toolkit | free | Apple terms | Apple's declarative UI framework across its platforms. |
| [Kotlin](https://kotlinlang.org/) | language | free | Apache-2.0 | Concise JVM language with first-class Android support. |
| [Swift](https://www.swift.org/) | language | free | Apache-2.0 | Apple's language for iOS, macOS, and server-side Swift. |

<a id="planning-docs"></a>

## Planning, Specs & Documentation

Source file: `resources/planning-docs.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [The 6 Documents You Need Before Vibe Coding Any App](https://midi-garment-d51.notion.site/The-6-Documents-You-Need-Before-Vibe-Coding-Any-App-3d313d90aa8f80769b6aecefb5f83f45) | planning-guide | free | source page; no license declared; attributed Markdown extraction and source snapshot retained | A complete pre-coding planning system: App Brief, PRD, TRD, App Flow, UI/UX Brief, Backend Schema, and Implementation Plan, with copy-ready templates and prompts. |
| [Shape Up](https://basecamp.com/shapeup) | planning-method | free | book content copyrighted; free to read online | Basecamp's product development method built around shaped work, six-week cycles, and betting. |
| [GitHub Spec Kit](https://github.com/github/spec-kit) | spec-driven-toolkit | free | MIT | Toolkit for spec-driven development with agents: specify, plan, tasks, and implement phases. |
| [BMAD Method](https://github.com/bmad-code-org/BMAD-METHOD) | agent-planning-method | free | MIT | Breakthrough Method for Agile AI-Driven Development with specialized planning agents. |
| [Mermaid](https://mermaid.js.org/) | diagram-tool | free | MIT | Text-based diagrams for flowcharts, sequence diagrams, ER diagrams, and more. |
| [Excalidraw](https://excalidraw.com/) | diagram-tool | free | MIT | Virtual whiteboard for hand-drawn-style architecture and flow sketches. |
| [Notion](https://www.notion.so/) | workspace | freemium | commercial service | Docs, databases, and project workspaces. |
| [Linear](https://linear.app/) | issue-tracker | freemium | commercial service | Fast issue tracking and project planning for software teams. |
| [Jira](https://www.atlassian.com/software/jira) | issue-tracker | freemium | commercial service | Enterprise issue and project tracking. |

<a id="security"></a>

## Security & Reverse Engineering

Source file: `resources/security.json`

| Resource | Type | Pricing | License | Why it matters |
| :--- | :--- | :--- | :--- | :--- |
| [OWASP Top 10](https://owasp.org/Top10/) | security-standard | free | CC-BY-4.0 | The reference list of the most critical web application security risks. |
| [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/) | security-standard | free | CC-BY-4.0 | Application Security Verification Standard: testable requirements by level. |
| [Gitleaks](https://github.com/gitleaks/gitleaks) | secret-scanner | free | MIT | Detects hardcoded secrets in git history and working trees. |
| [TruffleHog](https://github.com/trufflesecurity/trufflehog) | secret-scanner | free | AGPL-3.0 | Secret detection with credential verification across git, files, and cloud storage. |
| [OSV-Scanner](https://github.com/google/osv-scanner) | dependency-scanner | free | Apache-2.0 | Vulnerability scanner backed by the OSV database across lockfiles and containers. |
| [Snyk](https://snyk.io/) | security-platform | freemium | commercial service | Developer security platform for dependencies, containers, code, and IaC. |
| [Dependabot](https://github.com/dependabot) | dependency-updater | free on GitHub | GitHub terms | Automated dependency updates and security alerts on GitHub. |
| [NVD](https://nvd.nist.gov/) | vulnerability-database | free | public domain / NIST terms | National Vulnerability Database with CVE details and severity scores. |
| [MITRE ATT&CK](https://attack.mitre.org/) | threat-model | free | MITRE terms | Knowledge base of adversary tactics and techniques. |
| [HackerOne](https://www.hackerone.com/) | bug-bounty-platform | commercial | commercial service | Bug bounty and vulnerability disclosure platform. |
| [Bugcrowd](https://www.bugcrowd.com/) | bug-bounty-platform | commercial | commercial service | Crowdsourced security testing and bug bounty platform. |
| [PayloadsAllTheThings](https://github.com/swisskyrepo/PayloadsAllTheThings) | security-reference | free | MIT | Curated payloads and bypass techniques for web security testing. |
| [SecLists](https://github.com/danielmiessler/SecLists) | security-reference | free | MIT | Security testing wordlists for discovery, fuzzing, and credentials. |
| [ffuf](https://github.com/ffuf/ffuf) | security-tool | free | Apache-2.0 | Fast web fuzzer for content discovery and parameter testing. |
| [Burp Suite Community](https://portswigger.net/burp/communitydownload) | security-tool | free | commercial EULA | Community edition of the widely used web security testing proxy. |
| [Caido](https://caido.io/) | security-tool | freemium | commercial EULA | Modern web security auditing toolkit with a lightweight proxy. |
| [mitmproxy](https://mitmproxy.org/) | security-tool | free | MIT | Interactive HTTPS proxy with a Python API. |

