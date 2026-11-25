'use strict';

const { requestBytes } = require('./federation');

// Only these public catalog labels can become outbound search terms.
const categories = new Map([
  ['video-editor-project', 'video editor project'], ['motion-video', 'motion graphics'],
  ['audio-cleanup', 'audio editing'], ['captions', 'video captions'],
  ['static-graphic', 'graphic design'], ['brand-guide', 'brand guidelines'],
  ['ui-design', 'interface design'], ['design-system-doc', 'design system'],
  ['social-copy', 'social media writing'], ['newsletter', 'newsletter writing'],
  ['mobile-app', 'mobile development'], ['data-analysis', 'data analytics'],
  ['spreadsheet', 'spreadsheet authoring'], ['presentation', 'presentation authoring'],
  ['document', 'document authoring'], ['accessibility-review', 'web accessibility'],
]);
const tools = new Map([
  ['davinci-resolve', 'davinci resolve'], ['premiere-pro', 'premiere pro'], ['after-effects', 'after effects'],
  ['final-cut-pro', 'final cut pro'], ['ffmpeg', 'ffmpeg'], ['remotion', 'remotion'],
  ['figma', 'figma'], ['inkscape', 'inkscape'], ['linkedin', 'linkedin'],
  ['instagram', 'instagram'], ['flutter', 'flutter'], ['react-native', 'react native'],
]);
const maxResults = 3;

async function searchUpstream(contract, covers, { env = process.env, fetchImpl } = {}) {
  if (env.SKILLKIT_UPSTREAM_SEARCH !== '1' || contract.clarification) return [];
  const requests = contract.deliverables.filter(({ kind }, index) => covers[index]?.gaps.length && categories.has(kind));
  const request = requests.find(({ kind, tools: required }) =>
    kind && required.every((tool) => tools.has(tool) && !contract.forbiddenTools.includes(tool)));
  if (!request) return [];
  const catalogQuery = ['topic:agent-skills', categories.get(request.kind), ...request.tools.slice(0, 1).map((tool) => tools.get(tool))].join(' ');
  const url = new URL('https://api.github.com/search/repositories');
  url.search = new URLSearchParams({ q: catalogQuery, per_page: String(maxResults) });
  try {
    const bytes = await requestBytes(url.href, { fetchImpl, limit: 64 * 1024, timeout: 2500,
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'SkillKit-Catalog-Search' } });
    const { items } = JSON.parse(bytes);
    if (!Array.isArray(items)) return [];
    return items.slice(0, maxResults).flatMap(({ full_name }) =>
      typeof full_name === 'string' && /^[a-z\d][a-z\d-]{0,38}\/[a-z\d_.-]{1,64}$/i.test(full_name) &&
          !/\/\.{1,2}$/.test(full_name)
        ? [{ id: full_name, url: 'https://github.com/' + full_name, status: 'discovery-only' }] : []);
  } catch {
    return [];
  }
}

module.exports = { searchUpstream };
