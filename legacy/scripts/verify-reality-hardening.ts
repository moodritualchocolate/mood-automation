/**
 * scripts/verify-reality-hardening.ts
 *
 * Verifies the Reality Hardening audit:
 *   - the audit script runs without crashing
 *   - the machine-readable artifact is well-formed
 *   - the human-readable findings doc exists and includes Top 10
 *   - the platform freeze invariant holds: no new lib/* dirs were
 *     introduced by this directive
 *
 * Run: npx tsx scripts/verify-reality-hardening.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

const REPO = path.resolve(__dirname, '..');

async function main(): Promise<void> {
  console.log('REALITY HARDENING VERIFICATION\n');

  // 1 · audit runs cleanly
  let auditOk = true;
  let auditStdout = '';
  try {
    auditStdout = execSync('npx tsx scripts/audit-reality-hardening.ts',
      { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', cwd: REPO });
  } catch (e) {
    auditOk = false;
    const err = e as { stdout?: string; stderr?: string };
    auditStdout = (err.stdout ?? '') + '\n' + (err.stderr ?? '');
  }
  record('audit-runs', 'audit-reality-hardening script runs cleanly',
    auditOk, auditOk ? 'ok' : `output:\n${auditStdout.slice(0, 200)}`);

  // 2 · stdout reports the 5 phase headers + summary line
  const phaseHeaders = [
    /PHASE 1 · OPERATOR WALKTHROUGH AUDIT/,
    /PHASE 2 · TIME-TO-VALUE AUDIT/,
    /PHASE 3 · UI CONSISTENCY AUDIT/,
    /PHASE 4 · DATA CONSISTENCY AUDIT/,
    /PHASE 5 · TOP 10 PAIN POINTS/,
  ];
  const phasesPresent = phaseHeaders.every((re) => re.test(auditStdout));
  record('audit-phases', 'audit emits all 5 phase headers',
    phasesPresent, phasesPresent ? '5/5' : 'missing one or more');

  // 3 · top pain-points list is non-empty and capped at 10
  const top10Matches = auditStdout.match(/^\s+(\d+)\.\s+\[/gm) ?? [];
  record('audit-top10', 'audit emits 1..10 ranked pain points (fewer is better)',
    top10Matches.length >= 1 && top10Matches.length <= 10,
    `count=${top10Matches.length}`);

  // 4 · machine-readable artifact is well-formed
  let artifact: {
    walkthrough?: unknown[]; ttvRows?: unknown[];
    consistency?: unknown[]; data?: { orphans: number; duplicates: number; brokenRefs: number };
    findings?: unknown[]; top10?: unknown[];
  } | null = null;
  try {
    const raw = await fs.readFile(path.join(REPO, 'data', 'runtime', 'reality-hardening-audit.json'), 'utf8');
    artifact = JSON.parse(raw);
  } catch { /* artifact missing */ }
  // Walkthrough length depends on whether the friction-reduction surfaces
  // are present: 10 steps on the legacy path, 5 steps on the fast-start
  // path. Both are valid. Consistency axes remain at 7. ttvRows remain
  // at 4 milestones.
  const artifactOk = !!artifact &&
    Array.isArray(artifact.walkthrough) && artifact.walkthrough.length >= 5 &&
    Array.isArray(artifact.ttvRows) && artifact.ttvRows.length === 4 &&
    Array.isArray(artifact.consistency) && artifact.consistency.length === 7 &&
    !!artifact.data && Array.isArray(artifact.findings) &&
    Array.isArray(artifact.top10) && artifact.top10.length >= 1 && artifact.top10.length <= 10;
  record('artifact', 'data/runtime/reality-hardening-audit.json is well-formed',
    artifactOk,
    artifactOk ? `walkthrough=${artifact!.walkthrough!.length} ttvRows=${artifact!.ttvRows!.length} consistency=${artifact!.consistency!.length} findings=${artifact!.findings!.length} top10=${artifact!.top10!.length}` : 'missing or malformed');

  // 5 · findings doc exists + carries the friction-reduction success table
  let doc = '';
  try {
    doc = await fs.readFile(path.join(REPO, 'docs', 'reality-hardening-findings.md'), 'utf8');
  } catch { /* missing */ }
  const docOk = /No solutions/i.test(doc) &&
                /Success Conditions/i.test(doc) &&
                /Friction-Reduction Roadmap/i.test(doc);
  record('findings-doc',
    'docs/reality-hardening-findings.md exists + includes "No solutions" + Success Conditions + Friction-Reduction Roadmap',
    docOk, docOk ? 'ok' : 'missing or incomplete');

  // 6 · data consistency invariants: 0 duplicates, 0 broken refs
  const dataOk = !!artifact?.data && artifact.data.duplicates === 0 && artifact.data.brokenRefs === 0;
  record('data-consistency',
    'data consistency: 0 duplicates · 0 broken references',
    dataOk,
    artifact?.data ? `dup=${artifact.data.duplicates} broken=${artifact.data.brokenRefs}` : 'no data');

  // 6b · success conditions: TTV < 3 min · field count reduced ≥ 50 % from 45 baseline · 0 retypes
  type TTVRow = { label: string; estimatedMinutes: number; breakdown: string };
  type FlowRow = { step: string; requiredFields: number };
  const ttvTotal = (artifact?.ttvRows as TTVRow[] | undefined ?? [])
    .reduce((acc, r) => acc + r.estimatedMinutes, 0);
  const totalFields = (artifact?.walkthrough as FlowRow[] | undefined ?? [])
    .reduce((acc, f) => acc + f.requiredFields, 0);
  const rewriteFindingPresent = (artifact?.findings as Array<{ id: string }> | undefined ?? [])
    .some((f) => f.id === 'ttv-workflow-rewrite');
  const ttvOk    = ttvTotal < 3;
  const fieldsOk = totalFields <= Math.floor(45 * 0.5);
  const dupOk    = !rewriteFindingPresent;
  record('success-ttv',
    `success: TTV (org → first revenue) < 3 min · actual=${Math.round(ttvTotal * 10) / 10}`,
    ttvOk, `ttvTotal=${ttvTotal}`);
  record('success-fields',
    `success: fields typed reduced by ≥ 50 % from 45 baseline · actual=${totalFields}`,
    fieldsOk, `fields=${totalFields} threshold=${Math.floor(45 * 0.5)}`);
  record('success-no-duplicate-context',
    'success: duplicate context entry finding (ttv-workflow-rewrite) absent',
    dupOk, dupOk ? 'absent' : 'still present');

  // 7 · platform freeze invariant: no new lib/* directories beyond the
  //     known set of seven (tenancy · productization · business ·
  //     workflows · adapters · agents · banner · providers).
  const libEnts = await fs.readdir(path.join(REPO, 'lib'), { withFileTypes: true });
  const knownLibDirs = new Set([
    'tenancy', 'productization', 'business', 'workflows',
    'adapters', 'agents', 'banner', 'providers', 'auth',
  ]);
  const extras = libEnts
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((n) => !knownLibDirs.has(n));
  record('platform-freeze',
    'no new top-level lib/ directories introduced by this audit',
    extras.length === 0,
    extras.length === 0 ? 'frozen' : `extra: ${extras.join(',')}`);

  // 8 · top-10 ranking is deterministic (re-run produces same first item)
  let secondRun = '';
  try {
    secondRun = execSync('npx tsx scripts/audit-reality-hardening.ts',
      { stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', cwd: REPO });
  } catch (e) {
    const err = e as { stdout?: string };
    secondRun = err.stdout ?? '';
  }
  const firstItemA = auditStdout.match(/^\s+1\.\s+\[\w+\]\s+(\S+)/m)?.[1] ?? '';
  const firstItemB = secondRun.match(/^\s+1\.\s+\[\w+\]\s+(\S+)/m)?.[1] ?? '';
  record('audit-deterministic',
    'audit top-10 first item is deterministic across runs',
    firstItemA.length > 0 && firstItemA === firstItemB,
    `${firstItemA} == ${firstItemB}`);

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error('verification crashed:', err); process.exit(2); });
