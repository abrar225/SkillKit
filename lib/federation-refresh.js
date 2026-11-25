'use strict';

const { decode, digest, federatedRoutable, githubUrl, requestBytes, retrieve, safeSegments, scanSkill } = require('./federation');
const { isPermissive } = require('./catalog-policy');
const { extractTags } = require('./atlas-taxonomy');
const { firstParty } = require('../catalog/federated/sources.json');

const discoveryQueries = ['documentation', 'frontend design', 'mobile development', 'data modeling', 'video captions'];
const expandedTopicQueries = [
  'linkedin writing', 'davinci resolve', 'remotion', 'after effects', 'ffmpeg',
  'manim', 'lottie', 'brand identity', 'poster design', 'newsletter',
  'cold email', 'dockerfile', 'threejs', 'prisma', 'duckdb',
  'accessibility', 'playwright', 'vitest', 'openapi', 'observability',
];
const expandedCodeQueries = [
  'filename:SKILL.md ffmpeg',
  'filename:SKILL.md "davinci resolve"',
  'filename:SKILL.md remotion',
  'filename:SKILL.md "after effects"',
  'filename:SKILL.md poster',
  'filename:SKILL.md "brand identity"',
  'filename:SKILL.md newsletter',
  'filename:SKILL.md linkedin',
  'filename:SKILL.md duckdb',
  'filename:SKILL.md dockerfile',
];
const expandedSkillsmpQueries = [
  'doc-coauthoring', ...discoveryQueries, 'video editing', 'graphic design',
];

const repoPattern = /^[\w.-]+\/[\w.-]+$/;
const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const maxInventory = 256;
const maxCommunityPerRepo = 32;
const reviewPolicyVersion = 4;
const mixedLicenseRepos = new Set([
  'anthropics/skills',
  'asgeirtj/system_prompts_leaks',
  'getsentry/skills',
  'remotion-dev/skills',
  'wordpress/agent-skills',
  'vercel-labs/agent-skills',
]);

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

function normalizeRepoSlug(repo) {
  return repo.split('/').at(-1).toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '') || 'skill';
}

function isSkillFile(file) {
  return (file === 'SKILL.md' || file.endsWith('/SKILL.md')) &&
    !/(?:^|\/)(?:tests?|__tests__|fixtures?|node_modules|\.git)\//i.test(file) &&
    !/^(?:template|templates)\//i.test(file);
}

function createAdapters({
  fetchImpl,
  env = process.env,
  repositories: directSources = firstParty,
  topicQueries,
  codeQueries,
  awesomeLists,
  skillsmpQueries,
  awesomeRepoLimit = 30,
  skipSkillsSh = false,
  inventoryLimit = 64,
} = {}) {
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
  const repoMeta = new Map();
  const repositories = new Map();
  async function fetchRepoMetadata(repo) {
    const key = repo.toLowerCase();
    if (!repoMeta.has(key)) {
      repoMeta.set(key, github(`repos/${repo}`));
    }
    return repoMeta.get(key);
  }
  async function inspect(repo) {
    const key = repo.toLowerCase();
    if (!repositories.has(key)) {
      repositories.set(key, (async () => {
        const { sha } = await github(`repos/${repo}/commits/HEAD`);
        if (typeof sha !== 'string' || !/^[0-9a-f]{40}$/.test(sha)) throw new Error('Invalid GitHub branch head.');
        const tree = await github(`repos/${repo}/git/trees/${sha}?recursive=1`, 8 * 1024 * 1024);
        if (tree.truncated || !Array.isArray(tree.tree)) throw new Error('GitHub inventory is incomplete.');
        return { commit: sha, files: new Map(tree.tree.filter((item) => item.type === 'blob').map((item) => [item.path, item])) };
      })());
    }
    return repositories.get(key);
  }
  async function inspectRepo(repo) {
    const metadata = await fetchRepoMetadata(repo);
    if (metadata.private !== false || metadata.fork !== false || metadata.archived ||
        metadata.full_name?.toLowerCase() !== repo.toLowerCase()) {
      throw new Error('Repository is outside the public publisher scope.');
    }
    const tree = await inspect(repo);
    return { metadata, ...tree };
  }
  async function inventory({ repo, prefixes }) {
    const metadata = await fetchRepoMetadata(repo);
    if (metadata.private !== false || metadata.fork !== false || metadata.archived ||
        metadata.full_name?.toLowerCase() !== repo.toLowerCase()) throw new Error('Repository is outside the public publisher scope.');
    const { files, commit } = await inspect(repo);
    const license = metadata.license?.spdx_id || null;
    const paths = [...files.keys()].filter((file) => isSkillFile(file) &&
      prefixes.some((prefix) => prefix === '' ? true : file.startsWith(prefix)));
    const matches = paths.filter((file) => eligiblePath(file) && files.get(file).mode === '100644')
      .sort().slice(0, inventoryLimit).map((file) => ({
        repo, commit, path: file, url: repositoryLink(metadata.html_url, 'github.com', repo),
        slug: file === 'SKILL.md' ? normalizeRepoSlug(repo) : file.split('/').at(-2),
        licenseHint: license,
      })).filter(({ slug, url }) => slugPattern.test(slug) && url);
    return { matches, sampled: paths.length, capped: paths.length > inventoryLimit, licenseHint: license };
  }

  function skillMatch(repo, slug, url, host) {
    if (!repoPattern.test(repo) || !eligiblePath(repo) || !slugPattern.test(slug) || !eligiblePath(slug)) return null;
    const link = repositoryLink(url, host, host === 'skills.sh' ? repo : undefined);
    return link && { repo, slug, url: link };
  }

  return {
    inspect,
    inspectRepo,
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

      if (!skipSkillsSh && env.VERCEL_OIDC_TOKEN) {
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
        state: skipSkillsSh ? 'skipped' : 'auth-required', tier: 'directory', access: 'oidc',
        credential: 'VERCEL_OIDC_TOKEN',
        reason: skipSkillsSh ? 'Skipped per docs/SOURCES.md (robots.txt disallows crawling and VERCEL_OIDC_TOKEN is unset).' : undefined,
        queryBudget: skipSkillsSh ? 0 : discoveryQueries.length + 1, attempted: 0, succeeded: 0, sampled: 0, matched: 0,
      };

      await probe('skillsmp', 'directory', env.SKILLSMP_API_KEY ? 'api-key' : 'public',
        skillsmpQueries || ['doc-coauthoring', ...discoveryQueries], async (query) => {
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
        topicQueries || ['linkedin writing', 'davinci resolve', 'remotion', ...discoveryQueries], async (subject) => {
          const query = `topic:agent-skills is:public fork:false ${subject}`;
          const result = await github('search/repositories?' + new URLSearchParams({ q: query, per_page: '10' }));
          if (!Array.isArray(result.items)) throw new Error('Invalid GitHub search response.');
          return {
            sampled: result.items.length,
            matches: result.items.slice(0, 10).filter((item) => item.private === false && item.fork === false &&
              repoPattern.test(item.full_name) && eligiblePath(item.full_name) &&
              repositoryLink(item.html_url, 'github.com', item.full_name))
              .map((item) => ({ repo: item.full_name, url: item.html_url, licenseHint: item.license?.spdx_id || null })),
          };
      });
      if (env.GITHUB_TOKEN) {
        await probe('github-code', 'community', 'api-key', codeQueries || ['filename:SKILL.md "frontend"'], async (q) => {
          const result = await github('search/code?' + new URLSearchParams({ q, per_page: '15' }));
          if (!Array.isArray(result.items)) throw new Error('Invalid GitHub code search response.');
          return {
            sampled: result.items.length,
            matches: result.items.filter((x) => x.repository?.private === false && x.repository?.fork === false &&
              repoPattern.test(x.repository.full_name) && safeSegments(x.path) && eligiblePath(x.path) &&
              eligiblePath(x.repository.full_name) && isSkillFile(x.path))
              .map((x) => ({
                repo: x.repository.full_name,
                path: x.path,
                slug: x.path === 'SKILL.md' ? normalizeRepoSlug(x.repository.full_name) : x.path.split('/').at(-2),
                url: x.html_url,
              })),
          };
        });
        await probe('awesome-lists', 'community', 'api-key', awesomeLists || ['VoltAgent/awesome-agent-skills'], async (repo) => {
          const record = await github('repos/' + repo + '/readme', 2 * 1024 * 1024);
          if (record.encoding !== 'base64') throw new Error('Unsupported list format.');
          const body = Buffer.from(record.content, 'base64').toString('utf8');
          const ignoredOwners = new Set(['topics', 'orgs', 'features', 'marketplace', 'sponsors', 'about', 'site', 'pricing']);
          const repos = [...new Set(Array.from(body.matchAll(/https:\/\/github\.com\/([\w.-]+\/[\w.-]+)/g), (m) => m[1]))]
            .filter((r) => !ignoredOwners.has(r.split('/')[0].toLowerCase()) && r.toLowerCase() !== repo.toLowerCase());
          return {
            sampled: repos.length,
            matches: repos.filter((r) => repoPattern.test(r) && eligiblePath(r)).slice(0, awesomeRepoLimit)
              .map((r) => ({ repo: r, url: 'https://github.com/' + r })),
          };
        });
      }
      await mapLimit(directSources, 6, (collection) => probe(collection.id, 'first-party', githubAccess, [collection], inventory));
      return { discoveries, sources };
    },
  };
}

function parseFrontmatter(text) {
  const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  const header = frontmatter?.[1] || '';
  const body = text.slice(frontmatter?.[0].length || 0).trim();
  const names = [...header.matchAll(/^name:[ \t]*["']?([\w-]+)["']?[ \t]*\r?$/gm)];
  const descriptions = [...header.matchAll(/^description:[ \t]*([^\r\n]*)\r?$/gm)];
  const inline = descriptions[0]?.[1].trim();
  const continued = descriptions[0] ? header.slice(descriptions[0].index + descriptions[0][0].length)
    .match(/^(?:\r?\n[ \t]+[^\r\n]*)+/)?.[0].trim().replace(/\s+/g, ' ') : '';
  const description = /^[|>][+-]?$/.test(inline) ? continued : inline?.replace(/^["']|["']$/g, '');
  const licenseRaw = header.match(/^license:[ \t]*([^\r\n]+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') || null;
  const authorRaw = header.match(/^[ \t]*author:[ \t]*([^\r\n]+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') || null;
  const titleRaw = header.match(/^title:[ \t]*([^\r\n]+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') || null;
  const languageRaw = header.match(/^language:[ \t]*([^\r\n]+)$/m)?.[1]?.trim().replace(/^["']|["']$/g, '') || null;
  return { frontmatter, header, body, names, descriptions, description, licenseRaw, authorRaw, titleRaw, languageRaw };
}

function assessContent(text, slug) {
  const { body, names, descriptions, description } = parseFrontmatter(text);
  const checks = {
    name: names.length === 1 && names[0][1] === slug && slug.length <= 64 && slugPattern.test(slug),
    description: descriptions.length === 1 && (description || '').length >= 12 && description.length <= 1024,
    body: body.replace(/[#*`_]/g, '').trim().length >= 90,
    substantive: body.split('\n').some((line) => line.trim().length >= 20 && !/^\W*(?:todo|tbd|lorem ipsum|placeholder|insert instructions here)\b/i.test(line)),
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

const frontmatterLicenseAliases = {
  '0bsd': '0BSD',
  'apache-2.0': 'Apache-2.0',
  'apache 2.0': 'Apache-2.0',
  'apache license 2.0': 'Apache-2.0',
  'bsd-2-clause': 'BSD-2-Clause',
  'bsd 2-clause': 'BSD-2-Clause',
  'bsd-3-clause': 'BSD-3-Clause',
  'bsd 3-clause': 'BSD-3-Clause',
  'bsl-1.0': 'BSL-1.0',
  'boost software license 1.0': 'BSL-1.0',
  'cc0-1.0': 'CC0-1.0',
  'cc0 1.0': 'CC0-1.0',
  'cc-by-4.0': 'CC-BY-4.0',
  'cc by 4.0': 'CC-BY-4.0',
  isc: 'ISC',
  'isc license': 'ISC',
  mit: 'MIT',
  'mit license': 'MIT',
  'mit-0': 'MIT-0',
  unlicense: 'Unlicense',
  'the unlicense': 'Unlicense',
  zlib: 'Zlib',
};

function parseFrontmatterLicense(raw) {
  if (!raw) return { spdx: null, status: 'missing' };
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  if (isPermissive(trimmed)) return { spdx: trimmed, status: 'permissive' };
  if (frontmatterLicenseAliases[lower]) return { spdx: frontmatterLicenseAliases[lower], status: 'permissive' };
  if (/complete terms in license|see license|apache-2\.0.*license\.txt|^(?:see\s+)?license(?:\.txt|\.md)?$/i.test(trimmed)) {
    return { spdx: null, status: 'refer-to-file' };
  }
  if (/(?:busl|business source|gpl|agpl|lgpl|sspl|cc-by-nc|cc-by-sa|proprietary|commercial|all rights reserved)/i.test(trimmed)) {
    return { spdx: trimmed, status: 'non-permissive' };
  }
  return { spdx: trimmed, status: 'uncertain' };
}

function identifyLicenseText(text) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return 'uncertain';
  if (/business source license|busl-1\.1/i.test(clean)) return 'BUSL-1.1';
  if (/gnu (?:general|affero general|lesser general) public license|terms of the gnu (?:general|lesser)/i.test(clean)) return 'GPL-family';
  if (/creative commons attribution[- ](?:noncommercial|sharealike)|cc-by-(?:nc|sa)/i.test(clean)) return 'CC-restricted';
  if (/all rights reserved\.\s*(?:no part|redistribution is prohibited)|proprietary license|remotion company license|owasp cheat sheet series/i.test(clean)) {
    return 'proprietary';
  }
  if (/apache license[\s\S]{0,120}version 2\.0/i.test(clean) || /^apache license 2\.0\b/i.test(clean)) return 'Apache-2.0';
  if (/boost software license\s*-\s*version 1\.0/i.test(clean)) return 'BSL-1.0';
  if (/cc0 1\.0 universal|creative commons zero/i.test(clean)) return 'CC0-1.0';
  if (/creative commons attribution 4\.0/i.test(clean)) return 'CC-BY-4.0';
  if (/this is free and unencumbered software released into the public domain/i.test(clean)) return 'Unlicense';
  if (/permission is hereby granted, free of charge, to any person obtaining a copy/i.test(clean) &&
      /the software is provided "as is"/i.test(clean)) {
    if (/mit no attribution/i.test(clean) && !/above copyright notice and this permission notice shall be included/i.test(clean)) return 'MIT-0';
    return 'MIT';
  }
  if (/permission to use, copy, modify, and\/or distribute this software for any purpose with or without fee/i.test(clean)) {
    if (/zero[- ]clause bsd|0bsd/i.test(clean) && !/provided that the above copyright notice/i.test(clean)) return '0BSD';
    return 'ISC';
  }
  if (/redistribution and use in source and binary forms/i.test(clean) && /this software is provided by/i.test(clean)) {
    return /neither the name of/i.test(clean) ? 'BSD-3-Clause' : 'BSD-2-Clause';
  }
  if (/this software is provided 'as-is', without any express or implied warranty/i.test(clean) &&
      /altered source versions must be plainly marked/i.test(clean)) {
    return 'Zlib';
  }
  return 'uncertain';
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
  const tierRank = (e) => e.trustTier === 'reviewed' ? 2 : e.status === 'approved' ? 1 : 0;
  const ranked = [...entries].sort((a, b) =>
    Number(b.status === 'approved') - Number(a.status === 'approved') ||
    tierRank(b) - tierRank(a) ||
    (b.trustScore ?? 0) - (a.trustScore ?? 0) ||
    (b.quality?.points ?? 0) - (a.quality?.points ?? 0) ||
    a.id.localeCompare(b.id));
  const unique = [];
  const byId = new Map();
  for (const entry of ranked) {
    const { aliases: ignoredAliases, duplicateOf: ignoredDuplicate, ...candidate } = entry;
    if (!['approved', 'metadata-only'].includes(candidate.status)) {
      byId.set(entry.id, candidate);
      continue;
    }
    const winner = unique.find((item) => item.checksum && candidate.checksum && (item.checksum === candidate.checksum ||
      (item.domain === candidate.domain && item.deliverables?.some((deliverable) => candidate.deliverables?.includes(deliverable)) &&
        closeFingerprints(item.fingerprint, candidate.fingerprint))));
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
  const idx = skillPath.lastIndexOf('/');
  return idx < 0 ? '' : skillPath.slice(0, idx + 1);
}

function appliesToSkill(file, skillPath) {
  const split = file.lastIndexOf('/');
  const dir = split < 0 ? '' : file.slice(0, split + 1);
  const name = file.slice(split + 1);
  return skillPath.startsWith(dir) && /^(?:LICENSE|COPYING|NOTICE|COPYRIGHT)(?:[._-].+)?$/i.test(name);
}

function isNoticeOnlyFile(file) {
  const name = file.slice(file.lastIndexOf('/') + 1);
  return /^(?:NOTICE|COPYRIGHT)(?:[._-].+)?$/i.test(name);
}

function isScriptFile(file, mode) {
  return mode === '100755' || /(?:^|\/)(?:scripts?|bin|__pycache__)\/|\.(?:sh|bash|zsh|bat|cmd|ps1|py|pyc|mjs|cjs|js|ts|tsx|jsx|rb|pl|php|exe|dll|so|dylib)$/i.test(file);
}

function isSafeReferenceAsset(file, mode) {
  return mode === '100644' && !isScriptFile(file, mode) &&
    !/(?:^|\/)(?:node_modules|\.git)\//i.test(file) &&
    /\.(?:md|txt|json|ya?ml|css|html)$/i.test(file);
}

function normalizeTitle(slug, fmTitle, text) {
  if (fmTitle) return fmTitle;
  const heading = text.match(/^#[ \t]+([^\r\n]+)/m)?.[1]?.trim();
  if (heading && heading.length <= 120) return heading;
  return slug.split('-').map((w) => w ? w[0].toUpperCase() + w.slice(1) : w).join(' ');
}

function buildSourceLinks(collection, upstreamUrl, discovery, repo, slug, path, previous) {
  const sourceLinks = [
    { source: collection || 'github-repository', url: upstreamUrl },
    ...Object.entries(discovery).flatMap(([provider, matches]) => matches.filter((item) =>
      item.repo.toLowerCase() === repo.toLowerCase() && (!item.slug || item.slug === slug) &&
      (!item.path || item.path === path) && item.url && provider !== collection)
      .slice(0, 1).map((item) => ({ source: provider, url: item.url }))),
  ];
  for (const link of previous?.sources || []) {
    if (link.source !== 'github-repository' && !sourceLinks.some((current) => current.source === link.source)) sourceLinks.push(link);
  }
  return sourceLinks;
}

async function inspectEntry(spec, previous, adapters, now, discovery, states, mirror) {
  const { repo, path, slug, collection, reviewed, ...metadata } = spec;
  const id = 'federated/' + repo.toLowerCase() + '/' + slug;
  const tier = firstParty.some((publisher) => publisher.repo.toLowerCase() === repo.toLowerCase()) ? 'first-party' : 'community';
  const source = { id, name: slug, ...metadata, tier, attribution: repo, qualityScore: null, pricing: metadata.pricing || 'unknown' };
  githubUrl(repo, '0'.repeat(40), path);
  if (!eligiblePath(repo) || !eligiblePath(path) || !eligiblePath(slug) || scanSkill(metadata.description || '').blocked) {
    return previous ? { ...previous, tier, trustTier: 'quarantined', status: 'quarantined', reason: 'Outside the reviewed content scope.', lastChecked: now, mirror: [] } : null;
  }
  let tree;
  try {
    tree = await adapters.inspect(repo);
  } catch (error) {
    if (error.status === 404 && previous) return { ...previous, trustTier: 'removed', status: 'removed', reason: 'GitHub repository is no longer publicly accessible.', lastChecked: now };
    if (collection && !states[collection]) states[collection] = { state: 'unavailable', ...(error.status ? { httpStatus: error.status } : {}) };
    return previous ? { ...previous, lastChecked: now, refreshState: 'unavailable' } : null;
  }
  if (collection && !states[collection]) states[collection] = { state: 'reachable', tier, repository: repo };
  const { commit, files } = tree;
  const upstream = { repo, path, commit, url: githubUrl(repo, commit, path) };
  if (!files.has(path)) {
    return previous ? { ...previous, trustTier: 'removed', status: 'removed', reason: 'Upstream SKILL.md is missing.', lastChecked: now } : null;
  }

  const sourceLinks = buildSourceLinks(collection, upstream.url, discovery, repo, slug, path, previous);
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
    const hasScripts = [...files].some(([file, { mode }]) => file.startsWith(directory) && isScriptFile(file, mode));
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
        const fileText = decode(content);
        if (digest(content) !== pin.sha256 || (pin.kind !== 'notice' && scanSkill(fileText, pin.kind === 'script').blocked)) {
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
      for (const [sha, b] of mirrorFiles) mirror.set(sha, b);
    }
    const tags = extractTags({
      title: metadata.title, description: metadata.description, body: text, slug,
      deliverables: metadata.deliverables, tools: metadata.tools, formats: metadata.formats,
      domain: metadata.domain, stage: metadata.stage,
    });
    return {
      ...publicEntry, ...tags, checksum, fingerprint: fingerprint(text), trustScore: scan.trustScore, scan,
      ...assessment, license, refreshState: 'verified',
      trustTier: status === 'approved' ? 'reviewed' : status,
      reviewTier: 'reviewed',
      ...(mirror && status === 'approved' ? { mirror: [...mirrorFiles.keys()] } : {}),
      licenseEvidence, skillAssets, status, reason,
    };
  } catch (error) {
    if (previous && (error.status === 404 || error instanceof TypeError && /encoded data/.test(error.message))) {
      return { ...publicEntry, trustTier: 'quarantined', status: 'quarantined', reason: 'Pinned upstream bytes are missing or invalid.', mirror: [] };
    }
    return previous ? { ...previous, lastChecked: now, refreshState: 'unavailable' } : null;
  }
}

async function verifySkillDirectoryLicense({ repo, commit, path, text, checksum, files, repoLicenseHint, adapters, fileCache }) {
  const { licenseRaw, authorRaw } = parseFrontmatter(text);
  const fmLic = parseFrontmatterLicense(licenseRaw);
  const directory = skillDirectory(path);
  const applicable = [...files.keys()].filter((file) => appliesToSkill(file, path)).sort();
  const dirFiles = applicable.filter((file) => file.startsWith(directory));
  const ancestorFiles = applicable.filter((file) => !file.startsWith(directory));
  const allLicenseFilesInRepo = [...files.keys()].filter((file) => /^(?:.*\/)?(?:LICENSE|COPYING)(?:[._-].+)?$/i.test(file));
  const distinctDirs = new Set(allLicenseFilesInRepo.map((file) => skillDirectory(file)));
  const isMixedRepo = mixedLicenseRepos.has(repo.toLowerCase()) ||
    distinctDirs.size > 1 ||
    !repoLicenseHint ||
    repoLicenseHint === 'NOASSERTION' ||
    !isPermissive(repoLicenseHint);

  async function readCached(filePath) {
    const cacheKey = `${repo.toLowerCase()}@${commit}:${filePath}`;
    if (!fileCache.has(cacheKey)) {
      fileCache.set(cacheKey, (async () => {
        const mode = files.get(filePath)?.mode;
        if (mode !== '100644') return null;
        const bytes = await adapters.read(repo, commit, filePath);
        const decoded = decode(bytes);
        return { bytes, text: decoded, sha256: digest(bytes) };
      })());
    }
    return fileCache.get(cacheKey);
  }

  const dirLicensePins = [];
  const dirDetectedLicenses = [];
  for (const file of dirFiles) {
    const info = await readCached(file);
    if (!info) return { verified: false, license: 'unverified', reason: 'Skill-directory license file is non-regular or unreadable.', licenseEvidence: [], mirrorExtras: new Map() };
    const pin = { name: file.slice(directory.length) || file, path: file, sha256: info.sha256, kind: 'notice', url: githubUrl(repo, commit, file) };
    dirLicensePins.push([pin, info.bytes]);
    if (!isNoticeOnlyFile(file)) {
      const detected = identifyLicenseText(info.text);
      if (!isPermissive(detected)) {
        return {
          verified: false,
          license: detected === 'uncertain' ? 'unverified' : detected,
          reason: `Skill-directory license file (${file}) is ${detected}, not in the freely redistributable allowlist.`,
          licenseEvidence: [],
          mirrorExtras: new Map(),
        };
      }
      dirDetectedLicenses.push(detected);
    }
  }

  if (fmLic.status === 'non-permissive' || fmLic.status === 'uncertain') {
    return {
      verified: false,
      license: fmLic.spdx || 'unverified',
      reason: `SKILL.md frontmatter declares unsupported or uncertain license (${licenseRaw}).`,
      licenseEvidence: [],
      mirrorExtras: new Map(),
    };
  }

  const ancestorPins = [];
  const ancestorDetected = [];
  for (const file of ancestorFiles) {
    const info = await readCached(file);
    if (!info) continue;
    const pin = { name: file, path: file, sha256: info.sha256, kind: 'notice', url: githubUrl(repo, commit, file) };
    ancestorPins.push([pin, info.bytes]);
    if (!isNoticeOnlyFile(file)) {
      const detected = identifyLicenseText(info.text);
      ancestorDetected.push(detected);
    }
  }

  const restrictiveAncestor = ancestorDetected.find((lic) => !isPermissive(lic) && lic !== 'uncertain');
  if (restrictiveAncestor && dirDetectedLicenses.length === 0) {
    return {
      verified: false,
      license: restrictiveAncestor,
      reason: `Repository or parent directory declares restrictive license (${restrictiveAncestor}) without overriding skill-directory license.`,
      licenseEvidence: [],
      mirrorExtras: new Map(),
    };
  }

  if (dirDetectedLicenses.length > 0) {
    const primaryDirLic = dirDetectedLicenses[0];
    if (dirDetectedLicenses.some((lic) => lic !== primaryDirLic)) {
      return {
        verified: false, license: 'unverified',
        reason: 'Conflicting license files found inside the skill directory.',
        licenseEvidence: [], mirrorExtras: new Map(),
      };
    }
    if (fmLic.status === 'permissive' && fmLic.spdx !== primaryDirLic) {
      return {
        verified: false, license: 'unverified',
        reason: `SKILL.md frontmatter license (${fmLic.spdx}) disagrees with directory LICENSE (${primaryDirLic}).`,
        licenseEvidence: [], mirrorExtras: new Map(),
      };
    }
    const evidencePairs = [...dirLicensePins, ...ancestorPins];
    return {
      verified: true,
      license: primaryDirLic,
      scope: 'skill-directory-license',
      author: authorRaw || repo,
      licenseEvidence: evidencePairs.map(([pin]) => pin),
      mirrorExtras: new Map(evidencePairs.map(([pin, b]) => [pin.sha256, b])),
    };
  }

  if (fmLic.status === 'permissive') {
    const compatibleAncestors = ancestorDetected.every((lic) => isPermissive(lic) || lic === 'uncertain');
    if (!compatibleAncestors) {
      return {
        verified: false, license: 'unverified',
        reason: 'SKILL.md frontmatter license conflicts with a restrictive repository or parent license.',
        licenseEvidence: [], mirrorExtras: new Map(),
      };
    }
    const evidencePairs = ancestorPins.length
      ? ancestorPins
      : [[{ name: 'SKILL.md', path, sha256: checksum, kind: 'notice', url: githubUrl(repo, commit, path) }, Buffer.from(text, 'utf8')]];
    return {
      verified: true,
      license: fmLic.spdx,
      scope: 'skill-frontmatter',
      author: authorRaw || repo,
      licenseEvidence: evidencePairs.map(([pin]) => pin),
      mirrorExtras: new Map(evidencePairs.map(([pin, b]) => [pin.sha256, b])),
    };
  }

  // Amendment C: repo root LICENSE alone without skill-directory LICENSE or SKILL.md license field -> metadata-only.
  return {
    verified: false,
    license: 'unverified',
    reason: 'No skill-directory LICENSE file or SKILL.md license field; repo-root metadata alone is insufficient for mirroring.',
    licenseEvidence: [],
    mirrorExtras: new Map(),
  };
}

async function inspectAutoEntry(candidate, previous, adapters, now, discovery, states, mirror, fileCache) {
  const { repo, path, slug, collection, licenseHint } = candidate;
  const id = 'federated/' + repo.toLowerCase() + '/' + slug;
  const tier = firstParty.some((publisher) => publisher.repo.toLowerCase() === repo.toLowerCase()) ? 'first-party' : 'community';
  githubUrl(repo, '0'.repeat(40), path);
  if (!eligiblePath(repo) || !eligiblePath(path) || !eligiblePath(slug)) return null;

  let tree;
  try {
    tree = adapters.inspectRepo ? await adapters.inspectRepo(repo) : await adapters.inspect(repo);
  } catch (error) {
    if (error.status === 404 && previous) return { ...previous, trustTier: 'removed', status: 'removed', reason: 'GitHub repository is no longer publicly accessible.', lastChecked: now, mirror: [] };
    return previous ? { ...previous, lastChecked: now, refreshState: 'unavailable' } : null;
  }

  const { commit, files, metadata: repoMetadata } = tree;
  const effectiveHint = repoMetadata?.license?.spdx_id || licenseHint || null;
  const upstream = { repo, path, commit, url: githubUrl(repo, commit, path) };
  if (!files.has(path)) {
    return previous ? { ...previous, trustTier: 'removed', status: 'removed', reason: 'Upstream SKILL.md is missing.', lastChecked: now, mirror: [] } : null;
  }
  if (files.get(path).mode !== '100644') return null;

  const sourceLinks = buildSourceLinks(collection, upstream.url, discovery, repo, slug, path, previous);
  const autoDigest = digest(JSON.stringify([reviewPolicyVersion, 'auto-v1', repo, path, slug]));
  function readyMirror(shas) {
    return !mirror || shas?.length && shas.every((sha) => mirror.has(sha));
  }
  const recheckLicense = previous?.status === 'metadata-only' &&
    /is uncertain|unsupported or uncertain license \(LICENSE/i.test(previous.reason || '');
  if (!recheckLicense && previous?.reviewDigest === autoDigest && previous.upstream.commit === commit &&
      ['approved', 'metadata-only', 'quarantined'].includes(previous.status) &&
      (previous.status !== 'approved' || readyMirror(previous.mirror))) {
    const { refreshState, ...verified } = previous;
    return { ...verified, sources: sourceLinks, lastChecked: now, lastVerified: now, refreshState: 'unchanged' };
  }

  try {
    const bytes = await adapters.read(repo, commit, path);
    const text = decode(bytes);
    const checksum = digest(bytes);
    const fm = parseFrontmatter(text);
    const effectiveSlug = path === 'SKILL.md' && fm.names.length === 1 && slugPattern.test(fm.names[0][1])
      ? fm.names[0][1] : slug;
    const effectiveId = 'federated/' + repo.toLowerCase() + '/' + effectiveSlug;
    const assessment = assessContent(text, effectiveSlug);
    const directory = skillDirectory(path);
    const dirEntries = [...files.entries()].filter(([file]) => file !== path && file.startsWith(directory) && !appliesToSkill(file, path));
    const hasScripts = dirEntries.some(([file, { mode }]) => isScriptFile(file, mode));
    const scan = scanSkill(text, hasScripts);

    const licenseResult = await verifySkillDirectoryLicense({
      repo, commit, path, text, checksum, files, repoLicenseHint: effectiveHint, adapters, fileCache,
    });

    const title = normalizeTitle(effectiveSlug, fm.titleRaw, text);
    const description = fm.description || text.slice(0, 220).replace(/\s+/g, ' ').trim();
    const tags = extractTags({ title, description, body: text, slug: effectiveSlug });

    let status = 'metadata-only';
    let trustTier = 'metadata-only';
    let reason = licenseResult.reason || null;
    const mirrorFiles = new Map([[checksum, bytes]]);
    const skillAssets = [];

    if (scan.blocked) {
      status = 'quarantined';
      trustTier = 'quarantined';
      reason = 'The static scan detected a high-risk pattern.';
    } else if (!assessment.validity.passed) {
      status = 'metadata-only';
      reason = 'Upstream SKILL.md failed required frontmatter or structural validity checks.';
    } else if (assessment.quality.points < 2) {
      status = 'metadata-only';
      reason = 'Upstream SKILL.md scored below the minimum structural quality threshold (2/4).';
    } else if (licenseResult.verified && isPermissive(licenseResult.license)) {
      // Mirror instruction and non-executable text references only; never scripts or executables.
      const refCandidates = dirEntries
        .filter(([file, { mode }]) => isSafeReferenceAsset(file, mode))
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(0, 12);
      for (const [file] of refCandidates) {
        try {
          const refBytes = await adapters.read(repo, commit, file);
          const refText = decode(refBytes);
          if (scanSkill(refText, false).blocked) continue;
          const refSha = digest(refBytes);
          const relName = file.slice(directory.length) || file;
          skillAssets.push({ name: relName, path: file, sha256: refSha, kind: 'reference', url: githubUrl(repo, commit, file) });
          mirrorFiles.set(refSha, refBytes);
        } catch {
          // Oversized or binary reference file is omitted from mirror.
        }
      }
      for (const [sha, b] of licenseResult.mirrorExtras) mirrorFiles.set(sha, b);
      status = 'approved';
      trustTier = 'auto-verified';
      reason = null;
    }

    // Quarantine previously approved entries if content/license/scan regressed on a new commit.
    if (previous?.status === 'approved' && status !== 'approved') {
      status = 'quarantined';
      trustTier = 'quarantined';
      reason = 'Previously mirrored skill failed verification on refresh: ' + (reason || 'drift detected');
    }

    if (mirror && status === 'approved') {
      for (const [sha, b] of mirrorFiles) mirror.set(sha, b);
    }

    return {
      id: effectiveId,
      name: effectiveSlug,
      title,
      description,
      ...tags,
      language: fm.languageRaw || 'en',
      tier,
      trustTier,
      reviewTier: 'auto-verified',
      attribution: licenseResult.author || repo,
      pricing: 'free',
      hasScripts,
      ...(hasScripts ? { limitations: 'Bundled upstream scripts are neither mirrored nor executed.' } : {}),
      upstream,
      url: upstream.url,
      sources: sourceLinks,
      lastChecked: now,
      lastVerified: now,
      reviewDigest: autoDigest,
      checksum,
      fingerprint: fingerprint(text),
      trustScore: scan.trustScore,
      scan,
      ...assessment,
      qualityScore: null,
      license: licenseResult.license,
      licenseEvidenceScope: licenseResult.scope || null,
      licenseEvidence: licenseResult.licenseEvidence,
      skillAssets,
      refreshState: 'verified',
      ...(mirror && status === 'approved' ? { mirror: [...mirrorFiles.keys()] } : {}),
      status,
      reason,
    };
  } catch (error) {
    if (previous && (error.status === 404 || error instanceof TypeError && /encoded data/.test(error.message))) {
      return { id, name: slug, ...previous, trustTier: 'quarantined', status: 'quarantined', reason: 'Upstream bytes are missing or invalid.', mirror: [], lastChecked: now };
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
  const uniqueRows = entries.filter(({ status, duplicateOf }) => ['approved', 'metadata-only'].includes(status) && !duplicateOf);
  const discoveredKeys = new Set();
  const entryRepos = new Set();
  const entryKeyBySlug = new Map();
  for (const entry of entries) {
    const repoLower = entry.upstream.repo.toLowerCase();
    const key = `${repoLower}/${entry.upstream.path}`;
    discoveredKeys.add(key);
    entryRepos.add(repoLower);
    if (entry.name) entryKeyBySlug.set(`${repoLower}/${entry.name.toLowerCase()}`, key);
  }
  const hintedKeys = new Set();
  for (const candidate of candidates) {
    const repoLower = candidate.repo.toLowerCase();
    let key;
    if (candidate.path) {
      key = `${repoLower}/${candidate.path}`;
    } else if (candidate.slug) {
      const rs = `${repoLower}/${candidate.slug.toLowerCase()}`;
      key = entryKeyBySlug.get(rs) || rs;
    } else {
      if (entryRepos.has(repoLower)) continue;
      key = repoLower;
    }
    discoveredKeys.add(key);
    if (isPermissive(candidate.licenseHint)) hintedKeys.add(key);
  }
  for (const entry of entries) {
    const repoLower = entry.upstream.repo.toLowerCase();
    if (isPermissive(entry.license)) hintedKeys.add(`${repoLower}/${entry.upstream.path}`);
  }
  return {
    discovered: discoveredKeys.size,
    licenseHinted: hintedKeys.size,
    reviewed: entries.filter(({ reviewTier }) => reviewTier !== 'auto-verified').length,
    autoVerified: entries.filter(({ trustTier }) => trustTier === 'auto-verified').length,
    parsed: entries.length,
    licensed: entries.filter(({ license, licenseEvidence }) => isPermissive(license) && licenseEvidence?.length).length,
    licenseEligible: entries.filter(({ license, licenseEvidence }) => isPermissive(license) && licenseEvidence?.length).length,
    valid: entries.filter(({ validity }) => validity?.passed).length,
    qualityPassed: entries.filter(({ validity, quality }) => validity?.passed && (quality?.points ?? 0) >= 2).length,
    blocked: entries.filter(({ scan }) => scan?.blocked).length,
    deduplicated: uniqueRows.length,
    unique: uniqueRows.length,
    approved: entries.filter(({ status }) => status === 'approved').length,
    contentDeliverable: entries.filter(federatedRoutable).length,
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
  const licenseTierKeys = ['reviewed', 'auto-verified', 'metadata-only', 'quarantined', 'removed'];
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
    licenseTiers: Object.fromEntries(licenseTierKeys.map((lt) => {
      const tierEntries = entries.filter((e) => (e.trustTier || e.status) === lt);
      return [lt, {
        count: tierEntries.length,
        unique: tierEntries.filter((e) => !e.duplicateOf).length,
        mirrored: tierEntries.filter((e) => e.status === 'approved' && e.mirror?.length).length,
        routable: tierEntries.filter(federatedRoutable).length,
      }];
    })),
  };
}

async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const idx = cursor++;
      results[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function resolveCommunityPointers(discoveries, reviewed, adapters) {
  const resolved = [];
  const unresolved = {};
  const seenKey = new Set();
  const repoCache = new Map();

  async function inspectOneRepo(repo) {
    const key = repo.toLowerCase();
    if (!repoCache.has(key)) {
      repoCache.set(key, (async () => {
        try {
          return adapters.inspectRepo ? await adapters.inspectRepo(repo) : await adapters.inspect(repo);
        } catch {
          return null;
        }
      })());
    }
    return repoCache.get(key);
  }

  // Pre-warm unique repo trees concurrently before resolving matches deterministically.
  const reposToWarm = [...new Set(Object.values(discoveries).flat()
    .filter((m) => !m.path && !reviewed.some((spec) => matchesReview(m, spec)))
    .map((m) => m.repo))];
  await mapLimit(reposToWarm, 8, inspectOneRepo);

  for (const [provider, matches] of Object.entries(discoveries)) {
    unresolved[provider] = [];
    for (const match of matches) {
      if (reviewed.some((spec) => matchesReview(match, spec))) continue;
      if (match.path) {
        const key = `${match.repo.toLowerCase()}/${match.path}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          resolved.push({ ...match, collection: provider });
        }
        continue;
      }
      const tree = await inspectOneRepo(match.repo);
      if (!tree) {
        unresolved[provider].push(match);
        continue;
      }
      const skillPaths = [...tree.files.keys()]
        .filter((file) => isSkillFile(file) && eligiblePath(file) && tree.files.get(file).mode === '100644')
        .sort();
      const filtered = match.slug
        ? skillPaths.filter((p) => p === 'SKILL.md' || p.endsWith(`/${match.slug}/SKILL.md`))
        : [];
      const chosen = (filtered.length ? filtered : skillPaths).slice(0, maxCommunityPerRepo);
      if (!chosen.length) {
        unresolved[provider].push(match);
        continue;
      }
      for (const file of chosen) {
        const slug = file === 'SKILL.md' ? (match.slug || normalizeRepoSlug(match.repo)) : file.split('/').at(-2);
        if (!slugPattern.test(slug)) continue;
        const key = `${match.repo.toLowerCase()}/${file}`;
        if (!seenKey.has(key)) {
          seenKey.add(key);
          resolved.push({
            repo: match.repo,
            path: file,
            slug,
            commit: tree.commit,
            url: match.url,
            licenseHint: tree.metadata?.license?.spdx_id || match.licenseHint || null,
            collection: provider,
          });
        }
      }
    }
  }
  return { resolved, unresolved };
}

async function refreshCatalog({ reviewed, previous, adapters, mirror, autoVerify = false, now = new Date().toISOString() }) {
  const { discoveries, sources } = await adapters.discover();
  for (const [provider, saved] of Object.entries(previous.candidates || {})) {
    const status = sources[provider];
    if (!status || !['unavailable', 'limited', 'auth-required'].includes(status.state)) continue;
    const current = discoveries[provider] || [];
    const fresh = new Set(current.map(candidateKey));
    const retained = saved.filter((row) => !fresh.has(candidateKey(row)));
    discoveries[provider] = [...current, ...retained];
    status.retainedPointers = retained.length;
  }
  for (const [provider, discoveriesForProvider] of Object.entries(discoveries)) {
    if (sources[provider]) {
      sources[provider].matchedReviewed = reviewed.filter((spec) => discoveriesForProvider.some((match) => matchesReview(match, spec))).length;
    }
  }
  const entries = [];
  const priorById = new Map(previous.entries.map((entry) => [entry.id, entry]));
  const priorByUpstream = new Map(previous.entries.filter((e) => e.upstream?.repo && e.upstream?.path)
    .map((e) => [`${e.upstream.repo.toLowerCase()}/${e.upstream.path}`, e]));
  const seenIds = new Set();

  for (const spec of reviewed) {
    const id = 'federated/' + spec.repo.toLowerCase() + '/' + spec.slug;
    const entry = await inspectEntry(spec, priorById.get(id), adapters, now, discoveries, sources, mirror);
    if (entry && !seenIds.has(entry.id)) {
      seenIds.add(entry.id);
      entries.push(entry);
    }
  }

  let candidates;
  if (autoVerify && adapters.read) {
    const fileCache = new Map();
    const { resolved, unresolved } = await resolveCommunityPointers(discoveries, reviewed, adapters);
    const inspected = await mapLimit(resolved, 8, (candidate) => {
      const prior = priorByUpstream.get(`${candidate.repo.toLowerCase()}/${candidate.path}`) ||
        priorById.get('federated/' + candidate.repo.toLowerCase() + '/' + candidate.slug);
      return inspectAutoEntry(candidate, prior, adapters, now, discoveries, sources, mirror, fileCache);
    });
    for (const entry of inspected) {
      if (entry && !seenIds.has(entry.id)) {
        seenIds.add(entry.id);
        entries.push(entry);
      }
    }
    candidates = unresolved;
  } else {
    candidates = Object.fromEntries(Object.entries(discoveries).map(([provider, matches]) => [provider,
      matches.filter((match) => !reviewed.some((spec) => matchesReview(match, spec))),
    ]));
  }

  const deduped = deduplicate(entries);
  return { schemaVersion: 1, verifiedAt: now, sources, funnel: buildFunnel(deduped, discoveries, sources), candidates, entries: deduped };
}

module.exports = {
  assessContent,
  createAdapters,
  deduplicate,
  expandedCodeQueries,
  expandedSkillsmpQueries,
  expandedTopicQueries,
  fingerprint,
  identifyLicenseText,
  maxInventory,
  parseFrontmatterLicense,
  refreshCatalog,
};
