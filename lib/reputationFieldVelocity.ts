/**
 * REPUTATION FIELD VELOCITY (Phase 286 — Wave 14: Live Civilization Coupling)
 *
 * How fast reputation is moving through the field right now.
 */

export interface ReputationFieldVelocityReading {
  /** -10..10 — rate of reputation movement. */
  velocity: number;
  velocity_kind: 'rising' | 'falling' | 'stable';
  notes: string[];
}

export interface ReputationFieldVelocityInput {
  reputationNow: number;
  reputationEarlier: number;
}

export function readReputationFieldVelocity(input: ReputationFieldVelocityInput): ReputationFieldVelocityReading {
  const { reputationNow, reputationEarlier } = input;
  const notes: string[] = [];

  const velocity = round1(reputationNow - reputationEarlier);
  const velocity_kind = velocity >= 0.3 ? 'rising' : velocity <= -0.3 ? 'falling' : 'stable';

  notes.push(`reputation field velocity: ${velocity_kind} (Δ ${velocity})`);
  return { velocity, velocity_kind, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
