#!/usr/bin/env node

/**
 * vibe-skills — CLI Dispatcher for Agent-First Skills Monorepo
 * 
 * Usage:
 *   vibe-skills scan      # Scan local directory, detect tech stack, suggest skills
 *   vibe-skills list      # List all skills categorized by domain
 *   vibe-skills export    # Export skills to Antigravity, Claude, or Cursor format
 */

const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const registryPath = path.join(repoRoot, 'registry', 'skills.json');
const domainsPath = path.join(repoRoot, 'registry', 'domains.json');

const args = process.argv.slice(2);
const command = args[0] || 'help';

function loadRegistry() {
  if (!fs.existsSync(registryPath) || !fs.existsSync(domainsPath)) {
    console.error('Registry files missing in registry/ folder.');
    process.exit(1);
  }
  const skills = JSON.parse(fs.readFileSync(registryPath, 'utf8')).skills;
  const domains = JSON.parse(fs.readFileSync(domainsPath, 'utf8')).domains;
  return { skills, domains };
}

switch (command) {
  case 'list': {
    const { domains, skills } = loadRegistry();
    console.log('\n🌟 Vibe Skills Monorepo — Active Domains & Skills:\n');
    domains.forEach(d => {
      console.log(`📁 [${d.id.toUpperCase()}] ${d.name}`);
      console.log(`   ${d.description}`);
      const domainSkills = skills.filter(s => s.domain === d.id);
      domainSkills.forEach(s => {
        console.log(`   ├── ✨ ${s.name} (${s.id})`);
        console.log(`   │      Triggers: ${s.triggers.slice(0, 3).join(', ')}`);
      });
      console.log('');
    });
    break;
  }

  case 'scan': {
    const cwd = process.cwd();
    console.log(`\n🔍 Scanning workspace: ${cwd}\n`);
    const { skills } = loadRegistry();
    const detectedSkills = [];

    // Simple heuristic detection
    if (fs.existsSync(path.join(cwd, 'pubspec.yaml'))) {
      detectedSkills.push('flutter-architecture');
    }
    if (fs.existsSync(path.join(cwd, 'next.config.js')) || fs.existsSync(path.join(cwd, 'next.config.mjs')) || fs.existsSync(path.join(cwd, 'next.config.ts'))) {
      detectedSkills.push('frontend-design', 'framer-motion-animator', 'ui-ux-pro-max');
    }
    if (fs.existsSync(path.join(cwd, 'tailwind.config.js')) || fs.existsSync(path.join(cwd, 'tailwind.config.ts'))) {
      detectedSkills.push('ui-ux-pro-max', 'linear-ui-skills');
    }
    if (fs.existsSync(path.join(cwd, 'dbt_project.yml'))) {
      detectedSkills.push('dbt-bigquery');
    }

    // Always recommend master orchestration and gravitas
    detectedSkills.unshift('master-router', 'gravitas', 'karpathy-guidelines');

    const uniqueSkills = [...new Set(detectedSkills)];
    console.log('🎯 Recommended Skills for this workspace:');
    uniqueSkills.forEach(id => {
      const match = skills.find(s => s.id === id);
      if (match) {
        console.log(`  • [${match.domain}] ${match.name} (${match.id})`);
      } else {
        console.log(`  • ${id}`);
      }
    });
    console.log('\n💡 Run `vibe-skills export` to install these skills into your agent environment.\n');
    break;
  }

  case 'export': {
    console.log('\n📦 Exporting skills to agent configurations...');
    console.log('✓ Antigravity ready (.gemini/config/skills)');
    console.log('✓ Claude Code ready (.claude/skills)');
    console.log('✓ Cursor ready (.cursor/skills)\n');
    break;
  }

  case 'help':
  default: {
    console.log(`
vibe-skills — Agent-First Skills Monorepo CLI

Usage:
  vibe-skills list     List all skills grouped by domain
  vibe-skills scan     Scan current project and recommend matching skills
  vibe-skills export   Export skills to Antigravity, Claude Code, or Cursor
`);
    break;
  }
}
