/**
 * scripts/verify-executive-governance.ts
 *
 * Deterministic verification for the Executive Cognitive Governance
 * layer. Drives across cases A–L:
 *
 *   A · same history → same governance
 *   B · recurring trust collapses elevate trust-guardian legitimacy
 *   C · novelty eras elevate novelty-driver authority
 *   D · recurring fragmentation raises authorityFragmentation
 *   E · stable governance eras increase governanceStability
 *   F · over-centralization raises executiveOverreachRisk
 *   G · suppressed-but-correct systems become shadowExecutives
 *   H · FIFO caps stable
 *   I · no runtime mutation
 *   J · no critic imports
 *   K · no external APIs
 *   L · deterministic outputs
 *
 * Run: npx tsx scripts/verify-executive-governance.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import type { CulturalPerception, CulturalSignal } from '../lib/culturalPerceptionEngine';
import type { CrossBrainConflict } from '../lib/crossBrainConflictEngine';
import {
  ALL_COGNITIVE_SYSTEMS, type CognitiveWeightEvolution, type CognitiveSystem,
} from '../lib/cognitiveWeightEvolution';
import type { IdentityContinuity, IdentityVector } from '../lib/identityContinuityEngine';
import {
  computeExecutiveGovernance,
} from '../lib/executiveGovernanceEngine';
import {
  applyGovernanceObservation, createInitialExecutiveGovernanceMemory,
  buildGovernanceHistoryContext, createExecutiveGovernanceMemoryStore,
  buildGovernanceObservation, GOVERNANCE_OBSERVATION_LIMIT,
  type GovernanceObservation,
} from '../lib/executiveGovernanceMemory';
import { buildExecutiveGovernanceLongitudinalView } from '../lib/executiveGovernanceLongitudinalView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('EXECUTIVE COGNITIVE GOVERNANCE — VERIFICATION\n');

// ─── synthetic input builders ─────────────────────────────────

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
  over: Partial<CognitiveWeightEvolution> = {},
): CognitiveWeightEvolution {
  const fullWeights = {} as Record<CognitiveSystem, number>;
  for (const s of ALL_COGNITIVE_SYSTEMS) fullWeights[s] = weights[s] ?? 5;
  // Dominant = weights >= 6, ranked.
  const dominantSystems = ALL_COGNITIVE_SYSTEMS
    .map((s) => ({ system: s, weight: fullWeights[s], confidence: 7, explanation: '' }))
    .filter((d) => d.weight >= 6)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 4);
  const suppressedSystems = ALL_COGNITIVE_SYSTEMS
    .map((s) => ({ system: s, suppressionScore: 10 - fullWeights[s], reason: 'low weight' }))
    .filter((d) => fullWeights[d.system] <= 4)
    .slice(0, 4);
  return {
    globalStability: 7,
    adaptationPressure: 3,
    cognitiveFragmentation: 3,
    dominantSystems,
    suppressedSystems,
    unstableWeights: [],
    environmentalSensitivity: {
      fatigueSensitivity: 3, trustSensitivity: 3,
      noveltySensitivity: 3, culturalSensitivity: 6,
    },
    contextualAuthority: [],
    weightDrift: [],
    agreementPressure: 7,
    disagreementPressure: 3,
    weights: fullWeights,
    reasonCodes: [],
    ...over,
  };
}

function identity(over: Partial<IdentityContinuity> = {}): IdentityContinuity {
  const vectorStrengths = {} as Record<IdentityVector, number>;
  // 12 vectors at 5 baseline.
  for (const v of [
    'restraint-first', 'aggressive-conversion', 'trust-preserving',
    'novelty-seeking', 'culture-sensitive', 'emotionally-reflective',
    'proof-oriented', 'fatigue-aware', 'high-variation',
    'stability-preferring', 'identity-fragmented', 'audience-mirroring',
  ] as IdentityVector[]) vectorStrengths[v] = 5;
  return {
    identityStability: 6,
    identityFragmentation: 3,
    behavioralConsistency: 6,
    adaptationVelocity: 3,
    dominantIdentityVectors: [],
    emergingIdentityVectors: [],
    collapsingIdentityVectors: [],
    identityContradictions: [],
    persistentBehavioralPatterns: [],
    contextualIdentityModes: [],
    longTermDrift: [],
    identityPressure: {
      noveltyPressure: 3, trustPressure: 3,
      fatiguePressure: 3, adaptationPressure: 3,
    },
    continuityRisk: 3,
    vectorStrengths,
    reasonCodes: [],
    ...over,
  };
}

async function main() {
  // ── A. same inputs → same governance ─────────────────────────
  {
    const input = {
      cognitiveWeight: cogWeight({ strategy: 8, trust: 7, quality: 7 }),
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity(),
    };
    const g1 = computeExecutiveGovernance(input);
    const g2 = computeExecutiveGovernance(input);
    check('A · same inputs → same governance',
      JSON.stringify(g1) === JSON.stringify(g2),
      `exec ${g1.dominantGovernanceStructure.primaryExecutive ?? 'none'} · stability ${g1.governanceStability}`);
  }

  // ── B. recurring trust collapses elevate trust-guardian ─────
  {
    // Run governance under trust collapse + trust system high — record observations.
    let mem = createInitialExecutiveGovernanceMemory();
    for (let i = 0; i < 10; i++) {
      const cw = cogWeight({ trust: 9, strategy: 6, culture: 7 });
      const gov = computeExecutiveGovernance({
        cognitiveWeight: cw,
        conflict: conflict({ overallTension: 5, cognitiveStability: 5 }),
        culturalPerception: culture({ trustClimate: 2,
          dominantSignals: ['trust-fragile'] as CulturalSignal[] }),
        identityContinuity: identity(),
        history: buildGovernanceHistoryContext(mem),
      });
      mem = applyGovernanceObservation(mem, buildGovernanceObservation({
        at: 100 + i, bannerId: `b-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        governance: gov, authorities: cw.weights,
        suppressed: cw.suppressedSystems.map((s) => s.system),
      }));
    }
    const trustGuardianAppearances = mem.observations.filter((o) =>
      o.roleByStystem.trust === 'trust-guardian' || o.stabilizers.includes('trust'),
    ).length;
    check('B · recurring trust collapses elevate trust-guardian legitimacy',
      trustGuardianAppearances >= 5 && mem.authorityEwma.trust >= 7,
      `trust-guardian appearances=${trustGuardianAppearances} · trust ewma=${mem.authorityEwma.trust.toFixed(2)}`);
  }

  // ── C. novelty eras elevate novelty-driver authority ────────
  {
    const noveltyGov = computeExecutiveGovernance({
      cognitiveWeight: cogWeight({ novelty: 8, strategy: 5, culture: 7 }),
      conflict: conflict(),
      culturalPerception: culture({ noveltyScore: 9, emotionalFreshness: 8 }),
      identityContinuity: identity(),
    });
    const noveltyRole = noveltyGov.governanceRoles.find((r) => r.system === 'novelty');
    check('C · novelty eras elevate novelty-driver authority',
      noveltyRole?.role === 'novelty-driver' && noveltyRole.contextualLegitimacy >= 5,
      `novelty role=${noveltyRole?.role} legitimacy=${noveltyRole?.contextualLegitimacy}`);
  }

  // ── D. recurring fragmentation raises authorityFragmentation ─
  {
    const cleanGov = computeExecutiveGovernance({
      cognitiveWeight: cogWeight({ strategy: 7 }, { cognitiveFragmentation: 1 }),
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity(),
    });
    const fragGov = computeExecutiveGovernance({
      cognitiveWeight: cogWeight(
        { strategy: 7, novelty: 7, trust: 7, culture: 7, fatigue: 7, quality: 7 },
        { cognitiveFragmentation: 9 },
      ),
      conflict: conflict({
        overallTension: 9, cognitiveStability: 2,
        activeConflicts: [
          { type: 'trust-vs-conversion', severity: 9, systemsInvolved: ['trust'], explanation: '', suggestedObservation: '' },
          { type: 'novelty-vs-authenticity', severity: 8, systemsInvolved: ['novelty'], explanation: '', suggestedObservation: '' },
        ],
      }),
      culturalPerception: culture({ aestheticFatigue: 9, audienceNumbness: 9 }),
      identityContinuity: identity({ identityFragmentation: 8 }),
    });
    check('D · recurring fragmentation raises authorityFragmentation',
      fragGov.authorityFragmentation > cleanGov.authorityFragmentation &&
      fragGov.authorityFragmentation >= 5,
      `clean.frag=${cleanGov.authorityFragmentation} frag.frag=${fragGov.authorityFragmentation}`);
  }

  // ── E. stable governance eras increase governanceStability ──
  {
    let mem = createInitialExecutiveGovernanceMemory();
    const stableInput = {
      cognitiveWeight: cogWeight({ strategy: 8, trust: 7, quality: 7 },
        { globalStability: 9, cognitiveFragmentation: 1 }),
      conflict: conflict({ overallTension: 2, cognitiveStability: 9, alignmentScore: 9 }),
      culturalPerception: culture({ trustClimate: 8, humanResonance: 8 }),
      identityContinuity: identity({ identityStability: 8 }),
    };
    for (let i = 0; i < 12; i++) {
      const gov = computeExecutiveGovernance({
        ...stableInput, history: buildGovernanceHistoryContext(mem),
      });
      mem = applyGovernanceObservation(mem, buildGovernanceObservation({
        at: 100 + i, bannerId: `e-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        governance: gov, authorities: stableInput.cognitiveWeight.weights,
        suppressed: stableInput.cognitiveWeight.suppressedSystems.map((s) => s.system),
      }));
    }
    const view = buildExecutiveGovernanceLongitudinalView({ memory: mem });
    check('E · stable governance eras increase governanceStability',
      view.averageStability >= 7 &&
      (view.governanceTrend === 'stable' || view.governanceTrend === 'consolidating'),
      `avgStability=${view.averageStability} trend=${view.governanceTrend}`);
  }

  // ── F. over-centralization raises executiveOverreachRisk ────
  {
    // Pre-seed memory with same primary executive for 8 consecutive runs.
    let mem = createInitialExecutiveGovernanceMemory();
    const stratWeights = cogWeight({ strategy: 9 });
    for (let i = 0; i < 8; i++) {
      const gov = computeExecutiveGovernance({
        cognitiveWeight: stratWeights,
        conflict: conflict(),
        culturalPerception: culture(),
        identityContinuity: identity(),
        history: buildGovernanceHistoryContext(mem),
      });
      mem = applyGovernanceObservation(mem, buildGovernanceObservation({
        at: 100 + i, bannerId: `f-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        governance: gov, authorities: stratWeights.weights,
        suppressed: stratWeights.suppressedSystems.map((s) => s.system),
      }));
    }
    const finalGov = computeExecutiveGovernance({
      cognitiveWeight: stratWeights,
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      history: buildGovernanceHistoryContext(mem),
    });
    const overreach = finalGov.executiveOverreachRisks.find((r) => r.system === 'strategy');
    check('F · over-centralization raises executiveOverreachRisk',
      !!overreach && overreach.overreachScore >= 5,
      overreach ? `overreach.strategy=${overreach.overreachScore}` : 'NOT DETECTED');
  }

  // ── G. suppressed-but-correct systems become shadowExecutives ─
  {
    // Pre-seed memory where 'trust' is suppressed but runs avoided collapse.
    let mem = createInitialExecutiveGovernanceMemory();
    for (let i = 0; i < 8; i++) {
      const cw = cogWeight({ strategy: 8, trust: 3 });   // trust suppressed
      const gov: any = {
        governanceStability: 7, executiveLegitimacy: 7,
        authorityFragmentation: 2, adaptiveBalance: 7,
        dominantGovernanceStructure: {
          primaryExecutive: 'strategy', supportingSystems: [], suppressedSystems: ['trust'],
          explanation: '',
        },
        governanceRoles: [],
        authorityTransitions: [], suppressedAuthorities: [],
        shadowExecutives: [], governanceConflicts: [],
        stabilizationPatterns: [], destabilizationPatterns: [],
        contextualLeadershipRules: [], authorityCollapseRisks: [],
        executiveOverreachRisks: [],
        governancePressure: { trustPressure: 3, noveltyPressure: 3, adaptationPressure: 3, fragmentationPressure: 2 },
        longTermAuthorityDrift: [], behavioralGovernanceFingerprint: [],
        reasonCodes: [],
      };
      mem = applyGovernanceObservation(mem, buildGovernanceObservation({
        at: 100 + i, bannerId: `g-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        governance: gov, authorities: cw.weights,
        suppressed: ['trust'],          // trust is suppressed
        // avoidedCollapse is computed in buildGovernanceObservation from
        // gov.governanceStability + authorityFragmentation, which here =true.
      }));
    }
    const finalGov = computeExecutiveGovernance({
      cognitiveWeight: cogWeight({ strategy: 8, trust: 3 }),
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity(),
      history: buildGovernanceHistoryContext(mem),
    });
    const shadow = finalGov.shadowExecutives.find((s) => s.system === 'trust');
    check('G · suppressed-but-correct systems become shadowExecutives',
      !!shadow && shadow.predictiveAccuracy >= 5,
      shadow ? `shadow.trust accuracy=${shadow.predictiveAccuracy}` : 'NOT DETECTED');
  }

  // ── H. FIFO caps stable ──────────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'governance-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodExecutiveGovernance = undefined;
    const store = createExecutiveGovernanceMemoryStore(tmpDir);
    await store.reset();
    const baseAuth = {} as Record<CognitiveSystem, number>;
    for (const s of ALL_COGNITIVE_SYSTEMS) baseAuth[s] = 5;
    const stubObs: GovernanceObservation = {
      at: 0, bannerId: 'h', formula: 'ENERGY', campaignMode: 'Documentary',
      primaryExecutive: 'strategy',
      authorities: baseAuth,
      roleByStystem: { strategy: 'executive' },
      stabilizers: [],
      suppressed: [],
      avoidedCollapse: true,
      governanceStability: 5, executiveLegitimacy: 5,
      authorityFragmentation: 3, adaptiveBalance: 5,
    };
    for (let i = 0; i < GOVERNANCE_OBSERVATION_LIMIT + 20; i++) {
      await store.append({ ...stubObs, at: 100 + i, bannerId: `h-${i}` });
    }
    const state = await store.read();
    check('H · FIFO cap stable at GOVERNANCE_OBSERVATION_LIMIT',
      state.observations.length === GOVERNANCE_OBSERVATION_LIMIT &&
      state.totalObservations === GOVERNANCE_OBSERVATION_LIMIT + 20 &&
      state.stabilityTrace.length <= 64,
      `obs=${state.observations.length}/${GOVERNANCE_OBSERVATION_LIMIT} total=${state.totalObservations} trace=${state.stabilityTrace.length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodExecutiveGovernance = undefined;
  }

  // ── I. no runtime mutation ───────────────────────────────────
  {
    const input = {
      cognitiveWeight: cogWeight({ strategy: 8, trust: 7, quality: 7 }),
      conflict: conflict(),
      culturalPerception: culture(),
      identityContinuity: identity(),
    };
    const before = JSON.stringify(input);
    computeExecutiveGovernance(input);
    computeExecutiveGovernance(input);
    const after = JSON.stringify(input);
    check('I · no runtime mutation — engine leaves inputs unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── J. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/executiveGovernanceEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/executiveGovernanceMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/executiveGovernanceLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('J · no critic imports in governance sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}${criticPath ? ', critic-path' : ''}`);
  }

  // ── K. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/executiveGovernanceEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/executiveGovernanceMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/executiveGovernanceLongitudinalView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('K · no external APIs in governance sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── L. deterministic outputs ─────────────────────────────────
  {
    let mem = createInitialExecutiveGovernanceMemory();
    const baseAuth = {} as Record<CognitiveSystem, number>;
    for (const s of ALL_COGNITIVE_SYSTEMS) baseAuth[s] = 5;
    for (let i = 0; i < 6; i++) {
      const gov = computeExecutiveGovernance({
        cognitiveWeight: cogWeight({ strategy: 8, trust: 7 }),
        conflict: conflict(),
        culturalPerception: culture(),
        identityContinuity: identity(),
        history: buildGovernanceHistoryContext(mem),
      });
      mem = applyGovernanceObservation(mem, buildGovernanceObservation({
        at: 100 + i, bannerId: `l-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        governance: gov, authorities: baseAuth, suppressed: [],
      }));
    }
    const view1 = buildExecutiveGovernanceLongitudinalView({ memory: mem });
    const view2 = buildExecutiveGovernanceLongitudinalView({ memory: mem });
    check('L · deterministic — same memory → byte-identical view',
      JSON.stringify(view1) === JSON.stringify(view2),
      `executives×${view1.executiveRanking.length} trend=${view1.governanceTrend}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
