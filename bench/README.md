# Routing benchmark

Run `node bench/run.mjs --compare bench/baseline.json` from the repository root after the held-out fixture is released. Use `--public-only --detail` to run the development and review cases during implementation. Use `--enforce` to fail the benchmark when the final candidate exceeds the error, constraint, size or permanent regression thresholds.

## Fixtures and freeze

The 120 fictional briefs span coding, UI/frontend, graphic design, video, motion, writing, data and DevOps. There are 12 reproduced review prompts, the two shorter variants from the specification, 66 development prompts and 40 separately authored held-out prompts. During development, the held-out file is kept outside the repository. The evaluator supplies it with `--held-out <path>`. The runner verifies the SHA-256 digests in [freeze.json](freeze.json) before reading any fixture. It never emits individual held-out results. The published final fixture must match the original digest for a run to succeed.

Each row records the brief, intended artifact, format, required tools, incompatible tools and actions, budget, confidence, clarification eligibility and at least one acceptable evidence reference for each component of a determinate brief. Components separated by semicolons must each be covered, while comma-separated items within a component are alternatives. A selector prefixed with `@` matches an exact ID basename so the same named skill can qualify from a verified upstream source.

The exact selectors keep the comparison fixed. A newly added skill or resource can improve coverage only if its canonical ID or approved basename was anticipated when the fixtures were frozen. An independently equivalent new item with a different name may therefore be a benchmark false negative. This does not change the frozen gold.

The starting implementation is commit `99a5430612a757d533ed08117906584b8b4bb621`. [baseline.json](baseline.json) records its findings and source digests. To recompute the baseline, check out that commit separately and supply its absolute path with `--root`. Keep running the current benchmark entry point so both runs use the same scorer and gold. Optional `--out <path>` saves a machine-readable result.

## How to read the metrics

- **Usable kit.** The router asserted READY, every required component received at least one explicitly approved reference, and the kit contained no identified incompatibility. An honest abstention is never a usable kit. New vetted coverage can turn a fallback expectation into a valid READY.
- **Confident wrong.** READY without the evidence needed for a usable kit. The denominator is every brief, including abstentions.
- **Constraint adherence.** No forbidden tool, action, budget requirement or format is violated. READY without a required component is also a format failure. A missing required tool in a purported ready or partial shortlist is a tool failure when there is no approved evidence for the tool. Abstentions can adhere by declining to recommend incompatible material. Interpret adherence alongside usable-kit rate.
- **Correct confidence and fallback.** Coverage and the declared state have to agree. A specific, correctly placed clarification is allowed by the two explicitly ambiguous fixtures. NO_MATCH must offer no selected items. PARTIAL requires an approved component and named gaps for uncovered components. The fallback denominator only counts cases whose pre-run gold expected a gap, so valid newly complete kits count toward correct confidence and useful coverage. Legacy clarification and weak catalog states are mapped to the closest v2 state and still have to pass the evidence checks.
- **Unnecessary question.** Any follow-up on a determinate brief, measured over determinate briefs.
- **Size and tokens.** Compact JSON serialization of the first engine response, measured in UTF-8 bytes and estimated tokens using ceiling of bytes divided by four. The token proxy is not a model tokenizer. The measurement excludes protocol envelope framing and subsequent reads.
- **Time to first usable skill.** Elapsed wall time from the routing invocation through the first successful read of a gold-approved skill, following manifest stage order. The current harness calls the shared delivery function, which can retrieve a verified pinned upstream skill when network access permits. It sends only catalog file paths to an upstream host. The companion reference metric also accepts a relevant resource link already in the first response. Sample counts exclude unavailable or incompatible references. These are observations from the evaluation machine, not production latency.

This benchmark tests selection and confidence on a fixed fixture set. It does not verify generated artifacts, measure a production distribution or provide a statistically independent comparison to a human review. The separate [quality evaluation](quality/) tests generated artifacts.

Run `npm run bench` from a checkout for routing over all 120 cases, the project-context ablation and a replay of the recorded paired artifacts/judgments. Add `-- --enforce` for an exit-code check of the numeric and regression targets. Fresh model generations are a separate operation described in quality/README.md.
