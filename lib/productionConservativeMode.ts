/**
 * PRODUCTION CONSERVATIVE MODE (advisory, read-only)
 *
 * Pure function. Given a requested (formula, campaignMode, brutality)
 * and the Production Safety Envelope, returns whether the requested
 * combination is safe / warning / forbidden / unknown, plus a
 * conservative recommendation and an optional fallback combination.
 *
 * STRICT CONTRACT:
 *   - never auto-applies the fallback
 *   - never mutates the request
 *   - never modifies critic, pipeline, or memory
 *   - the human operator remains the final executor
 *
 * The envelope's matrix labels modes in UPPERCASE (AUTO, MINIMAL, …)
 * while /api/generate uses canonical CampaignMode strings ('Minimal',
 * 'Documentary', …). This module translates between the two so the
 * output is directly usable as a /api/generate body.
 */

import type {
  ProductionSafetyEnvelope, CellStability, SafetyTier,
} from './productionSafetyEnvelope';

// ─── canonical ↔ envelope-label translation ──────────────────

const CANONICAL_TO_LABEL: Record<string, string> = {
  Minimal:           'MINIMAL',
  Documentary:       'DOCUMENTARY',
  Emotional:         'EMOTIONAL',
  Performance:       'PERFORMANCE',
  Aggressive:        'AGGRESSIVE',
  'Product-focused': 'PRODUCT_FOCUSED',
  Luxury:            'LUXURY',
  Editorial:         'EDITORIAL',  // possible canonical not in default matrix
};
const LABEL_TO_CANONICAL: Record<string, string> = Object.fromEntries(
  Object.entries(CANONICAL_TO_LABEL).map(([k, v]) => [v, k]),
);

function canonicalToLabel(canonical: string | null | undefined): string {
  if (canonical === null || canonical === undefined) return 'AUTO';
  return CANONICAL_TO_LABEL[canonical] ?? canonical.toUpperCase();
}
function labelToCanonical(label: string | null | undefined): string | null {
  if (label === null || label === undefined || label === 'AUTO') return null;
  return LABEL_TO_CANONICAL[label] ?? label;
}

// ─── public types ─────────────────────────────────────────────

export type RecommendedAction =
  | 'proceed'
  | 'proceed-with-caution'
  | 'lower-brutality'
  | 'switch-mode'
  | 'switch-formula'
  | 'use-safe-fallback'
  | 'manual-review-required';

export interface ProductionConservativeModeInput {
  formula: string;
  campaignMode: string | null;   // canonical or null=AUTO
  brutality: number;
  envelope: ProductionSafetyEnvelope | null;
  /** 0..10 — optional supplementary signals from live observability. */
  memoryPressure?: number;
  recentRouteErrorCount?: number;
  recentRefusalRate?: number;    // 0..1
  recentLatencyMs?: number;
}

export interface ProductionConservativeMode {
  requestedCombination: {
    formula: string;
    campaignMode: string | null;
    brutality: number;
  };

  safetyTier: SafetyTier | 'unknown';
  productionReadinessScore: number;

  allowedForProduction: boolean;
  allowedForTesting: boolean;

  recommendedAction: RecommendedAction;

  safeFallback: {
    formula: string;
    campaignMode: string | null;
    brutality: number;
    reason: string;
  } | null;

  instabilityReasons: string[];

  guardrails: {
    maxRecommendedBrutality: number;
    preferredModes: string[];
    avoidedModes: string[];
    latencyCeilingMs: number;
    memoryPressureLimit: number;
    refusalTolerance: number;
  };

  advisoryNotice: string;
  reasonCodes: string[];
}

// ─── helpers ──────────────────────────────────────────────────

function findCellInTier(
  matrix: CellStability[],
  formula: string,
  modeLabel: string,
  brutality: number,
): CellStability | undefined {
  return matrix.find((c) =>
    c.formula === formula && c.mode === modeLabel && c.brutality === brutality,
  );
}

const ADVISORY_NOTICE =
  'Advisory only — this system never auto-applies fallback policies. ' +
  'The human operator remains the final executor.';

// ─── main ──────────────────────────────────────────────────────

export function computeProductionConservativeMode(
  input: ProductionConservativeModeInput,
): ProductionConservativeMode {
  const requestedCombination = {
    formula: input.formula,
    campaignMode: input.campaignMode,
    brutality: input.brutality,
  };
  const reasonCodes: string[] = [
    `requested:${input.formula}/${input.campaignMode ?? 'AUTO'}/b=${input.brutality}`,
  ];
  const instabilityReasons: string[] = [];

  // ── 1. No envelope → cannot judge ──────────────────────────
  if (!input.envelope) {
    reasonCodes.push('envelope-missing');
    instabilityReasons.push('no production safety envelope available');
    return {
      requestedCombination,
      safetyTier: 'unknown',
      productionReadinessScore: 0,
      allowedForProduction: false,
      allowedForTesting: false,
      recommendedAction: 'manual-review-required',
      safeFallback: null,
      instabilityReasons,
      guardrails: {
        maxRecommendedBrutality: 0.5,
        preferredModes: [],
        avoidedModes: [],
        latencyCeilingMs: 30000,
        memoryPressureLimit: 0,
        refusalTolerance: 0,
      },
      advisoryNotice: ADVISORY_NOTICE,
      reasonCodes,
    };
  }

  const env = input.envelope;
  const modeLabel = canonicalToLabel(input.campaignMode);

  // ── 2. Locate the requested cell in the tiered matrices ────
  const safeCell      = findCellInTier(env.SAFE_PRODUCTION_MATRIX,    input.formula, modeLabel, input.brutality);
  const warningCell   = findCellInTier(env.WARNING_MATRIX,            input.formula, modeLabel, input.brutality);
  const forbiddenCell = findCellInTier(env.FORBIDDEN_MATRIX,          input.formula, modeLabel, input.brutality);
  let cell: CellStability | undefined;
  let safetyTier: SafetyTier | 'unknown' = 'unknown';
  if (safeCell)      { cell = safeCell;      safetyTier = 'safe'; }
  else if (warningCell) { cell = warningCell;   safetyTier = 'warning'; }
  else if (forbiddenCell) { cell = forbiddenCell; safetyTier = 'forbidden'; }

  reasonCodes.push(`tier:${safetyTier}`);
  if (cell) {
    reasonCodes.push(`cell-stability:${cell.stabilityScore}`);
    for (const r of cell.warningReasons) instabilityReasons.push(r);
    for (const r of cell.riskReasons) instabilityReasons.push(r);
  } else {
    instabilityReasons.push('requested combination is not present in the envelope matrices');
  }

  // ── 3. Build guardrails from envelope ─────────────────────
  const safeModesLabels      = env.modeStability.filter((r) => r.safetyTier === 'safe').map((r) => r.key);
  const forbiddenModesLabels = env.modeStability.filter((r) => r.safetyTier === 'forbidden').map((r) => r.key);
  const guardrails: ProductionConservativeMode['guardrails'] = {
    maxRecommendedBrutality: env.recommendedRuntimePolicy.maxAllowedBrutality,
    preferredModes: safeModesLabels.map((l) => labelToCanonical(l) ?? l),
    avoidedModes: forbiddenModesLabels.map((l) => labelToCanonical(l) ?? l),
    latencyCeilingMs: env.recommendedRuntimePolicy.latencyGuardrails.p95CeilingMs,
    memoryPressureLimit: env.recommendedRuntimePolicy.memoryPressureGuardrails.maxBytesGrowthPerRun,
    refusalTolerance: env.recommendedRuntimePolicy.refusalEscalationRules.maxAllowedRefusalRate,
  };

  // ── 4. Compute fallback. Prefer envelope's safe default; if
  //       envelope has no SAFE cells, use the best WARNING cell
  //       and clearly mark it as a degraded fallback. ─────────
  let safeFallback: ProductionConservativeMode['safeFallback'] = null;
  if (env.SAFE_PRODUCTION_MATRIX.length > 0) {
    const defaultPick = env.recommendedRuntimePolicy.defaultProductionMode;
    safeFallback = {
      formula: defaultPick.formula,
      campaignMode: defaultPick.mode === null ? null : labelToCanonical(defaultPick.mode),
      brutality: defaultPick.brutality,
      reason: 'envelope-default safe production mode',
    };
  } else if (env.WARNING_MATRIX.length > 0) {
    // No SAFE cells exist yet — name the best WARNING cell explicitly.
    const best = [...env.WARNING_MATRIX].sort((a, b) =>
      b.stabilityScore - a.stabilityScore || a.cellLatencyMs - b.cellLatencyMs,
    )[0];
    safeFallback = {
      formula: best.formula,
      campaignMode: best.mode === 'AUTO' ? null : labelToCanonical(best.mode),
      brutality: best.brutality,
      reason: 'best available warning fallback (envelope has no SAFE cells yet)',
    };
    instabilityReasons.push('envelope has 0 SAFE cells — fallback is the best WARNING cell, not a safe choice');
    reasonCodes.push('no-safe-cells-in-envelope');
  } else {
    // Truly empty envelope.
    instabilityReasons.push('envelope contains neither SAFE nor WARNING cells');
    reasonCodes.push('empty-envelope');
  }

  // ── 5. Decide the recommended action ───────────────────────
  let recommendedAction: RecommendedAction;
  switch (safetyTier) {
    case 'safe':
      recommendedAction = 'proceed';
      break;
    case 'warning':
      if (input.brutality > guardrails.maxRecommendedBrutality) {
        recommendedAction = 'lower-brutality';
        instabilityReasons.push(
          `brutality ${input.brutality} exceeds maxRecommendedBrutality ${guardrails.maxRecommendedBrutality}`,
        );
      } else if (input.campaignMode !== null && guardrails.avoidedModes.includes(input.campaignMode)) {
        recommendedAction = 'switch-mode';
        instabilityReasons.push(
          `requested mode ${input.campaignMode} is in avoidedModes`,
        );
      } else {
        recommendedAction = 'proceed-with-caution';
      }
      break;
    case 'forbidden':
      recommendedAction = safeFallback ? 'use-safe-fallback' : 'manual-review-required';
      break;
    case 'unknown':
    default:
      recommendedAction = 'manual-review-required';
  }

  // ── 6. Production / testing allowance ──────────────────────
  const allowedForProduction = safetyTier === 'safe';
  const allowedForTesting = safetyTier === 'safe' || safetyTier === 'warning';

  // ── 7. Supplementary live-signal nudges (advisory) ─────────
  if (typeof input.memoryPressure === 'number' && input.memoryPressure >= 7) {
    instabilityReasons.push(`live memoryPressure ${input.memoryPressure}/10`);
    reasonCodes.push(`live-memory-pressure:${input.memoryPressure}`);
  }
  if (typeof input.recentRouteErrorCount === 'number' && input.recentRouteErrorCount > 0) {
    instabilityReasons.push(`recent route errors: ${input.recentRouteErrorCount}`);
    reasonCodes.push(`live-route-errors:${input.recentRouteErrorCount}`);
  }
  if (typeof input.recentRefusalRate === 'number' && input.recentRefusalRate > guardrails.refusalTolerance) {
    instabilityReasons.push(
      `recent refusal rate ${input.recentRefusalRate.toFixed(2)} exceeds tolerance ${guardrails.refusalTolerance}`,
    );
    reasonCodes.push(`live-refusal-rate:${input.recentRefusalRate.toFixed(2)}`);
  }
  if (typeof input.recentLatencyMs === 'number' && input.recentLatencyMs > guardrails.latencyCeilingMs) {
    instabilityReasons.push(
      `recent latency ${input.recentLatencyMs}ms exceeds ceiling ${guardrails.latencyCeilingMs}ms`,
    );
    reasonCodes.push(`live-latency:${input.recentLatencyMs}`);
  }

  // ── 8. Production readiness — inherit envelope's score ─────
  const productionReadinessScore = env.productionReadinessScore;
  reasonCodes.push(`envelope-readiness:${productionReadinessScore}/10`);
  reasonCodes.push(`action:${recommendedAction}`);

  return {
    requestedCombination,
    safetyTier,
    productionReadinessScore,
    allowedForProduction,
    allowedForTesting,
    recommendedAction,
    safeFallback,
    instabilityReasons,
    guardrails,
    advisoryNotice: ADVISORY_NOTICE,
    reasonCodes,
  };
}
