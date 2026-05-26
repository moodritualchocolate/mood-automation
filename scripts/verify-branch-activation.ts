/**
 * scripts/verify-branch-activation.ts
 *
 * Deterministic verification for the Branch Activation Log layer
 * (human-supervised reinforcement memory).
 *
 *   A · same history → same activation analysis
 *   B · repeated successful recoveries raise reliability
 *   C · repeated failures lower branchTrustworthiness
 *   D · accurate projections raise predictionAccuracy
 *   E · operator repetition surfaces preference fingerprints
 *   F · durable outcomes raise longTermStability
 *   G · failed branches populate warnings
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-branch-activation.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  computeBranchActivationLog,
} from '../lib/branchActivationLog';
import {
  applyPostActivationSample, appendActivation, createInitialBranchActivationMemory,
  buildActivationId, createBranchActivationMemoryStore,
  BRANCH_ACTIVATION_LIMIT, RESOLUTION_WINDOW,
  type BranchActivationRecord, type BranchActivationMemoryState,
} from '../lib/branchActivationMemory';
import { buildBranchActivationLongitudinalView } from '../lib/branchActivationLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('BRANCH ACTIVATION LOG — VERIFICATION\n');

// ─── helpers ─────────────────────────────────────────────────

function record(over: Partial<BranchActivationRecord> = {}): BranchActivationRecord {
  return {
    id: buildActivationId(1700000000000, over.branchName ?? 'high-trust-documentary', over.operatorId ?? 'studio', 0),
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

function appendRecord(state: BranchActivationMemoryState, over: Partial<BranchActivationRecord> = {}): BranchActivationMemoryState {
  const totalSoFar = state.totalActivations;
  const r = record(over);
  r.id = buildActivationId(r.activatedAt, r.branchName, r.operatorId, totalSoFar);
  return appendActivation(state, r);
}

function recoverySample(at: number): Parameters<typeof applyPostActivationSample>[1] {
  // Recovery: trust up, fatigue down, durability up vs the default baseline (4, 7, 4).
  return {
    at,
    campaignHealth: 8,
    trustMomentum: 8,         // +4 vs baseline 4
    fatiguePressure: 3,       // -4 vs baseline 7
    strategicDurability: 8,   // +4 vs baseline 4
    decayRisk: 2,
  };
}

function failureSample(at: number): Parameters<typeof applyPostActivationSample>[1] {
  return {
    at,
    campaignHealth: 2,
    trustMomentum: 1,         // -3 vs baseline 4
    fatiguePressure: 9,       // +2 vs baseline 7
    strategicDurability: 1,   // -3 vs baseline 4
    decayRisk: 9,
  };
}

function resolveActivation(state: BranchActivationMemoryState, sample: (at: number) => ReturnType<typeof recoverySample>): BranchActivationMemoryState {
  let s = state;
  const baseAt = 1700000000000;
  for (let i = 1; i <= RESOLUTION_WINDOW; i++) {
    s = applyPostActivationSample(s, sample(baseAt + i * 1000));
  }
  return s;
}

async function main() {
  // ── A. same inputs → same analysis ───────────────────────────
  {
    let mem = createInitialBranchActivationMemory();
    mem = appendRecord(mem);
    mem = resolveActivation(mem, recoverySample);
    const log1 = computeBranchActivationLog({ memory: mem });
    const log2 = computeBranchActivationLog({ memory: mem });
    check('A · same history → same activation analysis',
      JSON.stringify(log1) === JSON.stringify(log2),
      `confidence=${log1.activationConfidence} reliability=${log1.historicalReliability}`);
  }

  // ── B. repeated successful recoveries raise reliability ──────
  {
    let mem = createInitialBranchActivationMemory();
    for (let i = 0; i < 6; i++) {
      mem = appendRecord(mem, {
        activatedAt: 1700000000000 + i * 100000,
        branchName: 'high-trust-documentary',
      });
      mem = resolveActivation(mem, (at) => recoverySample(at + i * 100000));
    }
    const log = computeBranchActivationLog({ memory: mem });
    check('B · repeated successful recoveries raise reliability',
      log.historicalReliability >= 7 && log.branchTrustworthiness >= 7,
      `reliability=${log.historicalReliability} trustworthiness=${log.branchTrustworthiness}`);
  }

  // ── C. repeated failures lower branchTrustworthiness ─────────
  {
    let mem = createInitialBranchActivationMemory();
    for (let i = 0; i < 6; i++) {
      mem = appendRecord(mem, {
        activatedAt: 1700000000000 + i * 100000,
        branchName: 'aggressive-performance',
        counterfactualType: 'high-impact',
        predictedTrustImpact: -4,
        predictedFatigueImpact: 3,
        predictedDurabilityImpact: -4,
      });
      mem = resolveActivation(mem, (at) => failureSample(at + i * 100000));
    }
    const log = computeBranchActivationLog({ memory: mem });
    check('C · repeated failures lower branchTrustworthiness',
      log.branchTrustworthiness <= 4 &&
      log.failedBranchPatterns.some((f) => f.branchName === 'aggressive-performance'),
      `trustworthiness=${log.branchTrustworthiness} failed=${log.failedBranchPatterns.length}`);
  }

  // ── D. accurate projections raise predictionAccuracy ─────────
  {
    let mem = createInitialBranchActivationMemory();
    // Predicted trust positive AND reality validates positive trust → correct.
    for (let i = 0; i < 5; i++) {
      mem = appendRecord(mem, {
        activatedAt: 1700000000000 + i * 100000,
        counterfactualType: 'trust-optimal',
        predictedTrustImpact: 4,
        predictedDurabilityImpact: 4,
      });
      mem = resolveActivation(mem, (at) => recoverySample(at + i * 100000));
    }
    const log = computeBranchActivationLog({ memory: mem });
    const trustOpt = log.projectionAccuracy.find((p) => p.counterfactualType === 'trust-optimal');
    check('D · accurate projections raise predictionAccuracy',
      log.predictionAccuracy >= 7 && !!trustOpt && trustOpt.historicalAccuracy >= 7,
      `predictionAccuracy=${log.predictionAccuracy} trustOpt.accuracy=${trustOpt?.historicalAccuracy}`);
  }

  // ── E. operator repetition surfaces preference fingerprints ──
  {
    let mem = createInitialBranchActivationMemory();
    for (let i = 0; i < 5; i++) {
      mem = appendRecord(mem, {
        activatedAt: 1700000000000 + i * 100000,
        branchName: 'high-trust-documentary',
        operatorId: 'derin',
      });
      mem = resolveActivation(mem, (at) => recoverySample(at + i * 100000));
    }
    mem = appendRecord(mem, {
      activatedAt: 1700000000000 + 600000,
      branchName: 'novelty-surge',
      counterfactualType: 'high-impact',
      operatorId: 'derin',
      predictedTrustImpact: 0,
    });
    const log = computeBranchActivationLog({ memory: mem });
    const derin = log.operatorPatterns.find((op) => op.operatorType === 'derin');
    check('E · operator repetition surfaces preference fingerprints',
      !!derin &&
      derin.preferredBranches.includes('high-trust-documentary') &&
      derin.trustBias >= 7,
      derin ? `preferred=[${derin.preferredBranches.join(',')}] trustBias=${derin.trustBias}` : 'NOT FOUND');
  }

  // ── F. durable outcomes raise longTermStability ──────────────
  {
    let mem = createInitialBranchActivationMemory();
    for (let i = 0; i < 5; i++) {
      mem = appendRecord(mem, {
        activatedAt: 1700000000000 + i * 100000,
        branchName: 'premium-restraint',
      });
      mem = resolveActivation(mem, (at) => recoverySample(at + i * 100000));
    }
    const log = computeBranchActivationLog({ memory: mem });
    const row = log.branchOutcomes.find((b) => b.branchName === 'premium-restraint');
    check('F · durable outcomes raise longTermStability',
      !!row && row.longTermStability >= 7 &&
      log.durableBranchPatterns.some((d) => d.branchName === 'premium-restraint'),
      row ? `longTermStability=${row.longTermStability} durable=${log.durableBranchPatterns.length}` : 'NOT FOUND');
  }

  // ── G. failed branches populate warnings ─────────────────────
  {
    let mem = createInitialBranchActivationMemory();
    for (let i = 0; i < 4; i++) {
      mem = appendRecord(mem, {
        activatedAt: 1700000000000 + i * 100000,
        branchName: 'viral-instability',
        counterfactualType: 'high-impact',
        predictedTrustImpact: -3,
      });
      mem = resolveActivation(mem, (at) => failureSample(at + i * 100000));
    }
    const log = computeBranchActivationLog({ memory: mem });
    const viral = log.failedBranchPatterns.find((f) => f.branchName === 'viral-instability');
    check('G · failed branches populate warnings',
      !!viral && viral.severity >= 5 &&
      log.recommendedObservations.some((o) => o.includes('failed branch')),
      viral ? `severity=${viral.severity} obs=${log.recommendedObservations.length}` : 'NOT FOUND');
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'branch-activation-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodBranchActivation = undefined;
    const store = createBranchActivationMemoryStore(tmpDir);
    await store.reset();
    for (let i = 0; i < BRANCH_ACTIVATION_LIMIT + 20; i++) {
      await store.append({
        ...record({
          activatedAt: 1700000000000 + i,
          branchName: `branch-${i}`,
        }),
        id: `ba-${1700000000000 + i}-branch-${i}-studio-${i}`,
      });
    }
    const state = await store.read();
    check('H · FIFO cap stable at BRANCH_ACTIVATION_LIMIT',
      state.activations.length === BRANCH_ACTIVATION_LIMIT &&
      state.totalActivations === BRANCH_ACTIVATION_LIMIT + 20,
      `activations=${state.activations.length}/${BRANCH_ACTIVATION_LIMIT} total=${state.totalActivations}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodBranchActivation = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    let mem = createInitialBranchActivationMemory();
    mem = appendRecord(mem);
    mem = resolveActivation(mem, recoverySample);
    const before = JSON.stringify(mem);
    computeBranchActivationLog({ memory: mem });
    computeBranchActivationLog({ memory: mem });
    const after = JSON.stringify(mem);
    check('I · no runtime mutation — engine leaves memory unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/branchActivationLog.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/branchActivationMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/branchActivationLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in branch-activation sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/branchActivationLog.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/branchActivationMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/branchActivationLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in branch-activation sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialBranchActivationMemory();
    for (let i = 0; i < 4; i++) {
      mem = appendRecord(mem, {
        activatedAt: 1700000000000 + i * 100000,
        branchName: i % 2 === 0 ? 'high-trust-documentary' : 'premium-restraint',
      });
      mem = resolveActivation(mem, (at) => recoverySample(at + i * 100000));
    }
    const log = computeBranchActivationLog({ memory: mem });
    const v1 = buildBranchActivationLongitudinalView({ memory: mem, current: log });
    const v2 = buildBranchActivationLongitudinalView({ memory: mem, current: log });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(v1) === JSON.stringify(v2),
      `trusted×${v1.mostTrustedBranches.length} trend=${v1.trend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
