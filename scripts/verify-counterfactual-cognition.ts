/**
 * scripts/verify-counterfactual-cognition.ts
 *
 * Deterministic verification for the Counterfactual Cognition engine
 * — multi-path CREATIVE STRATEGY simulation (not philosophical
 * identity speculation).
 *
 *   A · same inputs → same projections
 *   B · trust-fragile context → trust-led counterfactual surfaces trust-positive impact
 *   C · audience-fatigued context → fatigue-led counterfactual surfaces fatigue-relief
 *   D · low trust climate → novelty-led counterfactual surfaces viral-instability archetype
 *   E · projections include all 7 required impact axes
 *   F · alternateLeader is never the actual primaryExecutive
 *   G · recurring pathways are captured in longitudinal memory
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-counterfactual-cognition.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import type { AdStrategyAssessment } from '../lib/adStrategyEngine';
import type { CulturalPerception, CulturalSignal } from '../lib/culturalPerceptionEngine';
import type { CrossBrainConflict } from '../lib/crossBrainConflictEngine';
import type { IdentityContinuity, IdentityVector } from '../lib/identityContinuityEngine';
import type { ExecutiveGovernance } from '../lib/executiveGovernanceEngine';
import type { StrategicOutcomeIntelligence } from '../lib/strategicOutcomeIntelligence';
import {
  ALL_COGNITIVE_SYSTEMS, type CognitiveSystem, type CognitiveWeightEvolution,
} from '../lib/cognitiveWeightEvolution';
import { ALL_STRATEGIC_SIGNATURES, type StrategicSignature } from '../lib/strategicOutcomeIntelligence';
import {
  computeCounterfactualCognition,
} from '../lib/counterfactualCognitionEngine';
import {
  applyCounterfactualObservation, createInitialCounterfactualCognitionMemory,
  createCounterfactualCognitionMemoryStore,
  buildCounterfactualObservation, COUNTERFACTUAL_OBSERVATION_LIMIT,
  type CounterfactualObservation,
} from '../lib/counterfactualCognitionMemory';
import { buildCounterfactualCognitionLongitudinalView } from '../lib/counterfactualCognitionLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('COUNTERFACTUAL COGNITION (MULTI-PATH STRATEGY SIM) — VERIFICATION\n');

// ─── synthetic input builders ─────────────────────────────────

function strategy(over: Partial<AdStrategyAssessment> = {}): AdStrategyAssessment {
  const baseConstraints = {
    hookIntensity: 5, productVisibility: 5, textAmount: 'minimal' as const,
    ctaStrength: 4, emotionalDirectness: 5, proofRequirement: 'medium' as const,
    criticStrictnessRecommendation: 'baseline' as const,
  };
  return {
    primaryAudience: 'office_worker', secondaryAudience: null,
    emotionalWound: 'tired', hiddenDesire: 'calm',
    surfaceObjection: 'cost', deeperObjection: 'doubt', trustBarrier: 'new',
    campaignRole: 'trust_builder', recommendedAngle: 'baseline', forbiddenAngle: 'none',
    persuasionMode: 'observational', storyShape: 'mirror',
    proofNeed: 'medium', urgencyLevel: 3,
    repetitionRisk: 2, brandRisk: 2, trustDebt: 2,
    strategicDepth: 6, confidence: 7,
    reasonCodes: [],
    creativeConstraints: { ...baseConstraints, ...(over.creativeConstraints ?? {}) },
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

function cogWeight(
  weights: Partial<Record<CognitiveSystem, number>> = {},
  dominantSystems: CognitiveSystem[] = ['strategy', 'quality'],
  suppressedSystems: CognitiveSystem[] = [],
): CognitiveWeightEvolution {
  const fullWeights = {} as Record<CognitiveSystem, number>;
  for (const s of ALL_COGNITIVE_SYSTEMS) fullWeights[s] = weights[s] ?? 5;
  return {
    globalStability: 7, adaptationPressure: 3, cognitiveFragmentation: 3,
    dominantSystems: dominantSystems.map((s) => ({
      system: s, weight: fullWeights[s], confidence: 7, explanation: '',
    })),
    suppressedSystems: suppressedSystems.map((s) => ({
      system: s, suppressionScore: 10 - (fullWeights[s] ?? 5), reason: 'low weight',
    })),
    unstableWeights: [],
    environmentalSensitivity: { fatigueSensitivity: 3, trustSensitivity: 3, noveltySensitivity: 3, culturalSensitivity: 6 },
    contextualAuthority: [],
    weightDrift: [],
    agreementPressure: 7, disagreementPressure: 3,
    weights: fullWeights,
    reasonCodes: [],
  };
}

function identity(over: Partial<IdentityContinuity> = {}): IdentityContinuity {
  const vectorStrengths = {} as Record<IdentityVector, number>;
  for (const v of [
    'restraint-first', 'aggressive-conversion', 'trust-preserving',
    'novelty-seeking', 'culture-sensitive', 'emotionally-reflective',
    'proof-oriented', 'fatigue-aware', 'high-variation',
    'stability-preferring', 'identity-fragmented', 'audience-mirroring',
  ] as IdentityVector[]) vectorStrengths[v] = 5;
  return {
    identityStability: 6, identityFragmentation: 3,
    behavioralConsistency: 6, adaptationVelocity: 3,
    dominantIdentityVectors: [], emergingIdentityVectors: [], collapsingIdentityVectors: [],
    identityContradictions: [],
    persistentBehavioralPatterns: [], contextualIdentityModes: [],
    longTermDrift: [],
    identityPressure: { noveltyPressure: 3, trustPressure: 3, fatiguePressure: 3, adaptationPressure: 3 },
    continuityRisk: 3, vectorStrengths, reasonCodes: [],
    ...over,
  };
}

function governance(
  primaryExecutive: CognitiveSystem | null = 'strategy',
  shadowExecutives: CognitiveSystem[] = [],
  suppressedAuthorities: CognitiveSystem[] = [],
  over: Partial<ExecutiveGovernance> = {},
): ExecutiveGovernance {
  return {
    governanceStability: 7, executiveLegitimacy: 7,
    authorityFragmentation: 3, adaptiveBalance: 7,
    dominantGovernanceStructure: {
      primaryExecutive,
      supportingSystems: [], suppressedSystems: [],
      explanation: '',
    },
    governanceRoles: [], authorityTransitions: [],
    suppressedAuthorities: suppressedAuthorities.map((s) => ({
      system: s, suppressionScore: 6, historicalLegitimacy: 6, reason: 'suppressed',
    })),
    shadowExecutives: shadowExecutives.map((s) => ({
      system: s, predictiveAccuracy: 8, reason: 'shadow',
    })),
    governanceConflicts: [],
    stabilizationPatterns: [], destabilizationPatterns: [],
    contextualLeadershipRules: [],
    authorityCollapseRisks: [], executiveOverreachRisks: [],
    governancePressure: { trustPressure: 3, noveltyPressure: 3, adaptationPressure: 3, fragmentationPressure: 2 },
    longTermAuthorityDrift: [], behavioralGovernanceFingerprint: [],
    reasonCodes: [],
    ...over,
  };
}

function outcome(): StrategicOutcomeIntelligence {
  const sigs = {} as Record<StrategicSignature, number>;
  for (const s of ALL_STRATEGIC_SIGNATURES) sigs[s] = 5;
  return {
    strategicStability: 6, trustDurability: 6, audienceResilience: 6,
    noveltyFragility: 3, longTermConsistency: 6, strategicRisk: 3,
    dominantStrategicSignatures: [], emergingStrategicSignatures: [],
    collapsingStrategicSignatures: [], strategicContradictions: [],
    highResiliencePatterns: [], highDecayPatterns: [],
    audienceSensitivityPatterns: [], trustCompoundingPatterns: [],
    fatigueResistancePatterns: [],
    identityOutcomeAlignment: [], governanceOutcomeAlignment: [],
    counterfactualOutcomeComparisons: [],
    longTermOutcomeDrift: [],
    strategicPressureMap: {
      trustPressure: 3, fatiguePressure: 3, noveltyPressure: 3, conversionPressure: 3,
    },
    signatureStrengths: sigs,
    reasonCodes: [],
  };
}

async function main() {
  // ── A. same inputs → same projections ────────────────────────
  {
    const input = {
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture(),
      cognitiveWeight: cogWeight({ strategy: 8, trust: 6 }, ['strategy', 'quality'], ['novelty', 'restraint']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['novelty'], ['restraint']),
      strategicOutcome: outcome(),
    };
    const c1 = computeCounterfactualCognition(input);
    const c2 = computeCounterfactualCognition(input);
    check('A · same inputs → same projections',
      JSON.stringify(c1) === JSON.stringify(c2),
      `actual ${c1.actualArchetype} · projections ${c1.projections.length}`);
  }

  // ── B. trust-fragile context → trust-led counterfactual surfaces
  //       trust-positive impact ──────────────────────────────────
  {
    const c = computeCounterfactualCognition({
      strategy: strategy({ trustDebt: 8 }),
      conflict: conflict({ overallTension: 7 }),
      culturalPerception: culture({
        trustClimate: 2, perceivedAuthenticity: 3,
        dominantSignals: ['trust-fragile'] as CulturalSignal[],
      }),
      cognitiveWeight: cogWeight({ strategy: 8, trust: 4 }, ['strategy'], ['trust']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['trust'], ['trust']),
      strategicOutcome: outcome(),
    });
    const trustLed = c.projections.find((p) => p.alternateLeader === 'trust');
    check('B · trust-led counterfactual surfaces trust-positive impact',
      !!trustLed && trustLed.trustImpact >= 4 &&
      trustLed.counterfactualCampaignArchetype === 'high-trust-documentary',
      trustLed ? `archetype=${trustLed.counterfactualCampaignArchetype} trustImpact=${trustLed.trustImpact}` : 'NOT GENERATED');
  }

  // ── C. audience-fatigued context → fatigue-led path relieves fatigue ──
  {
    const c = computeCounterfactualCognition({
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture({
        audienceNumbness: 9, aestheticFatigue: 9, pacingFatigue: 9,
        dominantSignals: ['emotionally-numb', 'aesthetic-burnout'] as CulturalSignal[],
      }),
      cognitiveWeight: cogWeight({ strategy: 7, fatigue: 4 }, ['strategy'], ['fatigue']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['fatigue'], ['fatigue']),
      strategicOutcome: outcome(),
    });
    const fatigueLed = c.projections.find((p) => p.alternateLeader === 'fatigue');
    check('C · fatigue-led counterfactual relieves fatigue',
      !!fatigueLed && fatigueLed.fatigueImpact <= -4 &&
      fatigueLed.counterfactualCampaignArchetype === 'fatigue-safe',
      fatigueLed ? `archetype=${fatigueLed.counterfactualCampaignArchetype} fatigueImpact=${fatigueLed.fatigueImpact}` : 'NOT GENERATED');
  }

  // ── D. low trust + novelty-led → viral-instability archetype ─
  {
    const c = computeCounterfactualCognition({
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture({
        trustClimate: 3, noveltyScore: 7,
        dominantSignals: ['trust-fragile'] as CulturalSignal[],
      }),
      cognitiveWeight: cogWeight({ strategy: 7, novelty: 4 }, ['strategy'], ['novelty']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['novelty'], ['novelty']),
      strategicOutcome: outcome(),
    });
    const noveltyLed = c.projections.find((p) => p.alternateLeader === 'novelty');
    check('D · novelty-led under low trust → viral-instability',
      !!noveltyLed && noveltyLed.counterfactualCampaignArchetype === 'viral-instability' &&
      noveltyLed.trustImpact <= -3,
      noveltyLed ? `archetype=${noveltyLed.counterfactualCampaignArchetype} trustImpact=${noveltyLed.trustImpact}` : 'NOT GENERATED');
  }

  // ── E. projections include all 7 required impact axes ────────
  {
    const c = computeCounterfactualCognition({
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture(),
      cognitiveWeight: cogWeight({ strategy: 8, trust: 6 }, ['strategy'], ['trust', 'novelty']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['trust'], ['trust', 'novelty']),
      strategicOutcome: outcome(),
    });
    const sample = c.projections[0];
    const hasAllAxes = !!sample &&
      typeof sample.creativeDirectionShift === 'string' && sample.creativeDirectionShift.length > 0 &&
      typeof sample.audienceEmotionalShift === 'string' && sample.audienceEmotionalShift.length > 0 &&
      typeof sample.trustImpact === 'number' &&
      typeof sample.fatigueImpact === 'number' &&
      typeof sample.durabilityImpact === 'number' &&
      typeof sample.conversionStyleShift === 'string' && sample.conversionStyleShift.length > 0 &&
      typeof sample.longTermBrandEffect === 'string' && sample.longTermBrandEffect.length > 0 &&
      typeof sample.counterfactualCampaignArchetype === 'string';
    check('E · projections include all 7 required impact axes + archetype',
      hasAllAxes,
      sample ? `archetype=${sample.counterfactualCampaignArchetype} axes-present=${hasAllAxes}` : 'NO PROJECTIONS');
  }

  // ── F. alternateLeader never equals actual primaryExecutive ──
  {
    const c = computeCounterfactualCognition({
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture(),
      cognitiveWeight: cogWeight({ strategy: 9 }, ['strategy'], ['trust', 'novelty', 'culture']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['trust'], ['novelty', 'culture']),
      strategicOutcome: outcome(),
    });
    const violations = c.projections.filter((p) => p.alternateLeader === c.actualLeader);
    check('F · alternateLeader is never the actual primaryExecutive',
      violations.length === 0 && c.projections.length > 0,
      `actualLeader=${c.actualLeader} projections=${c.projections.length} violations=${violations.length}`);
  }

  // ── G. recurring pathways captured in longitudinal memory ────
  {
    let mem = createInitialCounterfactualCognitionMemory();
    const trustHeavyInput = {
      strategy: strategy({ trustDebt: 7 }),
      conflict: conflict(),
      culturalPerception: culture({
        trustClimate: 3, dominantSignals: ['trust-fragile'] as CulturalSignal[],
      }),
      cognitiveWeight: cogWeight({ strategy: 8, trust: 5 }, ['strategy'], ['trust']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['trust'], ['trust']),
      strategicOutcome: outcome(),
    };
    for (let i = 0; i < 10; i++) {
      const c = computeCounterfactualCognition(trustHeavyInput);
      mem = applyCounterfactualObservation(mem, buildCounterfactualObservation({
        at: 100 + i, bannerId: `g-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        actualLeader: c.actualLeader,
        actualArchetype: c.actualArchetype,
        projections: c.projections,
        trustOptimizedArchetype: c.trustOptimizedPath?.counterfactualCampaignArchetype ?? null,
        durabilityOptimizedArchetype: c.durabilityOptimizedPath?.counterfactualCampaignArchetype ?? null,
      }));
    }
    const view = buildCounterfactualCognitionLongitudinalView({ memory: mem });
    const trustPath = view.recurringPathways.find((p) =>
      p.alternateLeader === 'trust' && p.archetype === 'high-trust-documentary',
    );
    check('G · recurring trust-led pathway captured in memory',
      !!trustPath && trustPath.count >= 5 && trustPath.averageTrustImpact >= 3,
      trustPath ? `count=${trustPath.count} avgTrust=${trustPath.averageTrustImpact}` : 'NOT FOUND');
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'counterfactual-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCounterfactualCognition = undefined;
    const store = createCounterfactualCognitionMemoryStore(tmpDir);
    await store.reset();
    const stub: CounterfactualObservation = {
      at: 0, bannerId: 'h', formula: 'ENERGY', campaignMode: 'Documentary',
      actualLeader: 'strategy', actualArchetype: 'aggressive-performance',
      projections: [],
      trustOptimizedArchetype: null, durabilityOptimizedArchetype: null,
    };
    for (let i = 0; i < COUNTERFACTUAL_OBSERVATION_LIMIT + 20; i++) {
      await store.append({ ...stub, at: 100 + i, bannerId: `h-${i}` });
    }
    const state = await store.read();
    check('H · FIFO cap stable at COUNTERFACTUAL_OBSERVATION_LIMIT',
      state.observations.length === COUNTERFACTUAL_OBSERVATION_LIMIT &&
      state.totalObservations === COUNTERFACTUAL_OBSERVATION_LIMIT + 20,
      `obs=${state.observations.length}/${COUNTERFACTUAL_OBSERVATION_LIMIT} total=${state.totalObservations}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCounterfactualCognition = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    const input = {
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture(),
      cognitiveWeight: cogWeight({ strategy: 8 }, ['strategy'], ['trust']),
      identityContinuity: identity(),
      executiveGovernance: governance('strategy', ['trust'], []),
      strategicOutcome: outcome(),
    };
    const before = JSON.stringify(input);
    computeCounterfactualCognition(input);
    computeCounterfactualCognition(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/counterfactualCognitionEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/counterfactualCognitionMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/counterfactualCognitionLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in counterfactual sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/counterfactualCognitionEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/counterfactualCognitionMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/counterfactualCognitionLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in counterfactual sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialCounterfactualCognitionMemory();
    for (let i = 0; i < 6; i++) {
      mem = applyCounterfactualObservation(mem, {
        at: 100 + i, bannerId: `l-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        actualLeader: 'strategy', actualArchetype: 'aggressive-performance',
        projections: [{
          alternateLeader: 'trust', archetype: 'high-trust-documentary',
          trustImpact: 4, fatigueImpact: -1, durabilityImpact: 4,
          divergenceFromActual: 7, plausibility: 7,
        }],
        trustOptimizedArchetype: 'high-trust-documentary',
        durabilityOptimizedArchetype: 'high-trust-documentary',
      });
    }
    const v1 = buildCounterfactualCognitionLongitudinalView({ memory: mem });
    const v2 = buildCounterfactualCognitionLongitudinalView({ memory: mem });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(v1) === JSON.stringify(v2),
      `recurring×${v1.recurringPathways.length} trend=${v1.trend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
