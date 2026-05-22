/**
 * SOCIAL EXHAUSTION DETECTOR (Phase 142 — Wave 10: Reality Coupling Architecture)
 *
 * Sometimes the whole collective is simply tired. This detector reads
 * the world-state for the signature of social exhaustion — the
 * condition where the right move is not a better banner but no banner
 * at all.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface SocialExhaustionReading {
  /** 0..10 — how exhausted the collective is. */
  social_exhaustion: number;
  /** True when the world is exhausted enough that silence is the move. */
  world_is_exhausted: boolean;
  exhaustion_source: string;
  notes: string[];
}

export interface SocialExhaustionInput {
  worldState: ExecutiveWorldState;
}

export function detectSocialExhaustion(input: SocialExhaustionInput): SocialExhaustionReading {
  const { worldState } = input;
  const notes: string[] = [];

  let social_exhaustion = 0;
  social_exhaustion += worldState.collective_exhaustion * 0.4;
  social_exhaustion += worldState.anxiety_pressure * 0.2;
  social_exhaustion += worldState.digital_overload * 0.2;
  social_exhaustion += worldState.loneliness_index * 0.2;
  social_exhaustion = round1(Math.min(10, social_exhaustion));

  const world_is_exhausted = social_exhaustion >= 7;

  const sources: Array<[string, number]> = [
    ['collective exhaustion', worldState.collective_exhaustion],
    ['anxiety pressure', worldState.anxiety_pressure],
    ['digital overload', worldState.digital_overload],
    ['loneliness', worldState.loneliness_index],
  ];
  const exhaustion_source = [...sources].sort((a, b) => b[1] - a[1])[0][0];

  notes.push(`social exhaustion detector: ${social_exhaustion}/10` +
    (world_is_exhausted ? ` — THE WORLD IS EXHAUSTED (${exhaustion_source})` : ''));
  return { social_exhaustion, world_is_exhausted, exhaustion_source, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
