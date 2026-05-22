/**
 * MOMENT READINESS (Phase 38 — Temporal Intelligence / Wave 4)
 *
 * Asks whether THIS moment is ready for THIS banner — combining the
 * attention window, the day's mood, and the banner's own register.
 * A beautiful banner can be rejected because the moment is not ready
 * for it.
 */

import type { AttentionWindowsReading } from './attentionWindows';
import type { PsychologicalSeasonalityReading } from './psychologicalSeasonality';

export interface MomentReadinessReading {
  /** 0..10 — how aligned the banner is with this moment. */
  moment_alignment: number;
  /** 0..10 — how psychologically ready the audience is. */
  psychological_readiness: number;
  /** True when the moment is genuinely ready for the banner. */
  moment_is_ready: boolean;
  notes: string[];
}

export interface MomentReadinessInput {
  attentionWindow: AttentionWindowsReading;
  seasonality: PsychologicalSeasonalityReading;
  /** The banner's register. */
  candidateRegister: 'soft' | 'intense' | 'neutral';
}

export function readMomentReadiness(input: MomentReadinessInput): MomentReadinessReading {
  const { attentionWindow, seasonality, candidateRegister } = input;
  const notes: string[] = [];

  // Psychological readiness — receptivity, modulated by the day.
  const psychological_readiness = round1(clamp10(
    attentionWindow.receptivity_to_truth * 0.6 + (10 - seasonality.collective_heaviness) * 0.4,
  ));

  // Alignment — a soft banner aligns with vulnerable / quiet-wanting
  // moments; an intense banner aligns with lower-vulnerability windows.
  let moment_alignment = 5;
  if (candidateRegister === 'soft') {
    moment_alignment = round1(clamp10(
      attentionWindow.emotional_vulnerability * 0.5 + seasonality.wants_quiet * 0.5,
    ));
  } else if (candidateRegister === 'intense') {
    moment_alignment = round1(clamp10(
      (10 - attentionWindow.emotional_vulnerability) * 0.5 + (10 - seasonality.wants_quiet) * 0.5,
    ));
  } else {
    moment_alignment = round1(clamp10(attentionWindow.receptivity_to_truth));
  }

  const moment_is_ready = moment_alignment >= 5 && psychological_readiness >= 4;

  notes.push(`moment readiness: alignment ${moment_alignment}/10, psychological readiness ${psychological_readiness}/10`);
  if (!moment_is_ready) notes.push(`moment readiness: the moment is not ready for a "${candidateRegister}" banner`);

  return { moment_alignment, psychological_readiness, moment_is_ready, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
