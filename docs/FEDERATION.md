# Federated skill catalog

The curated skill registry has priority. When local entries leave a gap, the router can consider eligible entries from the reviewed federated snapshot. The snapshot contains metadata and upstream pins. Individually approved permissive files are mirrored locally. Other pointers retain their upstream link.

The original pilot covered eight skill entries. The LinkedIn writing entry is eligible to fill a distinct routing gap. The duplicate Anthropic and Superpowers entries remain discoverable by exact ID. The two Resolve entries document important limits. One points to references that still need review. The other requires Resolve Studio, local scripts, and credentialed transcription and is quarantined.

## Sources

- Vercel’s skills.sh adapter uses the documented search API with `VERCEL_OIDC_TOKEN`. The token is short-lived. Without it, the refresh records `auth-required` and still verifies the known Vercel GitHub pin directly. [skills.sh API](https://skills.sh/docs/api)
- SkillsMP uses one keyword query per refresh. The adapter accepts an optional `SKILLSMP_API_KEY` and uses documented anonymous access otherwise. It records a matching source link and verifies the authoritative GitHub file separately. [SkillsMP API](https://skillsmp.com/docs/api), [SkillsMP terms](https://skillsmp.com/terms)
- GitHub topic discovery samples three fixed queries. Direct adapters also inspect the first-party Vercel, Superpowers, and Anthropic repositories. A GitHub token is optional for public reads and is sent only to GitHub’s API. [GitHub search](https://docs.github.com/en/rest/search), [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

The queries are independent of user briefs. The checked-in snapshot supports offline metadata routing. A source outage or rate limit leaves the previous verified pin in place until the source responds again.

## Review and refresh

Run `node scripts/refresh-federation.js /tmp/federation-snapshot.json` to preview a refresh. The command checks current public repository heads, distinguishes removals and license or content changes from transient API failures, and reports status and content drift separately from timestamps. The daily GitHub Actions job publishes the refreshed snapshot and drift report as artifacts. The distributed catalog updates when the snapshot is reviewed and committed.

Review the proposed entries and exact source diffs before changing `catalog/federated/reviewed.json`. This file is the approval record for skill paths, SHA-256 checksums, applicable licenses, and individually reviewed assets. Update the smallest relevant approval and run `node scripts/refresh-federation.js --write` to produce the distributed snapshot. A new upstream file or license revision must match a reviewed checksum before becoming eligible.

The similarity check groups matching or near-matching instruction files and keeps alternate provenance on the highest-ranked entry. The trust score records findings from a bounded static scan for shell commands, network access, credential references, prompt injection patterns, and bundled scripts. Outcome-based quality scores remain unset until evaluated.

Only skills with verified freely redistributable with attribution (or public-domain) SPDX license evidence can deliver instructions by default (including `BSL-1.0` Boost Software License 1.0, and explicitly excluding `BUSL-1.1` Business Source License 1.1). Metadata-only and quarantined rows return a source link and reason. Delivery prefers the individually pinned local mirror, checks its checksum and includes the recorded notices. SkillKit never executes a bundled script. [SPDX license list](https://spdx.org/licenses/)

## November 25 Stage 1b Atlas expansion and funnel

Under the [Stage 1b license evidence update](../bench/ADJUDICATIONS.md#stage-1b-updates-2026-11-25) (`skill-directory-license`, `skill-frontmatter`, plus clean single-license `repo-root-license` verification checking all repo `LICENSE`/`COPYING`/`NOTICE` files and rejecting vendored third-party copies, custom licenses, GPL-family, CC-NC, and BUSL), the Atlas snapshot records `2,906` unique discovered candidates (`1,133` source-sampled observations across `22` first-party publisher repositories, `github-topic`, `github-code`, `awesome-lists`, and `SkillsMP` pointers; `skills.sh` and `Tessl` skipped per [SOURCES.md](SOURCES.md)). Out of `2,803` parsed `SKILL.md` records, `2,551` are distinct after SimHash deduplication, `2,127` carry freely-redistributable-with-attribution SPDX license evidence, `2,632` pass format validity, `2,375` pass structural quality (`>= 2/4`), `1,665` are approved and mirrored (`4` routable in `reviewed`, `1,563` routable in `auto-verified`, `1,567` content-deliverable total, zero scripts mirrored), `911` remain `metadata-only` links, and `227` are `quarantined` by static safety scans. Curated `192` skills and `164` resources remain the highest trust tier.

The fresh disjoint 200-row [fresh Gemini tag audit](../catalog/federated/tag-audit-fresh.json) (seed `202611251`; `120` approved/mirrored, `65` metadata-only, `15` quarantined; zero overlap with the prior [tag-audit.json](../catalog/federated/tag-audit.json) tuning set) was blindly reviewed using `Gemini 3.8 Flash` (`0/200` unassessed). Measured fresh error rates are: `domain` `41.0%` (`82/200`), `deliverable` `38.5%` (`77/200`), `tool` `21.5%` (`43/200`), and `stage` `45.0%` (`90/200`) — recorded in [tag-audit-fresh-summary.json](../catalog/federated/tag-audit-fresh-summary.json). Because `stage` error rate exceeds `15%`, `stage` is disallowed as a hard routing filter. Full license and quarantine decisions across all `2,803` entries are recorded in [license-decisions.json](../catalog/federated/license-decisions.json).

## Optional live discovery

Both the operator and caller must enable live search. Start the service with `SKILLKIT_UPSTREAM_SEARCH=1` and pass `upstream: true` to `find_kit`, or use `find-kit --upstream` from the maintainer CLI. Only an uncovered, recognized public catalog category and an allowlisted tool name can leave the process. Incoming briefs, filenames, organization names and benchmark text never become search terms. A result is a link to investigate. It cannot promote a kit to READY or authorize a download. Use `explain_match` for the specialist requirements when a gap remains.

Use `node scripts/atlas-index.js` for the offline inventory summary, append an exact ID for one normalized record or `--json` for local analysis. Null values mean that the field lacks verification. The descriptive tags on discovery pointers are provisional. Document scans omit assets and repository-level permissions. A pointer never enters the router through this inventory view.
