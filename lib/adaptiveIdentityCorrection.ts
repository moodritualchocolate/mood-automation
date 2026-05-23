/**
 * ADAPTIVE IDENTITY CORRECTION (Phase 230 — Wave 13: Reality Feedback Infrastructure)
 *
 * Feedback can reveal a gap between who the organism believes it is
 * and who the world has perceived it as. This module proposes the
 * smallest correction that would close the gap — without abandoning
 * the founding self.
 */

export interface IdentityCorrectionReading {
  /** True when a correction is recommended this cycle. */
  correction_recommended: boolean;
  /** 0..10 — how large a correction is needed. */
  correction_magnitude: number;
  correction_proposal: string;
  /** True when the correction stays within founding identity. */
  correction_preserves_identity: boolean;
  notes: string[];
}

export interface IdentityCorrectionInput {
  /** 0..10 — alignment between intended and perceived identity. */
  perceivedIdentityAlignment: number;
  /** True when a meaning distortion was detected. */
  meaningDistorting: boolean;
  /** True when founding identity is still held. */
  identityHeld: boolean;
}

export function readAdaptiveIdentityCorrection(input: IdentityCorrectionInput): IdentityCorrectionReading {
  const { perceivedIdentityAlignment, meaningDistorting, identityHeld } = input;
  const notes: string[] = [];

  let correction_magnitude = (10 - perceivedIdentityAlignment) * 0.6;
  if (meaningDistorting) correction_magnitude += 2;
  correction_magnitude = round1(Math.max(0, Math.min(10, correction_magnitude)));

  const correction_recommended = correction_magnitude >= 3;

  const correction_proposal = !correction_recommended
    ? 'no correction needed — perceived identity matches the founding one'
    : correction_magnitude >= 7
      ? 'large correction needed — clarify in plain language what the brand actually means before next action'
      : 'small correction needed — keep the founding voice, but tune one ambiguous note that was misread';

  // A correction preserves identity when it tunes rather than rewrites.
  const correction_preserves_identity = identityHeld && correction_magnitude < 8;

  notes.push(`adaptive identity correction: ${correction_recommended ? 'CORRECT' : 'no correction'} ` +
    `(magnitude ${correction_magnitude}/10) — ${correction_proposal}`);
  return { correction_recommended, correction_magnitude, correction_proposal, correction_preserves_identity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
