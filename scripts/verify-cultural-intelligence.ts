/**
 * scripts/verify-cultural-intelligence.ts
 *
 * Deterministic verification for the Cultural Intelligence Layer
 * (foundation). Drives the engine + memory + view across cases A–L:
 *
 *   A · same history → same perception
 *   B · repetition raises aesthetic fatigue
 *   C · repeated emotional hooks raise numbness
 *   D · aggressive CTA repetition lowers trust climate
 *   E · documentary saturation raises conformity risk
 *   F · diverse emotional patterns improve freshness
 *   G · novelty without trust lowers authenticity
 *   H · FIFO caps stable
 *   I · no runtime mutation (calling perception does not mutate memory)
 *   J · no critic imports (static check of engine source)
 *   K · no external APIs (static check — no fetch / http / network imports)
 *   L · deterministic outputs (same input twice → byte-identical JSON)
 *
 * Run: npx tsx scripts/verify-cultural-intelligence.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  applyObservation, createInitialCulturalPerceptionMemory,
  createCulturalPerceptionMemoryStore,
  CULTURAL_OBSERVATION_LIMIT, buildHookFingerprint,
  type CulturalObservation, type CulturalPerceptionMemoryState,
} from '../lib/culturalPerceptionMemory';
import { computeCulturalPerception } from '../lib/culturalPerceptionEngine';
import { buildCulturalPerceptionView } from '../lib/culturalPerceptionView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('CULTURAL INTELLIGENCE LAYER — VERIFICATION\n');

// ─── observation factory ──────────────────────────────────────

function obs(over: Partial<CulturalObservation> = {}): CulturalObservation {
  return {
    at: 1700000000000,
    bannerId: 'b-1',
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    layoutFamily: 'documentary-crop',
    productRole: 'hand-held',
    typographyDominance: 'editorial',
    focalPoint: 'human-face',
    emotionalFamily: 'fatigue',
    stateLabel: 'third coffee',
    emotionalFrame: 'wound-a->desire-a',
    persuasionTone: 'observational' as unknown as string,
    pacing: 'quiet',
    restraint: 0.7,
    hookFingerprint: buildHookFingerprint('יום ארוך נוסף'),
    ctaStyle: 'bare',
    ctaBehavior: 'integrated',
    copyIntegrity: 7,
    trustSafety: 7,
    dignitySafety: 8,
    repetitionConcern: 3,
    ctaRestraint: 6,
    hebrewNaturalness: 8,
    policyBand: 'observe',
    outcomeVerdict: 'approve',
    ...over,
  };
}

function buildMemory(observations: CulturalObservation[]): CulturalPerceptionMemoryState {
  let state = createInitialCulturalPerceptionMemory();
  for (const o of observations) state = applyObservation(state, o);
  return state;
}

async function main() {
  // ── A. same history → same perception ────────────────────────
  {
    const memory = buildMemory([
      obs({ bannerId: 'a-1', at: 100 }),
      obs({ bannerId: 'a-2', at: 200, emotionalFamily: 'overstimulation' }),
      obs({ bannerId: 'a-3', at: 300, layoutFamily: 'editorial-page' }),
    ]);
    const p1 = computeCulturalPerception({ memory });
    const p2 = computeCulturalPerception({ memory });
    check('A · same history → same perception',
      JSON.stringify(p1) === JSON.stringify(p2),
      `aesthetic-fatigue ${p1.aestheticFatigue} · trust-climate ${p1.trustClimate} · signals×${p1.dominantSignals.length}`);
  }

  // ── B. repetition raises aesthetic fatigue ────────────────────
  {
    const lightMem = buildMemory([obs({ bannerId: 'b-base' })]);
    const heavy: CulturalObservation[] = [];
    for (let i = 0; i < 14; i++) heavy.push(obs({ bannerId: `b-${i}`, at: 100 + i }));
    const heavyMem = buildMemory(heavy);
    const lightP = computeCulturalPerception({ memory: lightMem });
    const heavyP = computeCulturalPerception({ memory: heavyMem });
    check('B · repetition raises aesthetic fatigue',
      heavyP.aestheticFatigue > lightP.aestheticFatigue && heavyP.aestheticFatigue >= 6,
      `light=${lightP.aestheticFatigue} heavy=${heavyP.aestheticFatigue}`);
  }

  // ── C. repeated emotional hooks raise numbness ────────────────
  {
    const numbObs: CulturalObservation[] = [];
    for (let i = 0; i < 12; i++) {
      numbObs.push(obs({
        bannerId: `c-${i}`, at: 100 + i,
        emotionalFamily: 'fatigue', emotionalFrame: 'same-frame',
        layoutFamily: i % 3 === 0 ? 'documentary-crop' : i % 3 === 1 ? 'editorial-page' : 'environmental-wide',
      }));
    }
    const numbMem = buildMemory(numbObs);
    const diverseObs: CulturalObservation[] = [];
    const families = ['fatigue', 'overstimulation', 'avoidance', 'numbness', 'pressure', 'fragmentation'];
    for (let i = 0; i < 12; i++) {
      diverseObs.push(obs({
        bannerId: `c-d-${i}`, at: 100 + i,
        emotionalFamily: families[i % families.length],
        emotionalFrame: `frame-${i}`,
      }));
    }
    const diverseMem = buildMemory(diverseObs);
    const numbP = computeCulturalPerception({ memory: numbMem });
    const diverseP = computeCulturalPerception({ memory: diverseMem });
    check('C · repeated emotional hooks raise numbness',
      numbP.audienceNumbness > diverseP.audienceNumbness,
      `repeated=${numbP.audienceNumbness} diverse=${diverseP.audienceNumbness}`);
  }

  // ── D. aggressive CTA repetition lowers trust climate ─────────
  {
    const calmMem = buildMemory(Array.from({ length: 8 }, (_, i) => obs({
      bannerId: `d-c-${i}`, at: 100 + i,
      restraint: 0.85, ctaStyle: 'bare', ctaBehavior: 'editorial',
      trustSafety: 8, dignitySafety: 8,
    })));
    const aggressiveMem = buildMemory(Array.from({ length: 8 }, (_, i) => obs({
      bannerId: `d-a-${i}`, at: 100 + i,
      restraint: 0.2, ctaStyle: 'pill', ctaBehavior: 'corner',
      trustSafety: 3, dignitySafety: 3, copyIntegrity: 4,
    })));
    const calmP = computeCulturalPerception({ memory: calmMem });
    const aggP = computeCulturalPerception({ memory: aggressiveMem });
    check('D · aggressive CTA repetition lowers trust climate',
      aggP.trustClimate < calmP.trustClimate && aggP.trustClimate <= 5,
      `calm=${calmP.trustClimate} aggressive=${aggP.trustClimate}`);
  }

  // ── E. documentary saturation raises conformity risk ──────────
  {
    const monoMem = buildMemory(Array.from({ length: 10 }, (_, i) => obs({
      bannerId: `e-m-${i}`, at: 100 + i,
      campaignMode: 'Documentary',
      layoutFamily: 'documentary-crop',
      productRole: 'environmental',
      typographyDominance: 'whisper',
      focalPoint: 'environment',
      pacing: 'quiet',
      emotionalFamily: 'fatigue',
    })));
    const mixedMem = buildMemory([
      obs({ bannerId: 'e-x-1', layoutFamily: 'editorial-page', emotionalFamily: 'pressure' }),
      obs({ bannerId: 'e-x-2', layoutFamily: 'off-center-portrait', emotionalFamily: 'overstimulation', pacing: 'wired' }),
      obs({ bannerId: 'e-x-3', layoutFamily: 'environmental-wide', emotionalFamily: 'avoidance', pacing: 'tense' }),
      obs({ bannerId: 'e-x-4', layoutFamily: 'timestamp-anchor', emotionalFamily: 'numbness', pacing: 'collapsed' }),
    ]);
    const monoP = computeCulturalPerception({ memory: monoMem });
    const mixedP = computeCulturalPerception({ memory: mixedMem });
    check('E · documentary saturation raises conformity risk',
      monoP.conformityRisk > mixedP.conformityRisk && monoP.conformityRisk >= 7,
      `mono=${monoP.conformityRisk} mixed=${mixedP.conformityRisk}`);
  }

  // ── F. diverse emotional patterns improve freshness ───────────
  {
    const monoMem = buildMemory(Array.from({ length: 10 }, (_, i) => obs({
      bannerId: `f-m-${i}`, at: 100 + i,
      emotionalFamily: 'fatigue', emotionalFrame: 'wound-x->desire-x',
    })));
    const families = ['fatigue', 'overstimulation', 'avoidance', 'numbness', 'pressure', 'fragmentation', 'paralysis', 'collapse'];
    const diverseMem = buildMemory(families.map((f, i) => obs({
      bannerId: `f-d-${i}`, at: 100 + i,
      emotionalFamily: f, emotionalFrame: `frame-${i}`,
    })));
    const monoP = computeCulturalPerception({ memory: monoMem });
    const diverseP = computeCulturalPerception({ memory: diverseMem });
    check('F · diverse emotional patterns improve freshness',
      diverseP.emotionalFreshness > monoP.emotionalFreshness && diverseP.emotionalFreshness >= 7,
      `mono=${monoP.emotionalFreshness} diverse=${diverseP.emotionalFreshness}`);
  }

  // ── G. novelty without trust lowers authenticity ─────────────
  {
    const safeNovelMem = buildMemory(Array.from({ length: 6 }, (_, i) => obs({
      bannerId: `g-s-${i}`, at: 100 + i,
      layoutFamily: ['documentary-crop', 'editorial-page', 'off-center-portrait', 'environmental-wide', 'timestamp-anchor', 'negative-space'][i % 6],
      restraint: 0.8, trustSafety: 8, dignitySafety: 8,
      ctaStyle: 'bare', ctaBehavior: 'editorial',
    })));
    const unsafeNovelMem = buildMemory(Array.from({ length: 6 }, (_, i) => obs({
      bannerId: `g-u-${i}`, at: 100 + i,
      layoutFamily: ['documentary-crop', 'editorial-page', 'off-center-portrait', 'environmental-wide', 'timestamp-anchor', 'negative-space'][i % 6],
      restraint: 0.2, trustSafety: 3, dignitySafety: 3, copyIntegrity: 3,
      ctaStyle: 'pill', ctaBehavior: 'corner',
    })));
    const safeP = computeCulturalPerception({ memory: safeNovelMem });
    const unsafeP = computeCulturalPerception({ memory: unsafeNovelMem });
    check('G · novelty without trust lowers authenticity',
      unsafeP.perceivedAuthenticity < safeP.perceivedAuthenticity && unsafeP.perceivedAuthenticity <= 5,
      `safe=${safeP.perceivedAuthenticity} unsafe=${unsafeP.perceivedAuthenticity} (trust safe=${safeP.trustClimate} unsafe=${unsafeP.trustClimate})`);
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cultural-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCulturalPerception = undefined;
    const store = createCulturalPerceptionMemoryStore(tmpDir);
    await store.reset();
    for (let i = 0; i < CULTURAL_OBSERVATION_LIMIT + 25; i++) {
      await store.append(obs({ bannerId: `h-${i}`, at: 100 + i }));
    }
    const state = await store.read();
    check('H · FIFO caps stable at CULTURAL_OBSERVATION_LIMIT',
      state.observations.length === CULTURAL_OBSERVATION_LIMIT &&
      state.totalObservations === CULTURAL_OBSERVATION_LIMIT + 25 &&
      state.trustTrajectory.length <= 64,
      `observations=${state.observations.length}/${CULTURAL_OBSERVATION_LIMIT} total=${state.totalObservations} trajectory=${state.trustTrajectory.length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCulturalPerception = undefined;
  }

  // ── I. no runtime mutation — perception call does not change memory
  {
    const memory = buildMemory([
      obs({ bannerId: 'i-1', at: 100 }),
      obs({ bannerId: 'i-2', at: 200, emotionalFamily: 'overstimulation' }),
    ]);
    const before = JSON.stringify(memory);
    computeCulturalPerception({ memory });
    computeCulturalPerception({ memory });
    const after = JSON.stringify(memory);
    check('I · no runtime mutation — perception call leaves memory unchanged',
      before === after,
      `memory bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports in engine source ────────────────────
  {
    const src = await fs.readFile(
      path.resolve(process.cwd(), 'lib/culturalPerceptionEngine.ts'), 'utf8',
    );
    const badImports = [
      'critic', 'finalVerdict', 'tasteJudge', 'humanReaction',
      'campaignDecision', 'perceptionCritic',
    ];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(src) ||
      new RegExp(`import\\s+[^;]+${needle}`, 'i').test(src),
    );
    check('J · no critic imports in engine source',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── K. no external APIs (no fetch / http / https / undici / axios) ─
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/culturalPerceptionEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/culturalPerceptionMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/culturalPerceptionView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request', "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in cultural sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs — call view builder twice ───────
  {
    const memory = buildMemory(Array.from({ length: 8 }, (_, i) => obs({
      bannerId: `l-${i}`, at: 100 + i,
      emotionalFamily: ['fatigue', 'overstimulation', 'pressure', 'numbness'][i % 4],
      layoutFamily: ['documentary-crop', 'editorial-page'][i % 2],
    })));
    const view1 = buildCulturalPerceptionView({
      cultural: memory, strategy: null, copywriter: null, quality: null, policyAudit: null,
    });
    const view2 = buildCulturalPerceptionView({
      cultural: memory, strategy: null, copywriter: null, quality: null, policyAudit: null,
    });
    check('L · deterministic — same memory state → byte-identical view',
      JSON.stringify(view1) === JSON.stringify(view2),
      `signals=[${view1.perception.dominantSignals.join(',')}] resonance=${view1.perception.humanResonance}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
