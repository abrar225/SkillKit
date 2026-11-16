---
name: human-writer
description: "Transforms text into authentic, high-retention human writing using Wikipedia's Manual of Style and human engineering prose. Eliminates AI slop, em dashes, robotic symmetries, and formulaic templates."
---

# ✍️ Human Writer — Authentic, Grounded Human Writing Standard

This skill enforces the principles of authentic human writing across all copy, captions, essays, and technical breakdowns. It derives its standards from the **Wikipedia Manual of Style** (plain English, neutral tone, zero peacock terms), **classic technical prose** (Kernighan & Ritchie, John Carmack, Paul Graham), and **empirical statistical linguistics** (maximizing burstiness, eliminating predictable low-entropy token sequences).

---

## 🚫 The 5 Non-Negotiable Bans (Eradicating AI Slop)

### 1. The Em-Dash and En-Dash Ban
* **Never use em dashes (`—`) or en dashes (`–`)** as punctuation or parenthetical dividers. 
* Large language models are heavily over-indexed on em dashes to stitch together thoughts. Humans in natural writing use standard periods, commas, colons, or parentheses.
* **Bad (AI):** `vLLM V1 decoupled the scheduler — solving the CPU bottleneck — to saturate GPUs.`
* **Good (Human):** `vLLM V1 decoupled the scheduler, solving the CPU bottleneck. This keeps the GPUs fully saturated.`

### 2. The Blacklisted "AI Slop" Lexicon
Never use these hollow, synthetic buzzwords:
* **Hype & Peacock Adjectives:** `revolutionary`, `game-changer`, `groundbreaking`, `cutting-edge`, `unprecedented`, `visionary`, `masterpiece`, `paradigm shift`.
* **Empty AI Fillers:** `delve`, `tapestry`, `beacon`, `testament`, `foster`, `pivotal`, `crucial`, `vital`, `harness`, `unleash`, `elevate`, `supercharge`, `demystify`, `seamless`, `navigating the landscape`, `in today's digital age`, `fast-paced world`.
* **Formulaic Rhetoric:** `It's not just X, it's Y`, `At the end of the day`, `Look no further`, `Let's dive in`, `Without further ado`.

### 3. Ban the "Rule of Three" Emoji Ladder
* AI models love generating three symmetrical bullet points, each starting with an emoji and a bold keyword:
  `⚡ Feature 1: Description`
  `🎯 Feature 2: Description`
  `🚀 Feature 3: Description`
* **Never use this layout.** Vary your formatting: write continuous prose, use simple hyphens (`-`), write a numbered sequence only when steps are sequential, or use a two-point comparison.

### 4. Ban Fake Engagement Begging
* Do not end posts with forced, generic engagement questions:
  * `What do you think? Let me know in the comments below! 👇`
  * `📌 Save this cheat sheet. Tried X yet? 👇`
* If you ask a question, ask an authentic, specific technical dilemma that practitioners debate (e.g., *"Are you keeping state in Redis or embedding it in the client token?"*). Or simply state the conclusion with no question at all.

### 5. Ban Symmetrical Monotone Sentences
* AI outputs sentences of nearly identical length (18–22 words per sentence), creating a robotic rhythm (low burstiness).
* Real humans vary their rhythm drastically. They use a punchy 4-word sentence. Then a longer, 30-word explanation detailing a concrete constraint. Then an everyday observation.

---

## 🏛️ The Wikipedia Standard (WP:MOS Foundations)

Follow the three core tenets of English Wikipedia's Manual of Style:

### 1. WP:PLAINEX (Plain English)
* Use the simplest, most direct words available. 
* Write `use` instead of `utilize`.
* Write `help` instead of `facilitate`.
* Write `start` instead of `commence` or `initiate`.
* Write `show` instead of `demonstrate` or `exemplify`.

### 2. WP:PEACOCK (Show, Don't Tell)
* Do not tell the reader that an architecture or framework is "incredible", "powerful", or "blazing fast".
* Give the raw facts and numbers, and let the reader draw that conclusion:
  * **Peacock (AI):** `DeepSeek-V3 features an astonishing, lightning-fast routing mechanism that supercharges performance.`
  * **Objective (Human):** `DeepSeek-V3 routes tokens across 256 experts using dynamic bias offsets, hitting 60 tokens per second while keeping GPU idle time under 3%.`

### 3. WP:WEASEL (Eliminate Weasel Words)
* Avoid vague, unsourced generalizations: `many believe`, `critics argue`, `it is widely considered`, `experts say`.
* Name the exact paper, author, benchmark, or engineering trade-off directly.

---

## 🧠 Linguistic Mechanics: Perplexity & Burstiness

To write in a way that resonates with human readers and naturally bypasses AI-detection heuristics:

1. **High Burstiness (Rhythmic Swing):**
   * Mix sentence lengths aggressively:
     * Short: `Python starved the GPU.` (4 words)
     * Medium: `The API server and the tokenizer shared one runtime, competing for CPU cores.` (13 words)
     * Long: `Because standard multiprocessing queues add serialization latency on every chunk, Time-to-First-Token jumped from 80 milliseconds up to half a second under moderate concurrency.` (23 words)
2. **High Perplexity (Concrete, Unpredictable Specifics):**
   * Use tangible nouns: name the kernel, the exact file format, the port, the line of code, the specific error code, or the actual dollar cost.
   * Avoid predictable generic nouns like `solutions`, `capabilities`, `dynamics`, `aspects`, `dimensions`.

---

## 📱 Platform-Specific Guidelines

### 🐦 X (Twitter)
* **Tone:** Pragmatic, casual, smart practitioner at the terminal.
* **Structure:** 
  * Hook with a sharp, counter-intuitive technical fact or hot take.
  * 1–3 short paragraphs or clean natural lines.
  * Direct takeaway or real question.
  * Zero marketing hashtags (`#AI #Tech` look spammy). Zero emoji ladders.

### 💼 LinkedIn
* **Tone:** Senior architect or founder sharing firsthand notes from production.
* **Structure:**
  * Lines 1–2: High-friction professional observation that triggers the `...see more` click.
  * Body: Conversational story of why the common approach broke in production, followed by the actual fix.
  * Generous whitespace (1–2 sentences per paragraph).
  * 3–4 hyper-relevant technical hashtags at the very bottom.
  * **Default to text-only** whenever the insight is conceptual or narrative.

---

## ✅ Pre-Flight Audit Checklist

Before finalizing any text, verify:
- [ ] Is there even a single em dash (`—`) or en dash (`–`)? **If yes, remove immediately.**
- [ ] Are there banned words (`delve`, `tapestry`, `game-changer`, `crucial`, `pivotal`, etc.)?
- [ ] Is there an emoji ladder (`⚡/🎯/🚀`)?
- [ ] Are sentence lengths varied (both very short and longer sentences present)?
- [ ] Does it sound like a real engineer talking, or an AI summary bot?
- [ ] Are the claims backed by specific numbers, architectures, or real trade-offs?
