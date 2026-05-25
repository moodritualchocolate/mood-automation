/**
 * STRATEGIC OUTCOME INTELLIGENCE ENGINE
 *
 * Deterministic, read-only. Models which internal structures
 * (governance · identity · cognition · culture) repeatedly correlate
 * with durable strategic resilience — not temporary success.
 *
 * The crucial distinction: a pattern may generate high short-term
 * conversion while eroding trust durability. The engine surfaces
 * this divergence explicitly.
 *
 * STRICTLY:
 *   - no autonomous optimization
 *   - no runtime orchestration mutation
 *   - no automatic generation / critic / verdict mutation
 *   - no external APIs / model calls
 *   - same inputs → same intelligence reading
 *
 * Imports: only data types. No critic/pipeline imports.
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { CrossBrainConflict } from './crossBrainConflictEngine';
import type { CulturalPerception } from './culturalPerceptionEngine';
import type { IdentityContinuity } from './identityContinuityEngine';
import type { ExecutiveGovernance } from './executiveGovernanceEngine';
import type { QualityLongitudinalView } from './qualityLongitudinalView';
import type { PolicyAuditView } from './copyQualityPolicyAuditView';

// ─── taxonomy ──────────────────────────────────────────────────

export type StrategicSignature =
  | 'trust-compounding'
  | 'fatigue-resistant'
  | 'high-retention'
  | 'emotionally-resonant'
  | 'novelty-fragile'
  | 'over-aggressive'
  | 'culture-synchronized'
  | 'identity-consistent'
  | 'high-curiosity'
  | 'audience-stabilizing'
  | 'trust-erosive'
  | 'short-term-conversion-heavy';

export const ALL_STRATEGIC_SIGNATURES: StrategicSignature[] = [
  'trust-compounding', 'fatigue-resistant', 'high-retention',
  'emotionally-resonant', 'novelty-fragile', 'over-aggressive',
  'culture-synchronized', 'identity-consistent', 'high-curiosity',
  'audience-stabilizing', 'trust-erosive', 'short-term-conversion-heavy',
];

// ─── output shape ──────────────────────────────────────────────

export interface DominantSignatureEntry {
  signature: StrategicSignature;
  strength: number;          // 0..10 current-frame
  persistence: number;       // 0..10 historical EWMA
  durability: number;        // 0..10 — strength × persistence × (1 - divergence/10)
  explanation: string;
}

export interface EmergingSignatureEntry {
  signature: StrategicSignature;
  acceleration: number;      // 0..10 (recent - historical)
  explanation: string;
}

export interface CollapsingSignatureEntry {
  signature: StrategicSignature;
  decay: number;             // 0..10 (historical - recent)
  explanation: string;
}

export interface StrategicContradictionEntry {
  signatures: StrategicSignature[];
  severity: number;
  divergence: number;        // |shortTerm - longTerm|
  explanation: string;
}

export interface ResiliencePatternEntry {
  pattern: string;
  recurrence: number;
  averageStabilityWhenActive: number;   // 0..10 — average strategicStability on runs containing this pattern
}

export interface DecayPatternEntry {
  pattern: string;
  recurrence: number;
  averageDecayWhenActive: number;       // 0..10 — average decay signal on runs containing this pattern
}

export interface AudienceSensitivityPatternEntry {
  pattern: string;
  recurrence: number;
  averageAudienceNumbness: number;      // 0..10
}

export interface AlignmentEntry {
  /** A governance fingerprint or identity vector. */
  key: string;
  recurrence: number;
  averageStability: number;
  averageTrustDurability: number;
  alignmentScore: number;               // 0..10 — composite
}

export interface CounterfactualOutcomeComparison {
  signature: StrategicSignature;
  observedShortTerm: number;
  observedLongTerm: number;
  divergence: number;
  interpretation: string;
}

export interface OutcomeDriftEntry {
  signature: StrategicSignature;
  historical: number;
  recent: number;
  drift: number;
}

export interface StrategicPressureMap {
  trustPressure: number;
  fatiguePressure: number;
  noveltyPressure: number;
  conversionPressure: number;
}

export interface StrategicOutcomeIntelligence {
  strategicStability: number;
  trustDurability: number;
  audienceResilience: number;
  noveltyFragility: number;
  longTermConsistency: number;

  dominantStrategicSignatures: DominantSignatureEntry[];
  emergingStrategicSignatures: EmergingSignatureEntry[];
  collapsingStrategicSignatures: CollapsingSignatureEntry[];
  strategicContradictions: StrategicContradictionEntry[];

  highResiliencePatterns: ResiliencePatternEntry[];
  highDecayPatterns: DecayPatternEntry[];
  audienceSensitivityPatterns: AudienceSensitivityPatternEntry[];
  trustCompoundingPatterns: ResiliencePatternEntry[];
  fatigueResistancePatterns: ResiliencePatternEntry[];

  identityOutcomeAlignment: AlignmentEntry[];
  governanceOutcomeAlignment: AlignmentEntry[];

  counterfactualOutcomeComparisons: CounterfactualOutcomeComparison[];

  longTermOutcomeDrift: OutcomeDriftEntry[];

  strategicPressureMap: StrategicPressureMap;

  strategicRisk: number;

  /** Per-signature current-frame strength — exposed so the memory
   *  store persists without recomputation. */
  signatureStrengths: Record<StrategicSignature, number>;

  reasonCodes: string[];
}

// ─── history context for the engine ──────────────────────────

export interface OutcomeHistoryContext {
  /** EWMA strength per signature. */
  ewmaStrengths: Partial<Record<StrategicSignature, number>>;
  /** Variance per signature. */
  variance: Partial<Record<StrategicSignature, number>>;
  /** Dominance counts per signature. */
  dominanceCounts: Partial<Record<StrategicSignature, number>>;
  /** Strategic stability average across all runs where each
   *  signature was strongly active (strength >= 6). */
  stabilityWhenActive: Partial<Record<StrategicSignature, number>>;
  /** Recurring pattern → average strategicStability across runs containing it. */
  resilientPatternStats?: Record<string, { count: number; stabilitySum: number }>;
  /** Recurring pattern → average decay signal across runs containing it. */
  decayPatternStats?: Record<string, { count: number; decaySum: number }>;
  /** Audience-sensitivity patterns. */
  audiencePatternStats?: Record<string, { count: number; numbnessSum: number }>;
  /** Trust-compounding patterns. */
  trustCompoundingStats?: Record<string, { count: number; trustSum: number }>;
  /** Fatigue-resistance patterns. */
  fatigueResistanceStats?: Record<string, { count: number; resistanceSum: number }>;
  /** Identity-vector → outcome alignment. */
  identityAlignmentStats?: Record<string, { count: number; stabilitySum: number; trustSum: number }>;
  /** Governance-fingerprint → outcome alignment. */
  governanceAlignmentStats?: Record<string, { count: number; stabilitySum: number; trustSum: number }>;
  /** Total observations. */
  observationCount: number;
  /** Recent average of strategicStability. */
  recentStrategicStability?: number;
  /** Recent average of trustDurability. */
  recentTrustDurability?: number;
}

// ─── input ─────────────────────────────────────────────────────

export interface StrategicOutcomeInput {
  strategy?: AdStrategyAssessment | null;
  conflict?: CrossBrainConflict | null;
  culturalPerception?: CulturalPerception | null;
  identityContinuity?: IdentityContinuity | null;
  executiveGovernance?: ExecutiveGovernance | null;
  qualityLongitudinal?: QualityLongitudinalView | null;
  policyAuditView?: PolicyAuditView | null;
  /** Reserved for the not-yet-built Counterfactual Cognition channel —
   *  accepts opaque shape so wiring lands when it ships. */
  counterfactual?: unknown;
  history?: OutcomeHistoryContext | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── per-signature current-frame derivation ───────────────────

interface SignatureDerivation {
  strength: number;
  reasons: string[];
}

const DERIVATIONS: Record<StrategicSignature, (i: StrategicOutcomeInput) => SignatureDerivation> = {
  // ── trust-compounding ────────────────────────────────────────
  'trust-compounding': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    const ql = i.qualityLongitudinal;
    if (c && c.trustClimate >= 7) { s += (c.trustClimate - 6) * 0.9; reasons.push(`trustClimate:${round1(c.trustClimate)}`); }
    if (c && c.perceivedAuthenticity >= 7) { s += (c.perceivedAuthenticity - 6) * 0.7; reasons.push(`authenticity:${round1(c.perceivedAuthenticity)}`); }
    if (c && c.humanResonance >= 7) { s += (c.humanResonance - 6) * 0.4; reasons.push(`humanResonance:${round1(c.humanResonance)}`); }
    if (i.strategy && i.strategy.trustDebt <= 3) { s += 1; reasons.push(`low-trustDebt:${round1(i.strategy.trustDebt)}`); }
    if (ql && ql.brandDignityCurrent >= 7) { s += (ql.brandDignityCurrent - 6) * 0.4; reasons.push(`brandDignity:${round1(ql.brandDignityCurrent)}`); }
    return { strength: clamp10(s), reasons };
  },

  // ── fatigue-resistant ────────────────────────────────────────
  'fatigue-resistant': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    if (c) {
      const fatigue = (c.aestheticFatigue + c.audienceNumbness + c.pacingFatigue) / 3;
      if (fatigue <= 4) { s += (5 - fatigue) * 1.2; reasons.push(`low-fatigue:${round1(fatigue)}`); }
      if (c.emotionalFreshness >= 6) { s += (c.emotionalFreshness - 5) * 0.4; reasons.push(`freshness:${round1(c.emotionalFreshness)}`); }
    }
    return { strength: clamp10(s), reasons };
  },

  // ── high-retention ───────────────────────────────────────────
  'high-retention': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    const ql = i.qualityLongitudinal;
    if (c && c.emotionalFreshness >= 6) { s += (c.emotionalFreshness - 5) * 0.6; reasons.push(`freshness:${round1(c.emotionalFreshness)}`); }
    if (c && c.audienceNumbness <= 4) { s += (5 - c.audienceNumbness) * 0.6; reasons.push(`low-numbness:${round1(c.audienceNumbness)}`); }
    if (ql && ql.mirrorSuccessRate >= 0.4) { s += ql.mirrorSuccessRate * 5; reasons.push(`mirror-success:${(ql.mirrorSuccessRate * 100).toFixed(0)}%`); }
    return { strength: clamp10(s), reasons };
  },

  // ── emotionally-resonant ─────────────────────────────────────
  'emotionally-resonant': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    if (c && c.humanResonance >= 7) { s += (c.humanResonance - 5) * 0.8; reasons.push(`resonance:${round1(c.humanResonance)}`); }
    if (c && c.dominantSignals.includes('human-resonant')) { s += 2; reasons.push('signal:human-resonant'); }
    if (i.strategy && (i.strategy.persuasionMode === 'empathic' || i.strategy.persuasionMode === 'narrative')) {
      s += 1; reasons.push(`persuasion:${i.strategy.persuasionMode}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── novelty-fragile ──────────────────────────────────────────
  'novelty-fragile': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    if (c) {
      if (c.noveltyScore >= 7) { s += (c.noveltyScore - 5) * 0.6; reasons.push(`novelty:${round1(c.noveltyScore)}`); }
      if (c.perceivedAuthenticity <= 5) { s += (6 - c.perceivedAuthenticity) * 0.8; reasons.push(`low-authenticity:${round1(c.perceivedAuthenticity)}`); }
      if (c.dominantSignals.includes('novel-but-unsafe')) { s += 2.5; reasons.push('signal:novel-but-unsafe'); }
    }
    return { strength: clamp10(s), reasons };
  },

  // ── over-aggressive ──────────────────────────────────────────
  'over-aggressive': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (i.strategy) {
      if (i.strategy.creativeConstraints.ctaStrength >= 7) {
        s += (i.strategy.creativeConstraints.ctaStrength - 5) * 0.7;
        reasons.push(`cta-strength:${i.strategy.creativeConstraints.ctaStrength}`);
      }
      if (i.strategy.urgencyLevel >= 7) {
        s += (i.strategy.urgencyLevel - 5) * 0.6;
        reasons.push(`urgency:${i.strategy.urgencyLevel}`);
      }
    }
    const c = i.culturalPerception;
    if (c && c.dominantSignals.includes('algorithmically-obvious')) { s += 1.5; reasons.push('signal:algorithmically-obvious'); }
    return { strength: clamp10(s), reasons };
  },

  // ── culture-synchronized ────────────────────────────────────
  'culture-synchronized': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const g = i.executiveGovernance;
    const c = i.culturalPerception;
    if (g && g.dominantGovernanceStructure.primaryExecutive === 'culture') {
      s += 3; reasons.push('governance:culture-executive');
    }
    if (g && g.governanceRoles.some((r) => r.role === 'cultural-adapter')) {
      s += 1.5; reasons.push('role:cultural-adapter-present');
    }
    if (c && (c.emotionalDrift.movingToward.length + c.emotionalDrift.movingAwayFrom.length) >= 2) {
      s += 1; reasons.push('drift-active');
    }
    return { strength: clamp10(s), reasons };
  },

  // ── identity-consistent ─────────────────────────────────────
  'identity-consistent': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const id = i.identityContinuity;
    if (id) {
      if (id.identityStability >= 7) { s += (id.identityStability - 5) * 0.6; reasons.push(`identityStability:${round1(id.identityStability)}`); }
      if (id.behavioralConsistency >= 7) { s += (id.behavioralConsistency - 5) * 0.6; reasons.push(`consistency:${round1(id.behavioralConsistency)}`); }
      if (id.continuityRisk <= 3) { s += (4 - id.continuityRisk) * 0.5; reasons.push(`low-continuity-risk:${round1(id.continuityRisk)}`); }
    }
    return { strength: clamp10(s), reasons };
  },

  // ── high-curiosity ───────────────────────────────────────────
  'high-curiosity': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    if (c && c.noveltyScore >= 6) { s += (c.noveltyScore - 5) * 0.5; reasons.push(`novelty:${round1(c.noveltyScore)}`); }
    if (c && c.emotionalFreshness >= 6) { s += (c.emotionalFreshness - 5) * 0.5; reasons.push(`freshness:${round1(c.emotionalFreshness)}`); }
    if (i.strategy && (i.strategy.persuasionMode === 'observational' || i.strategy.storyShape === 'reveal')) {
      s += 1.5; reasons.push(`persuasion:${i.strategy.persuasionMode}|story:${i.strategy.storyShape}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── audience-stabilizing ────────────────────────────────────
  'audience-stabilizing': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    if (c) {
      if (c.audienceNumbness <= 3) { s += (4 - c.audienceNumbness) * 0.7; reasons.push(`low-numbness:${round1(c.audienceNumbness)}`); }
      if (c.pacingFatigue <= 3) { s += (4 - c.pacingFatigue) * 0.5; reasons.push(`low-pacing-fatigue:${round1(c.pacingFatigue)}`); }
      if (c.conformityRisk <= 4) { s += (5 - c.conformityRisk) * 0.4; reasons.push(`low-conformity:${round1(c.conformityRisk)}`); }
    }
    return { strength: clamp10(s), reasons };
  },

  // ── trust-erosive ───────────────────────────────────────────
  'trust-erosive': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const c = i.culturalPerception;
    const ql = i.qualityLongitudinal;
    if (c && c.trustClimate <= 5) { s += (6 - c.trustClimate) * 0.7; reasons.push(`trustClimate:${round1(c.trustClimate)}`); }
    if (i.strategy && i.strategy.trustDebt >= 5) { s += (i.strategy.trustDebt - 4) * 0.6; reasons.push(`trustDebt:${round1(i.strategy.trustDebt)}`); }
    if (c && c.dominantSignals.includes('trust-fragile')) { s += 2; reasons.push('signal:trust-fragile'); }
    if (ql && ql.dignityErosionCurrent >= 3) { s += (ql.dignityErosionCurrent - 2) * 0.4; reasons.push(`dignity-erosion:${round1(ql.dignityErosionCurrent)}`); }
    return { strength: clamp10(s), reasons };
  },

  // ── short-term-conversion-heavy ─────────────────────────────
  'short-term-conversion-heavy': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (i.strategy) {
      if (i.strategy.creativeConstraints.ctaStrength >= 7) {
        s += (i.strategy.creativeConstraints.ctaStrength - 5) * 0.6;
        reasons.push(`cta-strength:${i.strategy.creativeConstraints.ctaStrength}`);
      }
      if (i.strategy.urgencyLevel >= 6) {
        s += (i.strategy.urgencyLevel - 5) * 0.5;
        reasons.push(`urgency:${i.strategy.urgencyLevel}`);
      }
      if (i.strategy.campaignRole === 'conversion_push') {
        s += 2; reasons.push('role:conversion_push');
      }
    }
    return { strength: clamp10(s), reasons };
  },
};

// ─── persistence from history ─────────────────────────────────

function persistenceOf(
  sig: StrategicSignature, history: OutcomeHistoryContext | null | undefined,
): number {
  if (!history) return 0;
  const ewma = history.ewmaStrengths[sig] ?? 0;
  const count = history.dominanceCounts[sig] ?? 0;
  const total = Math.max(1, history.observationCount);
  return clamp10(ewma * 0.6 + (count / total) * 10 * 0.4);
}

function durabilityOf(strength: number, persistence: number, divergence: number): number {
  return clamp10(strength * 0.4 + persistence * 0.5 + (10 - divergence) * 0.1);
}

// ─── contradictions ──────────────────────────────────────────

const CONTRADICTION_PAIRS: Array<[StrategicSignature, StrategicSignature, string]> = [
  ['trust-compounding', 'trust-erosive', 'trust-compounding contradicting trust-erosive — divergent trust trajectory'],
  ['trust-compounding', 'over-aggressive', 'trust-compounding contradicting over-aggressive — surface conversion eroding base'],
  ['high-retention', 'over-aggressive', 'high-retention contradicting over-aggressive — pressure shrinking retention'],
  ['identity-consistent', 'novelty-fragile', 'identity-consistent contradicting novelty-fragile — drift threatens consistency'],
  ['audience-stabilizing', 'over-aggressive', 'audience-stabilizing contradicting over-aggressive — aggression destabilizes audience'],
  ['fatigue-resistant', 'short-term-conversion-heavy', 'fatigue-resistant contradicting short-term — pressure accumulates fatigue'],
];

function deriveContradictions(
  strengths: Record<StrategicSignature, number>,
  history: OutcomeHistoryContext | null | undefined,
): StrategicContradictionEntry[] {
  const out: StrategicContradictionEntry[] = [];
  for (const [a, b, label] of CONTRADICTION_PAIRS) {
    const sa = strengths[a];
    const sb = strengths[b];
    if (sa >= 5 && sb >= 5) {
      const ewa = history?.ewmaStrengths[a] ?? sa;
      const ewb = history?.ewmaStrengths[b] ?? sb;
      const divergence = round1(Math.abs(sa - ewa) + Math.abs(sb - ewb));
      const severity = clamp10(Math.min(sa, sb) - 3);
      if (severity >= 3) {
        out.push({
          signatures: [a, b],
          severity: round1(severity),
          divergence,
          explanation: `${label} — ${a} ${sa.toFixed(1)}/10 · ${b} ${sb.toFixed(1)}/10`,
        });
      }
    }
  }
  return out.sort((a, b) => b.severity - a.severity).slice(0, 4);
}

// ─── pattern derivations from history ─────────────────────────

function deriveResiliencePatterns(
  history: OutcomeHistoryContext | null | undefined,
): ResiliencePatternEntry[] {
  if (!history?.resilientPatternStats) return [];
  return Object.entries(history.resilientPatternStats)
    .map(([pattern, { count, stabilitySum }]) => ({
      pattern, recurrence: count,
      averageStabilityWhenActive: round1(stabilitySum / Math.max(1, count)),
    }))
    .filter((r) => r.recurrence >= 2 && r.averageStabilityWhenActive >= 6)
    .sort((a, b) => b.averageStabilityWhenActive - a.averageStabilityWhenActive ||
                    b.recurrence - a.recurrence)
    .slice(0, 5);
}

function deriveDecayPatterns(
  history: OutcomeHistoryContext | null | undefined,
): DecayPatternEntry[] {
  if (!history?.decayPatternStats) return [];
  return Object.entries(history.decayPatternStats)
    .map(([pattern, { count, decaySum }]) => ({
      pattern, recurrence: count,
      averageDecayWhenActive: round1(decaySum / Math.max(1, count)),
    }))
    .filter((r) => r.recurrence >= 2 && r.averageDecayWhenActive >= 5)
    .sort((a, b) => b.averageDecayWhenActive - a.averageDecayWhenActive)
    .slice(0, 5);
}

function deriveAudienceSensitivityPatterns(
  history: OutcomeHistoryContext | null | undefined,
): AudienceSensitivityPatternEntry[] {
  if (!history?.audiencePatternStats) return [];
  return Object.entries(history.audiencePatternStats)
    .map(([pattern, { count, numbnessSum }]) => ({
      pattern, recurrence: count,
      averageAudienceNumbness: round1(numbnessSum / Math.max(1, count)),
    }))
    .filter((r) => r.recurrence >= 2)
    .sort((a, b) => b.averageAudienceNumbness - a.averageAudienceNumbness)
    .slice(0, 5);
}

function deriveTrustCompoundingPatterns(
  history: OutcomeHistoryContext | null | undefined,
): ResiliencePatternEntry[] {
  if (!history?.trustCompoundingStats) return [];
  return Object.entries(history.trustCompoundingStats)
    .map(([pattern, { count, trustSum }]) => ({
      pattern, recurrence: count,
      averageStabilityWhenActive: round1(trustSum / Math.max(1, count)),
    }))
    .filter((r) => r.recurrence >= 2 && r.averageStabilityWhenActive >= 6)
    .sort((a, b) => b.averageStabilityWhenActive - a.averageStabilityWhenActive)
    .slice(0, 5);
}

function deriveFatigueResistancePatterns(
  history: OutcomeHistoryContext | null | undefined,
): ResiliencePatternEntry[] {
  if (!history?.fatigueResistanceStats) return [];
  return Object.entries(history.fatigueResistanceStats)
    .map(([pattern, { count, resistanceSum }]) => ({
      pattern, recurrence: count,
      averageStabilityWhenActive: round1(resistanceSum / Math.max(1, count)),
    }))
    .filter((r) => r.recurrence >= 2 && r.averageStabilityWhenActive >= 6)
    .sort((a, b) => b.averageStabilityWhenActive - a.averageStabilityWhenActive)
    .slice(0, 5);
}

function deriveIdentityOutcomeAlignment(
  history: OutcomeHistoryContext | null | undefined,
): AlignmentEntry[] {
  if (!history?.identityAlignmentStats) return [];
  return Object.entries(history.identityAlignmentStats)
    .map(([key, { count, stabilitySum, trustSum }]) => ({
      key, recurrence: count,
      averageStability: round1(stabilitySum / Math.max(1, count)),
      averageTrustDurability: round1(trustSum / Math.max(1, count)),
      alignmentScore: round1((stabilitySum / Math.max(1, count)) * 0.5 + (trustSum / Math.max(1, count)) * 0.5),
    }))
    .filter((r) => r.recurrence >= 2)
    .sort((a, b) => b.alignmentScore - a.alignmentScore)
    .slice(0, 5);
}

function deriveGovernanceOutcomeAlignment(
  history: OutcomeHistoryContext | null | undefined,
): AlignmentEntry[] {
  if (!history?.governanceAlignmentStats) return [];
  return Object.entries(history.governanceAlignmentStats)
    .map(([key, { count, stabilitySum, trustSum }]) => ({
      key, recurrence: count,
      averageStability: round1(stabilitySum / Math.max(1, count)),
      averageTrustDurability: round1(trustSum / Math.max(1, count)),
      alignmentScore: round1((stabilitySum / Math.max(1, count)) * 0.5 + (trustSum / Math.max(1, count)) * 0.5),
    }))
    .filter((r) => r.recurrence >= 2)
    .sort((a, b) => b.alignmentScore - a.alignmentScore)
    .slice(0, 5);
}

// ─── counterfactual outcome comparisons ───────────────────────

/** For each signature, compare current strength (short-term) vs
 *  historical EWMA (long-term). High divergence → temporary signal
 *  not yet reflected in durable trajectory. */
function deriveCounterfactualComparisons(
  strengths: Record<StrategicSignature, number>,
  history: OutcomeHistoryContext | null | undefined,
): CounterfactualOutcomeComparison[] {
  if (!history) return [];
  const out: CounterfactualOutcomeComparison[] = [];
  for (const sig of ALL_STRATEGIC_SIGNATURES) {
    const shortTerm = strengths[sig];
    const longTerm = history.ewmaStrengths[sig] ?? 0;
    const divergence = Math.abs(shortTerm - longTerm);
    if (divergence < 2) continue;
    let interpretation = '';
    if (shortTerm > longTerm) {
      interpretation = shortTerm >= 7
        ? `surface-level surge — short-term ${shortTerm.toFixed(1)}/10 vs long-term ${longTerm.toFixed(1)}/10 (temporary success not yet durable)`
        : `mild near-term lift — short-term ${shortTerm.toFixed(1)} vs ewma ${longTerm.toFixed(1)}`;
    } else {
      interpretation = longTerm >= 6
        ? `historical pattern fading — long-term ${longTerm.toFixed(1)} vs short-term ${shortTerm.toFixed(1)} (durable signature decaying)`
        : `mild near-term dip — long-term ${longTerm.toFixed(1)} vs short-term ${shortTerm.toFixed(1)}`;
    }
    out.push({
      signature: sig,
      observedShortTerm: round1(shortTerm),
      observedLongTerm: round1(longTerm),
      divergence: round1(divergence),
      interpretation,
    });
  }
  return out.sort((a, b) => b.divergence - a.divergence).slice(0, 5);
}

// ─── pressure map ────────────────────────────────────────────

function derivePressureMap(i: StrategicOutcomeInput): StrategicPressureMap {
  const c = i.culturalPerception;
  const strat = i.strategy;
  return {
    trustPressure: round1(clamp10(c ? (10 - c.trustClimate) * 1.1 : 0)),
    fatiguePressure: round1(clamp10(c ? (c.aestheticFatigue + c.audienceNumbness + c.pacingFatigue) / 3 * 1.1 : 0)),
    noveltyPressure: round1(clamp10(c ? Math.abs(c.noveltyScore - 5) * 1.2 : 0)),
    conversionPressure: round1(clamp10(
      (strat?.urgencyLevel ?? 0) * 0.5 +
      (strat?.creativeConstraints.ctaStrength ?? 0) * 0.5,
    )),
  };
}

// ─── main ──────────────────────────────────────────────────────

export function computeStrategicOutcomeIntelligence(
  input: StrategicOutcomeInput,
): StrategicOutcomeIntelligence {
  const reasonCodes: string[] = [];

  // 1. Derive per-signature current strength.
  const signatureStrengths = {} as Record<StrategicSignature, number>;
  const signatureReasons = {} as Record<StrategicSignature, string[]>;
  for (const sig of ALL_STRATEGIC_SIGNATURES) {
    const d = DERIVATIONS[sig](input);
    signatureStrengths[sig] = round1(d.strength);
    signatureReasons[sig] = d.reasons;
  }

  // 2. Build dominant / emerging / collapsing signature tables.
  const ranked = ALL_STRATEGIC_SIGNATURES.map((sig) => {
    const strength = signatureStrengths[sig];
    const persistence = round1(persistenceOf(sig, input.history));
    const ewma = input.history?.ewmaStrengths[sig] ?? 0;
    const divergence = Math.abs(strength - ewma);
    const durability = round1(durabilityOf(strength, persistence, divergence));
    return { sig, strength, persistence, durability, divergence };
  });

  const dominantStrategicSignatures: DominantSignatureEntry[] = ranked
    .filter((r) => r.strength >= 5 || r.persistence >= 5)
    .sort((a, b) =>
      b.durability !== a.durability
        ? b.durability - a.durability
        : a.sig.localeCompare(b.sig),
    )
    .slice(0, 5)
    .map((r) => ({
      signature: r.sig,
      strength: r.strength,
      persistence: r.persistence,
      durability: r.durability,
      explanation: `${r.sig} strength ${r.strength.toFixed(1)}/10 · persistence ${r.persistence.toFixed(1)}/10 · durability ${r.durability.toFixed(1)}/10` +
        (signatureReasons[r.sig].length > 0 ? ` — ${signatureReasons[r.sig].slice(0, 2).join(' · ')}` : ''),
    }));

  const emergingStrategicSignatures: EmergingSignatureEntry[] = [];
  const collapsingStrategicSignatures: CollapsingSignatureEntry[] = [];
  for (const sig of ALL_STRATEGIC_SIGNATURES) {
    const recent = signatureStrengths[sig];
    const ewma = input.history?.ewmaStrengths[sig];
    if (ewma === undefined) continue;
    const delta = recent - ewma;
    if (delta >= 1.5) {
      emergingStrategicSignatures.push({
        signature: sig,
        acceleration: round1(clamp10(delta)),
        explanation: `acceleration: ewma ${ewma.toFixed(1)} → recent ${recent.toFixed(1)} (+${delta.toFixed(1)})`,
      });
    } else if (delta <= -1.5) {
      collapsingStrategicSignatures.push({
        signature: sig,
        decay: round1(clamp10(-delta)),
        explanation: `decay: ewma ${ewma.toFixed(1)} → recent ${recent.toFixed(1)} (${delta.toFixed(1)})`,
      });
    }
  }
  emergingStrategicSignatures.sort((a, b) => b.acceleration - a.acceleration);
  collapsingStrategicSignatures.sort((a, b) => b.decay - a.decay);

  // 3. Contradictions surface temporary-vs-durable splits.
  const strategicContradictions = deriveContradictions(signatureStrengths, input.history);

  // 4. Pattern-based readings from memory.
  const highResiliencePatterns = deriveResiliencePatterns(input.history);
  const highDecayPatterns = deriveDecayPatterns(input.history);
  const audienceSensitivityPatterns = deriveAudienceSensitivityPatterns(input.history);
  const trustCompoundingPatterns = deriveTrustCompoundingPatterns(input.history);
  const fatigueResistancePatterns = deriveFatigueResistancePatterns(input.history);

  // 5. Alignment tables.
  const identityOutcomeAlignment = deriveIdentityOutcomeAlignment(input.history);
  const governanceOutcomeAlignment = deriveGovernanceOutcomeAlignment(input.history);

  // 6. Counterfactual comparisons (short vs long).
  const counterfactualOutcomeComparisons = deriveCounterfactualComparisons(
    signatureStrengths, input.history,
  );

  // 7. Long-term drift table.
  const longTermOutcomeDrift: OutcomeDriftEntry[] = ALL_STRATEGIC_SIGNATURES
    .map((sig) => {
      const recent = signatureStrengths[sig];
      const historical = input.history?.ewmaStrengths[sig];
      return {
        signature: sig,
        recent,
        historical: historical === undefined ? recent : round1(historical),
        drift: historical === undefined ? 0 : round1(recent - historical),
      };
    })
    .filter((r) => Math.abs(r.drift) >= 0.5)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .slice(0, 6);

  // 8. Pressure map.
  const strategicPressureMap = derivePressureMap(input);

  // 9. Aggregate scalars.
  const trustCompound = signatureStrengths['trust-compounding'];
  const trustErosive = signatureStrengths['trust-erosive'];
  const trustDurability = round1(clamp10(
    trustCompound * 0.5 +
    (10 - trustErosive) * 0.3 +
    (input.history?.recentTrustDurability ?? 5) * 0.2,
  ));

  const audienceResilience = round1(clamp10(
    signatureStrengths['audience-stabilizing'] * 0.4 +
    signatureStrengths['fatigue-resistant'] * 0.3 +
    signatureStrengths['high-retention'] * 0.3,
  ));

  const noveltyFragility = round1(signatureStrengths['novelty-fragile']);

  const identityConsistent = signatureStrengths['identity-consistent'];
  const longTermConsistency = round1(clamp10(
    identityConsistent * 0.5 +
    (input.identityContinuity?.behavioralConsistency ?? 5) * 0.3 +
    (input.executiveGovernance?.governanceStability ?? 5) * 0.2,
  ));

  const strategicStability = round1(clamp10(
    trustDurability * 0.3 +
    audienceResilience * 0.25 +
    longTermConsistency * 0.25 +
    (10 - noveltyFragility) * 0.1 +
    (10 - signatureStrengths['over-aggressive']) * 0.1,
  ));

  // Strategic risk = inverse of stability + active contradictions +
  // fragmentation/conversion pressure + erosive signatures. Aggressive
  // + short-term-conversion-heavy contribute directly so a run with
  // strong short-term wins but weak durability registers as risky
  // even before contradictions accumulate in history.
  const strategicRisk = round1(clamp10(
    (10 - strategicStability) * 0.4 +
    strategicContradictions.length * 1.0 +
    strategicPressureMap.fatiguePressure * 0.2 +
    signatureStrengths['trust-erosive'] * 0.3 +
    signatureStrengths['over-aggressive'] * 0.2 +
    signatureStrengths['short-term-conversion-heavy'] * 0.15,
  ));

  // 10. Reason codes.
  reasonCodes.push(
    `dominant:${dominantStrategicSignatures.map((d) => d.signature).join(',') || 'none'}`,
    `emerging:${emergingStrategicSignatures.map((e) => e.signature).join(',') || 'none'}`,
    `collapsing:${collapsingStrategicSignatures.map((c) => c.signature).join(',') || 'none'}`,
    `strategicStability:${strategicStability}`,
    `trustDurability:${trustDurability}`,
    `audienceResilience:${audienceResilience}`,
    `noveltyFragility:${noveltyFragility}`,
    `longTermConsistency:${longTermConsistency}`,
    `strategicRisk:${strategicRisk}`,
  );
  if (input.history) reasonCodes.push(`history-observations:${input.history.observationCount}`);
  if (input.counterfactual !== undefined) reasonCodes.push('counterfactual-channel:provided');

  return {
    strategicStability,
    trustDurability,
    audienceResilience,
    noveltyFragility,
    longTermConsistency,
    dominantStrategicSignatures,
    emergingStrategicSignatures,
    collapsingStrategicSignatures,
    strategicContradictions,
    highResiliencePatterns,
    highDecayPatterns,
    audienceSensitivityPatterns,
    trustCompoundingPatterns,
    fatigueResistancePatterns,
    identityOutcomeAlignment,
    governanceOutcomeAlignment,
    counterfactualOutcomeComparisons,
    longTermOutcomeDrift,
    strategicPressureMap,
    strategicRisk,
    signatureStrengths,
    reasonCodes,
  };
}
