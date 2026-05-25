/**
 * scripts/verify-strategic-outcome-intelligence.ts
 *
 * Deterministic verification for the Strategic Outcome Intelligence
 * engine. Drives across cases A–L:
 *
 *   A · same history → same strategic intelligence
 *   B · recurring trust preservation raises trust durability
 *   C · recurring fatigue lowers audience resilience
 *   D · short-term aggressive wins raise erosion risk
 *   E · resilient eras increase strategic stability
 *   F · fragmentation lowers long-term consistency
 *   G · aligned governance + identity raises resilience
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-strategic-outcome-intelligence.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import type { AdStrategyAssessment } from '../lib/adStrategyEngine';
import type { CulturalPerception, CulturalSignal } from '../lib/culturalPerceptionEngine';
import type { CrossBrainConflict } from '../lib/crossBrainConflictEngine';
import type { IdentityContinuity, IdentityVector } from '../lib/identityContinuityEngine';
import type { ExecutiveGovernance } from '../lib/executiveGovernanceEngine';
import {
  computeStrategicOutcomeIntelligence, ALL_STRATEGIC_SIGNATURES,
  type StrategicSignature,
} from '../lib/strategicOutcomeIntelligence';
import {
  applyOutcomeObservation, createInitialStrategicOutcomeMemory,
  buildOutcomeHistoryContext, createStrategicOutcomeMemoryStore,
  OUTCOME_OBSERVATION_LIMIT,
  type StrategicOutcomeObservation,
} from '../lib/strategicOutcomeMemory';
import { buildStrategicOutcomeLongitudinalView } from '../lib/strategicOutcomeLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('STRATEGIC OUTCOME INTELLIGENCE — VERIFICATION\n');

// ─── synthetic input builders ─────────────────────────────────

function strategy(over: Partial<AdStrategyAssessment> = {}): AdStrategyAssessment {
  const baseConstraints = {
    hookIntensity: 5, productVisibility: 5, textAmount: 'minimal' as const,
    ctaStrength: 4, emotionalDirectness: 5, proofRequirement: 'medium' as const,
    criticStrictnessRecommendation: 'baseline' as const,
  };
  return {
    primaryAudience: 'office_worker',
    secondaryAudience: null,
    emotionalWound: 'tired', hiddenDesire: 'calm',
    surfaceObjection: 'cost', deeperObjection: 'doubt', trustBarrier: 'new',
    campaignRole: 'trust_builder',
    recommendedAngle: 'baseline', forbiddenAngle: 'none',
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
    dominantIdentityVectors: [],
    emergingIdentityVectors: [], collapsingIdentityVectors: [],
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
      supportingSystems: [], suppressedSystems: [],
      explanation: '',
    },
    governanceRoles: [], authorityTransitions: [],
    suppressedAuthorities: [], shadowExecutives: [],
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

async function main() {
  // ── A. same inputs → same intelligence ───────────────────────
  {
    const input = {
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      executiveGovernance: governance(),
    };
    const o1 = computeStrategicOutcomeIntelligence(input);
    const o2 = computeStrategicOutcomeIntelligence(input);
    check('A · same inputs → same strategic intelligence',
      JSON.stringify(o1) === JSON.stringify(o2),
      `stability ${o1.strategicStability} · trust-durability ${o1.trustDurability} · risk ${o1.strategicRisk}`);
  }

  // ── B. recurring trust preservation raises trust durability ─
  {
    let mem = createInitialStrategicOutcomeMemory();
    const trustingInput = {
      strategy: strategy({ trustDebt: 1 }),
      conflict: conflict(),
      culturalPerception: culture({ trustClimate: 9, perceivedAuthenticity: 9, humanResonance: 8 }),
      identityContinuity: identity(),
      executiveGovernance: governance(),
    };
    for (let i = 0; i < 12; i++) {
      const o = computeStrategicOutcomeIntelligence({
        ...trustingInput, history: buildOutcomeHistoryContext(mem),
      });
      mem = applyOutcomeObservation(mem, {
        at: 100 + i, bannerId: `b-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        signatureStrengths: o.signatureStrengths,
        dominantSignature: o.dominantStrategicSignatures[0]?.signature ?? null,
        emergingSignatures: [], collapsingSignatures: [],
        strategicStability: o.strategicStability,
        trustDurability: o.trustDurability,
        audienceResilience: o.audienceResilience,
        noveltyFragility: o.noveltyFragility,
        longTermConsistency: o.longTermConsistency,
        strategicRisk: o.strategicRisk,
        identityVector: 'trust-preserving',
        governanceExecutive: 'trust',
        governanceFingerprint: 'trust|none',
        audienceNumbness: 2,
        decaySignal: 2,
      });
    }
    const trustEwma = mem.ewmaStrengths['trust-compounding'];
    const finalO = computeStrategicOutcomeIntelligence({
      ...trustingInput, history: buildOutcomeHistoryContext(mem),
    });
    check('B · recurring trust preservation raises trust durability',
      finalO.trustDurability >= 7 && trustEwma >= 5,
      `trustDurability=${finalO.trustDurability} trust-compounding ewma=${trustEwma.toFixed(2)}`);
  }

  // ── C. recurring fatigue lowers audience resilience ─────────
  {
    const calmO = computeStrategicOutcomeIntelligence({
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture({
        aestheticFatigue: 2, audienceNumbness: 2, pacingFatigue: 2,
        emotionalFreshness: 8, hookSaturation: 2,
      }),
      identityContinuity: identity(),
      executiveGovernance: governance(),
    });
    const fatiguedO = computeStrategicOutcomeIntelligence({
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture({
        aestheticFatigue: 9, audienceNumbness: 9, pacingFatigue: 9,
        emotionalFreshness: 2, hookSaturation: 9, conformityRisk: 9,
        dominantSignals: ['emotionally-numb', 'aesthetic-burnout'] as CulturalSignal[],
      }),
      identityContinuity: identity(),
      executiveGovernance: governance(),
    });
    check('C · recurring fatigue lowers audience resilience',
      fatiguedO.audienceResilience < calmO.audienceResilience && fatiguedO.audienceResilience <= 3,
      `calm=${calmO.audienceResilience} fatigued=${fatiguedO.audienceResilience}`);
  }

  // ── D. short-term aggressive wins raise erosion risk ────────
  {
    const aggressiveO = computeStrategicOutcomeIntelligence({
      strategy: strategy({
        urgencyLevel: 9, trustDebt: 7,
        campaignRole: 'conversion_push',
        creativeConstraints: {
          hookIntensity: 9, productVisibility: 5, textAmount: 'minimal',
          ctaStrength: 9, emotionalDirectness: 9, proofRequirement: 'medium',
          criticStrictnessRecommendation: 'baseline',
        },
      }),
      conflict: conflict({ overallTension: 7 }),
      culturalPerception: culture({
        trustClimate: 3,
        dominantSignals: ['trust-fragile', 'algorithmically-obvious'] as CulturalSignal[],
      }),
      identityContinuity: identity(),
      executiveGovernance: governance(),
    });
    check('D · short-term aggressive wins raise erosion / risk',
      aggressiveO.signatureStrengths['over-aggressive'] >= 6 &&
      aggressiveO.signatureStrengths['short-term-conversion-heavy'] >= 6 &&
      aggressiveO.signatureStrengths['trust-erosive'] >= 5 &&
      aggressiveO.strategicRisk >= 6,
      `over-aggressive=${aggressiveO.signatureStrengths['over-aggressive']} short-term=${aggressiveO.signatureStrengths['short-term-conversion-heavy']} trust-erosive=${aggressiveO.signatureStrengths['trust-erosive']} risk=${aggressiveO.strategicRisk}`);
  }

  // ── E. resilient eras increase strategic stability ──────────
  {
    let mem = createInitialStrategicOutcomeMemory();
    const resilientInput = {
      strategy: strategy({ trustDebt: 1, confidence: 8 }),
      conflict: conflict({ overallTension: 2, cognitiveStability: 9, alignmentScore: 9 }),
      culturalPerception: culture({
        trustClimate: 9, humanResonance: 9, perceivedAuthenticity: 9,
        aestheticFatigue: 1, audienceNumbness: 1, pacingFatigue: 1,
        emotionalFreshness: 8,
      }),
      identityContinuity: identity({ identityStability: 9, behavioralConsistency: 9, continuityRisk: 1 }),
      executiveGovernance: governance({ governanceStability: 9, authorityFragmentation: 1 }),
    };
    for (let i = 0; i < 12; i++) {
      const o = computeStrategicOutcomeIntelligence({
        ...resilientInput, history: buildOutcomeHistoryContext(mem),
      });
      mem = applyOutcomeObservation(mem, {
        at: 100 + i, bannerId: `e-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        signatureStrengths: o.signatureStrengths,
        dominantSignature: o.dominantStrategicSignatures[0]?.signature ?? null,
        emergingSignatures: [], collapsingSignatures: [],
        strategicStability: o.strategicStability,
        trustDurability: o.trustDurability,
        audienceResilience: o.audienceResilience,
        noveltyFragility: o.noveltyFragility,
        longTermConsistency: o.longTermConsistency,
        strategicRisk: o.strategicRisk,
        identityVector: 'trust-preserving',
        governanceExecutive: 'trust',
        governanceFingerprint: 'trust|culture+identity-preserver',
        audienceNumbness: 1,
        decaySignal: 1,
      });
    }
    const view = buildStrategicOutcomeLongitudinalView({ memory: mem });
    check('E · resilient eras increase strategic stability',
      view.averageStability >= 7 &&
      (view.strategicTrend === 'stable' || view.strategicTrend === 'consolidating'),
      `avgStability=${view.averageStability} trend=${view.strategicTrend}`);
  }

  // ── F. fragmentation lowers long-term consistency ───────────
  {
    const stableO = computeStrategicOutcomeIntelligence({
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity({ behavioralConsistency: 9, identityStability: 9, continuityRisk: 1 }),
      executiveGovernance: governance({ governanceStability: 9, authorityFragmentation: 1 }),
    });
    const fragmentedO = computeStrategicOutcomeIntelligence({
      strategy: strategy(),
      conflict: conflict({ overallTension: 8, cognitiveStability: 2 }),
      culturalPerception: culture(),
      identityContinuity: identity({
        behavioralConsistency: 2, identityStability: 2, identityFragmentation: 9, continuityRisk: 8,
      }),
      executiveGovernance: governance({ governanceStability: 2, authorityFragmentation: 9 }),
    });
    check('F · fragmentation lowers long-term consistency',
      fragmentedO.longTermConsistency < stableO.longTermConsistency &&
      fragmentedO.longTermConsistency <= 5,
      `stable.LTC=${stableO.longTermConsistency} fragmented.LTC=${fragmentedO.longTermConsistency}`);
  }

  // ── G. aligned governance + identity raises resilience ──────
  {
    const misalignedO = computeStrategicOutcomeIntelligence({
      strategy: strategy(),
      conflict: conflict({ overallTension: 7, cognitiveStability: 3 }),
      culturalPerception: culture({ aestheticFatigue: 7, audienceNumbness: 7 }),
      identityContinuity: identity({ identityStability: 3, behavioralConsistency: 3 }),
      executiveGovernance: governance({ governanceStability: 3, authorityFragmentation: 7 }),
    });
    const alignedO = computeStrategicOutcomeIntelligence({
      strategy: strategy({ trustDebt: 1, confidence: 8 }),
      conflict: conflict({ overallTension: 2, cognitiveStability: 9, alignmentScore: 9 }),
      culturalPerception: culture({
        trustClimate: 9, humanResonance: 9, perceivedAuthenticity: 9,
        aestheticFatigue: 1, audienceNumbness: 1, pacingFatigue: 1,
      }),
      identityContinuity: identity({ identityStability: 9, behavioralConsistency: 9 }),
      executiveGovernance: governance({ governanceStability: 9, authorityFragmentation: 1 }),
    });
    check('G · aligned governance + identity raises resilience',
      alignedO.strategicStability > misalignedO.strategicStability &&
      alignedO.audienceResilience > misalignedO.audienceResilience &&
      alignedO.trustDurability > misalignedO.trustDurability,
      `aligned.stab=${alignedO.strategicStability}/aud=${alignedO.audienceResilience}/trust=${alignedO.trustDurability} vs misaligned.stab=${misalignedO.strategicStability}/aud=${misalignedO.audienceResilience}/trust=${misalignedO.trustDurability}`);
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'outcome-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodStrategicOutcome = undefined;
    const store = createStrategicOutcomeMemoryStore(tmpDir);
    await store.reset();
    const baseStrengths = {} as Record<StrategicSignature, number>;
    for (const s of ALL_STRATEGIC_SIGNATURES) baseStrengths[s] = 5;
    for (let i = 0; i < OUTCOME_OBSERVATION_LIMIT + 20; i++) {
      const obs: StrategicOutcomeObservation = {
        at: 100 + i, bannerId: `h-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        signatureStrengths: { ...baseStrengths },
        dominantSignature: null, emergingSignatures: [], collapsingSignatures: [],
        strategicStability: 5, trustDurability: 5, audienceResilience: 5,
        noveltyFragility: 3, longTermConsistency: 5, strategicRisk: 3,
        identityVector: null, governanceExecutive: null, governanceFingerprint: 'none|none',
        audienceNumbness: 3, decaySignal: 3,
      };
      await store.append(obs);
    }
    const state = await store.read();
    check('H · FIFO cap stable at OUTCOME_OBSERVATION_LIMIT',
      state.observations.length === OUTCOME_OBSERVATION_LIMIT &&
      state.totalObservations === OUTCOME_OBSERVATION_LIMIT + 20 &&
      state.stabilityTrace.length <= 64,
      `obs=${state.observations.length}/${OUTCOME_OBSERVATION_LIMIT} total=${state.totalObservations} trace=${state.stabilityTrace.length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodStrategicOutcome = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    const input = {
      strategy: strategy(),
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      executiveGovernance: governance(),
    };
    const before = JSON.stringify(input);
    computeStrategicOutcomeIntelligence(input);
    computeStrategicOutcomeIntelligence(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/strategicOutcomeIntelligence.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/strategicOutcomeMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/strategicOutcomeLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in strategic-outcome sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/strategicOutcomeIntelligence.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/strategicOutcomeMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/strategicOutcomeLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in strategic-outcome sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialStrategicOutcomeMemory();
    const baseStrengths = {} as Record<StrategicSignature, number>;
    for (const s of ALL_STRATEGIC_SIGNATURES) baseStrengths[s] = 5;
    for (let i = 0; i < 6; i++) {
      mem = applyOutcomeObservation(mem, {
        at: 100 + i, bannerId: `l-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        signatureStrengths: { ...baseStrengths, 'trust-compounding': 7, 'over-aggressive': 4 },
        dominantSignature: 'trust-compounding',
        emergingSignatures: [], collapsingSignatures: [],
        strategicStability: 7, trustDurability: 7, audienceResilience: 6,
        noveltyFragility: 3, longTermConsistency: 6, strategicRisk: 3,
        identityVector: 'trust-preserving', governanceExecutive: 'trust',
        governanceFingerprint: 'trust|none',
        audienceNumbness: 3, decaySignal: 3,
      });
    }
    const view1 = buildStrategicOutcomeLongitudinalView({ memory: mem });
    const view2 = buildStrategicOutcomeLongitudinalView({ memory: mem });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(view1) === JSON.stringify(view2),
      `longest×${view1.longestSurvivingStructures.length} trend=${view1.strategicTrend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
