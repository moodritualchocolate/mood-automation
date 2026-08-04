/**
 * IDEOLOGICAL MUTATION DETECTION (Phase 62 — Wave 6: Cognitive Civilization)
 *
 * A civilization can drift so far that its ideology has quietly
 * MUTATED into something its founders would not recognise. This
 * module compares the civilization's recent reasoning against its
 * deep history and detects mutation — the slow corruption of belief.
 */

import type { CivilizationState } from './civilizationArchive';

export interface IdeologicalMutationReading {
  /** True when the ideology has mutated from its founding character. */
  mutation_detected: boolean;
  /** 0..10 — how far the ideology has mutated. */
  mutation_distance: number;
  /** A description of the mutation, if any. */
  mutation_description: string;
  notes: string[];
}

export function readIdeologicalMutation(state: CivilizationState): IdeologicalMutationReading {
  const notes: string[] = [];
  const mem = state.institutionalMemory;

  if (mem.length < 8) {
    return {
      mutation_detected: false, mutation_distance: 0,
      mutation_description: 'the civilization is too young to have mutated',
      notes: ['ideological mutation: insufficient history'],
    };
  }

  // Compare the founding window (oldest third) against the recent
  // window (newest third) — what governed then vs now.
  const third = Math.floor(mem.length / 3);
  const founding = mem.slice(0, third);
  const recent = mem.slice(-third);

  const govPriority = (window: typeof mem) => {
    const counts: Record<string, number> = {};
    for (const r of window) counts[r.governingPriority] = (counts[r.governingPriority] ?? 0) + 1;
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  };
  const foundingPriority = govPriority(founding);
  const recentPriority = govPriority(recent);

  // Mutation also shows as a collapse in earned-tension — a
  // civilization that used to debate and now rubber-stamps.
  const foundingEarned = founding.filter((r) => r.emergedFromTension).length / Math.max(1, founding.length);
  const recentEarned = recent.filter((r) => r.emergedFromTension).length / Math.max(1, recent.length);
  const tensionCollapse = foundingEarned - recentEarned;

  let mutation_distance = 0;
  if (foundingPriority && recentPriority && foundingPriority !== recentPriority) mutation_distance += 4;
  if (tensionCollapse >= 0.3) mutation_distance += 4;
  const recentQuality = recent.reduce((s, r) => s + r.consensusQuality, 0) / recent.length;
  const foundingQuality = founding.reduce((s, r) => s + r.consensusQuality, 0) / founding.length;
  if (foundingQuality - recentQuality >= 2) mutation_distance += 2;
  mutation_distance = Math.min(10, mutation_distance);

  const mutation_detected = mutation_distance >= 6;
  const mutation_description = mutation_detected
    ? `the ideology has mutated — governance shifted "${foundingPriority}" → "${recentPriority}", earned-tension fell ${Math.round(tensionCollapse * 100)}%`
    : 'the ideology is consistent with the civilization\'s founding character';

  notes.push(`ideological mutation: ${mutation_description}`);
  return { mutation_detected, mutation_distance, mutation_description, notes };
}
