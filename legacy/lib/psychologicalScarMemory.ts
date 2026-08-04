/**
 * PSYCHOLOGICAL SCAR MEMORY (Phase 63 — Wave 6: Cognitive Civilization)
 *
 * A civilization carries scars — the wounds of past failures it has
 * sworn not to repeat. A scar is not a record; it is a felt caution.
 * An unhealed scar makes the civilization flinch from the territory
 * that wounded it.
 */

import type { CivilizationState, CivScar } from './civilizationArchive';

export interface ScarMemoryReading {
  /** The civilization's scars, most severe first. */
  scars: CivScar[];
  /** Unhealed scars still shaping behaviour. */
  active_scars: CivScar[];
  /** True when the current candidate touches an unhealed scar. */
  touches_a_scar: boolean;
  /** The scar the candidate reopens, if any. */
  reopened_scar: CivScar | null;
  notes: string[];
}

export interface ScarMemoryInput {
  state: CivilizationState;
  /** A short descriptor of the current candidate (territory + truth). */
  candidateDescriptor: string;
}

export function readScarMemory(input: ScarMemoryInput): ScarMemoryReading {
  const { state, candidateDescriptor } = input;
  const notes: string[] = [];

  const scars = [...state.scars].sort((a, b) => b.severity - a.severity);
  const active_scars = scars.filter((s) => !s.healed);

  const desc = candidateDescriptor.toLowerCase();
  let reopened_scar: CivScar | null = null;
  for (const s of active_scars) {
    const woundWords = s.wound.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 5);
    if (woundWords.some((w) => desc.includes(w))) { reopened_scar = s; break; }
  }
  const touches_a_scar = reopened_scar !== null;

  if (touches_a_scar && reopened_scar) {
    notes.push(`psychological scar: the candidate reopens an unhealed scar — "${reopened_scar.wound}" (severity ${reopened_scar.severity}/10)`);
  } else if (active_scars.length) {
    notes.push(`psychological scar: ${active_scars.length} active scar(s); the candidate is clear of them`);
  } else {
    notes.push('psychological scar: the civilization carries no unhealed scars');
  }

  return { scars, active_scars, touches_a_scar, reopened_scar, notes };
}

/** Record a new scar from a wound — a refusal, a decay, a corruption. */
export function recordScar(state: CivilizationState, wound: string, severity: number): CivilizationState {
  const id = `scar-${state.generation}-${wound.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 32)}`;
  if (state.scars.some((s) => s.id === id)) return state;
  state.scars.push({
    id, wound,
    generation: state.generation,
    severity: Math.max(0, Math.min(10, severity)),
    healed: false,
  });
  return state;
}

/** Scars heal slowly — an old wound the civilization has not reopened
 *  for many generations stops shaping its behaviour. */
export function healOldScars(state: CivilizationState): CivilizationState {
  for (const s of state.scars) {
    if (!s.healed && state.generation - s.generation > 12) s.healed = true;
  }
  return state;
}
