---
name: instagram-autoposting
description: "Rules, vertical 9:16 video specifications, caption structures, deduplication guards, and DOM automation patterns for publishing full-screen Instagram Reels for @abrar_akhunji.py."
---

# 📸 Instagram Autoposting Standard & Protocol

This skill dictates the writing rules, visual requirements, video aspect ratio, DOM selector state machine, and error handling for publishing native full-screen **Instagram Reels** as `@abrar_akhunji.py`.

---

## 🎯 Critical Instagram Reel Rules & Visual Format
1. **Aspect Ratio MUST Be 9:16 Vertical (1080×1920 Full HD):**
   - **Never post 16:9 landscape videos to Instagram.** Landscape videos result in heavy black letterboxing that occupies only "half the screen" on mobile devices.
   - All reel videos must be rendered vertically at **1080×1920** pixels (`render-reel-explainer-9x16.mjs`).
2. **Reel Structure & Layout:**
   - **Top 20%:** Header card with the bold question or architecture hook.
   - **Center 50%:** Expressive animated character kinematics, vertical data token pipes, and interactive GPU/VRAM gauges.
   - **Bottom 30%:** Concrete engineering equation or benchmark takeaway, leaving safe margins for Instagram caption overlay.
3. **Strict Deduplication Guard:**
   - Before launching browser automation, check `history/instagram-index.json`.
   - If the topic was already marked `POSTED`, abort immediately to prevent duplicate posting.

---

## ✍️ Copywriting Framework
1. **Length Target:**
   - **400 to 800 characters** (clean, readable narrative that explains the engineering concept simply).
2. **Structure:**
   - **Line 1 (Hook):** Clear, intriguing question (e.g. "Why do 1,000,000-token prompts freeze your GPU before emitting a single answer?").
   - **The Conflict:** Unpack the misconception vs the reality.
   - **The Fix:** Practical solution in 2 concise sentences.
   - **Hashtags:** 4 to 6 niche engineering hashtags at the bottom (`#SoftwareEngineering #AIEngineering #MachineLearning #DeepLearning #SystemDesign #Coding`).
3. **Tone (@skill:human-writer):**
   - Zero em dashes (`—`) or en dashes (`–`).
   - Zero AI slop vocabulary (`delve`, `tapestry`, `pivotal`, `crucial`, `game-changer`, `supercharge`).
   - Zero "Save this post!" engagement bait.

---

## 🤖 Browser Automation & DOM State Machine
1. **Authentication Session:** `.auth/instagram-state.json`.
2. **Launch Parameters:**
   - Use dedicated Chrome channel with `--disable-blink-features=AutomationControlled`.
3. **Step-by-Step Upload Flow:**
   - **Dismiss Notification Dialog:** `button:has-text("Not Now"), button:has-text("Cancel")`.
   - **Open Create Modal:** Click `svg[aria-label="New post"]`.
   - **Assign Media:** Attach `media/reel-explainer-9x16.mp4` to `input[type="file"]`.
   - **Dismiss Reels Dialog:** Click "OK" on "Video posts are now shared as reels" modal if present.
   - **Crop Step:** Ensure aspect ratio is set to 9:16 (Original / Portrait). Click "Next".
   - **Filters / Cover Step:** Click "Next".
   - **Caption Editor:** Target `div[aria-label="Write a caption..."], div[role="textbox"]` and type caption.
   - **Submit (Share):** Click `button:has-text("Share"), div[role="button"]:has-text("Share")` exactly once.
   - **Confirmation Polling:** Poll DOM every 3s until `Your reel has been shared` confirmation modal appears with "Done".
4. **Verification & Audit:**
   - Check profile `https://www.instagram.com/abrar_akhunji.py/reel/` to capture the live reel URL.
   - Log audit record to `history/instagram-index.json` and `history/INSTAGRAM_POSTS_LOG.md`.
