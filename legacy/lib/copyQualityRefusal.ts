/**
 * COPY-QUALITY REFUSAL (feature-flagged)
 *
 * Pure deterministic decision helper. Given a request flag,
 * brutality, copy-quality signal, and the critic's current verdict,
 * decides whether to promote a copy-quality failure into a refusal
 * reason on the finalVerdict.
 *
 * FIRST intentional consumption of the copyQuality signal. Strictly
 * opt-in:
 *
 *   - `enabled` must be true (default: false)
 *   - `brutality` must be ≥ COPY_QUALITY_BRUTALITY_THRESHOLD (0.8)
 *   - `copyQuality.copyIntegrity` must be < COPY_QUALITY_INTEGRITY_THRESHOLD (4.0)
 *
 * When triggered:
 *   - the suggested reason `copy-quality-threshold` is APPENDED to
 *     finalVerdict.reasons (never replaces existing reasons)
 *   - a clear note line is APPENDED to finalVerdict.notes
 *   - an `approve` verdict is promoted to `reject-concept`; any
 *     existing rejection verdict is preserved as-is
 *
 * When NOT triggered: returns the original verdict unchanged.
 *
 * Synchronous. No I/O. No external execution.
 */

import type { CopyQualityAxis } from './copyQualityAdapter';
import type { FinalVerdict } from '@/core/types';

export const COPY_QUALITY_BRUTALITY_THRESHOLD = 0.8;
export const COPY_QUALITY_INTEGRITY_THRESHOLD = 4.0;

export interface CopyQualityRefusalInput {
  /** Feature flag — must be exactly `true` to enable. */
  enabled: boolean;
  /** Effective brutality used by the meta-critic (0..1). */
  brutality: number;
  /** Read-only copy-quality signal; may be null/undefined. */
  copyQuality: CopyQualityAxis | null | undefined;
  /** Current finalVerdict.verdict before the refusal layer. */
  currentVerdict: FinalVerdict['verdict'];
}

export interface CopyQualityRefusalDecision {
  triggered: boolean;
  refusalReason: string | null;
  refusalNote: string | null;
  nextVerdict: FinalVerdict['verdict'];
  /** Audit codes describing why the decision landed where it did. */
  reasonCodes: string[];
}

export function evaluateCopyQualityRefusal(
  input: CopyQualityRefusalInput,
): CopyQualityRefusalDecision {
  const codes: string[] = [];
  const passThrough = (code: string): CopyQualityRefusalDecision => ({
    triggered: false,
    refusalReason: null,
    refusalNote: null,
    nextVerdict: input.currentVerdict,
    reasonCodes: [...codes, code],
  });

  if (input.enabled !== true) return passThrough('flag-disabled');
  codes.push('flag-enabled');

  if (input.brutality < COPY_QUALITY_BRUTALITY_THRESHOLD) {
    return passThrough(`brutality-${input.brutality.toFixed(2)}-below-${COPY_QUALITY_BRUTALITY_THRESHOLD}`);
  }
  codes.push(`brutality-${input.brutality.toFixed(2)}-at-or-above-${COPY_QUALITY_BRUTALITY_THRESHOLD}`);

  if (!input.copyQuality) return passThrough('no-copyQuality-signal');
  codes.push('copyQuality-present');

  if (input.copyQuality.copyIntegrity >= COPY_QUALITY_INTEGRITY_THRESHOLD) {
    return passThrough(`integrity-${input.copyQuality.copyIntegrity.toFixed(1)}-at-or-above-${COPY_QUALITY_INTEGRITY_THRESHOLD}`);
  }
  codes.push(`integrity-${input.copyQuality.copyIntegrity.toFixed(1)}-below-${COPY_QUALITY_INTEGRITY_THRESHOLD}`);

  // Triggered. Append-only mutation: existing reasons + verdict preserved
  // except for `approve`, which is promoted to `reject-concept`.
  const refusalReason = 'copy-quality-threshold';
  const refusalNote =
    `[copy-quality-refusal] brutal mode rejected copy integrity below ${COPY_QUALITY_INTEGRITY_THRESHOLD.toFixed(1)}/10`;
  const nextVerdict: FinalVerdict['verdict'] =
    input.currentVerdict === 'approve' ? 'reject-concept' : input.currentVerdict;

  codes.push(`verdict-transition:${input.currentVerdict}->${nextVerdict}`);

  return {
    triggered: true,
    refusalReason,
    refusalNote,
    nextVerdict,
    reasonCodes: codes,
  };
}
