/**
 * PERSISTENT IDENTITY CONTINUITY ENGINE
 *
 * Deterministic, read-only. Tracks WHICH behavioral identities
 * persist across time — not personality, but the stable behavioral
 * signatures that recur run after run.
 *
 * The system's first attempt at distinguishing temporary behavior
 * from persistent behavioral identity.
 *
 * STRICTLY:
 *   - no automatic self-modification / goal mutation
 *   - no autonomous value replacement / prompt rewriting
 *   - no critic / verdict / brutality mutation
 *   - no external APIs / model calls
 *   - same inputs → same identity reading
 *
 * Imports: only data types. No critic/pipeline imports.
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { CopyQualityAxis } from './copyQualityAdapter';
import type { CulturalPerception } from './culturalPerceptionEngine';
import type { CrossBrainConflict } from './crossBrainConflictEngine';
import type {
  CognitiveWeightEvolution, CognitiveSystem,
} from './cognitiveWeightEvolution';
import type { PolicyAuditView } from './copyQualityPolicyAuditView';
import type { QualityLongitudinalView } from './qualityLongitudinalView';

// ─── taxonomy ──────────────────────────────────────────────────

export type IdentityVector =
  | 'restraint-first'
  | 'aggressive-conversion'
  | 'trust-preserving'
  | 'novelty-seeking'
  | 'culture-sensitive'
  | 'emotionally-reflective'
  | 'proof-oriented'
  | 'fatigue-aware'
  | 'high-variation'
  | 'stability-preferring'
  | 'identity-fragmented'
  | 'audience-mirroring';

export const ALL_IDENTITY_VECTORS: IdentityVector[] = [
  'restraint-first', 'aggressive-conversion', 'trust-preserving',
  'novelty-seeking', 'culture-sensitive', 'emotionally-reflective',
  'proof-oriented', 'fatigue-aware', 'high-variation',
  'stability-preferring', 'identity-fragmented', 'audience-mirroring',
];

// ─── output shape ──────────────────────────────────────────────

export interface DominantIdentityEntry {
  vector: IdentityVector;
  strength: number;        // 0..10 — current-frame intensity
  persistence: number;     // 0..10 — historical recurrence
  explanation: string;
}

export interface EmergingIdentityEntry {
  vector: IdentityVector;
  acceleration: number;    // 0..10 — recent strength minus historical
  explanation: string;
}

export interface CollapsingIdentityEntry {
  vector: IdentityVector;
  decay: number;           // 0..10 — historical minus recent
  explanation: string;
}

export interface IdentityContradictionEntry {
  vectors: IdentityVector[];
  severity: number;        // 0..10
  explanation: string;
}

export interface PersistentBehavioralPattern {
  pattern: string;
  recurrence: number;
  confidence: number;
}

export interface ContextualIdentityModeEntry {
  condition: string;
  activeIdentity: IdentityVector;
  explanation: string;
}

export interface IdentityDriftEntry {
  vector: IdentityVector;
  historical: number;
  recent: number;
  drift: number;
}

export interface IdentityPressure {
  noveltyPressure: number;
  trustPressure: number;
  fatiguePressure: number;
  adaptationPressure: number;
}

export interface IdentityContinuity {
  identityStability: number;
  identityFragmentation: number;
  behavioralConsistency: number;
  adaptationVelocity: number;

  dominantIdentityVectors: DominantIdentityEntry[];
  emergingIdentityVectors: EmergingIdentityEntry[];
  collapsingIdentityVectors: CollapsingIdentityEntry[];
  identityContradictions: IdentityContradictionEntry[];
  persistentBehavioralPatterns: PersistentBehavioralPattern[];
  contextualIdentityModes: ContextualIdentityModeEntry[];
  longTermDrift: IdentityDriftEntry[];

  identityPressure: IdentityPressure;

  continuityRisk: number;

  /** Full per-vector strength for this frame — exposed so the memory
   *  store can persist without re-deriving. 0..10 deterministic. */
  vectorStrengths: Record<IdentityVector, number>;

  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

/** Minimal historical context the engine needs. Pass `null` when no
 *  memory exists yet. */
export interface IdentityHistoryContext {
  /** EWMA per vector — computed by the memory store. */
  ewmaStrengths: Partial<Record<IdentityVector, number>>;
  /** Variance per vector across the recent window. */
  variance: Partial<Record<IdentityVector, number>>;
  /** How many times each vector landed in dominantIdentityVectors. */
  dominanceCounts: Partial<Record<IdentityVector, number>>;
  /** Total observations the memory contains. */
  observationCount: number;
  /** Recent fragmentation trace average (0..10). */
  recentFragmentation?: number;
  /** Recent stability trace average (0..10). */
  recentStability?: number;
  /** Recurring behavioral pattern counts (compact strings). */
  patternCounts?: Record<string, number>;
}

export interface IdentityContinuityInput {
  cognitiveWeight?: CognitiveWeightEvolution | null;
  conflict?: CrossBrainConflict | null;
  /** Reserved for the not-yet-built Counterfactual Cognition layer —
   *  accept any opaque shape so wiring lands cleanly when it ships. */
  counterfactual?: unknown;
  culturalPerception?: CulturalPerception | null;
  strategy?: AdStrategyAssessment | null;
  copyQuality?: CopyQualityAxis | null;
  qualityLongitudinal?: QualityLongitudinalView | null;
  policyAuditView?: PolicyAuditView | null;
  /** Direction restraint from the just-shipped banner — keeps the
   *  identity reading anchored to a concrete frame when present. */
  directionRestraint?: number | null;
  /** Optional history. */
  history?: IdentityHistoryContext | null;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function weightOf(cw: CognitiveWeightEvolution | null | undefined, s: CognitiveSystem): number {
  return cw ? (cw.weights[s] ?? 5) : 5;
}
function isWeightDominant(cw: CognitiveWeightEvolution | null | undefined, s: CognitiveSystem): boolean {
  return cw ? cw.dominantSystems.some((d) => d.system === s) : false;
}

// ─── per-vector derivation ─────────────────────────────────────

interface VectorDerivation {
  strength: number;
  reasons: string[];
}

const DERIVATIONS: Record<IdentityVector, (i: IdentityContinuityInput) => VectorDerivation> = {
  // ── restraint-first ──────────────────────────────────────────
  'restraint-first': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const wRestraint = weightOf(i.cognitiveWeight, 'restraint');
    if (wRestraint >= 6) { s += wRestraint * 0.5; reasons.push(`weight.restraint:${round1(wRestraint)}`); }
    if (isWeightDominant(i.cognitiveWeight, 'restraint')) { s += 2; reasons.push('restraint-dominant'); }
    const ctaR = i.copyQuality?.ctaRestraint;
    if (typeof ctaR === 'number' && ctaR >= 7) { s += (ctaR - 6) * 0.5; reasons.push(`cta-restraint:${round1(ctaR)}`); }
    if (typeof i.directionRestraint === 'number' && i.directionRestraint >= 0.7) {
      s += (i.directionRestraint - 0.6) * 6;
      reasons.push(`direction-restraint:${round2(i.directionRestraint)}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── aggressive-conversion ────────────────────────────────────
  'aggressive-conversion': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const strat = i.strategy;
    if (strat) {
      if (strat.creativeConstraints.ctaStrength >= 7) {
        s += (strat.creativeConstraints.ctaStrength - 5) * 0.7;
        reasons.push(`cta-strength:${strat.creativeConstraints.ctaStrength}`);
      }
      if (strat.urgencyLevel >= 6) {
        s += (strat.urgencyLevel - 5) * 0.6;
        reasons.push(`urgency:${strat.urgencyLevel}`);
      }
      if (strat.persuasionMode === 'confrontational' || strat.persuasionMode === 'demonstrative') {
        s += 1.5;
        reasons.push(`persuasion:${strat.persuasionMode}`);
      }
    }
    const ctaR = i.copyQuality?.ctaRestraint;
    if (typeof ctaR === 'number' && ctaR <= 4) {
      s += (5 - ctaR) * 0.6;
      reasons.push(`low-cta-restraint:${round1(ctaR)}`);
    }
    if (typeof i.directionRestraint === 'number' && i.directionRestraint <= 0.35) {
      s += (0.4 - i.directionRestraint) * 8;
      reasons.push(`low-direction-restraint:${round2(i.directionRestraint)}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── trust-preserving ─────────────────────────────────────────
  'trust-preserving': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (isWeightDominant(i.cognitiveWeight, 'trust')) { s += 3; reasons.push('trust-dominant'); }
    const wTrust = weightOf(i.cognitiveWeight, 'trust');
    s += Math.max(0, wTrust - 5) * 0.4;
    if (wTrust >= 6) reasons.push(`weight.trust:${round1(wTrust)}`);
    if (i.strategy && i.strategy.trustDebt <= 3) { s += 1; reasons.push(`low-trustDebt:${round1(i.strategy.trustDebt)}`); }
    if (i.copyQuality && i.copyQuality.trustSafety >= 7) {
      s += (i.copyQuality.trustSafety - 6) * 0.4;
      reasons.push(`trustSafety:${round1(i.copyQuality.trustSafety)}`);
    }
    if (i.copyQuality && i.copyQuality.dignitySafety >= 7) {
      s += (i.copyQuality.dignitySafety - 6) * 0.3;
      reasons.push(`dignitySafety:${round1(i.copyQuality.dignitySafety)}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── novelty-seeking ──────────────────────────────────────────
  'novelty-seeking': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (isWeightDominant(i.cognitiveWeight, 'novelty')) { s += 2.5; reasons.push('novelty-dominant'); }
    const wNov = weightOf(i.cognitiveWeight, 'novelty');
    if (wNov >= 6) { s += (wNov - 5) * 0.5; reasons.push(`weight.novelty:${round1(wNov)}`); }
    const c = i.culturalPerception;
    if (c && c.noveltyScore >= 7) { s += (c.noveltyScore - 6) * 0.6; reasons.push(`culture.novelty:${round1(c.noveltyScore)}`); }
    if (c && c.dominantSignals.includes('emotionally-fresh')) { s += 1; reasons.push('signal:emotionally-fresh'); }
    return { strength: clamp10(s), reasons };
  },

  // ── culture-sensitive ────────────────────────────────────────
  'culture-sensitive': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (isWeightDominant(i.cognitiveWeight, 'culture')) { s += 2.5; reasons.push('culture-dominant'); }
    const wCul = weightOf(i.cognitiveWeight, 'culture');
    if (wCul >= 6) { s += (wCul - 5) * 0.5; reasons.push(`weight.culture:${round1(wCul)}`); }
    if (i.cognitiveWeight) {
      const sens = i.cognitiveWeight.environmentalSensitivity.culturalSensitivity;
      if (sens >= 6) { s += (sens - 5) * 0.5; reasons.push(`cultural-sensitivity:${round1(sens)}`); }
    }
    return { strength: clamp10(s), reasons };
  },

  // ── emotionally-reflective ───────────────────────────────────
  'emotionally-reflective': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (isWeightDominant(i.cognitiveWeight, 'emotion')) { s += 2.5; reasons.push('emotion-dominant'); }
    const wEmo = weightOf(i.cognitiveWeight, 'emotion');
    if (wEmo >= 6) { s += (wEmo - 5) * 0.5; reasons.push(`weight.emotion:${round1(wEmo)}`); }
    const strat = i.strategy;
    if (strat && (strat.persuasionMode === 'empathic' || strat.persuasionMode === 'narrative')) {
      s += 1.5; reasons.push(`persuasion:${strat.persuasionMode}`);
    }
    const c = i.culturalPerception;
    if (c && c.emotionalFreshness >= 6) {
      s += (c.emotionalFreshness - 5) * 0.4;
      reasons.push(`emotional-freshness:${round1(c.emotionalFreshness)}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── proof-oriented ───────────────────────────────────────────
  'proof-oriented': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (isWeightDominant(i.cognitiveWeight, 'proof')) { s += 2; reasons.push('proof-dominant'); }
    const strat = i.strategy;
    if (strat && strat.proofNeed === 'high') { s += 3; reasons.push('proofNeed:high'); }
    else if (strat && strat.proofNeed === 'medium') { s += 1; reasons.push('proofNeed:medium'); }
    const proof = i.copyQuality?.proofAdequacy;
    if (typeof proof === 'number' && proof >= 7) { s += (proof - 6) * 0.4; reasons.push(`proofAdequacy:${round1(proof)}`); }
    return { strength: clamp10(s), reasons };
  },

  // ── fatigue-aware ────────────────────────────────────────────
  'fatigue-aware': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (isWeightDominant(i.cognitiveWeight, 'fatigue')) { s += 2.5; reasons.push('fatigue-dominant'); }
    const c = i.culturalPerception;
    if (c) {
      const fatigue = (c.aestheticFatigue + c.audienceNumbness + c.pacingFatigue) / 3;
      if (fatigue >= 5) { s += (fatigue - 4) * 0.7; reasons.push(`composite-fatigue:${round1(fatigue)}`); }
    }
    if (i.cognitiveWeight) {
      const sens = i.cognitiveWeight.environmentalSensitivity.fatigueSensitivity;
      if (sens >= 6) { s += (sens - 5) * 0.4; reasons.push(`fatigue-sensitivity:${round1(sens)}`); }
    }
    return { strength: clamp10(s), reasons };
  },

  // ── high-variation ───────────────────────────────────────────
  'high-variation': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (i.cognitiveWeight) {
      const drift = i.cognitiveWeight.weightDrift.length;
      if (drift >= 3) { s += drift * 0.6; reasons.push(`weight-drift:${drift}`); }
      if (i.cognitiveWeight.adaptationPressure >= 6) {
        s += (i.cognitiveWeight.adaptationPressure - 5) * 0.6;
        reasons.push(`adaptation-pressure:${round1(i.cognitiveWeight.adaptationPressure)}`);
      }
      if (i.cognitiveWeight.unstableWeights.length >= 2) {
        s += i.cognitiveWeight.unstableWeights.length * 0.6;
        reasons.push(`unstable-weights:${i.cognitiveWeight.unstableWeights.length}`);
      }
    }
    return { strength: clamp10(s), reasons };
  },

  // ── stability-preferring ─────────────────────────────────────
  'stability-preferring': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (i.cognitiveWeight && i.cognitiveWeight.globalStability >= 7) {
      s += (i.cognitiveWeight.globalStability - 5) * 0.8;
      reasons.push(`globalStability:${round1(i.cognitiveWeight.globalStability)}`);
    }
    if (i.cognitiveWeight && i.cognitiveWeight.cognitiveFragmentation <= 3) {
      s += (4 - i.cognitiveWeight.cognitiveFragmentation) * 0.6;
      reasons.push(`low-fragmentation:${round1(i.cognitiveWeight.cognitiveFragmentation)}`);
    }
    if (i.conflict && i.conflict.alignmentScore >= 7) {
      s += (i.conflict.alignmentScore - 6) * 0.5;
      reasons.push(`alignment:${round1(i.conflict.alignmentScore)}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── identity-fragmented ──────────────────────────────────────
  'identity-fragmented': (i) => {
    const reasons: string[] = [];
    let s = 0;
    if (i.cognitiveWeight) {
      if (i.cognitiveWeight.cognitiveFragmentation >= 6) {
        s += (i.cognitiveWeight.cognitiveFragmentation - 5) * 0.8;
        reasons.push(`fragmentation:${round1(i.cognitiveWeight.cognitiveFragmentation)}`);
      }
      if (i.cognitiveWeight.adaptationPressure >= 7) {
        s += (i.cognitiveWeight.adaptationPressure - 6) * 0.5;
        reasons.push(`adaptation:${round1(i.cognitiveWeight.adaptationPressure)}`);
      }
      if (i.cognitiveWeight.unstableWeights.length >= 3) {
        s += i.cognitiveWeight.unstableWeights.length * 0.4;
        reasons.push(`unstable-weights:${i.cognitiveWeight.unstableWeights.length}`);
      }
    }
    if (i.conflict && i.conflict.overallTension >= 7) {
      s += (i.conflict.overallTension - 6) * 0.4;
      reasons.push(`tension:${round1(i.conflict.overallTension)}`);
    }
    return { strength: clamp10(s), reasons };
  },

  // ── audience-mirroring ───────────────────────────────────────
  'audience-mirroring': (i) => {
    const reasons: string[] = [];
    let s = 0;
    const strat = i.strategy;
    if (strat && (strat.persuasionMode === 'empathic' || strat.persuasionMode === 'observational' ||
                  strat.storyShape === 'mirror' || strat.storyShape === 'witness')) {
      s += 2;
      reasons.push(`persuasion-shape:${strat.persuasionMode}|${strat.storyShape}`);
    }
    const c = i.culturalPerception;
    if (c && c.dominantSignals.includes('human-resonant')) {
      s += 2;
      reasons.push('signal:human-resonant');
    }
    if (c && c.perceivedAuthenticity >= 7) {
      s += (c.perceivedAuthenticity - 6) * 0.5;
      reasons.push(`authenticity:${round1(c.perceivedAuthenticity)}`);
    }
    if (c && c.humanResonance >= 7) {
      s += (c.humanResonance - 6) * 0.4;
      reasons.push(`resonance:${round1(c.humanResonance)}`);
    }
    return { strength: clamp10(s), reasons };
  },
};

// ─── identity contradictions ───────────────────────────────────

const CONTRADICTION_PAIRS: Array<[IdentityVector, IdentityVector, string]> = [
  ['restraint-first', 'aggressive-conversion', 'restraint and aggressive-conversion pulling against each other'],
  ['trust-preserving', 'aggressive-conversion', 'trust-preservation contradicting conversion intensity'],
  ['novelty-seeking', 'stability-preferring', 'novelty exploration contradicting stability preference'],
  ['identity-fragmented', 'stability-preferring', 'fragmentation contradicting stability preference'],
  ['high-variation', 'stability-preferring', 'high variation contradicting stability preference'],
  ['proof-oriented', 'novelty-seeking', 'proof orientation slowing novelty experimentation'],
];

function deriveContradictions(
  strengths: Record<IdentityVector, number>,
): IdentityContradictionEntry[] {
  const out: IdentityContradictionEntry[] = [];
  for (const [a, b, label] of CONTRADICTION_PAIRS) {
    const sa = strengths[a];
    const sb = strengths[b];
    if (sa >= 5 && sb >= 5) {
      const severity = clamp10((Math.min(sa, sb) - 4) * 1.6);
      if (severity >= 4) {
        out.push({
          vectors: [a, b],
          severity: round1(severity),
          explanation: `${label} — ${a} ${sa.toFixed(1)}/10 · ${b} ${sb.toFixed(1)}/10`,
        });
      }
    }
  }
  return out.sort((a, b) => b.severity - a.severity).slice(0, 4);
}

// ─── contextual identity modes ────────────────────────────────

function deriveContextualModes(
  i: IdentityContinuityInput,
  strengths: Record<IdentityVector, number>,
): ContextualIdentityModeEntry[] {
  const out: ContextualIdentityModeEntry[] = [];
  const c = i.culturalPerception;
  const cw = i.cognitiveWeight;

  if (c && c.audienceNumbness >= 6 && strengths['fatigue-aware'] >= 5) {
    out.push({
      condition: `audience fatigue active (numbness ${round1(c.audienceNumbness)}/10)`,
      activeIdentity: 'fatigue-aware',
      explanation: 'fatigue-aware identity surfaces when audience numbs',
    });
  }
  if (c && c.trustClimate <= 4 && strengths['trust-preserving'] >= 5) {
    out.push({
      condition: `trust climate fragile (${round1(c.trustClimate)}/10)`,
      activeIdentity: 'trust-preserving',
      explanation: 'trust-preserving identity engages when belief erodes',
    });
  }
  if (cw && cw.cognitiveFragmentation >= 6 && strengths['identity-fragmented'] >= 5) {
    out.push({
      condition: `cognitive fragmentation high (${round1(cw.cognitiveFragmentation)}/10)`,
      activeIdentity: 'identity-fragmented',
      explanation: 'fragmentation visible when brains contradict each other',
    });
  }
  if (c && (c.dominantSignals.includes('aesthetic-burnout') || c.dominantSignals.includes('over-performed')) &&
      strengths['restraint-first'] >= 5) {
    out.push({
      condition: 'over-performance / aesthetic burnout signals active',
      activeIdentity: 'restraint-first',
      explanation: 'restraint-first identity surfaces when attention-pushing patterns saturate',
    });
  }
  if (i.strategy && i.strategy.proofNeed === 'high' && strengths['proof-oriented'] >= 5) {
    out.push({
      condition: 'strategy demands proof',
      activeIdentity: 'proof-oriented',
      explanation: 'proof-oriented identity engages when credibility is required',
    });
  }
  if (c && c.dominantSignals.includes('human-resonant') && strengths['audience-mirroring'] >= 5) {
    out.push({
      condition: 'human-resonant signal active',
      activeIdentity: 'audience-mirroring',
      explanation: 'audience-mirroring identity engages when resonance is landing',
    });
  }
  return out.slice(0, 6);
}

// ─── persistent behavioral patterns ───────────────────────────

function derivePatterns(
  history: IdentityHistoryContext | null | undefined,
): PersistentBehavioralPattern[] {
  if (!history || !history.patternCounts) return [];
  return Object.entries(history.patternCounts)
    .map(([pattern, recurrence]) => ({
      pattern,
      recurrence,
      confidence: round1(Math.min(10, recurrence * 1.5)),
    }))
    .filter((r) => r.recurrence >= 3)
    .sort((a, b) => b.recurrence - a.recurrence)
    .slice(0, 6);
}

// ─── identity pressure ────────────────────────────────────────

function deriveIdentityPressure(i: IdentityContinuityInput): IdentityPressure {
  const c = i.culturalPerception;
  const cw = i.cognitiveWeight;
  return {
    noveltyPressure: round1(clamp10(
      (c ? Math.abs(c.noveltyScore - 5) * 0.8 : 0) +
      (cw ? cw.environmentalSensitivity.noveltySensitivity * 0.4 : 0),
    )),
    trustPressure: round1(clamp10(
      (c ? (10 - c.trustClimate) * 0.9 : 0) +
      (i.strategy ? i.strategy.trustDebt * 0.5 : 0),
    )),
    fatiguePressure: round1(clamp10(
      (c ? (c.aestheticFatigue + c.audienceNumbness + c.pacingFatigue) / 3 * 0.9 : 0),
    )),
    adaptationPressure: round1(clamp10(
      cw ? cw.adaptationPressure : 0,
    )),
  };
}

// ─── persistence (from EWMA + dominance counts) ──────────────

function persistenceOf(
  vector: IdentityVector,
  history: IdentityHistoryContext | null | undefined,
): number {
  if (!history) return 0;
  const ewma = history.ewmaStrengths[vector] ?? 0;
  const count = history.dominanceCounts[vector] ?? 0;
  const total = Math.max(1, history.observationCount);
  return clamp10(ewma * 0.6 + (count / total) * 10 * 0.4);
}

// ─── main ──────────────────────────────────────────────────────

export function computeIdentityContinuity(
  input: IdentityContinuityInput,
): IdentityContinuity {
  const reasonCodes: string[] = [];

  // 1. Derive per-vector strength from this frame.
  const vectorStrengths = {} as Record<IdentityVector, number>;
  const vectorReasons = {} as Record<IdentityVector, string[]>;
  for (const v of ALL_IDENTITY_VECTORS) {
    const d = DERIVATIONS[v](input);
    vectorStrengths[v] = round1(d.strength);
    vectorReasons[v] = d.reasons;
  }

  // 2. Build (vector, strength, persistence) ranking.
  const ranked = ALL_IDENTITY_VECTORS
    .map((v) => {
      const strength = vectorStrengths[v];
      const persistence = round1(persistenceOf(v, input.history));
      // Combined score: weighted average of current and historical signal.
      const combined = strength * 0.55 + persistence * 0.45;
      return { vector: v, strength, persistence, combined };
    })
    .sort((a, b) =>
      b.combined !== a.combined
        ? b.combined - a.combined
        : a.vector.localeCompare(b.vector),
    );

  // 3. Dominant identity vectors — top 4 with strength >= 5.
  const dominantIdentityVectors: DominantIdentityEntry[] = ranked
    .filter((r) => r.strength >= 5 || r.persistence >= 5)
    .slice(0, 4)
    .map((r) => ({
      vector: r.vector,
      strength: r.strength,
      persistence: r.persistence,
      explanation: `${r.vector} strength ${r.strength.toFixed(1)}/10 · persistence ${r.persistence.toFixed(1)}/10` +
        (vectorReasons[r.vector].length > 0 ? ` — ${vectorReasons[r.vector].slice(0, 2).join(' · ')}` : ''),
    }));

  // 4. Emerging / collapsing — compare strength vs EWMA.
  const emergingIdentityVectors: EmergingIdentityEntry[] = [];
  const collapsingIdentityVectors: CollapsingIdentityEntry[] = [];
  for (const v of ALL_IDENTITY_VECTORS) {
    const recent = vectorStrengths[v];
    const ewma = input.history?.ewmaStrengths[v];
    if (ewma === undefined) continue;
    const delta = recent - ewma;
    if (delta >= 1.5) {
      emergingIdentityVectors.push({
        vector: v,
        acceleration: round1(clamp10(delta)),
        explanation: `acceleration: ewma ${ewma.toFixed(1)} → recent ${recent.toFixed(1)} (+${delta.toFixed(1)})`,
      });
    } else if (delta <= -1.5) {
      collapsingIdentityVectors.push({
        vector: v,
        decay: round1(clamp10(-delta)),
        explanation: `decay: ewma ${ewma.toFixed(1)} → recent ${recent.toFixed(1)} (${delta.toFixed(1)})`,
      });
    }
  }
  emergingIdentityVectors.sort((a, b) => b.acceleration - a.acceleration);
  collapsingIdentityVectors.sort((a, b) => b.decay - a.decay);

  // 5. Contradictions.
  const identityContradictions = deriveContradictions(vectorStrengths);

  // 6. Persistent behavioral patterns from memory.
  const persistentBehavioralPatterns = derivePatterns(input.history);

  // 7. Contextual modes.
  const contextualIdentityModes = deriveContextualModes(input, vectorStrengths);

  // 8. Long-term drift table (per vector with non-trivial drift).
  const longTermDrift: IdentityDriftEntry[] = ALL_IDENTITY_VECTORS
    .map((v) => {
      const recent = vectorStrengths[v];
      const historical = input.history?.ewmaStrengths[v];
      return {
        vector: v,
        recent,
        historical: historical === undefined ? recent : round1(historical),
        drift: historical === undefined ? 0 : round1(recent - historical),
      };
    })
    .filter((r) => Math.abs(r.drift) >= 0.5)
    .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift))
    .slice(0, 6);

  // 9. Identity pressure.
  const identityPressure = deriveIdentityPressure(input);

  // 10. Aggregate scalars.
  const fragStrength = vectorStrengths['identity-fragmented'];
  const stabilityStrength = vectorStrengths['stability-preferring'];
  const fragHistory = input.history?.recentFragmentation ?? 0;
  const identityFragmentation = round1(clamp10(
    fragStrength * 0.5 + fragHistory * 0.3 + identityContradictions.length * 0.8,
  ));
  const identityStability = round1(clamp10(
    stabilityStrength * 0.4 + (input.history?.recentStability ?? 5) * 0.4 +
    (10 - identityFragmentation) * 0.2,
  ));

  // Behavioral consistency rises with persistence and falls with high
  // variation / many emerging+collapsing transitions.
  const avgPersistence = ranked.reduce((a, r) => a + r.persistence, 0) / ALL_IDENTITY_VECTORS.length;
  const transitionPenalty = (emergingIdentityVectors.length + collapsingIdentityVectors.length) * 0.4;
  const behavioralConsistency = round1(clamp10(
    avgPersistence * 0.6 + (10 - vectorStrengths['high-variation']) * 0.3 - transitionPenalty,
  ));

  // Adaptation velocity = drift magnitude / observation count factor.
  const totalDriftMag = longTermDrift.reduce((a, d) => a + Math.abs(d.drift), 0);
  const adaptationVelocity = round1(clamp10(
    totalDriftMag * 0.6 +
    (input.cognitiveWeight ? input.cognitiveWeight.adaptationPressure * 0.4 : 0),
  ));

  // Continuity risk — high when fragmentation rises with low persistence,
  // OR many contradictions, OR rapid drift.
  const continuityRisk = round1(clamp10(
    identityFragmentation * 0.4 +
    (10 - behavioralConsistency) * 0.3 +
    identityContradictions.length * 0.5 +
    adaptationVelocity * 0.2,
  ));

  // 11. Reason codes — concise audit trail.
  reasonCodes.push(
    `dominant:${dominantIdentityVectors.map((d) => d.vector).join(',') || 'none'}`,
    `emerging:${emergingIdentityVectors.map((e) => e.vector).join(',') || 'none'}`,
    `collapsing:${collapsingIdentityVectors.map((c) => c.vector).join(',') || 'none'}`,
    `contradictions:${identityContradictions.length}`,
    `stability:${identityStability}`,
    `fragmentation:${identityFragmentation}`,
    `consistency:${behavioralConsistency}`,
    `continuity-risk:${continuityRisk}`,
  );
  if (input.history) reasonCodes.push(`history-observations:${input.history.observationCount}`);
  if (input.counterfactual !== undefined) reasonCodes.push('counterfactual:provided');

  return {
    identityStability,
    identityFragmentation,
    behavioralConsistency,
    adaptationVelocity,
    dominantIdentityVectors,
    emergingIdentityVectors,
    collapsingIdentityVectors,
    identityContradictions,
    persistentBehavioralPatterns,
    contextualIdentityModes,
    longTermDrift,
    identityPressure,
    continuityRisk,
    vectorStrengths,
    reasonCodes,
  };
}
