/**
 * scripts/verify-operator-calibration-reconciliation.ts
 *
 * Deterministic verification for the Operator Calibration Reconciliation
 * layer (observation-only relationship modeling).
 *
 *   A · same inputs → same reconciliation
 *   B · aligned operator + system → 'aligned' relationship
 *   C · operator high + system weak → 'historically-overconfident'
 *   D · operator low + system strong → 'historically-underconfident'
 *   E · trajectory shrinking → 'improving-alignment'
 *   F · trajectory volatile → 'unstable-intuition'
 *   G · reconciliation memory does not write back into operator or calibration memory
 *   H · FIFO snapshot cap stable
 *   I · no runtime mutation of input data
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-operator-calibration-reconciliation.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  computeOperatorCalibrationReconciliation,
} from '../lib/operatorCalibrationReconciliation';
import {
  applyReconciliationSnapshot, createInitialOperatorCalibrationReconciliationMemory,
  createOperatorCalibrationReconciliationMemoryStore, RECONCILIATION_SNAPSHOT_LIMIT,
  type ReconciliationSnapshot, type OperatorCalibrationReconciliationMemoryState,
  type DivergenceTracePoint,
} from '../lib/operatorCalibrationReconciliationMemory';
import {
  buildOperatorCalibrationReconciliationLongitudinalView,
} from '../lib/operatorCalibrationReconciliationView';
import type {
  ProjectionCalibration, ProjectionCalibrationReport,
} from '../lib/projectionCalibrationEngine';
import type { OperatorPreference, KnownProjectionType } from '../lib/operatorConfidencePreference';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('OPERATOR CALIBRATION RECONCILIATION — VERIFICATION\n');

// ─── helpers ──────────────────────────────────────────────────

function calibration(projectionType: string, over: Partial<ProjectionCalibration> = {}): ProjectionCalibration {
  return {
    projectionType,
    historicalAccuracy: 7,
    shortTermAccuracy: 7,
    longTermAccuracy: 7,
    overestimationBias: 0,
    underestimationBias: 0,
    trustCalibration: 7,
    fatigueCalibration: 7,
    durabilityCalibration: 7,
    sampleSize: 5,
    confidenceLevel: 7,
    environmentalSensitivity: {
      highFatigue: 0, lowTrust: 0, highNovelty: 0,
      stableAudience: 0, fragmentedAudience: 0,
    },
    calibrationAnnotations: [],
    predictionDrift: [],
    reasonCodes: [],
    ...over,
  };
}

function calibrationReport(calibrations: ProjectionCalibration[]): ProjectionCalibrationReport {
  return {
    overallConfidence: 7,
    overallAccuracy: 7,
    mostReliableProjectionType: calibrations[0]?.projectionType ?? null,
    leastReliableProjectionType: calibrations[calibrations.length - 1]?.projectionType ?? null,
    calibrations,
    reasonCodes: [],
  };
}

function pref(projectionType: KnownProjectionType, weight: number): OperatorPreference {
  return {
    operatorId: 'studio',
    projectionType,
    confidenceWeight: weight,
    reasonNote: null,
    updatedAt: 1700000000000,
  };
}

function memoryWithTrajectory(operatorId: string, projectionType: string, trajectory: DivergenceTracePoint[]): OperatorCalibrationReconciliationMemoryState {
  const state = createInitialOperatorCalibrationReconciliationMemory();
  return {
    ...state,
    perTypeTrajectory: { [`${operatorId}|${projectionType}`]: trajectory },
    totalSnapshots: 1,
  };
}

async function main() {
  // ── A. same inputs → same reconciliation ─────────────────────
  {
    const input = {
      operatorId: 'studio',
      calibrationReport: calibrationReport([calibration('trust-optimal', { historicalAccuracy: 7, confidenceLevel: 7 })]),
      operatorPreferences: [pref('trust-optimal', 70)],
    };
    const r1 = computeOperatorCalibrationReconciliation(input);
    const r2 = computeOperatorCalibrationReconciliation(input);
    check('A · same inputs → same reconciliation',
      JSON.stringify(r1) === JSON.stringify(r2),
      `overallAgreement=${r1.overallAgreement} reconciliations=${r1.reconciliations.length}`);
  }

  // ── B. aligned operator + system → 'aligned' ──────────────────
  {
    // operator 70% = 7.0, system confidence (avg of accuracy 7 + confidence 7) = 7.0
    const r = computeOperatorCalibrationReconciliation({
      operatorId: 'studio',
      calibrationReport: calibrationReport([calibration('trust-optimal',
        { historicalAccuracy: 7, confidenceLevel: 7 })]),
      operatorPreferences: [pref('trust-optimal', 70)],
    });
    const row = r.reconciliations.find((x) => x.projectionType === 'trust-optimal');
    check('B · aligned operator + system → aligned',
      !!row && row.relationshipType === 'aligned' && row.agreementLevel >= 9,
      row ? `relationship=${row.relationshipType} agreement=${row.agreementLevel}` : 'NOT FOUND');
  }

  // ── C. operator high + system weak → historically-overconfident
  {
    // operator 90% = 9.0, system accuracy 3 → operator trusts despite weak history
    const r = computeOperatorCalibrationReconciliation({
      operatorId: 'studio',
      calibrationReport: calibrationReport([calibration('novelty-led',
        { historicalAccuracy: 3, confidenceLevel: 4 })]),
      operatorPreferences: [pref('novelty-led', 90)],
    });
    const row = r.reconciliations.find((x) => x.projectionType === 'novelty-led');
    check('C · operator high + system weak → historically-overconfident',
      !!row && row.relationshipType === 'historically-overconfident' &&
      row.reconciliationAnnotations.some((a) => a.includes('despite weak historical accuracy')),
      row ? `relationship=${row.relationshipType}` : 'NOT FOUND');
  }

  // ── D. operator low + system strong → historically-underconfident
  {
    const r = computeOperatorCalibrationReconciliation({
      operatorId: 'studio',
      calibrationReport: calibrationReport([calibration('proof-led',
        { historicalAccuracy: 8, confidenceLevel: 8 })]),
      operatorPreferences: [pref('proof-led', 20)],
    });
    const row = r.reconciliations.find((x) => x.projectionType === 'proof-led');
    check('D · operator low + system strong → historically-underconfident',
      !!row && row.relationshipType === 'historically-underconfident' &&
      row.reconciliationAnnotations.some((a) => a.includes('despite strong historical accuracy')),
      row ? `relationship=${row.relationshipType}` : 'NOT FOUND');
  }

  // ── E. trajectory shrinking → improving-alignment ────────────
  {
    // Early deltas large, recent deltas small. system steady, operator
    // moves toward system over time.
    const trajectory: DivergenceTracePoint[] = [
      { timestamp: 1, system: 7, operator: 2, delta: -5 },
      { timestamp: 2, system: 7, operator: 3, delta: -4 },
      { timestamp: 3, system: 7, operator: 4, delta: -3 },
      { timestamp: 4, system: 7, operator: 6, delta: -1 },
      { timestamp: 5, system: 7, operator: 6.5, delta: -0.5 },
      { timestamp: 6, system: 7, operator: 7, delta: 0 },
    ];
    const mem = memoryWithTrajectory('studio', 'trust-optimal', trajectory);
    const r = computeOperatorCalibrationReconciliation({
      operatorId: 'studio',
      calibrationReport: calibrationReport([calibration('trust-optimal',
        { historicalAccuracy: 7, confidenceLevel: 7 })]),
      operatorPreferences: [pref('trust-optimal', 70)],
      reconciliationMemory: mem,
    });
    const row = r.reconciliations.find((x) => x.projectionType === 'trust-optimal');
    check('E · trajectory shrinking → improving-alignment',
      !!row && row.relationshipType === 'improving-alignment',
      row ? `relationship=${row.relationshipType}` : 'NOT FOUND');
  }

  // ── F. trajectory volatile → unstable-intuition ──────────────
  {
    const trajectory: DivergenceTracePoint[] = [
      { timestamp: 1, system: 5, operator: 9, delta: 4 },
      { timestamp: 2, system: 5, operator: 1, delta: -4 },
      { timestamp: 3, system: 5, operator: 9, delta: 4 },
      { timestamp: 4, system: 5, operator: 1, delta: -4 },
      { timestamp: 5, system: 5, operator: 9, delta: 4 },
      { timestamp: 6, system: 5, operator: 1, delta: -4 },
    ];
    const mem = memoryWithTrajectory('studio', 'fatigue-recovery', trajectory);
    const r = computeOperatorCalibrationReconciliation({
      operatorId: 'studio',
      calibrationReport: calibrationReport([calibration('fatigue-recovery',
        { historicalAccuracy: 5, confidenceLevel: 5 })]),
      operatorPreferences: [pref('fatigue-recovery', 50)],
      reconciliationMemory: mem,
    });
    const row = r.reconciliations.find((x) => x.projectionType === 'fatigue-recovery');
    check('F · trajectory volatile → unstable-intuition',
      !!row && row.relationshipType === 'unstable-intuition',
      row ? `relationship=${row.relationshipType}` : 'NOT FOUND');
  }

  // ── G. reconciliation never writes to operator/calibration memory
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliation.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliationMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliationView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    // Reconciliation must not invoke the WRITE/UPDATE methods of
    // operator preference or projection calibration stores.
    const writeOperatorPref =
      /createOperatorConfidencePreferenceMemoryStore\s*\([^)]*\)[\s\S]{0,200}?\.(update|save|reset)/i.test(combined);
    const writeCalibration =
      /createProjectionCalibrationMemoryStore\s*\([^)]*\)[\s\S]{0,200}?\.(append|save|reset)/i.test(combined);
    check('G · reconciliation does not write back into operator or calibration memory',
      !writeOperatorPref && !writeCalibration,
      !writeOperatorPref && !writeCalibration ? 'verified clean' :
        `writeOperatorPref=${writeOperatorPref} writeCalibration=${writeCalibration}`);
  }

  // ── H. FIFO snapshot cap stable ──────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ocr-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodOperatorCalibrationReconciliation = undefined;
    const store = createOperatorCalibrationReconciliationMemoryStore(tmpDir);
    await store.reset();
    for (let i = 0; i < RECONCILIATION_SNAPSHOT_LIMIT + 20; i++) {
      const snap: ReconciliationSnapshot = {
        at: 1700000000000 + i,
        bannerId: `h-${i}`,
        operatorId: 'studio',
        perTypeSummary: {
          'trust-optimal': { system: 7, operator: 6, agreement: 9, relationship: 'aligned' },
        },
      };
      await store.append(snap);
    }
    const state = await store.read();
    check('H · FIFO cap stable at RECONCILIATION_SNAPSHOT_LIMIT',
      state.snapshots.length === RECONCILIATION_SNAPSHOT_LIMIT &&
      state.totalSnapshots === RECONCILIATION_SNAPSHOT_LIMIT + 20,
      `snapshots=${state.snapshots.length}/${RECONCILIATION_SNAPSHOT_LIMIT} total=${state.totalSnapshots}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodOperatorCalibrationReconciliation = undefined;
  }

  // ── I. no runtime mutation of inputs ─────────────────────────
  {
    const input = {
      operatorId: 'studio',
      calibrationReport: calibrationReport([calibration('trust-optimal')]),
      operatorPreferences: [pref('trust-optimal', 70)],
    };
    const before = JSON.stringify(input);
    computeOperatorCalibrationReconciliation(input);
    computeOperatorCalibrationReconciliation(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliation.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliationMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliationView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in reconciliation sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliation.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliationMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorCalibrationReconciliationView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in reconciliation sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialOperatorCalibrationReconciliationMemory();
    for (let i = 0; i < 4; i++) {
      mem = applyReconciliationSnapshot(mem, {
        at: 1700000000000 + i * 1000,
        bannerId: `l-${i}`,
        operatorId: 'studio',
        perTypeSummary: {
          'trust-optimal': { system: 7, operator: 6 + i * 0.3, agreement: 9 - i * 0.3, relationship: 'aligned' },
        },
      });
    }
    const v1 = buildOperatorCalibrationReconciliationLongitudinalView({ memory: mem, operatorId: 'studio' });
    const v2 = buildOperatorCalibrationReconciliationLongitudinalView({ memory: mem, operatorId: 'studio' });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(v1) === JSON.stringify(v2),
      `divergenceHeatmap×${v1.divergenceHeatmap.length} trend=${v1.trend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
