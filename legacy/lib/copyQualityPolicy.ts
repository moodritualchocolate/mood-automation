/**
 * COPY-QUALITY POLICY (advisory)
 *
 * Pure deterministic recommendation layer. Given the current strategy
 * + copy-quality + longitudinal context, recommends which policy band
 * the next run SHOULD operate in for the feature-flagged
 * copyQualityRefusalEnabled gate.
 *
 * STRICTLY ADVISORY:
 *   - does NOT flip copyQualityRefusalEnabled
 *   - does NOT modify finalVerdict, critic logic, or brutality semantics
 *   - does NOT change /api/generate request handling
 *   - just SAYS what the recommended band would be
 *
 * The studio surfaces the recommendation so operators can see "right
 * now this kind of run would be a good candidate to flip the flag
 * on", without the system doing so automatically.
 *
 * Synchronous. No I/O. Same inputs → same recommendation.
 */

import type { AdStrategyAssessment } from './adStrategyEngine';
import type { AdStrategyMemoryState } from './adStrategyMemory';
import type { CopyQualityAxis } from './copyQualityAdapter';
import type { QualityLongitudinalView } from './qualityLongitudinalView';
import type { CampaignMode, Formula } from '@/core/types';

// ─── tuning constants ─────────────────────────────────────────

export const POLICY_BRUTALITY_MIN_FOR_STRICT = 0.80;

/** Score thresholds → band mapping. */
const SCORE_BANDS = [
  { max: 0,        band: 'off'      as const },
  { max: 2,        band: 'observe'  as const },
  { max: 4,        band: 'warn'     as const },
  { max: Infinity, band: 'strict'   as const },
];

/** Per-mode baseline policy weight. Higher = recommend stricter band
 *  by default. Documentary / Product-focused carry the most weight
 *  because their archetypes explicitly demand proof and credibility. */
const MODE_BASE_SCORE: Record<CampaignMode, number> = {
  'Editorial':       1,
  'Documentary':     3,
  'Performance':     2,
  'Emotional':       0,
  'Minimal':         0,
  'Aggressive':      1,
  'Luxury':          1,
  'Product-focused': 3,
};

// ─── output shape ──────────────────────────────────────────────

export type PolicyBand = 'off' | 'observe' | 'warn' | 'strict';

export interface CopyQualityPolicyRecommendation {
  /** Whether the flag SHOULD be on for this run.
   *  true ⇔ band ∈ {warn, strict}. */
  recommendedEnabled: boolean;
  /** 0..10 — how strongly the inputs agree with the recommended band. */
  confidence: number;
  policyBand: PolicyBand;
  /** Audit trail — every signal that contributed to the score. */
  reasonCodes: string[];
  /** Integrity threshold the band would use IF the flag were on.
   *  Matches existing refusal helper for 'strict' (4.0); higher for
   *  'warn' (5.5) to surface marginal cases as advisories rather than
   *  hard refusals. 0 for off/observe (no consumption). */
  suggestedIntegrityThreshold: number;
  /** Brutality floor the band would require. Matches existing refusal
   *  helper for 'strict' (0.80); higher for 'warn' (0.85). 0 for
   *  off/observe. */
  suggestedBrutalityThreshold: number;
}

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp10(n: number): number { return clamp(0, 10, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }

function bandFromScore(score: number): PolicyBand {
  for (const cutoff of SCORE_BANDS) {
    if (score <= cutoff.max) return cutoff.band;
  }
  return 'off';
}

function suggestedThresholdsFor(band: PolicyBand): { integrity: number; brutality: number } {
  switch (band) {
    case 'strict':  return { integrity: 4.0, brutality: 0.80 };
    case 'warn':    return { integrity: 5.5, brutality: 0.85 };
    case 'observe': return { integrity: 0,    brutality: 0    };
    case 'off':     return { integrity: 0,    brutality: 0    };
  }
}

/** Per-rule contribution to the score, paired with a human-readable
 *  reason code. Centralized so the audit trail mirrors the math. */
interface ScoreRule {
  delta: number;
  code: string;
}

// ─── main ──────────────────────────────────────────────────────

export interface CopyQualityPolicyInput {
  formula: Formula;
  campaignMode: CampaignMode | null;
  brutality: number;
  strategy: AdStrategyAssessment;
  /** Persistent strategy memory — used for brandDignityScore + per-audience
   *  fatigue. May be null if the store hasn't been initialized. */
  strategyMemory: AdStrategyMemoryState | null;
  copyQuality: CopyQualityAxis | null | undefined;
  /** Optional longitudinal view; if present, drift can dampen or amplify
   *  the recommendation. */
  longitudinal?: QualityLongitudinalView | null;
}

export function computeCopyQualityPolicy(
  input: CopyQualityPolicyInput,
): CopyQualityPolicyRecommendation {
  const rules: ScoreRule[] = [];

  // ── 1. Per-mode baseline ─────────────────────────────────────
  if (input.campaignMode) {
    const base = MODE_BASE_SCORE[input.campaignMode];
    rules.push({ delta: base, code: `mode-base[${input.campaignMode}]:+${base}` });
  } else {
    rules.push({ delta: 1, code: 'mode-auto-default:+1' });
  }

  // ── 2. Strategy proof need + role weighting ──────────────────
  if (input.strategy.proofNeed === 'high') {
    rules.push({ delta: 2, code: 'proofNeed-high:+2' });
  } else if (input.strategy.proofNeed === 'medium') {
    rules.push({ delta: 1, code: 'proofNeed-medium:+1' });
  }
  // Proof + Trust roles already encoded their strictness in the strategy
  // engine; surface as score boost.
  const role = input.strategy.campaignRole;
  if (role === 'product_proof' || role === 'trust_builder' || role === 'objection_breaker') {
    rules.push({ delta: 1, code: `role-${role}:+1` });
  }
  if (role === 'ritual_education') {
    rules.push({ delta: 1, code: 'role-ritual_education:+1' });
  }

  // ── 3. Trust debt (compound with high proofNeed) ─────────────
  const trustDebt = input.strategy.trustDebt;
  if (trustDebt >= 8) {
    rules.push({ delta: 3, code: `trustDebt-${trustDebt.toFixed(1)}-critical:+3` });
  } else if (trustDebt >= 6) {
    rules.push({ delta: 2, code: `trustDebt-${trustDebt.toFixed(1)}-high:+2` });
  } else if (trustDebt >= 4) {
    rules.push({ delta: 1, code: `trustDebt-${trustDebt.toFixed(1)}-elevated:+1` });
  }
  if (input.strategy.proofNeed === 'high' && trustDebt >= 5) {
    rules.push({ delta: 1, code: 'compound-highProof-and-debt:+1' });
  }

  // ── 4. Brand dignity erosion ─────────────────────────────────
  const brandDignity = input.strategyMemory?.brandDignityScore ?? 7;
  if (brandDignity <= 3) {
    rules.push({ delta: 2, code: `brandDignity-${brandDignity.toFixed(1)}-eroded:+2` });
  } else if (brandDignity <= 5) {
    rules.push({ delta: 1, code: `brandDignity-${brandDignity.toFixed(1)}-low:+1` });
  }

  // ── 5. Repetition risk ───────────────────────────────────────
  if (input.strategy.repetitionRisk >= 7) {
    rules.push({ delta: 1, code: `repetitionRisk-${input.strategy.repetitionRisk}-high:+1` });
  }

  // ── 6. Audience fatigue (per the directive: pushes observe/warn,
  //       NOT strict; capped at +1 total regardless of severity) ─
  const audiences = input.strategyMemory?.audienceFatigue;
  if (audiences) {
    const heavilyUsed = Object.values(audiences).filter((a) => a.usageCount >= 8).length;
    if (heavilyUsed >= 1) {
      rules.push({ delta: 1, code: `audience-fatigue-heavy:${heavilyUsed}:+1` });
    }
  }

  // ── 7. Reductions: high brand dignity + low trust debt ───────
  if (brandDignity >= 8 && trustDebt <= 2) {
    rules.push({ delta: -2, code: `clean-state-dignity${brandDignity.toFixed(1)}-debt${trustDebt.toFixed(1)}:-2` });
  }

  // ── 8. Longitudinal drift (optional) ─────────────────────────
  if (input.longitudinal && input.longitudinal.present) {
    const integrityTrend = input.longitudinal.copyIntegrityTrend;
    if (integrityTrend.length >= 3) {
      const recent = integrityTrend.slice(-3).reduce((a, p) => a + p.value, 0) / 3;
      const earlier = integrityTrend.slice(0, 3).reduce((a, p) => a + p.value, 0) / 3;
      const drift = recent - earlier;
      if (drift <= -1.5) {
        rules.push({ delta: 1, code: `integrity-trending-down:${drift.toFixed(1)}:+1` });
      } else if (drift >= 1.5) {
        rules.push({ delta: -1, code: `integrity-trending-up:${drift.toFixed(1)}:-1` });
      }
    }
  }

  // ── 9. Current run quality also matters: very low integrity right
  //       now nudges toward stricter band so that the recommendation
  //       reflects the live signal too. ─────────────────────────
  if (input.copyQuality && input.copyQuality.copyIntegrity < 5) {
    rules.push({ delta: 1, code: `current-integrity-${input.copyQuality.copyIntegrity.toFixed(1)}-low:+1` });
  }

  // ── 10. Compute raw score, derive band, apply brutality cap ──
  const rawScore = rules.reduce((sum, r) => sum + r.delta, 0);
  let band = bandFromScore(rawScore);
  // Per directive: brutality < 0.8 must never recommend strict.
  if (band === 'strict' && input.brutality < POLICY_BRUTALITY_MIN_FOR_STRICT) {
    band = 'warn';
    rules.push({ delta: 0, code: `brutality-${input.brutality.toFixed(2)}-caps-strict-to-warn` });
  }

  const thresholds = suggestedThresholdsFor(band);
  const recommendedEnabled = band === 'warn' || band === 'strict';

  // ── 11. Confidence — how clearly inputs agree with the band ──
  // Higher when the rawScore lands cleanly inside the band's range,
  // lower when it's on a boundary. Penalize when the signal is sparse.
  const bandRanges: Record<PolicyBand, [number, number]> = {
    off:     [-Infinity, 0],
    observe: [1, 2],
    warn:    [3, 4],
    strict:  [5, Infinity],
  };
  const [lo, hi] = bandRanges[band];
  const distanceFromEdge = (() => {
    if (band === 'off')    return 0 - rawScore;               // farther below 0 = more confident
    if (band === 'strict') return rawScore - 5;               // farther above 5 = more confident
    const center = (lo + hi) / 2;
    return 1 - Math.abs(rawScore - center);                   // closer to center = higher
  })();
  let confidence = clamp10(5 + distanceFromEdge * 1.5);
  // Sparsity penalty when few rules contributed.
  if (rules.length < 3) confidence = clamp10(confidence - 2);
  // Brutality-cap penalty.
  if (rules.some((r) => r.code.includes('caps-strict-to-warn'))) confidence = clamp10(confidence - 1);

  return {
    recommendedEnabled,
    confidence: round1(confidence),
    policyBand: band,
    reasonCodes: [
      `raw-score:${rawScore} → band:${band}`,
      ...rules.map((r) => r.code),
    ],
    suggestedIntegrityThreshold: thresholds.integrity,
    suggestedBrutalityThreshold: thresholds.brutality,
  };
}
