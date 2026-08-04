/**
 * INTERNAL REPUTATION ECONOMY (Phase 60 — Wave 6: Cognitive Civilization)
 *
 * Wave 5's reputation system tracked accuracy. Wave 6 turns it into an
 * ECONOMY — standing is a resource. An entity that has been right
 * holds capital; when it objects, that capital gives its objection
 * weight. An entity that has spent its standing on losing positions
 * is, for a time, poorer.
 */

import type { CivilizationState } from './civilizationArchive';
import type { EntityOpinion, CouncilEntityId } from './councilTypes';

export interface ReputationEconomyReading {
  /** Entity standing balances, richest first. */
  balances: Array<{ entity: string; standing: number }>;
  /** The wealthiest entity — the civilization's most-trusted voice. */
  wealthiest: string | null;
  /** The poorest entity — the most-overruled voice. */
  poorest: string | null;
  /** 0..10 — how unequal the reputation economy has become. */
  inequality: number;
  notes: string[];
}

export function readReputationEconomy(state: CivilizationState): ReputationEconomyReading {
  const notes: string[] = [];
  const balances = Object.entries(state.reputationEconomy)
    .map(([entity, standing]) => ({ entity, standing: round1(standing) }))
    .sort((a, b) => b.standing - a.standing);

  if (balances.length < 2) {
    return {
      balances, wealthiest: null, poorest: null, inequality: 0,
      notes: ['reputation economy: the economy has not yet formed'],
    };
  }

  const wealthiest = balances[0].entity;
  const poorest = balances[balances.length - 1].entity;
  const inequality = round1(Math.min(10, Math.abs(balances[0].standing - balances[balances.length - 1].standing)));

  notes.push(`reputation economy: wealthiest "${wealthiest}", poorest "${poorest}", inequality ${inequality}/10`);
  return { balances, wealthiest, poorest, inequality, notes };
}

/**
 * Settle the economy after a council session — entities whose stance
 * matched the outcome earn standing; those who opposed it spend some.
 */
export function settleReputationEconomy(
  state: CivilizationState,
  opinions: EntityOpinion[],
  finalOutcomeWasProceed: boolean,
): CivilizationState {
  for (const o of opinions) {
    const key = o.entity as CouncilEntityId;
    const current = state.reputationEconomy[key] ?? 5;
    let delta = 0;
    if (o.stance === 'advocate') delta = finalOutcomeWasProceed ? 0.4 : -0.5;
    else if (o.stance === 'object') delta = finalOutcomeWasProceed ? -0.4 : 0.5;
    state.reputationEconomy[key] = Math.max(0, Math.min(10, round1(current + delta)));
  }
  return state;
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
