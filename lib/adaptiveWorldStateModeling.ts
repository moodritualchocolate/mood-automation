/**
 * ADAPTIVE WORLD-STATE MODELING (Phase 83 — Wave 7: Reality Organism)
 *
 * The organism does not merely read the world-state — it ADAPTS its
 * model of the world as the world changes. This module measures how
 * fast reality is shifting and how well the organism's model is
 * keeping up.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface AdaptiveWorldStateReading {
  /** 0..10 — how fast reality is shifting. */
  world_shift_rate: number;
  /** 0..10 — how well the organism's model tracks the shift. */
  model_fidelity: number;
  /** True when the model has fallen behind a fast-shifting reality. */
  model_lagging: boolean;
  notes: string[];
}

export interface AdaptiveWorldStateInput {
  worldState: ExecutiveWorldState;
  /** The prior persisted world-state, to measure the shift. */
  priorWorldState: ExecutiveWorldState | null;
}

export function readAdaptiveWorldStateModeling(input: AdaptiveWorldStateInput): AdaptiveWorldStateReading {
  const { worldState, priorWorldState } = input;
  const notes: string[] = [];

  if (!priorWorldState) {
    return {
      world_shift_rate: 0, model_fidelity: 7, model_lagging: false,
      notes: ['adaptive world-state modeling: no prior world-state — the model is being founded'],
    };
  }

  // The shift rate — how much the world's vital signs moved.
  const dims: Array<[number, number]> = [
    [worldState.world_tension, priorWorldState.world_tension],
    [worldState.collective_exhaustion, priorWorldState.collective_exhaustion],
    [worldState.emotional_volatility, priorWorldState.emotional_volatility],
    [worldState.attention_chaos, priorWorldState.attention_chaos],
  ];
  const totalShift = dims.reduce((s, [a, b]) => s + Math.abs(a - b), 0);
  const world_shift_rate = round1(Math.min(10, totalShift * 1.5));

  // The blended world-state model evolves slowly (65/35); a fast shift
  // means the model lags behind the true world.
  const model_fidelity = round1(Math.max(0, Math.min(10, 10 - world_shift_rate * 0.7)));
  const model_lagging = world_shift_rate >= 6 && model_fidelity < 6;

  notes.push(`adaptive world-state modeling: shift rate ${world_shift_rate}/10, model fidelity ${model_fidelity}/10`);
  if (model_lagging) notes.push('adaptive world-state modeling: the model is lagging a fast-shifting reality — the organism should observe before acting');

  return { world_shift_rate, model_fidelity, model_lagging, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
