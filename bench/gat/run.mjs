import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../',import.meta.url));
const dir = path.join(root,'bench/gat');
const read = file => fs.existsSync(path.join(dir,file)) ? JSON.parse(fs.readFileSync(path.join(dir,file))) : null;
const trial = [...(read('sessions.json') || []), ...(read('claude-sessions.json') || [])];
const qualified = trial.filter(t => t.realSession && t.localInference);
const arms = arm => qualified.filter(t => t.arm === arm);
const activated = rows => rows.filter(t => t.completed && !t.error && t.calledSkillKit).length;
const personas = rows => new Set(rows.map(t=>t.persona)).size;
const median = xs => {const v=xs.slice().sort((a,b)=>a-b);return v.length?(v[Math.floor((v.length-1)/2)]+v[Math.floor(v.length/2)])/2:null;};
const zero = spawnSync(process.execPath,['scripts/check-delivery.js'],{cwd:root,encoding:'utf8',timeout:30000});
let routing = null, userBriefs = null, scoreError;
try {
  const {evaluateGat} = await import('./evaluate.mjs');
  ({routing,userBriefs} = await evaluateGat());
} catch (error) { scoreError=error.message; }
const withRule=arms('snippet'), withoutRule=arms('pointer'), manual=arms('manual');
const quality=read('quality-handoff.json');
const qok=quality && quality.qualifiedTasks>=30 && quality.minRunsPerArm>=3 && quality.blinded && quality.interval95 &&
  quality.wins>quality.losses && Object.values(quality.categories).every(c=>c.losses<=c.wins);
const adoption=personas(withRule)>=5 && personas(withoutRule)>=5 && activated(withRule)/withRule.length>=0.9;
const efficiency=rows=>({n:rows.length,tokens:median(rows.map(t=>t.tokens)),calls:median(rows.map(t=>t.calls))});
const validLean=rows=>rows.filter(t=>t.completed && !t.error && t.workingKit && Number.isFinite(t.tokens) && Number.isFinite(t.calls));
const s=efficiency(validLean(withRule)), m=efficiency(validLean(manual));
const result={gates:{
 zeroInstall:{pass:zero.status===0,detail:zero.status===0?'Real MCP/HTTP discovery and retrieval wrote zero files.':zero.stderr?.trim()||zero.error?.message||'Client check failed.'},
 handsOff:{pass:adoption,withSnippet:[activated(withRule),withRule.length],pointerOnly:[activated(withoutRule),withoutRule.length],attempts:trial.length,completed:qualified.filter(t=>t.completed && !t.error).length},
 rightKit:{pass:!!routing && routing.inScope>=60 && routing.outside>=15 && routing.usablePct>=70 && routing.wrongPct<=2 && routing.constraintPct>=95 && routing.fallbackPct>=90 && routing.outsidePct===100,routing,userBriefs,scoreError},
 lean:{pass:!!routing && routing.maxFirstResponseBytes<=2048 && personas(validLean(withRule))>=5 && personas(validLean(manual))>=5 && s.tokens<m.tokens && s.calls<m.calls,maxBytes:routing?.maxFirstResponseBytes,withKit:s,manual:m},
 betterWork:{pass:!!qok,evidence:quality}},
};
console.log(JSON.stringify(result,null,2));process.exitCode=Object.values(result.gates).every(g=>g.pass)?0:1;
