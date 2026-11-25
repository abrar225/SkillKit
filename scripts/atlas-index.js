'use strict';

const snapshot = require('../catalog/federated/snapshot.json');
const audit = require('../catalog/federated/tag-audit.json');
const { deduplicate } = require('../lib/federation-refresh');
const { extractTags } = require('../lib/atlas-taxonomy');

const samples = new Map(audit.map((row) => [row.id.toLowerCase(), row]));

function normalizeEntry(entry) {
  return {
    id: entry.id,
    title: entry.title,
    description: entry.description || null,
    deliverables: entry.deliverables || [],
    tools: entry.tools || [],
    formats: entry.formats || [],
    stage: entry.stage || null,
    domain: entry.domain || null,
    language: entry.language || 'en',
    license: entry.license || 'unverified',
    upstreamUrl: entry.upstream?.url || entry.url || null,
    pinnedCommit: entry.upstream?.commit || null,
    checksum: entry.checksum || null,
    trustScore: entry.trustScore ?? null,
    qualityScore: entry.qualityScore ?? null,
    structuralQuality: entry.quality || entry.structuralQuality || null,
    validity: entry.validity || null,
    documentScan: entry.scan || entry.documentScan || null,
    fingerprint: entry.fingerprint || null,
    lastVerified: entry.lastVerified || null,
    duplicateOf: entry.duplicateOf || null,
    status: entry.status,
    trustTier: entry.trustTier || entry.status,
    sources: entry.sources || [],
    upstream: entry.upstream || null,
  };
}

function index() {
  const pointers = new Map();
  for (const [source, rows] of Object.entries(snapshot.candidates || {})) {
    for (const p of rows) {
      const key = [p.repo, p.path || p.slug || ''].join('/').toLowerCase();
      if (pointers.has(key)) {
        pointers.get(key).sources.push(source);
        continue;
      }
      const row = samples.get(key) || samples.get(('federated/' + p.repo + '/' + (p.slug || '')).toLowerCase());
      const description = row?.description || null;
      const commit = p.commit || p.url?.match(/\/blob\/([a-f0-9]{40})\//)?.[1] || null;
      const slug = p.slug || (p.path && p.path.split('/').at(-2)) || p.repo;
      const title = row?.title || slug;
      const tags = extractTags({ title, description: description || '', slug, domain: row?.domain || null });
      pointers.set(key, normalizeEntry({
        id: 'pointer/' + key,
        title,
        description,
        ...tags,
        language: row?.language || null,
        license: p.licenseHint || 'unverified',
        upstream: { repo: p.repo, path: p.path || null, commit, url: p.url },
        url: p.url,
        checksum: row?.sha256 || null,
        trustScore: row?.documentScan?.trustScore ?? null,
        qualityScore: null,
        quality: row?.quality || null,
        validity: row?.validity || null,
        scan: row?.documentScan || null,
        fingerprint: row?.fingerprint || null,
        lastVerified: null,
        sources: [source],
        status: 'metadata-only',
        trustTier: 'metadata-only',
        duplicateOf: null,
      }));
    }
  }

  const normalizedEntries = (snapshot.entries || []).map(normalizeEntry);
  const scoredPointers = [...pointers.values()].filter((e) => e.checksum);
  const merged = deduplicate([...normalizedEntries, ...scoredPointers]);
  const barePointers = [...pointers.values()].filter((e) => !e.checksum);
  return [...merged, ...barePointers];
}

if (require.main === module) {
  const entries = index();
  const arg = process.argv[2];
  if (arg === '--json') console.log(JSON.stringify(entries));
  else if (arg) {
    const match = entries.find((e) => e.id === arg);
    if (!match) {
      console.error('Unknown atlas ID');
      process.exitCode = 1;
    } else console.log(JSON.stringify(match, null, 2));
  } else {
    console.log(JSON.stringify({
      normalized: entries.length,
      reviewed: snapshot.entries.length,
      documentAudits: audit.length,
      unverifiedPointers: entries.length - snapshot.entries.length,
      funnel: snapshot.funnel.totals,
    }, null, 2));
  }
}

module.exports = { index, normalizeEntry };
