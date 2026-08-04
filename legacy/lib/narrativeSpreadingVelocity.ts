/**
 * NARRATIVE SPREADING VELOCITY (Phase 279 — Wave 14: Live Civilization Coupling)
 *
 * How fast the narrative is spreading through the field right now.
 */

export type NarrativeSpreadVelocity = 'viral' | 'spreading' | 'slow' | 'stalled';

export interface NarrativeSpreadingVelocityReading {
  spreading_velocity: NarrativeSpreadVelocity;
  /** 0..10 — speed of spread. */
  speed: number;
  notes: string[];
}

export interface NarrativeSpreadingVelocityInput {
  spreadVelocity: number;
  contagionRate: number;
}

export function readNarrativeSpreadingVelocity(input: NarrativeSpreadingVelocityInput): NarrativeSpreadingVelocityReading {
  const { spreadVelocity, contagionRate } = input;
  const notes: string[] = [];

  const speed = round1(Math.min(10, (spreadVelocity + contagionRate * 0.5)));

  const spreading_velocity: NarrativeSpreadVelocity =
    speed >= 8 ? 'viral' : speed >= 5 ? 'spreading' : speed >= 2 ? 'slow' : 'stalled';

  notes.push(`narrative spreading velocity: ${spreading_velocity} (${speed}/10)`);
  return { spreading_velocity, speed, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
