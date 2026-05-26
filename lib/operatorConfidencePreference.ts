/**
 * OPERATOR CONFIDENCE PREFERENCE
 *
 * Pure deterministic helper. Translates operator-set confidence-weight
 * sliders (0..100 per projection type) into HUMAN-READABLE labels.
 *
 * STRICTLY visual overlay:
 *   - never applied to raw projection scores
 *   - never applied to branch rankings
 *   - never read by critic / verdict / generation
 *   - never read by campaign evolution or autonomous paths
 *   - exists only to annotate operator interpretation
 *
 * Operator slider = "how much should I personally trust this
 *   projection type when reviewing it" — NOT "how much should
 *   the system trust it."
 *
 * Imports: only types. No critic / pipeline imports.
 */

// ─── known projection types ───────────────────────────────────

export const KNOWN_PROJECTION_TYPES = [
  'trust-optimal',
  'fatigue-recovery',
  'novelty-led',
  'proof-led',
  'aggressive-performance',
  'premium-restraint',
  'culture-synchronized',
  'audience-mirror',
] as const;

export type KnownProjectionType = (typeof KNOWN_PROJECTION_TYPES)[number];

export function isKnownProjectionType(t: string): t is KnownProjectionType {
  return (KNOWN_PROJECTION_TYPES as readonly string[]).includes(t);
}

// ─── shape ─────────────────────────────────────────────────────

export interface OperatorPreference {
  operatorId: string;
  projectionType: KnownProjectionType;
  confidenceWeight: number;    // 0..100 (slider percent)
  reasonNote: string | null;
  updatedAt: number;
}

export type ConfidenceLabel =
  | 'very-low'
  | 'low'
  | 'medium'
  | 'medium-high'
  | 'high';

export interface InterpretedPreference {
  operatorId: string;
  projectionType: KnownProjectionType;
  confidenceWeight: number;
  confidenceLabel: ConfidenceLabel;
  interpretation: string;        // "Operator should read this as medium-high confidence."
  reasonNote: string | null;
  updatedAt: number;
}

// ─── pure derivations ─────────────────────────────────────────

export function clampWeight(weight: number): number {
  if (!Number.isFinite(weight)) return 50;
  if (weight < 0) return 0;
  if (weight > 100) return 100;
  return Math.round(weight);
}

export function labelForWeight(weight: number): ConfidenceLabel {
  const w = clampWeight(weight);
  if (w <= 20) return 'very-low';
  if (w <= 40) return 'low';
  if (w <= 60) return 'medium';
  if (w <= 80) return 'medium-high';
  return 'high';
}

export function interpretationForLabel(label: ConfidenceLabel): string {
  switch (label) {
    case 'very-low':    return 'Operator should read this as very-low confidence.';
    case 'low':         return 'Operator should read this as low confidence.';
    case 'medium':      return 'Operator should read this as medium confidence.';
    case 'medium-high': return 'Operator should read this as medium-high confidence.';
    case 'high':        return 'Operator should read this as high confidence.';
  }
}

export function preferenceKey(operatorId: string, projectionType: KnownProjectionType): string {
  return `${operatorId}|${projectionType}`;
}

export function interpretPreference(p: OperatorPreference): InterpretedPreference {
  const label = labelForWeight(p.confidenceWeight);
  return {
    operatorId: p.operatorId,
    projectionType: p.projectionType,
    confidenceWeight: clampWeight(p.confidenceWeight),
    confidenceLabel: label,
    interpretation: interpretationForLabel(label),
    reasonNote: p.reasonNote,
    updatedAt: p.updatedAt,
  };
}

/** Default neutral preference (50% medium) for any projection type
 *  the operator hasn't set yet. Pure — same inputs → same defaults. */
export function defaultPreference(
  operatorId: string, projectionType: KnownProjectionType, at: number,
): OperatorPreference {
  return {
    operatorId,
    projectionType,
    confidenceWeight: 50,
    reasonNote: null,
    updatedAt: at,
  };
}
