/**
 * DYNAMIC COGNITIVE WEIGHT EVOLUTION ENGINE
 *
 * Deterministic, read-only. Tracks which internal "brains" deserve
 * more influence under current conditions. Does NOT decide who is
 * objectively correct — models contextual cognitive authority based
 * on signal richness, environmental pressure, and historical drift.
 *
 * STRICTLY:
 *   - no verdict / brutality / critic / generation mutation
 *   - no automatic weight application (display + audit only)
 *   - no auto-tuning / threshold mutation
 *   - no external APIs / model calls
 *   - same inputs → same evolution
 *
 * Imports: only data types and view types. No critic/pipeline imports.
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { CopyQualityAxis } from './copyQualityAdapter';
import type { CulturalPerception } from './culturalPerceptionEngine';
import type { CrossBrainConflict } from './crossBrainConflictEngine';
import type { PolicyAuditState } from './copyQualityPolicyAudit';
import type { QualityLongitudinalView } from './qualityLongitudinalView';
import type { ConflictLongitudinalView } from './conflictLongitudinalView';

// ─── taxonomy ──────────────────────────────────────────────────

export type CognitiveSystem =
  | 'strategy'
  | 'culture'
  | 'trust'
  | 'novelty'
  | 'fatigue'
  | 'quality'
  | 'policy'
  | 'emotion'
  | 'performance-memory'
  | 'authenticity'
  | 'restraint'
  | 'proof';

export const ALL_COGNITIVE_SYSTEMS: CognitiveSystem[] = [
  'strategy', 'culture', 'trust', 'novelty', 'fatigue', 'quality',
  'policy', 'emotion', 'performance-memory', 'authenticity',
  'restraint', 'proof',
];

// ─── output shape ──────────────────────────────────────────────

export interface DominantSystemEntry {
  system: CognitiveSystem;
  weight: number;
  confidence: number;
  explanation: string;
}

export interface SuppressedSystemEntry {
  system: CognitiveSystem;
  suppressionScore: number;
  reason: string;
}

export interface UnstableWeightEntry {
  system: CognitiveSystem;
  volatility: number;
  explanation: string;
}

export interface ContextualAuthorityEntry {
  condition: string;
  dominantSystem: CognitiveSystem;
  reason: string;
}

export interface WeightDriftEntry {
  system: CognitiveSystem;
  recentWeight: number;
  historicalWeight: number;
  drift: number;
}

export interface EnvironmentalSensitivity {
  fatigueSensitivity: number;
  trustSensitivity: number;
  noveltySensitivity: number;
  culturalSensitivity: number;
}

export interface CognitiveWeightEvolution {
  globalStability: number;
  adaptationPressure: number;
  cognitiveFragmentation: number;

  dominantSystems: DominantSystemEntry[];
  suppressedSystems: SuppressedSystemEntry[];
  unstableWeights: UnstableWeightEntry[];

  environmentalSensitivity: EnvironmentalSensitivity;

  contextualAuthority: ContextualAuthorityEntry[];

  weightDrift: WeightDriftEntry[];

  agreementPressure: number;
  disagreementPressure: number;

  /** Full computed weights per system — exposed so the memory store
   *  can persist them without re-deriving. 0..10 deterministic. */
  weights: Record<CognitiveSystem, number>;

  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

/** Minimal historical context the engine needs — drift + volatility
 *  derive from these. Pass `null` when no memory exists yet. */
export interface CognitiveWeightHistoryContext {
  /** EWMA per system, computed by the memory store. Same shape as
   *  `weights`. Null fields → no history for that system. */
  ewmaWeights: Partial<Record<CognitiveSystem, number>>;
  /** Variance per system over the recent window. */
  variance: Partial<Record<CognitiveSystem, number>>;
  /** Number of observations the memory contains. */
  observationCount: number;
  /** Optional recent fragmentation trace average. */
  recentFragmentation?: number;
}

export interface CognitiveWeightInput {
  conflict?: CrossBrainConflict | null;
  strategy?: AdStrategyAssessment | null;
  copyQuality?: CopyQualityAxis | null;
  culturalPerception?: CulturalPerception | null;
  policyAudit?: PolicyAuditState | null;
  qualityLongitudinal?: QualityLongitudinalView | null;
  conflictLongitudinal?: ConflictLongitudinalView | null;
  history?: CognitiveWeightHistoryContext | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── per-system weight derivation ─────────────────────────────

interface SystemDerivation {
  weight: number;
  confidence: number;
  reasons: string[];
}

function deriveStrategy(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  if (!i.strategy) return { weight: 3, confidence: 2, reasons: ['no-strategy-signal'] };
  let w = 5;
  let conf = 5;
  // Confidence in the strategy assessment maps to its authority weight.
  w += (i.strategy.confidence - 5) * 0.4;
  conf += (i.strategy.confidence - 5) * 0.6;
  reasons.push(`strategy.confidence:${round1(i.strategy.confidence)}`);
  // Heavy trust debt suppresses strategy (the trust brain takes over).
  if (i.strategy.trustDebt >= 5) {
    w -= (i.strategy.trustDebt - 4) * 0.6;
    reasons.push(`trustDebt-suppresses-strategy:${round1(i.strategy.trustDebt)}`);
  }
  // Aligned high-stability conflict reading boosts strategy.
  if (i.conflict && i.conflict.cognitiveStability >= 7) {
    w += 1;
    reasons.push('high-cognitive-stability → strategy-trusted');
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveCulture(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const c = i.culturalPerception;
  if (!c) return { weight: 3, confidence: 2, reasons: ['no-culture-signal'] };
  let w = 5;
  let conf = 5;
  // Rich observation history → high confidence.
  const codes = c.reasonCodes.length;
  conf += Math.min(3, codes * 0.4);
  reasons.push(`culture.reasonCodes:${codes}`);
  // CRITICAL: during audience fatigue, culture signals become MORE
  // reliable than strategy/conversion signals (per spec example).
  if (c.audienceNumbness >= 6) {
    w += (c.audienceNumbness - 5) * 0.7;
    reasons.push(`audience-fatigue-raises-culture-authority:${round1(c.audienceNumbness)}`);
  }
  if (c.aestheticFatigue >= 6) {
    w += (c.aestheticFatigue - 5) * 0.6;
    reasons.push(`aesthetic-fatigue-raises-culture-authority:${round1(c.aestheticFatigue)}`);
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveTrust(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const c = i.culturalPerception;
  const q = i.copyQuality;
  const strat = i.strategy;
  let w = 5;
  let conf = 4;
  // CRITICAL: trust collapse → trust system dominates over strategy.
  if (c && c.trustClimate <= 4) {
    w += (5 - c.trustClimate) * 0.9;
    conf += 1.5;
    reasons.push(`trust-collapse-raises-trust-authority:${round1(c.trustClimate)}`);
  }
  if (strat && strat.trustDebt >= 5) {
    w += (strat.trustDebt - 4) * 0.6;
    reasons.push(`trustDebt-raises-trust-authority:${round1(strat.trustDebt)}`);
  }
  // Long-term trust conflicts already mapped → trust gets the floor.
  if (i.conflictLongitudinal) {
    const longTrust = i.conflictLongitudinal.longTermTrustConflicts.length;
    if (longTrust > 0) {
      w += longTrust * 0.4;
      reasons.push(`long-term-trust-conflicts:${longTrust}`);
    }
  }
  // Strong present trust signal → high confidence in this brain.
  if (q && typeof q.trustSafety === 'number') {
    conf += Math.min(2, q.trustSafety * 0.2);
    reasons.push(`current-trustSafety:${round1(q.trustSafety)}`);
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveNovelty(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const c = i.culturalPerception;
  if (!c) return { weight: 3, confidence: 2, reasons: ['no-culture-for-novelty'] };
  let w = 5;
  let conf = 4;
  // High novelty score → novelty system is producing useful signal.
  if (c.noveltyScore >= 6) {
    w += (c.noveltyScore - 5) * 0.6;
    reasons.push(`novelty-active:${round1(c.noveltyScore)}`);
  }
  // CRITICAL: low novelty era → novelty system is LESS valuable.
  if (c.noveltyScore <= 4) {
    w -= (5 - c.noveltyScore) * 0.8;
    reasons.push(`low-novelty-era-suppresses:${round1(c.noveltyScore)}`);
  }
  // Novelty collapse cycles (longitudinal) further suppress.
  if (i.conflictLongitudinal && i.conflictLongitudinal.noveltyCollapseCycles >= 3) {
    w -= 1.5;
    reasons.push(`novelty-collapse-cycles:${i.conflictLongitudinal.noveltyCollapseCycles}`);
  }
  conf += Math.min(2, c.reasonCodes.length * 0.3);
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveFatigue(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const c = i.culturalPerception;
  if (!c) return { weight: 3, confidence: 2, reasons: ['no-culture-for-fatigue'] };
  let w = 4;
  let conf = 5;
  const fatigue = (c.aestheticFatigue + c.audienceNumbness + c.pacingFatigue) / 3;
  w += (fatigue - 4) * 0.6;
  reasons.push(`composite-fatigue:${round1(fatigue)}`);
  if (i.conflictLongitudinal && i.conflictLongitudinal.emotionalFatigueDrift >= 5) {
    w += 1;
    reasons.push(`emotional-fatigue-drift:${round1(i.conflictLongitudinal.emotionalFatigueDrift)}`);
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveQuality(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const q = i.copyQuality;
  let w = 5;
  let conf = 4;
  if (q) {
    w = q.copyIntegrity * 0.7 + 2;
    conf = 7;
    reasons.push(`copyIntegrity:${round1(q.copyIntegrity)}`);
  } else if (i.qualityLongitudinal && i.qualityLongitudinal.totalCopyQualitySamples > 0) {
    w = 5;
    conf = 5;
    reasons.push('longitudinal-quality-only');
  } else {
    return { weight: 3, confidence: 2, reasons: ['no-quality-signal'] };
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function derivePolicy(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  if (!i.policyAudit) return { weight: 3, confidence: 2, reasons: ['no-policy-audit'] };
  const total = i.policyAudit.totalEntries;
  let w = 4;
  let conf = 3;
  // More entries → more authority. Asymptotic.
  w += Math.min(4, total * 0.1);
  conf += Math.min(5, total * 0.15);
  reasons.push(`policy-entries:${total}`);
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveEmotion(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const c = i.culturalPerception;
  const strat = i.strategy;
  let w = 5;
  let conf = 4;
  if (c) {
    w += (c.emotionalFreshness - 5) * 0.5;
    reasons.push(`emotionalFreshness:${round1(c.emotionalFreshness)}`);
  }
  if (strat && (strat.persuasionMode === 'empathic' || strat.persuasionMode === 'narrative')) {
    w += 1;
    reasons.push(`emotional-persuasion:${strat.persuasionMode}`);
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function derivePerformanceMemory(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  let w = 4;
  let conf = 3;
  if (i.qualityLongitudinal && i.qualityLongitudinal.totalCopyQualitySamples > 0) {
    const samples = i.qualityLongitudinal.totalCopyQualitySamples;
    w += Math.min(3, samples * 0.1);
    conf += Math.min(4, samples * 0.15);
    reasons.push(`samples:${samples}`);
  } else {
    return { weight: 3, confidence: 2, reasons: ['no-longitudinal-quality'] };
  }
  // Strong recent performance → memory matters more.
  if (i.qualityLongitudinal && i.qualityLongitudinal.driftStatus === 'healthy') {
    w += 1;
    reasons.push('drift:healthy');
  }
  if (i.qualityLongitudinal && i.qualityLongitudinal.driftStatus === 'eroding') {
    w -= 1;
    reasons.push('drift:eroding');
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveAuthenticity(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const c = i.culturalPerception;
  if (!c) return { weight: 4, confidence: 3, reasons: ['no-culture-for-authenticity'] };
  let w = 4;
  let conf = 4;
  w += (c.perceivedAuthenticity - 5) * 0.7;
  reasons.push(`perceivedAuthenticity:${round1(c.perceivedAuthenticity)}`);
  if (c.humanResonance >= 7) {
    w += 1;
    reasons.push(`humanResonance:${round1(c.humanResonance)}`);
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveRestraint(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const c = i.culturalPerception;
  let w = 5;
  let conf = 4;
  if (c) {
    // Pacing fatigue raises restraint authority — quiet patterns matter more.
    if (c.pacingFatigue >= 6) {
      w += (c.pacingFatigue - 5) * 0.7;
      reasons.push(`pacing-fatigue-raises-restraint:${round1(c.pacingFatigue)}`);
    }
    if (c.dominantSignals.includes('over-performed') ||
        c.dominantSignals.includes('algorithmically-obvious')) {
      w += 1.5;
      reasons.push('over-performance-signal → restraint-authority');
    }
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

function deriveProof(i: CognitiveWeightInput): SystemDerivation {
  const reasons: string[] = [];
  const strat = i.strategy;
  const q = i.copyQuality;
  let w = 4;
  let conf = 4;
  if (strat && strat.proofNeed === 'high') {
    w += 2;
    reasons.push('proofNeed:high');
  } else if (strat && strat.proofNeed === 'medium') {
    w += 1;
    reasons.push('proofNeed:medium');
  }
  if (q && typeof q.proofAdequacy === 'number') {
    if (q.proofAdequacy >= 7) {
      w += 1;
      reasons.push(`proofAdequacy:${round1(q.proofAdequacy)}`);
    } else if (q.proofAdequacy <= 4) {
      w -= 1;
      reasons.push(`proof-inadequate:${round1(q.proofAdequacy)}`);
    }
  }
  return { weight: clamp10(w), confidence: clamp10(conf), reasons };
}

const DERIVATIONS: Record<CognitiveSystem, (i: CognitiveWeightInput) => SystemDerivation> = {
  strategy: deriveStrategy,
  culture: deriveCulture,
  trust: deriveTrust,
  novelty: deriveNovelty,
  fatigue: deriveFatigue,
  quality: deriveQuality,
  policy: derivePolicy,
  emotion: deriveEmotion,
  'performance-memory': derivePerformanceMemory,
  authenticity: deriveAuthenticity,
  restraint: deriveRestraint,
  proof: deriveProof,
};

// ─── volatility (from memory variance) ─────────────────────────

function describeVolatility(variance: number): string {
  if (variance >= 4) return 'high — authority swinging across runs';
  if (variance >= 2) return 'moderate — drifting between contexts';
  return 'low — stable authority';
}

// ─── contextual authority rules ────────────────────────────────

function buildContextualAuthority(
  i: CognitiveWeightInput,
  weights: Record<CognitiveSystem, number>,
): ContextualAuthorityEntry[] {
  const out: ContextualAuthorityEntry[] = [];
  const c = i.culturalPerception;
  const strat = i.strategy;

  if (c && c.audienceNumbness >= 6) {
    out.push({
      condition: `audience fatigue active (numbness ${round1(c.audienceNumbness)}/10)`,
      dominantSystem: 'culture',
      reason: 'cultural read becomes more reliable than conversion signals under fatigue',
    });
  }
  if (c && c.trustClimate <= 4) {
    out.push({
      condition: `trust climate fragile (${round1(c.trustClimate)}/10)`,
      dominantSystem: 'trust',
      reason: 'trust system dominates when belief erodes — strategy must yield',
    });
  }
  if (c && c.noveltyScore <= 4) {
    out.push({
      condition: `low novelty era (${round1(c.noveltyScore)}/10)`,
      dominantSystem: 'authenticity',
      reason: 'when novelty stalls, authenticity carries more weight than experimentation',
    });
  }
  if (c && (c.dominantSignals.includes('over-performed') || c.dominantSignals.includes('algorithmically-obvious'))) {
    out.push({
      condition: 'over-performance signals active',
      dominantSystem: 'restraint',
      reason: 'restraint earns authority when attention-pushing patterns lose effect',
    });
  }
  if (strat && strat.proofNeed === 'high') {
    out.push({
      condition: 'strategy demands proof',
      dominantSystem: 'proof',
      reason: 'proof system gains authority when the campaign role demands credibility',
    });
  }
  if (i.conflictLongitudinal && i.conflictLongitudinal.emotionalFatigueDrift >= 6) {
    out.push({
      condition: `emotional fatigue drift ${round1(i.conflictLongitudinal.emotionalFatigueDrift)}/10`,
      dominantSystem: 'fatigue',
      reason: 'persistent emotional fatigue raises the fatigue brain above emotional intensity',
    });
  }
  // Sort by which dominant system has the highest current weight to
  // surface the most "earned" authority first.
  out.sort((a, b) => weights[b.dominantSystem] - weights[a.dominantSystem]);
  return out.slice(0, 6);
}

// ─── environmental sensitivity ─────────────────────────────────

function deriveEnvironmentalSensitivity(
  i: CognitiveWeightInput,
): EnvironmentalSensitivity {
  const c = i.culturalPerception;
  const fatigue = c ? (c.aestheticFatigue + c.audienceNumbness + c.pacingFatigue) / 3 : 0;
  return {
    fatigueSensitivity: round1(clamp10(fatigue * 1.1)),
    trustSensitivity: round1(clamp10(c ? (10 - c.trustClimate) * 1.1 : 0)),
    noveltySensitivity: round1(clamp10(
      c ? Math.abs(c.noveltyScore - 5) * 1.4 : 0,
    )),
    culturalSensitivity: round1(clamp10(
      c ? Math.min(10, c.reasonCodes.length * 1.2) : 0,
    )),
  };
}

// ─── main ──────────────────────────────────────────────────────

export function computeCognitiveWeightEvolution(
  input: CognitiveWeightInput,
): CognitiveWeightEvolution {
  const reasonCodes: string[] = [];

  // 1. Derive per-system weights from the present-frame inputs.
  const weights = {} as Record<CognitiveSystem, number>;
  const confidences = {} as Record<CognitiveSystem, number>;
  const perSystemReasons = {} as Record<CognitiveSystem, string[]>;
  for (const s of ALL_COGNITIVE_SYSTEMS) {
    const d = DERIVATIONS[s](input);
    weights[s] = round1(d.weight);
    confidences[s] = round1(d.confidence);
    perSystemReasons[s] = d.reasons;
  }

  // 2. Dominant systems — top 4 by weight, weighted by confidence.
  const ranked = ALL_COGNITIVE_SYSTEMS
    .map((s) => ({
      system: s, weight: weights[s], confidence: confidences[s],
      score: weights[s] * 0.7 + confidences[s] * 0.3,
    }))
    .sort((a, b) =>
      b.score !== a.score ? b.score - a.score : a.system.localeCompare(b.system),
    );

  const dominantSystems: DominantSystemEntry[] = ranked.slice(0, 4)
    .filter((r) => r.weight >= 5)
    .map((r) => ({
      system: r.system,
      weight: r.weight,
      confidence: r.confidence,
      explanation: explainDominance(r.system, r.weight, r.confidence, perSystemReasons[r.system]),
    }));

  // 3. Suppressed systems — bottom-weighted with explanation.
  const suppressedSystems: SuppressedSystemEntry[] = ranked
    .filter((r) => r.weight <= 4)
    .slice(0, 4)
    .map((r) => ({
      system: r.system,
      suppressionScore: round1(10 - r.weight),
      reason: perSystemReasons[r.system].join(' · ') || 'no contextual pressure',
    }));

  // 4. Unstable weights — high-variance systems from memory.
  const unstableWeights: UnstableWeightEntry[] = ALL_COGNITIVE_SYSTEMS
    .map((s) => ({ system: s, variance: input.history?.variance[s] ?? 0 }))
    .filter((r) => r.variance >= 2)
    .sort((a, b) => b.variance - a.variance)
    .slice(0, 4)
    .map((r) => ({
      system: r.system,
      volatility: round1(Math.min(10, r.variance * 1.5)),
      explanation: describeVolatility(r.variance),
    }));

  // 5. Weight drift — recent vs historical EWMA.
  const weightDrift: WeightDriftEntry[] = ALL_COGNITIVE_SYSTEMS
    .map((s) => {
      const recent = weights[s];
      const historical = input.history?.ewmaWeights[s];
      return {
        system: s,
        recentWeight: recent,
        historicalWeight: historical === undefined ? recent : round1(historical),
        drift: historical === undefined ? 0 : round1(recent - historical),
      };
    })
    .filter((r) => Math.abs(r.drift) >= 0.5)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .slice(0, 6);

  // 6. Environmental sensitivity.
  const environmentalSensitivity = deriveEnvironmentalSensitivity(input);

  // 7. Contextual authority table.
  const contextualAuthority = buildContextualAuthority(input, weights);

  // 8. Aggregate scalars.
  const cog = input.conflict;
  const agreementPressure = round1(clamp10(
    cog ? cog.alignmentScore : 5 +
    (input.culturalPerception ? input.culturalPerception.humanResonance * 0.2 : 0),
  ));
  const disagreementPressure = round1(clamp10(
    cog ? cog.overallTension : 0 +
    (unstableWeights.length * 0.8),
  ));
  // Cognitive fragmentation rises with disagreement + volatility.
  const cognitiveFragmentation = round1(clamp10(
    disagreementPressure * 0.6 + unstableWeights.length * 0.6 +
    (input.history?.recentFragmentation ? input.history.recentFragmentation * 0.2 : 0),
  ));
  // Adaptation pressure rises when the system has to re-balance.
  const adaptationPressure = round1(clamp10(
    Math.abs(weightDrift.reduce((a, w) => a + Math.abs(w.drift), 0) / Math.max(1, weightDrift.length)) * 1.2 +
    (cog ? cog.activeConflicts.length * 0.5 : 0) +
    (unstableWeights.length * 0.4),
  ));
  // Global stability = inverse of disagreement + fragmentation.
  const globalStability = round1(clamp10(
    10 - (disagreementPressure * 0.5 + cognitiveFragmentation * 0.3 + adaptationPressure * 0.2),
  ));

  // 9. Reason codes — concise audit trail.
  reasonCodes.push(
    `dominant:${dominantSystems.map((d) => d.system).join(',') || 'none'}`,
    `suppressed:${suppressedSystems.map((s) => s.system).join(',') || 'none'}`,
    `unstable:${unstableWeights.map((u) => u.system).join(',') || 'none'}`,
    `globalStability:${globalStability}`,
    `adaptationPressure:${adaptationPressure}`,
    `cognitiveFragmentation:${cognitiveFragmentation}`,
  );
  if (cog) reasonCodes.push(`conflict-tension:${cog.overallTension}`);
  if (input.history) reasonCodes.push(`history-observations:${input.history.observationCount}`);

  return {
    globalStability,
    adaptationPressure,
    cognitiveFragmentation,
    dominantSystems,
    suppressedSystems,
    unstableWeights,
    environmentalSensitivity,
    contextualAuthority,
    weightDrift,
    agreementPressure,
    disagreementPressure,
    weights,
    reasonCodes,
  };
}

// ─── explanation builder ──────────────────────────────────────

function explainDominance(
  system: CognitiveSystem, weight: number, confidence: number, reasons: string[],
): string {
  const top = reasons.slice(0, 2).join(' · ');
  return `${system} weight ${weight.toFixed(1)}/10 · confidence ${confidence.toFixed(1)}/10${
    top ? ` — ${top}` : ''
  }`;
}
