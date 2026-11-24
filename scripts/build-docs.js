#!/usr/bin/env node

/**
 * build-docs — render the catalog pages from registry/*.json so they cannot
 * drift from what is actually on disk.
 *
 * Outputs:
 *   docs/SKILLS.md
 *   docs/RESOURCES.md
 *   THIRD_PARTY_NOTICES.md
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const read = (name) => JSON.parse(fs.readFileSync(path.join(repoRoot, 'registry', name), 'utf8'));

const skillsFile = read('skills.json');
const domainsFile = read('domains.json');
const resourcesFile = read('resources.json');

const skills = skillsFile.skills;
const domains = domainsFile.domains;
const resources = resourcesFile.resources;
const generated = skillsFile.generatedAt;

const esc = (text) => String(text || '').replace(/\|/g, '\\|').replace(/\s+/g, ' ').trim();
const cell = (text, max = 220) => {
  const clean = esc(text);
  return clean.length > max ? `${clean.slice(0, max - 1)}…` : clean;
};

// --- docs/SKILLS.md --------------------------------------------------------
const byDomain = new Map(domains.map((d) => [d.id, []]));
for (const skill of skills) {
  if (!byDomain.has(skill.domain)) byDomain.set(skill.domain, []);
  byDomain.get(skill.domain).push(skill);
}

const skillLines = [
  '# Skill Catalog',
  '',
  `Generated from \`registry/skills.json\` on ${generated}. Do not edit by hand: run \`npm run build:registry && npm run docs\`.`,
  '',
  `${skills.length} skills across ${domains.length} domains, ${skills.filter((s) => s.featured).length} featured (marked ★).`,
  '',
  '| Domain | Skills | Featured |',
  '| :--- | ---: | ---: |',
  ...domains.map((d) => {
    const group = byDomain.get(d.id) || [];
    return `| [${esc(d.name)}](#${d.id}) \`${d.id}\` | ${group.length} | ${group.filter((s) => s.featured).length} |`;
  }),
  '',
];

for (const domain of domains) {
  const group = byDomain.get(domain.id) || [];
  skillLines.push(`<a id="${domain.id}"></a>`, '', `## ${esc(domain.name)}`, '');
  skillLines.push(`\`${domain.path}\` — ${esc(domain.description)}`, '');
  if (group.length === 0) {
    skillLines.push('_No skills in this domain yet._', '');
    continue;
  }
  skillLines.push('| Skill | Path | License | What it does |');
  skillLines.push('| :--- | :--- | :--- | :--- |');
  for (const skill of group) {
    const mark = skill.featured ? '★ ' : '';
    skillLines.push(
      `| ${mark}**${esc(skill.displayName || skill.name)}** | \`${skill.path}\` | ${esc(skill.license)} | ${cell(skill.description)} |`
    );
  }
  skillLines.push('');
}

fs.mkdirSync(path.join(repoRoot, 'docs'), { recursive: true });
fs.writeFileSync(path.join(repoRoot, 'docs', 'SKILLS.md'), `${skillLines.join('\n')}\n`);

// --- docs/RESOURCES.md -----------------------------------------------------
const byCategory = new Map(resourcesFile.categories.map((c) => [c.id, []]));
for (const resource of resources) {
  if (!byCategory.has(resource.category)) byCategory.set(resource.category, []);
  byCategory.get(resource.category).push(resource);
}

const resourceLines = [
  '# Resource Catalog',
  '',
  `Generated from \`registry/resources.json\` on ${generated}. Do not edit by hand: run \`npm run build:registry && npm run docs\`.`,
  '',
  `${resources.length} developer resources across ${resourcesFile.categories.length} categories. These are links and references, not vendored code.`,
  '',
  '| Category | Entries |',
  '| :--- | ---: |',
  ...resourcesFile.categories.map((c) => `| [${esc(c.name)}](#${c.id}) \`${c.id}\` | ${(byCategory.get(c.id) || []).length} |`),
  '',
];

for (const category of resourcesFile.categories) {
  const group = byCategory.get(category.id) || [];
  resourceLines.push(`<a id="${category.id}"></a>`, '', `## ${esc(category.name)}`, '');
  resourceLines.push(`Source file: \`${category.path}\``, '');
  resourceLines.push('| Resource | Type | Pricing | License | Why it matters |');
  resourceLines.push('| :--- | :--- | :--- | :--- | :--- |');
  for (const resource of group) {
    resourceLines.push(
      `| [${esc(resource.name)}](${resource.url}) | ${esc(resource.type || '—')} | ${esc(resource.pricing || '—')} | ${esc(resource.license || '—')} | ${cell(resource.description, 260)} |`
    );
  }
  resourceLines.push('');
}

fs.writeFileSync(path.join(repoRoot, 'docs', 'RESOURCES.md'), `${resourceLines.join('\n')}\n`);

// --- THIRD_PARTY_NOTICES.md ------------------------------------------------
const repos = new Map();
for (const skill of skills) {
  if (!skill.upstream) continue;
  const key = skill.upstream.repo;
  if (!repos.has(key)) {
    repos.set(key, {
      repo: key,
      url: skill.upstream.url || `https://github.com/${key}`,
      commits: new Set(),
      licenses: new Set(),
      skills: [],
    });
  }
  const entry = repos.get(key);
  if (skill.upstream.commit) entry.commits.add(skill.upstream.commit);
  entry.licenses.add(skill.license);
  entry.skills.push(skill);
}

const unverified = skills.filter((s) => ['unverified', 'unlicensed', 'unknown'].includes(s.license));

const noticeLines = [
  '# Third-Party Notices',
  '',
  `Generated from \`registry/skills.json\` on ${generated}. Do not edit by hand.`,
  '',
  'This repository vendors skill directories from permissively licensed upstream projects, verbatim.',
  'Each upstream skill keeps its exact source files and executable bits. Its `SOURCE.json` records the pinned commit, SHA-256 hashes, and inherited notices bundled under `upstream-licenses/`. Per-skill license files remain in their source locations.',
  '',
  'The repository-level MIT license in `LICENSE` covers the original work in this repository (curation, registry, CLI, documentation). It does not relicense vendored third-party content.',
  '',
  `## Vendored upstream projects (${repos.size})`,
  '',
];

for (const entry of [...repos.values()].sort((a, b) => a.repo.localeCompare(b.repo))) {
  noticeLines.push(`### [${entry.repo}](${entry.url})`, '');
  noticeLines.push(`- License: ${[...entry.licenses].join(', ')}`);
  noticeLines.push(`- Vendored commit: ${[...entry.commits].map((c) => `\`${c}\``).join(', ')}`);
  noticeLines.push(`- Skills: ${entry.skills.map((s) => `\`${s.id}\``).join(', ')}`);
  noticeLines.push('');
}

noticeLines.push('## Skills with unverified or missing licenses', '');
noticeLines.push(
  'These entries are legacy local copies, local installations, or attributed page extractions without a verified license. They are listed for transparency and remain the property of their respective authors. If you own one of these and want it removed or credited differently, open an issue.',
  ''
);
noticeLines.push('| Skill | License status | Origin | Detail |');
noticeLines.push('| :--- | :--- | :--- | :--- |');
for (const skill of unverified.sort((a, b) => a.id.localeCompare(b.id))) {
  noticeLines.push(
    `| \`${skill.id}\` | ${esc(skill.license)} | ${esc(skill.origin)} | ${cell(skill.licenseDetail || '—', 120)} |`
  );
}
noticeLines.push('');
noticeLines.push('## Not vendored', '');
noticeLines.push(
  'Paid products, unlicensed repositories, and system-prompt collections with unclear terms are linked from `registry/resources.json` rather than copied. See `docs/LICENSING.md` for the inclusion rules.'
);
noticeLines.push('');

fs.writeFileSync(path.join(repoRoot, 'THIRD_PARTY_NOTICES.md'), `${noticeLines.join('\n')}\n`);

console.log(`docs/SKILLS.md — ${skills.length} skills`);
console.log(`docs/RESOURCES.md — ${resources.length} resources`);
console.log(`THIRD_PARTY_NOTICES.md — ${repos.size} upstream projects, ${unverified.length} unverified entries`);

// A link-reading assistant needs a compact map even when it cannot call MCP.
const { workflows, additions } = require('../workflows/routes.json');
const resourceLinks = new Map(resources.map(({ id, url, pricing }) => [id, url + ' (' + pricing + ')']));
const { mayDeliver } = require('../lib/catalog-policy');
const allowedSkill = id => id && mayDeliver(id) ? id : undefined;
const guide = [
  '# SkillKit for a browsing assistant', '',
  'Start with the deliverable, existing stack and constraints from the conversation. If a missing detail changes which kit fits, ask one question about that detail. For example, ask whether a portfolio request means redesigning existing pages or drafting a static portfolio PDF.', '',
  'Choose the matching task below. Entries name skill IDs and resource URLs in stage order. Read only the first applicable skill at https://raw.githubusercontent.com/abrar225/SkillKit/main/skills/<id>/SKILL.md. Resolve its referenced files relative to that folder. SOURCE.json in the same folder records provenance and terms. Use supplied assets and respect limits such as mockups only, free references only and no deployment.', '',
  'Each line pairs a stage with its skill and reference links. Use extra guidance only when its condition applies. Skip stages outside the brief. For a catalog gap, say what is missing. The connected version also supports ranked catalog search with find_kit.', '',
];
for (const route of workflows) {
  guide.push('## ' + route.title, '');
  for (const stage of route.stages) {
    const refs = [allowedSkill(stage.skill), ...(stage.resources || []).map((id) => resourceLinks.get(id))].filter(Boolean);
    guide.push('- ' + stage.id + ' (' + stage.effect + '): ' + refs.join(' · ') + '. ' + (allowedSkill(stage.skill) ? '' : stage.outcome + ' ') + stage.check);
  }
  for (const addition of additions.filter((item) => item.workflows.includes(route.id))) {
    const refs = [allowedSkill(addition.skill), ...(addition.resources || []).map((id) => resourceLinks.get(id))].filter(Boolean);
    const stack = addition.whenStack ? ' in ' + addition.whenStack.join('/') : '';
    guide.push('- For ' + addition.topics[0] + stack + ': ' + refs.join(' · '));
  }
  guide.push('');
}
fs.writeFileSync(path.join(repoRoot, 'llms.txt'), guide.join('\n'));
console.log('llms.txt — ' + workflows.length + ' task routes');
