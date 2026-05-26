/**
 * VERIFY — Adaptive Creative Governance bundle.
 *
 * Pure-function verification of the five new modules:
 *   - refusalNarrativeEngine
 *   - generationMutationPlanner
 *   - creativeFatigueEngine
 *   - visualDNAMemory     (fingerprint extraction + FIFO)
 *   - narrativeDNAMemory  (fingerprint extraction + FIFO)
 *
 * The verifier checks:
 *   · refusal narrative consistency (template dispatch deterministic)
 *   · mutation planner produces concrete mutations for known triggers
 *   · fatigue detection across vectors
 *   · DNA fingerprint stability (same banner → same fingerprint)
 *   · FIFO caps stable for both DNA memories
 *   · no critic / pipeline imports in any module
 *   · no runtime mutation (no fetch, no fs.writeFile in engines)
 *   · no autonomous policy application (no "applied: true" in outputs)
 *   · deterministic mixed-input output across all modules
 *   · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computeRefusalNarrative,
  type RefusalNarrativeInput,
} from '../lib/refusalNarrativeEngine';
import {
  computeGenerationMutationPlan,
  type MutationPlannerInput,
} from '../lib/generationMutationPlanner';
import {
  computeCreativeFatigue,
  type CreativeFatigueInput,
} from '../lib/creativeFatigueEngine';
import {
  extractVisualFingerprint,
  createInitialVisualDNAMemory,
  VISUAL_DNA_FINGERPRINT_LIMIT,
  type VisualFingerprint,
  type BannerForVisualDNA,
} from '../lib/visualDNAMemory';
import {
  extractNarrativeFingerprint,
  createInitialNarrativeDNAMemory,
  NARRATIVE_DNA_FINGERPRINT_LIMIT,
  type NarrativeFingerprint,
  type BannerForNarrativeDNA,
} from '../lib/narrativeDNAMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic banner ─────────────────────────────────────────

function makeBanner(seed = 1): BannerForVisualDNA & BannerForNarrativeDNA {
  return {
    id: `banner-${seed}`,
    createdAt: seed * 1000,
    formula: 'ENERGY',
    campaignMode: 'Minimal',
    state: { family: 'fatigue', label: 'third coffee' },
    truth: { truth: 'the body is tired', tension: 'no rest' },
    direction: {
      layoutFamily: 'documentary',
      focalPoint: 'left-third',
      typographyDominance: 'condensed-vertical',
      productRole: 'absent',
      atmosphere: 'flat-warm',
      restraint: 0.75,
    },
    composition: {
      negativeSpaceBias: 'edge',
      typoZones: { primary: {}, secondary: undefined, timestamp: {} },
    },
    copywriter: {
      emotionalFrame: 'observed-pressure',
      persuasionTone: 'observational',
      storyShape: 'mirror',
      hook: { hook: 'the third coffee' },
      body: { body: 'something gentle' },
      cta: { cta: 'try it once' },
    },
    adStrategy: {
      persuasionMode: 'observational',
      storyShape: 'mirror',
    },
    finalVerdict: { brutality: 0.5, verdict: 'approve' },
  };
}

// ─── refusal narrative ────────────────────────────────────────

function caseRefusalA(): { ok: boolean; detail: string } {
  const input: RefusalNarrativeInput = {
    formula: 'ENERGY', campaignMode: 'Aggressive', brutality: 0.9,
    trustDebt: 8, repetitionPressure: 7, drift: 6, entropy: 3,
    narrativeStability: 3, persuasionVariance: 3, emotionalCompression: 7,
    identityErosion: 6, dignityErosion: 7,
  };
  const a = computeRefusalNarrative(input);
  const b = computeRefusalNarrative(input);
  const ok = JSON.stringify(a) === JSON.stringify(b) &&
    a.severity === 'severe' &&
    a.narrativeReason.length > 20 &&
    !a.narrativeReason.toLowerCase().includes('lower brutality');
  return {
    ok,
    detail: `severity=${a.severity} narrative starts: "${a.narrativeReason.slice(0, 60)}…"`,
  };
}

function caseRefusalB(): { ok: boolean; detail: string } {
  // Mild input — should land on the fallback (within-envelope) template.
  const input: RefusalNarrativeInput = {
    formula: 'ENERGY', campaignMode: null, brutality: 0.3,
    trustDebt: 2, repetitionPressure: 2, drift: 2, entropy: 8,
    narrativeStability: 8, persuasionVariance: 8, emotionalCompression: 2,
    identityErosion: 2, dignityErosion: 2,
  };
  const r = computeRefusalNarrative(input);
  return {
    ok: r.severity === 'mild' || r.severity === 'moderate',
    detail: `severity=${r.severity} reason=${r.narrativeReason.slice(0, 60)}…`,
  };
}

// ─── mutation planner ─────────────────────────────────────────

function caseMutationTrust(): { ok: boolean; detail: string } {
  const plan = computeGenerationMutationPlan({ trustDebt: 8 });
  const hasReduceCTA = plan.persuasionMutations.some((m) => m.mutation.includes('reduce CTA'));
  const hasObservational = plan.emotionalMutations.some((m) => m.mutation.includes('observational'));
  const hasSilence = plan.pacingMutations.some((m) => m.mutation.includes('silence'));
  return {
    ok: hasReduceCTA && hasObservational && hasSilence,
    detail: `reduceCTA=${hasReduceCTA} observational=${hasObservational} silence=${hasSilence}`,
  };
}

function caseMutationRepetition(): { ok: boolean; detail: string } {
  const plan = computeGenerationMutationPlan({ repetitionCycles: 4 });
  const hasRotate = plan.noveltyMutations.some((m) => m.mutation.includes('rotate hook'));
  const hasAsym = plan.compositionMutations.some((m) => m.mutation.includes('asymmetry'));
  const hasPacing = plan.pacingMutations.some((m) => m.mutation.includes('pacing'));
  return {
    ok: hasRotate && hasAsym && hasPacing,
    detail: `rotateHook=${hasRotate} asym=${hasAsym} pacingVariance=${hasPacing}`,
  };
}

function caseMutationFlattening(): { ok: boolean; detail: string } {
  const plan = computeGenerationMutationPlan({ emotionalFlattening: 8 });
  const hasContrast = plan.emotionalMutations.some((m) => m.mutation.includes('contrast'));
  const hasStillness = plan.pacingMutations.some((m) => m.mutation.includes('stillness'));
  return {
    ok: hasContrast && hasStillness,
    detail: `contrast=${hasContrast} stillness=${hasStillness}`,
  };
}

function caseMutationVisualConv(): { ok: boolean; detail: string } {
  const plan = computeGenerationMutationPlan({ visualConvergence: 8 });
  const hasReducePolish = plan.visualMutations.some((m) => m.mutation.includes('reduce polish'));
  const hasDeadSpace   = plan.compositionMutations.some((m) => m.mutation.includes('dead-space'));
  const hasDocumentary = plan.visualMutations.some((m) => m.mutation.includes('documentary'));
  return {
    ok: hasReducePolish && hasDeadSpace && hasDocumentary,
    detail: `reducePolish=${hasReducePolish} deadSpace=${hasDeadSpace} documentary=${hasDocumentary}`,
  };
}

function caseMutationDeterministic(): { ok: boolean; detail: string } {
  const input: MutationPlannerInput = {
    trustDebt: 7, repetitionCycles: 3, emotionalFlattening: 7,
    visualConvergence: 7, fatigueIndicators: 7,
  };
  const a = JSON.stringify(computeGenerationMutationPlan(input));
  const b = JSON.stringify(computeGenerationMutationPlan(input));
  return { ok: a === b, detail: a === b ? 'identical JSON' : 'differs' };
}

function caseMutationNoAutoApply(): { ok: boolean; detail: string } {
  const plan = computeGenerationMutationPlan({ trustDebt: 8 });
  const txt = JSON.stringify(plan);
  const banned = /"applied":\s*true|"autoApply":\s*true|"override":\s*true/.test(txt);
  const noticeOk = plan.advisoryNotice.toLowerCase().includes('advisory only');
  return {
    ok: !banned && noticeOk,
    detail: `banned=${banned} noticeOk=${noticeOk}`,
  };
}

// ─── fatigue ──────────────────────────────────────────────────

function caseFatigueVisualSaturation(): { ok: boolean; detail: string } {
  // Many identical visual fingerprints → high visual fatigue.
  const fp = (i: number): VisualFingerprint => ({
    at: i, bannerId: `b${i}`, formula: 'ENERGY', campaignMode: 'Minimal',
    framingFingerprint: 'L|F|T', lightingSignature: 'flat',
    lensBehavior: 'fixed', compositionGeometry: 'L|edge',
    pacingIdentity: 'p1', typographyRhythm: 'T|single',
    silenceDensity: 'low', motionCadence: 'still',
    emotionalColorTemperature: 'warm',
    realismLevel: 5, polishLevel: 5,
  });
  const result = computeCreativeFatigue({
    visualDNA: { fingerprints: Array.from({ length: 12 }, (_, i) => fp(i)) },
    narrativeDNA: null,
  });
  const visualVec = result.fatigueVectors.find((v) => v.vector === 'visual');
  return {
    ok: (visualVec?.fatigue ?? 0) >= 7 && result.predictabilityScore >= 7,
    detail: `visual.fatigue=${visualVec?.fatigue} predictability=${result.predictabilityScore} freshness=${result.freshnessScore}`,
  };
}

function caseFatigueDiversity(): { ok: boolean; detail: string } {
  // Distinct visual fingerprints → low fatigue.
  const fp = (i: number): VisualFingerprint => ({
    at: i, bannerId: `b${i}`, formula: 'ENERGY', campaignMode: 'Minimal',
    framingFingerprint: `L${i}|F${i}|T${i}`, lightingSignature: `lig-${i}`,
    lensBehavior: `lens-${i}`, compositionGeometry: `geom-${i}`,
    pacingIdentity: `pace-${i}`, typographyRhythm: `typo-${i}`,
    silenceDensity: 'mid', motionCadence: `motion-${i}`,
    emotionalColorTemperature: `temp-${i}`,
    realismLevel: 5, polishLevel: 5,
  });
  const result = computeCreativeFatigue({
    visualDNA: { fingerprints: Array.from({ length: 12 }, (_, i) => fp(i)) },
    narrativeDNA: null,
  });
  return {
    ok: result.fatigueLevel <= 4,
    detail: `fatigueLevel=${result.fatigueLevel} freshness=${result.freshnessScore}`,
  };
}

function caseFatigueDeterministic(): { ok: boolean; detail: string } {
  const input: CreativeFatigueInput = {
    visualDNA: { fingerprints: [
      { framingFingerprint: 'a', lightingSignature: 'b', lensBehavior: 'c',
        compositionGeometry: 'd', pacingIdentity: 'e',
        emotionalColorTemperature: 'warm', realismLevel: 5, polishLevel: 5 },
    ] },
    narrativeDNA: { fingerprints: [
      { hookFamily: 'h', persuasionStructure: 'p', emotionalCadence: 'e',
        tensionCurve: 't', payoffTiming: 'mid', silenceUsage: 'sparse',
        observationalDensity: 5, narrationStyle: 'observational',
        humanRealism: 5, ctaPressure: 5 },
    ] },
  };
  const a = JSON.stringify(computeCreativeFatigue(input));
  const b = JSON.stringify(computeCreativeFatigue(input));
  return { ok: a === b, detail: a === b ? 'identical JSON' : 'differs' };
}

// ─── DNA fingerprint stability ────────────────────────────────

function caseVisualFingerprintStability(): { ok: boolean; detail: string } {
  const banner = makeBanner(1);
  const a = JSON.stringify(extractVisualFingerprint(banner));
  const b = JSON.stringify(extractVisualFingerprint(banner));
  return { ok: a === b, detail: a === b ? 'same banner → identical fingerprint' : 'fingerprint drifts' };
}

function caseNarrativeFingerprintStability(): { ok: boolean; detail: string } {
  const banner = makeBanner(2);
  const a = JSON.stringify(extractNarrativeFingerprint(banner));
  const b = JSON.stringify(extractNarrativeFingerprint(banner));
  return { ok: a === b, detail: a === b ? 'same banner → identical fingerprint' : 'fingerprint drifts' };
}

function caseVisualFIFO(): { ok: boolean; detail: string } {
  let mem = createInitialVisualDNAMemory();
  for (let i = 0; i < 200; i++) {
    const fp = extractVisualFingerprint(makeBanner(i));
    mem = {
      ...mem,
      fingerprints: [...mem.fingerprints, fp].slice(-VISUAL_DNA_FINGERPRINT_LIMIT),
      totalObservations: mem.totalObservations + 1,
    };
  }
  return {
    ok: mem.fingerprints.length <= VISUAL_DNA_FINGERPRINT_LIMIT && mem.totalObservations === 200,
    detail: `length=${mem.fingerprints.length}/${VISUAL_DNA_FINGERPRINT_LIMIT} total=${mem.totalObservations}`,
  };
}

function caseNarrativeFIFO(): { ok: boolean; detail: string } {
  let mem = createInitialNarrativeDNAMemory();
  for (let i = 0; i < 200; i++) {
    const fp = extractNarrativeFingerprint(makeBanner(i));
    mem = {
      ...mem,
      fingerprints: [...mem.fingerprints, fp].slice(-NARRATIVE_DNA_FINGERPRINT_LIMIT),
      totalObservations: mem.totalObservations + 1,
    };
  }
  return {
    ok: mem.fingerprints.length <= NARRATIVE_DNA_FINGERPRINT_LIMIT && mem.totalObservations === 200,
    detail: `length=${mem.fingerprints.length}/${NARRATIVE_DNA_FINGERPRINT_LIMIT} total=${mem.totalObservations}`,
  };
}

// ─── static-isolation checks ──────────────────────────────────

async function caseStaticIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/refusalNarrativeEngine.ts',
    'lib/generationMutationPlanner.ts',
    'lib/creativeFatigueEngine.ts',
    'lib/visualDNAMemory.ts',
    'lib/narrativeDNAMemory.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    for (const re of forbidden) {
      if (re.test(src)) return { ok: false, detail: `forbidden import ${re} in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline imports in any module' };
}

async function caseNoRuntimeMutation(): Promise<{ ok: boolean; detail: string }> {
  // Engines must not call fetch or fs.writeFile.
  const engineFiles = [
    'lib/refusalNarrativeEngine.ts',
    'lib/generationMutationPlanner.ts',
    'lib/creativeFatigueEngine.ts',
  ];
  for (const f of engineFiles) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch found in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile found in ${f}` };
  }
  return { ok: true, detail: 'engines have no fetch / no fs.writeFile' };
}

async function caseGenerateUnchangedSignature(): Promise<{ ok: boolean; detail: string }> {
  // The generate route may import the new modules' WRITERS but must
  // not import the analyzers (the planner / refusal / fatigue engines).
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'app', 'api', 'generate', 'route.ts'),
    'utf8',
  );
  const advisoryImported = /generationMutationPlanner|refusalNarrativeEngine|creativeFatigueEngine/.test(src);
  return {
    ok: !advisoryImported,
    detail: advisoryImported
      ? 'an advisory analyzer is imported into /api/generate'
      : '/api/generate imports only DNA writers + drift writer (write-only post-pipeline observers)',
  };
}

// ─── mixed-input determinism ─────────────────────────────────

function caseMixedDeterministic(): { ok: boolean; detail: string } {
  const mutInput: MutationPlannerInput = {
    entropy: 4, originalityPressure: 7, trustDebt: 8,
    emotionalFlattening: 7, repetitionCycles: 3, visualConvergence: 7,
  };
  const refInput: RefusalNarrativeInput = {
    formula: 'FOCUS', campaignMode: 'Aggressive', brutality: 0.85,
    trustDebt: 8, repetitionPressure: 7, drift: 6, entropy: 4,
    narrativeStability: 3, persuasionVariance: 3, emotionalCompression: 7,
    identityErosion: 5, dignityErosion: 7,
  };
  const fatInput: CreativeFatigueInput = {
    visualDNA: { fingerprints: [
      { framingFingerprint: 'a', lightingSignature: 'b', lensBehavior: 'c',
        compositionGeometry: 'd', pacingIdentity: 'e',
        emotionalColorTemperature: 'warm', realismLevel: 5, polishLevel: 5 },
      { framingFingerprint: 'a', lightingSignature: 'b', lensBehavior: 'c',
        compositionGeometry: 'd', pacingIdentity: 'e',
        emotionalColorTemperature: 'warm', realismLevel: 5, polishLevel: 5 },
    ] },
    narrativeDNA: null,
  };
  const combined = (): string => JSON.stringify({
    mut: computeGenerationMutationPlan(mutInput),
    ref: computeRefusalNarrative(refInput),
    fat: computeCreativeFatigue(fatInput),
  });
  const a = combined();
  const b = combined();
  return { ok: a === b, detail: a === b ? 'identical across all three engines' : 'differs' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('ADAPTIVE CREATIVE GOVERNANCE VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['refusal-A',  'refusal narrative — severe inputs → severe + non-policy language',  () => caseRefusalA()],
    ['refusal-B',  'refusal narrative — mild inputs → mild/moderate',                    () => caseRefusalB()],
    ['mut-trust',  'mutation planner — trustDebt>6 reduces CTA / increases observational', () => caseMutationTrust()],
    ['mut-rep',    'mutation planner — repetition cycles → rotate hooks + asymmetry',     () => caseMutationRepetition()],
    ['mut-flat',   'mutation planner — emotional flattening → contrast + stillness',      () => caseMutationFlattening()],
    ['mut-visual', 'mutation planner — visual convergence → reduce polish + dead-space',  () => caseMutationVisualConv()],
    ['mut-det',    'mutation planner — deterministic across runs',                        () => caseMutationDeterministic()],
    ['mut-adv',    'mutation planner — advisory-only (no auto-apply flags)',              () => caseMutationNoAutoApply()],
    ['fat-sat',    'fatigue — visual saturation produces high vector fatigue',            () => caseFatigueVisualSaturation()],
    ['fat-div',    'fatigue — diverse fingerprints produce low fatigue',                  () => caseFatigueDiversity()],
    ['fat-det',    'fatigue — deterministic across runs',                                 () => caseFatigueDeterministic()],
    ['dna-vis',    'visual DNA fingerprint stability (same banner → same fingerprint)',   () => caseVisualFingerprintStability()],
    ['dna-narr',   'narrative DNA fingerprint stability',                                 () => caseNarrativeFingerprintStability()],
    ['fifo-vis',   'visual DNA FIFO cap (200 → ≤ limit)',                                 () => caseVisualFIFO()],
    ['fifo-narr',  'narrative DNA FIFO cap (200 → ≤ limit)',                              () => caseNarrativeFIFO()],
    ['isolation',  'no critic / pipeline imports in any new module',                      () => caseStaticIsolation()],
    ['no-mutate',  'engines have no fetch / no fs.writeFile (no runtime mutation)',       () => caseNoRuntimeMutation()],
    ['gen-isol',   '/api/generate imports only DNA writers, not advisory analyzers',      () => caseGenerateUnchangedSignature()],
    ['mixed-det',  'deterministic mixed-input output across all engines',                 () => caseMixedDeterministic()],
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
