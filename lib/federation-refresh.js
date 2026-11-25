'use strict';

const { decode, digest, federatedRoutable, githubUrl, requestBytes, retrieve, safeSegments, scanSkill } = require('./federation');
const { isPermissive } = require('./catalog-policy');
const { firstParty } = require('../catalog/federated/sources.json');

const discoveryQueries = ['documentation', 'frontend design', 'mobile development', 'data modeling', 'video captions'];
const repoPattern = /^[\w.-]+\/[\w.-]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxInventory = 64;
const reviewPolicyVersion = 2;

function eligiblePath(value) {
  return safeSegments(value) && !/(?:exploit|weapon|offensive|hack(?:ing|er)?|weaponiz|malware|pathogen|penetration|red-team|vulnerability-repro)/i.test(value);
}

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

function createAdapters({ fetchImpl, env = process.env, repositories: directSources = firstParty } = {}) {
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
  async function inventory({ repo, prefixes }) {
    const metadata = await github(`repos/${repo}`);
    if (metadata.private !== false || metadata.fork !== false || metadata.archived ||
        metadata.full_name?.toLowerCase() !== repo.toLowerCase()) throw new Error('Repository is outside the public publisher scope.');
    const { files, commit } = await inspect(repo);
    const license = metadata.license?.spdx_id || null;
    const paths = [...files.keys()].filter((file) => file.endsWith('/SKILL.md') && prefixes.some((prefix) => file.startsWith(prefix)));
    const matches = paths.filter((file) => eligiblePath(file) && files.get(file).mode === '100644')
      .sort().slice(0, maxInventory).map((file) => ({
        repo, commit, path: file, url: repositoryLink(metadata.html_url, 'github.com', repo),
        slug: file.split('/').at(-2),
        // The repository license is a signal only. Review the applicable files before mirroring.
        licenseHint: license,
      })).filter(({ slug, url }) => slugPattern.test(slug) && url);
    return { matches, sampled: paths.length, capped: paths.length > maxInventory, licenseHint: license };
  }

  function skillMatch(repo, slug, url, host) {
    if (!repoPattern.test(repo) || !eligiblePath(repo) || !slugPattern.test(slug) || !eligiblePath(slug)) return null;
    const link = repositoryLink(url, host, host === 'skills.sh' ? repo : undefined);
    return link && { repo, slug, url: link };
  }

  return {
    inspect,
    read: (repo, commit, file) => retrieve(repo, commit, file, fetchImpl),
    async discover() {
      const discoveries = {};
      const sources = {};
      async function probe(source, tier, access, queries, discover) {
        const status = { tier, access, queryBudget: queries.length, attempted: 0, succeeded: 0, sampled: 0, matched: 0 };
        const matches = new Map();
        const details = {};
        try {
          for (const query of queries) {
            status.attempted++;
            const result = await discover(query);
            status.succeeded++;
            status.sampled += result.sampled;
            for (const match of result.matches) {
              if (match) matches.set(`${match.repo.toLowerCase()}/${match.path || match.slug || ''}`, match);
            }
            if (result.capped) details.capped = true;
            if ('licenseHint' in result) details.licenseHint = result.licenseHint;
          }
          status.state = 'reachable';
        } catch (error) {
          status.state = error.status === 429 || error.status === 403 ? 'limited' :
            error.status === 401 ? 'auth-required' : 'unavailable';
          if (error.status) status.httpStatus = error.status;
          if (error.retryAfter) status.retryAfter = error.retryAfter;
        }
        status.matched = matches.size;
        sources[source] = { ...status, ...details };
        discoveries[source] = [...matches.values()];
      }

      if (env.VERCEL_OIDC_TOKEN) {
        await probe('skills.sh', 'directory', 'oidc', ['find-skills', ...discoveryQueries], async (query) => {
          const { data } = await json('https://skills.sh/api/v1/skills/search?' + new URLSearchParams({ q: query, limit: '10' }),
            { Authorization: 'Bearer ' + env.VERCEL_OIDC_TOKEN, Accept: 'application/json' });
          if (!Array.isArray(data)) throw new Error('Invalid skills.sh response.');
          return {
            sampled: data.length,
            matches: data.slice(0, 10).map((item) => skillMatch(item.source, item.slug, item.url, 'skills.sh')),
          };
        });
      } else sources['skills.sh'] = {
        state: 'auth-required', tier: 'directory', access: 'oidc', credential: 'VERCEL_OIDC_TOKEN',
        queryBudget: discoveryQueries.length + 1, attempted: 0, succeeded: 0, sampled: 0, matched: 0,
      };

      await probe('skillsmp', 'directory', env.SKILLSMP_API_KEY ? 'api-key' : 'public',
        ['doc-coauthoring', ...discoveryQueries], async (query) => {
        const headers = env.SKILLSMP_API_KEY ? { Authorization: 'Bearer ' + env.SKILLSMP_API_KEY } : {};
        const result = await json('https://skillsmp.com/api/v1/skills/search?' + new URLSearchParams({ q: query, limit: '10' }), headers);
        if (!Array.isArray(result.data?.skills)) throw new Error('Invalid SkillsMP response.');
        return {
          sampled: result.data.skills.length,
          matches: result.data.skills.slice(0, 10).map((item) => {
            const link = repositoryLink(item.githubUrl, 'github.com');
            const repo = link && new URL(link).pathname.split('/').slice(1, 3).join('/');
            return skillMatch(repo, item.name, item.skillUrl, 'skillsmp.com');
          }),
        };
      });

      const githubAccess = env.GITHUB_TOKEN ? 'api-key' : 'public';
      await probe('github-topic', 'community', githubAccess,
        ['linkedin writing', 'davinci resolve', 'remotion', ...discoveryQueries], async (subject) => {
          const query = `topic:agent-skills is:public fork:false ${subject}`;
          const result = await github('search/repositories?' + new URLSearchParams({ q: query, per_page: '10' }));
          if (!Array.isArray(result.items)) throw new Error('Invalid GitHub search response.');
          return {
            sampled: result.items.length,
            matches: result.items.slice(0, 10).filter((item) => item.private === false && item.fork === false &&
              repoPattern.test(item.full_name) && eligiblePath(item.full_name) &&
              repositoryLink(item.html_url, 'github.com', item.full_name))
              .map((item) => ({ repo: item.full_name, url: item.html_url })),
          };
      });
      if (env.GITHUB_TOKEN) {
        await probe('github-code','community','api-key',['filename:SKILL.md "frontend"'],async q => {
          const result=await github('search/code?'+new URLSearchParams({q,per_page:'12'}));
          return { sampled:result.items.length, matches:result.items.filter(x=>x.repository?.private===false &&
            repoPattern.test(x.repository.full_name) && safeSegments(x.path) && eligiblePath(x.path) && eligiblePath(x.repository.full_name))
            .map(x=>({repo:x.repository.full_name,path:x.path,url:x.html_url})) };
        });
        await probe('awesome-lists','community','api-key',['VoltAgent/awesome-agent-skills'],async repo => {
          const record=await github('repos/'+repo+'/readme',2*1024*1024);
          if (record.encoding!=='base64') throw new Error('Unsupported list format.');
          const body=Buffer.from(record.content,'base64').toString('utf8');
          const repos=[...new Set(Array.from(body.matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/g),m=>m[1]))];
          return {sampled:repos.length,matches:repos.filter(r=>repoPattern.test(r)&&eligiblePath(r)).slice(0,30)
            .map(r=>({repo:r,url:'https://github.com/'+r}))};
        });
      }
      for (const collection of directSources) {
        await probe(collection.id, 'first-party', githubAccess, [collection], inventory);
      }
      return { discoveries, sources };
    },
  };
}

function assessContent(text, slug) {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const header = frontmatter?.[1] || '';
  const body = text.slice(frontmatter?.[0].length || 0).trim();
  const names = [...header.matchAll(/^name:[ \t]*["']?([\w-]+)["']?[ \t]*\r?$/gm)];
  const descriptions = [...header.matchAll(/^description:[ \t]*([^\r\n]*)\r?$/gm)];
  const inline = descriptions[0]?.[1].trim();
  const continued = descriptions[0] ? header.slice(descriptions[0].index + descriptions[0][0].length)
    .match(/^(?:\r?\n[ \t]+[^\r\n]*)+/)?.[0].trim().replace(/\s+/g, ' ') : '';
  const description = /^[|>][+-]?$/.test(inline) ? continued : inline?.replace(/^["']|["']$/g, '');
  const checks = {
    name: names.length === 1 && names[0][1] === slug && slug.length <= 64 && slugPattern.test(slug),
    description: descriptions.length === 1 && Boolean(description) && description.length <= 1024,
    body: body.length > 0,
  };
  const signals = {
    scope: /\b(?:when|use|applies|purpose)\b/i.test(description || ''),
    procedure: /^(?:[ \t]*\d+[.)][ \t]+|#{2,}[ \t]+(?:\d+[.)]?[ \t]+|(?:step|workflow|process|procedure)\b))/im.test(body),
    verification: /\b(?:verif(?:y|ication)|validate|checklist|tests?|confirm|review)\b/i.test(body),
    example: /\bexamples?\b|^```/im.test(body),
  };
  return {
    validity: { passed: Object.values(checks).every(Boolean), checks },
    quality: { method: 'structural-v1', points: Object.values(signals).filter(Boolean).length, maxPoints: 4, signals },
  };
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

async function inspectEntry(spec, previous, adapters, now, discovery, states, mirror) {
  const { repo, path, slug, collection, reviewed, ...metadata } = spec;
  const id = 'federated/' + repo.toLowerCase() + '/' + slug;
  const tier = firstParty.some((publisher) => publisher.repo.toLowerCase() === repo.toLowerCase()) ? 'first-party' : 'community';
  const source = { id, name: slug, ...metadata, tier, attribution: repo, qualityScore: null, pricing: metadata.pricing || 'unknown' };
  githubUrl(repo, '0'.repeat(40), path);
  if (!eligiblePath(repo) || !eligiblePath(path) || !eligiblePath(slug) || scanSkill(metadata.description || '').blocked) {
    return previous ? { ...previous, tier, status: 'quarantined', reason: 'Outside the reviewed content scope.', lastChecked: now, mirror: [] } : null;
  }
  let tree;
  try {
    tree = await adapters.inspect(repo);
  } catch (error) {
    if (error.status === 404 && previous) return { ...previous, status: 'removed', reason: 'GitHub repository is no longer publicly accessible.', lastChecked: now };
    if (collection && !states[collection]) states[collection] = { state: 'unavailable', ...(error.status ? { httpStatus: error.status } : {}) };
    return previous ? { ...previous, lastChecked: now, refreshState: 'unavailable' } : null;
  }
  if (collection && !states[collection]) states[collection] = { state: 'reachable', tier, repository: repo };
  const { commit, files } = tree;
  const upstream = { repo, path, commit, url: githubUrl(repo, commit, path) };
  if (!files.has(path)) {
    return previous ? { ...previous, status: 'removed', reason: 'Upstream SKILL.md is missing.', lastChecked: now } : null;
  }

  const sourceLinks = [
    { source: collection || 'github-repository', url: upstream.url },
    ...Object.entries(discovery).flatMap(([provider, matches]) => matches.filter((item) =>
      item.repo.toLowerCase() === repo.toLowerCase() && (!item.slug || item.slug === slug) &&
      (!item.path || item.path === path) && item.url && provider !== collection)
      .slice(0, 1).map((item) => ({ source: provider, url: item.url }))),
  ];
  // A search result can fall outside the sample even while its known GitHub pin stays verifiable.
  for (const link of previous?.sources || []) {
    if (link.source !== 'github-repository' && !sourceLinks.some((current) => current.source === link.source)) sourceLinks.push(link);
  }
  const reviewDigest = digest(JSON.stringify([reviewPolicyVersion, spec]));
  const publicEntry = {
    ...source, upstream, url: upstream.url, sources: sourceLinks, lastChecked: now, lastVerified: now,
    reviewDigest,
  };

  function readyMirror(shas) {
    return !mirror || shas?.length && shas.every((sha) => mirror.has(sha));
  }

  if (previous?.reviewDigest === reviewDigest && previous.upstream.commit === commit &&
      ['approved', 'metadata-only', 'quarantined'].includes(previous.status) &&
      (previous.status !== 'approved' || readyMirror(previous.mirror))) {
    const { refreshState, ...verified } = previous;
    return { ...verified, ...publicEntry, refreshState: 'unchanged' };
  }

  try {
    const bytes = await adapters.read(repo, commit, path);
    const text = decode(bytes);
    const checksum = digest(bytes);
    const assessment = assessContent(text, slug);
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
    const mirrorFiles = new Map([[checksum, bytes]]);
    if (checksum !== reviewed.checksum || JSON.stringify(licensePaths) !== JSON.stringify(expectedPaths) ||
        files.get(path).mode !== '100644' || !assessment.validity.passed) {
      status = 'quarantined';
      reason = assessment.validity.passed ? 'Upstream instructions or license file list differ from the reviewed pin.' :
        'Upstream instructions failed the required format checks.';
    } else {
      const pins = [...reviewed.licenseFiles, ...reviewed.assets];
      let filesChanged = false;
      for (const pin of pins) {
        if (!['100644', '100755'].includes(files.get(pin.path)?.mode)) {
          filesChanged = true;
          break;
        }
        const content = await adapters.read(repo, commit, pin.path);
        const text = decode(content);
        if (digest(content) !== pin.sha256 || (pin.kind !== 'notice' && scanSkill(text, pin.kind === 'script').blocked)) {
          filesChanged = true;
          break;
        }
        (reviewed.licenseFiles.includes(pin) ? licenseEvidence : skillAssets).push({
          ...pin, url: githubUrl(repo, commit, pin.path),
        });
        if (pin.kind !== 'script' && files.get(pin.path).mode === '100644') mirrorFiles.set(pin.sha256, content);
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
    if (mirror && status === 'approved') {
      for (const [sha, bytes] of mirrorFiles) mirror.set(sha, bytes);
    }
    return {
      ...publicEntry, checksum, fingerprint: fingerprint(text), trustScore: scan.trustScore, scan,
      ...assessment, license, refreshState: 'verified',
      ...(mirror && status === 'approved' ? { mirror: [...mirrorFiles.keys()] } : {}),
      licenseEvidence, skillAssets, status, reason,
    };
  } catch (error) {
    if (previous && (error.status === 404 || error instanceof TypeError && /encoded data/.test(error.message))) {
      return { ...publicEntry, status: 'quarantined', reason: 'Pinned upstream bytes are missing or invalid.', mirror: [] };
    }
    return previous ? { ...previous, lastChecked: now, refreshState: 'unavailable' } : null;
  }
}

function candidateKey({ repo, path, slug }) {
  return `${repo.toLowerCase()}/${slug || path || ''}`;
}

function matchesReview(match, spec) {
  return match.repo.toLowerCase() === spec.repo.toLowerCase() && (!match.path || spec.path === match.path) &&
    (!match.slug || spec.slug === match.slug);
}

function summarize(entries, candidates) {
  return {
    discovered: new Set(candidates.map(candidateKey)).size,
    licenseHinted: new Set(candidates.filter(({ licenseHint }) => isPermissive(licenseHint)).map(candidateKey)).size,
    reviewed: entries.length,
    licensed: entries.filter(({ license, licenseEvidence }) => isPermissive(license) && licenseEvidence?.length).length,
    valid: entries.filter(({ validity }) => validity?.passed).length,
    blocked: entries.filter(({ scan }) => scan?.blocked).length,
    unique: entries.filter(({ status, duplicateOf }) => ['approved', 'metadata-only'].includes(status) && !duplicateOf).length,
    approved: entries.filter(({ status }) => status === 'approved').length,
    routable: entries.filter(federatedRoutable).length,
    mirrored: entries.filter(({ status, mirror }) => status === 'approved' && mirror?.length).length,
    metadataOnly: entries.filter(({ status }) => status === 'metadata-only').length,
    quarantined: entries.filter(({ status }) => status === 'quarantined').length,
    removed: entries.filter(({ status }) => status === 'removed').length,
    unavailable: entries.filter(({ refreshState }) => refreshState === 'unavailable').length,
    unchanged: entries.filter(({ refreshState }) => refreshState === 'unchanged').length,
  };
}

function buildFunnel(entries, discoveries, sources) {
  const providerEntries = (provider) => entries.filter(({ sources: links }) => links?.some(({ source }) => source === provider));
  const allCandidates = Object.values(discoveries).flat();
  const providers = new Set([...Object.keys(sources), ...entries.flatMap(({ sources: links }) => (links || []).map(({ source }) => source))]);
  const tiers = new Set([...Object.values(sources).map(({ tier }) => tier), ...entries.map(({ tier }) => tier)].filter(Boolean));
  return {
    totals: { ...summarize(entries, allCandidates), sampled: Object.values(sources).reduce((sum, source) => sum + (source.sampled || 0), 0) },
    sources: Object.fromEntries([...providers].sort().map((provider) => [provider, {
      sampled: sources[provider]?.sampled || 0,
      ...summarize(providerEntries(provider), discoveries[provider] || []),
    }])),
    tiers: Object.fromEntries([...tiers].sort().map((tier) => {
      const fromTier = Object.keys(sources).filter((provider) => sources[provider].tier === tier);
      const tierEntries = entries.filter((entry) => entry.tier === tier ||
        tier === 'directory' && entry.sources?.some(({ source }) => fromTier.includes(source)));
      return [tier, {
        sampled: fromTier.reduce((sum, provider) => sum + (sources[provider].sampled || 0), 0),
        ...summarize(tierEntries, fromTier.flatMap((provider) => discoveries[provider] || [])),
      }];
    })),
  };
}

async function refreshCatalog({ reviewed, previous, adapters, mirror, now = new Date().toISOString() }) {
  const { discoveries, sources } = await adapters.discover();
  for (const [provider, discoveriesForProvider] of Object.entries(discoveries)) {
    sources[provider].matchedReviewed = reviewed.filter((spec) => discoveriesForProvider.some((match) => matchesReview(match, spec))).length;
  }
  const entries = [];
  const priorById = new Map(previous.entries.map((entry) => [entry.id, entry]));
  for (const spec of reviewed) {
    const id = 'federated/' + spec.repo.toLowerCase() + '/' + spec.slug;
    const entry = await inspectEntry(spec, priorById.get(id), adapters, now, discoveries, sources, mirror);
    if (entry) entries.push(entry);
  }
  const deduped = deduplicate(entries);
  const candidates = Object.fromEntries(Object.entries(discoveries).map(([provider, matches]) => [provider,
    matches.filter((match) => !reviewed.some((spec) => matchesReview(match, spec))),
  ]));
  return { schemaVersion: 1, verifiedAt: now, sources, funnel: buildFunnel(deduped, discoveries, sources), candidates, entries: deduped };
}

module.exports = { assessContent, createAdapters, deduplicate, fingerprint, refreshCatalog };
