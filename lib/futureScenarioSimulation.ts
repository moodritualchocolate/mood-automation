/**
 * FUTURE SCENARIO SIMULATION (Phase 151 — Wave 11: Strategic Future Intelligence)
 *
 * The organism stops reasoning about only the present moment and
 * begins simulating the futures it could be walking into — a best
 * case, a worst case, and the most likely path between them.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface FutureScenario {
  name: string;
  probability: number;    // 0..1
  desirability: number;   // 0..10
}

export interface FutureScenarioReading {
  scenarios: FutureScenario[];
  most_likely: FutureScenario;
  best_case: FutureScenario;
  worst_case: FutureScenario;
  /** 0..10 — the expected desirability across all scenarios. */
  expected_future: number;
  notes: string[];
}

export interface FutureScenarioInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — accumulated trust the organism carries forward. */
  trustCarried: number;
  /** 0..10 — the organism's vitality. */
  organismVitality: number;
}

export function simulateFutureScenarios(input: FutureScenarioInput): FutureScenarioReading {
  const { worldState, trustCarried, organismVitality } = input;
  const notes: string[] = [];

  const stress = (worldState.world_tension + worldState.collective_exhaustion) / 2;
  const base = (trustCarried * 0.5 + organismVitality * 0.5);

  const scenarios: FutureScenario[] = [
    { name: 'the campaign compounds quiet trust into lasting authority', probability: round2(0.2 + base * 0.04), desirability: round1(Math.min(10, base + 2)) },
    { name: 'the campaign holds its ground without growing', probability: 0.4, desirability: round1(Math.min(10, base * 0.7 + 2)) },
    { name: 'the campaign is eroded by noise and chasing reach', probability: round2(0.2 + stress * 0.03), desirability: round1(Math.max(0, base - 5)) },
  ];
  // Normalise probabilities.
  const total = scenarios.reduce((s, sc) => s + sc.probability, 0);
  for (const sc of scenarios) sc.probability = round2(sc.probability / total);

  const most_likely = [...scenarios].sort((a, b) => b.probability - a.probability)[0];
  const best_case = [...scenarios].sort((a, b) => b.desirability - a.desirability)[0];
  const worst_case = [...scenarios].sort((a, b) => a.desirability - b.desirability)[0];
  const expected_future = round1(scenarios.reduce((s, sc) => s + sc.probability * sc.desirability, 0));

  notes.push(`future scenario simulation: most likely "${most_likely.name}" — expected future ${expected_future}/10`);
  return { scenarios, most_likely, best_case, worst_case, expected_future, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }
