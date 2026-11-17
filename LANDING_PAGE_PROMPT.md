# LANDING PAGE & MCP AGENT BRIDGE: MASTER IMPLEMENTATION PROMPT

> **Target Repository**: `/Users/abrarakhunji/Desktop/Skills`  
> **Target Subdirectory**: `site/` (Web Application) & `bin/mcp-server.js` (Agent MCP Protocol Server)  
> **Model Target**: DeepSeek 4.1 Flash in OpenCode  
> **Author & Curator**: Abrar Akhunji  
> **Aesthetic Standard**: Award-Winning 3D Monochrome Luxury (Pitch Black, Obsidian, Frosted Glass, Pure Luminous White)

---

## 1. ACT AS: MULTI-DISCIPLINARY PRINCIPAL TEAM

You are acting as an elite team comprising:
1. **Senior Frontend Architect**: Master of Next.js 15 App Router, React 19, Three.js / Canvas 2D physics, Framer Motion, and high-performance glassmorphic UI.
2. **Context Engineer**: Grounds all components directly in the repository's ground truth (`registry/skills.json`, `registry/domains.json`, `registry/resources.json`), eliminating duplication.
3. **Harness & Systems Engineer**: Implements the official Model Context Protocol (MCP) server so coding agents (Claude Code, Antigravity, Cursor) can directly query and install skills over stdio.
4. **Loop Engineer**: Implements atomic, self-verifying phases with zero lint, build, or type errors.

---

## 2. STRICT DESIGN CONTRACT: MONOCHROME LUXURY (3D & KINETIC)

* **Palette Rules**: **Shades of black and shades of white ONLY**. Zero colors (no blue, purple, amber, green, or red accents).
  * `obsidian-950`: `#050505` (Deep canvas background)
  * `obsidian-900`: `#09090B` (Base container background)
  * `charcoal-800`: `#121214` (Elevated card background)
  * `zinc-border`: `rgba(255, 255, 255, 0.08)` (Subtle luminous edge)
  * `zinc-border-hover`: `rgba(255, 255, 255, 0.22)` (Glowing interactive edge)
  * `bone-muted`: `#A1A1AA` (Secondary typography & body text)
  * `pure-white`: `#FFFFFF` (Headings, primary actions, and particle stars)
* **Glassmorphism & Lighting**:
  * Backdrops: `backdrop-blur-xl bg-white/[0.02]`
  * Gradients: Pure monochromatic radial glow (`radial-gradient(ellipse at top, rgba(255,255,255,0.09), transparent 60%)`)
  * Rolling typography tickers and terminal glow effects.

---

## 3. ARCHITECTURE & REPOSITORY FILE MAP

```
Skills/
├── bin/
│   ├── vibe-skills.js             # CLI dispatcher with new 'mcp' command
│   └── mcp-server.js              # Native Model Context Protocol (MCP) server
├── site/                          # Premium Web Application
│   ├── package.json               # Next.js 15, React 19, Tailwind, Framer Motion, Lucide
│   ├── tsconfig.json              # Strict TypeScript configuration
│   ├── next.config.ts             # Static optimization & path aliases
│   ├── tailwind.config.ts         # Monochrome luxury theme tokens
│   ├── app/
│   │   ├── layout.tsx             # Root layout with font smoothing and SEO metadata
│   │   ├── page.tsx               # Primary landing page
│   │   ├── globals.css            # Noise texture, custom scrollbars, glowing animations
│   │   └── api/
│   │       ├── skills/route.ts    # JSON endpoint exposing all 192 skills
│   │       ├── resources/route.ts # JSON endpoint exposing 155 resources
│   │       └── domains/route.ts   # JSON endpoint exposing 14 domains
│   ├── components/
│   │   ├── neural-graph/          # 3D Neural Constellation Engine
│   │   │   ├── NeuralCanvas.tsx   # Interactive WebGL/Canvas force-directed network
│   │   │   └── GraphControls.tsx  # Zoom, reset, filter, and cluster toggles
│   │   ├── mcp/                   # MCP Connect Suite
│   │   │   ├── McpConnectModal.tsx# Tabbed config switcher (Claude, Cursor, Antigravity)
│   │   │   └── AgentSimulator.tsx # In-browser live terminal simulating MCP tool queries
│   │   ├── explorer/              # Instant Filter & Search Explorer
│   │   │   ├── ExplorerSection.tsx# Master search controller & domain pill filters
│   │   │   ├── SkillCard.tsx      # Luminous card with capability tags & triggers
│   │   │   ├── SkillDrawer.tsx    # Slide-over full SKILL.md Markdown & provenance viewer
│   │   │   └── ResourceCard.tsx   # Developer tool card (Knip, Astryx, Rough.js)
│   │   ├── hero/                  # Kinetic Hero & Proof
│   │   │   ├── HeroSection.tsx    # Impact typography & CTA buttons
│   │   │   ├── TerminalPreview.tsx# Interactive typing terminal previewing CLI commands
│   │   │   └── ProjectMarquee.tsx # Rolling marquee of the 6 production Desktop projects
│   │   └── navigation/
│   │       ├── Header.tsx         # Sleek glassmorphic navbar with Quick Connect
│   │       └── CommandPalette.tsx # Global Cmd+K Omnisearch
│   └── lib/
│       ├── registry.ts            # High-speed data loader directly referencing ../registry/
│       └── search.ts              # Sub-millisecond client-side fuzzy search
```

---

## 4. STEP-BY-STEP IMPLEMENTATION INSTRUCTIONS

### Step 1: Implement Native MCP Server (`bin/mcp-server.js`)
Build an executable Node.js MCP server using `@modelcontextprotocol/sdk` supporting the `stdio` transport.
1. Read data directly from `../registry/skills.json`, `../registry/domains.json`, and `../registry/resources.json`.
2. Register 5 core tools:
   - `search_skills`: Takes `{ query?: string, domain?: string, capability?: string }`, returns matching skills.
   - `get_skill`: Takes `{ id: string }`, loads its `SKILL.md` and `SOURCE.json`, and returns full instructions and provenance.
   - `list_domains`: Returns all 14 domains, summaries, and flagship skill IDs.
   - `export_skill`: Takes `{ id: string, target: "claude" | "antigravity" | "cursor" }`, returns the exact files and target installation path.
   - `list_resources`: Takes `{ category?: string, query?: string }`, returns matching curated developer resources.
3. Add `mcp` command to `bin/vibe-skills.js` so developers can run `npx vibe-skills mcp`.

---

### Step 2: Initialize `site/` Package & Monochrome Styling
1. In `site/package.json`, set up dependencies:
   - `next`: `^15.0.0`
   - `react`: `^19.0.0`
   - `react-dom`: `^19.0.0`
   - `framer-motion`: `^11.11.0`
   - `lucide-react`: `^0.454.0`
   - `clsx`: `^2.1.1`
   - `tailwind-merge`: `^2.5.4`
2. Configure `site/tailwind.config.ts` strictly using monochrome shades:
   ```typescript
   export default {
     darkMode: 'class',
     content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
     theme: {
       extend: {
         colors: {
           obsidian: { 950: '#040404', 900: '#09090B', 850: '#0E0E11', 800: '#141418' },
           pure: { white: '#FFFFFF', black: '#000000' }
         },
         animation: {
           'marquee': 'marquee 35s linear infinite',
           'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
         },
         keyframes: {
           marquee: {
             '0%': { transform: 'translateX(0%)' },
             '100%': { transform: 'translateX(-50%)' },
           }
         }
       }
     }
   }
   ```
3. Set up `site/lib/registry.ts` to read the root registries cleanly at build time or via dynamic imports so that all 192 skills and 155 resources are instantly accessible.

---

### Step 3: Build the 3D Neural Constellation Graph (`NeuralCanvas.tsx`)
Create an interactive HTML5 Canvas / WebGL force-directed constellation engine:
- **14 Primary Nodes**: The 14 domain hubs (`orchestrator`, `ui-ux`, `frontend`, `security-bug-bounty`, etc.) float in 2D/3D space with subtle ambient orbit.
- **192 Satellite Nodes**: Each skill orbits its designated domain hub with delicate spring physics.
- **Interactive Connections**: Monochromatic luminous lines (`rgba(255,255,255,0.06)`) connect satellites to domain hubs.
- **Physics & Interactivity**:
  - Dragging rotates the entire constellation.
  - Hovering a node enlarges it, highlights its label, and pulses its connection lines.
  - Clicking any node centers it in the viewport and opens the **Skill Quick Drawer**.
  - Typing in the global search bar dims non-matching nodes to 10% opacity while making matching nodes pulse brightly with a pure white halo.

---

### Step 4: Build the 1-Click MCP Connect Suite (`McpConnectModal.tsx` & `AgentSimulator.tsx`)
Create an award-winning modal allowing developers and agents to connect instantly:
1. **Claude Desktop Preset**:
   ```json
   {
     "mcpServers": {
       "skills-hub": {
         "command": "node",
         "args": ["/Users/abrarakhunji/Desktop/Skills/bin/mcp-server.js"]
       }
     }
   }
   ```
2. **Cursor Preset (`.cursor/mcp.json`)**:
   ```json
   {
     "mcpServers": {
       "vibe-skills": {
         "command": "npx",
         "args": ["-y", "@abrar225/skills", "mcp"]
       }
     }
   }
   ```
3. **Antigravity Preset**: Direct command string with 1-click clipboard copy.
4. **Interactive In-Browser Agent Simulator**:
   A live terminal widget where visitors can click sample queries:
   - *"Agent: Search for bug bounty and security auditing skills"*
   - *"Agent: Fetch instructions for gravitas engineering runtime"*
   The simulator animates an agent typing the MCP request and renders the formatted JSON payload returned by the server.

---

### Step 5: Build Universal Explorer & Slide-Over Drawer
1. **Search & Filter Bar**:
   - High-contrast search input with shortcut indicator (`Cmd+K`).
   - 14 Domain pills: `All (192)`, `Orchestrator (16)`, `UI/UX (27)`, `Frontend (12)`, `Mobile (4)`, `Security (6)`, etc.
   - Capability toggles: `templates`, `prompts`, `scripts`, `agents`, `rules`.
2. **Skill Card**:
   - Displays display name, domain badge, trigger badges, capability icons, and a quick "Export" button.
3. **Slide-Over Skill Drawer (`SkillDrawer.tsx`)**:
   - Smooth Framer Motion entrance from the right.
   - Renders Markdown from `SKILL.md`.
   - Displays provenance metadata from `SOURCE.json` (license, status, upstream origin).
   - Shows 1-click terminal export command: `node bin/vibe-skills.js export --target claude --ids <skill-id>`.

---

### Step 6: Build Production Proof Marquee & Hero Section
1. **Hero Section (`HeroSection.tsx`)**:
   - Bold, editorial typography: *"The Agent-First Skills Monorepo for Vibe Coders"*.
   - Subheading: *"192 Battle-Tested Skills. 155 Curated Resources. 14 Specialized Domains. Instantly plugged into Claude Code, Antigravity, and Cursor via MCP."*
   - Two CTAs: **[Explore Neural Graph]** and **[Connect via MCP]**.
2. **Project Marquee (`ProjectMarquee.tsx`)**:
   - Scrolling infinite marquee showcasing the 6 real Desktop workspaces:
     - `FixoFlow` • Voice AI Desktop Assistant
     - `PacketLark` • Local API Workbench & MCP Server
     - `Social Media Manager` • Automated Video & Reels DOM Publisher
     - `FrameCast Studio` • Browser-based Canvas Media Studio
     - `Abrar Portfolio` • Kinetic 3D Interactive Web Experience
     - `Reverse Engineer` • Protocol Analysis & Binary Audit Workbench

---

## 5. VERIFICATION & COMPLETION INVARIANTS

Before declaring the task complete, execute the following commands and ensure zero errors:

1. **Verify MCP Server CLI**:
   ```bash
   node bin/vibe-skills.js --help
   # Verify 'mcp' appears in the help menu
   ```
2. **Compile and Build the Web App**:
   ```bash
   cd site && npm install && npm run build
   # Must compile cleanly with 0 type errors, 0 lint errors, and successful static prerendering
   ```
3. **Verify Monorepo Invariants**:
   ```bash
   cd .. && npm test
   # Must pass with 192 skills, 155 resources, 14 domains, and 0 errors
   ```

Present the exact terminal outputs of `npm run build` and `npm test`, verify that the web application runs via `npm run dev`, and provide the local URL (`http://localhost:3000`).
```

---

## 6. Execution Command for OpenCode

You can now paste this prompt directly into OpenCode. It will build both:
1. **The Native MCP Agent Server** (`bin/mcp-server.js` + CLI command).
2. **The Luxury 3D Monochrome Landing Application** (`site/` with Next.js 15, Neural Constellation Graph, Live Simulator, and Universal Explorer).
