/**
 * STRATEGIC MYTHOLOGY (Phase 59 — Wave 6: Cognitive Civilization)
 *
 * Civilizations tell themselves stories about their own past — the
 * founding refusal, the campaign that proved the identity, the time
 * the council nearly drifted and pulled itself back. These myths are
 * not records; they are the SELF-NARRATIVE the civilization governs
 * by.
 */

import type { CivilizationState, CivMyth } from './civilizationArchive';

export interface StrategicMythologyReading {
  /** The myths the civilization tells about itself. */
  myths: CivMyth[];
  /** The founding myth, if one exists. */
  founding_myth: CivMyth | null;
  /** True when the civilization has a self-narrative to govern by. */
  has_self_narrative: boolean;
  notes: string[];
}

export function readStrategicMythology(state: CivilizationState): StrategicMythologyReading {
  const notes: string[] = [];
  const myths = state.myths;
  const founding_myth = myths.length ? myths[0] : null;
  const has_self_narrative = myths.length >= 1;

  if (founding_myth) {
    notes.push(`strategic mythology: founding myth — "${founding_myth.story}"`);
  } else {
    notes.push('strategic mythology: the civilization has not yet formed a myth');
  }
  return { myths, founding_myth, has_self_narrative, notes };
}

/**
 * A decision becomes a myth when it was DEFINING — a verdict reached
 * through genuine, hard-won tension that the civilization should
 * remember as a story. Mundane decisions do not become myths.
 */
export function considerMyth(
  state: CivilizationState,
  args: { verdict: string; consciousness: number; emergedFromTension: boolean; statement: string },
): CivilizationState {
  const { verdict, consciousness, emergedFromTension, statement } = args;
  // Myths are rare — only a hard-won, highly conscious decision earns one.
  const isMythWorthy = emergedFromTension && consciousness >= 8 &&
    (verdict === 'block' || verdict === 'proceed-restrained');
  if (!isMythWorthy) return state;

  // Do not mint a second myth in quick succession — myths are sparse.
  const recentMyth = state.myths.some((m) => state.generation - m.foundingGeneration < 5);
  if (recentMyth) return state;

  const id = `myth-${state.generation}`;
  state.myths.push({
    id,
    story: `In generation ${state.generation}, the council reached "${verdict}" through genuine tension: ${statement}`,
    foundingGeneration: state.generation,
  });
  return state;
}
