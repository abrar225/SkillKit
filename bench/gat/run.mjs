import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = fileURLToPath(new URL('../../',import.meta.url));
const dir = path.join(root,'bench/gat');
const read = file => fs.existsSync(path.join(dir,file)) ? JSON.parse(fs.readFileSync(path.join(dir,file))) : null;
const trial = [...(read('sessions.json') || []), ...(read('claude-sessions.json') || [])];
// Pre-registered Phase 0 qualification: verifiedInference sessions only (stale local Qwen2.5-1.5B runs excluded).
const qualified = trial.filter(t => t.realSession === true && t.verifiedInference === true);
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
const adoption=personas(withRule)>=5 && personas(withoutRule)>=5 && withRule.length>0 && activated(withRule)/withRule.length>=0.9;
const tokenMetric = t => t.tokensToWorkingKit ?? t.tokens;
const callMetric = t => t.callsToWorkingKit ?? t.calls;
const efficiency=rows=>({n:rows.length,tokens:median(rows.map(tokenMetric)),calls:median(rows.map(callMetric))});
const validLean=rows=>rows.filter(t=>t.completed && !t.error && t.workingKit && Number.isFinite(tokenMetric(t)) && Number.isFinite(callMetric(t)));
const s=efficiency(validLean(withRule)), m=efficiency(validLean(manual));
const zeroSessionWrites = qualified.length === 0 || qualified.every(t => !t.projectFilesChanged?.length);
const maxFirstBytes = routing?.maxFirstResponseBytes ?? routing?.maxBytes;
const result={gates:{
 zeroInstall:{pass:zero.status===0 && zeroSessionWrites,detail:zero.status===0 && zeroSessionWrites?'Real MCP/HTTP discovery and retrieval wrote zero files.':zero.stderr?.trim()||zero.error?.message||'Client or session wrote unexpected project files.'},
 handsOff:{pass:adoption,withSnippet:[activated(withRule),withRule.length],pointerOnly:[activated(withoutRule),withoutRule.length],attempts:trial.length,qualifiedAttempts:qualified.length,completed:qualified.filter(t=>t.completed && !t.error).length},
 rightKit:{pass:!!routing && routing.inScope>=60 && routing.outside>=15 && routing.usablePct>=70 && routing.wrongPct<=2 && routing.constraintPct>=95 && routing.fallbackPct>=90 && routing.outsidePct===100,selectionMode:'server-only',routing,userBriefs,scoreError},
 lean:{pass:!!routing && maxFirstBytes<=2048 && personas(validLean(withRule))>=5 && personas(validLean(manual))>=5 && s.tokens<m.tokens && s.calls<m.calls,maxBytes:maxFirstBytes,withKit:s,manual:m},
 betterWork:{pass:!!qok,evidence:quality}},
};
console.log(JSON.stringify(result,null,2));process.exitCode=Object.values(result.gates).every(g=>g.pass)?0:1;
