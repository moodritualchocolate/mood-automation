/**
 * INTERNAL POLITICAL DYNAMICS (Phase 67 — Wave 6: Cognitive Civilization)
 *
 * Where there is a society and a reputation economy, there is
 * politics. This module reads the council's coalitions — which
 * entities vote together, which form the standing opposition — and
 * whether the politics are healthy (real factions) or unhealthy (one
 * bloc with no opposition).
 */

import type { EntityOpinion } from './councilTypes';

export interface InternalPoliticalReading {
  /** The advocating coalition. */
  governing_coalition: string[];
  /** The objecting opposition. */
  opposition_bloc: string[];
  /** 0..10 — how healthy the internal politics are. */
  political_health: number;
  /** True when there is no real opposition — a one-party council. */
  one_party_state: boolean;
  notes: string[];
}

export interface InternalPoliticalInput {
  opinions: EntityOpinion[];
}

export function readInternalPoliticalDynamics(input: InternalPoliticalInput): InternalPoliticalReading {
  const { opinions } = input;
  const notes: string[] = [];

  const governing_coalition = opinions.filter((o) => o.stance === 'advocate').map((o) => o.entity);
  const opposition_bloc = opinions.filter((o) => o.stance === 'object' || o.stance === 'caution').map((o) => o.entity);

  // Healthy politics: a real opposition exists, and neither bloc is a
  // total landslide. A council with zero opposition is a one-party
  // state — politically unhealthy even when it agrees correctly.
  const one_party_state = opposition_bloc.length === 0;
  let political_health = 5;
  if (opposition_bloc.length >= 2 && governing_coalition.length >= 2) political_health += 3;
  if (one_party_state) political_health -= 4;
  if (governing_coalition.length >= 10) political_health -= 2;   // a near-total landslide
  political_health = Math.max(0, Math.min(10, political_health));

  notes.push(`internal political dynamics: governing coalition ${governing_coalition.length}, opposition ${opposition_bloc.length}, health ${political_health}/10`);
  if (one_party_state) notes.push('WARNING: a one-party council — no opposition formed; the politics are unhealthy');

  return { governing_coalition, opposition_bloc, political_health, one_party_state, notes };
}
