# Federated skill catalog

The curated skill registry has priority. When local entries leave a gap, the router can consider eligible entries from the reviewed federated snapshot. The snapshot contains metadata and upstream pins. Third-party instructions stay upstream until requested by exact ID.

The initial snapshot covers eight skill entries. The LinkedIn writing entry is eligible to fill a distinct routing gap. The duplicate Anthropic and Superpowers entries remain discoverable by exact ID. The two Resolve entries document important limits. One points to references that still need review. The other requires Resolve Studio, local scripts, and credentialed transcription and is quarantined.

## Sources

- Vercel’s skills.sh adapter uses the documented search API with `VERCEL_OIDC_TOKEN`. The token is short-lived. Without it, the refresh records `auth-required` and still verifies the known Vercel GitHub pin directly. [skills.sh API](https://skills.sh/docs/api)
- SkillsMP uses one keyword query per refresh. The adapter accepts an optional `SKILLSMP_API_KEY` and uses documented anonymous access otherwise. It records a matching source link and verifies the authoritative GitHub file separately. [SkillsMP API](https://skillsmp.com/docs/api), [SkillsMP terms](https://skillsmp.com/terms)
- GitHub topic discovery samples three fixed queries. Direct adapters also inspect the first-party Vercel, Superpowers, and Anthropic repositories. A GitHub token is optional for public reads and is sent only to GitHub’s API. [GitHub search](https://docs.github.com/en/rest/search), [GitHub rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)

The queries are independent of user briefs. The checked-in snapshot supports offline metadata routing. A source outage or rate limit leaves the previous verified pin in place until the source responds again.

## Review and refresh

Run `node scripts/refresh-federation.js /tmp/federation-snapshot.json` to preview a refresh. The command checks current public repository heads, distinguishes removals and license or content changes from transient API failures, and reports status and content drift separately from timestamps. The daily GitHub Actions job publishes the refreshed snapshot and drift report as artifacts. The distributed catalog updates when the snapshot is reviewed and committed.

Review the proposed entries and exact source diffs before changing `catalog/federated/reviewed.json`. This file is the approval record for skill paths, SHA-256 checksums, applicable licenses, and individually reviewed assets. Update the smallest relevant approval and run `node scripts/refresh-federation.js --write` to produce the distributed snapshot. A new upstream file or license revision must match a reviewed checksum before becoming eligible.

The similarity check groups matching or near-matching instruction files and keeps alternate provenance on the highest-ranked entry. The trust score records findings from a bounded static scan for shell commands, network access, credential references, prompt injection patterns, and bundled scripts. Outcome-based quality scores remain unset until evaluated.

Only skills with supported permissive license evidence can deliver instructions by default. Metadata-only and quarantined rows return a source link and reason. Delivery retrieves individually pinned files from GitHub, verifies their checksums, and includes the recorded notices. SkillKit never executes a bundled script. [OSI license list](https://opensource.org/licenses)
