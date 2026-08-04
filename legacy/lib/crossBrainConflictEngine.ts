/**
 * CROSS-BRAIN CONFLICT ENGINE (Internal Disagreement Layer)
 *
 * Deterministic, read-only. Detects, scores, and explains the tension
 * between the system's specialized "brains":
 *
 *   strategy · copywriter · cultural perception · trust signals
 *   novelty signals · fatigue signals · policy · quality
 *
 * Does NOT decide who is right. Maps internal disagreement so
 * downstream consumers (humans + future weighted-interpretation
 * layers) can read the gradient of certainty.
 *
 * STRICTLY:
 *   - no verdict / brutality / critic / generation mutation
 *   - no external APIs or model calls
 *   - same inputs → same conflict report
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { CopywriterOutput } from './copywriterEngine';
import type { CopyQualityAxis } from './copyQualityAdapter';
import type {
  CulturalPerception, CulturalSignal,
} from './culturalPerceptionEngine';
import type { QualityLongitudinalView } from './qualityLongitudinalView';
import type { PolicyAuditState } from './copyQualityPolicyAudit';
import type { CampaignMode, Formula } from '@/core/types';

// ─── taxonomy ──────────────────────────────────────────────────

export type ConflictType =
  | 'trust-vs-conversion'
  | 'novelty-vs-authenticity'
  | 'emotion-vs-fatigue'
  | 'strategy-vs-culture'
  | 'quality-vs-performance'
  | 'restraint-vs-attention'
  | 'human-vs-algorithmic'
  | 'clarity-vs-mystery'
  | 'proof-vs-emotion'
  | 'familiarity-vs-freshness'
  | 'brand-vs-clickability'
  | 'short-term-vs-long-term-trust';

// ─── output shape ──────────────────────────────────────────────

export interface ActiveConflict {
  type: ConflictType;
  severity: number;                  // 0..10
  systemsInvolved: string[];         // brains in tension
  explanation: string;
  suggestedObservation: string;
}

export interface CrossBrainConflict {
  overallTension: number;            // 0..10 — higher = more disagreement
  cognitiveStability: number;        // 0..10 — higher = calmer, more aligned
  alignmentScore: number;            // 0..10 — higher = brains agreeing
  dominantConflict: ConflictType | null;
  activeConflicts: ActiveConflict[];
  agreementZones: string[];
  unstableZones: string[];
  silentRisks: string[];
  systemWeights: {
    strategy: number;
    culture: number;
    trust: number;
    novelty: number;
    fatigue: number;
    quality: number;
  };
  confidenceGradient: {
    highConfidenceAreas: string[];
    uncertainAreas: string[];
  };
  reasonCodes: string[];
}

// ─── input ─────────────────────────────────────────────────────

export interface CrossBrainConflictInput {
  formula?: Formula;
  campaignMode?: CampaignMode | null;
  brutality?: number;

  strategy?: AdStrategyAssessment | null;
  copywriter?: CopywriterOutput | null;
  copyQuality?: CopyQualityAxis | null;
  culturalPerception?: CulturalPerception | null;
  qualityLongitudinal?: QualityLongitudinalView | null;
  policyAudit?: PolicyAuditState | null;

  // The Strategic Hint Channel isn't built yet. Accept any opaque
  // shape so when it ships the engine can pick up signals without
  // type churn. Currently unused except for reasonCodes.
  strategicHints?: unknown;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

// ─── rule definitions ─────────────────────────────────────────

interface RuleResult {
  severity: number;
  systems: string[];
  explanation: string;
  observation: string;
  reasonCodes: string[];
}

type Rule = (i: CrossBrainConflictInput) => RuleResult | null;

const RULES: Record<ConflictType, Rule> = {
  // ── 1. trust-vs-conversion ──────────────────────────────────
  'trust-vs-conversion': (i) => {
    const strat = i.strategy;
    const culture = i.culturalPerception;
    const q = i.copyQuality;
    if (!strat && !culture && !q) return null;

    const trustDebt = strat?.trustDebt ?? 0;
    const ctaStrength = strat?.creativeConstraints.ctaStrength ?? 0;
    const trustClimate = culture?.trustClimate ?? 10;
    const ctaRestraint = q?.ctaRestraint ?? 10;
    const aggressiveSignal = culture?.dominantSignals.includes('algorithmically-obvious') ?? false;

    const ctaPressure = clamp10(10 - ctaRestraint);
    const trustPressure = clamp10(trustDebt + (10 - trustClimate) * 0.5);
    const ctaWeight = clamp10(ctaStrength);

    const severity = clamp10(
      (ctaPressure * 0.4 + ctaWeight * 0.3 + trustPressure * 0.3) *
      (aggressiveSignal ? 1.15 : 1),
    );
    if (severity < 4) return null;

    return {
      severity,
      systems: ['strategy', 'trust', 'culture'],
      explanation: `strategy wants conversion (cta-strength ${ctaWeight.toFixed(1)}/10) ` +
        `while trust signals are stressed (debt ${trustDebt.toFixed(1)}, climate ${trustClimate.toFixed(1)}/10)`,
      observation: 'observe whether sustained CTA pressure correlates with future trust erosion',
      reasonCodes: [
        `cta-pressure:${round1(ctaPressure)}`,
        `trust-pressure:${round1(trustPressure)}`,
        aggressiveSignal ? 'culture:algorithmically-obvious' : 'culture:no-aggressive-signal',
      ],
    };
  },

  // ── 2. novelty-vs-authenticity ──────────────────────────────
  'novelty-vs-authenticity': (i) => {
    const culture = i.culturalPerception;
    if (!culture) return null;
    const novelty = culture.noveltyScore;
    const authenticity = culture.perceivedAuthenticity;
    const gap = novelty - authenticity;
    const explicitSignal = culture.dominantSignals.includes('novel-but-unsafe');
    const severity = clamp10(
      Math.max(0, gap) * 0.9 + (explicitSignal ? 2 : 0),
    );
    if (severity < 4) return null;
    return {
      severity,
      systems: ['novelty', 'trust', 'culture'],
      explanation: `novelty score ${novelty.toFixed(1)}/10 outpacing perceived authenticity ${authenticity.toFixed(1)}/10` +
        (explicitSignal ? ' (novel-but-unsafe signal active)' : ''),
      observation: 'observe whether novel territory holds without trust collapsing',
      reasonCodes: [
        `novelty:${round1(novelty)}`,
        `authenticity:${round1(authenticity)}`,
        explicitSignal ? 'culture:novel-but-unsafe' : 'culture:no-novel-but-unsafe',
      ],
    };
  },

  // ── 3. emotion-vs-fatigue ───────────────────────────────────
  'emotion-vs-fatigue': (i) => {
    const culture = i.culturalPerception;
    const strat = i.strategy;
    const copy = i.copywriter;
    if (!culture) return null;
    const fatigue = culture.audienceNumbness;
    // emotion intensity proxies
    const persuasionEmotional =
      strat?.persuasionMode === 'empathic' ||
      strat?.persuasionMode === 'narrative' ||
      strat?.persuasionMode === 'aspirational';
    const directness = strat?.creativeConstraints.emotionalDirectness ?? 0;
    const urgency = strat?.urgencyLevel ?? 0;
    const copyEmotional = (copy?.restraintLevel ?? 10) < 5;

    const emotion = clamp10(
      directness * 0.5 + urgency * 0.3 +
      (persuasionEmotional ? 2 : 0) + (copyEmotional ? 1.5 : 0),
    );
    const severity = clamp10(
      Math.min(emotion, fatigue) * 0.6 +
      Math.abs(emotion - fatigue) * 0.2 +
      (fatigue >= 6 && emotion >= 5 ? 2 : 0),
    );
    if (severity < 4) return null;
    return {
      severity,
      systems: ['copy', 'culture', 'fatigue'],
      explanation: `emotional intensity (${emotion.toFixed(1)}/10) pushing into audience numbness (${fatigue.toFixed(1)}/10)`,
      observation: 'observe whether emotional channels keep landing as the audience saturates',
      reasonCodes: [
        `emotion-intensity:${round1(emotion)}`,
        `audience-numbness:${round1(fatigue)}`,
      ],
    };
  },

  // ── 4. strategy-vs-culture ──────────────────────────────────
  'strategy-vs-culture': (i) => {
    const strat = i.strategy;
    const culture = i.culturalPerception;
    if (!strat || !culture) return null;
    // Strategy proof-driven but culture trust-fragile → mismatch.
    // Or strategy proofNeed=low but culture demands trust right now.
    const proofNeedHigh = strat.proofNeed === 'high';
    const trustFragile = culture.dominantSignals.includes('trust-fragile') || culture.trustClimate <= 4;
    const conformityRisk = culture.conformityRisk;
    const trendDecaying = culture.dominantSignals.includes('trend-decaying');
    const aestheticBurnout = culture.dominantSignals.includes('aesthetic-burnout');

    let severity = 0;
    const codes: string[] = [];
    if (proofNeedHigh && trustFragile) {
      severity += 4;
      codes.push('proof-need-high + trust-fragile');
    }
    if (conformityRisk >= 7 && strat.creativeConstraints.criticStrictnessRecommendation !== 'strict') {
      severity += 3;
      codes.push(`conformityRisk:${round1(conformityRisk)} but strictness:${strat.creativeConstraints.criticStrictnessRecommendation}`);
    }
    if (trendDecaying && strat.repetitionRisk >= 6) {
      severity += 3;
      codes.push('trend-decaying + repetition-risk-high');
    }
    if (aestheticBurnout) {
      severity += 1.5;
      codes.push('aesthetic-burnout');
    }

    severity = clamp10(severity);
    if (severity < 4) return null;
    return {
      severity,
      systems: ['strategy', 'culture'],
      explanation: `strategic intent and current cultural climate are pulling in different directions`,
      observation: 'observe whether strategic patterns persist as the cultural ground shifts',
      reasonCodes: codes,
    };
  },

  // ── 5. quality-vs-performance ───────────────────────────────
  'quality-vs-performance': (i) => {
    const q = i.copyQuality;
    const ql = i.qualityLongitudinal;
    const audit = i.policyAudit;
    if (!q && !ql && !audit) return null;

    const integrity = q?.copyIntegrity ?? null;
    // Recent shipped despite policy warnings?
    let warnShippedCount = 0;
    if (audit) {
      const recent = audit.entries.slice(-12);
      warnShippedCount = recent.filter((e) =>
        (e.policyBand === 'warn' || e.policyBand === 'strict') &&
        e.outcomeVerdict === 'approve' &&
        !e.finalAppliedEnabled,
      ).length;
    }
    const trendingDown =
      ql?.driftStatus === 'eroding' || ql?.driftStatus === 'critical';

    let severity = 0;
    const codes: string[] = [];
    if (integrity !== null && integrity < 5) {
      severity += (5 - integrity);
      codes.push(`current-integrity:${round1(integrity)}`);
    }
    if (warnShippedCount >= 2) {
      severity += 2 + warnShippedCount * 0.3;
      codes.push(`warn-shipped-despite-flag-off:${warnShippedCount}`);
    }
    if (trendingDown) {
      severity += 2;
      codes.push(`longitudinal:${ql?.driftStatus}`);
    }
    severity = clamp10(severity);
    if (severity < 4) return null;
    return {
      severity,
      systems: ['quality', 'policy', 'strategy'],
      explanation: `copy-quality signals tightening while performance-oriented patterns keep shipping`,
      observation: 'observe whether continued shipping erodes long-run quality further',
      reasonCodes: codes,
    };
  },

  // ── 6. restraint-vs-attention ──────────────────────────────
  'restraint-vs-attention': (i) => {
    const culture = i.culturalPerception;
    const copy = i.copywriter;
    if (!culture && !copy) return null;
    const pacingFatigue = culture?.pacingFatigue ?? 0;
    const hookSat = culture?.hookSaturation ?? 0;
    const copyRestraint = copy?.restraintLevel ?? 5;
    // High pacingFatigue/hookSat + low copy restraint → conflict.
    const attentionPressure = clamp10((10 - copyRestraint) * 0.6 + hookSat * 0.4);
    const severity = clamp10(
      (pacingFatigue >= 5 ? pacingFatigue * 0.4 : 0) +
      attentionPressure * 0.5 +
      (culture?.dominantSignals.includes('visually-exhausted') ? 1.5 : 0),
    );
    if (severity < 4) return null;
    return {
      severity,
      systems: ['copy', 'culture', 'fatigue'],
      explanation: `attention-grabbing patterns increasing as the field is already pacing-fatigued (${pacingFatigue.toFixed(1)}/10)`,
      observation: 'observe whether restrained variants outperform attention-pushing ones longitudinally',
      reasonCodes: [
        `pacing-fatigue:${round1(pacingFatigue)}`,
        `hook-saturation:${round1(hookSat)}`,
        `copy-restraint:${round1(copyRestraint)}`,
      ],
    };
  },

  // ── 7. human-vs-algorithmic ─────────────────────────────────
  'human-vs-algorithmic': (i) => {
    const culture = i.culturalPerception;
    const copy = i.copywriter;
    if (!culture) return null;
    const obvious = culture.dominantSignals.includes('algorithmically-obvious');
    const numb = culture.dominantSignals.includes('emotionally-numb');
    const hookSat = culture.hookSaturation;
    const resonance = culture.humanResonance;
    const forbiddenHits = copy?.forbiddenPhrasesTriggered.length ?? 0;
    let severity = 0;
    const codes: string[] = [];
    if (obvious) { severity += 4; codes.push('signal:algorithmically-obvious'); }
    if (numb)    { severity += 2; codes.push('signal:emotionally-numb'); }
    if (hookSat >= 6) { severity += hookSat * 0.3; codes.push(`hook-sat:${round1(hookSat)}`); }
    if (forbiddenHits > 0) { severity += forbiddenHits; codes.push(`forbidden-hits:${forbiddenHits}`); }
    if (resonance <= 4) { severity += (5 - resonance); codes.push(`resonance:${round1(resonance)}`); }
    severity = clamp10(severity);
    if (severity < 4) return null;
    return {
      severity,
      systems: ['copy', 'culture', 'novelty'],
      explanation: 'creative output is reading more algorithmic than human in the current climate',
      observation: 'observe whether more restrained / quieter variants change resonance',
      reasonCodes: codes,
    };
  },

  // ── 8. clarity-vs-mystery ───────────────────────────────────
  // Only fires when proofNeed is explicitly HIGH (medium is a normal
  // pairing with observational/minimal), OR when proof adequacy is
  // measurably low. Medium proofNeed alone should NOT generate a
  // conflict — that's the baseline configuration.
  'clarity-vs-mystery': (i) => {
    const b = i.copyQuality;
    const strat = i.strategy;
    if (!strat) return null;
    const proofNeedHigh = strat.proofNeed === 'high';
    const persuasionMystery =
      strat.persuasionMode === 'observational' || strat.persuasionMode === 'minimal';
    const proofAdequacy = b?.proofAdequacy ?? null;

    let severity = 0;
    const codes: string[] = [];
    if (proofNeedHigh && persuasionMystery) {
      severity += 4;
      codes.push(`proof-need-high vs persuasion-${strat.persuasionMode}`);
    }
    if (proofNeedHigh && proofAdequacy !== null && proofAdequacy < 5) {
      severity += (5 - proofAdequacy);
      codes.push(`proof-adequacy:${round1(proofAdequacy)}`);
    }
    // Even at medium proofNeed, a clearly inadequate proof line signals
    // a conflict between clarity demand and the actual artifact.
    if (strat.proofNeed === 'medium' && proofAdequacy !== null && proofAdequacy < 4) {
      severity += (4 - proofAdequacy);
      codes.push(`proof-need-medium vs adequacy:${round1(proofAdequacy)}`);
    }
    severity = clamp10(severity);
    if (severity < 4) return null;
    return {
      severity,
      systems: ['strategy', 'quality'],
      explanation: `strategy demands clarity/proof while the creative posture is observational`,
      observation: 'observe whether observational variants accumulate proof debt over time',
      reasonCodes: codes,
    };
  },

  // ── 9. proof-vs-emotion ─────────────────────────────────────
  'proof-vs-emotion': (i) => {
    const strat = i.strategy;
    const copy = i.copywriter;
    if (!strat) return null;
    const proofNeedHigh = strat.proofNeed === 'high';
    const persuasionEmotional =
      strat.persuasionMode === 'empathic' ||
      strat.persuasionMode === 'narrative' ||
      strat.persuasionMode === 'aspirational';
    const proofLineAbsent = copy && (copy.proofLine === null || copy.proofLine.length === 0);
    const directness = strat.creativeConstraints.emotionalDirectness;
    let severity = 0;
    const codes: string[] = [];
    if (proofNeedHigh && persuasionEmotional) {
      severity += 4;
      codes.push(`proofNeed:high + persuasion:${strat.persuasionMode}`);
    }
    if (proofNeedHigh && proofLineAbsent) {
      severity += 3;
      codes.push('proof-line-absent');
    }
    if (proofNeedHigh && directness >= 7) {
      severity += 1;
      codes.push(`emotional-directness:${directness}`);
    }
    severity = clamp10(severity);
    if (severity < 4) return null;
    return {
      severity,
      systems: ['strategy', 'copy'],
      explanation: 'strategy needs proof but the persuasion architecture leans emotional',
      observation: 'observe whether emotional-led variants under high-proof contexts convert',
      reasonCodes: codes,
    };
  },

  // ── 10. familiarity-vs-freshness ────────────────────────────
  'familiarity-vs-freshness': (i) => {
    const culture = i.culturalPerception;
    const q = i.copyQuality;
    if (!culture) return null;
    const hookSat = culture.hookSaturation;
    const aesthetic = culture.aestheticFatigue;
    const freshness = culture.emotionalFreshness;
    const repConcern = q?.repetitionConcern ?? 0;
    const sat = (hookSat + aesthetic + repConcern) / 3;
    const severity = clamp10(
      sat * 0.7 + (10 - freshness) * 0.3 +
      (culture.dominantSignals.includes('aesthetic-burnout') ? 1.5 : 0),
    );
    if (severity < 4) return null;
    return {
      severity,
      systems: ['novelty', 'fatigue', 'culture'],
      explanation: `pattern familiarity rising (hook-sat ${hookSat.toFixed(1)}, aesthetic ${aesthetic.toFixed(1)}) while freshness is ${freshness.toFixed(1)}/10`,
      observation: 'observe whether deliberately-fresh patterns produce different verdict distributions',
      reasonCodes: [
        `hook-sat:${round1(hookSat)}`,
        `aesthetic-fatigue:${round1(aesthetic)}`,
        `freshness:${round1(freshness)}`,
        `repetition-concern:${round1(repConcern)}`,
      ],
    };
  },

  // ── 11. brand-vs-clickability ───────────────────────────────
  'brand-vs-clickability': (i) => {
    const strat = i.strategy;
    const q = i.copyQuality;
    if (!strat && !q) return null;
    const dignity = q?.dignitySafety ?? null;
    const ctaRestraint = q?.ctaRestraint ?? null;
    const ctaStrength = strat?.creativeConstraints.ctaStrength ?? null;
    const brandRisk = strat?.brandRisk ?? 0;
    let severity = 0;
    const codes: string[] = [];
    if (dignity !== null && dignity <= 5) {
      severity += (6 - dignity);
      codes.push(`dignity:${round1(dignity)}`);
    }
    if (ctaRestraint !== null && ctaRestraint <= 4) {
      severity += (5 - ctaRestraint);
      codes.push(`cta-restraint:${round1(ctaRestraint)}`);
    }
    if (ctaStrength !== null && ctaStrength >= 7) {
      severity += (ctaStrength - 6);
      codes.push(`cta-strength:${ctaStrength}`);
    }
    if (brandRisk >= 5) {
      severity += (brandRisk - 4) * 0.5;
      codes.push(`brand-risk:${round1(brandRisk)}`);
    }
    severity = clamp10(severity);
    if (severity < 4) return null;
    return {
      severity,
      systems: ['strategy', 'quality', 'trust'],
      explanation: 'brand-dignity signals trending down while CTA pressure trends up',
      observation: 'observe whether the brand recovery signals re-strengthen when CTA quiets',
      reasonCodes: codes,
    };
  },

  // ── 12. short-term-vs-long-term-trust ───────────────────────
  'short-term-vs-long-term-trust': (i) => {
    const strat = i.strategy;
    const audit = i.policyAudit;
    const ql = i.qualityLongitudinal;
    if (!strat && !audit && !ql) return null;
    const urgency = strat?.urgencyLevel ?? 0;
    const trustDebt = strat?.trustDebt ?? 0;
    let overrideFalseCount = 0;
    let recommendedOnlyCount = 0;
    if (audit) {
      const recent = audit.entries.slice(-16);
      overrideFalseCount = recent.filter((e) => e.overrideType === 'explicit-override-false').length;
      recommendedOnlyCount = recent.filter((e) => e.overrideType === 'recommended-only').length;
    }
    let severity = 0;
    const codes: string[] = [];
    if (urgency >= 6 && trustDebt >= 4) {
      severity += 3 + (urgency - 5) * 0.3 + (trustDebt - 3) * 0.3;
      codes.push(`urgency:${urgency} + trustDebt:${round1(trustDebt)}`);
    }
    if (recommendedOnlyCount >= 2) {
      severity += 1 + recommendedOnlyCount * 0.5;
      codes.push(`recommended-only-recurring:${recommendedOnlyCount}`);
    }
    if (overrideFalseCount >= 5) {
      severity += 1;
      codes.push(`explicit-false-recurring:${overrideFalseCount}`);
    }
    if (ql?.driftStatus === 'eroding' || ql?.driftStatus === 'critical') {
      severity += 2;
      codes.push(`longitudinal:${ql.driftStatus}`);
    }
    severity = clamp10(severity);
    if (severity < 4) return null;
    return {
      severity,
      systems: ['strategy', 'policy', 'trust'],
      explanation: 'short-term performance pressure compounding into long-term trust debt',
      observation: 'observe whether quieter cycles allow the trust debt to recover',
      reasonCodes: codes,
    };
  },
};

// ─── system weighting ─────────────────────────────────────────

function computeSystemWeights(
  i: CrossBrainConflictInput,
  active: ActiveConflict[],
): CrossBrainConflict['systemWeights'] {
  // Base weight per brain reflects how much signal it has.
  const base = {
    strategy: i.strategy ? clamp10(i.strategy.confidence) : 0,
    culture:  i.culturalPerception ? clamp10(10 - Math.max(0, 5 - i.culturalPerception.reasonCodes.length / 2)) : 0,
    trust:    i.culturalPerception ? clamp10(i.culturalPerception.trustClimate) : (i.copyQuality?.trustSafety ?? 0),
    novelty:  i.culturalPerception ? clamp10(i.culturalPerception.noveltyScore) : 0,
    fatigue:  i.culturalPerception ? clamp10(i.culturalPerception.aestheticFatigue) : 0,
    quality:  i.copyQuality ? clamp10(i.copyQuality.copyIntegrity) : 0,
  };
  // Each conflict that involves a brain adds weight (each brain is
  // contributing to the cognitive process).
  const bump: Record<string, number> = {
    strategy: 0, culture: 0, trust: 0, novelty: 0, fatigue: 0, quality: 0,
  };
  for (const c of active) {
    for (const s of c.systemsInvolved) {
      if (s in bump) bump[s] += c.severity * 0.15;
    }
  }
  return {
    strategy: round1(clamp10(base.strategy + bump.strategy)),
    culture:  round1(clamp10(base.culture  + bump.culture)),
    trust:    round1(clamp10(base.trust    + bump.trust)),
    novelty:  round1(clamp10(base.novelty  + bump.novelty)),
    fatigue:  round1(clamp10(base.fatigue  + bump.fatigue)),
    quality:  round1(clamp10(base.quality  + bump.quality)),
  };
}

// ─── agreement / unstable / silent risks ──────────────────────

function deriveAgreementZones(
  i: CrossBrainConflictInput, active: ActiveConflict[],
): { agreementZones: string[], unstableZones: string[], silentRisks: string[] } {
  const conflictTypes = new Set(active.map((a) => a.type));
  const agreementZones: string[] = [];
  const unstableZones: string[] = [];
  const silentRisks: string[] = [];

  // Agreement candidates — opposites of common conflicts.
  if (!conflictTypes.has('trust-vs-conversion') && i.culturalPerception && i.culturalPerception.trustClimate >= 6) {
    agreementZones.push('trust climate + strategy aligned on trust band');
  }
  if (!conflictTypes.has('novelty-vs-authenticity') && i.culturalPerception &&
      i.culturalPerception.noveltyScore >= 5 && i.culturalPerception.perceivedAuthenticity >= 6) {
    agreementZones.push('novelty + authenticity holding together');
  }
  if (!conflictTypes.has('emotion-vs-fatigue') && i.culturalPerception &&
      i.culturalPerception.audienceNumbness <= 4 && i.culturalPerception.emotionalFreshness >= 6) {
    agreementZones.push('emotional channel still landing — low numbness + high freshness');
  }
  if (!conflictTypes.has('quality-vs-performance') && i.copyQuality && i.copyQuality.copyIntegrity >= 7) {
    agreementZones.push('quality + verdict pipeline agreeing — integrity above threshold');
  }
  if (!conflictTypes.has('human-vs-algorithmic') && i.culturalPerception &&
      i.culturalPerception.humanResonance >= 6) {
    agreementZones.push('resonance reading human — algorithmic signal absent');
  }

  // Unstable zones — high-severity conflicts.
  for (const c of active) {
    if (c.severity >= 6) unstableZones.push(`${c.type} (severity ${c.severity.toFixed(1)})`);
  }

  // Silent risks — conditions that DIDN'T fire as full conflicts but
  // are creeping. These are "system feels it but no one is sounding
  // the alarm yet".
  const c = i.culturalPerception;
  if (c && c.aestheticFatigue >= 5 && c.aestheticFatigue < 7 && !conflictTypes.has('familiarity-vs-freshness')) {
    silentRisks.push(`aesthetic fatigue creeping (${c.aestheticFatigue.toFixed(1)}/10) — not yet a conflict`);
  }
  if (c && c.audienceNumbness >= 5 && c.audienceNumbness < 6 && !conflictTypes.has('emotion-vs-fatigue')) {
    silentRisks.push(`audience numbness drifting up (${c.audienceNumbness.toFixed(1)}/10)`);
  }
  if (i.strategy && i.strategy.trustDebt >= 5 && i.strategy.trustDebt < 7 && !conflictTypes.has('short-term-vs-long-term-trust')) {
    silentRisks.push(`trust debt building (${round1(i.strategy.trustDebt)}/10) without active conflict`);
  }
  if (c && c.dominantSignals.includes('trend-peaking') && !conflictTypes.has('familiarity-vs-freshness')) {
    silentRisks.push('one creative pattern is peaking — early-warning before saturation');
  }

  return { agreementZones, unstableZones, silentRisks };
}

// ─── confidence gradient ──────────────────────────────────────

function deriveConfidenceGradient(
  i: CrossBrainConflictInput, weights: CrossBrainConflict['systemWeights'],
): CrossBrainConflict['confidenceGradient'] {
  const high: string[] = [];
  const low: string[] = [];
  // High-confidence areas: high system weight + matching evidence.
  if (weights.strategy >= 7 && i.strategy) high.push(`strategy (${weights.strategy}/10) — confident audience+role read`);
  if (weights.quality >= 7 && i.copyQuality) high.push(`quality (${weights.quality}/10) — copy-integrity strong`);
  if (weights.trust >= 7) high.push(`trust climate strong (${weights.trust}/10)`);
  if (weights.culture >= 7 && i.culturalPerception && i.culturalPerception.reasonCodes.length >= 6) {
    high.push(`culture (${weights.culture}/10) — rich observation history`);
  }
  // Uncertain areas: low weight, missing input, or sparse data.
  if (!i.strategy) low.push('strategy — no assessment available');
  if (!i.culturalPerception) low.push('culture — no perception available');
  if (!i.copyQuality) low.push('quality — no current copy-quality signal');
  if (i.culturalPerception && i.culturalPerception.reasonCodes.length < 4) {
    low.push('culture — sparse memory, perception uncertain');
  }
  if (i.policyAudit && i.policyAudit.totalEntries < 5) low.push('policy — audit history under 5 entries');
  if (weights.novelty <= 3) low.push(`novelty (${weights.novelty}/10) — signal weak`);

  return { highConfidenceAreas: high, uncertainAreas: low };
}

// ─── main ──────────────────────────────────────────────────────

export function computeCrossBrainConflict(
  input: CrossBrainConflictInput,
): CrossBrainConflict {
  const active: ActiveConflict[] = [];
  const reasonCodes: string[] = [];

  // Enumerate the rule set deterministically (Object.keys is ordered
  // for non-numeric string keys — but we sort to be explicit).
  const types = Object.keys(RULES).sort() as ConflictType[];
  for (const t of types) {
    const r = RULES[t](input);
    if (!r) continue;
    active.push({
      type: t,
      severity: round1(r.severity),
      systemsInvolved: r.systems,
      explanation: r.explanation,
      suggestedObservation: r.observation,
    });
    reasonCodes.push(...r.reasonCodes.map((c) => `${t}:${c}`));
  }

  // Order conflicts by severity (descending), then by type alphabetic
  // for stable output. Cap to top 6.
  active.sort((a, b) => b.severity - a.severity || a.type.localeCompare(b.type));
  const trimmed = active.slice(0, 6);

  // Aggregate metrics.
  const overallTension = round1(clamp10(
    trimmed.length === 0 ? 0
      : trimmed.reduce((acc, c) => acc + c.severity, 0) / Math.max(1, trimmed.length) * 0.6 +
        (trimmed[0]?.severity ?? 0) * 0.4,
  ));
  const cognitiveStability = round1(clamp10(
    10 - overallTension * 0.7 - Math.min(3, trimmed.length * 0.5),
  ));
  const alignmentScore = round1(clamp10(
    10 - trimmed.length * 1.2 - (trimmed.filter((c) => c.severity >= 7).length * 1.0),
  ));
  const dominantConflict = trimmed[0]?.type ?? null;

  const systemWeights = computeSystemWeights(input, trimmed);
  const { agreementZones, unstableZones, silentRisks } =
    deriveAgreementZones(input, trimmed);
  const confidenceGradient = deriveConfidenceGradient(input, systemWeights);

  reasonCodes.unshift(
    `active-conflicts:${trimmed.length}`,
    `overall-tension:${overallTension}`,
    `dominant:${dominantConflict ?? 'none'}`,
  );
  if (input.strategicHints !== undefined) reasonCodes.push('hint-channel:provided');
  if (!input.culturalPerception) reasonCodes.push('input:no-cultural-perception');
  if (!input.strategy) reasonCodes.push('input:no-strategy');

  return {
    overallTension,
    cognitiveStability,
    alignmentScore,
    dominantConflict,
    activeConflicts: trimmed,
    agreementZones,
    unstableZones,
    silentRisks,
    systemWeights,
    confidenceGradient,
    reasonCodes,
  };
}
