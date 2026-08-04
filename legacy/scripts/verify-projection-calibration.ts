/**
 * scripts/verify-projection-calibration.ts
 *
 * Deterministic verification for the Projection Calibration layer
 * (epistemic calibration — annotations only).
 *
 *   A · same history → same calibration analysis
 *   B · accurate predictions raise historicalAccuracy
 *   C · biased predictions surface overestimation / underestimation
 *   D · short-term-vs-long-term divergence detected
 *   E · environmental sensitivity classified
 *   F · calibration memory drift trajectory builds correctly
 *   G · least reliable surfaced
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-projection-calibration.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  computeProjectionCalibration,
} from '../lib/projectionCalibrationEngine';
import {
  applyCalibrationSnapshot, createInitialProjectionCalibrationMemory,
  createProjectionCalibrationMemoryStore, CALIBRATION_SNAPSHOT_LIMIT,
} from '../lib/projectionCalibrationMemory';
import { buildProjectionCalibrationLongitudinalView } from '../lib/projectionCalibrationLongitudinalView';
import {
  createInitialBranchActivationMemory, appendActivation,
  applyPostActivationSample, buildActivationId, RESOLUTION_WINDOW,
  type BranchActivationRecord, type BranchActivationMemoryState,
} from '../lib/branchActivationMemory';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('PROJECTION CALIBRATION — VERIFICATION\n');

// ─── helpers ──────────────────────────────────────────────────

function record(over: Partial<BranchActivationRecord> = {}): BranchActivationRecord {
  return {
    id: buildActivationId(1700000000000, over.branchName ?? 'high-trust-documentary', 'studio', 0),
    activatedAt: 1700000000000,
    branchName: 'high-trust-documentary',
    counterfactualType: 'trust-optimal',
    fromPhase: 'fatiguing',
    fromExecutive: 'strategy',
    fromIdentityVector: 'aggressive-conversion',
    fromArchetype: 'aggressive-performance',
    predictedTrustImpact: 4,
    predictedFatigueImpact: -1,
    predictedDurabilityImpact: 4,
    predictedRisk: 4,
    predictedDurabilityPotential: 7,
    baselineTrustMomentum: 4,
    baselineFatiguePressure: 7,
    baselineDurability: 4,
    baselineCampaignHealth: 5,
    operatorId: 'studio',
    reason: 'trust-optimal alternate path',
    observationsAfter: 0,
    measuredTrustDelta: 0,
    measuredFatigueDelta: 0,
    measuredDurabilityDelta: 0,
    measuredHealthDelta: 0,
    measuredDecayDelta: 0,
    resolved: false,
    resolutionResult: 'pending',
    ...over,
  };
}

function appendAndResolve(
  state: BranchActivationMemoryState,
  recordOver: Partial<BranchActivationRecord>,
  sample: (at: number) => Parameters<typeof applyPostActivationSample>[1],
): BranchActivationMemoryState {
  const totalSoFar = state.totalActivations;
  const r = record(recordOver);
  r.id = buildActivationId(r.activatedAt, r.branchName, r.operatorId, totalSoFar);
  let s = appendActivation(state, r);
  for (let i = 1; i <= RESOLUTION_WINDOW; i++) {
    s = applyPostActivationSample(s, sample(r.activatedAt + i * 1000));
  }
  return s;
}

function exactMatchSample(predicted: { trust: number; fatigue: number; durability: number },
                          baseline: { trust: number; fatigue: number; durability: number }) {
  return (at: number) => ({
    at,
    campaignHealth: baseline.trust + predicted.trust,
    trustMomentum: baseline.trust + predicted.trust,
    fatiguePressure: baseline.fatigue + predicted.fatigue,
    strategicDurability: baseline.durability + predicted.durability,
    decayRisk: baseline.fatigue + predicted.fatigue,
  });
}

function biasedSample(baseline: { trust: number; fatigue: number; durability: number },
                      bias: { trust: number; fatigue: number; durability: number }) {
  return (at: number) => ({
    at,
    campaignHealth: baseline.trust + bias.trust,
    trustMomentum: baseline.trust + bias.trust,
    fatiguePressure: baseline.fatigue + bias.fatigue,
    strategicDurability: baseline.durability + bias.durability,
    decayRisk: baseline.fatigue + bias.fatigue,
  });
}

async function main() {
  // ── A. same inputs → same calibration ────────────────────────
  {
    let ba = createInitialBranchActivationMemory();
    for (let i = 0; i < 4; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'trust-optimal',
      }, exactMatchSample(
        { trust: 4, fatigue: -1, durability: 4 },
        { trust: 4, fatigue: 7, durability: 4 },
      ));
    }
    const r1 = computeProjectionCalibration({ branchActivationMemory: ba });
    const r2 = computeProjectionCalibration({ branchActivationMemory: ba });
    check('A · same history → same calibration',
      JSON.stringify(r1) === JSON.stringify(r2),
      `overallAccuracy=${r1.overallAccuracy} types=${r1.calibrations.length}`);
  }

  // ── B. accurate predictions raise historicalAccuracy ─────────
  {
    let ba = createInitialBranchActivationMemory();
    for (let i = 0; i < 5; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'trust-optimal',
        predictedTrustImpact: 4, predictedFatigueImpact: -1, predictedDurabilityImpact: 4,
      }, exactMatchSample(
        { trust: 4, fatigue: -1, durability: 4 },
        { trust: 4, fatigue: 7, durability: 4 },
      ));
    }
    const r = computeProjectionCalibration({ branchActivationMemory: ba });
    const trustOpt = r.calibrations.find((c) => c.projectionType === 'trust-optimal');
    check('B · accurate predictions raise historicalAccuracy',
      !!trustOpt && trustOpt.historicalAccuracy >= 8 && r.overallAccuracy >= 8,
      trustOpt ? `historicalAccuracy=${trustOpt.historicalAccuracy} overall=${r.overallAccuracy}` : 'NOT FOUND');
  }

  // ── C. biased predictions surface overestimation/underestimation
  {
    let ba = createInitialBranchActivationMemory();
    // Predict trust +4 but actually deliver only +1 → overestimate by ~3.
    for (let i = 0; i < 5; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'high-impact',
        predictedTrustImpact: 4, predictedFatigueImpact: -2, predictedDurabilityImpact: 4,
      }, biasedSample(
        { trust: 4, fatigue: 7, durability: 4 },
        { trust: 1, fatigue: 0, durability: 1 },
      ));
    }
    const r = computeProjectionCalibration({ branchActivationMemory: ba });
    const highImpact = r.calibrations.find((c) => c.projectionType === 'high-impact');
    check('C · biased predictions surface overestimation bias',
      !!highImpact && highImpact.overestimationBias >= 3 &&
      highImpact.calibrationAnnotations.some((a) => a.includes('overestimates')),
      highImpact ? `overestimationBias=${highImpact.overestimationBias} annotations=${highImpact.calibrationAnnotations.length}` : 'NOT FOUND');
  }

  // ── D. short-term vs long-term divergence detected ───────────
  {
    let ba = createInitialBranchActivationMemory();
    // First half: accurate. Second half: way off → short-term high, long weak.
    for (let i = 0; i < 3; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'fatigue-aware',
        predictedTrustImpact: 1, predictedFatigueImpact: -4, predictedDurabilityImpact: 2,
      }, exactMatchSample(
        { trust: 1, fatigue: -4, durability: 2 },
        { trust: 4, fatigue: 7, durability: 4 },
      ));
    }
    for (let i = 3; i < 6; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'fatigue-aware',
        predictedTrustImpact: 1, predictedFatigueImpact: -4, predictedDurabilityImpact: 2,
      }, biasedSample(
        { trust: 4, fatigue: 7, durability: 4 },
        { trust: 5, fatigue: 3, durability: -2 },
      ));
    }
    const r = computeProjectionCalibration({ branchActivationMemory: ba });
    const fa = r.calibrations.find((c) => c.projectionType === 'fatigue-aware');
    check('D · short-term-vs-long-term divergence detected',
      !!fa &&
      Math.abs(fa.shortTermAccuracy - fa.longTermAccuracy) >= 1.5 &&
      fa.calibrationAnnotations.some((a) => /short-term|long-term/.test(a)),
      fa ? `short=${fa.shortTermAccuracy} long=${fa.longTermAccuracy} divergence=${Math.abs(fa.shortTermAccuracy - fa.longTermAccuracy).toFixed(1)}` : 'NOT FOUND');
  }

  // ── E. environmental sensitivity classified ──────────────────
  {
    let ba = createInitialBranchActivationMemory();
    // High-fatigue baseline (pressure=8) + accurate predictions → highFatigue env reliability should be high.
    for (let i = 0; i < 5; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'fatigue-aware',
        baselineFatiguePressure: 8,
        baselineTrustMomentum: 6,
        baselineDurability: 5,
        predictedTrustImpact: 1, predictedFatigueImpact: -4, predictedDurabilityImpact: 2,
      }, exactMatchSample(
        { trust: 1, fatigue: -4, durability: 2 },
        { trust: 6, fatigue: 8, durability: 5 },
      ));
    }
    const r = computeProjectionCalibration({ branchActivationMemory: ba });
    const fa = r.calibrations.find((c) => c.projectionType === 'fatigue-aware');
    check('E · environmental sensitivity classified',
      !!fa && fa.environmentalSensitivity.highFatigue >= 7 &&
      fa.calibrationAnnotations.some((a) => a.includes('high-fatigue')),
      fa ? `highFatigueReliability=${fa.environmentalSensitivity.highFatigue}` : 'NOT FOUND');
  }

  // ── F. calibration memory drift trajectory builds correctly ──
  {
    let calibMem = createInitialProjectionCalibrationMemory();
    for (let i = 0; i < 5; i++) {
      calibMem = applyCalibrationSnapshot(calibMem, {
        at: 1700000000000 + i * 100000,
        bannerId: `f-${i}`,
        overallConfidence: 6 + i * 0.4,
        overallAccuracy: 5 + i * 0.5,            // rising
        perTypeAccuracy: { 'trust-optimal': 5 + i * 0.5 },
      });
    }
    const trajectory = calibMem.perTypeAccuracyTrajectory['trust-optimal'];
    const view = buildProjectionCalibrationLongitudinalView({ memory: calibMem, current: null });
    check('F · calibration memory drift trajectory builds correctly',
      !!trajectory && trajectory.length === 5 &&
      view.trend === 'calibration-improving' &&
      view.totalSnapshots === 5,
      `trajectory.length=${trajectory?.length} trend=${view.trend}`);
  }

  // ── G. least reliable surfaced ───────────────────────────────
  {
    let ba = createInitialBranchActivationMemory();
    // Accurate: trust-optimal
    for (let i = 0; i < 4; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'trust-optimal',
        predictedTrustImpact: 3, predictedFatigueImpact: -1, predictedDurabilityImpact: 3,
      }, exactMatchSample(
        { trust: 3, fatigue: -1, durability: 3 },
        { trust: 4, fatigue: 7, durability: 4 },
      ));
    }
    // Inaccurate: high-impact (predict +5, deliver -3 across all axes)
    for (let i = 0; i < 4; i++) {
      ba = appendAndResolve(ba, {
        activatedAt: 1700000000000 + (i + 4) * 100000,
        counterfactualType: 'high-impact',
        predictedTrustImpact: 5, predictedFatigueImpact: -3, predictedDurabilityImpact: 5,
      }, biasedSample(
        { trust: 4, fatigue: 7, durability: 4 },
        { trust: -3, fatigue: 3, durability: -3 },
      ));
    }
    const r = computeProjectionCalibration({ branchActivationMemory: ba });
    check('G · least reliable surfaced',
      r.mostReliableProjectionType === 'trust-optimal' &&
      r.leastReliableProjectionType === 'high-impact',
      `most=${r.mostReliableProjectionType} least=${r.leastReliableProjectionType}`);
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'projcal-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodProjectionCalibration = undefined;
    const store = createProjectionCalibrationMemoryStore(tmpDir);
    await store.reset();
    for (let i = 0; i < CALIBRATION_SNAPSHOT_LIMIT + 20; i++) {
      await store.append({
        at: 1700000000000 + i,
        bannerId: `h-${i}`,
        overallConfidence: 5,
        overallAccuracy: 5,
        perTypeAccuracy: { 'trust-optimal': 5 },
      });
    }
    const state = await store.read();
    check('H · FIFO cap stable at CALIBRATION_SNAPSHOT_LIMIT',
      state.snapshots.length === CALIBRATION_SNAPSHOT_LIMIT &&
      state.totalSnapshots === CALIBRATION_SNAPSHOT_LIMIT + 20,
      `snapshots=${state.snapshots.length}/${CALIBRATION_SNAPSHOT_LIMIT} total=${state.totalSnapshots}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodProjectionCalibration = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    let ba = createInitialBranchActivationMemory();
    for (let i = 0; i < 3; i++) {
      ba = appendAndResolve(ba, { activatedAt: 1700000000000 + i * 100000 },
        exactMatchSample(
          { trust: 4, fatigue: -1, durability: 4 },
          { trust: 4, fatigue: 7, durability: 4 },
        ));
    }
    const before = JSON.stringify(ba);
    computeProjectionCalibration({ branchActivationMemory: ba });
    computeProjectionCalibration({ branchActivationMemory: ba });
    const after = JSON.stringify(ba);
    check('I · no runtime mutation — engine leaves memory unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/projectionCalibrationEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/projectionCalibrationMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/projectionCalibrationLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in calibration sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/projectionCalibrationEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/projectionCalibrationMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/projectionCalibrationLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in calibration sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let calibMem = createInitialProjectionCalibrationMemory();
    for (let i = 0; i < 4; i++) {
      calibMem = applyCalibrationSnapshot(calibMem, {
        at: 1700000000000 + i * 100000,
        bannerId: `l-${i}`,
        overallConfidence: 5 + i * 0.3,
        overallAccuracy: 5 + i * 0.5,
        perTypeAccuracy: { 'trust-optimal': 5 + i * 0.5, 'high-impact': 4 + i * 0.2 },
      });
    }
    const v1 = buildProjectionCalibrationLongitudinalView({ memory: calibMem });
    const v2 = buildProjectionCalibrationLongitudinalView({ memory: calibMem });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(v1) === JSON.stringify(v2),
      `drift×${v1.perTypeDrift.length} trend=${v1.trend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
