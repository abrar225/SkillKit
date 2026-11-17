# Adding a Skill

This catalog preserves existing skills. Do not author a new skill or rewrite upstream instructions. The six-document guide is the explicit exception: its source page is rendered with attribution, a raw response snapshot, and an extraction ledger. Existing local copies are retained with their recorded provenance; a local installation does not establish upstream authorship or redistribution rights.

## Before adding

1. Search: `node bin/vibe-skills.js search "<topic>"`.
2. Find the actual source directory and verify its declared license, including any more specific parent or per-skill license.
3. Pick an existing domain and read the current registry entry and `SOURCE.json` when replacing an entry.
4. If no portable skill exists, add the official documentation as a resource. A host's built-in command is not automatically a portable skill.

## Pin the source

Add the repository, full commit SHA, and exact paths to `scripts/import-manifest.json`:

```json
{
  "repo": "owner/repo",
  "commit": "<full 40-character commit SHA>",
  "license": "MIT",
  "skills": [
    { "path": "skills/their-skill", "dest": "domain/our-name" }
  ]
}
```

An entry can override `license` when a more specific upstream license applies. `licenseEvidence` on the repository records a source document such as `README.md` when the declaration appears there instead of a standalone license file. Verify the declaration before adding it; the importer does not infer permissions.

```bash
python3 scripts/import-skills.py
```

The importer downloads the pinned GitHub archive. Existing directories are skipped. New upstream files retain their exact bytes and executable bits. Ancestor license and notice files are bundled under `upstream-licenses/` with their repository-relative paths. Per-skill licenses stay at their original locations.

`SOURCE.json` records the pinned source, SHA-256 hashes, executable paths, and inherited notice paths/hashes. It is repository metadata, not an upstream instruction file. `scripts/add-original-sources.py` is now a read-only compatibility verifier; it cannot stamp HEAD commits onto existing files.

## Refresh or independently check

```bash
python3 scripts/import-skills.py --refresh --ids domain/our-name
python3 scripts/import-skills.py --check
```

A refresh replaces the selected directory with the complete pinned snapshot. It restores upstream content; it does not apply editorial changes. Check mode compares contents, executable bits, inherited notices, and provenance to the pinned archives without changing repository files. `--offline --cache-dir <directory>` reuses downloaded archives.

Change the manifest commit deliberately when upgrading a skill. Do not label a local customization with the latest upstream commit. Keep backups or use version control before refreshing a locally modified copy.

## Rebuild and verify

```bash
python3 scripts/build-registry.py
npm run validate
node scripts/build-docs.js
npm test
```

Validation checks full generated-registry agreement, manifest provenance, recorded content hashes and executable bits, resource source files, IDs, paths, counts, and notices. Online source verification remains a separate `npm run verify:upstream` command; offline hashes alone cannot prove who originally authored a source.

If upstream names collide, retain both names and let the registry derive distinct display names. Commit source snapshots, provenance, manifest changes, generated registries, and generated catalogs together.
