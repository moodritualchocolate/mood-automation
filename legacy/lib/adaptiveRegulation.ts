/**
 * ADAPTIVE REGULATION (Wave 34)
 *
 * Pure functions that compute trait-biased threshold values. The
 * self-model is NEVER mutated by these functions — they only READ
 * trait intensities and return biased thresholds.
 *
 * Engines consult these helpers when they need a regulated value.
 * If self-model is null (e.g., before first cognition), each helper
 * returns the baseline value unchanged — so the system degrades
 * gracefully and Wave 33's behavior is preserved when traits are
 * inactive.
 *
 * Bias magnitudes are intentionally small (±20% maximum) so that
 * with EWMA-smoothed trait intensities the regulation drifts
 * gradually, never jumps.
 */

import type { SelfModelMemoryState, TraitId } from './selfModelMemory';

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}

function round1(n: number): number { return Math.round(n * 10) / 10; }

function traitIntensity(sm: SelfModelMemoryState | null | undefined, id: TraitId): number {
  if (!sm) return 0;
  const t = sm.traits.find((t) => t.id === id);
  return t?.intensity ?? 0;
}

// ─── 1. Contradiction escalation threshold ──────────────────────
//
// Baseline ESCALATION_PRESSURE_THRESHOLD = 6 (contradictionEngine).
// pressure-resilient trait raises this — a resilient organism
// tolerates more opposing pressure before tension escalates.
// At intensity 10, threshold rises to 8.

export const BASE_ESCALATION_THRESHOLD = 6;

export function getAdaptiveEscalationThreshold(sm: SelfModelMemoryState | null | undefined): number {
  const resilient = traitIntensity(sm, 'pressure-resilient');
  return round1(BASE_ESCALATION_THRESHOLD + clamp(0, 2, resilient * 0.2));
}

// ─── 2. Defer recommendation thresholds ──────────────────────────
//
// Baseline (temporalIntelligenceView.deferRecommendation):
//   'now'      if fragmentationRisk ≥ 7 OR cadenceHealth ≤ 3
//   'soon'     if fragmentationRisk ≥ 5 OR cadenceHealth ≤ 5
//              OR cognitionDensity ≥ 8
//   'not-yet'  if recoveryEfficiency < 4 OR approvalStability < 5
//   'not-needed' otherwise
//
// defer-resistant trait shifts ALL of these toward action bias.
// At intensity 10, 'now' requires fragmentationRisk ≥ 8 (not 7);
// 'soon' requires cognitionDensity ≥ 9 (not 8); etc.

export interface AdaptiveDeferThresholds {
  fragmentationRiskNow: number;        // baseline 7
  cadenceHealthNow: number;            // baseline 3
  fragmentationRiskSoon: number;       // baseline 5
  cadenceHealthSoon: number;           // baseline 5
  cognitionDensitySoon: number;        // baseline 8
  recoveryEfficiencyNotYet: number;    // baseline 4
  approvalStabilityNotYet: number;     // baseline 5
}

export const BASE_DEFER_THRESHOLDS: AdaptiveDeferThresholds = {
  fragmentationRiskNow: 7,
  cadenceHealthNow: 3,
  fragmentationRiskSoon: 5,
  cadenceHealthSoon: 5,
  cognitionDensitySoon: 8,
  recoveryEfficiencyNotYet: 4,
  approvalStabilityNotYet: 5,
};

export function getAdaptiveDeferThresholds(sm: SelfModelMemoryState | null | undefined): AdaptiveDeferThresholds {
  const resistant = traitIntensity(sm, 'defer-resistant');
  // Bias scale: 0.1 per trait point. At intensity 10:
  //   fragmentationRiskNow 7 → 8        (defer harder to recommend)
  //   cadenceHealthNow      3 → 2       (cadence must be worse to defer)
  //   fragmentationRiskSoon 5 → 6
  //   cadenceHealthSoon     5 → 4
  //   cognitionDensitySoon  8 → 9
  //   recoveryEfficiencyNotYet 4 → 3
  //   approvalStabilityNotYet 5 → 4
  return {
    fragmentationRiskNow:    round1(BASE_DEFER_THRESHOLDS.fragmentationRiskNow + resistant * 0.1),
    cadenceHealthNow:        round1(BASE_DEFER_THRESHOLDS.cadenceHealthNow - resistant * 0.1),
    fragmentationRiskSoon:   round1(BASE_DEFER_THRESHOLDS.fragmentationRiskSoon + resistant * 0.1),
    cadenceHealthSoon:       round1(BASE_DEFER_THRESHOLDS.cadenceHealthSoon - resistant * 0.1),
    cognitionDensitySoon:    round1(BASE_DEFER_THRESHOLDS.cognitionDensitySoon + resistant * 0.1),
    recoveryEfficiencyNotYet: round1(BASE_DEFER_THRESHOLDS.recoveryEfficiencyNotYet - resistant * 0.1),
    approvalStabilityNotYet: round1(BASE_DEFER_THRESHOLDS.approvalStabilityNotYet - resistant * 0.1),
  };
}

// ─── 3. Rest depletion thresholds ───────────────────────────────
//
// Baseline (operatingSystemCore REST_*_THRESHOLD constants):
//   energyReserves       ≤ 4
//   stressAccumulation   ≥ 5
//   complexityLoad       ≥ 6
//   fragmentationStreak  ≥ 3
//   pending actions + energyReserves ≤ 6
//
// recovery-dependent trait shifts thresholds so rest triggers
// EARLIER (lower stress required, higher energy still permits rest).
// At intensity 10:
//   energyReserves       ≤ 5  (was 4)
//   stressAccumulation   ≥ 4  (was 5)
//   complexityLoad       ≥ 5  (was 6)
//   pending energy       ≤ 7  (was 6)

export interface AdaptiveRestThresholds {
  energyLow: number;
  stressHigh: number;
  complexityHigh: number;
  fragmentHigh: number;        // unchanged — fragmentation is already a clear trigger
  pendingEnergyLow: number;
}

export const BASE_REST_THRESHOLDS: AdaptiveRestThresholds = {
  energyLow: 4,
  stressHigh: 5,
  complexityHigh: 6,
  fragmentHigh: 3,
  pendingEnergyLow: 6,
};

export function getAdaptiveRestThresholds(sm: SelfModelMemoryState | null | undefined): AdaptiveRestThresholds {
  const dependent = traitIntensity(sm, 'recovery-dependent');
  return {
    energyLow:        round1(BASE_REST_THRESHOLDS.energyLow + dependent * 0.1),
    stressHigh:       round1(BASE_REST_THRESHOLDS.stressHigh - dependent * 0.1),
    complexityHigh:   round1(BASE_REST_THRESHOLDS.complexityHigh - dependent * 0.1),
    fragmentHigh:     BASE_REST_THRESHOLDS.fragmentHigh,
    pendingEnergyLow: round1(BASE_REST_THRESHOLDS.pendingEnergyLow + dependent * 0.1),
  };
}

// ─── summary helper for dashboard ──────────────────────────────

export interface AdaptiveRegulationSummary {
  escalationThreshold: { base: number; adaptive: number; delta: number };
  defer: {
    fragmentationRiskNow: { base: number; adaptive: number };
    cognitionDensitySoon: { base: number; adaptive: number };
    cadenceHealthNow: { base: number; adaptive: number };
  };
  rest: {
    energyLow: { base: number; adaptive: number };
    stressHigh: { base: number; adaptive: number };
    complexityHigh: { base: number; adaptive: number };
  };
}

export function summarizeAdaptiveRegulation(sm: SelfModelMemoryState | null | undefined): AdaptiveRegulationSummary {
  const esc = getAdaptiveEscalationThreshold(sm);
  const defer = getAdaptiveDeferThresholds(sm);
  const rest = getAdaptiveRestThresholds(sm);
  return {
    escalationThreshold: {
      base: BASE_ESCALATION_THRESHOLD, adaptive: esc,
      delta: round1(esc - BASE_ESCALATION_THRESHOLD),
    },
    defer: {
      fragmentationRiskNow: { base: BASE_DEFER_THRESHOLDS.fragmentationRiskNow, adaptive: defer.fragmentationRiskNow },
      cognitionDensitySoon: { base: BASE_DEFER_THRESHOLDS.cognitionDensitySoon, adaptive: defer.cognitionDensitySoon },
      cadenceHealthNow:     { base: BASE_DEFER_THRESHOLDS.cadenceHealthNow,     adaptive: defer.cadenceHealthNow },
    },
    rest: {
      energyLow:      { base: BASE_REST_THRESHOLDS.energyLow,      adaptive: rest.energyLow },
      stressHigh:     { base: BASE_REST_THRESHOLDS.stressHigh,     adaptive: rest.stressHigh },
      complexityHigh: { base: BASE_REST_THRESHOLDS.complexityHigh, adaptive: rest.complexityHigh },
    },
  };
}
