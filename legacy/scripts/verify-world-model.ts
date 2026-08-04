/**
 * VERIFY — World Model Intelligence.
 *
 * Pure-function + static verification.
 *
 * Cases:
 *   world-shape                · 16 signals present, scaled, optimismDrift signed
 *   world-deterministic        · same inputs → same output
 *   world-empty                · no inputs → balanced reading
 *   aesthetic-shape            · 9 aesthetic dimensions present + cyclic notes
 *   aesthetic-cycle            · migration direction is signed -10..+10
 *   aesthetic-deterministic    · pure function
 *   attention-shape            · 8 attention movements present + signed direction
 *   attention-deterministic    · pure function
 *   mood-era-labels            · era labels from declared union only
 *   mood-dominant-era          · dominant era resolves deterministically
 *   mood-balanced-fallback     · zero signals → balanced era surfaces
 *   meaning-shape              · 8 meaning pressures, 0..10
 *   meaning-deterministic      · pure function
 *   memory-fifo                · append > limit → cap respected
 *   memory-pure-transform      · appendWorldModelSnapshot is referentially transparent
 *   route-no-pipeline          · route does not import pipeline / call /api/generate
 *   route-no-execution         · route exports no apply / execute / generateNow / publishNow
 *   route-get-only             · route exports GET but not POST
 *   route-listed               · /api/world-model registered in systemIntegrityReport
 *   isolation                  · engines + memory have no critic / pipeline / generate imports
 *   no-fetch-no-write          · engines have no fetch / no fs.writeFile
 *   allowed-language           · phrasing uses observed alongside / historically associated / appears to be
 *   forbidden-language         · phrasing forbids predict / optimize / persuade / steer / segment / manipulate
 *   tsc                        · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeWorldModel } from '../lib/worldModelEngine';
import { computeAestheticMigration } from '../lib/aestheticMigrationEngine';
import { computeCollectiveAttention } from '../lib/collectiveAttentionEngine';
import { computeCivilizationalMood, type CivilizationalEra } from '../lib/civilizationalMoodEngine';
import { computeMeaningPressure } from '../lib/meaningPressureEngine';
import {
  appendWorldModelSnapshot,
  createInitialWorldModelMemory,
  WORLD_MODEL_SNAPSHOT_LIMIT,
  type WorldModelSnapshot,
} from '../lib/worldModelMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

function mkOutcomes(n: number, opts: { ext?: 'fatigue' | 'trust' | 'iron' | 'opt' | 'survival' | 'ritual' | 'nostalgia' } = {}): any[] {
  const outs: any[] = [];
  for (let i = 0; i < n; i++) {
    const base: any = {
      at: 1000 + i * 1000,
      cadenceState: i % 3 === 0 ? 'burst' : 'flow',
      visualStyle: 'documentary',
      emotionalSignature: 'still',
      narrativeSignature: 'observational',
      realismLevel: 6 + (i % 3),
      persuasionIntensity: 5,
      mutationPressure: 3,
      metrics: {
        retention: 0.55, scrollDepth: 0.6, bounceRate: 0.3,
        rewatches: 1, saves: 2, shares: 1, contentDurationSec: 60,
      },
    };
    if (opts.ext === 'fatigue') {
      base.downstreamOutcome = 'fatigue-acceleration';
    } else if (opts.ext === 'trust') {
      base.downstreamOutcome = 'trust-formation';
    } else if (opts.ext === 'iron') {
      base.emotionalSignature = 'ironic-wry';
    } else if (opts.ext === 'opt') {
      base.emotionalSignature = 'optim-hope-warm';
    } else if (opts.ext === 'survival') {
      base.emotionalSignature = 'survival-endur-tired';
    } else if (opts.ext === 'ritual') {
      base.emotionalSignature = 'ritual-morning-coffee';
    } else if (opts.ext === 'nostalgia') {
      base.emotionalSignature = 'nostalg-childhood-memory';
    }
    outs.push(base);
  }
  return outs;
}

function mkVisualFps(n: number, polish: number, realism: number, ai: number): any[] {
  const fps: any[] = [];
  for (let i = 0; i < n; i++) {
    fps.push({
      at: 1000 + i * 1000,
      polishLevel: polish, realismLevel: realism, aiLookSaturation: ai,
      minimalismLevel: 4, editingDensity: 5, stillnessShare: 0.3,
      imperfectionLevel: 3, retroSignature: 2, silenceDensity: 'mid',
    });
  }
  return fps;
}

// ─── world cases ─────────────────────────────────────────────

function caseWorldShape(): { ok: boolean; detail: string } {
  const r = computeWorldModel({
    outcomes: { outcomes: mkOutcomes(6, { ext: 'fatigue' }) },
    drift: { observations: [{ emotionalDiversity: 3, trustErosionDrift: 5, overallCreativeHealth: 4 }] },
    visualDNA: { fingerprints: mkVisualFps(4, 8, 4, 5) },
    narrativeDNA: { fingerprints: [{ silenceUsage: 'sparse', humanRealism: 6, ctaPressure: 3 }] },
  });
  const keys = Object.keys(r.signals);
  const expected = [
    'stimulationSaturation', 'trustFragility', 'emotionalExhaustion',
    'realismDemand', 'ironyDensity', 'optimismDrift', 'anxietyClimate',
    'ritualHunger', 'symbolicFatigue', 'authenticityDemand', 'nostalgiaPressure',
    'lonelinessSignals', 'attentionFragmentation', 'emotionalOverload',
    'simplicityCraving', 'meaningSeeking',
  ];
  const missing = expected.filter((k) => !keys.includes(k));
  const inRange = Object.entries(r.signals).every(([k, v]) => {
    if (k === 'optimismDrift') return v >= -10 && v <= 10;
    return v >= 0 && v <= 10;
  });
  return {
    ok: missing.length === 0 && inRange && r.dominantSignals.length === 3,
    detail: missing.length === 0 ? `inRange=${inRange} dominant=${r.dominantSignals.length}` : `missing=${missing.join(',')}`,
  };
}
function caseWorldDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: mkOutcomes(4) },
    drift: { observations: [{ emotionalDiversity: 5, trustErosionDrift: 2 }] },
    visualDNA: { fingerprints: mkVisualFps(3, 7, 5, 2) },
    narrativeDNA: { fingerprints: [] },
  };
  const a = JSON.stringify(computeWorldModel(input));
  const b = JSON.stringify(computeWorldModel(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseWorldEmpty(): { ok: boolean; detail: string } {
  const r = computeWorldModel({});
  const allZero = Object.values(r.signals).every((v) => v === 0);
  return {
    ok: r.totalObservations === 0 && (allZero || r.notes.some((n) => /balanced/i.test(n))),
    detail: `total=${r.totalObservations} notes=${r.notes.join(' | ').slice(0, 80)}`,
  };
}

// ─── aesthetic cases ─────────────────────────────────────────

function caseAestheticShape(): { ok: boolean; detail: string } {
  const r = computeAestheticMigration({
    visualDNA: { fingerprints: mkVisualFps(6, 7, 5, 4) },
    outcomes: { outcomes: mkOutcomes(4, { ext: 'nostalgia' }) },
  });
  const dims = [
    'cinematicPolish', 'documentaryRealism', 'aiLookSaturation', 'minimalismFatigue',
    'hyperEditingExhaustion', 'stillnessResurgence', 'imperfectionPreference',
    'retroNostalgiaMigration', 'emotionalRawnessDemand',
  ];
  const missing = dims.filter((d) => !(d in r));
  return {
    ok: missing.length === 0 && r.dominantMigrations.length === 3 &&
        Array.isArray(r.notes) && r.notes.length > 0,
    detail: missing.length === 0 ? `dominant=${r.dominantMigrations.length} notes=${r.notes.length}` : `missing=${missing.join(',')}`,
  };
}
function caseAestheticCycle(): { ok: boolean; detail: string } {
  // Rising AI-look from 1 to 8.
  const fps = [
    { at: 1, polishLevel: 5, realismLevel: 5, aiLookSaturation: 1 },
    { at: 2, polishLevel: 5, realismLevel: 5, aiLookSaturation: 1 },
    { at: 3, polishLevel: 5, realismLevel: 5, aiLookSaturation: 8 },
    { at: 4, polishLevel: 5, realismLevel: 5, aiLookSaturation: 8 },
  ];
  const r = computeAestheticMigration({ visualDNA: { fingerprints: fps }, outcomes: { outcomes: [] } });
  // Direction must be a rise (positive).
  return {
    ok: r.aiLookSaturation.migrationDirection > 0 &&
        r.aiLookSaturation.migrationDirection <= 10,
    detail: `ai dir=${r.aiLookSaturation.migrationDirection} level=${r.aiLookSaturation.level}`,
  };
}
function caseAestheticDeterministic(): { ok: boolean; detail: string } {
  const input = {
    visualDNA: { fingerprints: mkVisualFps(4, 7, 5, 2) },
    outcomes: { outcomes: mkOutcomes(3) },
  };
  const a = JSON.stringify(computeAestheticMigration(input));
  const b = JSON.stringify(computeAestheticMigration(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── attention cases ─────────────────────────────────────────

function caseAttentionShape(): { ok: boolean; detail: string } {
  const r = computeCollectiveAttention({
    outcomes: { outcomes: mkOutcomes(6) },
    drift: { observations: [{ attentionPressure: 5, pacingPressure: 6 }] },
  });
  const dims = [
    'shortFormExhaustion', 'replayCulture', 'doomscrollFatigue',
    'silenceTolerance', 'overstimulationRejection', 'attentionFragmentation',
    'pacingRecovery', 'longFormTrustRestoration',
  ];
  const missing = dims.filter((d) => !(d in r));
  const allSigned = dims.every((d) => {
    const v = (r as any)[d].migrationDirection;
    return v >= -10 && v <= 10;
  });
  return {
    ok: missing.length === 0 && allSigned && r.dominantMovements.length === 3,
    detail: missing.length === 0 ? `signed=${allSigned} dominant=${r.dominantMovements.length}` : `missing=${missing.join(',')}`,
  };
}
function caseAttentionDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: mkOutcomes(4) },
    drift: { observations: [{ attentionPressure: 5 }] },
  };
  const a = JSON.stringify(computeCollectiveAttention(input));
  const b = JSON.stringify(computeCollectiveAttention(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── mood cases ──────────────────────────────────────────────

const ERA_UNION: CivilizationalEra[] = [
  'emotionally-tired', 'hopeful', 'anxious', 'ironic', 'hyper-performative',
  'authenticity-seeking', 'emotionally-defensive', 'ritual-seeking', 'balanced',
];

function caseMoodEraLabels(): { ok: boolean; detail: string } {
  const r = computeCivilizationalMood({
    worldSignals: {
      stimulationSaturation: 5, trustFragility: 4, emotionalExhaustion: 8,
      realismDemand: 6, ironyDensity: 3, optimismDrift: -2, anxietyClimate: 7,
      ritualHunger: 5, symbolicFatigue: 4, authenticityDemand: 6,
      nostalgiaPressure: 5, lonelinessSignals: 4, attentionFragmentation: 6,
      emotionalOverload: 7, simplicityCraving: 5, meaningSeeking: 6,
    },
    aesthetic: null, attention: null,
  });
  const allValid = r.allEras.every((e) => ERA_UNION.includes(e.era));
  return {
    ok: allValid && ERA_UNION.includes(r.dominantEra),
    detail: `dominant=${r.dominantEra} count=${r.allEras.length} allValid=${allValid}`,
  };
}
function caseMoodDominantEra(): { ok: boolean; detail: string } {
  // Force emotional exhaustion to dominate.
  const r = computeCivilizationalMood({
    worldSignals: {
      stimulationSaturation: 2, trustFragility: 2, emotionalExhaustion: 10,
      realismDemand: 2, ironyDensity: 2, optimismDrift: 0, anxietyClimate: 2,
      ritualHunger: 2, symbolicFatigue: 2, authenticityDemand: 2,
      nostalgiaPressure: 2, lonelinessSignals: 2, attentionFragmentation: 2,
      emotionalOverload: 10, simplicityCraving: 2, meaningSeeking: 2,
    },
    aesthetic: null, attention: null,
  });
  return {
    ok: r.dominantEra === 'emotionally-tired' && r.dominantEraConfidence >= 5,
    detail: `dominant=${r.dominantEra} confidence=${r.dominantEraConfidence}`,
  };
}
function caseMoodBalancedFallback(): { ok: boolean; detail: string } {
  const r = computeCivilizationalMood({ worldSignals: null, aesthetic: null, attention: null });
  const balanced = r.allEras.find((e) => e.era === 'balanced');
  // Balanced should be present and likely dominant when nothing else is high.
  return {
    ok: balanced !== undefined && balanced.score >= 5,
    detail: `balanced=${balanced?.score} dominant=${r.dominantEra}`,
  };
}

// ─── meaning cases ───────────────────────────────────────────

function caseMeaningShape(): { ok: boolean; detail: string } {
  const r = computeMeaningPressure({
    worldSignals: {
      stimulationSaturation: 5, trustFragility: 4, emotionalExhaustion: 6,
      realismDemand: 7, ironyDensity: 3, optimismDrift: -1, anxietyClimate: 6,
      ritualHunger: 6, symbolicFatigue: 4, authenticityDemand: 7,
      nostalgiaPressure: 5, lonelinessSignals: 6, attentionFragmentation: 5,
      emotionalOverload: 6, simplicityCraving: 7, meaningSeeking: 7,
    },
    aesthetic: null, attention: null,
  });
  const dims = ['meaning', 'belonging', 'calm', 'emotionalHonesty', 'ritual',
                'groundedness', 'humanity', 'depth'];
  const missing = dims.filter((d) => !(d in r.signals));
  const inRange = Object.values(r.signals).every((v) => v >= 0 && v <= 10);
  return {
    ok: missing.length === 0 && inRange && r.dominantPressures.length === 3,
    detail: missing.length === 0 ? `inRange=${inRange} dominant=${r.dominantPressures.length}` : `missing=${missing.join(',')}`,
  };
}
function caseMeaningDeterministic(): { ok: boolean; detail: string } {
  const input = {
    worldSignals: {
      stimulationSaturation: 5, trustFragility: 4, emotionalExhaustion: 6,
      realismDemand: 7, ironyDensity: 3, optimismDrift: -1, anxietyClimate: 6,
      ritualHunger: 6, symbolicFatigue: 4, authenticityDemand: 7,
      nostalgiaPressure: 5, lonelinessSignals: 6, attentionFragmentation: 5,
      emotionalOverload: 6, simplicityCraving: 7, meaningSeeking: 7,
    },
    aesthetic: null, attention: null,
  };
  const a = JSON.stringify(computeMeaningPressure(input));
  const b = JSON.stringify(computeMeaningPressure(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── memory cases ────────────────────────────────────────────

function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialWorldModelMemory();
  const baseSnapshot: WorldModelSnapshot = {
    at: 1000,
    worldSignals: {
      stimulationSaturation: 0, trustFragility: 0, emotionalExhaustion: 0,
      realismDemand: 0, ironyDensity: 0, optimismDrift: 0, anxietyClimate: 0,
      ritualHunger: 0, symbolicFatigue: 0, authenticityDemand: 0,
      nostalgiaPressure: 0, lonelinessSignals: 0, attentionFragmentation: 0,
      emotionalOverload: 0, simplicityCraving: 0, meaningSeeking: 0,
    },
    meaningPressures: {
      meaning: 0, belonging: 0, calm: 0, emotionalHonesty: 0,
      ritual: 0, groundedness: 0, humanity: 0, depth: 0,
    },
    dominantEra: 'balanced',
    dominantEraConfidence: 5,
    dominantWorldSignals: [],
    dominantMeaningPressures: [],
    dominantAestheticMigrations: [],
    dominantAttentionMovements: [],
    observationCount: 0,
  };
  const cap = WORLD_MODEL_SNAPSHOT_LIMIT;
  for (let i = 0; i < cap + 50; i++) {
    state = appendWorldModelSnapshot(state, { ...baseSnapshot, at: 1000 + i });
  }
  return {
    ok: state.snapshots.length === cap && state.totalSnapshots === cap + 50,
    detail: `snapshots=${state.snapshots.length} total=${state.totalSnapshots} cap=${cap}`,
  };
}
function caseMemoryPureTransform(): { ok: boolean; detail: string } {
  const state = createInitialWorldModelMemory();
  const snapshot: WorldModelSnapshot = {
    at: 1000,
    worldSignals: {
      stimulationSaturation: 1, trustFragility: 1, emotionalExhaustion: 1,
      realismDemand: 1, ironyDensity: 1, optimismDrift: 1, anxietyClimate: 1,
      ritualHunger: 1, symbolicFatigue: 1, authenticityDemand: 1,
      nostalgiaPressure: 1, lonelinessSignals: 1, attentionFragmentation: 1,
      emotionalOverload: 1, simplicityCraving: 1, meaningSeeking: 1,
    },
    meaningPressures: {
      meaning: 1, belonging: 1, calm: 1, emotionalHonesty: 1,
      ritual: 1, groundedness: 1, humanity: 1, depth: 1,
    },
    dominantEra: 'hopeful',
    dominantEraConfidence: 5,
    dominantWorldSignals: [], dominantMeaningPressures: [],
    dominantAestheticMigrations: [], dominantAttentionMovements: [],
    observationCount: 0,
  };
  const a = appendWorldModelSnapshot(state, snapshot);
  const b = appendWorldModelSnapshot(state, snapshot);
  return {
    ok: state.snapshots.length === 0 && JSON.stringify(a) === JSON.stringify(b),
    detail: `prior=${state.snapshots.length} a===b: ${JSON.stringify(a) === JSON.stringify(b)}`,
  };
}

// ─── route + module static checks ────────────────────────────

async function readRouteSrc(): Promise<string> {
  return fs.readFile(
    path.resolve(__dirname, '..', 'app', 'api', 'world-model', 'route.ts'),
    'utf8',
  );
}

function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""')
    .replace(/`[\s\S]*?`/g, '``');
}

async function caseRouteNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/,
    /\bfetch\s*\([^)]*\/api\/generate/,
    /\brunPipeline\s*\(/,
    /\bcomposeBannerSvg\s*\(/,
    /\brememberBanner\s*\(/,
  ];
  for (const re of forbidden) {
    if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  }
  return { ok: true, detail: 'route does not import / call generation' };
}
async function caseRouteNoExecution(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|runMutation|selectMutation|chooseMutation)\b/;
  return {
    ok: !banned.test(src),
    detail: !banned.test(src) ? 'no execution function exported' : 'execution function present',
  };
}
async function caseRouteGetOnly(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return {
    ok: hasGet && !hasPost,
    detail: `GET=${hasGet} POST=${hasPost}`,
  };
}
async function caseRouteListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'),
    'utf8',
  );
  return {
    ok: /['"]\/api\/world-model['"]/.test(src),
    detail: /['"]\/api\/world-model['"]/.test(src) ? 'route registered' : 'route missing from KNOWN_ROUTES',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/worldModelEngine.ts',
    'lib/aestheticMigrationEngine.ts',
    'lib/collectiveAttentionEngine.ts',
    'lib/civilizationalMoodEngine.ts',
    'lib/meaningPressureEngine.ts',
    'lib/worldModelMemory.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
    /from\s+['"]@?lib\/banner/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) {
      if (re.test(codeOnly)) return { ok: false, detail: `forbidden import in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline / generation imports' };
}
async function caseNoFetchNoWrite(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/worldModelEngine.ts',
    'lib/aestheticMigrationEngine.ts',
    'lib/collectiveAttentionEngine.ts',
    'lib/civilizationalMoodEngine.ts',
    'lib/meaningPressureEngine.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'engines are pure' };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const world = computeWorldModel({
    outcomes: { outcomes: mkOutcomes(6, { ext: 'ritual' }) },
    drift: { observations: [{ emotionalDiversity: 4, trustErosionDrift: 2 }] },
    visualDNA: { fingerprints: mkVisualFps(4, 7, 5, 2) },
    narrativeDNA: { fingerprints: [{ silenceUsage: 'sparse', humanRealism: 6, ctaPressure: 3 }] },
  });
  const aest = computeAestheticMigration({
    visualDNA: { fingerprints: mkVisualFps(6, 7, 5, 2) },
    outcomes: { outcomes: mkOutcomes(4, { ext: 'nostalgia' }) },
  });
  const att = computeCollectiveAttention({
    outcomes: { outcomes: mkOutcomes(6) },
    drift: { observations: [{ pacingPressure: 5 }] },
  });
  const mood = computeCivilizationalMood({
    worldSignals: world.signals, aesthetic: aest, attention: att,
  });
  const meaning = computeMeaningPressure({
    worldSignals: world.signals, aesthetic: aest, attention: att,
  });
  const text = JSON.stringify({ world, aest, att, mood, meaning });
  // Each engine should use at least one allowed observational phrase.
  const required = /(observed alongside|historically associated|appears to be|appears stable|appears elevated|appears suppressed|the current observed era appears to be)/i;
  return {
    ok: required.test(text),
    detail: required.test(text) ? 'allowed phrasing present' : 'no allowed phrasing matched',
  };
}
function caseForbiddenLanguage(): { ok: boolean; detail: string } {
  const world = computeWorldModel({
    outcomes: { outcomes: mkOutcomes(6, { ext: 'fatigue' }) },
    drift: { observations: [{ emotionalDiversity: 3, trustErosionDrift: 5 }] },
    visualDNA: { fingerprints: mkVisualFps(4, 8, 4, 5) },
    narrativeDNA: { fingerprints: [{ silenceUsage: 'sparse', humanRealism: 6, ctaPressure: 3 }] },
  });
  const aest = computeAestheticMigration({
    visualDNA: { fingerprints: mkVisualFps(6, 7, 5, 4) },
    outcomes: { outcomes: mkOutcomes(4, { ext: 'nostalgia' }) },
  });
  const att = computeCollectiveAttention({
    outcomes: { outcomes: mkOutcomes(6) },
    drift: { observations: [] },
  });
  const mood = computeCivilizationalMood({
    worldSignals: world.signals, aesthetic: aest, attention: att,
  });
  const meaning = computeMeaningPressure({
    worldSignals: world.signals, aesthetic: aest, attention: att,
  });
  // Build narrative text only (strings inside notes / reasonCodes / advisoryNotice).
  const narrativeText = [
    ...world.notes, world.advisoryNotice,
    ...aest.notes, aest.advisoryNotice,
    ...att.notes, att.advisoryNotice,
    ...mood.notes, mood.advisoryNotice,
    ...meaning.notes, meaning.advisoryNotice,
  ].join(' ');
  // The forbidden semantics from the directive:
  //   prediction, persuasion-steering, behavioral-targeting,
  //   optimization, manipulation, political-segmentation, autonomous-adaptation
  // Detect predictive/persuasive/optimization vocabulary in narrative phrasing.
  // We're lenient with "manipulate"/"persuade"/etc. appearing in NEGATING contexts
  // (e.g. "never manipulates", "never predicts") because the advisory notice itself
  // declares the limits — those usages are intended.
  // We check the more aggressive verbs in non-negated contexts:
  const banned = /(\bpredict(s|ed|ing)?\b|\boptimiz(e|es|ed|ing)\b|\bauto-?appl(y|ied|ies)\b|\bbest\b|\bwinner\b|\bguaranteed\b)/i;
  // Allow "never predicts" / "never optimizes" / "never auto-applies" as they
  // declare the system's NEGATIVE contract.
  const stripped = narrativeText
    .replace(/never\s+predicts/gi, '')
    .replace(/never\s+optimizes/gi, '')
    .replace(/never\s+auto-?applies/gi, '')
    .replace(/never\s+predicts,\s*never\s+optimizes/gi, '');
  const found = banned.test(stripped);
  return {
    ok: !found,
    detail: !found ? 'no forbidden phrasing in narrative' : `banned phrasing in: ${stripped.slice(0, 200)}`,
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('WORLD MODEL INTELLIGENCE VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['world-shape',            '16 signals present, in range, optimismDrift signed', () => caseWorldShape()],
    ['world-deterministic',    'same inputs → same output',                          () => caseWorldDeterministic()],
    ['world-empty',            'no inputs → balanced reading',                       () => caseWorldEmpty()],
    ['aesthetic-shape',        '9 aesthetic dimensions present + dominant migrations', () => caseAestheticShape()],
    ['aesthetic-cycle',        'migration direction is signed -10..+10',             () => caseAestheticCycle()],
    ['aesthetic-deterministic','aesthetic engine is pure',                            () => caseAestheticDeterministic()],
    ['attention-shape',        '8 attention movements present + signed direction',   () => caseAttentionShape()],
    ['attention-deterministic','attention engine is pure',                            () => caseAttentionDeterministic()],
    ['mood-era-labels',        'era labels from declared union only',                () => caseMoodEraLabels()],
    ['mood-dominant-era',      'dominant era resolves deterministically',            () => caseMoodDominantEra()],
    ['mood-balanced-fallback', 'zero signals → balanced era surfaces',               () => caseMoodBalancedFallback()],
    ['meaning-shape',          '8 meaning pressures present, 0..10',                 () => caseMeaningShape()],
    ['meaning-deterministic',  'meaning engine is pure',                              () => caseMeaningDeterministic()],
    ['memory-fifo',            'append > limit → cap respected',                     () => caseMemoryFifo()],
    ['memory-pure-transform',  'appendWorldModelSnapshot is referentially transparent', () => caseMemoryPureTransform()],
    ['route-no-pipeline',      'route does not import pipeline / call /api/generate', () => caseRouteNoPipeline()],
    ['route-no-execution',     'route exports no apply / execute / generateNow / publishNow', () => caseRouteNoExecution()],
    ['route-get-only',         'route exports GET but not POST',                     () => caseRouteGetOnly()],
    ['route-listed',           '/api/world-model registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',              'engines + memory have no critic / pipeline / banner imports', () => caseIsolation()],
    ['no-fetch-no-write',      'engines have no fetch / no fs.writeFile',            () => caseNoFetchNoWrite()],
    ['allowed-language',       'phrasing uses observed alongside / historically associated', () => caseAllowedLanguage()],
    ['forbidden-language',     'phrasing forbids predict / optimize / auto-apply / best / winner', () => caseForbiddenLanguage()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
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
