'use strict';

const fs = require('node:fs');
const { assessContent, fingerprint, parseFrontmatter } = require('../lib/federation-refresh');
const { scanSkill } = require('../lib/federation');
const { extractTags } = require('../lib/atlas-taxonomy');

const input = JSON.parse(fs.readFileSync(0, 'utf8'));
const { body, slug } = input;
const fm = parseFrontmatter(body);
const title = input.title || fm.titleRaw || slug;
const description = input.description || fm.description || '';
const { quality, validity } = assessContent(body, slug);
const scan = scanSkill(body, false);
const tags = extractTags({ title, description, body, slug });

process.stdout.write(JSON.stringify({
  validity,
  quality,
  documentScan: scan,
  fingerprint: fingerprint(body),
  tags,
  scanScope: 'Pinned SKILL.md only. Supporting files and repository permissions are unreviewed.',
}));
