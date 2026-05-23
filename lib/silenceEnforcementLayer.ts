/**
 * SILENCE ENFORCEMENT LAYER (Phase 188 — Wave 12: Autonomous Action Architecture)
 *
 * Earlier waves can RECOMMEND silence. This layer ENFORCES it: when
 * the conditions for silence are met, it is not a suggestion the
 * action layer may override — it is a hard stop on execution.
 */

export interface SilenceEnforcementReading {
  /** True when silence is being enforced as a hard stop. */
  silence_enforced: boolean;
  enforcement_reason: string;
  /** True when a downstream layer tried to act through enforced silence. */
  silence_was_challenged: boolean;
  notes: string[];
}

export interface SilenceEnforcementInput {
  /** True when reality coupling recommends silence. */
  recommendSilence: boolean;
  /** True when the audience needs recovery. */
  audienceNeedsRecovery: boolean;
  /** 0..10 — feed saturation. */
  saturation: number;
  /** True when a publish/deploy action wants to proceed. */
  actionWantsToProceed: boolean;
}

export function readSilenceEnforcementLayer(input: SilenceEnforcementInput): SilenceEnforcementReading {
  const { recommendSilence, audienceNeedsRecovery, saturation, actionWantsToProceed } = input;
  const notes: string[] = [];

  const silence_enforced = recommendSilence || audienceNeedsRecovery || saturation >= 9;

  const enforcement_reason = !silence_enforced
    ? 'silence is not required — the action layer may proceed'
    : recommendSilence
      ? 'reality coupling calls for silence — execution is hard-stopped'
      : saturation >= 9
        ? 'the feed is fully saturated — silence is enforced, no banner may ship'
        : 'the audience is owed recovery — silence is enforced until it is given';

  // Silence was challenged when an action still wants to proceed
  // through an active enforcement.
  const silence_was_challenged = silence_enforced && actionWantsToProceed;

  notes.push(`silence enforcement layer: ${silence_enforced ? 'SILENCE ENFORCED' : 'clear to act'} — ${enforcement_reason}` +
    (silence_was_challenged ? ' (an action attempted to proceed through it)' : ''));
  return { silence_enforced, enforcement_reason, silence_was_challenged, notes };
}
