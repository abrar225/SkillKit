#!/usr/bin/env node

/**
 * validate-registry — verify that the generated registries describe what is
 * actually on disk. Run after `python3 scripts/build-registry.py`.
 *
 * Exit codes: 0 = all checks pass, 1 = at least one error.
 * Warnings do not fail the build; errors do.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { isDeepStrictEqual } = require('util');

const repoRoot = path.resolve(__dirname, '..');

const errors = [];
const warnings = [];

function error(message) {
  errors.push(message);
}

function warn(code, message) {
  warnings.push({ code, message });
}

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    error(`cannot parse ${path.relative(repoRoot, file)}: ${err.message}`);
    return null;
  }
}

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, acc);
    } else {
      acc.push(full);
    }
  }
  return acc;
}

function safeRelative(value) {
  return typeof value === 'string' && value.length > 0 &&
    !value.includes('\\') && !value.includes('\0') && !path.posix.isAbsolute(value) &&
    value.split('/').every((part) => part !== '' && part !== '.' && part !== '..');
}

function isContainedRegularFile(full) {
  const relative = path.relative(repoRoot, full);
  if (relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) return false;
  let current = repoRoot;
  try {
    // Check every component, including the skill directory: lstat on only the
    // leaf would follow a symlinked parent out of the verified source tree.
    for (const component of relative.split(path.sep)) {
      current = path.join(current, component);
      if (fs.lstatSync(current).isSymbolicLink()) return false;
    }
    return fs.lstatSync(full).isFile();
  } catch {
    return false;
  }
}

function checkIntegrity(dir, source, label) {
  const integrity = source.contentIntegrity;
  if (!integrity || integrity.algorithm !== 'sha256' || !integrity.files ||
      typeof integrity.files !== 'object' || Array.isArray(integrity.files) ||
      !Object.hasOwn(integrity.files, 'SKILL.md')) {
    error(`${label}: upstream source requires sha256 contentIntegrity including SKILL.md`);
    return;
  }
  const expected = new Map(Object.entries(integrity.files));
  const executablePaths = Array.isArray(integrity.executablePaths) ? integrity.executablePaths : [];
  if (!Array.isArray(integrity.executablePaths)) {
    error(`${label}: upstream contentIntegrity requires executablePaths (empty if no executables)`);
  }
  const executables = new Set();
  for (const relative of executablePaths) {
    if (!safeRelative(relative) || !Object.hasOwn(integrity.files, relative) || executables.has(relative)) {
      error(`${label}: invalid or duplicate executablePaths entry ${JSON.stringify(relative)}`);
      continue;
    }
    executables.add(relative);
  }
  if (!isDeepStrictEqual(executablePaths, [...executablePaths].sort())) {
    error(`${label}: executablePaths must be sorted`);
  }
  if (!Array.isArray(source.licenseFiles)) {
    error(`${label}: upstream source requires a licenseFiles array (empty if no inherited notices)`);
  }
  for (const notice of Array.isArray(source.licenseFiles) ? source.licenseFiles : []) {
    if (!notice || typeof notice !== 'object' || !safeRelative(notice.sourcePath) || !safeRelative(notice.localPath) ||
        !notice.localPath.startsWith('upstream-licenses/')) {
      error(`${label}: invalid inherited license path`);
      continue;
    }
    if (expected.has(notice.localPath)) {
      error(`${label}: duplicate integrity path ${notice.localPath}`);
    }
    expected.set(notice.localPath, notice.sha256);
  }
  for (const [relative, digest] of expected) {
    if (!safeRelative(relative) || relative === 'SOURCE.json') {
      error(`${label}: invalid integrity path ${JSON.stringify(relative)}`);
      continue;
    }
    if (typeof digest !== 'string' || !/^[a-f0-9]{64}$/.test(digest)) {
      error(`${label}: invalid sha256 for ${relative}`);
      continue;
    }
    const full = path.join(dir, relative);
    if (!isContainedRegularFile(full)) {
      error(`${label}: missing or non-regular upstream file ${relative} (symlink components are forbidden)`);
      continue;
    }
    const actual = crypto.createHash('sha256').update(fs.readFileSync(full)).digest('hex');
    if (actual !== digest) error(`${label}: upstream content hash mismatch for ${relative}`);
    const executable = (fs.statSync(full).mode & 0o111) !== 0;
    if (executable !== executables.has(relative)) {
      error(`${label}: upstream executable mode mismatch for ${relative}`);
    }
  }
  for (const file of walk(dir)) {
    const relative = path.relative(dir, file).split(path.sep).join('/');
    if (relative !== 'SOURCE.json' && !expected.has(relative)) {
      error(`${label}: unrecorded upstream file ${relative}`);
    }
  }
}

function frontmatterOf(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const raw = text.slice(3, end);
  const data = {};
  const lines = raw.split('\n');
  for (let i = 0; i < lines.length; i += 1) {
    const match = /^([A-Za-z0-9_-]+):\s*(.*)$/.exec(lines[i]);
    if (!match) continue;
    const [, key, rawValue] = match;
    let value = rawValue.trim();
    if (value === '' || [ '>', '>-', '|', '|-' ].includes(value)) {
      const block = [];
      let j = i + 1;
      while (j < lines.length && (/^\s/.test(lines[j]) || lines[j].trim() === '')) {
        block.push(lines[j].trim());
        j += 1;
      }
      value = block.filter(Boolean).join(' ').trim();
      i = j - 1;
    }
    data[key] = value.replace(/^["']|["']$/g, '');
  }
  return data;
}

const skillsRegistry = readJson(path.join(repoRoot, 'registry', 'skills.json'));
const domainsRegistry = readJson(path.join(repoRoot, 'registry', 'domains.json'));
const resourcesRegistry = readJson(path.join(repoRoot, 'registry', 'resources.json'));
const importManifest = readJson(path.join(repoRoot, 'scripts', 'import-manifest.json'));
const upstreamImports = new Map();
for (const repository of (importManifest && importManifest.upstream) || []) {
  for (const entry of repository.skills || []) {
    if (upstreamImports.has(entry.dest)) error(`duplicate upstream import destination: ${entry.dest}`);
    upstreamImports.set(entry.dest, { repository, entry });
  }
}

if (skillsRegistry && domainsRegistry && resourcesRegistry) {
  const skills = skillsRegistry.skills || [];
  const domains = domainsRegistry.domains || [];
  const resources = resourcesRegistry.resources || [];

  try {
    require('../lib/task-router').createRouter(skills, resources);
  } catch (err) {
    error(err.message);
  }

  // --- Top-level counts ---------------------------------------------------
  if (skillsRegistry.count !== skills.length) {
    error(`skills.json count ${skillsRegistry.count} != ${skills.length} entries`);
  }
  if (skillsRegistry.featuredCount !== skills.filter((s) => s.featured).length) {
    error('skills.json featuredCount does not match featured entries');
  }
  if (domainsRegistry.count !== domains.length) {
    error(`domains.json count ${domainsRegistry.count} != ${domains.length} entries`);
  }
  if (resourcesRegistry.count !== resources.length) {
    error(`resources.json count ${resourcesRegistry.count} != ${resources.length} entries`);
  }

  const domainIds = new Set(domains.map((d) => d.id));
  const skillIds = new Set();
  const displayNames = new Map();
  const frontmatterNames = new Map();
  const counts = Object.fromEntries(domains.map((d) => [d.id, 0]));

  // --- Skills -------------------------------------------------------------
  for (const skill of skills) {
    const label = skill.id || '(missing id)';

    if (!skill.id) error('skill entry without id');
    if (skillIds.has(skill.id)) error(`duplicate skill id: ${skill.id}`);
    skillIds.add(skill.id);

    if (!skill.domain || !domainIds.has(skill.domain)) {
      error(`${label}: unknown domain ${JSON.stringify(skill.domain)}`);
    } else {
      counts[skill.domain] += 1;
    }

    if (!skill.path) {
      error(`${label}: missing path`);
      continue;
    }

    if (!safeRelative(skill.path) || skill.path !== `skills/${skill.id}`) {
      error(`${label}: invalid skill path ${JSON.stringify(skill.path)}`);
      continue;
    }
    const dir = path.join(repoRoot, skill.path);
    if (!fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) {
      error(`${label}: missing directory ${skill.path}`);
      continue;
    }

    if (skill.id !== `${skill.domain}/${path.basename(dir)}`) {
      error(`${label}: id does not match folder ${path.relative(repoRoot, dir)}`);
    }

    const skillFile = path.join(dir, 'SKILL.md');
    if (!fs.existsSync(skillFile)) {
      error(`${label}: missing SKILL.md`);
      continue;
    }

    const fm = frontmatterOf(skillFile);
    if (!fm) {
      if (skill.frontmatter) {
        error(`${label}: registry says frontmatter:true but SKILL.md has none`);
      } else {
        warn('frontmatter-missing', `${label}: SKILL.md has no YAML frontmatter (listed with derived description)`);
      }
    } else {
      if (!skill.frontmatter) {
        error(`${label}: frontmatter exists but registry records frontmatter:false`);
      }
      if (fm.name && fm.name !== skill.name) {
        error(`${label}: registry name ${skill.name} != frontmatter name ${fm.name}`);
      }
      if (!fm.name) warn('frontmatter-no-name', `${label}: frontmatter has no name`);
    }

    if (!skill.description || !skill.description.trim()) {
      error(`${label}: empty description`);
    }
    if (!Array.isArray(skill.capabilities)) {
      error(
        `${label}: capabilities must be an array, got ${skill.capabilities === null ? 'null' : typeof skill.capabilities}`
      );
    }
    if (!skill.descriptionSource) {
      warn('description-source-missing', `${label}: missing descriptionSource`);
    }
    if (!skill.license) {
      error(`${label}: empty license`);
    }
    if (['unverified', 'unlicensed', 'unknown'].includes(skill.license)) {
      warn('license-unverified', `${label}: license ${skill.license}${skill.licenseDetail ? ` (${skill.licenseDetail})` : ''}`);
    }

    const sourceFile = path.join(dir, 'SOURCE.json');
    if (!fs.existsSync(sourceFile)) {
      error(`${label}: missing SOURCE.json`);
    } else {
      const source = readJson(sourceFile);
      if (source) {
        if (source.id !== skill.id) {
          error(`${label}: SOURCE.json id ${source.id} != ${skill.id}`);
        }
        if (!source.licenseStatus) warn('source-license-status-missing', `${label}: SOURCE.json missing licenseStatus`);
        if (!['upstream', 'local-original', 'local-agent-skills', 'source-page-extraction'].includes(source.origin)) {
          error(`${label}: unknown SOURCE.json origin ${JSON.stringify(source.origin)}`);
        }
        if (source.name !== skill.name) error(`${label}: SOURCE.json name does not match skill name`);
        const clean = (text) => typeof text === 'string' ? text.replace(/\s+/g, ' ').trim() : '';
        if (clean(source.description) !== clean(skill.description)) {
          error(`${label}: SOURCE.json description does not match SKILL.md description`);
        }
        if (source.origin !== skill.origin || !isDeepStrictEqual(source.upstream || null, skill.upstream || null)) {
          error(`${label}: registry provenance differs from SOURCE.json`);
        }
        const sourceDescription =
          typeof source.description === 'string' ? source.description.trim() : '';
        if (sourceDescription.length < 10 || ['>', '>-', '|', '|-'].includes(sourceDescription)) {
          error(
            `${label}: SOURCE.json description is empty, a YAML placeholder, or shorter than 10 characters`
          );
        }
        if (source.origin === 'upstream') {
          const upstream = source.upstream || {};
          if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(upstream.repo || '') ||
              !/^[a-f0-9]{40}$/.test(upstream.commit || '') ||
              !safeRelative(upstream.path) || upstream.path === 'unverified' ||
              upstream.url !== `https://github.com/${upstream.repo}`) {
            error(`${label}: upstream source requires a valid repo, URL, safe path and full 40-character commit SHA`);
          }
          const pinned = upstreamImports.get(skill.id);
          if (!pinned) {
            error(`${label}: upstream source is missing from import-manifest.json`);
          } else {
            const { repository, entry } = pinned;
            if (upstream.repo !== repository.repo || upstream.path !== entry.path ||
                upstream.commit !== repository.commit || upstream.ref !== repository.commit ||
                source.license !== (entry.license || repository.license)) {
              error(`${label}: SOURCE.json does not match pinned import manifest repo/path/commit/ref/license`);
            }
          }
          checkIntegrity(dir, source, label);
        }
      }
    }

    const onDisk = walk(dir).length;
    if (skill.files !== onDisk) {
      error(`${label}: registry files ${skill.files} != ${onDisk} on disk`);
    }

    if (skill.displayName) {
      if (displayNames.has(skill.displayName)) {
        error(`duplicate displayName: ${skill.displayName}`);
      }
      displayNames.set(skill.displayName, skill.id);
    } else {
      error(`${label}: missing displayName`);
    }

    const key = skill.name || '';
    if (!frontmatterNames.has(key)) frontmatterNames.set(key, []);
    frontmatterNames.get(key).push(skill);
  }

  for (const [name, group] of frontmatterNames) {
    if (group.length > 1) {
      const labels = new Set(group.map((s) => s.displayName));
      if (labels.size !== group.length) {
        error(`skills share name ${name} and are not disambiguated: ${group.map((s) => s.id).join(', ')}`);
      } else {
        warn('duplicate-name', `duplicate frontmatter name ${name} disambiguated by displayName: ${group.map((s) => s.id).join(', ')}`);
      }
    }
  }
  for (const id of upstreamImports.keys()) {
    const registered = skills.find((skill) => skill.id === id);
    if (!registered || registered.origin !== 'upstream') {
      error(`${id}: pinned import is missing from the registry or has a different origin`);
    }
  }

  if (skills.some((s) => !s.featured) && skillsRegistry.featuredCount === 0) {
    warn('no-featured', 'no featured skills');
  }

  // Every directory on disk must be accounted for, not just the registered ones.
  const skillsRoot = path.join(repoRoot, 'skills');
  if (!fs.existsSync(skillsRoot)) {
    error('skills/ directory is missing');
  } else {
    for (const entry of fs.readdirSync(skillsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      if (!domainIds.has(entry.name)) {
        error(`unregistered domain directory skills/${entry.name}`);
        continue;
      }
      const domainDir = path.join(skillsRoot, entry.name);
      for (const skillEntry of fs.readdirSync(domainDir, { withFileTypes: true })) {
        if (!skillEntry.isDirectory()) continue;
        const id = `${entry.name}/${skillEntry.name}`;
        if (!skillIds.has(id)) error(`unregistered skill directory skills/${id}`);
        if (!fs.existsSync(path.join(domainDir, skillEntry.name, 'SKILL.md'))) {
          error(`skills/${id}: directory has no SKILL.md`);
        }
      }
    }
  }

  // --- Domains ------------------------------------------------------------
  const domainSkillCounts = {};
  for (const skill of skills) {
    domainSkillCounts[skill.domain] = (domainSkillCounts[skill.domain] || 0) + 1;
  }
  for (const domain of domains) {
    if (domain.skillCount !== (domainSkillCounts[domain.id] || 0)) {
      error(`${domain.id}: domain skillCount ${domain.skillCount} != ${domainSkillCounts[domain.id] || 0}`);
    }
    const dir = path.join(repoRoot, domain.path || '');
    if (!fs.existsSync(dir)) {
      error(`${domain.id}: missing domain directory ${domain.path}`);
    }
    for (const flagship of domain.flagshipSkills || []) {
      const id = `${domain.id}/${flagship}`;
      if (!skillIds.has(id)) {
        error(`${domain.id}: flagship ${flagship} is not a registered skill`);
      }
    }
    if ((domain.flagshipSkills || []).length === 0) {
      warn('no-flagship', `${domain.id}: no flagship skills`);
    }
  }

  // --- Resources ----------------------------------------------------------
  const categoryIds = new Set((resourcesRegistry.categories || []).map((c) => c.id));
  if (categoryIds.size !== (resourcesRegistry.categories || []).length) {
    error('duplicate resource category id');
  }
  const resourceIds = new Set();
  const categoryCounts = {};
  for (const resource of resources) {
    const label = resource.id || '(missing id)';
    if (!resource.id) error('resource without id');
    if (resourceIds.has(resource.id)) error(`duplicate resource id: ${resource.id}`);
    resourceIds.add(resource.id);
    if (!resource.name) error(`${label}: missing name`);
    if (!resource.description) warn('resource-description-missing', `${label}: missing description`);
    if (!resource.category) {
      error(`${label}: missing category`);
    } else {
      if (!categoryIds.has(resource.category)) {
        error(`${label}: category ${resource.category} is not declared`);
      }
      categoryCounts[resource.category] = (categoryCounts[resource.category] || 0) + 1;
    }
    if (!resource.url) {
      error(`${label}: missing url`);
    } else {
      let parsed;
      try {
        parsed = new URL(resource.url);
      } catch {
        error(`${label}: invalid url ${resource.url}`);
      }
      if (parsed && parsed.protocol !== 'https:') {
        error(`${label}: url is not https (${resource.url})`);
      }
    }
    if (!resource.type) warn('resource-type-missing', `${label}: missing type`);
    if (!resource.license) warn('resource-license-missing', `${label}: missing license`);
  }

  for (const category of resourcesRegistry.categories || []) {
    const declared = category.count;
    const actual = categoryCounts[category.id] || 0;
    if (declared !== actual) {
      error(`resource category ${category.id}: count ${declared} != ${actual}`);
    }
    if (!fs.existsSync(path.join(repoRoot, category.path))) {
      error(`resource category ${category.id}: missing file ${category.path}`);
    }
  }
}

// Derive the complete expected registries with the same pure builder used for
// generation. This catches changes to descriptions, licenses, capabilities,
// source provenance, resource values, and newly added resource source files.
// --check never writes; validation cannot silently repair the drift it checks.
const generatedCheck = spawnSync('python3', [path.join(repoRoot, 'scripts', 'build-registry.py'), '--check'], {
  encoding: 'utf8',
});
if (generatedCheck.error || generatedCheck.status !== 0) {
  error(`source/registry consistency check failed: ${generatedCheck.error ? generatedCheck.error.message :
    (generatedCheck.stdout + generatedCheck.stderr).trim()}`);
}

// --- Report ---------------------------------------------------------------
const skillCount = skillsRegistry ? (skillsRegistry.skills || []).length : 0;
const resourceCount = resourcesRegistry ? (resourcesRegistry.resources || []).length : 0;
const verbose = process.argv.includes('--verbose');

const WARNING_LABELS = {
  'frontmatter-missing': 'SKILL.md without YAML frontmatter (description derived from the body)',
  'frontmatter-no-name': 'frontmatter without a name field',
  'description-source-missing': 'registry entry without descriptionSource',
  'license-unverified': 'skills whose license is unverified, unlicensed, or unknown',
  'source-license-status-missing': 'SOURCE.json without licenseStatus',
  'duplicate-name': 'duplicate frontmatter names disambiguated by displayName',
  'no-featured': 'no featured skills',
  'no-flagship': 'domain without flagship skills',
  'resource-description-missing': 'resources without descriptions',
  'resource-type-missing': 'resources without a type',
  'resource-license-missing': 'resources without a license',
};

const grouped = new Map();
for (const { code, message } of warnings) {
  if (!grouped.has(code)) grouped.set(code, []);
  grouped.get(code).push(message);
}

for (const [code, messages] of grouped) {
  const label = WARNING_LABELS[code] || code;
  const suffix = code === 'license-unverified' ? ' (see THIRD_PARTY_NOTICES.md)' : '';
  console.log(`warning: ${messages.length} × ${label}${suffix}`);
  if (verbose) {
    for (const message of messages) console.log(`         ${message}`);
  }
}
for (const message of errors) console.log(`error:   ${message}`);

if (errors.length > 0) {
  console.log(`\nFAILED — ${errors.length} error(s), ${warnings.length} warning(s) across ${skillCount} skills and ${resourceCount} resources.`);
  process.exit(1);
}

console.log(`\nOK — ${skillCount} skills, ${resourceCount} resources, ${(domainsRegistry && domainsRegistry.domains || []).length} domains. ${warnings.length} warning(s).`);
if (warnings.length > 0 && !verbose) console.log('Run with --verbose to list every warning.');
