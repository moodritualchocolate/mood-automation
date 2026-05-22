/**
 * REALITY COUPLING GOVERNOR (Phase 147 — Wave 10: Reality Coupling Architecture)
 *
 * Coupling can fail in two opposite directions. Too loose, and the
 * organism is decoupled — a solipsist acting from inside itself. Too
 * tight, and it is over-coupled — addicted to feedback, twitching at
 * every external signal. The governor holds the organism in the
 * narrow healthy band between them.
 */

export type CouplingMode = 'coupled' | 'over-coupled' | 'decoupled';

export interface CouplingGovernorReading {
  coupling_mode: CouplingMode;
  /** True when the organism is coupled in the healthy band. */
  coupling_is_healthy: boolean;
  reason: string;
  notes: string[];
}

export interface CouplingGovernorInput {
  /** True when there is real external signal to couple to (Phase 131). */
  worldIsSpeaking: boolean;
  /** 0..10 — external signal volume. */
  externalSignalVolume: number;
  /** True when the organism is chasing stimulus / feedback (Phase 146). */
  isStimulusAddiction: boolean;
  feedbackIsNegative: boolean;
}

export function governRealityCoupling(input: CouplingGovernorInput): CouplingGovernorReading {
  const { worldIsSpeaking, externalSignalVolume, isStimulusAddiction, feedbackIsNegative } = input;
  const notes: string[] = [];

  let coupling_mode: CouplingMode;
  let reason: string;

  if (isStimulusAddiction) {
    coupling_mode = 'over-coupled';
    reason = 'the organism is over-coupled — it is reacting to feedback rather than learning from it';
  } else if (!worldIsSpeaking || externalSignalVolume < 2) {
    coupling_mode = 'decoupled';
    reason = 'the organism is decoupled — there is too little real signal, it is acting from inside itself';
  } else {
    coupling_mode = 'coupled';
    reason = feedbackIsNegative
      ? 'the organism is coupled and the world is pushing back — it is genuinely hearing reality'
      : 'the organism is coupled in the healthy band — learning from the world without obeying it';
  }

  const coupling_is_healthy = coupling_mode === 'coupled';

  notes.push(`reality coupling governor: ${coupling_mode} — ${reason}`);
  return { coupling_mode, coupling_is_healthy, reason, notes };
}
