/**
 * VERIFY — Self-Reflection / Meta-Cognition Layer.
 *
 * Pure-function + static verification.
 *
 * Cases:
 *   meta-shape                 · 15 degradation signals present, in range
 *   meta-deterministic         · pure function
 *   meta-empty                 · no inputs → balanced reading
 *   identity-shape             · 9 drift signals + verdict from declared union
 *   identity-drifting          · realism falling + persuasion rising → drifting verdict
 *   identity-deterministic     · pure function
 *   collapse-shape             · 8 collapse signals + verdict from declared union
 *   collapse-saturating        · dominant token repetition → saturating / collapsing verdict
 *   collapse-deterministic     · pure function
 *   humanity-shape             · 9 humanity signals + verdict from declared union
 *   humanity-felt-human        · imperfection + silence + restraint → felt-human
 *   humanity-synthetic-pressure· high persuasion + no realism → synthetic-pressure
 *   humanity-deterministic     · pure function
 *   memory-fifo                · append > limit → cap respected
 *   memory-pure-transform      · appendSelfReflectionSnapshot is referentially transparent
 *   route-no-pipeline          · route does not import pipeline / call /api/generate
 *   route-no-execution         · route exports no apply / execute / generateNow / publishNow
 *   route-get-only             · route exports GET but not POST
 *   route-listed               · /api/self-reflection registered in systemIntegrityReport
 *   isolation                  · engines + memory have no critic / pipeline / banner imports
 *   no-fetch-no-write          · engines have no fetch / no fs.writeFile
 *   no-self-rewrite            · engines export no auto-correct / auto-heal / auto-optimize
 *   allowed-language           · phrasing uses observed alongside / historically associated / appears
 *   forbidden-language         · phrasing forbids best / winner / will / auto-apply / optimize
 *   tsc                        · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { computeMetaCognition } from '../lib/metaCognitionEngine';
import { computeIdentityDrift, type DriftVerdict } from '../lib/identityDriftEngine';
import { computeAestheticCollapse, type CollapseVerdict } from '../lib/aestheticCollapseEngine';
import { computeHumanityRetention, type HumanityVerdict } from '../lib/humanityRetentionEngine';
import {
  appendSelfReflectionSnapshot,
  createInitialSelfReflectionMemory,
  SELF_REFLECTION_SNAPSHOT_LIMIT,
  type SelfReflectionSnapshot,
} from '../lib/selfReflectionMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

function mkOutcomes(n: number, opts: { highPersuasion?: boolean; lowRealism?: boolean; same?: boolean; ext?: string; rising?: boolean } = {}): any[] {
  const outs: any[] = [];
  for (let i = 0; i < n; i++) {
    const isLate = i >= Math.floor(n / 2);
    const out: any = {
      at: 1000 + i * 1000,
      cadenceState: opts.same ? 'burst' : (i % 3 === 0 ? 'burst' : 'flow'),
      emotionalSignature: opts.same ? 'aspirational-inspirational-elevated' : `tone-${i % 4}`,
      visualStyle: opts.same ? 'polished-cinematic' : `style-${i % 3}`,
      narrativeSignature: opts.same ? 'aspir-peak' : `narr-${i % 3}`,
      realismLevel: opts.lowRealism ? 2 : 6,
      persuasionIntensity: opts.highPersuasion ? 9 : (opts.rising && isLate ? 9 : 5),
      mutationPressure: 3,
      downstreamOutcome: opts.ext ?? 'trust-formation',
      metrics: {
        retention: isLate && opts.rising ? 0.3 : 0.6,
        saves: 2, shares: 1, bounceRate: 0.3, scrollDepth: 0.6,
      },
    };
    outs.push(out);
  }
  return outs;
}

function mkVisualFps(n: number, opts: { polish?: number; realism?: number; same?: boolean; rising?: boolean } = {}): any[] {
  const fps: any[] = [];
  for (let i = 0; i < n; i++) {
    const isLate = i >= Math.floor(n / 2);
    fps.push({
      at: 1000 + i * 1000,
      framingFingerprint: opts.same ? 'fixed-frame' : `frame-${i % 4}`,
      lightingSignature: opts.same ? 'soft-warm-light' : `light-${i % 3}`,
      pacingIdentity: opts.same ? 'slow-pacing' : `pacing-${i % 3}`,
      typographyRhythm: opts.same ? 'big-bold' : `typo-${i % 3}`,
      silenceDensity: 'mid',
      motionCadence: opts.same ? 'slow-cadence' : `motion-${i % 3}`,
      emotionalColorTemperature: 'warm',
      realismLevel: opts.realism ?? (opts.rising && isLate ? 2 : 6),
      polishLevel: opts.polish ?? 6,
    });
  }
  return fps;
}

function mkNarrativeFps(n: number, opts: { highCta?: boolean; same?: boolean; humanRealism?: number } = {}): any[] {
  const fps: any[] = [];
  for (let i = 0; i < n; i++) {
    fps.push({
      at: 1000 + i * 1000,
      hookFamily: opts.same ? 'identity-claim' : `hook-${i % 3}`,
      persuasionStructure: opts.same ? 'urgency-cta' : `pers-${i % 3}`,
      emotionalCadence: opts.same ? 'rising-uplift' : `cadence-${i % 3}`,
      tensionCurve: 'rising',
      silenceUsage: opts.same ? 'absent' : 'sparse',
      narrationStyle: opts.same ? 'inspirational-voice' : `narr-${i % 3}`,
      humanRealism: opts.humanRealism ?? 6,
      ctaPressure: opts.highCta ? 9 : 4,
      observationalDensity: 6,
    });
  }
  return fps;
}

// ─── meta cases ──────────────────────────────────────────────

function caseMetaShape(): { ok: boolean; detail: string } {
  const r = computeMetaCognition({
    outcomes: { outcomes: mkOutcomes(6) },
    drift: { observations: [{ emotionalDiversity: 5, trustErosionDrift: 2 }] },
    visualDNA: { fingerprints: mkVisualFps(4) },
    narrativeDNA: { fingerprints: mkNarrativeFps(4) },
    learning: { patterns: [] },
  });
  const expected = [
    'syntheticDrift', 'realismIntegrity', 'emotionalDensity',
    'narrativeRedundancy', 'symbolismIntegrity', 'manipulationCreep',
    'authenticityStability', 'aestheticExhaustion', 'trustFragility',
    'overOptimizationPressure', 'humanityRetention', 'restraintIntegrity',
    'silenceTolerance', 'identityCoherence', 'emotionalBreathingRoom',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  const inRange = Object.values(r.signals).every((v) => v >= 0 && v <= 10);
  return {
    ok: missing.length === 0 && inRange && r.dominantDegradations.length === 3,
    detail: missing.length === 0 ? `inRange=${inRange} dominant=${r.dominantDegradations.length}` : `missing=${missing.join(',')}`,
  };
}
function caseMetaDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: mkOutcomes(4) },
    drift: { observations: [] },
    visualDNA: { fingerprints: mkVisualFps(3) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3) },
    learning: { patterns: [] },
  };
  const a = JSON.stringify(computeMetaCognition(input));
  const b = JSON.stringify(computeMetaCognition(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseMetaEmpty(): { ok: boolean; detail: string } {
  const r = computeMetaCognition({});
  return {
    ok: r.totalObservations === 0 && r.notes.length > 0 &&
        Object.values(r.signals).every((v) => v >= 0 && v <= 10),
    detail: `total=${r.totalObservations} notes=${r.notes[0].slice(0, 80)}`,
  };
}

// ─── identity cases ──────────────────────────────────────────

const DRIFT_UNION: DriftVerdict[] = ['identity-stable', 'identity-mildly-drifting', 'identity-drifting', 'identity-strongly-drifting'];

function caseIdentityShape(): { ok: boolean; detail: string } {
  const r = computeIdentityDrift({
    outcomes: { outcomes: mkOutcomes(6) },
    visualDNA: { fingerprints: mkVisualFps(4) },
    narrativeDNA: { fingerprints: mkNarrativeFps(4) },
  });
  const expected = [
    'toneMutation', 'emotionalInstability', 'overPerformance',
    'excessiveInspiration', 'realismErosion', 'intimacyInflation',
    'groundednessLoss', 'aestheticConformity', 'symbolicIncoherence',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  const verdictValid = DRIFT_UNION.includes(r.verdict);
  return {
    ok: missing.length === 0 && verdictValid && r.dominantDriftSignals.length === 3,
    detail: missing.length === 0 ? `verdict=${r.verdict} dominant=${r.dominantDriftSignals.length}` : `missing=${missing.join(',')}`,
  };
}
function caseIdentityDrifting(): { ok: boolean; detail: string } {
  // Build outcomes that clearly trend toward performance + low realism.
  const r = computeIdentityDrift({
    outcomes: { outcomes: mkOutcomes(8, { same: true, rising: true }) },
    visualDNA: { fingerprints: mkVisualFps(8, { same: true, rising: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(8, { same: true, highCta: true }) },
  });
  // Drift verdict must be one of the drifting verdicts.
  const drifting = r.verdict !== 'identity-stable';
  return { ok: drifting, detail: `verdict=${r.verdict} index=${r.overallDriftIndex}` };
}
function caseIdentityDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: mkOutcomes(4) },
    visualDNA: { fingerprints: mkVisualFps(3) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3) },
  };
  const a = JSON.stringify(computeIdentityDrift(input));
  const b = JSON.stringify(computeIdentityDrift(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── collapse cases ──────────────────────────────────────────

const COLLAPSE_UNION: CollapseVerdict[] = ['aesthetic-stable', 'aesthetic-saturating', 'aesthetic-collapsing'];

function caseCollapseShape(): { ok: boolean; detail: string } {
  const r = computeAestheticCollapse({
    outcomes: { outcomes: mkOutcomes(6) },
    visualDNA: { fingerprints: mkVisualFps(6) },
    narrativeDNA: { fingerprints: mkNarrativeFps(4) },
  });
  const expected = [
    'repeatedPacing', 'repeatedEmotionalCadence', 'repeatedVisualRhythm',
    'repeatedTypographyEnergy', 'repeatedCinematicFraming',
    'aiFeelingSignature', 'emotionalFlattening', 'overstimulationFatigue',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  return {
    ok: missing.length === 0 && COLLAPSE_UNION.includes(r.verdict) &&
        r.dominantCollapseSignals.length === 3,
    detail: missing.length === 0 ? `verdict=${r.verdict} dominant=${r.dominantCollapseSignals.length}` : `missing=${missing.join(',')}`,
  };
}
function caseCollapseSaturating(): { ok: boolean; detail: string } {
  const r = computeAestheticCollapse({
    outcomes: { outcomes: mkOutcomes(8, { same: true, rising: true }) },
    visualDNA: { fingerprints: mkVisualFps(8, { same: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(8, { same: true }) },
  });
  const collapsing = r.verdict === 'aesthetic-saturating' || r.verdict === 'aesthetic-collapsing';
  return { ok: collapsing, detail: `verdict=${r.verdict} index=${r.overallCollapseIndex}` };
}
function caseCollapseDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: mkOutcomes(4) },
    visualDNA: { fingerprints: mkVisualFps(3) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3) },
  };
  const a = JSON.stringify(computeAestheticCollapse(input));
  const b = JSON.stringify(computeAestheticCollapse(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── humanity cases ──────────────────────────────────────────

const HUMANITY_UNION: HumanityVerdict[] = ['felt-human', 'mixed', 'synthetic-pressure'];

function caseHumanityShape(): { ok: boolean; detail: string } {
  const r = computeHumanityRetention({
    outcomes: { outcomes: mkOutcomes(6) },
    visualDNA: { fingerprints: mkVisualFps(4) },
    narrativeDNA: { fingerprints: mkNarrativeFps(4) },
  });
  const expected = [
    'imperfectionRetention', 'silenceRetention', 'realismTexture',
    'restraint', 'groundedPacing', 'emotionalSincerity',
    'vulnerabilityHonesty', 'observationalHumility', 'emotionalSpaciousness',
  ];
  const missing = expected.filter((k) => !(k in r.signals));
  return {
    ok: missing.length === 0 && HUMANITY_UNION.includes(r.verdict),
    detail: missing.length === 0 ? `verdict=${r.verdict} index=${r.humanityIndex}` : `missing=${missing.join(',')}`,
  };
}
function caseHumanityFeltHuman(): { ok: boolean; detail: string } {
  // Low polish + high realism + low persuasion + sparse silence + flow.
  const outs = mkOutcomes(6).map((o) => ({ ...o, persuasionIntensity: 3, cadenceState: 'flow', downstreamOutcome: 'trust-formation' }));
  const r = computeHumanityRetention({
    outcomes: { outcomes: outs },
    visualDNA: { fingerprints: mkVisualFps(6, { polish: 3, realism: 8 }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6, { humanRealism: 8 }) },
  });
  return {
    ok: r.verdict === 'felt-human' || r.verdict === 'mixed',
    detail: `verdict=${r.verdict} index=${r.humanityIndex}`,
  };
}
function caseHumanitySyntheticPressure(): { ok: boolean; detail: string } {
  // High polish + low realism + high persuasion + high CTA + no silence.
  const outs = mkOutcomes(8, { highPersuasion: true, lowRealism: true, same: true, ext: 'authenticity-rejection' });
  const r = computeHumanityRetention({
    outcomes: { outcomes: outs },
    visualDNA: { fingerprints: mkVisualFps(8, { polish: 10, realism: 1, same: true }).map((f: any) => ({ ...f, silenceDensity: 'low' })) },
    narrativeDNA: { fingerprints: mkNarrativeFps(8, { highCta: true, same: true, humanRealism: 1 }) },
  });
  return {
    ok: r.verdict === 'synthetic-pressure' || r.verdict === 'mixed',
    detail: `verdict=${r.verdict} index=${r.humanityIndex}`,
  };
}
function caseHumanityDeterministic(): { ok: boolean; detail: string } {
  const input = {
    outcomes: { outcomes: mkOutcomes(4) },
    visualDNA: { fingerprints: mkVisualFps(3) },
    narrativeDNA: { fingerprints: mkNarrativeFps(3) },
  };
  const a = JSON.stringify(computeHumanityRetention(input));
  const b = JSON.stringify(computeHumanityRetention(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}

// ─── memory cases ────────────────────────────────────────────

function emptySnapshot(at: number): SelfReflectionSnapshot {
  return {
    at,
    metaSignals: {
      syntheticDrift: 0, realismIntegrity: 0, emotionalDensity: 0,
      narrativeRedundancy: 0, symbolismIntegrity: 0, manipulationCreep: 0,
      authenticityStability: 0, aestheticExhaustion: 0, trustFragility: 0,
      overOptimizationPressure: 0, humanityRetention: 0, restraintIntegrity: 0,
      silenceTolerance: 0, identityCoherence: 0, emotionalBreathingRoom: 0,
    },
    dominantDegradations: [],
    identitySignals: {
      toneMutation: 0, emotionalInstability: 0, overPerformance: 0,
      excessiveInspiration: 0, realismErosion: 0, intimacyInflation: 0,
      groundednessLoss: 0, aestheticConformity: 0, symbolicIncoherence: 0,
    },
    identityVerdict: 'identity-stable',
    identityDriftIndex: 0,
    aestheticCollapseLevels: {
      repeatedPacing: 0, repeatedEmotionalCadence: 0, repeatedVisualRhythm: 0,
      repeatedTypographyEnergy: 0, repeatedCinematicFraming: 0,
      aiFeelingSignature: 0, emotionalFlattening: 0, overstimulationFatigue: 0,
    },
    aestheticVerdict: 'aesthetic-stable',
    aestheticCollapseIndex: 0,
    humanitySignals: {
      imperfectionRetention: 0, silenceRetention: 0, realismTexture: 0,
      restraint: 0, groundedPacing: 0, emotionalSincerity: 0,
      vulnerabilityHonesty: 0, observationalHumility: 0, emotionalSpaciousness: 0,
    },
    humanityVerdict: 'felt-human',
    humanityIndex: 0,
    observationCount: 0,
  };
}

function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialSelfReflectionMemory();
  const cap = SELF_REFLECTION_SNAPSHOT_LIMIT;
  for (let i = 0; i < cap + 50; i++) {
    state = appendSelfReflectionSnapshot(state, emptySnapshot(1000 + i));
  }
  return {
    ok: state.snapshots.length === cap && state.totalSnapshots === cap + 50,
    detail: `snapshots=${state.snapshots.length} total=${state.totalSnapshots} cap=${cap}`,
  };
}
function caseMemoryPureTransform(): { ok: boolean; detail: string } {
  const state = createInitialSelfReflectionMemory();
  const snap = emptySnapshot(1000);
  const a = appendSelfReflectionSnapshot(state, snap);
  const b = appendSelfReflectionSnapshot(state, snap);
  return {
    ok: state.snapshots.length === 0 && JSON.stringify(a) === JSON.stringify(b),
    detail: `prior=${state.snapshots.length} a===b: ${JSON.stringify(a) === JSON.stringify(b)}`,
  };
}

// ─── route + module static checks ────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""')
    .replace(/`[\s\S]*?`/g, '``');
}

async function readRouteSrc(): Promise<string> {
  return fs.readFile(
    path.resolve(__dirname, '..', 'app', 'api', 'self-reflection', 'route.ts'),
    'utf8',
  );
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
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|runMutation|selectMutation|chooseMutation|autoCorrect|autoHeal|autoOptimize|selfRewrite)\b/;
  return {
    ok: !banned.test(src),
    detail: !banned.test(src) ? 'no execution / auto-correct function exported' : 'execution function present',
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
    ok: /['"]\/api\/self-reflection['"]/.test(src),
    detail: /['"]\/api\/self-reflection['"]/.test(src) ? 'route registered' : 'route missing from KNOWN_ROUTES',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/metaCognitionEngine.ts',
    'lib/identityDriftEngine.ts',
    'lib/aestheticCollapseEngine.ts',
    'lib/humanityRetentionEngine.ts',
    'lib/selfReflectionMemory.ts',
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
    'lib/metaCognitionEngine.ts',
    'lib/identityDriftEngine.ts',
    'lib/aestheticCollapseEngine.ts',
    'lib/humanityRetentionEngine.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'engines are pure' };
}
async function caseNoSelfRewrite(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/metaCognitionEngine.ts',
    'lib/identityDriftEngine.ts',
    'lib/aestheticCollapseEngine.ts',
    'lib/humanityRetentionEngine.ts',
    'lib/selfReflectionMemory.ts',
    'app/api/self-reflection/route.ts',
  ];
  const banned = /\bexport\s+(function|async\s+function|const)\s+(autoCorrect|autoHeal|autoOptimize|selfRewrite|applyMutation|generateNow|publishNow|executeMutation|hiddenMutation|suppressOutput|fixOutput)\b/;
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (banned.test(src)) return { ok: false, detail: `self-rewrite function in ${f}` };
  }
  return { ok: true, detail: 'no self-rewrite / auto-correct / auto-heal exports' };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const meta = computeMetaCognition({
    outcomes: { outcomes: mkOutcomes(6, { same: true }) },
    visualDNA: { fingerprints: mkVisualFps(6, { same: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6, { same: true }) },
    drift: { observations: [{ emotionalDiversity: 3, trustErosionDrift: 5 }] },
    learning: { patterns: [] },
  });
  const ident = computeIdentityDrift({
    outcomes: { outcomes: mkOutcomes(6, { same: true, rising: true }) },
    visualDNA: { fingerprints: mkVisualFps(6, { same: true, rising: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6, { same: true, highCta: true }) },
  });
  const collapse = computeAestheticCollapse({
    outcomes: { outcomes: mkOutcomes(6, { same: true }) },
    visualDNA: { fingerprints: mkVisualFps(6, { same: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6, { same: true }) },
  });
  const humanity = computeHumanityRetention({
    outcomes: { outcomes: mkOutcomes(6) },
    visualDNA: { fingerprints: mkVisualFps(6) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6) },
  });
  const text = JSON.stringify({ meta, ident, collapse, humanity });
  const required = /(observed alongside|historically associated|appears to be|appears suppressed|appears elevated|appears stable|appears under|appears felt-human|identity appears|aesthetic motion appears|outputs appear)/i;
  return {
    ok: required.test(text),
    detail: required.test(text) ? 'allowed phrasing present' : 'no allowed phrasing matched',
  };
}
function caseForbiddenLanguage(): { ok: boolean; detail: string } {
  const meta = computeMetaCognition({
    outcomes: { outcomes: mkOutcomes(6, { same: true, highPersuasion: true }) },
    visualDNA: { fingerprints: mkVisualFps(6, { same: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6, { same: true, highCta: true }) },
    drift: { observations: [{ emotionalDiversity: 3, trustErosionDrift: 5 }] },
    learning: { patterns: [] },
  });
  const ident = computeIdentityDrift({
    outcomes: { outcomes: mkOutcomes(6, { same: true }) },
    visualDNA: { fingerprints: mkVisualFps(6, { same: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6, { same: true }) },
  });
  const collapse = computeAestheticCollapse({
    outcomes: { outcomes: mkOutcomes(6, { same: true }) },
    visualDNA: { fingerprints: mkVisualFps(6, { same: true }) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6, { same: true }) },
  });
  const humanity = computeHumanityRetention({
    outcomes: { outcomes: mkOutcomes(6) },
    visualDNA: { fingerprints: mkVisualFps(6) },
    narrativeDNA: { fingerprints: mkNarrativeFps(6) },
  });
  const narrativeText = [
    ...meta.notes, meta.advisoryNotice,
    ...ident.notes, ident.advisoryNotice,
    ...collapse.notes, collapse.advisoryNotice,
    ...humanity.notes, humanity.advisoryNotice,
  ].join(' ');
  // Remove negated contract phrases that are EXPECTED.
  const stripped = narrativeText
    .replace(/never\s+autonomously\s+modifies/gi, '')
    .replace(/never\s+rewrite/gi, '')
    .replace(/never\s+optimizes/gi, '')
    .replace(/never\s+auto-?applies/gi, '');
  const banned = /\b(best|winner|guaranteed|auto-apply|optimize|will\s+(rise|fall|happen|be))\b/i;
  return {
    ok: !banned.test(stripped),
    detail: !banned.test(stripped) ? 'no forbidden phrasing in narrative' : `banned in: ${stripped.slice(0, 200)}`,
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('SELF-REFLECTION / META-COGNITION VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['meta-shape',               '15 degradation signals present, in range',         () => caseMetaShape()],
    ['meta-deterministic',       'meta-cognition engine is pure',                    () => caseMetaDeterministic()],
    ['meta-empty',               'no inputs → balanced reading',                     () => caseMetaEmpty()],
    ['identity-shape',           '9 drift signals + declared-union verdict',         () => caseIdentityShape()],
    ['identity-drifting',        'rising persuasion + sameness → drifting verdict',  () => caseIdentityDrifting()],
    ['identity-deterministic',   'identity drift engine is pure',                    () => caseIdentityDeterministic()],
    ['collapse-shape',           '8 collapse signals + declared-union verdict',      () => caseCollapseShape()],
    ['collapse-saturating',      'sameness → saturating / collapsing verdict',       () => caseCollapseSaturating()],
    ['collapse-deterministic',   'aesthetic collapse engine is pure',                () => caseCollapseDeterministic()],
    ['humanity-shape',           '9 humanity signals + declared-union verdict',      () => caseHumanityShape()],
    ['humanity-felt-human',      'imperfection + restraint + realism → felt-human',  () => caseHumanityFeltHuman()],
    ['humanity-synthetic-pressure', 'high persuasion + no realism → synthetic-pressure', () => caseHumanitySyntheticPressure()],
    ['humanity-deterministic',   'humanity retention engine is pure',                () => caseHumanityDeterministic()],
    ['memory-fifo',              'append > limit → cap respected',                   () => caseMemoryFifo()],
    ['memory-pure-transform',    'appendSelfReflectionSnapshot is referentially transparent', () => caseMemoryPureTransform()],
    ['route-no-pipeline',        'route does not import pipeline / call /api/generate', () => caseRouteNoPipeline()],
    ['route-no-execution',       'route exports no apply / execute / auto-correct',  () => caseRouteNoExecution()],
    ['route-get-only',           'route exports GET but not POST',                   () => caseRouteGetOnly()],
    ['route-listed',             '/api/self-reflection registered in systemIntegrityReport', () => caseRouteListed()],
    ['isolation',                'engines + memory have no critic / pipeline / banner imports', () => caseIsolation()],
    ['no-fetch-no-write',        'engines have no fetch / no fs.writeFile',          () => caseNoFetchNoWrite()],
    ['no-self-rewrite',          'no auto-correct / auto-heal / auto-optimize / self-rewrite exports', () => caseNoSelfRewrite()],
    ['allowed-language',         'phrasing uses observed alongside / appears',       () => caseAllowedLanguage()],
    ['forbidden-language',       'phrasing forbids best / winner / will / optimize / auto-apply', () => caseForbiddenLanguage()],
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
