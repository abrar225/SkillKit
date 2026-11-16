---
name: linkedin-autoposting
description: "Rules, structure, whitespace guidelines, DOM automation patterns, and video upload specifications for publishing professional AI engineering deep dives to LinkedIn for Abrar Akhunji."
---

# 💼 LinkedIn Autoposting Standard & Protocol

This skill dictates the writing rules, visual requirements, character budgets, DOM selector state machine, and error handling for publishing to **LinkedIn** as `Abrar Akhunji`.

---

## 🎯 Algorithm Mechanics & Professional Standards
On LinkedIn, the algorithm prioritizes:
1. **The "...see more" Click (Click-Through Rate):** The first 2 lines must create high tension, challenging conventional wisdom or stating a costly production disaster.
2. **Readability & Whitespace:** Wall-of-text posts are abandoned. Use 1 to 2-line paragraphs with empty lines between them.
3. **Actionable Systems Engineering:** Break down real architectures, memory trade-offs, and production post-mortems.

---

## ✍️ Copywriting Framework
1. **Length Target:**
   - **1,200 to 1,800 characters** with generous whitespace.
2. **Structure:**
   - **Lines 1–2 (The Hook):** High-friction observation compelling the reader to click `...see more`.
   - **The Conflict:** Why the naive approach breaks at scale (e.g., KV cache blowing past 160 GB VRAM).
   - **The Breakdown:** 2–3 hyphenated or numbered technical solutions with concrete metrics and tool names.
   - **The Takeaway:** One rule senior engineers or tech leads can implement immediately.
   - **Hashtags:** Exactly **3 to 4 hyper-relevant technical tags** at the bottom (e.g. `#SoftwareEngineering #MachineLearning #AIEngineering`).
3. **Tone (@skill:human-writer):**
   - Zero em dashes (`—`) or en dashes (`–`).
   - Zero AI buzzwords (`delve`, `tapestry`, `pivotal`, `crucial`, `game-changer`, `supercharge`).
   - Zero formulaic bullet emojis (`⚡/🎯/🚀`). Use standard hyphens `-` or numbers `1.`.

---

## 🎨 Media Specifications
- **Aspect Ratio:** 16:9 landscape (`1920×1080`) or 1:1 square (`1080×1080`).
- **Format:** MP4 video with audio, or crisp high-contrast dark architectural schematic.
- **Duration:** 8 to 20 seconds.
- **Sanitization:** Run `node sanitize-media.js` prior to dispatch.

---

## 🤖 Browser Automation & DOM State Machine
1. **Authentication Session:** `.auth/linkedin-state.json`.
2. **Start Post Trigger:**
   - Click `button:has-text("Start a post")` or `div.share-box-feed-entry__top-bar`.
3. **Media Upload:**
   - Click media button `button[aria-label*="Add media"]` or direct file input assignment:
     `input[type="file"]`.
   - Wait for video processing preview, then click modal "Next".
4. **Editor Box Selectors:**
   - `div[data-placeholder*="What do you want to talk about?"]`
   - `div.ql-editor`
   - `div[role="textbox"][contenteditable="true"]`
5. **Post Trigger:**
   - Click `button.share-actions__primary-action` or `button:has-text("Post")`.
6. **Verification & Audit:**
   - Verify post submission and extract `urn:li:activity:...` permalink.
   - Append audit record to `history/linkedin-index.json` and `history/LINKEDIN_POSTS_LOG.md`.
