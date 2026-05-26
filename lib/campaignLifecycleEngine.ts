/**
 * CAMPAIGN LIFECYCLE ENGINE
 *
 * Deterministic, read-only. Models how a campaign CHANGES OVER TIME
 * — when it is forming, testing, compounding, fatiguing, decaying,
 * needs to branch, needs to rest, or has become strategically stable.
 *
 * Filename uses "campaignLifecycle" because lib/campaignEvolutionEngine.ts
 * already exists as a different earlier-wave concept. Storage and the
 * GET endpoint use "campaign-evolution" to match the spec.
 *
 * The system does NOT decide what to do. It models what is HAPPENING
 * to the campaign across time.
 *
 * STRICTLY:
 *   - no autonomous publishing / generation rewriting / budget decisions
 *   - no automatic prompt mutation / critic / verdict mutation
 *   - no self-modification / autonomous execution
 *   - no external APIs / model calls
 *   - same inputs → same evolution reading
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { CopyQualityAxis } from './copyQualityAdapter';
import type { CulturalPerception } from './culturalPerceptionEngine';
import type { IdentityContinuity } from './identityContinuityEngine';
import type { ExecutiveGovernance } from './executiveGovernanceEngine';
import type { StrategicOutcomeIntelligence } from './strategicOutcomeIntelligence';
import type {
  CounterfactualCognition, CampaignArchetype, CounterfactualProjection,
} from './counterfactualCognitionEngine';
import type { PolicyAuditView } from './copyQualityPolicyAuditView';
import type { QualityLongitudinalView } from './qualityLongitudinalView';

// ─── taxonomy ──────────────────────────────────────────────────

export type CampaignPhase =
  | 'forming'
  | 'testing'
  | 'compounding'
  | 'fatiguing'
  | 'decaying'
  | 'needs-branch'
  | 'needs-rest'
  | 'strategically-stable';

export const ALL_CAMPAIGN_PHASES: CampaignPhase[] = [
  'forming', 'testing', 'compounding', 'fatiguing',
  'decaying', 'needs-branch', 'needs-rest', 'strategically-stable',
];

// ─── output shape ──────────────────────────────────────────────

export interface PossibleBranch {
  branchName: string;
  reason: string;
  expectedStrategicPurpose: string;
  risk: number;
  durabilityPotential: number;
  /** Per-axis predicted impacts from the source counterfactual projection.
   *  These let the human-supervised activation endpoint persist the
   *  expected outcome at activation time so reality can be measured
   *  against it. -10..+10. */
  trustImpact: number;
  fatigueImpact: number;
  durabilityImpact: number;
  /** Which counterfactual-cognition slot surfaced this branch:
   *  'trust-optimal' | 'durability-optimal' | 'fatigue-aware' |
   *  'high-impact' — used to attribute prediction accuracy by
   *  projection type. */
  counterfactualType: string;
}

export interface AudienceEvolution {
  currentAudience: string | null;
  audienceFatigue: number;
  rotationCandidate: string | null;
  reason: string;
}

export interface CampaignEvolution {
  campaignHealth: number;
  creativeFreshness: number;
  fatiguePressure: number;
  trustMomentum: number;
  decayRisk: number;
  branchReadiness: number;
  audienceRotationNeed: number;
  strategicDurability: number;

  currentPhase: CampaignPhase;
  dominantCampaignPattern: string | null;

  recommendedObservations: string[];
  possibleBranches: PossibleBranch[];

  decaySignals: string[];
  trustSignals: string[];
  fatigueSignals: string[];
  freshnessSignals: string[];

  audienceEvolution: AudienceEvolution;

  campaignMemoryFingerprint: string[];
  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

export interface CampaignLifecycleHistoryContext {
  observationCount: number;
  recentPatterns: string[];
  recentTrustDurability?: number;
  recentFatiguePressure?: number;
  recentDecayRisk?: number;
  recentPhases: CampaignPhase[];
  audienceFatigue?: Record<string, number>;
  patternCounts?: Record<string, number>;
  patternHealthStats?: Record<string, { count: number; healthSum: number }>;
}

export interface CampaignLifecycleInput {
  strategy?: AdStrategyAssessment | null;
  copyQuality?: CopyQualityAxis | null;
  culturalPerception?: CulturalPerception | null;
  identityContinuity?: IdentityContinuity | null;
  executiveGovernance?: ExecutiveGovernance | null;
  strategicOutcome?: StrategicOutcomeIntelligence | null;
  counterfactualCognition?: CounterfactualCognition | null;
  policyAuditView?: PolicyAuditView | null;
  qualityLongitudinal?: QualityLongitudinalView | null;
  history?: CampaignLifecycleHistoryContext | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

// ─── per-axis derivations ─────────────────────────────────────

function deriveFatiguePressure(i: CampaignLifecycleInput): number {
  const c = i.culturalPerception;
  const out = i.strategicOutcome;
  let p = 0;
  if (c) {
    p = (c.aestheticFatigue + c.audienceNumbness + c.pacingFatigue + c.hookSaturation) / 4;
  }
  if (out) {
    p = Math.max(p, out.strategicPressureMap.fatiguePressure * 0.9);
  }
  if (i.history?.recentFatiguePressure !== undefined) {
    p = p * 0.7 + i.history.recentFatiguePressure * 0.3;
  }
  return clamp10(p);
}

function deriveCreativeFreshness(i: CampaignLifecycleInput): number {
  const c = i.culturalPerception;
  const repCount = i.history?.recentPatterns
    ? i.history.recentPatterns.slice(-6)
        .filter((p, idx, arr) => arr.indexOf(p) !== idx).length
    : 0;
  let f = c ? (c.emotionalFreshness + c.noveltyScore - c.audienceNumbness) / 2 + 4 : 5;
  f -= repCount * 0.8;
  return clamp10(f);
}

function deriveTrustMomentum(i: CampaignLifecycleInput): number {
  const out = i.strategicOutcome;
  const c = i.culturalPerception;
  let trust = 5;
  if (out) {
    trust = out.trustDurability;
    const drift = out.longTermOutcomeDrift.find((d) => d.signature === 'trust-compounding');
    if (drift) trust += drift.drift * 0.5;
    const erosiveDrift = out.longTermOutcomeDrift.find((d) => d.signature === 'trust-erosive');
    if (erosiveDrift && erosiveDrift.drift > 0) trust -= erosiveDrift.drift * 0.6;
  }
  if (c && c.trustClimate >= 7) trust += (c.trustClimate - 6) * 0.3;
  if (c && c.trustClimate <= 4) trust -= (5 - c.trustClimate) * 0.5;
  if (i.history?.recentTrustDurability !== undefined) {
    trust = trust * 0.6 + i.history.recentTrustDurability * 0.4;
  }
  return clamp10(trust);
}

function deriveDecayRisk(i: CampaignLifecycleInput): number {
  const out = i.strategicOutcome;
  const c = i.culturalPerception;
  let r = 0;
  if (out) {
    r = out.strategicRisk * 0.6 +
        out.noveltyFragility * 0.2 +
        out.signatureStrengths['trust-erosive'] * 0.2;
  }
  if (c && c.dominantSignals.includes('aesthetic-burnout')) r += 1.5;
  if (c && c.dominantSignals.includes('emotionally-numb')) r += 1.5;
  if (c && c.dominantSignals.includes('trust-fragile')) r += 1.5;
  if (i.history?.recentDecayRisk !== undefined) {
    r = r * 0.7 + i.history.recentDecayRisk * 0.3;
  }
  return clamp10(r);
}

function deriveStrategicDurability(i: CampaignLifecycleInput): number {
  const out = i.strategicOutcome;
  const id = i.identityContinuity;
  const gov = i.executiveGovernance;
  let d = 5;
  if (out) d = out.strategicStability * 0.5 + out.longTermConsistency * 0.3 + (10 - out.strategicRisk) * 0.2;
  if (id) d = d * 0.6 + (id.behavioralConsistency * 0.5 + (10 - id.continuityRisk) * 0.5) * 0.4;
  if (gov) d = d * 0.7 + gov.governanceStability * 0.3;
  return clamp10(d);
}

function deriveBranchReadiness(
  fatigue: number, decay: number, freshness: number, patternRepCount: number,
): number {
  return clamp10(
    patternRepCount * 1.0 +
    Math.max(0, fatigue - 4) * 0.6 +
    Math.max(0, decay - 3) * 0.5 +
    Math.max(0, 6 - freshness) * 0.4,
  );
}

function deriveAudienceRotationNeed(i: CampaignLifecycleInput): number {
  const c = i.culturalPerception;
  const audFatigue = i.history?.audienceFatigue;
  let r = 0;
  if (c) {
    r += c.audienceNumbness * 0.5;
    r += Math.max(0, c.conformityRisk - 4) * 0.4;
  }
  if (audFatigue) {
    const max = Math.max(0, ...Object.values(audFatigue));
    r += max * 1.0;
  }
  return clamp10(r);
}

// ─── phase classifier ─────────────────────────────────────────

function classifyPhase(args: {
  totalObs: number;
  campaignHealth: number;
  fatiguePressure: number;
  trustMomentum: number;
  decayRisk: number;
  creativeFreshness: number;
  branchReadiness: number;
  audienceRotationNeed: number;
  strategicDurability: number;
}): CampaignPhase {
  const {
    totalObs, campaignHealth, fatiguePressure, trustMomentum,
    decayRisk, creativeFreshness, branchReadiness, audienceRotationNeed,
    strategicDurability,
  } = args;

  if (totalObs < 3) return 'forming';

  if (fatiguePressure >= 8 && audienceRotationNeed >= 7) return 'needs-rest';
  if (decayRisk >= 7 && trustMomentum <= 4) return 'decaying';
  if (branchReadiness >= 7) return 'needs-branch';

  if (strategicDurability >= 7 && trustMomentum >= 7 && campaignHealth >= 7) {
    return 'strategically-stable';
  }
  if (trustMomentum >= 6 && creativeFreshness >= 5 && fatiguePressure <= 5) {
    return 'compounding';
  }

  if (fatiguePressure >= 5) return 'fatiguing';

  return 'testing';
}

// ─── signal builders ──────────────────────────────────────────

function deriveSignals(i: CampaignLifecycleInput, scores: {
  fatiguePressure: number;
  trustMomentum: number;
  decayRisk: number;
  creativeFreshness: number;
  patternRepCount: number;
}): {
  decaySignals: string[];
  trustSignals: string[];
  fatigueSignals: string[];
  freshnessSignals: string[];
} {
  const c = i.culturalPerception;
  const out = i.strategicOutcome;
  const decaySignals: string[] = [];
  const trustSignals: string[] = [];
  const fatigueSignals: string[] = [];
  const freshnessSignals: string[] = [];

  if (scores.decayRisk >= 6) decaySignals.push(`decay risk ${scores.decayRisk.toFixed(1)}/10`);
  if (out && out.signatureStrengths['trust-erosive'] >= 5) {
    decaySignals.push(`trust-erosive signature active (${out.signatureStrengths['trust-erosive'].toFixed(1)}/10)`);
  }
  if (out && out.noveltyFragility >= 6) {
    decaySignals.push(`novelty fragility ${out.noveltyFragility.toFixed(1)}/10`);
  }
  if (c && c.dominantSignals.includes('aesthetic-burnout')) decaySignals.push('aesthetic-burnout signal active');
  if (scores.patternRepCount >= 2) decaySignals.push(`pattern repetition recurring (×${scores.patternRepCount} recent)`);

  if (scores.trustMomentum >= 6) trustSignals.push(`trust momentum ${scores.trustMomentum.toFixed(1)}/10`);
  if (out && out.signatureStrengths['trust-compounding'] >= 6) {
    trustSignals.push(`trust-compounding signature active (${out.signatureStrengths['trust-compounding'].toFixed(1)}/10)`);
  }
  if (c && c.trustClimate >= 7) trustSignals.push(`trust climate ${c.trustClimate.toFixed(1)}/10`);
  if (i.strategy && i.strategy.trustDebt <= 2) trustSignals.push(`low trust debt (${i.strategy.trustDebt.toFixed(1)}/10)`);

  if (scores.fatiguePressure >= 6) fatigueSignals.push(`fatigue pressure ${scores.fatiguePressure.toFixed(1)}/10`);
  if (c && c.audienceNumbness >= 6) fatigueSignals.push(`audience numbness ${c.audienceNumbness.toFixed(1)}/10`);
  if (c && c.pacingFatigue >= 6) fatigueSignals.push(`pacing fatigue ${c.pacingFatigue.toFixed(1)}/10`);
  if (c && c.hookSaturation >= 6) fatigueSignals.push(`hook saturation ${c.hookSaturation.toFixed(1)}/10`);

  if (scores.creativeFreshness >= 6) freshnessSignals.push(`creative freshness ${scores.creativeFreshness.toFixed(1)}/10`);
  if (c && c.emotionalFreshness >= 7) freshnessSignals.push(`emotional freshness ${c.emotionalFreshness.toFixed(1)}/10`);
  if (c && c.noveltyScore >= 6) freshnessSignals.push(`novelty score ${c.noveltyScore.toFixed(1)}/10`);
  if (c && c.dominantSignals.includes('human-resonant')) freshnessSignals.push('human-resonant signal active');
  if (c && c.dominantSignals.includes('emotionally-fresh')) freshnessSignals.push('emotionally-fresh signal active');

  return { decaySignals, trustSignals, fatigueSignals, freshnessSignals };
}

// ─── branches from counterfactuals ────────────────────────────

function deriveBranchesFromCounterfactuals(
  cf: CounterfactualCognition | null | undefined,
): PossibleBranch[] {
  if (!cf) return [];
  const branches: PossibleBranch[] = [];
  const seen = new Set<CampaignArchetype>();

  function addFrom(p: CounterfactualProjection, reason: string, counterfactualType: string) {
    if (seen.has(p.counterfactualCampaignArchetype)) return;
    seen.add(p.counterfactualCampaignArchetype);
    const negImpacts = Math.abs(Math.min(0, p.trustImpact)) +
                       Math.abs(Math.min(0, p.durabilityImpact));
    const risk = clamp10(5 + negImpacts - Math.max(0, p.durabilityImpact));
    const durabilityPotential = clamp10(5 + p.durabilityImpact + p.trustImpact * 0.5);
    branches.push({
      branchName: p.counterfactualCampaignArchetype,
      reason,
      expectedStrategicPurpose: p.archetypeDescription,
      risk: round1(risk),
      durabilityPotential: round1(durabilityPotential),
      trustImpact: p.trustImpact,
      fatigueImpact: p.fatigueImpact,
      durabilityImpact: p.durabilityImpact,
      counterfactualType,
    });
  }

  if (cf.trustOptimizedPath) addFrom(cf.trustOptimizedPath, 'trust-optimal alternate path', 'trust-optimal');
  if (cf.durabilityOptimizedPath) addFrom(cf.durabilityOptimizedPath, 'durability-optimal alternate path', 'durability-optimal');
  if (cf.fatigueAwarePath) addFrom(cf.fatigueAwarePath, 'fatigue-aware alternate path', 'fatigue-aware');
  for (const p of cf.highImpactPaths.slice(0, 3)) {
    if (seen.has(p.counterfactualCampaignArchetype)) continue;
    addFrom(p, 'high-impact alternate path', 'high-impact');
  }
  return branches.slice(0, 5);
}

// ─── recommended observations ─────────────────────────────────

function deriveRecommendedObservations(args: {
  phase: CampaignPhase;
  fatiguePressure: number;
  trustMomentum: number;
  decayRisk: number;
  branchReadiness: number;
  audienceRotationNeed: number;
  patternRepCount: number;
}): string[] {
  const obs: string[] = [];
  switch (args.phase) {
    case 'forming':
      obs.push('campaign too young to read — keep observing baseline patterns');
      break;
    case 'testing':
      obs.push('campaign still finding its strategic axis — observe what consistently lands vs. fades');
      break;
    case 'compounding':
      obs.push('trust + freshness compounding — protect the rhythm, avoid forcing volume');
      break;
    case 'fatiguing':
      obs.push('audience saturation rising — observe whether quieter variants restore engagement');
      break;
    case 'decaying':
      obs.push('decay active — observe trust trajectory and rest the heaviest patterns');
      break;
    case 'needs-branch':
      obs.push('pattern recurrence + fatigue rising — observe whether alternate paths protect durability');
      break;
    case 'needs-rest':
      obs.push('audience deeply saturated — observe whether silence restores receptivity');
      break;
    case 'strategically-stable':
      obs.push('campaign earning durability — observe whether stability invites complacency');
      break;
  }
  if (args.patternRepCount >= 3) {
    obs.push(`pattern repetition recurring ×${args.patternRepCount} — observe whether divergence improves durability`);
  }
  if (args.audienceRotationNeed >= 7) {
    obs.push('audience rotation indicated — observe whether secondary audiences hold receptivity');
  }
  if (args.trustMomentum <= 4 && args.decayRisk >= 5) {
    obs.push('trust trending down while decay rises — observe trust-led variants under controlled conditions');
  }
  return obs.slice(0, 5);
}

// ─── audience evolution ───────────────────────────────────────

function deriveAudienceEvolution(i: CampaignLifecycleInput): AudienceEvolution {
  const strat = i.strategy;
  const current = strat?.primaryAudience ?? null;
  const audFatigue = i.history?.audienceFatigue ?? {};
  const currentFatigue = current ? (audFatigue[current] ?? 0) : 0;
  let rotationCandidate: string | null = null;
  let reason = '';
  if (currentFatigue >= 6) {
    const sorted = Object.entries(audFatigue)
      .filter(([a]) => a !== current)
      .sort((a, b) => a[1] - b[1]);
    if (sorted.length > 0) {
      rotationCandidate = sorted[0][0];
      reason = `current audience (${current}) fatigue ${currentFatigue.toFixed(1)}/10 — coolest alternate: ${rotationCandidate} (${sorted[0][1].toFixed(1)}/10)`;
    } else if (strat && strat.secondaryAudience) {
      // Fall back to strategy's secondaryAudience when no alternate
      // audiences exist in EWMA yet.
      rotationCandidate = strat.secondaryAudience;
      reason = `current audience fatigue ${currentFatigue.toFixed(1)}/10 — strategy's secondary audience (${strat.secondaryAudience}) as natural alternate`;
    } else {
      reason = `current audience fatigue ${currentFatigue.toFixed(1)}/10 — no alternate audiences observed yet`;
    }
  } else if (strat && strat.secondaryAudience) {
    rotationCandidate = strat.secondaryAudience;
    reason = 'secondary audience available in strategy as natural alternate';
  } else {
    reason = 'current audience reading sustainable — no rotation pressure';
  }
  return {
    currentAudience: current,
    audienceFatigue: round1(currentFatigue),
    rotationCandidate,
    reason,
  };
}

// ─── fingerprint ──────────────────────────────────────────────

function deriveMemoryFingerprint(i: CampaignLifecycleInput): string[] {
  const out: string[] = [];
  const so = i.strategicOutcome;
  const id = i.identityContinuity;
  const gov = i.executiveGovernance;
  const cf = i.counterfactualCognition;
  if (so && so.dominantStrategicSignatures[0]) out.push(`signature:${so.dominantStrategicSignatures[0].signature}`);
  if (id && id.dominantIdentityVectors[0]) out.push(`identity:${id.dominantIdentityVectors[0].vector}`);
  if (gov && gov.dominantGovernanceStructure.primaryExecutive) {
    out.push(`exec:${gov.dominantGovernanceStructure.primaryExecutive}`);
  }
  if (cf && cf.actualArchetype) out.push(`archetype:${cf.actualArchetype}`);
  return out;
}

function dominantPattern(fp: string[]): string | null {
  if (fp.length === 0) return null;
  return fp.join(' · ');
}

// ─── main ──────────────────────────────────────────────────────

export function computeCampaignEvolution(
  input: CampaignLifecycleInput,
): CampaignEvolution {
  const totalObs = input.history?.observationCount ?? 0;

  const fingerprint = deriveMemoryFingerprint(input);
  const fpKey = fingerprint.join('|');
  const recentPatterns = input.history?.recentPatterns ?? [];
  const patternRepCount = recentPatterns.filter((p) => p === fpKey).length;

  const fatiguePressure = round1(deriveFatiguePressure(input));
  const creativeFreshness = round1(deriveCreativeFreshness(input));
  const trustMomentum = round1(deriveTrustMomentum(input));
  const decayRisk = round1(deriveDecayRisk(input));
  const strategicDurability = round1(deriveStrategicDurability(input));
  const branchReadiness = round1(deriveBranchReadiness(
    fatiguePressure, decayRisk, creativeFreshness, patternRepCount,
  ));
  const audienceRotationNeed = round1(deriveAudienceRotationNeed(input));

  const campaignHealth = round1(clamp10(
    trustMomentum * 0.25 +
    creativeFreshness * 0.2 +
    strategicDurability * 0.25 +
    (10 - fatiguePressure) * 0.15 +
    (10 - decayRisk) * 0.15,
  ));

  const currentPhase = classifyPhase({
    totalObs, campaignHealth, fatiguePressure, trustMomentum,
    decayRisk, creativeFreshness, branchReadiness, audienceRotationNeed,
    strategicDurability,
  });

  const signals = deriveSignals(input, {
    fatiguePressure, trustMomentum, decayRisk, creativeFreshness, patternRepCount,
  });

  const possibleBranches = deriveBranchesFromCounterfactuals(input.counterfactualCognition);

  const recommendedObservations = deriveRecommendedObservations({
    phase: currentPhase, fatiguePressure, trustMomentum, decayRisk,
    branchReadiness, audienceRotationNeed, patternRepCount,
  });

  const audienceEvolution = deriveAudienceEvolution(input);

  const reasonCodes: string[] = [
    `phase:${currentPhase}`,
    `campaignHealth:${campaignHealth}`,
    `trustMomentum:${trustMomentum}`,
    `fatiguePressure:${fatiguePressure}`,
    `decayRisk:${decayRisk}`,
    `branchReadiness:${branchReadiness}`,
    `audienceRotationNeed:${audienceRotationNeed}`,
    `strategicDurability:${strategicDurability}`,
    `creativeFreshness:${creativeFreshness}`,
    `pattern-rep:${patternRepCount}`,
    `total-obs:${totalObs}`,
  ];

  return {
    campaignHealth,
    creativeFreshness,
    fatiguePressure,
    trustMomentum,
    decayRisk,
    branchReadiness,
    audienceRotationNeed,
    strategicDurability,
    currentPhase,
    dominantCampaignPattern: dominantPattern(fingerprint),
    recommendedObservations,
    possibleBranches,
    decaySignals: signals.decaySignals,
    trustSignals: signals.trustSignals,
    fatigueSignals: signals.fatigueSignals,
    freshnessSignals: signals.freshnessSignals,
    audienceEvolution,
    campaignMemoryFingerprint: fingerprint,
    reasonCodes,
  };
}
