'use strict';

const fs = require('node:fs');
const { assessContent, fingerprint } = require('../lib/federation-refresh');
const { scanSkill } = require('../lib/federation');
const { body, slug } = JSON.parse(fs.readFileSync(0, 'utf8'));
const { quality, validity } = assessContent(body, slug);
const scan = scanSkill(body, false);
process.stdout.write(JSON.stringify({
  validity, quality, documentScan: scan, fingerprint: fingerprint(body),
  scanScope: 'Pinned SKILL.md only. Supporting files and repository permissions are unreviewed.'
}));
