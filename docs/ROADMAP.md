# SkillKit Roadmap (Atlas, Router v3 & GAT)

1. **Stage 1 (Phases 0–2) — Gates, Atlas Ingestion, Quality & Tag Audit**
   - Phase 0: Pre-register GAT filters and `server-only` headline mode, define deterministic blind adjudication (`lib/atlas-taxonomy.js` + `bench/gat/score.mjs`), confirm SPDX freely-redistributable license list (keep `BSL-1.0`, exclude `BUSL-1.1`), split `development.tsv` into tune/validate halves, gitignore `bench/results-private/`.
   - Phase 1: Expand bounded compliant Atlas discovery via authenticated GitHub API (in-memory `gh auth token`), `obra/superpowers`, first-party publishers, and anonymous `SkillsMP` within quota (skip `skills.sh` bulk crawl and `Tessl`); enforce skill-directory license evidence and text/reference-only mirroring into `auto-verified` and `reviewed` tiers.
   - Phase 2: Deterministic structural tagging (`deliverables`, `tools`, `formats`, `stage`, `domain`), SimHash deduplication, static security scan, and 200-entry stratified tag audit with measured per-field error rates.
2. **Stage 2 (Phases 3–5) — Router v3, Fallback & Unified Delivery**
   - Phase 3: Fix clause/tool/budget bugs in `intent-contract.js`, wire curated deliverable skills, upgrade hybrid retrieval & compact 5–8 card responses (`<= 2048 B`), test on `development-tune` / `development-validate`, and run held-out once per selection mode.
   - Phase 4: Privacy-safe upstream catalog search (opt-in only) and structured `gapBrief`.
   - Phase 5: Unify CLI, MCP, HTTP, `llms.txt`, and `agentRule` delivery and verify zero consumer writes.
3. **Stage 3 (Phases 6–8) — Blinded Quality Evals, 5-Persona Sessions & Final GAT**
   - Phase 6: Evaluate `>= 30` tasks (`>= 3` runs/arm) with `codex exec` (`gpt-6.2-astra`, equal effort), primary automated checks + separate blinded judge.
   - Phase 7: Run 5-persona headless `codex exec` sessions across `pointer`, `snippet`, and `manual` arms.
   - Phase 8: Final `npm test`, `npm run gat`, and GAT report.
