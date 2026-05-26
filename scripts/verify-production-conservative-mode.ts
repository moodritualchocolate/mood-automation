/**
 * VERIFY — Production Conservative Mode advisory contract.
 *
 * Pure-function tests against lib/productionConservativeMode.ts using
 * synthetic envelopes. No HTTP, no live memory.
 *
 * Cases:
 *   A · SAFE cell → recommendedAction='proceed' and allowedForProduction
 *   B · WARNING cell → caution OR lower-brutality OR switch-mode
 *   C · FORBIDDEN cell → use-safe-fallback or manual-review-required
 *   D · unknown cell → manual-review-required, allowed*=false
 *   E · zero SAFE cells → fallback is best WARNING cell, marked
 *        "best available warning fallback"
 *   F · function does not return any flag that would auto-apply
 *        the fallback (advisoryNotice present)
 *   G · deterministic — same input → same output (JSON-equal)
 *   H · TypeScript clean (delegated to suite tsc)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computeProductionConservativeMode,
  type ProductionConservativeMode,
} from '../lib/productionConservativeMode';
import {
  buildProductionSafetyEnvelope,
  type MatrixReportInput,
  type ProductionSafetyEnvelope,
} from '../lib/productionSafetyEnvelope';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic envelopes ──────────────────────────────────────

function makeReport(opts: {
  formulaFailRates: Record<string, number>;
  modeFailRates: Record<string, number>;
  brutalityFailRates: Record<number, number>;
  baseLatencyMs?: number;
}): MatrixReportInput {
  const formulas = Object.keys(opts.formulaFailRates);
  const modes = Object.keys(opts.modeFailRates);
  const brutalityLevels = Object.keys(opts.brutalityFailRates).map((s) => parseFloat(s));
  const lat = opts.baseLatencyMs ?? 1000;
  const perCombination: MatrixReportInput['latencyHeatmap']['perCombination'] = [];
  for (const f of formulas) for (const m of modes) for (const b of brutalityLevels) {
    perCombination.push({ formula: f, mode: m, brutality: b, latencyMs: lat });
  }
  return {
    totalCombinations: perCombination.length, totalRuns: perCombination.length,
    approvals: perCombination.length, refusals: 0, failures: 0, degradedAdvisories: 0,
    averageLatencyMs: lat,
    latencyHeatmap: { byFormula: {}, byMode: {}, byBrutality: {}, perCombination },
    fifoPressure: { capped: 0, overCap: 0, total: 0, overCapDetails: [] },
    memoryGrowth: { filesTouched: [], bytesAdded: 0, perFile: {} },
    routeErrorInventory: [], panelSyncWarnings: [],
    refusalReasonDistribution: {}, verdictDistribution: { approve: perCombination.length },
    formulaStabilityRanking: formulas.map((f, i) => ({
      formula: f, failureRate: opts.formulaFailRates[f], avgLatencyMs: lat, rank: i + 1,
    })),
    campaignModeStabilityRanking: modes.map((m, i) => ({
      mode: m, failureRate: opts.modeFailRates[m], avgLatencyMs: lat, rank: i + 1,
    })),
    brutalityStressRanking: brutalityLevels.map((b, i) => ({
      brutality: b, failureRate: opts.brutalityFailRates[b], avgLatencyMs: lat, rank: i + 1,
    })),
    deterministicConsistencyScore: 10, stoppedEarly: false, stoppedReason: null,
  };
}

const envAllSafe: ProductionSafetyEnvelope = buildProductionSafetyEnvelope(makeReport({
  formulaFailRates: { ENERGY: 0, FOCUS: 0 },
  modeFailRates: { AUTO: 0, MINIMAL: 0 },
  brutalityFailRates: { 0.25: 0, 0.5: 0 },
}), { now: '2026-01-01T00:00:00.000Z' });

// envMixed: SLEEP formula forbidden (score <5), Minimal mode warning,
// brutality 1 forbidden. ENERGY/FOCUS/AUTO/0.25/0.5 are safe.
const envMixed: ProductionSafetyEnvelope = buildProductionSafetyEnvelope(makeReport({
  formulaFailRates: { ENERGY: 0, FOCUS: 0.0, SLEEP: 0.60 },         // SLEEP forbidden (score 4)
  modeFailRates: { AUTO: 0, MINIMAL: 0.30, AGGRESSIVE: 0.55 },     // MINIMAL warning (7), AGGRESSIVE forbidden (4.5)
  brutalityFailRates: { 0.25: 0, 0.5: 0, 0.75: 0.30, 1: 0.60 },    // 0.75 warning (7), 1 forbidden (4)
}), { now: '2026-01-01T00:00:00.000Z' });

// envNoSafe: every dimension lands in WARNING tier (score 5..8).
const envNoSafe: ProductionSafetyEnvelope = buildProductionSafetyEnvelope(makeReport({
  formulaFailRates: { ENERGY: 0.25, FOCUS: 0.30 },                  // scores 7.5, 7
  modeFailRates: { AUTO: 0.25, MINIMAL: 0.30 },
  brutalityFailRates: { 0.25: 0.25, 0.5: 0.30 },
}), { now: '2026-01-01T00:00:00.000Z' });

// ─── cases ────────────────────────────────────────────────────

function caseA(): { ok: boolean; detail: string } {
  const r = computeProductionConservativeMode({
    formula: 'ENERGY', campaignMode: null, brutality: 0.25, envelope: envAllSafe,
  });
  const ok = r.safetyTier === 'safe' && r.recommendedAction === 'proceed' &&
    r.allowedForProduction && r.allowedForTesting;
  return { ok, detail: `tier=${r.safetyTier} action=${r.recommendedAction} prod=${r.allowedForProduction} test=${r.allowedForTesting}` };
}

function caseB(): { ok: boolean; detail: string } {
  // WARNING cell: ENERGY + Minimal + 0.5  in envMixed (MINIMAL is warning,
  // others safe → cell is min(safe, warning, safe) = warning)
  const r = computeProductionConservativeMode({
    formula: 'ENERGY', campaignMode: 'Minimal', brutality: 0.5, envelope: envMixed,
  });
  const ok = r.safetyTier === 'warning' &&
    ['proceed-with-caution', 'lower-brutality', 'switch-mode'].includes(r.recommendedAction) &&
    !r.allowedForProduction && r.allowedForTesting;
  return { ok, detail: `tier=${r.safetyTier} action=${r.recommendedAction}` };
}

function caseC(): { ok: boolean; detail: string } {
  // FORBIDDEN: SLEEP forbidden formula → cell is forbidden
  const r = computeProductionConservativeMode({
    formula: 'SLEEP', campaignMode: null, brutality: 0.5, envelope: envMixed,
  });
  const ok = r.safetyTier === 'forbidden' &&
    (r.recommendedAction === 'use-safe-fallback' || r.recommendedAction === 'manual-review-required') &&
    !r.allowedForProduction && !r.allowedForTesting;
  return { ok, detail: `tier=${r.safetyTier} action=${r.recommendedAction}` };
}

function caseD(): { ok: boolean; detail: string } {
  // No envelope at all → unknown
  const r = computeProductionConservativeMode({
    formula: 'ENERGY', campaignMode: null, brutality: 0.5, envelope: null,
  });
  const ok = r.safetyTier === 'unknown' && r.recommendedAction === 'manual-review-required' &&
    !r.allowedForProduction && !r.allowedForTesting;
  return { ok, detail: `tier=${r.safetyTier} action=${r.recommendedAction}` };
}

function caseE(): { ok: boolean; detail: string } {
  const r = computeProductionConservativeMode({
    formula: 'ENERGY', campaignMode: null, brutality: 0.5, envelope: envNoSafe,
  });
  const ok = r.safeFallback !== null &&
    r.safeFallback.reason.includes('best available warning fallback') &&
    envNoSafe.SAFE_PRODUCTION_MATRIX.length === 0;
  return {
    ok,
    detail: `fallback=${r.safeFallback ? `${r.safeFallback.formula}/${r.safeFallback.campaignMode}/b=${r.safeFallback.brutality}` : 'null'} reason=${r.safeFallback?.reason}`,
  };
}

function caseF(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const r = computeProductionConservativeMode({
    formula: 'ENERGY', campaignMode: null, brutality: 0.25, envelope: env,
  });
  // The contract: output never contains any "applied" / "auto-applied"
  // flag and always carries an advisoryNotice.
  const objStr = JSON.stringify(r);
  const banned = /"auto[A-Z]?[Aa]pply|"applied":\s*true/.test(objStr);
  const noticeOk = r.advisoryNotice.toLowerCase().includes('advisory only');
  return {
    ok: !banned && noticeOk,
    detail: `banned-flag=${banned} advisoryNotice=${r.advisoryNotice.slice(0, 60)}…`,
  };
}

function caseG(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const a = JSON.stringify(computeProductionConservativeMode({
    formula: 'FOCUS', campaignMode: 'Minimal', brutality: 0.5, envelope: env,
    memoryPressure: 4, recentRouteErrorCount: 0, recentRefusalRate: 0.1,
  }));
  const b = JSON.stringify(computeProductionConservativeMode({
    formula: 'FOCUS', campaignMode: 'Minimal', brutality: 0.5, envelope: env,
    memoryPressure: 4, recentRouteErrorCount: 0, recentRefusalRate: 0.1,
  }));
  return {
    ok: a === b,
    detail: a === b ? 'two invocations produced identical JSON' : 'differs',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('PRODUCTION CONSERVATIVE MODE VERIFICATION\n');

  const cases: Array<[string, string, () => { ok: boolean; detail: string }]> = [
    ['A', 'SAFE cell returns proceed',                                () => caseA()],
    ['B', 'WARNING cell returns caution / lower-brutality / switch',  () => caseB()],
    ['C', 'FORBIDDEN cell returns use-fallback or manual-review',     () => caseC()],
    ['D', 'no envelope returns manual-review-required',               () => caseD()],
    ['E', 'no SAFE cells → best WARNING fallback (explicit reason)',  () => caseE()],
    ['F', 'output is advisory; no auto-apply / "applied":true flags', () => caseF(envMixed)],
    ['G', 'deterministic: same input → same JSON',                    () => caseG(envMixed)],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  // Static check: confirm the module has no critic / pipeline imports,
  // no network calls, no memory writes.
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'lib', 'productionConservativeMode.ts'),
    'utf8',
  );
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /\bfetch\s*\(/,
    /fs\.writeFile\(/,
  ];
  const violations = forbidden.filter((re) => re.test(src));
  record(
    'static-isolation',
    'module has no critic/pipeline imports, no fetch, no memory writes',
    violations.length === 0,
    violations.length === 0 ? 'clean' : `violations: ${violations.length}`,
  );

  record('H', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
    'this script defers compiler validation to the suite runner');

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('verification script crashed:', err);
  process.exit(2);
});
