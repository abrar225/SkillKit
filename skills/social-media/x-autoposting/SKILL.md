---
name: x-autoposting
description: "Rules, copywriting frameworks, DOM automation patterns, and media specifications for publishing high-retention technical posts and videos to X (Twitter) for @Abrarakhunji."
---

# 🐦 X (Twitter) Autoposting Standard & Protocol

This skill dictates the writing rules, visual requirements, character budgets, DOM selector state machine, and error handling for publishing to **X (Twitter)** as `@Abrarakhunji`.

---

## 🎯 Primary Objectives & Algorithm Mechanics
On X, the algorithm heavily prioritizes:
1. **Bookmarks (30x multiplier):** Content must provide hard utility, benchmark numbers, architectural formulas, or terminal commands people need to save.
2. **Dwell Time & Video Watch-Through (10x multiplier):** Dense opening lines and short looping technical explainer videos hold users on the tweet.
3. **Replies & Controversies (20x multiplier):** Frame problems as real engineering trade-offs (e.g. why speculative decoding hurts under high concurrency).

---

## ✍️ Copywriting Framework
1. **Character Budget:**
   - Single tweets: Strictly **$\le 280$ characters**.
   - Thread / Extended posts: Maximum 600 characters for readability.
2. **The Hook:**
   - Bold, counter-intuitive technical observation or contrarian truth.
   - Lead with the failure mode, benchmark stat, or surprising number.
3. **Tone & Lexicon (@skill:human-writer):**
   - Zero em dashes (`—`) or en dashes (`–`). Use periods, commas, or parentheses.
   - Zero AI buzzwords (`delve`, `tapestry`, `crucial`, `pivotal`, `game-changer`, `supercharge`).
   - Zero hashtags. Zero emoji clutter. Write like an engineer at a terminal.

---

## 🎨 Media Specifications
- **Aspect Ratio:** 16:9 widescreen (`1920×1080` or `1280×720`).
- **Format:** MP4 (H.264 video + AAC stereo audio) or PNG/JPG infographic.
- **Duration:** 8 to 15 seconds looping explainer animation.
- **Metadata:** Always sanitize media before uploading using `node sanitize-media.js` to strip EXIF and provenance metadata.

---

## 🤖 Browser Automation & DOM State Machine
1. **Authentication Session:** `.auth/state.json` (Playwright storage state).
2. **Page URL:** `https://x.com/compose/post` or home feed `https://x.com/`.
3. **Compose Box Selectors:**
   - `div[data-testid="tweetTextarea_0"]`
   - `div[role="textbox"][contenteditable="true"]`
4. **Media Input:**
   - `input[data-testid="fileInput"]`
5. **Post Button:**
   - `button[data-testid="tweetButton"]` or `button[data-testid="tweetButtonInline"]`
6. **Verification:**
   - Listen for GraphQL response `CreateTweet` returning HTTP 200/201.
   - Ensure the tweet ID is extracted and stored in `history/index.json` and `history/POSTS_LOG.md`.
