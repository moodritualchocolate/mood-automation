/**
 * INSTITUTIONAL MEMORY (Phase 56 — Wave 6: Cognitive Civilization)
 *
 * The civilization remembers its own council sessions — not the
 * banners, the GOVERNANCE: what was decided, which priority governed,
 * how earned the consensus was. Over generations this becomes the
 * institution's memory of how it has tended to think.
 */

import type { CivilizationState, InstitutionalRecord } from './civilizationArchive';

export interface InstitutionalMemoryReading {
  /** How many council sessions the institution remembers. */
  remembered_sessions: number;
  /** The priority that has governed most often across the civilization. */
  dominant_governing_priority: string | null;
  /** 0..10 — how consistently the institution has reasoned over time. */
  institutional_consistency: number;
  /** A one-line read of the institution's remembered tendency. */
  institutional_character: string;
  notes: string[];
}

export function readInstitutionalMemory(state: CivilizationState): InstitutionalMemoryReading {
  const notes: string[] = [];
  const mem = state.institutionalMemory;

  if (mem.length < 3) {
    return {
      remembered_sessions: mem.length,
      dominant_governing_priority: null,
      institutional_consistency: 5,
      institutional_character: 'the institution is too young to have a remembered character',
      notes: ['institutional memory: the institution is still forming'],
    };
  }

  const priorityCounts: Record<string, number> = {};
  for (const r of mem) priorityCounts[r.governingPriority] = (priorityCounts[r.governingPriority] ?? 0) + 1;
  let dominant_governing_priority: string | null = null;
  let max = 0;
  for (const [p, c] of Object.entries(priorityCounts)) {
    if (c > max) { dominant_governing_priority = p; max = c; }
  }

  // Consistency — how concentrated the governing priority has been,
  // and how reliably consensus was earned through real tension.
  const concentration = max / mem.length;
  const earnedShare = mem.filter((r) => r.emergedFromTension).length / mem.length;
  const institutional_consistency = round1(Math.min(10, concentration * 6 + earnedShare * 4));

  const institutional_character =
    `over ${mem.length} remembered sessions the institution has governed mostly by "${dominant_governing_priority}" ` +
    `and earned its consensus through genuine tension ${Math.round(earnedShare * 100)}% of the time`;

  notes.push(`institutional memory: ${institutional_character}`);
  return {
    remembered_sessions: mem.length,
    dominant_governing_priority,
    institutional_consistency,
    institutional_character,
    notes,
  };
}

/** Append one council session to the institution's memory. */
export function recordInstitutionalMemory(
  state: CivilizationState,
  record: Omit<InstitutionalRecord, 'generation' | 'ts'>,
): CivilizationState {
  state.institutionalMemory.push({
    ...record,
    generation: state.generation,
    ts: Date.now(),
  });
  return state;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
