# Atlas source decisions

Reviewed November 25, 2026. Discovery records public metadata. Mirroring requires separate evidence for the exact skill, its assets and notices. Source availability and each refresh’s access method are recorded in catalog/federated/snapshot.json.

| Source | Access decision |
| --- | --- |
| GitHub publisher repositories, including Vercel, obra and Anthropic | Use the authenticated REST API to inspect public repository metadata, commit and tree inventories. Content reads use explicit pinned paths. Website crawling is unnecessary. [Terms](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) · [robots](https://github.com/robots.txt) · [API limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) |
| GitHub topics, code search and awesome-lists | Use bounded static queries and one public list through the same official API. List entries and search hits are pointers only. Earlier upstream terms or licenses do not automatically extend to the linked skill. |
| skills.sh | Its web robots rules exclude search and API crawling. Its documented authenticated client API requires Vercel OIDC. Without that credential the adapter skips the directory. Vercel’s public Git repositories remain independently accessible. [API](https://skills.sh/docs/api) · [robots](https://www.skills.sh/robots.txt) |
| SkillsMP | Use the documented keyword API within the published anonymous or authenticated quota. No website or API crawling. Do not send user or evaluation briefs. [Terms](https://skillsmp.com/terms) · [API](https://skillsmp.com/docs/api) · [robots](https://skillsmp.com/robots.txt) |
| Tessl | Public documentation describes authenticated client search. Its robots rules exclude internal paths. Bulk catalog reuse permission was not established, so this release skips ingestion. [CLI](https://docs.tessl.io/reference/cli-commands) · [Security](https://tessl.io/policies/security) · [robots](https://tessl.io/robots.txt) |

Repository SPDX metadata is a license hint. Unverified or restrictive records are links only, including upon explicit request. A caller can visit the source under its own terms. The reviewed fetcher does not forward restricted instructions. Static checks flag suspicious instructions and scripts without running them. No universal crawl or comprehensive coverage is claimed.
