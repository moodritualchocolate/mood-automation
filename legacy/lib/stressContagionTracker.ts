/**
 * STRESS CONTAGION TRACKER (Phase 275 — Wave 14: Live Civilization Coupling)
 *
 * Stress spreads between people. This tracker reads whether audience
 * stress is contagious right now — whether the organism's next action
 * would add to a contagion.
 */

export interface StressContagionReading {
  /** True when stress is actively spreading among the audience. */
  stress_is_contagious: boolean;
  /** 0..10 — how fast stress is spreading. */
  contagion_rate: number;
  notes: string[];
}

export interface StressContagionInput {
  audienceStress: number;
  sentimentVariance: number;
  moodVelocity: number;
}

export function readStressContagionTracker(input: StressContagionInput): StressContagionReading {
  const { audienceStress, sentimentVariance, moodVelocity } = input;
  const notes: string[] = [];

  const contagion_rate = round1(Math.min(10, audienceStress * 0.5 + sentimentVariance * 0.3 + Math.max(0, -moodVelocity) * 0.5));
  const stress_is_contagious = contagion_rate >= 6;

  notes.push(`stress contagion tracker: ${stress_is_contagious ? 'CONTAGIOUS' : 'contained'} (rate ${contagion_rate}/10)`);
  return { stress_is_contagious, contagion_rate, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
