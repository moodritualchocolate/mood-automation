/**
 * RESONANCE VELOCITY TRACKING (Phase 263 — Wave 14: Live Civilization Coupling)
 *
 * Resonance has speed as well as magnitude. This module tracks how
 * fast resonance is moving — whether it is accelerating, holding, or
 * decaying right now.
 */

export type ResonanceVelocityState = 'accelerating' | 'holding' | 'decaying' | 'collapsing';

export interface ResonanceVelocityReading {
  velocity_state: ResonanceVelocityState;
  /** -10..10 — instantaneous rate of resonance change. */
  velocity: number;
  notes: string[];
}

export interface ResonanceVelocityInput {
  /** 0..10 — resonance signal one cycle ago. */
  priorResonance: number;
  /** 0..10 — resonance signal now. */
  currentResonance: number;
}

export function readResonanceVelocityTracking(input: ResonanceVelocityInput): ResonanceVelocityReading {
  const { priorResonance, currentResonance } = input;
  const notes: string[] = [];

  const velocity = round1(currentResonance - priorResonance);

  const velocity_state: ResonanceVelocityState =
    velocity >= 1 ? 'accelerating' :
    velocity <= -2 ? 'collapsing' :
    velocity <= -0.5 ? 'decaying' : 'holding';

  notes.push(`resonance velocity tracking: ${velocity_state} (Δ ${velocity})`);
  return { velocity_state, velocity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
