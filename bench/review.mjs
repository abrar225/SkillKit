import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 8*1024*1024 });
  if (result.error || result.status !== 0) throw new Error(result.error?.message || result.stderr || 'Benchmark failed.');
  return JSON.parse(result.stdout);
}
const routing = run(process.execPath, ['bench/run.mjs', '--compare', 'bench/baseline.json']);
const quality = run('python3', ['-B', 'bench/quality/results.py']);
const context = run(process.execPath, ['bench/project-context.mjs']);
const held = routing.groups.heldOut;
const checks = {
  heldOutWrongReady: held.confidentWrong.percent < 2,
  heldOutConstraints: held.constraintAdherence.percent >= 95,
  typicalFirstResponse: held.firstResponseBytes.p50 < 2048,
  permanentRegressions: routing.permanentRegressionChecks.every(r => r.regressionPass),
  majorityPairedWins: quality.wins > quality.tasks.length / 2,
};
console.log(JSON.stringify({ heldOut: held, all: routing.groups.all, permanentRegressions: routing.permanentRegressionChecks,
  pairedReplay: { wins: quality.wins, ties: quality.ties, losses: quality.losses },
  projectAware: context.usefulReference, checks }, null, 2));
if (process.argv.includes('--enforce') && Object.values(checks).some(pass => !pass)) process.exitCode = 1;
