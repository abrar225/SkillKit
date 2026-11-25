'use strict';

const snapshot = require('../catalog/federated/snapshot.json');
const audit = require('../catalog/federated/tag-audit.json');
const { deduplicate } = require('../lib/federation-refresh');

const technology = /\b(?:After Effects|Premiere Pro|DaVinci Resolve|Remotion|Expo|Elasticsearch|Kibana|WordPress|SageMaker|Azure|Figma|React Native|React|Next\.js|TypeScript|Python|Docker|Gradio|Postgres|Supabase|Kubernetes|GitHub Actions)\b/gi;
const stages = [
  ['review', /\b(audit|review|triage|diagnose|inspect)\b/i], ['test', /\b(test|validate|verify|evaluate)\b/i],
  ['release', /\b(deploy|publish|release|distribute)\b/i], ['plan', /\b(plan|assess|scope)\b/i],
  ['design', /\b(design|style|illustrate)\b/i], ['build', /\b(build|implement|create|configure)\b/i],
];
const samples = new Map(audit.map(row=>[row.id.toLowerCase(),row]));
function index() {
  const records = new Map();
  for (const [source, pointers] of Object.entries(snapshot.candidates)) {
    for (const p of pointers) {
      const key = [p.repo, p.path || p.slug || ''].join('/').toLowerCase();
      if (records.has(key)) { records.get(key).sources.push(source); continue; }
      const row = samples.get(key);
      const description = row?.description || null;
      const commit = p.commit || p.url.match(/\/blob\/([a-f0-9]{40})\//)?.[1] || null;
      const title = p.slug || (p.path && p.path.split('/').at(-2)) || p.repo;
      records.set(key, {
        id: 'pointer/' + key, title, description, deliverables: description ? [title] : [],
        tools: [...new Set((description?.match(technology) || []).map(x=>x.toLowerCase()))],
        stage: stages.find(([,pattern])=>description && pattern.test(description))?.[0] || null,
        domain: row?.domain || null, language: null, license: p.licenseHint || null,
        licenseEvidence: 'Unverified repository hint', upstream: { repo:p.repo, path:p.path || null, commit, url:p.url },
        checksum: row?.sha256 || null, trustScore: row?.documentScan?.trustScore ?? null,
        qualityScore: null, structuralQuality: row?.quality || null, validity: row?.validity || null,
        documentScan: row?.documentScan || null, fingerprint: row?.fingerprint || null,
        lastVerified: null, sources:[source], status:'metadata-only', duplicateOf:null,
      });
    }
  }
  const reviewed = snapshot.entries.map(e=>({...e,structuralQuality:e.quality}));
  const scored = [...records.values()].filter(e=>e.checksum);
  const merged = deduplicate([...reviewed, ...scored]);
  const pointers = [...records.values()].filter(e=>!e.checksum);
  return [...merged, ...pointers];
}
if (require.main===module) {
  const entries=index();
  const arg=process.argv[2];
  if (arg==='--json') console.log(JSON.stringify(entries));
  else if (arg) {
    const match=entries.find(e=>e.id===arg);
    if (!match) { console.error('Unknown atlas ID');process.exitCode=1; }
    else console.log(JSON.stringify(match,null,2));
  } else console.log(JSON.stringify({normalized:entries.length, reviewed:snapshot.entries.length,
    documentAudits:audit.length, unverifiedPointers:entries.length-snapshot.entries.length, funnel:snapshot.funnel.totals},null,2));
}
module.exports = { index };
