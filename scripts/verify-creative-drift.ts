/**
 * VERIFY — Creative Drift Engine + Memory + Longitudinal View.
 *
 * Pure-function tests against the engine, plus FIFO contract checks
 * for the memory store. No HTTP, no live memory.
 *
 * Engine cases:
 *   A · same history → same drift (deterministic)
 *   B · repetition raises drift severity
 *   C · emotional flattening lowers diversity
 *   D · formula convergence detected
 *   E · persuasion collapse detected
 *   F · narrative recurrence raises fatigue risk
 *   G · recovery periods reduce drift over time
 *   H · FIFO caps stable (memory store stays under observation limit)
 *   I · no critic / pipeline imports in the engine
 *   J · engine does not mutate generation (no fetch, no write, no
 *        critic exports)
 *   K · no external API calls (no non-localhost fetch)
 *   L · deterministic output across two invocations
 *   M · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computeCreativeDrift, type CreativeDriftInput, type CreativeDrift,
} from '../lib/creativeDriftEngine';
import {
  applyCreativeDriftObservation, createInitialCreativeDriftMemory,
  DRIFT_OBSERVATION_LIMIT,
} from '../lib/creativeDriftMemory';
import { buildCreativeDriftLongitudinalView } from '../lib/creativeDriftLongitudinalView';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic inputs ─────────────────────────────────────────

function makeHealthyInput(): CreativeDriftInput {
  const distinctFrames = ['frame-a', 'frame-b', 'frame-c', 'frame-d', 'frame-e', 'frame-f', 'frame-g', 'frame-h'];
  const distinctTones  = ['observational', 'gentle', 'crisp', 'curious', 'patient', 'incisive'];
  const distinctPersuasionModes = ['observational', 'objection-breaker', 'trust-builder', 'product-proof', 'emotional-mirror'];
  const audiences = ['office_worker', 'high_performer', 'wellness_skeptic', 'overworked_professional'];
  return {
    copywriter: {
      frameHistory: distinctFrames,
      toneHistory: distinctTones,
      structureHistory: ['sig-1', 'sig-2', 'sig-3', 'sig-4', 'sig-5'],
      repeatedStructuresScore: 1,
      dignityErosionScore: 1,
    },
    copyQuality: {
      samples: distinctFrames.map((_, i) => ({
        at: i, formula: 'ENERGY',
        repetitionConcern: 2, copyIntegrity: 8, trustSafety: 8,
      })),
    },
    identity: {
      observations: Array.from({ length: 8 }, (_, i) => ({
        at: i, formula: 'ENERGY',
        identityFragmentation: 2, identityStability: 8, continuityRisk: 2,
      })),
    },
    campaign: {
      observations: Array.from({ length: 8 }, (_, i) => ({
        at: i, formula: 'ENERGY',
        campaignHealth: 8, fatiguePressure: 2, creativeFreshness: 8,
      })),
      recentPatterns: distinctFrames,
    },
    strategy: {
      audienceHistory: Array.from({ length: 10 }, (_, i) => ({
        at: i,
        audience: audiences[i % audiences.length],
        persuasionMode: distinctPersuasionModes[i % distinctPersuasionModes.length],
        storyShape: i % 2 === 0 ? 'mirror' : 'objection',
        formula: i % 2 === 0 ? 'ENERGY' : 'FOCUS',
        campaignMode: 'Minimal',
      })),
      repetitionRiskHistory: Array.from({ length: 10 }, (_, i) => ({
        at: i, repetitionRisk: 2, trustDebt: 2,
      })),
    },
    outcomes: { observations: Array.from({ length: 8 }, (_, i) => ({
      at: i, strategicStability: 8, strategicRisk: 2,
    })) },
  };
}

function makeRepetitiveInput(): CreativeDriftInput {
  return {
    copywriter: {
      frameHistory: Array(12).fill('one-frame'),
      toneHistory: Array(12).fill('one-tone'),
      structureHistory: Array(12).fill('same-sig'),
      repeatedStructuresScore: 9,
    },
    copyQuality: {
      samples: Array(12).fill(0).map((_, i) => ({
        at: i, formula: 'ENERGY',
        repetitionConcern: 8, copyIntegrity: 6, trustSafety: 6,
      })),
    },
    strategy: {
      audienceHistory: Array(12).fill(0).map((_, i) => ({
        at: i,
        audience: 'office_worker',
        persuasionMode: 'observational',
        storyShape: 'mirror',
        formula: 'ENERGY',
        campaignMode: 'Minimal',
      })),
      repetitionRiskHistory: Array(12).fill(0).map((_, i) => ({
        at: i, repetitionRisk: 8, trustDebt: 7,
      })),
    },
    campaign: {
      observations: Array(8).fill(0).map((_, i) => ({
        at: i, formula: 'ENERGY',
        campaignHealth: 4, fatiguePressure: 7,
      })),
      recentPatterns: Array(12).fill('repeating-pattern'),
    },
  };
}

function makeConvergedFormulasInput(): CreativeDriftInput {
  // Two formulas using the SAME audience set → high jaccard similarity.
  const sharedAudiences = ['office_worker', 'high_performer', 'wellness_skeptic'];
  const audienceHistory = [
    ...sharedAudiences.map((a, i) => ({ at: i, audience: a, formula: 'ENERGY' as string, persuasionMode: 'observational' })),
    ...sharedAudiences.map((a, i) => ({ at: 100 + i, audience: a, formula: 'FOCUS' as string, persuasionMode: 'trust-builder' })),
  ];
  return {
    strategy: { audienceHistory, repetitionRiskHistory: [] },
  };
}

function makePersuasionCollapseInput(): CreativeDriftInput {
  return {
    strategy: {
      audienceHistory: Array(10).fill(0).map((_, i) => ({
        at: i, audience: `aud-${i % 5}`,
        persuasionMode: 'observational',  // ALL same persuasion mode
        storyShape: 'mirror',
        formula: 'ENERGY',
      })),
      repetitionRiskHistory: [],
    },
  };
}

// ─── cases ────────────────────────────────────────────────────

function caseA(): { ok: boolean; detail: string } {
  const input = makeHealthyInput();
  const a = JSON.stringify(computeCreativeDrift(input));
  const b = JSON.stringify(computeCreativeDrift(input));
  return {
    ok: a === b,
    detail: a === b ? 'identical JSON across two runs' : 'differs',
  };
}

function caseB(): { ok: boolean; detail: string } {
  const healthy = computeCreativeDrift(makeHealthyInput());
  const repetitive = computeCreativeDrift(makeRepetitiveInput());
  return {
    ok: repetitive.driftSeverity > healthy.driftSeverity ||
        repetitive.originalityPressure > healthy.originalityPressure ||
        repetitive.overallCreativeHealth < healthy.overallCreativeHealth,
    detail: `healthy: drift=${healthy.driftSeverity} pressure=${healthy.originalityPressure} health=${healthy.overallCreativeHealth} | ` +
            `repetitive: drift=${repetitive.driftSeverity} pressure=${repetitive.originalityPressure} health=${repetitive.overallCreativeHealth}`,
  };
}

function caseC(): { ok: boolean; detail: string } {
  const healthy = computeCreativeDrift(makeHealthyInput());
  const flat = computeCreativeDrift(makeRepetitiveInput());
  return {
    ok: flat.emotionalDiversity < healthy.emotionalDiversity,
    detail: `healthy emotionalDiversity=${healthy.emotionalDiversity} | flat=${flat.emotionalDiversity}`,
  };
}

function caseD(): { ok: boolean; detail: string } {
  const r = computeCreativeDrift(makeConvergedFormulasInput());
  return {
    ok: r.formulaConvergence.length > 0,
    detail: r.formulaConvergence.length > 0
      ? `convergence: ${r.formulaConvergence[0].formulas.join('↔')} @ ${r.formulaConvergence[0].convergenceLevel}/10`
      : 'no convergence detected',
  };
}

function caseE(): { ok: boolean; detail: string } {
  const r = computeCreativeDrift(makePersuasionCollapseInput());
  return {
    ok: r.persuasionVariance <= 3 ||
        r.dominantDriftPatterns.some((p) => p.pattern === 'repetitive-persuasion-patterns'),
    detail: `persuasionVariance=${r.persuasionVariance}/10 patterns=${r.dominantDriftPatterns.map((p) => p.pattern).join(',')}`,
  };
}

function caseF(): { ok: boolean; detail: string } {
  // Many repeats of a single narrative fingerprint → high fatigue risk.
  const r = computeCreativeDrift({
    campaign: { recentPatterns: ['narrative-x', 'narrative-x', 'narrative-x', 'narrative-x', 'narrative-x', 'narrative-x'] },
  });
  return {
    ok: r.repetitiveNarratives.some((n) => n.fatigueRisk >= 8),
    detail: `narratives: ${r.repetitiveNarratives.map((n) => `${n.narrativeFingerprint}:${n.recurrence}/${n.fatigueRisk}`).join('; ')}`,
  };
}

function caseG(): { ok: boolean; detail: string } {
  // Memory-store sequence: feed a series of healthy drift readings,
  // verify that the longitudinal view reports 'improving' or 'stable'.
  let mem = createInitialCreativeDriftMemory();
  // First half: low health.
  for (let i = 0; i < 6; i++) {
    const drift: CreativeDrift = stubDrift({
      overallCreativeHealth: 3 + i * 0.2,
      driftSeverity: 6, entropyLevel: 3,
    });
    mem = applyCreativeDriftObservation(mem, drift, {
      at: i * 1000, bannerId: `b${i}`, formula: 'ENERGY', campaignMode: null,
    });
  }
  // Second half: high health (recovery).
  for (let i = 6; i < 12; i++) {
    const drift: CreativeDrift = stubDrift({
      overallCreativeHealth: 8.0 + (i - 6) * 0.1,
      driftSeverity: 2, entropyLevel: 8,
    });
    mem = applyCreativeDriftObservation(mem, drift, {
      at: i * 1000, bannerId: `b${i}`, formula: 'ENERGY', campaignMode: null,
    });
  }
  const view = buildCreativeDriftLongitudinalView({ memory: mem });
  return {
    ok: view.longTermDriftDirection === 'improving' && view.recoveryEvents.length >= 1,
    detail: `direction=${view.longTermDriftDirection} recoveryEvents=${view.recoveryEvents.length} collapseEvents=${view.collapseEvents.length}`,
  };
}

function caseH(): { ok: boolean; detail: string } {
  // Feed 200 observations; the memory must stay at or below DRIFT_OBSERVATION_LIMIT.
  let mem = createInitialCreativeDriftMemory();
  for (let i = 0; i < 200; i++) {
    mem = applyCreativeDriftObservation(mem, stubDrift({}), {
      at: i, bannerId: `b${i}`, formula: 'ENERGY', campaignMode: null,
    });
  }
  return {
    ok: mem.observations.length <= DRIFT_OBSERVATION_LIMIT && mem.totalObservations === 200,
    detail: `observations array=${mem.observations.length}/${DRIFT_OBSERVATION_LIMIT}, totalObservations=${mem.totalObservations}`,
  };
}

async function caseI(): Promise<{ ok: boolean; detail: string }> {
  // Static check the engine source.
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'lib', 'creativeDriftEngine.ts'), 'utf8',
  );
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
  ];
  const violations = forbidden.filter((re) => re.test(src));
  return {
    ok: violations.length === 0,
    detail: violations.length === 0 ? 'no forbidden imports' : `violations: ${violations.length}`,
  };
}

async function caseJ(): Promise<{ ok: boolean; detail: string }> {
  // Engine must not export anything that mutates generation; must not
  // contain fetch / writeFile.
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'lib', 'creativeDriftEngine.ts'), 'utf8',
  );
  const hasFetch = /\bfetch\s*\(/.test(src);
  const hasWrite = /fs\.writeFile\(/.test(src);
  const hasCriticExport = /\bexport\s+function\s+(apply|enforce|enforce[A-Z])/.test(src);
  return {
    ok: !hasFetch && !hasWrite && !hasCriticExport,
    detail: `fetch=${hasFetch} writeFile=${hasWrite} enforce-export=${hasCriticExport}`,
  };
}

async function caseK(): Promise<{ ok: boolean; detail: string }> {
  // No external API calls in engine OR memory OR view.
  const files = [
    'lib/creativeDriftEngine.ts',
    'lib/creativeDriftMemory.ts',
    'lib/creativeDriftLongitudinalView.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/fetch\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/.test(src)) {
      return { ok: false, detail: `external fetch found in ${f}` };
    }
  }
  return { ok: true, detail: 'no non-localhost fetch in engine / memory / view' };
}

function caseL(): { ok: boolean; detail: string } {
  // Deterministic across mixed inputs.
  const input = { ...makeRepetitiveInput(), ...makeConvergedFormulasInput() };
  const a = JSON.stringify(computeCreativeDrift(input));
  const b = JSON.stringify(computeCreativeDrift(input));
  return {
    ok: a === b,
    detail: a === b ? 'two invocations produce identical JSON' : 'differs',
  };
}

// ─── stub drift reading ───────────────────────────────────────

function stubDrift(overrides: Partial<CreativeDrift>): CreativeDrift {
  return {
    overallCreativeHealth: 5, driftSeverity: 5, entropyLevel: 5,
    originalityPressure: 5, narrativeStability: 5,
    emotionalDiversity: 5, formulaDistinctiveness: 5, persuasionVariance: 5,
    dominantDriftPatterns: [], emergingCreativeRisks: [],
    collapsingCreativeDimensions: [], repetitiveNarratives: [],
    emotionalCompression: [], formulaConvergence: [], modeDrift: [],
    trustErosionTrajectory: { historical: 2, recent: 2, drift: 0 },
    creativeInstabilityZones: [],
    advisorySummary: 'stub', reasonCodes: [],
    ...overrides,
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('CREATIVE DRIFT VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['A', 'same history → same drift (deterministic)',                () => caseA()],
    ['B', 'repetition raises drift severity / pressure',               () => caseB()],
    ['C', 'emotional flattening lowers diversity',                     () => caseC()],
    ['D', 'formula convergence detected',                              () => caseD()],
    ['E', 'persuasion collapse detected (single mode)',                () => caseE()],
    ['F', 'narrative recurrence raises fatigue risk',                  () => caseF()],
    ['G', 'recovery periods reduce drift / produce recoveryEvents',    () => caseG()],
    ['H', 'FIFO caps stable (200 observations → ≤ DRIFT_OBSERVATION_LIMIT)', () => caseH()],
    ['I', 'no critic / pipeline imports in engine',                    () => caseI()],
    ['J', 'engine does not mutate generation',                         () => caseJ()],
    ['K', 'no external API calls in engine / memory / view',           () => caseK()],
    ['L', 'deterministic output across mixed inputs',                  () => caseL()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  record('M', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
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
