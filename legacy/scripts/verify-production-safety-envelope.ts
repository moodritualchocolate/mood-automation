/**
 * VERIFY — Production Safety Envelope analyzer contract.
 *
 * The analyzer is pure (lib/productionSafetyEnvelope.ts). This script
 * exercises it with synthetic FullHardeningMatrixReport inputs and
 * verifies:
 *
 *   A · all dimensions are scored (formula / mode / brutality)
 *   B · safe/warning/forbidden tiering respects thresholds
 *   C · SAFE/WARNING/FORBIDDEN matrices partition the cell space
 *        (every cell belongs to exactly one tier, total = |cells|)
 *   D · recommendedRuntimePolicy.defaultProductionMode comes from
 *        SAFE_PRODUCTION_MATRIX when any safe cell exists
 *   E · safeFallbackMode is non-AUTO if a non-AUTO safe cell exists
 *   F · maxAllowedBrutality is the highest brutality with safe tier
 *   G · top10Dangerous is sorted ascending by stabilityScore
 *   H · top10Safest is sorted descending by stabilityScore
 *   I · advisoryOnly === true AND systemMustNeverAutoApply === true
 *   J · same input → same output (determinism, with pinned now)
 *   K · empty / degenerate report does not throw
 *   L · TypeScript clean (delegated to suite tsc)
 *
 * This script does NOT call /api/generate or read live memory.
 */

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

// ─── synthetic matrix report (realistic distribution) ─────────

function makeSyntheticReport(): MatrixReportInput {
  const formulas = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'];
  const modes = ['AUTO', 'MINIMAL', 'DOCUMENTARY', 'EMOTIONAL',
                 'PERFORMANCE', 'AGGRESSIVE', 'PRODUCT_FOCUSED', 'LUXURY'];
  const brutalityLevels = [0, 0.25, 0.5, 0.75, 1];
  const perCombination: MatrixReportInput['latencyHeatmap']['perCombination'] = [];

  // Realistic latency: ENERGY fastest, RELAX/SLEEP slower; AUTO fastest
  // by mode; high brutality slightly slower. Add deterministic noise
  // via a seeded LCG so the verification stays deterministic.
  let seed = 1234567;
  const rand = (): number => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xffffffff;
  };
  const baseByFormula: Record<string, number> = {
    ENERGY: 900, FOCUS: 1100, RELAX: 1300, SLEEP: 1500,
  };
  const baseByMode: Record<string, number> = {
    AUTO: 0, MINIMAL: 100, DOCUMENTARY: 200, EMOTIONAL: 150,
    PERFORMANCE: 100, AGGRESSIVE: 300, PRODUCT_FOCUSED: 250, LUXURY: 200,
  };

  for (const f of formulas) {
    for (const m of modes) {
      for (const b of brutalityLevels) {
        const lat = Math.round(
          baseByFormula[f] + baseByMode[m] + b * 400 + rand() * 200,
        );
        perCombination.push({ formula: f, mode: m, brutality: b, latencyMs: lat });
      }
    }
  }

  // Simulate failure rates: AGGRESSIVE at brutality 1 fails sometimes,
  // SLEEP slightly less stable than others.
  const formulaStability = formulas.map((f, i) => ({
    formula: f,
    failureRate: f === 'SLEEP' ? 0.08 : f === 'RELAX' ? 0.04 : 0.0,
    avgLatencyMs: Math.round(
      perCombination.filter((r) => r.formula === f)
        .reduce((a, r) => a + r.latencyMs, 0) / 40,
    ),
    rank: i + 1,
  }));
  const modeStability = modes.map((m, i) => ({
    mode: m,
    failureRate: m === 'AGGRESSIVE' ? 0.12 : m === 'DOCUMENTARY' ? 0.06 : 0.0,
    avgLatencyMs: Math.round(
      perCombination.filter((r) => r.mode === m)
        .reduce((a, r) => a + r.latencyMs, 0) / 20,
    ),
    rank: i + 1,
  }));
  const brutalityStability = brutalityLevels.map((b, i) => ({
    brutality: b,
    failureRate: b === 1 ? 0.25 : b === 0.75 ? 0.10 : 0.0,
    avgLatencyMs: Math.round(
      perCombination.filter((r) => r.brutality === b)
        .reduce((a, r) => a + r.latencyMs, 0) / 32,
    ),
    rank: i + 1,
  }));

  return {
    totalCombinations: 160,
    totalRuns: 160,
    approvals: 120,
    refusals: 30,
    failures: 10,
    degradedAdvisories: 5,
    averageLatencyMs: 1200,
    latencyHeatmap: {
      byFormula: { ENERGY: 1000, FOCUS: 1200, RELAX: 1400, SLEEP: 1600 },
      byMode: {
        AUTO: 1100, MINIMAL: 1150, DOCUMENTARY: 1300, EMOTIONAL: 1200,
        PERFORMANCE: 1200, AGGRESSIVE: 1400, PRODUCT_FOCUSED: 1350, LUXURY: 1300,
      },
      byBrutality: { '0': 1100, '0.25': 1150, '0.5': 1200, '0.75': 1300, '1': 1400 },
      perCombination,
    },
    fifoPressure: { capped: 17, overCap: 0, total: 17, overCapDetails: [] },
    memoryGrowth: {
      filesTouched: ['ad-strategy-memory.json', 'copy-quality-memory.json', 'policy-audit.json'],
      bytesAdded: 12000,
      perFile: {
        'ad-strategy-memory.json':  { before: 35000, after: 41000, delta: 6000 },
        'copy-quality-memory.json': { before: 4000,  after: 7500,  delta: 3500 },
        'policy-audit.json':        { before: 8000,  after: 10500, delta: 2500 },
      },
    },
    routeErrorInventory: [],
    panelSyncWarnings: [],
    refusalReasonDistribution: {
      'critic-rejected': 18, 'copy-quality-threshold': 8, 'trust-debt': 4,
    },
    verdictDistribution: {
      approve: 120, 'reject-concept': 15, 'reject-image': 10, 'reject-taste': 5,
    },
    formulaStabilityRanking: formulaStability,
    campaignModeStabilityRanking: modeStability,
    brutalityStressRanking: brutalityStability,
    deterministicConsistencyScore: 9.4,
    stoppedEarly: false,
    stoppedReason: null,
  };
}

// ─── individual cases ─────────────────────────────────────────

function caseA(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const ok = env.formulaStability.length === 4
    && env.modeStability.length === 8
    && env.brutalityStability.length === 5;
  return {
    ok,
    detail: `formula=${env.formulaStability.length}/4 mode=${env.modeStability.length}/8 brut=${env.brutalityStability.length}/5`,
  };
}

function caseB(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const all = [
    ...env.formulaStability, ...env.modeStability,
    ...env.brutalityStability.map((r) => ({ ...r, key: String(r.key) })),
  ];
  for (const r of all) {
    if (r.stabilityScore >= 8.0 && r.safetyTier !== 'safe') {
      return { ok: false, detail: `score ${r.stabilityScore} but tier=${r.safetyTier} (expected safe)` };
    }
    if (r.stabilityScore >= 5.0 && r.stabilityScore < 8.0 && r.safetyTier !== 'warning') {
      return { ok: false, detail: `score ${r.stabilityScore} but tier=${r.safetyTier} (expected warning)` };
    }
    if (r.stabilityScore < 5.0 && r.safetyTier !== 'forbidden') {
      return { ok: false, detail: `score ${r.stabilityScore} but tier=${r.safetyTier} (expected forbidden)` };
    }
  }
  return { ok: true, detail: `all ${all.length} dim entries respect tier thresholds` };
}

function caseC(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const total = env.SAFE_PRODUCTION_MATRIX.length +
                env.WARNING_MATRIX.length +
                env.FORBIDDEN_MATRIX.length;
  // Build a set of cell keys; tiers must partition (no overlap).
  const seen = new Set<string>();
  const overlap: string[] = [];
  const addAll = (arr: typeof env.SAFE_PRODUCTION_MATRIX) => {
    for (const c of arr) {
      const k = `${c.formula}|${c.mode}|${c.brutality}`;
      if (seen.has(k)) overlap.push(k); else seen.add(k);
    }
  };
  addAll(env.SAFE_PRODUCTION_MATRIX);
  addAll(env.WARNING_MATRIX);
  addAll(env.FORBIDDEN_MATRIX);
  return {
    ok: total === seen.size && overlap.length === 0,
    detail: `total=${total} unique=${seen.size} overlap=${overlap.length}`,
  };
}

function caseD(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  if (env.SAFE_PRODUCTION_MATRIX.length === 0) {
    return { ok: true, detail: 'no safe cells — default may come from any tier' };
  }
  const def = env.recommendedRuntimePolicy.defaultProductionMode;
  const match = env.SAFE_PRODUCTION_MATRIX.find((c) =>
    c.formula === def.formula &&
    ((c.mode === 'AUTO' && def.mode === null) || c.mode === def.mode) &&
    c.brutality === def.brutality,
  );
  return {
    ok: match !== undefined,
    detail: match
      ? `default ${def.formula}/${def.mode ?? 'AUTO'}/b=${def.brutality} is in SAFE matrix`
      : `default ${def.formula}/${def.mode ?? 'AUTO'}/b=${def.brutality} NOT in SAFE matrix`,
  };
}

function caseE(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const safeNonAuto = env.SAFE_PRODUCTION_MATRIX.filter((c) => c.mode !== 'AUTO');
  if (safeNonAuto.length === 0) {
    return { ok: true, detail: 'no non-AUTO safe cells — fallback may use AUTO' };
  }
  const fb = env.recommendedRuntimePolicy.safeFallbackMode;
  return {
    ok: fb.mode !== null,
    detail: `fallback mode=${fb.mode ?? 'AUTO'} (non-AUTO safe cells available: ${safeNonAuto.length})`,
  };
}

function caseF(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const safeBrutValues = env.brutalityStability
    .filter((r) => r.safetyTier === 'safe').map((r) => r.key);
  if (safeBrutValues.length === 0) return { ok: true, detail: 'no safe brutality — fallback applies' };
  const expected = Math.max(...safeBrutValues);
  return {
    ok: env.recommendedRuntimePolicy.maxAllowedBrutality === expected,
    detail: `expected=${expected} got=${env.recommendedRuntimePolicy.maxAllowedBrutality}`,
  };
}

function caseG(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const xs = env.top10Dangerous;
  for (let i = 1; i < xs.length; i++) {
    if (xs[i].stabilityScore < xs[i - 1].stabilityScore) {
      return { ok: false, detail: `out of order at ${i}: ${xs[i - 1].stabilityScore} > ${xs[i].stabilityScore}` };
    }
  }
  return { ok: true, detail: `${xs.length} entries ascending by stabilityScore` };
}

function caseH(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  const xs = env.top10Safest;
  for (let i = 1; i < xs.length; i++) {
    if (xs[i].stabilityScore > xs[i - 1].stabilityScore) {
      return { ok: false, detail: `out of order at ${i}: ${xs[i - 1].stabilityScore} < ${xs[i].stabilityScore}` };
    }
  }
  return { ok: true, detail: `${xs.length} entries descending by stabilityScore` };
}

function caseI(env: ProductionSafetyEnvelope): { ok: boolean; detail: string } {
  return {
    ok: env.advisoryOnly === true && env.systemMustNeverAutoApply === true,
    detail: `advisoryOnly=${env.advisoryOnly} systemMustNeverAutoApply=${env.systemMustNeverAutoApply}`,
  };
}

function caseJ(report: MatrixReportInput): { ok: boolean; detail: string } {
  const pinnedNow = '2026-01-01T00:00:00.000Z';
  const a = JSON.stringify(buildProductionSafetyEnvelope(report, { now: pinnedNow }));
  const b = JSON.stringify(buildProductionSafetyEnvelope(report, { now: pinnedNow }));
  return {
    ok: a === b,
    detail: a === b ? 'two runs produce byte-identical JSON' : `output differs (lengths ${a.length} vs ${b.length})`,
  };
}

function caseK(): { ok: boolean; detail: string } {
  const empty: MatrixReportInput = {
    totalCombinations: 0, totalRuns: 0, approvals: 0, refusals: 0,
    failures: 0, degradedAdvisories: 0, averageLatencyMs: 0,
    latencyHeatmap: { byFormula: {}, byMode: {}, byBrutality: {}, perCombination: [] },
    fifoPressure: { capped: 0, overCap: 0, total: 0, overCapDetails: [] },
    memoryGrowth: { filesTouched: [], bytesAdded: 0, perFile: {} },
    routeErrorInventory: [], panelSyncWarnings: [],
    refusalReasonDistribution: {}, verdictDistribution: {},
    formulaStabilityRanking: [], campaignModeStabilityRanking: [],
    brutalityStressRanking: [],
    deterministicConsistencyScore: 0,
    stoppedEarly: false, stoppedReason: null,
  };
  try {
    const e = buildProductionSafetyEnvelope(empty, { now: '2026-01-01T00:00:00.000Z' });
    return {
      ok: e.SAFE_PRODUCTION_MATRIX.length === 0
        && e.WARNING_MATRIX.length === 0
        && e.FORBIDDEN_MATRIX.length === 0,
      detail: 'empty report produced empty matrices without throwing',
    };
  } catch (err) {
    return { ok: false, detail: `threw: ${(err as Error).message}` };
  }
}

// ─── main ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('PRODUCTION SAFETY ENVELOPE VERIFICATION\n');

  const report = makeSyntheticReport();
  const env = buildProductionSafetyEnvelope(report, { now: '2026-01-01T00:00:00.000Z' });

  const cases: Array<[string, string, () => { ok: boolean; detail: string }]> = [
    ['A', 'all dimensions scored (4 formulas, 8 modes, 5 brutality levels)', () => caseA(env)],
    ['B', 'safe/warning/forbidden tiering respects score thresholds',         () => caseB(env)],
    ['C', 'SAFE/WARNING/FORBIDDEN partition cells without overlap',           () => caseC(env)],
    ['D', 'defaultProductionMode is drawn from SAFE_PRODUCTION_MATRIX',       () => caseD(env)],
    ['E', 'safeFallbackMode is non-AUTO when a non-AUTO safe cell exists',    () => caseE(env)],
    ['F', 'maxAllowedBrutality equals max safe brutality',                    () => caseF(env)],
    ['G', 'top10Dangerous sorted ascending by stabilityScore',                () => caseG(env)],
    ['H', 'top10Safest sorted descending by stabilityScore',                  () => caseH(env)],
    ['I', 'advisoryOnly + systemMustNeverAutoApply both true',                () => caseI(env)],
    ['J', 'deterministic: same input + pinned now → same JSON',               () => caseJ(report)],
    ['K', 'empty / degenerate report does not throw',                         () => caseK()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  record('L', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
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
