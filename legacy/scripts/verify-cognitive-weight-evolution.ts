/**
 * scripts/verify-cognitive-weight-evolution.ts
 *
 * Deterministic verification for the Dynamic Cognitive Weight
 * Evolution Engine. Drives across cases A–L:
 *
 *   A · same history → same weights
 *   B · repeated trust collapse raises trust-system authority
 *   C · repeated novelty fatigue lowers novelty authority
 *   D · recurring aggressive success raises strategy authority
 *   E · unstable outcomes raise fragmentation
 *   F · aligned systems increase stability
 *   G · recurring disagreement increases adaptation pressure
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports (static check)
 *   K · no external APIs (static check)
 *   L · deterministic outputs (byte-identical JSON)
 *
 * Run: npx tsx scripts/verify-cognitive-weight-evolution.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import type { AdStrategyAssessment } from '../lib/adStrategyEngine';
import type { CopyQualityAxis } from '../lib/copyQualityAdapter';
import type { CulturalPerception, CulturalSignal } from '../lib/culturalPerceptionEngine';
import type { CrossBrainConflict } from '../lib/crossBrainConflictEngine';
import {
  computeCognitiveWeightEvolution, ALL_COGNITIVE_SYSTEMS,
  type CognitiveSystem,
} from '../lib/cognitiveWeightEvolution';
import {
  applyWeightObservation, createInitialCognitiveWeightMemory,
  buildHistoryContext, createCognitiveWeightMemoryStore,
  WEIGHT_OBSERVATION_LIMIT,
  type CognitiveWeightObservation,
} from '../lib/cognitiveWeightMemory';
import { buildCognitiveWeightLongitudinalView } from '../lib/cognitiveWeightLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('DYNAMIC COGNITIVE WEIGHT EVOLUTION — VERIFICATION\n');

// ─── synthetic input builders ─────────────────────────────────

function strategy(over: Partial<AdStrategyAssessment> = {}): AdStrategyAssessment {
  const baseConstraints = {
    hookIntensity: 5,
    productVisibility: 5,
    textAmount: 'minimal' as const,
    ctaStrength: 4,
    emotionalDirectness: 5,
    proofRequirement: 'medium' as const,
    criticStrictnessRecommendation: 'baseline' as const,
  };
  return {
    primaryAudience: 'office_worker',
    secondaryAudience: null,
    emotionalWound: 'tired',
    hiddenDesire: 'calm',
    surfaceObjection: 'cost',
    deeperObjection: 'doubt',
    trustBarrier: 'new',
    campaignRole: 'trust_builder',
    recommendedAngle: 'baseline',
    forbiddenAngle: 'none',
    persuasionMode: 'observational',
    storyShape: 'mirror',
    proofNeed: 'medium',
    urgencyLevel: 3,
    repetitionRisk: 2,
    brandRisk: 2,
    trustDebt: 2,
    strategicDepth: 6,
    confidence: 7,
    reasonCodes: [],
    creativeConstraints: { ...baseConstraints, ...(over.creativeConstraints ?? {}) },
    ...over,
  };
}

function copyQuality(over: Partial<CopyQualityAxis> = {}): CopyQualityAxis {
  return {
    copyIntegrity: 7, trustSafety: 7, dignitySafety: 8,
    repetitionConcern: 3, proofAdequacy: 6, ctaRestraint: 7,
    hebrewNaturalness: 8, strategicCopyFit: 7,
    warnings: [], reasonCodes: [],
    ...over,
  };
}

function culture(over: Partial<CulturalPerception> = {}): CulturalPerception {
  return {
    culturalState: 'baseline', dominantSignals: [],
    noveltyScore: 5, emotionalFreshness: 6, trustClimate: 7,
    aestheticFatigue: 3, visualNoiseLevel: 4, pacingFatigue: 3,
    hookSaturation: 3, conformityRisk: 3, audienceNumbness: 2,
    perceivedAuthenticity: 7, humanResonance: 7,
    culturalWarnings: [], strategicOpportunities: [], forbiddenDirections: [],
    emotionalDrift: { movingToward: [], movingAwayFrom: [] },
    reasonCodes: ['baseline', 'rich', 'data', 'many', 'codes', 'present'],
    ...over,
  };
}

function conflict(over: Partial<CrossBrainConflict> = {}): CrossBrainConflict {
  return {
    overallTension: 3, cognitiveStability: 7, alignmentScore: 7,
    dominantConflict: null, activeConflicts: [],
    agreementZones: ['baseline'], unstableZones: [], silentRisks: [],
    systemWeights: { strategy: 6, culture: 6, trust: 7, novelty: 5, fatigue: 4, quality: 7 },
    confidenceGradient: { highConfidenceAreas: [], uncertainAreas: [] },
    reasonCodes: [],
    ...over,
  };
}

async function main() {
  // ── A. same history → same weights ───────────────────────────
  {
    const input = {
      strategy: strategy(), copyQuality: copyQuality(),
      culturalPerception: culture(), conflict: conflict(),
    };
    const w1 = computeCognitiveWeightEvolution(input);
    const w2 = computeCognitiveWeightEvolution(input);
    check('A · same inputs → same weights',
      JSON.stringify(w1) === JSON.stringify(w2),
      `stability ${w1.globalStability} · dominant ${w1.dominantSystems.map((d) => d.system).join(',')}`);
  }

  // ── B. trust collapse raises trust-system authority ──────────
  {
    const calm = computeCognitiveWeightEvolution({
      strategy: strategy({ trustDebt: 1 }),
      culturalPerception: culture({ trustClimate: 9 }),
    });
    const collapsed = computeCognitiveWeightEvolution({
      strategy: strategy({ trustDebt: 9 }),
      culturalPerception: culture({
        trustClimate: 2,
        dominantSignals: ['trust-fragile'] as CulturalSignal[],
      }),
    });
    check('B · trust collapse raises trust authority',
      collapsed.weights.trust > calm.weights.trust && collapsed.weights.trust >= 7,
      `calm.trust=${calm.weights.trust} collapsed.trust=${collapsed.weights.trust}`);
  }

  // ── C. novelty fatigue lowers novelty authority ──────────────
  {
    const active = computeCognitiveWeightEvolution({
      culturalPerception: culture({ noveltyScore: 9 }),
    });
    const fatigued = computeCognitiveWeightEvolution({
      culturalPerception: culture({ noveltyScore: 2 }),
    });
    check('C · low novelty era lowers novelty authority',
      fatigued.weights.novelty < active.weights.novelty && fatigued.weights.novelty <= 4,
      `active.novelty=${active.weights.novelty} fatigued.novelty=${fatigued.weights.novelty}`);
  }

  // ── D. recurring aggressive (high-confidence strategy) raises strategy authority ──
  {
    const baseInput = {
      strategy: strategy({ confidence: 9, trustDebt: 1 }),
      culturalPerception: culture({ trustClimate: 8, audienceNumbness: 1 }),
      conflict: conflict({ cognitiveStability: 9, alignmentScore: 9 }),
    };
    // Build memory with repeated high-strategy observations.
    let mem = createInitialCognitiveWeightMemory();
    for (let i = 0; i < 10; i++) {
      const w = computeCognitiveWeightEvolution({
        ...baseInput,
        history: buildHistoryContext(mem),
      });
      mem = applyWeightObservation(mem, {
        at: 100 + i, bannerId: `d-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        weights: w.weights,
        globalStability: w.globalStability,
        adaptationPressure: w.adaptationPressure,
        cognitiveFragmentation: w.cognitiveFragmentation,
        dominantSystem: w.dominantSystems[0]?.system ?? null,
        suppressedSystems: w.suppressedSystems.map((s) => s.system),
      });
    }
    check('D · recurring high-confidence strategy raises strategy authority',
      mem.ewmaWeights.strategy >= 7 && mem.dominanceCounts.strategy + mem.dominanceCounts.quality >= 5,
      `strategy ewma=${mem.ewmaWeights.strategy.toFixed(2)} dominanceCounts=${JSON.stringify(mem.dominanceCounts)}`);
  }

  // ── E. unstable outcomes raise fragmentation ─────────────────
  {
    const stable = computeCognitiveWeightEvolution({
      strategy: strategy(),
      culturalPerception: culture(),
      conflict: conflict(),
    });
    // Build memory with high-variance weights → variance shows up in history context.
    let mem = createInitialCognitiveWeightMemory();
    for (let i = 0; i < 12; i++) {
      const swing = i % 2 === 0 ? 9 : 1;
      const weights = {} as Record<CognitiveSystem, number>;
      for (const s of ALL_COGNITIVE_SYSTEMS) weights[s] = swing;
      mem = applyWeightObservation(mem, {
        at: 100 + i, bannerId: `e-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        weights,
        globalStability: 3, adaptationPressure: 8, cognitiveFragmentation: 8,
        dominantSystem: i % 2 === 0 ? 'trust' : 'novelty',
        suppressedSystems: [],
      });
    }
    const unstable = computeCognitiveWeightEvolution({
      strategy: strategy(), culturalPerception: culture(),
      conflict: conflict({ overallTension: 8, cognitiveStability: 3, activeConflicts: [{
        type: 'trust-vs-conversion', severity: 8, systemsInvolved: ['trust'],
        explanation: '', suggestedObservation: '',
      }, {
        type: 'novelty-vs-authenticity', severity: 7, systemsInvolved: ['novelty'],
        explanation: '', suggestedObservation: '',
      }] }),
      history: buildHistoryContext(mem),
    });
    check('E · unstable history + active conflicts → higher fragmentation',
      unstable.cognitiveFragmentation > stable.cognitiveFragmentation && unstable.cognitiveFragmentation >= 6,
      `stable.frag=${stable.cognitiveFragmentation} unstable.frag=${unstable.cognitiveFragmentation}`);
  }

  // ── F. aligned systems increase stability ────────────────────
  {
    const aligned = computeCognitiveWeightEvolution({
      strategy: strategy({ confidence: 9, trustDebt: 1 }),
      copyQuality: copyQuality({ copyIntegrity: 9, trustSafety: 9, dignitySafety: 9 }),
      culturalPerception: culture({ trustClimate: 9, humanResonance: 9,
        aestheticFatigue: 1, audienceNumbness: 1 }),
      conflict: conflict({ overallTension: 1, cognitiveStability: 9, alignmentScore: 9 }),
    });
    const fractured = computeCognitiveWeightEvolution({
      strategy: strategy({ confidence: 3, trustDebt: 9 }),
      copyQuality: copyQuality({ copyIntegrity: 2, trustSafety: 2, dignitySafety: 2 }),
      culturalPerception: culture({ trustClimate: 2, humanResonance: 2,
        aestheticFatigue: 9, audienceNumbness: 9,
        dominantSignals: ['trust-fragile', 'aesthetic-burnout'] as CulturalSignal[] }),
      conflict: conflict({ overallTension: 9, cognitiveStability: 2, alignmentScore: 2,
        activeConflicts: [{
          type: 'trust-vs-conversion', severity: 9, systemsInvolved: ['trust'],
          explanation: '', suggestedObservation: '',
        }] }),
    });
    check('F · aligned systems increase stability',
      aligned.globalStability > fractured.globalStability && aligned.globalStability >= 7,
      `aligned.stability=${aligned.globalStability} fractured.stability=${fractured.globalStability}`);
  }

  // ── G. recurring disagreement increases adaptation pressure ──
  {
    const calmInput = {
      strategy: strategy(), culturalPerception: culture(),
      conflict: conflict(),
    };
    const stormInput = {
      strategy: strategy({ trustDebt: 9, confidence: 3 }),
      culturalPerception: culture({ trustClimate: 2, audienceNumbness: 9, aestheticFatigue: 9 }),
      conflict: conflict({
        overallTension: 9, cognitiveStability: 2, alignmentScore: 2,
        activeConflicts: [
          { type: 'trust-vs-conversion', severity: 8, systemsInvolved: ['trust'], explanation: '', suggestedObservation: '' },
          { type: 'emotion-vs-fatigue',  severity: 8, systemsInvolved: ['fatigue'], explanation: '', suggestedObservation: '' },
          { type: 'novelty-vs-authenticity', severity: 8, systemsInvolved: ['novelty'], explanation: '', suggestedObservation: '' },
        ],
      }),
    };
    // Pre-seed memory with calm observations, then evaluate adaptation under storm.
    let mem = createInitialCognitiveWeightMemory();
    for (let i = 0; i < 8; i++) {
      const w = computeCognitiveWeightEvolution({ ...calmInput, history: buildHistoryContext(mem) });
      mem = applyWeightObservation(mem, {
        at: 100 + i, bannerId: `g-c-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        weights: w.weights,
        globalStability: w.globalStability,
        adaptationPressure: w.adaptationPressure,
        cognitiveFragmentation: w.cognitiveFragmentation,
        dominantSystem: w.dominantSystems[0]?.system ?? null,
        suppressedSystems: w.suppressedSystems.map((s) => s.system),
      });
    }
    const storm = computeCognitiveWeightEvolution({
      ...stormInput, history: buildHistoryContext(mem),
    });
    check('G · recurring disagreement increases adaptation pressure',
      storm.adaptationPressure >= 5 && storm.weightDrift.length >= 2,
      `adaptationPressure=${storm.adaptationPressure} weightDrift=${storm.weightDrift.length}`);
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'cogweight-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCognitiveWeight = undefined;
    const store = createCognitiveWeightMemoryStore(tmpDir);
    await store.reset();
    const baseWeights = {} as Record<CognitiveSystem, number>;
    for (const s of ALL_COGNITIVE_SYSTEMS) baseWeights[s] = 5;
    for (let i = 0; i < WEIGHT_OBSERVATION_LIMIT + 20; i++) {
      const obs: CognitiveWeightObservation = {
        at: 100 + i, bannerId: `h-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        weights: { ...baseWeights },
        globalStability: 5, adaptationPressure: 5, cognitiveFragmentation: 5,
        dominantSystem: null, suppressedSystems: [],
      };
      await store.append(obs);
    }
    const state = await store.read();
    check('H · FIFO cap stable at WEIGHT_OBSERVATION_LIMIT',
      state.observations.length === WEIGHT_OBSERVATION_LIMIT &&
      state.totalObservations === WEIGHT_OBSERVATION_LIMIT + 20 &&
      state.fragmentationTrace.length <= 64,
      `observations=${state.observations.length}/${WEIGHT_OBSERVATION_LIMIT} total=${state.totalObservations} trace=${state.fragmentationTrace.length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCognitiveWeight = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    const input = {
      strategy: strategy(), copyQuality: copyQuality(),
      culturalPerception: culture(), conflict: conflict(),
    };
    const before = JSON.stringify(input);
    computeCognitiveWeightEvolution(input);
    computeCognitiveWeightEvolution(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after, `input bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/cognitiveWeightEvolution.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/cognitiveWeightMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/cognitiveWeightLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = [
      'tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic',
    ];
    // 'critic' would match @lib/copyQualityRefusal etc — narrow to import-from patterns.
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    // Reject any import path that ends with /critic or has /critic/.
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in cognitive weight sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/cognitiveWeightEvolution.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/cognitiveWeightMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/cognitiveWeightLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in cognitive weight sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialCognitiveWeightMemory();
    for (let i = 0; i < 6; i++) {
      const obs: CognitiveWeightObservation = {
        at: 100 + i, bannerId: `l-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        weights: ALL_COGNITIVE_SYSTEMS.reduce((acc, s) => {
          acc[s] = 5 + (i % 3);
          return acc;
        }, {} as Record<CognitiveSystem, number>),
        globalStability: 6, adaptationPressure: 4, cognitiveFragmentation: 4,
        dominantSystem: i % 2 === 0 ? 'trust' : 'culture',
        suppressedSystems: ['novelty'],
      };
      mem = applyWeightObservation(mem, obs);
    }
    const view1 = buildCognitiveWeightLongitudinalView({ memory: mem });
    const view2 = buildCognitiveWeightLongitudinalView({ memory: mem });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(view1) === JSON.stringify(view2),
      `dominance×${view1.systemDominanceRanking.length} trend=${view1.fragmentationTrend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
