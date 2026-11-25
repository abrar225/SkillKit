# Competitor discovery checks

The 12 original fictional briefs were sent unchanged to the public keyword/search surfaces where a read-only API was available. The first three native results were compared with the same frozen component selectors used by the routing benchmark. A match here is a name or known upstream identity in those top three results. It does not establish the contents, suitability, license, or working delivery of a returned candidate. Search endpoints take terse queries in ordinary use, so sentences in this comparison measure the one-brief scenario. Keyword rewriting or manual exploration could find further results.

| Platform and method | Original review, full components in top 3 | Held-out, full components in top 3 |
| --- | --- | --- |
| skills.sh, live search endpoint called by its CLI | 2/12 | N/A |
| SkillsMP, live anonymous keyword API | 0/12 | N/A |
| rohitg00/SkillKit 1.24.0, bundled marketplace in its local REST server | 1/12 | 6/40 |
| Superpowers, packaged host-driven development workflow | N/A | N/A |
| Tessl, documented public CLI/MCP discovery and separate evaluation service | N/A | N/A |

Raw search payload sizes differ because the endpoints include different amounts of metadata and list lengths. Search latency ends when the result list arrives. These values are recorded in the JSON, and do not measure time to read a usable skill. Search interfaces do not issue SkillKit-style READY claims, ask clarification questions or declare tool/budget/format compliance. Those routing metrics are unavailable for the search products.

- **skills.sh** returned some result on 6/12 original cases. The full-brief Resolve and LinkedIn regressions did not surface a frozen component match. The CLI has its own query fallback and a selected-skill activation flow, which this endpoint-only check did not exercise. [Official CLI implementation](https://github.com/vercel-labs/skills/blob/main/src/find.ts)
- **SkillsMP** returned some result on 12/12 original cases. The anonymous search API was exercised within its documented quota. The API also supports discovery filters and authenticated search modes that were not exercised here. [Official API docs](https://skillsmp.com/docs/api)
- **rohitg00/SkillKit** returned some result on 12/12 originals and 38/40 held-out prompts against the official package's 15,120-entry bundled snapshot. Its project-aware recommendations, cross-agent translation, and live multi-registry search are separate surfaces and were not measured. No held-out prompt left localhost for this check. [Official REST docs](https://www.skillkit.sh/docs/rest-api)
- **Superpowers** supplies a coherent development workflow, entered and applied by a host agent. No matching standalone brief router was identified in its official documentation. An equivalent host trial applying the plugin was not run. [Official workflow](https://github.com/obra/superpowers#the-basic-workflow)
- **Tessl** documents public semantic discovery and skill evaluations. The pinned npm package was downloaded. Setup and live execution of its signed CLI payload were not completed. The public search and separately hosted evaluation workflow were not measured. [CLI reference](https://docs.tessl.io/reference/cli-commands#tessl-search), [evaluation FAQ](https://docs.tessl.io/support/faqs#how-does-tessl-evaluate-skills)

Automatic approval review blocked the SkillsMP request that would have disclosed sealed held-out prompts. The concurrently launched skills.sh held-out check was interrupted before completion, so no measured held-out result is attributed to it. A few requests may have been submitted before interruption. The comparison runner permits held-out cases only for the local rohitg00 comparator.

Reproduce the original cases by running `node bench/compare-search.mjs --source skills-sh` or `--source skillsmp` with network access. For the pinned local comparison, start the official `skillkit@1.24.0` CLI with `serve --host 127.0.0.1 --port 43691` and run `node bench/compare-search.mjs --source rohitg00 --skillkit-url http://127.0.0.1:43691 --held-out bench/fixtures/held-out.tsv`. The reproducible signals are top-three metadata matches and case counts. Live search may change as indexes are refreshed.
