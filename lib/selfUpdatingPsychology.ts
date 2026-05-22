/**
 * SELF-UPDATING PSYCHOLOGY (Phase 25)
 *
 * The mechanism by which the system RETIRES dead emotional patterns
 * and PROMOTES emerging ones. It reads the human-desire memory graph
 * and reports which patterns have decayed (high count but cold —
 * not seen recently) and which are emerging (low count but hot —
 * recently appeared and intensifying).
 *
 * This is the system's self-correction layer: it keeps the campaign
 * from continuing to lean on a truth that reality has moved past.
 */

import type { DesireMemoryEntry, HumanDesireMemoryStore } from './humanDesireMemory';

export interface SelfUpdatingPsychologyReading {
  /** Patterns that should be retired — established but gone cold. */
  retiring: DesireMemoryEntry[];
  /** Patterns that are emerging — recent and intensifying. */
  emerging: DesireMemoryEntry[];
  /** 0..10 — how much the psychology model needs updating. */
  update_pressure: number;
  notes: string[];
}

const COLD_MS = 21 * 24 * 3600 * 1000;   // not seen in 21 days = cold

export async function readSelfUpdatingPsychology(args: { store: HumanDesireMemoryStore }): Promise<SelfUpdatingPsychologyReading> {
  const { store } = args;
  const notes: string[] = [];
  const all = await store.list();
  const now = Date.now();

  const retiring = all.filter((e) => e.count >= 4 && (now - e.lastSeen) > COLD_MS);
  const emerging = all.filter((e) => e.count <= 3 && (now - e.firstSeen) < COLD_MS && e.averageIntensity >= 6);

  let update_pressure = Math.min(10, retiring.length * 2 + emerging.length * 1.5);

  if (retiring.length) notes.push(`retiring patterns: ${retiring.slice(0, 3).map((e) => e.display).join(', ')}`);
  if (emerging.length) notes.push(`emerging patterns: ${emerging.slice(0, 3).map((e) => e.display).join(', ')}`);
  if (!retiring.length && !emerging.length) notes.push('self-updating psychology: model is current — no retire / promote pressure');

  return { retiring, emerging, update_pressure, notes };
}
