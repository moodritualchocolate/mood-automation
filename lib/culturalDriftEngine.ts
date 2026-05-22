/**
 * CULTURAL DRIFT ENGINE (Phase 57 — Wave 6: Cognitive Civilization)
 *
 * A civilization's culture drifts. Over many generations the same
 * priorities keep winning, the same kinds of decision keep being
 * reached — and that accumulation IS the civilization's culture. The
 * drift engine reads where the culture has drifted and whether the
 * drift is healthy evolution or dangerous narrowing.
 */

import type { CivilizationState } from './civilizationArchive';

export interface CulturalDriftReading {
  /** The priority the civilization's culture has drifted toward. */
  cultural_centre: string | null;
  /** 0..10 — how narrow the culture has become (10 = monoculture). */
  cultural_narrowing: number;
  /** True when the drift has become an unhealthy narrowing. */
  drift_is_narrowing: boolean;
  /** A description of the cultural drift. */
  drift_description: string;
  notes: string[];
}

export function readCulturalDrift(state: CivilizationState): CulturalDriftReading {
  const notes: string[] = [];
  const tendency = state.culturalTendency;
  const entries = Object.entries(tendency);
  const total = entries.reduce((s, [, c]) => s + c, 0);

  if (total < 4) {
    return {
      cultural_centre: null, cultural_narrowing: 0, drift_is_narrowing: false,
      drift_description: 'the civilization has not lived long enough to drift',
      notes: ['cultural drift: the culture is still forming'],
    };
  }

  let cultural_centre: string | null = null;
  let max = 0;
  for (const [p, c] of entries) {
    if (c > max) { cultural_centre = p; max = c; }
  }

  // Narrowing — how dominant the single centre is. A culture where one
  // priority wins 80%+ of the time has narrowed into a monoculture.
  const dominance = max / total;
  const cultural_narrowing = round1(Math.min(10, dominance * 12 - (entries.length - 1)));
  const drift_is_narrowing = cultural_narrowing >= 7 && entries.length <= 3;

  const drift_description = drift_is_narrowing
    ? `the culture has narrowed dangerously toward "${cultural_centre}" — ${Math.round(dominance * 100)}% of decisions`
    : `the culture has drifted toward "${cultural_centre}" but remains varied (${entries.length} priorities active)`;

  notes.push(`cultural drift: ${drift_description}`);
  if (drift_is_narrowing) notes.push('WARNING: cultural narrowing — the civilization is losing its diversity of thought');

  return { cultural_centre, cultural_narrowing, drift_is_narrowing, drift_description, notes };
}

/** Record one governing priority into the civilization's cultural tendency. */
export function recordCulturalTendency(state: CivilizationState, governingPriority: string): CivilizationState {
  state.culturalTendency[governingPriority] = (state.culturalTendency[governingPriority] ?? 0) + 1;
  return state;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
