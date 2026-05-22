/**
 * COMPETITOR EVOLUTION SIMULATION (Phase 162 — Wave 11: Strategic Future Intelligence)
 *
 * The competitive field is not static — every other voice is evolving
 * too. This module simulates where the field is heading and whether
 * the organism's only durable answer is to differentiate harder.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface CompetitorEvolutionReading {
  competitor_trajectory: string;
  /** 0..10 — projected competitive pressure. */
  competitive_pressure: number;
  /** True when the organism must differentiate to survive the field. */
  must_differentiate: boolean;
  notes: string[];
}

export interface CompetitorEvolutionInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — how far the platform rewards noise. */
  platformDrift: number;
}

export function simulateCompetitorEvolution(input: CompetitorEvolutionInput): CompetitorEvolutionReading {
  const { worldState, platformDrift } = input;
  const notes: string[] = [];

  let competitive_pressure = 0;
  competitive_pressure += worldState.attention_chaos * 0.4;
  competitive_pressure += platformDrift * 0.4;
  competitive_pressure += worldState.digital_overload * 0.2;
  competitive_pressure = round1(Math.min(10, competitive_pressure));

  const competitor_trajectory = platformDrift >= 6.5
    ? 'the field is evolving toward louder, faster, more optimized — a race the organism cannot win on volume'
    : competitive_pressure >= 5
      ? 'the field is crowding — every voice is reaching for the same attention'
      : 'the field is stable — there is room for a distinct quiet voice';

  // The organism must differentiate when the field is racing toward
  // noise — its only durable edge is being unlike the field.
  const must_differentiate = platformDrift >= 6.5 || competitive_pressure >= 7;

  notes.push(`competitor evolution simulation: pressure ${competitive_pressure}/10 — ${competitor_trajectory}`);
  return { competitor_trajectory, competitive_pressure, must_differentiate, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
