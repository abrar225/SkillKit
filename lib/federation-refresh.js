'use strict';

const { decode, digest, githubUrl, requestBytes, retrieve, scanSkill } = require('./federation');
const { isPermissive } = require('./catalog-policy');

function repositoryLink(value, host, repo) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.host === host && !url.username && !url.password &&
      (repo === undefined || url.pathname.split('/').slice(1, 3).join('/').toLowerCase() === repo.toLowerCase()) ?
      url.href : null;
  } catch {
    return null;
  }
}

function createAdapters({ fetchImpl, env = process.env } = {}) {
  const githubHeaders = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SkillKit-Federation',
    'X-GitHub-Api-Version': '2022-11-28',
    ...(env.GITHUB_TOKEN ? { Authorization: 'Bearer ' + env.GITHUB_TOKEN } : {}),
  };
  async function json(url, headers, limit = 512 * 1024) {
    return JSON.parse(decode(await requestBytes(url, { fetchImpl, headers, limit })));
  }
  async function github(endpoint, limit) {
    return json('https://api.github.com/' + endpoint, githubHeaders, limit);
  }
  const repositories = new Map();
  async function inspect(repo) {
    if (!repositories.has(repo)) {
      repositories.set(repo, (async () => {
        const { sha } = await github(`repos/${repo}/commits/HEAD`);
        if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) throw new Error('Invalid GitHub branch head.');
        const tree = await github(`repos/${repo}/git/trees/${sha}?recursive=1`, 3 * 1024 * 1024);
        if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('GitHub inventory is incomplete.');
        return { commit: sha, files: new Map(tree.tree.filter((item) => item.type === 'blob').map((item) => [item.path, item])) };
      })());
    }
    return repositories.get(repo);
  }
  return {
    inspect,
    read: (repo, commit, file) => retrieve(repo, commit, file, fetchImpl),
    async discover() {
      const discoveries = {};
      const sources = {};
      async function probe(source, discover) {
        try {
          const result = await discover();
          discoveries[source] = result.matches;
          sources[source] = { state: 'reachable', sampled: result.sampled };
        } catch (error) {
          const state = error.status === 429 || error.status === 403 ? 'limited' :
            error.status === 401 ? 'auth-required' : 'unavailable';
          sources[source] = { state, ...(error.status ? { httpStatus: error.status } : {}) };
        }
      }

      if (env.VERCEL_OIDC_TOKEN) {
        await probe('skills.sh', async () => {
          const { data } = await json('https://skills.sh/api/v1/skills/search?q=find-skills&limit=10',
            { Authorization: 'Bearer ' + env.VERCEL_OIDC_TOKEN, Accept: 'application/json' });
          if (!Array.isArray(data)) throw new Error('Invalid skills.sh response.');
          return {
            sampled: data.length,
            matches: data.filter((item) => item.source === 'vercel-labs/skills' && item.slug === 'find-skills')
              .map((item) => ({ repo: item.source, slug: item.slug, url: repositoryLink(item.url, 'skills.sh') })),
          };
        });
      } else sources['skills.sh'] = { state: 'auth-required', credential: 'VERCEL_OIDC_TOKEN' };

      await probe('skillsmp', async () => {
        const headers = env.SKILLSMP_API_KEY ? { Authorization: 'Bearer ' + env.SKILLSMP_API_KEY } : {};
        const result = await json('https://skillsmp.com/api/v1/skills/search?q=doc-coauthoring&limit=5', headers);
        if (!Array.isArray(result.data?.skills)) throw new Error('Invalid SkillsMP response.');
        return {
          sampled: result.data.skills.length,
          matches: result.data.skills.filter((item) => item.name === 'doc-coauthoring' &&
            repositoryLink(item.githubUrl, 'github.com', 'anthropics/skills')).map((item) => ({
            repo: 'anthropics/skills', slug: 'doc-coauthoring', url: repositoryLink(item.skillUrl, 'skillsmp.com'),
          })),
        };
      });

      await probe('github-topic', async () => {
        const queries = ['topic:agent-skills linkedin writing', 'topic:agent-skills davinci resolve', 'topic:agent-skills remotion'];
        const matches = [];
        let sampled = 0;
        for (const query of queries) {
          const result = await github('search/repositories?' + new URLSearchParams({ q: query, per_page: '10' }));
          if (!Array.isArray(result.items)) throw new Error('Invalid GitHub search response.');
          sampled += result.items.length;
          for (const item of result.items) {
            if (repositoryLink(item.html_url, 'github.com', item.full_name)) {
              matches.push({ repo: item.full_name, url: item.html_url });
            }
          }
        }
        return { sampled, matches };
      });
      return { discoveries, sources };
    },
  };
}

function frontmatterName(text) {
  return text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/)?.[1]
    .match(/^name:\s*["']?([\w-]+)["']?\s*$/m)?.[1];
}

// A 64-bit SimHash of normalized word triplets lets small prose edits retain a close fingerprint.
function fingerprint(text) {
  const words = text.replace(/^---\r?\n[\s\S]*?\r?\n---/, '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  if (words.length < 20) return null;
  const weights = new Int16Array(64);
  const triplets = new Set(words.slice(0, -2).map((word, i) => word + ' ' + words[i + 1] + ' ' + words[i + 2]));
  for (const triplet of triplets) {
    const hash = Buffer.from(digest(triplet).slice(0, 16), 'hex');
    for (let bit = 0; bit < 64; bit++) weights[bit] += hash[bit >> 3] & (1 << (bit % 8)) ? 1 : -1;
  }
  const result = Buffer.alloc(8);
  for (let bit = 0; bit < 64; bit++) if (weights[bit] > 0) result[bit >> 3] |= 1 << (bit % 8);
  return result.toString('hex');
}

function closeFingerprints(left, right) {
  if (!left || !right) return false;
  let difference = BigInt('0x' + left) ^ BigInt('0x' + right);
  let bits = 0;
  while (difference && bits <= 6) {
    difference &= difference - 1n;
    bits++;
  }
  return bits <= 6;
}

function deduplicate(entries) {
  const ranked = [...entries].sort((a, b) => Number(b.status === 'approved') - Number(a.status === 'approved') ||
    b.trustScore - a.trustScore || (b.qualityScore ?? 0) - (a.qualityScore ?? 0) || a.id.localeCompare(b.id));
  const unique = [];
  const byId = new Map();
  for (const entry of ranked) {
    const { aliases: ignoredAliases, duplicateOf: ignoredDuplicate, ...candidate } = entry;
    if (!['approved', 'metadata-only'].includes(candidate.status)) {
      byId.set(entry.id, candidate);
      continue;
    }
    const winner = unique.find((item) => item.checksum === candidate.checksum ||
      (item.domain === candidate.domain && item.deliverables.some((deliverable) => candidate.deliverables.includes(deliverable)) &&
        closeFingerprints(item.fingerprint, candidate.fingerprint)));
    if (winner) {
      winner.aliases.push({ id: candidate.id, upstream: candidate.upstream, license: candidate.license, sources: candidate.sources });
      byId.set(entry.id, { ...candidate, duplicateOf: winner.id });
    } else {
      candidate.aliases = [];
      unique.push(candidate);
      byId.set(entry.id, candidate);
    }
  }
  return entries.map((entry) => byId.get(entry.id));
}

function skillDirectory(skillPath) {
  return skillPath.slice(0, skillPath.lastIndexOf('/') + 1);
}

function appliesToSkill(file, skillPath) {
  const split = file.lastIndexOf('/');
  const dir = split < 0 ? '' : file.slice(0, split + 1);
  const name = file.slice(split + 1);
  return skillPath.startsWith(dir) && /^(?:LICENSE|COPYING|NOTICE|COPYRIGHT)(?:[._-].+)?$/i.test(name);
}

async function inspectEntry(spec, previous, adapters, now, discovery, states) {
  const { repo, path, slug, collection, reviewed, ...metadata } = spec;
  const id = 'federated/' + repo.toLowerCase() + '/' + slug;
  const source = { id, name: slug, ...metadata, attribution: repo, qualityScore: null, pricing: metadata.pricing || 'unknown' };
  githubUrl(repo, '0'.repeat(40), path);
  let tree;
  try {
    tree = await adapters.inspect(repo);
  } catch (error) {
    if (error.status === 404 && previous) return { ...previous, status: 'removed', reason: 'GitHub repository is no longer publicly accessible.', lastChecked: now };
    if (collection) states[collection] = { state: 'unavailable', ...(error.status ? { httpStatus: error.status } : {}) };
    return previous ? { ...previous, lastChecked: now, refreshState: 'unavailable' } : null;
  }
  if (collection) states[collection] = { state: 'reachable', repository: repo };
  const { commit, files } = tree;
  const upstream = { repo, path, commit, url: githubUrl(repo, commit, path) };
  if (!files.has(path)) {
    return previous ? { ...previous, status: 'removed', reason: 'Upstream SKILL.md is missing.', lastChecked: now } : null;
  }

  const sourceLinks = [
    { source: collection || 'github-repository', url: upstream.url },
    ...Object.entries(discovery).flatMap(([provider, matches]) => matches.filter((item) =>
      item.repo.toLowerCase() === repo.toLowerCase() && (!item.slug || item.slug === slug) && item.url)
      .slice(0, 1).map((item) => ({ source: provider, url: item.url }))),
  ];
  // A search result can fall outside the sample even while its known GitHub pin stays verifiable.
  for (const link of previous?.sources || []) {
    if (link.source !== 'github-repository' && !sourceLinks.some((current) => current.source === link.source)) sourceLinks.push(link);
  }
  const publicEntry = {
    ...source, upstream, url: upstream.url, sources: sourceLinks, lastChecked: now, lastVerified: now,
  };

  try {
    const bytes = await adapters.read(repo, commit, path);
    const text = decode(bytes);
    const checksum = digest(bytes);
    const licensePaths = [...files.keys()].filter((file) => appliesToSkill(file, path)).sort();
    const expectedPaths = reviewed.licenseFiles.map((pin) => pin.path).sort();
    const directory = skillDirectory(path);
    const hasScripts = [...files].some(([file, { mode }]) => file.startsWith(directory) &&
      (mode === '100755' || /(?:^|\/)scripts\/|\.(?:sh|bash|zsh|bat|ps1|py|mjs|cjs|js|rb|pl)$/i.test(file)));
    const scan = scanSkill(text, hasScripts || reviewed.assets.some((asset) => asset.kind === 'script'));
    let status = 'metadata-only';
    let license = 'unverified';
    let reason = metadata.limitations || 'An explicit permissive upstream license is missing.';
    const licenseEvidence = [];
    const skillAssets = [];
    if (checksum !== reviewed.checksum || JSON.stringify(licensePaths) !== JSON.stringify(expectedPaths) ||
        files.get(path).mode !== '100644' || frontmatterName(text) !== slug) {
      status = 'quarantined';
      reason = 'Upstream instructions or license file list differ from the reviewed pin.';
    } else {
      const pins = [...reviewed.licenseFiles, ...reviewed.assets];
      let filesChanged = false;
      for (const pin of pins) {
        if (!['100644', '100755'].includes(files.get(pin.path)?.mode)) {
          filesChanged = true;
          break;
        }
        const content = await adapters.read(repo, commit, pin.path);
        if (digest(content) !== pin.sha256 || (pin.kind !== 'notice' && scanSkill(decode(content), pin.kind === 'script').blocked)) {
          filesChanged = true;
          break;
        }
        (reviewed.licenseFiles.includes(pin) ? licenseEvidence : skillAssets).push({
          ...pin, url: githubUrl(repo, commit, pin.path),
        });
      }
      if (reviewed.licenseFiles.length && licenseEvidence.length === reviewed.licenseFiles.length) license = reviewed.license;
      if (filesChanged || scan.blocked) {
        status = 'quarantined';
        reason = scan.blocked ? 'The static scan detected a high-risk pattern.' : 'An upstream license or asset checksum changed.';
      } else if (isPermissive(license) && reviewed.routable) {
        status = 'approved';
        reason = null;
      }
    }
    return {
      ...publicEntry, checksum, fingerprint: fingerprint(text), trustScore: scan.trustScore, scan,
      license,
      licenseEvidence, skillAssets, status, reason,
    };
  } catch {
    return previous ? { ...previous, lastChecked: now, refreshState: 'unavailable' } : null;
  }
}

async function refreshCatalog({ reviewed, previous, adapters, now = new Date().toISOString() }) {
  const { discoveries, sources } = await adapters.discover();
  for (const [provider, discoveriesForProvider] of Object.entries(discoveries)) {
    sources[provider].matchedReviewed = reviewed.filter((spec) => discoveriesForProvider.some((match) =>
      match.repo.toLowerCase() === spec.repo.toLowerCase() && (!match.slug || match.slug === spec.slug))).length;
  }
  const entries = [];
  for (const spec of reviewed) {
    const id = 'federated/' + spec.repo.toLowerCase() + '/' + spec.slug;
    const prior = previous.entries.find((entry) => entry.id === id);
    const entry = await inspectEntry(spec, prior, adapters, now, discoveries, sources);
    if (entry) entries.push(entry);
  }
  return { schemaVersion: 1, verifiedAt: now, sources, entries: deduplicate(entries) };
}

module.exports = { createAdapters, deduplicate, fingerprint, refreshCatalog };
