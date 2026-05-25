/**
 * scripts/verify-identity-continuity.ts
 *
 * Deterministic verification for the Persistent Identity Continuity
 * Engine. Drives across cases A–L:
 *
 *   A · same history → same identity
 *   B · recurring trust-preserving behavior raises trust-preserving persistence
 *   C · recurring novelty spikes raise novelty-seeking vector
 *   D · recurring contradictions raise fragmentation
 *   E · stable eras increase continuity
 *   F · chaotic switching lowers behavioral consistency
 *   G · recurring audience mirroring raises audience-mirroring vector
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-identity-continuity.ts
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
  type CognitiveWeightEvolution, type CognitiveSystem,
} from '../lib/cognitiveWeightEvolution';
import {
  computeIdentityContinuity, ALL_IDENTITY_VECTORS,
  type IdentityVector, type IdentityContinuity,
} from '../lib/identityContinuityEngine';
import {
  applyIdentityObservation, createInitialIdentityContinuityMemory,
  buildIdentityHistoryContext, createIdentityContinuityMemoryStore,
  IDENTITY_OBSERVATION_LIMIT,
  type IdentityObservation,
} from '../lib/identityContinuityMemory';
import { buildIdentityContinuityLongitudinalView } from '../lib/identityContinuityLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('PERSISTENT IDENTITY CONTINUITY — VERIFICATION\n');

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
    agreementZones: [], unstableZones: [], silentRisks: [],
    systemWeights: { strategy: 6, culture: 6, trust: 7, novelty: 5, fatigue: 4, quality: 7 },
    confidenceGradient: { highConfidenceAreas: [], uncertainAreas: [] },
    reasonCodes: [],
    ...over,
  };
}

function weightsFor(input: Parameters<typeof computeCognitiveWeightEvolution>[0]): CognitiveWeightEvolution {
  return computeCognitiveWeightEvolution(input);
}

function obsFromIdentity(
  at: number, bannerId: string, identity: IdentityContinuity,
): IdentityObservation {
  return {
    at, bannerId, formula: 'ENERGY', campaignMode: 'Documentary',
    vectorStrengths: identity.vectorStrengths,
    identityStability: identity.identityStability,
    identityFragmentation: identity.identityFragmentation,
    behavioralConsistency: identity.behavioralConsistency,
    adaptationVelocity: identity.adaptationVelocity,
    continuityRisk: identity.continuityRisk,
    dominantVector: identity.dominantIdentityVectors[0]?.vector ?? null,
    emergingVectors: identity.emergingIdentityVectors.map((e) => e.vector),
    collapsingVectors: identity.collapsingIdentityVectors.map((c) => c.vector),
    contradictionCount: identity.identityContradictions.length,
  };
}

async function main() {
  // ── A. same inputs → same identity ───────────────────────────
  {
    const cw = weightsFor({
      strategy: strategy(),
      culturalPerception: culture(),
      conflict: conflict(),
    });
    const input = {
      cognitiveWeight: cw,
      conflict: conflict(),
      culturalPerception: culture(),
      strategy: strategy(),
      copyQuality: copyQuality(),
      directionRestraint: 0.7,
    };
    const i1 = computeIdentityContinuity(input);
    const i2 = computeIdentityContinuity(input);
    check('A · same inputs → same identity',
      JSON.stringify(i1) === JSON.stringify(i2),
      `stability ${i1.identityStability} · dominant ${i1.dominantIdentityVectors.map((d) => d.vector).join(',') || 'none'}`);
  }

  // ── B. recurring trust-preserving raises persistence ─────────
  {
    let mem = createInitialIdentityContinuityMemory();
    for (let i = 0; i < 12; i++) {
      const cw = weightsFor({
        strategy: strategy({ trustDebt: 1, confidence: 8 }),
        copyQuality: copyQuality({ trustSafety: 9, dignitySafety: 9 }),
        culturalPerception: culture({ trustClimate: 3,
          dominantSignals: ['trust-fragile'] as CulturalSignal[] }),
        conflict: conflict(),
      });
      const identity = computeIdentityContinuity({
        cognitiveWeight: cw,
        conflict: conflict(),
        culturalPerception: culture({ trustClimate: 3,
          dominantSignals: ['trust-fragile'] as CulturalSignal[] }),
        strategy: strategy({ trustDebt: 1 }),
        copyQuality: copyQuality({ trustSafety: 9, dignitySafety: 9 }),
        directionRestraint: 0.75,
        history: buildIdentityHistoryContext(mem),
      });
      mem = applyIdentityObservation(mem, obsFromIdentity(100 + i, `b-${i}`, identity));
    }
    const trustEwma = mem.ewmaStrengths['trust-preserving'];
    const dominanceCount = mem.dominanceCounts['trust-preserving'] ?? 0;
    check('B · recurring trust-preserving raises persistence',
      trustEwma >= 6 && dominanceCount >= 5,
      `trust-preserving ewma=${trustEwma.toFixed(2)} dominance×${dominanceCount}`);
  }

  // ── C. recurring novelty spikes raise novelty-seeking ───────
  {
    let mem = createInitialIdentityContinuityMemory();
    for (let i = 0; i < 12; i++) {
      const cw = weightsFor({
        culturalPerception: culture({
          noveltyScore: 9, emotionalFreshness: 8,
          dominantSignals: ['emotionally-fresh'] as CulturalSignal[],
        }),
        conflict: conflict(),
      });
      const identity = computeIdentityContinuity({
        cognitiveWeight: cw,
        conflict: conflict(),
        culturalPerception: culture({
          noveltyScore: 9, emotionalFreshness: 8,
          dominantSignals: ['emotionally-fresh'] as CulturalSignal[],
        }),
        directionRestraint: 0.5,
        history: buildIdentityHistoryContext(mem),
      });
      mem = applyIdentityObservation(mem, obsFromIdentity(100 + i, `c-${i}`, identity));
    }
    check('C · recurring novelty spikes raise novelty-seeking',
      mem.ewmaStrengths['novelty-seeking'] >= 5,
      `novelty-seeking ewma=${mem.ewmaStrengths['novelty-seeking'].toFixed(2)} dominance×${mem.dominanceCounts['novelty-seeking']}`);
  }

  // ── D. recurring contradictions raise fragmentation ─────────
  {
    const cleanInput = {
      cognitiveWeight: weightsFor({
        strategy: strategy(), culturalPerception: culture(), conflict: conflict(),
      }),
      conflict: conflict(),
      culturalPerception: culture(),
      strategy: strategy(),
      copyQuality: copyQuality(),
      directionRestraint: 0.6,
    };
    const cleanId = computeIdentityContinuity(cleanInput);
    // High contradiction setup: restraint-first AND aggressive-conversion both strong.
    const contradictionInput = {
      cognitiveWeight: weightsFor({
        strategy: strategy({
          urgencyLevel: 9,
          creativeConstraints: {
            hookIntensity: 9, productVisibility: 5, textAmount: 'minimal',
            ctaStrength: 9, emotionalDirectness: 9, proofRequirement: 'medium',
            criticStrictnessRecommendation: 'baseline',
          },
        }),
        culturalPerception: culture({
          aestheticFatigue: 9, audienceNumbness: 9,
          dominantSignals: ['aesthetic-burnout', 'over-performed'] as CulturalSignal[],
        }),
        conflict: conflict({
          overallTension: 9, cognitiveStability: 2,
          activeConflicts: [
            { type: 'trust-vs-conversion', severity: 8, systemsInvolved: ['trust'],
              explanation: '', suggestedObservation: '' },
            { type: 'restraint-vs-attention', severity: 8, systemsInvolved: ['restraint'],
              explanation: '', suggestedObservation: '' },
          ],
        }),
      }),
      conflict: conflict({
        overallTension: 9, cognitiveStability: 2,
        activeConflicts: [
          { type: 'trust-vs-conversion', severity: 8, systemsInvolved: ['trust'],
            explanation: '', suggestedObservation: '' },
          { type: 'restraint-vs-attention', severity: 8, systemsInvolved: ['restraint'],
            explanation: '', suggestedObservation: '' },
        ],
      }),
      culturalPerception: culture({
        aestheticFatigue: 9, audienceNumbness: 9,
        dominantSignals: ['aesthetic-burnout', 'over-performed'] as CulturalSignal[],
      }),
      strategy: strategy({
        urgencyLevel: 9,
        creativeConstraints: {
          hookIntensity: 9, productVisibility: 5, textAmount: 'minimal',
          ctaStrength: 9, emotionalDirectness: 9, proofRequirement: 'medium',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      copyQuality: copyQuality({ ctaRestraint: 1 }),
      directionRestraint: 0.85,        // direction is restrained but copy is aggressive
    };
    const contradictionId = computeIdentityContinuity(contradictionInput);
    check('D · recurring contradictions raise fragmentation',
      contradictionId.identityFragmentation > cleanId.identityFragmentation &&
      contradictionId.identityContradictions.length >= 1,
      `clean.frag=${cleanId.identityFragmentation} contradictionId.frag=${contradictionId.identityFragmentation} contradictions=${contradictionId.identityContradictions.length}`);
  }

  // ── E. stable eras increase continuity ───────────────────────
  {
    // Seed a stable era with consistent inputs that produce a clear
    // dominant vector each run (restraint-first via high restraint
    // direction + over-performance signals raising restraint weight).
    let mem = createInitialIdentityContinuityMemory();
    const stableCulture = culture({
      humanResonance: 9, perceivedAuthenticity: 9,
      pacingFatigue: 8, aestheticFatigue: 8,
      dominantSignals: ['over-performed', 'human-resonant'] as CulturalSignal[],
    });
    const stableStrategy = strategy({ confidence: 8 });
    const stableInputBase = {
      conflict: conflict({ cognitiveStability: 8, alignmentScore: 8 }),
      culturalPerception: stableCulture,
      strategy: stableStrategy,
      copyQuality: copyQuality({ ctaRestraint: 9 }),
      directionRestraint: 0.9,
    };
    for (let i = 0; i < 12; i++) {
      const cw = weightsFor({
        strategy: stableStrategy,
        culturalPerception: stableCulture,
        conflict: stableInputBase.conflict,
      });
      const id = computeIdentityContinuity({
        ...stableInputBase,
        cognitiveWeight: cw,
        history: buildIdentityHistoryContext(mem),
      });
      mem = applyIdentityObservation(mem, obsFromIdentity(100 + i, `e-${i}`, id));
    }
    const view = buildIdentityContinuityLongitudinalView({ memory: mem });
    check('E · stable eras increase continuity (consolidating/stable trend, era detected)',
      (view.continuityTrend === 'consolidating' || view.continuityTrend === 'stable') &&
      view.averageFragmentation <= 4 &&
      view.adaptationEras.length >= 1,
      `trend=${view.continuityTrend} avgFrag=${view.averageFragmentation} eras=${view.adaptationEras.length}`);
  }

  // ── F. chaotic switching lowers behavioral consistency ──────
  {
    // Build memory with high-variance vector strengths.
    let mem = createInitialIdentityContinuityMemory();
    for (let i = 0; i < 14; i++) {
      const strengths = {} as Record<IdentityVector, number>;
      // Wild swings between 0 and 10 across all vectors.
      const swing = i % 2 === 0 ? 9 : 0;
      for (const v of ALL_IDENTITY_VECTORS) strengths[v] = swing;
      mem = applyIdentityObservation(mem, {
        at: 100 + i, bannerId: `f-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        vectorStrengths: strengths,
        identityStability: i % 2 === 0 ? 2 : 8,
        identityFragmentation: i % 2 === 0 ? 8 : 2,
        behavioralConsistency: 3,
        adaptationVelocity: 8,
        continuityRisk: 7,
        dominantVector: i % 2 === 0 ? 'aggressive-conversion' : 'restraint-first',
        emergingVectors: [],
        collapsingVectors: [],
        contradictionCount: 2,
      });
    }
    const chaoticId = computeIdentityContinuity({
      cognitiveWeight: weightsFor({
        strategy: strategy(), culturalPerception: culture(), conflict: conflict(),
      }),
      conflict: conflict(),
      culturalPerception: culture(),
      strategy: strategy(),
      copyQuality: copyQuality(),
      directionRestraint: 0.6,
      history: buildIdentityHistoryContext(mem),
    });
    // Compare to fresh (no history) baseline.
    const baselineId = computeIdentityContinuity({
      cognitiveWeight: weightsFor({
        strategy: strategy(), culturalPerception: culture(), conflict: conflict(),
      }),
      conflict: conflict(),
      culturalPerception: culture(),
      strategy: strategy(),
      copyQuality: copyQuality(),
      directionRestraint: 0.6,
    });
    check('F · chaotic switching lowers behavioral consistency',
      chaoticId.behavioralConsistency < baselineId.behavioralConsistency &&
      chaoticId.adaptationVelocity > 0,
      `chaotic.consistency=${chaoticId.behavioralConsistency} baseline.consistency=${baselineId.behavioralConsistency} chaotic.adaptVel=${chaoticId.adaptationVelocity}`);
  }

  // ── G. recurring audience mirroring raises audience-mirroring ─
  {
    let mem = createInitialIdentityContinuityMemory();
    for (let i = 0; i < 10; i++) {
      const cw = weightsFor({
        strategy: strategy({ persuasionMode: 'empathic', storyShape: 'mirror' }),
        culturalPerception: culture({
          humanResonance: 9, perceivedAuthenticity: 9,
          dominantSignals: ['human-resonant'] as CulturalSignal[],
        }),
        conflict: conflict(),
      });
      const id = computeIdentityContinuity({
        cognitiveWeight: cw,
        conflict: conflict(),
        culturalPerception: culture({
          humanResonance: 9, perceivedAuthenticity: 9,
          dominantSignals: ['human-resonant'] as CulturalSignal[],
        }),
        strategy: strategy({ persuasionMode: 'empathic', storyShape: 'mirror' }),
        copyQuality: copyQuality(),
        directionRestraint: 0.7,
        history: buildIdentityHistoryContext(mem),
      });
      mem = applyIdentityObservation(mem, obsFromIdentity(100 + i, `g-${i}`, id));
    }
    check('G · recurring audience mirroring raises audience-mirroring vector',
      mem.ewmaStrengths['audience-mirroring'] >= 5,
      `audience-mirroring ewma=${mem.ewmaStrengths['audience-mirroring'].toFixed(2)} dominance×${mem.dominanceCounts['audience-mirroring']}`);
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'identity-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodIdentityContinuity = undefined;
    const store = createIdentityContinuityMemoryStore(tmpDir);
    await store.reset();
    const baseStrengths = {} as Record<IdentityVector, number>;
    for (const v of ALL_IDENTITY_VECTORS) baseStrengths[v] = 5;
    for (let i = 0; i < IDENTITY_OBSERVATION_LIMIT + 20; i++) {
      await store.append({
        at: 100 + i, bannerId: `h-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        vectorStrengths: { ...baseStrengths },
        identityStability: 5, identityFragmentation: 5, behavioralConsistency: 5,
        adaptationVelocity: 3, continuityRisk: 5,
        dominantVector: null, emergingVectors: [], collapsingVectors: [],
        contradictionCount: 0,
      });
    }
    const state = await store.read();
    check('H · FIFO cap stable at IDENTITY_OBSERVATION_LIMIT',
      state.observations.length === IDENTITY_OBSERVATION_LIMIT &&
      state.totalObservations === IDENTITY_OBSERVATION_LIMIT + 20 &&
      state.stabilityTrace.length <= 64,
      `observations=${state.observations.length}/${IDENTITY_OBSERVATION_LIMIT} total=${state.totalObservations} trace=${state.stabilityTrace.length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodIdentityContinuity = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    const input = {
      cognitiveWeight: weightsFor({
        strategy: strategy(), culturalPerception: culture(), conflict: conflict(),
      }),
      conflict: conflict(),
      culturalPerception: culture(),
      strategy: strategy(),
      copyQuality: copyQuality(),
      directionRestraint: 0.7,
    };
    const before = JSON.stringify(input);
    computeIdentityContinuity(input);
    computeIdentityContinuity(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after, `input bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/identityContinuityEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/identityContinuityMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/identityContinuityLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in identity sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/identityContinuityEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/identityContinuityMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/identityContinuityLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in identity sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialIdentityContinuityMemory();
    for (let i = 0; i < 6; i++) {
      const strengths = {} as Record<IdentityVector, number>;
      for (const v of ALL_IDENTITY_VECTORS) strengths[v] = 4 + (i % 3);
      mem = applyIdentityObservation(mem, {
        at: 100 + i, bannerId: `l-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        vectorStrengths: strengths,
        identityStability: 6, identityFragmentation: 4, behavioralConsistency: 6,
        adaptationVelocity: 3, continuityRisk: 4,
        dominantVector: i % 2 === 0 ? 'trust-preserving' : 'restraint-first',
        emergingVectors: ['novelty-seeking'],
        collapsingVectors: [],
        contradictionCount: 0,
      });
    }
    const view1 = buildIdentityContinuityLongitudinalView({ memory: mem });
    const view2 = buildIdentityContinuityLongitudinalView({ memory: mem });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(view1) === JSON.stringify(view2),
      `dominance×${view1.dominantOverTime.length} trend=${view1.continuityTrend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
