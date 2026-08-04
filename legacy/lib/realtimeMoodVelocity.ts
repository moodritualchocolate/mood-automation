/**
 * REALTIME MOOD VELOCITY (Phase 273 — Wave 14: Live Civilization Coupling)
 *
 * How fast collective mood is changing in the live moment.
 */

export type MoodVelocityKind = 'lifting' | 'sinking' | 'holding';

export interface RealtimeMoodVelocityReading {
  velocity_kind: MoodVelocityKind;
  /** -10..10 — instantaneous rate of mood change. */
  velocity: number;
  notes: string[];
}

export interface RealtimeMoodVelocityInput {
  priorMood: number;
  currentMood: number;
}

export function readRealtimeMoodVelocity(input: RealtimeMoodVelocityInput): RealtimeMoodVelocityReading {
  const { priorMood, currentMood } = input;
  const notes: string[] = [];

  const velocity = round1(currentMood - priorMood);
  const velocity_kind: MoodVelocityKind =
    velocity >= 0.5 ? 'lifting' :
    velocity <= -0.5 ? 'sinking' : 'holding';

  notes.push(`realtime mood velocity: ${velocity_kind} (Δ ${velocity})`);
  return { velocity_kind, velocity, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
