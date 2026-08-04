/**
 * STRATEGIC CONFLICT RESOLUTION — COUNCIL (Phase 46 — Wave 5)
 *
 * Resolves the council's debate into a weighted standing. Unlike the
 * Phase 41 executive resolver (a fixed hierarchy), the council
 * resolver weighs CONVICTION — a deeply convinced minority can
 * outweigh a lukewarm majority. No single entity controls reality.
 */

import type { EntityOpinion } from './councilTypes';
import type { InternalDebateReading } from './internalDebateEngine';

export interface CouncilConflictReading {
  /** Total conviction-weighted force advocating the output. */
  advocacy_force: number;
  /** Total conviction-weighted force objecting. */
  objection_force: number;
  /** The council's standing toward the output. */
  standing: 'clear-to-proceed' | 'proceed-with-caution' | 'contested' | 'blocked';
  /** The entity whose argument carried the most weight. */
  decisive_voice: string | null;
  notes: string[];
}

export interface CouncilConflictInput {
  opinions: EntityOpinion[];
  debate: InternalDebateReading;
}

export function resolveCouncilConflict(input: CouncilConflictInput): CouncilConflictReading {
  const { opinions, debate } = input;
  const notes: string[] = [];

  let advocacy_force = 0;
  let objection_force = 0;
  for (const o of opinions) {
    if (o.stance === 'advocate') advocacy_force += o.conviction;
    else if (o.stance === 'object') objection_force += o.conviction;
    else if (o.stance === 'caution') objection_force += o.conviction * 0.4;
  }
  advocacy_force = round1(advocacy_force);
  objection_force = round1(objection_force);

  // The decisive voice — the single highest-conviction opinion.
  const decisive = [...opinions].sort((a, b) => b.conviction - a.conviction)[0] ?? null;
  const decisive_voice = decisive ? `${decisive.entity} (${decisive.stance}, conviction ${decisive.conviction})` : null;

  let standing: CouncilConflictReading['standing'];
  if (objection_force > advocacy_force + 6) standing = 'blocked';
  else if (Math.abs(advocacy_force - objection_force) <= 6) standing = 'contested';
  else if (objection_force >= 8) standing = 'proceed-with-caution';
  else standing = 'clear-to-proceed';

  notes.push(`council conflict: advocacy ${advocacy_force} vs objection ${objection_force} — standing "${standing}"`);
  if (decisive_voice) notes.push(`decisive voice: ${decisive_voice}`);
  if (debate.shallow_consensus) {
    notes.push('council conflict: the standing rests on a shallow consensus — treat the "clear" with suspicion');
  }

  return { advocacy_force, objection_force, standing, decisive_voice, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
