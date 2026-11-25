# Licensing

The repository-level MIT license covers repository-owned tooling and curation. It does not relicense copied skills, local installations, source-page content, or third-party notices.

## Upstream skills

Every `origin: upstream` entry points to a full pinned commit and exact directory in `scripts/import-manifest.json`. Its `SOURCE.json` records the declared license, SHA-256 hashes of every copied source file, executable paths, and bundled inherited notices.

Upstream instruction files are copied byte-for-byte. Per-skill licenses stay in place. Repository-level and parent-directory license, copyright, and notice files are copied unchanged under `upstream-licenses/<repository-relative-path>`, so single-skill exports carry those notices too. If a README contains the license declaration, that evidence document is retained there; it is not replaced with an invented license text.

More specific upstream licenses take precedence in catalog metadata. For example, the four imported `Meta/muse-code/skills` entries have an Apache-2.0 parent license in the archive, rather than the archive's general CC0 label. Karpathy guidelines are recorded as MIT based on the pinned README declaration; that repository has no standalone LICENSE file, and its README evidence is bundled.

`THIRD_PARTY_NOTICES.md` lists source repositories, commits, declared licenses, and entries with unresolved licensing. An archive's declared license is a source claim; it does not independently establish rights over every third-party item collected there.

## Local copies and page extraction

Existing `local-agent-skills` and legacy `local-original` entries are retained with their recorded status. These labels alone do not prove original authorship or grant reuse rights. No new original skill is authored for this catalog.

The six-document Notion workflow is `origin: source-page-extraction`. The page does not declare a license. Its guide is an attributed Markdown rendering, with original Notion responses and an extraction ledger retained. Templates and prompts preserve source text apart from a documented terminal-newline normalization. This content is not covered by the repository's MIT license.

Read a skill's `SOURCE.json` and notices before reusing it. Unresolved licenses remain explicit warnings; validation does not turn them into permissions.

## Inclusion rules

- Verify an explicit freely redistributable with attribution (or public-domain) SPDX license before adding or mirroring a new upstream skill (`0BSD`, `Apache-2.0`, `BSD-2-Clause`, `BSD-3-Clause`, `BSL-1.0`, `CC0-1.0`, `CC-BY-4.0`, `ISC`, `MIT`, `MIT-0`, `Unlicense`, `Zlib`; `BUSL-1.1` is excluded). Preserve exact files, notices, and attribution.
- Do not copy paid or gated material. Link its public page as a resource.
- Retain the existing unresolved local copies transparently; do not manufacture upstream provenance for them.
- Host features such as Antigravity `/boost` are linked to official documentation unless an actual reusable skill and suitable source terms are verified.
- Do not infer a skill's license from this repository's top-level license or from an unrelated directory.

## Resources

Resources are links and original catalog descriptions, not copies of the linked product or article. Their license and pricing fields describe the destination and may need periodic rechecking. A successful HTTP request establishes reachability, not the correctness of every product claim.
