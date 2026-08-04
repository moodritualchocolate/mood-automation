/**
 * BELIEF PERSISTENCE LAYER (Phase 58 — Wave 6: Cognitive Civilization)
 *
 * A civilization inherits its successful beliefs. When the same
 * judgement is reached and vindicated across generations, it stops
 * being a decision and becomes a BELIEF — a thing the civilization
 * holds true without re-deriving it each time.
 */

import type { CivilizationState, CivBelief } from './civilizationArchive';

export interface BeliefPersistenceReading {
  /** The beliefs the civilization currently holds, strongest first. */
  held_beliefs: CivBelief[];
  /** The single load-bearing belief, if any. */
  core_belief: CivBelief | null;
  /** 0..10 — how strong the civilization's belief structure is. */
  belief_structure_strength: number;
  notes: string[];
}

export function readBeliefPersistence(state: CivilizationState): BeliefPersistenceReading {
  const notes: string[] = [];
  const held_beliefs = [...state.beliefs].sort((a, b) => b.strength - a.strength);
  const core_belief = held_beliefs[0] ?? null;

  const belief_structure_strength = round1(Math.min(10,
    held_beliefs.reduce((s, b) => s + b.strength, 0) / 5));

  if (core_belief) {
    notes.push(`belief persistence: core belief — "${core_belief.statement}" (strength ${core_belief.strength}/10, reinforced ×${core_belief.timesReinforced})`);
  } else {
    notes.push('belief persistence: the civilization has not yet inherited a belief');
  }

  return { held_beliefs, core_belief, belief_structure_strength, notes };
}

/**
 * Reinforce a belief — or, if it is new, found it. A belief that keeps
 * being reinforced grows in strength; the civilization inherits it.
 */
export function reinforceBelief(state: CivilizationState, statement: string): CivilizationState {
  const id = statement.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 48);
  const existing = state.beliefs.find((b) => b.id === id);
  if (existing) {
    existing.timesReinforced += 1;
    existing.strength = Math.min(10, Math.round((existing.strength + 1.2) * 10) / 10);
  } else {
    state.beliefs.push({
      id, statement,
      strength: 3,
      bornGeneration: state.generation,
      timesReinforced: 1,
    });
  }
  return state;
}

/** Weaken beliefs that have not been reinforced — unheld beliefs fade. */
export function decayUnheldBeliefs(state: CivilizationState): CivilizationState {
  for (const b of state.beliefs) {
    if (state.generation - b.bornGeneration > 6 && b.timesReinforced < 3) {
      b.strength = Math.max(0, Math.round((b.strength - 0.5) * 10) / 10);
    }
  }
  state.beliefs = state.beliefs.filter((b) => b.strength > 0.5);
  return state;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
