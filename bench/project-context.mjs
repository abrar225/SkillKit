import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const cli = fileURLToPath(new URL('../bin/vibe-skills.js', import.meta.url));
const briefs = [
  'Implement a saved-items list with an empty state in the existing mobile app.',
  'Build an account preferences screen with loading and retry states in the existing mobile app.',
  'Create a notification settings flow in the existing mobile app.',
];

// Predetermined gold. A ready implementation stage needs the named specialist or
// official stack reference and must exclude competing specialists and references.
const fixtures = [
  {
    stack: 'Flutter', skill: 'mobile/flutter-architecture', resource: 'flutter',
    manifest: ['pubspec.yaml', 'name: sample\ndependencies:\n  flutter:\n    sdk: flutter\n'],
  },
  {
    stack: 'React Native', skill: 'mobile/react-native-skills', resource: 'react-native',
    manifest: ['package.json', '{"name":"sample","dependencies":{"react-native":"0.82.1","react":"19.1.1"}}\n'],
  },
  {
    stack: 'Swift', skill: 'mobile/write-swift',
    manifest: ['Package.swift', '// swift-tools-version: 6.0\nimport PackageDescription\nlet package = Package(name: "Sample")\n'],
  },
];

function run(brief, ...options) {
  return JSON.parse(execFileSync(process.execPath, [cli, 'use', brief, ...options], { encoding: 'utf8' }));
}

function assess(kit, fixture) {
  const implementation = kit.stages.find(({ id }) => id === 'mobile/implement');
  const skills = implementation?.skills ?? [];
  const resources = implementation?.resources ?? [];
  const incompatible = fixtures.some((other) => other !== fixture &&
    (skills.includes(other.skill) || resources.includes(other.resource)));
  const available = kit.status === 'ready' && Boolean(implementation) && !incompatible;
  const usefulSkill = available && skills.includes(fixture.skill);
  const usefulReference = available && (usefulSkill || resources.includes(fixture.resource));
  return { status: kit.status, skills, resources, usefulSkill, usefulReference };
}

function summarize(rows, metric) {
  const totals = { pairs: rows.length, withoutContext: 0, withContext: 0, wins: 0, ties: 0, losses: 0 };
  for (const { without, with: withContext } of rows) {
    totals.withoutContext += Number(without[metric]);
    totals.withContext += Number(withContext[metric]);
    const delta = Number(withContext[metric]) - Number(without[metric]);
    totals[delta > 0 ? 'wins' : delta < 0 ? 'losses' : 'ties'] += 1;
  }
  return totals;
}

const root = mkdtempSync(join(tmpdir(), 'skillkit-project-context-'));
try {
  const empty = mkdirSync(join(root, 'empty control'), { recursive: true });
  const projects = fixtures.map(({ manifest }, index) => {
    const directory = mkdirSync(join(root, `app ${index + 1}`), { recursive: true });
    writeFileSync(join(directory, manifest[0]), manifest[1]);
    return directory;
  });
  const rows = [];
  for (const brief of briefs) {
    const baseline = run(brief);
    assert.deepEqual(run(brief, '--project', empty), baseline, 'An empty project must leave the kit unchanged');
    for (const [index, fixture] of fixtures.entries()) {
      const context = run(brief, '--project', projects[index]);
      rows.push({ brief, stack: fixture.stack, without: assess(baseline, fixture), with: assess(context, fixture) });
    }
  }
  console.log(JSON.stringify({
    usefulSkill: summarize(rows, 'usefulSkill'),
    usefulReference: summarize(rows, 'usefulReference'),
    emptyControlMatches: briefs.length,
    rows,
  }, null, 2));
} finally {
  rmSync(root, { recursive: true, force: true });
}
