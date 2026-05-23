/**
 * LIVING REPUTATION FIELD (Phase 270 — Wave 14: Live Civilization Coupling)
 *
 * Reputation is not a static score but a living field, constantly
 * being shaped by what the organism is and is not doing right now.
 * This module reads its instantaneous state.
 */

export type ReputationFieldState = 'consolidating' | 'stable' | 'eroding' | 'volatile';

export interface LivingReputationFieldReading {
  field_state: ReputationFieldState;
  /** 0..10 — current living reputation. */
  living_reputation: number;
  /** True when the field is in a healthy shape right now. */
  field_is_healthy: boolean;
  notes: string[];
}

export interface LivingReputationFieldInput {
  /** 0..10 — living reputation carried in the state. */
  priorReputation: number;
  /** -10..10 — instantaneous trust shift. */
  liveTrustShift: number;
  /** True when sentiment is polarised (volatility). */
  fieldPolarised: boolean;
}

export function readLivingReputationField(input: LivingReputationFieldInput): LivingReputationFieldReading {
  const { priorReputation, liveTrustShift, fieldPolarised } = input;
  const notes: string[] = [];

  const living_reputation = round1(Math.max(0, Math.min(10, priorReputation + liveTrustShift * 0.4)));

  const field_state: ReputationFieldState =
    fieldPolarised ? 'volatile' :
    liveTrustShift >= 0.5 ? 'consolidating' :
    liveTrustShift <= -0.5 ? 'eroding' : 'stable';

  const field_is_healthy = field_state === 'consolidating' || field_state === 'stable';

  notes.push(`living reputation field: ${field_state} (${living_reputation}/10)`);
  return { field_state, living_reputation, field_is_healthy, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
