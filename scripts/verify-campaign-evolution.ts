/**
 * scripts/verify-campaign-evolution.ts
 *
 * Deterministic verification for the Campaign Evolution / Lifecycle
 * engine.
 *
 *   A · same history → same evolution
 *   B · repeated similar banners raise fatiguePressure
 *   C · trust-safe repeated outcomes raise trustMomentum
 *   D · high novelty + low trust raises decayRisk
 *   E · stable durable patterns raise strategicDurability
 *   F · repeated audience fatigue raises audienceRotationNeed
 *   G · counterfactual branches populate possibleBranches
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-campaign-evolution.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import type { AdStrategyAssessment } from '../lib/adStrategyEngine';
import type { CopyQualityAxis } from '../lib/copyQualityAdapter';
import type { CulturalPerception, CulturalSignal } from '../lib/culturalPerceptionEngine';
import type { IdentityContinuity, IdentityVector } from '../lib/identityContinuityEngine';
import type { ExecutiveGovernance } from '../lib/executiveGovernanceEngine';
import type { StrategicOutcomeIntelligence, StrategicSignature } from '../lib/strategicOutcomeIntelligence';
import { ALL_STRATEGIC_SIGNATURES } from '../lib/strategicOutcomeIntelligence';
import type { CounterfactualCognition } from '../lib/counterfactualCognitionEngine';
import {
  computeCampaignEvolution,
} from '../lib/campaignLifecycleEngine';
import {
  applyCampaignLifecycleObservation, createInitialCampaignLifecycleMemory,
  buildCampaignLifecycleHistoryContext, createCampaignLifecycleMemoryStore,
  buildCampaignLifecycleObservation,
  CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT,
  type CampaignLifecycleObservation,
} from '../lib/campaignLifecycleMemory';
import { buildCampaignLifecycleLongitudinalView } from '../lib/campaignLifecycleLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('CAMPAIGN EVOLUTION — VERIFICATION\n');

// ─── synthetic input builders ─────────────────────────────────

function strategy(over: Partial<AdStrategyAssessment> = {}): AdStrategyAssessment {
  const baseConstraints = {
    hookIntensity: 5, productVisibility: 5, textAmount: 'minimal' as const,
    ctaStrength: 4, emotionalDirectness: 5, proofRequirement: 'medium' as const,
    criticStrictnessRecommendation: 'baseline' as const,
  };
  return {
    primaryAudience: 'office_worker', secondaryAudience: 'tired_parent',
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

function copyQuality(): CopyQualityAxis {
  return {
    copyIntegrity: 7, trustSafety: 7, dignitySafety: 8,
    repetitionConcern: 3, proofAdequacy: 6, ctaRestraint: 7,
    hebrewNaturalness: 8, strategicCopyFit: 7,
    warnings: [], reasonCodes: [],
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

function governance(over: Partial<ExecutiveGovernance> = {}): ExecutiveGovernance {
  return {
    governanceStability: 7, executiveLegitimacy: 7,
    authorityFragmentation: 3, adaptiveBalance: 7,
    dominantGovernanceStructure: {
      primaryExecutive: 'strategy',
      supportingSystems: [], suppressedSystems: [], explanation: '',
    },
    governanceRoles: [], authorityTransitions: [],
    suppressedAuthorities: [], shadowExecutives: [], governanceConflicts: [],
    stabilizationPatterns: [], destabilizationPatterns: [],
    contextualLeadershipRules: [],
    authorityCollapseRisks: [], executiveOverreachRisks: [],
    governancePressure: { trustPressure: 3, noveltyPressure: 3, adaptationPressure: 3, fragmentationPressure: 2 },
    longTermAuthorityDrift: [], behavioralGovernanceFingerprint: [],
    reasonCodes: [],
    ...over,
  };
}

function outcome(over: Partial<StrategicOutcomeIntelligence> = {}): StrategicOutcomeIntelligence {
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
    ...over,
  };
}

function counterfactual(over: Partial<CounterfactualCognition> = {}): CounterfactualCognition {
  return {
    actualLeader: 'strategy',
    actualArchetype: 'aggressive-performance',
    projections: [],
    highImpactPaths: [],
    lowDivergencePaths: [],
    trustOptimizedPath: null,
    durabilityOptimizedPath: null,
    fatigueAwarePath: null,
    divergenceMap: {},
    reasonCodes: [],
    ...over,
  };
}

async function main() {
  // ── A. same inputs → same evolution ──────────────────────────
  {
    const input = {
      strategy: strategy(), copyQuality: copyQuality(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      executiveGovernance: governance(),
      strategicOutcome: outcome(),
      counterfactualCognition: counterfactual(),
    };
    const e1 = computeCampaignEvolution(input);
    const e2 = computeCampaignEvolution(input);
    check('A · same inputs → same evolution',
      JSON.stringify(e1) === JSON.stringify(e2),
      `phase=${e1.currentPhase} health=${e1.campaignHealth} branches=${e1.possibleBranches.length}`);
  }

  // ── B. repeated similar banners raise fatiguePressure ────────
  {
    // Build memory with same fingerprint recurring + fatigue growing.
    let mem = createInitialCampaignLifecycleMemory();
    const baseInput = {
      strategy: strategy(),
      culturalPerception: culture({
        aestheticFatigue: 7, audienceNumbness: 7, pacingFatigue: 7, hookSaturation: 7,
      }),
      identityContinuity: identity(),
      executiveGovernance: governance(),
      strategicOutcome: outcome({
        strategicPressureMap: {
          trustPressure: 3, fatiguePressure: 7, noveltyPressure: 3, conversionPressure: 3,
        },
      }),
      counterfactualCognition: counterfactual(),
    };
    for (let i = 0; i < 10; i++) {
      const evo = computeCampaignEvolution({
        ...baseInput, history: buildCampaignLifecycleHistoryContext(mem),
      });
      mem = applyCampaignLifecycleObservation(mem, buildCampaignLifecycleObservation({
        at: 100 + i, bannerId: `b-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        evolution: evo,
      }));
    }
    const final = computeCampaignEvolution({
      ...baseInput, history: buildCampaignLifecycleHistoryContext(mem),
    });
    check('B · repeated similar runs raise fatiguePressure',
      final.fatiguePressure >= 7,
      `fatiguePressure=${final.fatiguePressure} phase=${final.currentPhase}`);
  }

  // ── C. trust-safe repeated outcomes raise trustMomentum ──────
  {
    let mem = createInitialCampaignLifecycleMemory();
    const trustingInput = {
      strategy: strategy({ trustDebt: 1 }),
      culturalPerception: culture({ trustClimate: 9, perceivedAuthenticity: 9, humanResonance: 9 }),
      identityContinuity: identity(),
      executiveGovernance: governance({ governanceStability: 9 }),
      strategicOutcome: outcome({
        trustDurability: 9, strategicStability: 8, longTermConsistency: 8,
      }),
      counterfactualCognition: counterfactual(),
    };
    for (let i = 0; i < 10; i++) {
      const evo = computeCampaignEvolution({
        ...trustingInput, history: buildCampaignLifecycleHistoryContext(mem),
      });
      mem = applyCampaignLifecycleObservation(mem, buildCampaignLifecycleObservation({
        at: 100 + i, bannerId: `c-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        evolution: evo,
      }));
    }
    const final = computeCampaignEvolution({
      ...trustingInput, history: buildCampaignLifecycleHistoryContext(mem),
    });
    check('C · trust-safe repeated outcomes raise trustMomentum',
      final.trustMomentum >= 8,
      `trustMomentum=${final.trustMomentum} phase=${final.currentPhase}`);
  }

  // ── D. high novelty + low trust raises decayRisk ─────────────
  {
    const calmEvo = computeCampaignEvolution({
      strategy: strategy(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      executiveGovernance: governance(),
      strategicOutcome: outcome(),
      counterfactualCognition: counterfactual(),
    });
    const fragileEvo = computeCampaignEvolution({
      strategy: strategy({ trustDebt: 7 }),
      culturalPerception: culture({
        trustClimate: 2, noveltyScore: 9,
        dominantSignals: ['trust-fragile', 'novel-but-unsafe'] as CulturalSignal[],
      }),
      identityContinuity: identity({ identityFragmentation: 7 }),
      executiveGovernance: governance({ authorityFragmentation: 7 }),
      strategicOutcome: outcome({
        strategicRisk: 8, noveltyFragility: 8,
        signatureStrengths: (() => {
          const sigs = {} as Record<StrategicSignature, number>;
          for (const s of ALL_STRATEGIC_SIGNATURES) sigs[s] = 5;
          sigs['trust-erosive'] = 8; sigs['novelty-fragile'] = 8;
          return sigs;
        })(),
      }),
      counterfactualCognition: counterfactual(),
    });
    check('D · high novelty + low trust raises decayRisk',
      fragileEvo.decayRisk > calmEvo.decayRisk && fragileEvo.decayRisk >= 7,
      `calm.decay=${calmEvo.decayRisk} fragile.decay=${fragileEvo.decayRisk}`);
  }

  // ── E. stable durable patterns raise strategicDurability ─────
  {
    const fragileEvo = computeCampaignEvolution({
      strategy: strategy({ trustDebt: 7 }),
      culturalPerception: culture(),
      identityContinuity: identity({
        identityStability: 2, behavioralConsistency: 2, continuityRisk: 8,
      }),
      executiveGovernance: governance({
        governanceStability: 2, authorityFragmentation: 8,
      }),
      strategicOutcome: outcome({
        strategicStability: 2, longTermConsistency: 2, strategicRisk: 8,
      }),
      counterfactualCognition: counterfactual(),
    });
    const durableEvo = computeCampaignEvolution({
      strategy: strategy({ trustDebt: 1, confidence: 9 }),
      culturalPerception: culture({
        trustClimate: 9, humanResonance: 9, perceivedAuthenticity: 9,
      }),
      identityContinuity: identity({
        identityStability: 9, behavioralConsistency: 9, continuityRisk: 1,
      }),
      executiveGovernance: governance({
        governanceStability: 9, authorityFragmentation: 1,
      }),
      strategicOutcome: outcome({
        strategicStability: 9, longTermConsistency: 9, strategicRisk: 1,
        trustDurability: 9,
      }),
      counterfactualCognition: counterfactual(),
    });
    check('E · stable durable patterns raise strategicDurability',
      durableEvo.strategicDurability > fragileEvo.strategicDurability &&
      durableEvo.strategicDurability >= 7,
      `fragile.dur=${fragileEvo.strategicDurability} durable.dur=${durableEvo.strategicDurability}`);
  }

  // ── F. repeated audience fatigue raises audienceRotationNeed ─
  {
    // Build memory accumulating audience fatigue EWMA on office_worker.
    let mem = createInitialCampaignLifecycleMemory();
    const fatiguedInput = {
      strategy: strategy(),
      culturalPerception: culture({
        audienceNumbness: 8, conformityRisk: 7,
      }),
      identityContinuity: identity(),
      executiveGovernance: governance(),
      strategicOutcome: outcome(),
      counterfactualCognition: counterfactual(),
    };
    for (let i = 0; i < 10; i++) {
      const evo = computeCampaignEvolution({
        ...fatiguedInput, history: buildCampaignLifecycleHistoryContext(mem),
      });
      mem = applyCampaignLifecycleObservation(mem, buildCampaignLifecycleObservation({
        at: 100 + i, bannerId: `f-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        evolution: evo,
      }));
    }
    const final = computeCampaignEvolution({
      ...fatiguedInput, history: buildCampaignLifecycleHistoryContext(mem),
    });
    check('F · repeated audience fatigue raises audienceRotationNeed',
      final.audienceRotationNeed >= 7 &&
      final.audienceEvolution.rotationCandidate !== null,
      `audienceRotationNeed=${final.audienceRotationNeed} candidate=${final.audienceEvolution.rotationCandidate}`);
  }

  // ── G. counterfactual branches populate possibleBranches ─────
  {
    const cf: CounterfactualCognition = {
      actualLeader: 'strategy',
      actualArchetype: 'aggressive-performance',
      projections: [],
      highImpactPaths: [],
      lowDivergencePaths: [],
      trustOptimizedPath: {
        alternateLeader: 'trust',
        counterfactualCampaignArchetype: 'high-trust-documentary',
        archetypeDescription: 'documentary realism, restrained voice',
        creativeDirectionShift: 'shift toward documentary observation',
        audienceEmotionalShift: 'observed-with not sold-to',
        trustImpact: 4, fatigueImpact: -1, durabilityImpact: 4,
        conversionStyleShift: 'soft inquiry',
        longTermBrandEffect: 'brand compounds slowly',
        divergenceFromActual: 7, plausibility: 7, reasonCodes: [],
      },
      durabilityOptimizedPath: {
        alternateLeader: 'restraint',
        counterfactualCampaignArchetype: 'quiet-authority',
        archetypeDescription: 'minimal typography, single focal point',
        creativeDirectionShift: 'shift toward minimal restraint',
        audienceEmotionalShift: 'over-stimulated → curious',
        trustImpact: 3, fatigueImpact: -3, durabilityImpact: 4,
        conversionStyleShift: 'restrained CTA',
        longTermBrandEffect: 'category-defining positioning',
        divergenceFromActual: 7, plausibility: 7, reasonCodes: [],
      },
      fatigueAwarePath: {
        alternateLeader: 'fatigue',
        counterfactualCampaignArchetype: 'fatigue-safe',
        archetypeDescription: 'minimal stimulation',
        creativeDirectionShift: 'quieter pacing',
        audienceEmotionalShift: 'saturated → recovering',
        trustImpact: 1, fatigueImpact: -4, durabilityImpact: 2,
        conversionStyleShift: 'patient close',
        longTermBrandEffect: 'protects audience welcome',
        divergenceFromActual: 7, plausibility: 7, reasonCodes: [],
      },
      divergenceMap: {},
      reasonCodes: [],
    };
    const evo = computeCampaignEvolution({
      strategy: strategy(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      executiveGovernance: governance(),
      strategicOutcome: outcome(),
      counterfactualCognition: cf,
    });
    check('G · counterfactual branches populate possibleBranches',
      evo.possibleBranches.length >= 3 &&
      evo.possibleBranches.some((b) => b.branchName === 'high-trust-documentary') &&
      evo.possibleBranches.some((b) => b.branchName === 'fatigue-safe'),
      `branches=${evo.possibleBranches.length} names=${evo.possibleBranches.map((b) => b.branchName).join(',')}`);
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'lifecycle-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCampaignLifecycle = undefined;
    const store = createCampaignLifecycleMemoryStore(tmpDir);
    await store.reset();
    const stub: CampaignLifecycleObservation = {
      at: 0, bannerId: 'h', formula: 'ENERGY', campaignMode: 'Documentary',
      patternFingerprint: 'sig:trust-compounding|identity:trust-preserving|exec:trust|archetype:high-trust-documentary',
      currentPhase: 'compounding',
      campaignHealth: 7, trustMomentum: 7, fatiguePressure: 3,
      decayRisk: 2, creativeFreshness: 6, strategicDurability: 7,
      branchReadiness: 3, audienceRotationNeed: 3,
      currentAudience: 'office_worker', primaryBranchCandidate: null,
    };
    for (let i = 0; i < CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT + 20; i++) {
      await store.append({ ...stub, at: 100 + i, bannerId: `h-${i}` });
    }
    const state = await store.read();
    check('H · FIFO cap stable at CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT',
      state.observations.length === CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT &&
      state.totalObservations === CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT + 20 &&
      state.healthTrace.length <= 64,
      `obs=${state.observations.length}/${CAMPAIGN_LIFECYCLE_OBSERVATION_LIMIT} total=${state.totalObservations} trace=${state.healthTrace.length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodCampaignLifecycle = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    const input = {
      strategy: strategy(), copyQuality: copyQuality(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      executiveGovernance: governance(),
      strategicOutcome: outcome(),
      counterfactualCognition: counterfactual(),
    };
    const before = JSON.stringify(input);
    computeCampaignEvolution(input);
    computeCampaignEvolution(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/campaignLifecycleEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/campaignLifecycleMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/campaignLifecycleLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in lifecycle sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/campaignLifecycleEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/campaignLifecycleMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/campaignLifecycleLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in lifecycle sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialCampaignLifecycleMemory();
    for (let i = 0; i < 6; i++) {
      mem = applyCampaignLifecycleObservation(mem, {
        at: 100 + i, bannerId: `l-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        patternFingerprint: i % 2 === 0 ? 'pattern-a' : 'pattern-b',
        currentPhase: 'compounding',
        campaignHealth: 7, trustMomentum: 7, fatiguePressure: 3,
        decayRisk: 2, creativeFreshness: 7, strategicDurability: 7,
        branchReadiness: 2, audienceRotationNeed: 3,
        currentAudience: 'office_worker', primaryBranchCandidate: null,
      });
    }
    const v1 = buildCampaignLifecycleLongitudinalView({ memory: mem });
    const v2 = buildCampaignLifecycleLongitudinalView({ memory: mem });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(v1) === JSON.stringify(v2),
      `durable×${v1.durablePatterns.length} trend=${v1.trend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
