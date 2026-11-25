# GAT routing adjudications

The frozen evaluation contains 66 in-scope briefs across eight domains and 15 outside controls. The author wrote new fictional briefs from catalog metadata and product workflows before viewing routing results. The dataset includes production-shaped specialist requests with no verified native handoff and cases where an adjacent tool reference is useful but leaves a gap. The raw brief is the only input sent to the engine. The first response, local registries, and the approved pinned federation snapshot are the only scoring inputs. The benchmark does not retrieve skill bodies or contact third parties.

The freeze manifest records the SHA-256 of the cases. The baseline ran against a clean Git archive of commit `4513849`. The test runner logs aggregate counts and percentages. Supplemental user files have separate result rows and do not affect the frozen-set gate.

## Decision rules

- **Usable kit** requires READY, evidence for every essential component, no question or open gap, and no identified hard constraint violation. Each component has independently authored descriptive terms and a set of interchangeable IDs. Some components also require a check with specified content. A returned ID without a selected stage and an eligible catalog reference earns no credit.
- **Confidently wrong** counts a READY response that fails any usable-kit condition. The denominator for both metrics is the 66 in-scope briefs.
- **Constraint adherence** uses the cases with explicit constraints in gold. The scorer checks prohibited references and actions, free reference eligibility, and tool or format evidence on READY. Abstention can honor a constraint while missing the deliverable.
- **Specialist fallback** requires a specific named gap. A useful PARTIAL must show evidence for the supported portion. NO_MATCH must select no stages or references and ask no question.
- **Outside accuracy** requires NO_MATCH with no selected stages, references, or follow-up question.
- **Response size** is the serialized compact JSON kit in UTF-8 bytes across all cases. Protocol framing and later reads are outside that measurement.

A candidate can be useful in practice and miss a class if its ID or descriptive capability was absent from the preregistered alternatives. The scorer does not claim that a selected reference proves a completed artifact. A formal exception needs independent source evidence and a separately reported sensitivity check. Keep the freeze and the original scores intact. No exceptions were applied to the baseline.

## Phase 0 pre-registered gates and deterministic blind adjudication (2026-11-25)

Before Atlas expansion, router changes, or held-out re-scoring, the following rules are pre-registered in `bench/gat/score.mjs`, `bench/gat/run.mjs`, and `lib/atlas-taxonomy.js`:

1. **Headline vs. adjudicated reporting (Amendment A).** Strict-frozen matching (`ids.includes(item.id)` against the untouched SHA-256-frozen `heldout.json`) remains the headline Gate 3 score and determines `rightKit.pass`. Alongside it, `scoreSet(..., { includeAdjudicated: true })` reports `routing.adjudicated` using a deterministic rule with zero hand-mapped Atlas IDs.
2. **Deterministic Atlas equivalence rule.** Under `adjudicate: true`, a newly ingested `federated/` skill (with `status === 'approved'`, valid 40-char commit SHA, 64-char checksum, non-empty `licenseEvidence`, `!scan?.blocked`, `!duplicateOf`, license in the 12-entry freely-redistributable-with-attribution SPDX set including `BSL-1.0` and excluding `BUSL-1.1`, attached to at least one stage, and matching any `group.checks`) satisfies a gold class `group` iff:
   - Its normalized `deliverables` intersect the canonical deliverables derived deterministically from `group.label`, `group.terms`, `@`-prefixed IDs, and curated `group.ids` (`deriveGoldDeliverables` in `lib/atlas-taxonomy.js`); and
   - Its normalized `tools` (and `formats` for language-named tools) satisfy every tool required by `test.constraints.requiredTools` and every specialized tool named in `group.label` / `@ids` (`deriveGoldTools`); and
   - No `excludeIds`, `excludeMarkers`, or `budget === 'free'` constraint is violated.
3. **Pre-registered selection mode and gate qualification filters (Amendment F).**
   - **Gate 1 (`zeroInstall`):** `scripts/check-delivery.js` exits `0`, and every qualified Phase 7 session records `projectFilesChanged.length === 0`.
   - **Gate 2 (`handsOff`):** `qualified` requires `t.realSession === true && t.verifiedInference === true`. Stale prototype runs using local `Qwen2.5-1.5B` (`localInference: true`, `0/8` snippet activation) and disabled `claude -p` sessions (`Claude Code` reported as unverified) are excluded from the active `gpt-6.2-astra` denominator and preserved in git history (`wip: prototypes`). `activation` requires `t.completed && !t.error && t.calledSkillKit` across `>= 5` personas in both `snippet` and `pointer` arms with `>= 90%` snippet activation.
   - **Gate 3 (`rightKit`):** Headline selection mode is **`server-only`** (`evaluate.mjs` `autoSelection`, network disabled so held-out briefs are never transmitted to any model API), judged on strict-frozen headline metrics (`inScope >= 60`, `outside >= 15`, `usablePct >= 70`, `wrongPct <= 2`, `constraintPct >= 95`, `fallbackPct >= 90`, `outsidePct === 100`).
   - **Gate 4 (`lean`):** `maxFirstResponseBytes <= 2048` (full JSON-RPC discovery framing via `responseBytes(card)`), and median `tokensToWorkingKit` and `callsToWorkingKit` for qualified `snippet` sessions strictly below qualified `manual` sessions across `>= 5` personas (`t.completed && !t.error && t.workingKit` with finite numeric token and call counts).
   - **Gate 5 (`betterWork`):** `bench/gat/quality-handoff.json` with `qualifiedTasks >= 30`, `minRunsPerArm >= 3`, `blinded === true`, 95% Wilson CI (`interval95`), `wins > losses`, and `losses <= wins` in every category, using automated functional checks as primary signal and a separate blinded judge session (`gpt-6.2-astra` at equal effort) for tie-breaking.
