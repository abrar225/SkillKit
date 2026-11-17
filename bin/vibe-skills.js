#!/usr/bin/env node

/**
 * vibe-skills — browse, search, validate, and export the skills in this repo.
 *
 * Everything is driven by registry/*.json, which is generated from disk by
 * scripts/build-registry.py and checked by scripts/validate-registry.js.
 *
 * Usage:
 *   vibe-skills list [domain] [--featured] [--json]
 *   vibe-skills search <query> [--json]
 *   vibe-skills info <domain/skill>
 *   vibe-skills domains [--json]
 *   vibe-skills resources [category] [query]
 *   vibe-skills scan [directory]
 *   vibe-skills validate [--verbose]
 *   vibe-skills export --target <claude|cursor|antigravity|agents> [--ids a,b] [--out dir] [--force]
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createHash } = require('crypto');

const repoRoot = path.resolve(__dirname, '..');
const registryDir = path.join(repoRoot, 'registry');

function fail(message) {
  console.error(`error: ${message}`);
  process.exit(1);
}

function load(name) {
  const file = path.join(registryDir, `${name}.json`);
  if (!fs.existsSync(file)) {
    fail(`registry/${name}.json is missing. Run: python3 scripts/build-registry.py`);
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

const skillsFile = load('skills');
const domainsFile = load('domains');
const resourcesFile = load('resources');

const skills = skillsFile.skills;
const domains = domainsFile.domains;
const resources = resourcesFile.resources;

// --- Argument parsing ------------------------------------------------------
const argv = process.argv.slice(2);
const first = argv[0];
if (first === '--help' || first === '-h') argv.shift();
const command = argv.shift() || 'help';
const positional = [];
const flags = {};

function flagValue(index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) fail(`${flag} requires a value`);
  return value;
}

for (let i = 0; i < argv.length; i += 1) {
  const arg = argv[i];
  if (arg === '--json') flags.json = true;
  else if (arg === '--featured') flags.featured = true;
  else if (arg === '--force') flags.force = true;
  else if (arg === '--verbose') flags.verbose = true;
  else if (arg === '--target') { flags.target = flagValue(i, arg); i += 1; }
  else if (arg === '--ids') { flags.ids = flagValue(i, arg); i += 1; }
  else if (arg === '--out') {
    flags.out = flagValue(i, arg);
    if (!flags.out.trim()) fail('--out requires a non-empty directory');
    i += 1;
  }
  else if (arg.startsWith('--')) fail(`unknown flag ${arg}`);
  else positional.push(arg);
}

const pad = (text, width) => String(text).padEnd(width);
const truncate = (text, width) => {
  const clean = String(text || '').replace(/\s+/g, ' ').trim();
  return clean.length > width ? `${clean.slice(0, width - 1)}…` : clean;
};
const bold = (text) => `\u001b[1m${text}\u001b[0m`;
const dim = (text) => `\u001b[2m${text}\u001b[0m`;

function skillLine(skill) {
  const flag = skill.featured ? '★' : ' ';
  return `${flag} ${pad(skill.id, 46)} ${truncate(skill.description, 60)}`;
}

function findSkill(query) {
  const exact = skills.find((s) => s.id === query);
  if (exact) return exact;
  const byName = skills.filter((s) => s.name === query || s.displayName === query);
  if (byName.length === 1) return byName[0];
  const matches = skills.filter(
    (s) => s.id.includes(query) || s.name.includes(query)
  );
  if (matches.length === 1) return matches[0];
  if (matches.length > 1) {
    fail(`"${query}" is ambiguous:\n${matches.map((s) => `  ${s.id}`).join('\n')}`);
  }
  return null;
}

// Include names, types, modes, and bytes so an extra or altered file cannot be
// mistaken for the version in this catalog. Never follow destination symlinks.
function treeDigest(directory) {
  const hash = createHash('sha256');
  function visit(file, relative) {
    const stat = fs.lstatSync(file);
    const type = stat.isDirectory() ? 'directory' : stat.isFile() ? 'file' : stat.isSymbolicLink() ? 'symlink' : null;
    if (!type) throw new Error(`unsupported file type: ${file}`);
    hash.update(JSON.stringify([relative, type, stat.mode & 0o777]));
    if (type === 'directory') {
      for (const name of fs.readdirSync(file).sort()) visit(path.join(file, name), `${relative}/${name}`);
    } else if (type === 'file') {
      const bytes = fs.readFileSync(file);
      hash.update(String(bytes.length) + ':');
      hash.update(bytes);
    } else hash.update(JSON.stringify(fs.readlinkSync(file)));
  }
  visit(directory, '');
  return hash.digest('hex');
}

function isWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === '' || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative));
}

function sameTree(source, destination) {
  try {
    const stat = fs.lstatSync(destination);
    return stat.isDirectory() && !stat.isSymbolicLink() && treeDigest(source) === treeDigest(destination);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

switch (command) {
  case 'list': {
    const domainFilter = positional[0];
    if (domainFilter && !domains.some((d) => d.id === domainFilter)) {
      fail(`unknown domain "${domainFilter}". Try: vibe-skills domains`);
    }
    const selected = skills.filter(
      (s) => (!domainFilter || s.domain === domainFilter) && (!flags.featured || s.featured)
    );
    if (flags.json) {
      console.log(JSON.stringify(selected, null, 2));
      break;
    }
    console.log(
      `\n${bold(`Skills${domainFilter ? ` — ${domainFilter}` : ''}`)} ${dim(`(${selected.length}${flags.featured ? ' featured' : ''})`)}\n`
    );
    for (const domain of domains) {
      if (domainFilter && domain.id !== domainFilter) continue;
      const group = selected.filter((s) => s.domain === domain.id);
      if (group.length === 0) continue;
      console.log(`${bold(domain.name)} ${dim(`[${domain.id}] · ${group.length}`)}`);
      for (const skill of group) console.log(`  ${skillLine(skill)}`);
      console.log('');
    }
    console.log(dim('★ featured · vibe-skills info <domain/skill> for details'));
    break;
  }

  case 'search': {
    const query = positional.join(' ').toLowerCase();
    if (!query) fail('usage: vibe-skills search <query>');
    const matches = skills.filter((s) =>
      [s.id, s.name, s.displayName, s.description, ...(s.capabilities || [])]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
    const resourceMatches = resources.filter((r) =>
      [r.id, r.name, r.description, r.type, ...(r.tags || [])]
        .join(' ')
        .toLowerCase()
        .includes(query)
    );
    if (flags.json) {
      console.log(JSON.stringify({ query, skills: matches, resources: resourceMatches }, null, 2));
      break;
    }
    console.log(`\n${bold('Skills')} matching "${query}" — ${matches.length}\n`);
    for (const skill of matches) {
      console.log(`  ${skillLine(skill)}`);
      console.log(`    ${dim(skill.path)}`);
    }
    if (resourceMatches.length > 0) {
      console.log(`\n${bold('Resources')} matching "${query}" — ${resourceMatches.length}\n`);
      for (const resource of resourceMatches) {
        console.log(`  ${pad(resource.name, 38)} ${truncate(resource.description, 60)}`);
        console.log(`    ${dim(resource.url)}`);
      }
    }
    if (matches.length + resourceMatches.length === 0) console.log(dim('  no matches'));
    console.log('');
    break;
  }

  case 'info': {
    const query = positional[0];
    if (!query) fail('usage: vibe-skills info <domain/skill>');
    const skill = findSkill(query);
    if (!skill) fail(`no skill matches "${query}"`);
    if (flags.json) {
      console.log(JSON.stringify(skill, null, 2));
      break;
    }
    console.log(`\n${bold(skill.displayName || skill.name)} ${dim(`(${skill.id})`)}\n`);
    console.log(skill.description);
    console.log('');
    console.log(`${pad('domain', 14)} ${skill.domain}`);
    console.log(`${pad('path', 14)} ${skill.path}`);
    console.log(`${pad('license', 14)} ${skill.license}${skill.licenseDetail ? dim(` (${skill.licenseDetail})`) : ''}`);
    console.log(`${pad('origin', 14)} ${skill.origin}`);
    if (skill.upstream) {
      console.log(`${pad('upstream', 14)} ${skill.upstream.repo} @ ${skill.upstream.commit.slice(0, 12)}`);
      console.log(`${pad('source path', 14)} ${skill.upstream.path}`);
    }
    if (skill.capabilities && skill.capabilities.length > 0) {
      console.log(`${pad('contents', 14)} ${skill.capabilities.join(', ')}`);
    }
    console.log(`${pad('files', 14)} ${skill.files}`);
    if (skill.featured) console.log(`${pad('featured', 14)} yes`);
    console.log(`\n${dim(`Read: ${path.join(repoRoot, skill.path, 'SKILL.md')}`)}\n`);
    break;
  }

  case 'domains': {
    if (flags.json) {
      console.log(JSON.stringify(domains, null, 2));
      break;
    }
    console.log(`\n${bold('Domains')} ${dim(`(${domains.length})`)}\n`);
    const width = Math.max(...domains.map((d) => d.name.length));
    for (const domain of domains) {
      console.log(`${pad(domain.name, width)}  ${pad(domain.skillCount, 4)}  ${dim(domain.id)}`);
      console.log(`${pad('', width)}        ${truncate(domain.description, 90)}`);
    }
    console.log('');
    break;
  }

  case 'resources': {
    const category = positional[0];
    const query = positional.slice(1).join(' ').toLowerCase();
    if (category && !resources.some((r) => r.category === category)) {
      fail(`unknown resource category "${category}". Categories: ${resourcesFile.categories.map((c) => c.id).join(', ')}`);
    }
    const selected = resources.filter(
      (r) =>
        (!category || r.category === category) &&
        (!query || [r.id, r.name, r.description, ...(r.tags || [])].join(' ').toLowerCase().includes(query))
    );
    if (flags.json) {
      console.log(JSON.stringify(selected, null, 2));
      break;
    }
    console.log(`\n${bold('Resources')}${category ? ` — ${category}` : ''} ${dim(`(${selected.length})`)}\n`);
    for (const resource of selected) {
      console.log(`${pad(resource.name, 40)} ${dim(resource.pricing || '')} ${resource.license ? `· ${resource.license}` : ''}`);
      console.log(`  ${truncate(resource.description, 100)}`);
      console.log(`  ${dim(resource.url)}`);
    }
    console.log('');
    break;
  }

  case 'scan': {
    const target = path.resolve(positional[0] || process.cwd());
    if (!fs.existsSync(target)) fail(`directory does not exist: ${target}`);
    const has = (...names) => names.some((name) => fs.existsSync(path.join(target, name)));
    const readPackage = () => {
      const file = path.join(target, 'package.json');
      if (!fs.existsSync(file)) return {};
      try {
        return JSON.parse(fs.readFileSync(file, 'utf8'));
      } catch {
        return {};
      }
    };
    const pkg = readPackage();
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const recommended = new Set();

    recommended.add('orchestrator/gravitas');
    recommended.add('orchestrator/master-router');
    recommended.add('engineering-ops/karpathy-guidelines');
    recommended.add('orchestrator/find-skills');

    if (has('pubspec.yaml')) recommended.add('mobile/flutter-architecture');
    if (deps['react-native'] || deps.expo || has('app.json', 'app.config.js', 'app.config.ts')) {
      recommended.add('mobile/react-native-skills');
    }
    if (has('next.config.js', 'next.config.mjs', 'next.config.ts')) {
      recommended.add('frontend/frontend-design');
      recommended.add('ui-ux/ui-ux-pro-max');
      recommended.add('ui-ux/framer-motion-animator');
      recommended.add('frontend/vercel-react-best-practices');
    }
    if (deps.react || deps.next) recommended.add('frontend/web-design-guidelines');
    if (deps.tailwindcss || has('tailwind.config.js', 'tailwind.config.ts')) {
      recommended.add('ui-ux/refactoring-ui');
      recommended.add('ui-ux/baseline-ui');
    }
    if (has('prisma/schema.prisma', 'schema.prisma')) {
      recommended.add('backend-api/prisma-orm-setup');
      recommended.add('backend-api/prisma-client-api');
    }
    if (has('supabase', 'supabase/config.toml')) recommended.add('backend-api/supabase');
    if (has('dbt_project.yml')) {
      recommended.add('backend-api/dbt-analytics-engineering');
      recommended.add('backend-api/dbt-unit-testing');
    }
    if (has('Dockerfile', 'docker-compose.yml')) recommended.add('engineering-ops/verification-before-completion');
    if (has('.github/workflows')) recommended.add('engineering-ops/shipping-and-launch');
    if (has('SKILL.md')) recommended.add('agent-tooling/skill-creator');
    if (has('.cursor', '.cursorrules')) recommended.add('agent-tooling/create-rule');

    const found = [];
    const missing = [];
    for (const id of recommended) {
      const skill = skills.find((s) => s.id === id);
      if (skill) found.push(skill);
      else missing.push(id);
    }

    if (flags.json) {
      console.log(JSON.stringify({ directory: target, recommended: found, missing }, null, 2));
      break;
    }
    console.log(`\n${bold('Workspace scan')} ${dim(target)}\n`);
    if (pkg.name) console.log(`${dim('package')} ${pkg.name}`);
    console.log('');
    for (const skill of found) console.log(`  ${skillLine(skill)}`);
    if (missing.length > 0) {
      console.log(`\n${dim(`not in this repo: ${missing.join(', ')}`)}`);
    }
    console.log(`\n${dim('Install the list with: vibe-skills export --target claude --ids ' + found.map((s) => s.id).join(','))}\n`);
    break;
  }

  case 'validate': {
    const result = spawnSync(
      process.execPath,
      [path.join(repoRoot, 'scripts', 'validate-registry.js'), ...(flags.verbose ? ['--verbose'] : [])],
      { stdio: 'inherit' }
    );
    process.exit(result.status === null ? 1 : result.status);
    break;
  }

  case 'export': {
    const targets = {
      claude: '.claude/skills',
      cursor: '.cursor/skills',
      antigravity: '.gemini/config/skills',
      agents: '.agents/skills',
    };
    const target = flags.target;
    if (!target || !targets[target]) {
      fail(`usage: vibe-skills export --target <${Object.keys(targets).join('|')}> [--ids a,b] [--out dir] [--force]`);
    }
    if (flags.ids !== undefined && !flags.ids.trim()) fail('--ids must contain at least one skill ID');
    const ids = flags.ids ? [...new Set(flags.ids.split(',').map((s) => s.trim()).filter(Boolean))] : null;
    if (ids && ids.length === 0) fail('--ids must contain at least one skill ID');
    const chosen = ids
      ? ids.map((id) => {
          const skill = findSkill(id);
          if (!skill) fail(`no skill matches "${id}"`);
          return skill;
        })
      : skills;
    const targetDir = targets[target];
    const outRoot = flags.out
      ? path.resolve(flags.out, targetDir)
      : path.resolve(process.cwd(), targetDir);

    // Validate every destination before touching any of them. --force only
    // replaces the selected skill directory, never an overlapping source tree.
    const names = new Set();
    const protectedSources = skills.map((skill) => fs.realpathSync(path.join(repoRoot, skill.path)));
    for (const skill of chosen) {
      const name = path.basename(skill.path);
      if (names.has(name)) fail(`export folder collision: ${name}`);
      names.add(name);
      const dest = path.join(outRoot, name);
      let existing = null;
      try { existing = fs.lstatSync(dest); } catch (error) { if (error.code !== 'ENOENT') throw error; }
      if (existing?.isSymbolicLink()) fail(`destination is a symlink: ${dest}`);
      // Resolve the nearest existing ancestor so a symlink in --out cannot hide overlap.
      let ancestor = dest;
      const suffix = [];
      while (!fs.existsSync(ancestor)) { suffix.unshift(path.basename(ancestor)); ancestor = path.dirname(ancestor); }
      const resolvedDest = path.resolve(fs.realpathSync(ancestor), ...suffix);
      if (protectedSources.some((source) => isWithin(source, resolvedDest) || isWithin(resolvedDest, source))) {
        fail(`source and destination overlap: ${dest}`);
      }
    }
    const manifestPath = path.join(outRoot, 'vibe-skills.export.json');
    let previous = { skills: [] };
    if (fs.existsSync(manifestPath)) {
      try {
        previous = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (previous.target !== target || !Array.isArray(previous.skills) || previous.skills.some((id) => typeof id !== 'string')) {
          fail(`invalid existing export manifest: ${manifestPath}`);
        }
      } catch (error) { fail(`cannot read existing export manifest: ${error.message}`); }
    }
    const written = [];
    const retained = [];
    const skipped = [];
    fs.mkdirSync(outRoot, { recursive: true });
    for (const skill of chosen) {
      const source = path.join(repoRoot, skill.path);
      // Flatten export: agents expect skills directly inside the target directory
      const dest = path.join(outRoot, path.basename(skill.path));
      if (fs.existsSync(dest) && !flags.force) {
        if (sameTree(source, dest)) retained.push(skill.id);
        else skipped.push({ id: skill.id, reason: 'Existing directory differs from the catalog; use --force to replace it.' });
        continue;
      }
      const staging = fs.mkdtempSync(path.join(outRoot, '.vibe-skills-stage-'));
      const stagedSkill = path.join(staging, 'skill');
      const backup = path.join(staging, 'previous');
      let preserveBackup = false;
      try {
        fs.cpSync(source, stagedSkill, { recursive: true, verbatimSymlinks: true });
        if (fs.existsSync(dest)) fs.renameSync(dest, backup);
        try { fs.renameSync(stagedSkill, dest); }
        catch (error) {
          if (fs.existsSync(backup)) {
            try { fs.renameSync(backup, dest); }
            catch (rollbackError) {
              preserveBackup = true;
              throw new Error(`Replacement failed (${error.message}); restore the previous directory from ${backup}: ${rollbackError.message}`);
            }
          }
          throw error;
        }
      } finally { if (!preserveBackup) fs.rmSync(staging, { recursive: true, force: true }); }
      written.push(skill.id);
    }
    const trackedIds = [...new Set([...previous.skills, ...chosen.map((skill) => skill.id)])];
    const verified = [];
    const unverified = [];
    for (const id of trackedIds) {
      const skill = skills.find((candidate) => candidate.id === id);
      if (skill && sameTree(path.join(repoRoot, skill.path), path.join(outRoot, path.basename(skill.path)))) verified.push(skill);
      else unverified.push({ id, reason: skill ? 'Missing or different from the current catalog.' : 'Not present in the current catalog.' });
    }
    const manifest = {
      schemaVersion: '2.0.0',
      exportedAt: new Date().toISOString(),
      target,
      registryGeneratedAt: skillsFile.generatedAt,
      requestedSkills: chosen.map((skill) => skill.id),
      skills: verified.map((skill) => skill.id),
      verified: verified.map((skill) => ({ id: skill.id, directory: path.basename(skill.path), sha256: treeDigest(path.join(repoRoot, skill.path)) })),
      written,
      retained,
      skipped,
      unverified,
    };
    const manifestTemp = path.join(outRoot, `.vibe-skills-manifest-${process.pid}.tmp`);
    fs.writeFileSync(manifestTemp, `${JSON.stringify(manifest, null, 2)}\n`);
    fs.renameSync(manifestTemp, manifestPath);
    if (flags.json) console.log(JSON.stringify(manifest, null, 2));
    else {
      console.log(`Exported ${written.length} skill(s) to ${outRoot} (${retained.length} existing verified, ${skipped.length} skipped unverified)`);
      console.log(`Manifest: ${manifestPath}`);
    }
    break;
  }

  case 'mcp': {
    const serverPath = path.join(__dirname, 'mcp-server.js');
    if (!fs.existsSync(serverPath)) fail('bin/mcp-server.js is missing');
    const child = spawnSync(process.execPath, [serverPath], { stdio: 'inherit' });
    process.exit(child.status === null ? 1 : child.status);
    break;
  }

  case 'stats': {
    const licenses = {};
    for (const skill of skills) licenses[skill.license] = (licenses[skill.license] || 0) + 1;
    console.log(`\n${bold('Library summary')}\n`);
    console.log(`  skills      ${skills.length} (${skills.filter((s) => s.featured).length} featured)`);
    console.log(`  domains     ${domains.length}`);
    console.log(`  resources   ${resources.length} in ${resourcesFile.categories.length} categories`);
    console.log(`  generated   ${skillsFile.generatedAt}\n`);
    console.log('  licenses');
    for (const [license, count] of Object.entries(licenses).sort((a, b) => b[1] - a[1])) {
      console.log(`    ${pad(license, 30)} ${count}`);
    }
    console.log('');
    break;
  }

  case 'help':
  default: {
    console.log(`
vibe-skills — ${skills.length} skills, ${resources.length} resources, ${domains.length} domains

Usage:
  vibe-skills list [domain] [--featured] [--json]   List skills
  vibe-skills search <query> [--json]               Search skills and resources
  vibe-skills info <domain/skill> [--json]          Show one skill
  vibe-skills domains [--json]                      List domains and counts
  vibe-skills resources [category] [query]          Browse the resource catalog
  vibe-skills scan [directory] [--json]             Recommend skills for a project
  vibe-skills validate [--verbose]                  Verify registries against disk
  vibe-skills mcp                                   Run the MCP server over stdio
  vibe-skills stats                                 Totals and license breakdown
  vibe-skills export --target <claude|cursor|antigravity|agents>
                      [--ids a,b] [--out dir] [--force]
                                                    Copy skills into an agent layout

Regenerate the registries after adding a skill or resource:
  python3 scripts/build-registry.py
`);
    break;
  }
}
