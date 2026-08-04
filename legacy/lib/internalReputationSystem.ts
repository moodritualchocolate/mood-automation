/**
 * INTERNAL REPUTATION SYSTEM (Phase 53 — Wave 5)
 *
 * After the council reaches a decision, the entities are held
 * accountable. An entity whose stance ALIGNED with the final outcome
 * gains standing; one that opposed it loses a little. Over many
 * sessions the agents' personalities evolve — the council remembers
 * which voices have been worth trusting.
 *
 * Writes the persistent reputation book owned by Phase 45.
 */

import type { CouncilReputationBook, EntityReputation } from './multiAgentMemoryBias';
import type { EntityOpinion } from './councilTypes';

export interface ReputationUpdateReading {
  book: CouncilReputationBook;
  /** Entities whose standing rose this session. */
  rose: string[];
  /** Entities whose standing fell this session. */
  fell: string[];
  notes: string[];
}

export interface ReputationUpdateInput {
  book: CouncilReputationBook;
  opinions: EntityOpinion[];
  /** True when the council's final outcome was to proceed / ship. */
  finalOutcomeWasProceed: boolean;
}

function personalityOf(rep: EntityReputation): string {
  const total = rep.timesAligned + rep.timesOpposed;
  if (total < 3) return 'unproven';
  const accuracy = rep.timesAligned / total;
  if (accuracy >= 0.7) return 'trusted — repeatedly vindicated';
  if (accuracy >= 0.5) return 'balanced — sometimes right, sometimes overruled';
  if (accuracy >= 0.3) return 'contrarian — often overruled but persistent';
  return 'diminished — rarely aligned with the outcome';
}

export function updateInternalReputation(input: ReputationUpdateInput): ReputationUpdateReading {
  const { book, opinions, finalOutcomeWasProceed } = input;
  const notes: string[] = [];
  const rose: string[] = [];
  const fell: string[] = [];

  for (const o of opinions) {
    const rep = book.entities[o.entity];
    if (!rep) continue;
    rep.sessionsParticipated += 1;

    // An entity "aligned" when its stance matched the outcome.
    const advocatedProceed = o.stance === 'advocate';
    const opposedProceed = o.stance === 'object';
    let aligned: boolean | null = null;
    if (advocatedProceed) aligned = finalOutcomeWasProceed;
    else if (opposedProceed) aligned = !finalOutcomeWasProceed;
    // caution / abstain are neutral — neither aligned nor opposed.

    if (aligned === true) {
      rep.timesAligned += 1;
      const before = rep.conviction_weight;
      rep.conviction_weight = Math.min(1.5, rep.conviction_weight + 0.04);
      if (rep.conviction_weight > before) rose.push(o.entity);
    } else if (aligned === false) {
      rep.timesOpposed += 1;
      const before = rep.conviction_weight;
      rep.conviction_weight = Math.max(0.5, rep.conviction_weight - 0.05);
      if (rep.conviction_weight < before) fell.push(o.entity);
    }
    rep.conviction_weight = Math.round(rep.conviction_weight * 1000) / 1000;
    rep.personality = personalityOf(rep);
  }

  notes.push(`internal reputation updated — ${rose.length} rose, ${fell.length} fell`);
  return { book, rose, fell, notes };
}
