# Frozen release evaluation

Measured 24 November 2026. Each cell shows baseline → release candidate. Distribution cells show median/95th percentile with sample count. All 120 labels, including the held-out checksum, were fixed at baseline. The 80 visible prompts include the original 12, two independent regression phrasings and 66 development examples.

| Metric | All 120 | Original 12 | Development 66 | Variants 2 | Held out 40 |
| --- | --- | --- | --- | --- | --- |
| Usable kit | 25/120 (20.83%) → 35/120 (29.17%) | 5/12 (41.67%) → 5/12 (41.67%) | 17/66 (25.76%) → 24/66 (36.36%) | 0/2 (0%) → 0/2 (0%) | 3/40 (7.5%) → 6/40 (15%) |
| Confidently wrong | 14/120 (11.67%) → 7/120 (5.83%) | 2/12 (16.67%) → 1/12 (8.33%) | 8/66 (12.12%) → 5/66 (7.58%) | 1/2 (50%) → 1/2 (50%) | 3/40 (7.5%) → 0/40 (0%) |
| All constraints respected | 80/120 (66.67%) → 108/120 (90%) | 9/12 (75%) → 11/12 (91.67%) | 48/66 (72.73%) → 58/66 (87.88%) | 1/2 (50%) → 1/2 (50%) | 22/40 (55%) → 38/40 (95%) |
| Required tool respected | 47/83 (56.63%) → 73/83 (87.95%) | 5/8 (62.5%) → 7/8 (87.5%) | 29/45 (64.44%) → 39/45 (86.67%) | 1/2 (50%) → 1/2 (50%) | 12/28 (42.86%) → 26/28 (92.86%) |
| Budget respected | 6/9 (66.67%) → 7/9 (77.78%) | 1/1 (100%) → 1/1 (100%) | 3/5 (60%) → 3/5 (60%) | — → — | 2/3 (66.67%) → 3/3 (100%) |
| Format respected | 106/120 (88.33%) → 115/120 (95.83%) | 10/12 (83.33%) → 11/12 (91.67%) | 60/66 (90.91%) → 63/66 (95.45%) | 1/2 (50%) → 1/2 (50%) | 35/40 (87.5%) → 40/40 (100%) |
| Correct confidence | 28/120 (23.33%) → 57/120 (47.5%) | 5/12 (41.67%) → 7/12 (58.33%) | 20/66 (30.3%) → 34/66 (51.52%) | 0/2 (0%) → 1/2 (50%) | 3/40 (7.5%) → 15/40 (37.5%) |
| Correct fallback on gold gaps | 2/26 (7.69%) → 22/26 (84.62%) | 0/2 (0%) → 2/2 (100%) | 2/12 (16.67%) → 10/12 (83.33%) | 0/1 (0%) → 1/1 (100%) | 0/11 (0%) → 9/11 (81.82%) |
| Unnecessary question on determinate briefs | 10/118 (8.47%) → 1/118 (0.85%) | 1/12 (8.33%) → 0/12 (0%) | 6/64 (9.38%) → 0/64 (0%) | 1/2 (50%) → 0/2 (0%) | 2/40 (5%) → 1/40 (2.5%) |
| First response under 2 KiB | 119/120 (99.17%) → 119/120 (99.17%) | 12/12 (100%) → 12/12 (100%) | 65/66 (98.48%) → 65/66 (98.48%) | 2/2 (100%) → 2/2 (100%) | 40/40 (100%) → 40/40 (100%) |
| First response bytes | 696/1030 (n=120) → 324/1247 (n=120) | 642/1365 (n=12) → 335/1247 (n=12) | 696/1049 (n=66) → 479/1403 (n=66) | 247/642 (n=2) → 272/601 (n=2) | 736/998 (n=40) → 317/1017 (n=40) |
| Estimated tokens | 174/258 (n=120) → 81/312 (n=120) | 161/342 (n=12) → 84/312 (n=12) | 174/263 (n=66) → 120/351 (n=66) | 62/161 (n=2) → 68/151 (n=2) | 184/250 (n=40) → 80/255 (n=40) |
| First usable skill, ms | 1.518/2.402 (n=49) → 0.557/0.987 (n=28) | 0.944/14.015 (n=5) → 0.83/14.585 (n=4) | 0.402/2.124 (n=33) → 0.537/0.826 (n=19) | — → — | 1.584/2.102 (n=11) → 0.385/0.618 (n=5) |
| First usable reference, ms | 1.433/2.402 (n=59) → 0.386/0.987 (n=39) | 0.45/14.015 (n=6) → 0.83/14.585 (n=5) | 0.399/2.114 (n=38) → 0.357/0.74 (n=27) | — → — | 1.446/2.102 (n=15) → 0.302/0.618 (n=7) |

The usable-kit metric requires full coverage, a READY declaration, and a match to the frozen accepted ID or alias for each required component. Abstentions can improve constraint adherence without solving the task. Some valid new skills have names absent from the frozen gold. The pinned LinkedIn writing skill is one such case. Its exact ID, writing instructions and license were independently checked. The original score is retained.

Latency includes successful selected reads only. Tokens use ceil(UTF-8 bytes/4). Neither measurement includes the host model’s deliberation. See the runner and raw outcomes in bench/final.json and the separate competitor discovery protocol in bench/competitors/README.md.

## Artifact quality

Two fresh GPT-6.2 Sol sessions at medium effort produced 30 artifacts from 15 fixed briefs. Each session handled one arm. Nine design, markup and copy pairs received a third session’s blinded source-text judgment. Fresh per-task CLI sessions using this exact model were unavailable on the signed-in CLI account, so the desktop session protocol is recorded alongside every output.

| Evaluation | With-kit wins | Ties | With-kit losses |
| --- | --- | --- | --- |
| Frozen automated checks, 15 pairs | 1 | 14 | 0 |
| Automated checks plus blinded tiebreaks, 15 pairs | 3 | 12 | 0 |

The three recorded wins were a CSS confirmation animation, a migration checklist and an HTML pricing table. The animation and the table had NO_MATCH handoffs, so they provide no evidence that selected skills improved the artifacts. The migration baseline describes reverting to the previous writer but misses the rubric’s literal rollback wording. Reading the artifacts gives much weaker support than the headline count. Portfolio focus styling, the poster, palette, signup form, captions, encoding command, LinkedIn post, newsletter, Instagram copy, both SQL tasks and README all tied. These short source-level tasks do not establish aesthetic superiority, broad agent interoperability, or a majority quality gain. [Trial protocol and artifacts](../bench/quality/README.md)

## Acceptance

The held-out confident-wrong, constraint-adherence and typical payload thresholds passed. Six of the 40 held-out briefs produced a fully usable kit. The exact-name regression gate still fails both phrasings of the LinkedIn task. A live read verified the newly selected skill focuses on writing LinkedIn posts. The Resolve native-timeline test passes by declining unsupported output. The frozen score counts and thresholds are preserved in bench/final.json. The majority output-quality criterion failed. A zero observed wrong-ready count on 40 prompts does not establish 100% accuracy.

## Competitive verdict

I would use skills.sh first for an unfamiliar specialist skill, Superpowers for a multi-step software implementation, and Tessl to evaluate whether adding a skill improves output. I would use this SkillKit for a supported brief where the project needs a small, staged set of instructions and references without a repo installation. SkillsMP retains broader searchable discovery, and rohitg00/SkillKit offers a more established cross-agent CLI and translation flow. My product rating is 6/10 for the broad “one platform for any task” promise. Better abstention and delivery justify using it for known workflows. The 15% held-out usable-kit rate and limited quality evidence keep it from being my default general-purpose platform.

On the 12 original briefs, top-three search results matched all frozen components for skills.sh on 2, SkillsMP on 0, and rohitg00/SkillKit on 1. The local rohitg00 catalog matched 6 of 40 held-out briefs. SkillKit’s own 5/12 and 6/40 results measure fully usable staged kits. These methods answer different questions. Superpowers and Tessl were reviewed through documentation and were not run on the same task set. No overall independent ranking or competitor accuracy advantage was established. [Methods and raw results](../bench/competitors/README.md) · [Competitive capabilities](COMPETITIVE-GAP.md)

## Operating limits

The server consults its current reviewed federated snapshot on a gap. Upstream discovery runs on refresh. Eight federated rows produced one new distinct eligible skill. Direct skills.sh API verification requires a Vercel OIDC credential. The local CLI, MCP transports, standalone client and private website were exercised. Public hosting, publishing the client, and authenticated live trials in ChatGPT, Claude, Gemini and Antigravity remain unverified. Embeddings here are deterministic hashed word, character and synonym features. No trained semantic retrieval model was evaluated.

## What shipped

| Phase | Delivered |
| --- | --- |
| 0 · Audit | Mapped the five competitor products, catalog entry points and cleanup candidates. |
| 1 · Baseline | Froze 120 labeled briefs, reserved 40 held-out briefs and specified the 15 paired artifact tasks and checks. |
| 2 · Routing | Added deliverable and tool contracts, constraint filtering, coverage gaps, stage entry conditions and an explanation of each match. |
| 3 · Federation | Added bounded discovery, reviewed upstream pins, duplicate detection, scheduled drift checks and quarantine. |
| 4 · Delivery | Added a dependency-free remote client, selective CLI and MCP reads, an optional lockfile and a capped text handoff. |
| 5 · Personas | Added five packs for development, video editing, motion, design and writing, with examples and output checks. |
| 6 · Trust | Restricted instructions and assets to verified license evidence. Reviewed inventories drive downloads, native exports, supporting-file reads and lock pins. |
| 7 · Cleanup | Retired three authoring placeholders and four unreachable private-site components. Documented all 55 catalog warnings on a dedicated cleanup branch. |
| 8 · Project context | In nine paired mobile cases, a relevant stack-specific skill or official reference rose from 0/9 to 4/9 when the project manifest was supplied. Three empty-directory controls produced identical kits. |
| 9 · Evaluation | Released the frozen holdout, recorded the 30 generated artifacts and nine blinded judgments, and tested the same-brief search surfaces available for three competitors. |

## Verification and connection

From the checkout, run `npm test` and `npm run bench`. The first command includes catalog validation. The second replays routing, the project-context experiment and the recorded quality checks. Use `npm run bench -- --enforce` to see the two outstanding acceptance failures as a nonzero exit. The implementation passed 105 Node tests and 19 Python tests. The private website passed type checking, three tests and a production build generating 204 pages. A loopback transport check exercised a real MCP client, one exact skill read, zero implicit project writes and one explicitly requested archive. Private-site changes are present in the local site directory, which the public repository ignores.

Start a service with `npm run serve`. For Codex, use the configuration printed by `node bin/vibe-skills.js mcp-config --target codex`. For Claude Code, add the service’s `/api/mcp` endpoint as an HTTP server. For Antigravity, use the JSON from `node bin/vibe-skills.js mcp-config --target antigravity`. For text-only chat, generate a handoff with `node bin/vibe-skills.js handoff "<brief>"` and paste it into the conversation. Cloud clients require a reachable service for direct connections. [Connection guide](DELIVERY.md)

The public naming checks covered three candidate names in the maintainer’s npm and GitHub namespaces. I recommend **Briefloom**. The alternatives are **Cuefolio** and **Taskweft**. No package or repository was renamed or published. [Exact scopes and checks](NAMING.md)

Automatic approval review blocked submission of the sealed prompts to SkillsMP. A concurrent skills.sh run was interrupted and may have sent some fictional prompts before stopping. Neither has a reported held-out score. The frozen SkillKit benchmark and the competing rohitg00 held-out check ran locally. [Competitor measurement details](../bench/competitors/README.md)
