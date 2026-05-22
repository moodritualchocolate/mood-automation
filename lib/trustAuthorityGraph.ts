/**
 * TRUST & AUTHORITY GRAPH (Phase 61 — Wave 6: Cognitive Civilization)
 *
 * Within the civilization, entities come to trust — and defer to —
 * one another. The trust graph is derived from the reputation
 * economy: a wealthy entity holds authority; a poorer one defers.
 * Authority that is too concentrated is itself a risk.
 */

import type { CivilizationState } from './civilizationArchive';

export interface TrustAuthorityReading {
  /** The entities holding authority (top of the reputation economy). */
  authorities: string[];
  /** The entities currently deferring (bottom of the economy). */
  deferring: string[];
  /** 0..10 — how concentrated authority has become. */
  authority_concentration: number;
  /** True when one entity holds too much authority. */
  authority_too_concentrated: boolean;
  notes: string[];
}

export function readTrustAuthority(state: CivilizationState): TrustAuthorityReading {
  const notes: string[] = [];
  const balances = Object.entries(state.reputationEconomy)
    .map(([entity, standing]) => ({ entity, standing }))
    .sort((a, b) => b.standing - a.standing);

  if (balances.length < 3) {
    return {
      authorities: [], deferring: [], authority_concentration: 0,
      authority_too_concentrated: false,
      notes: ['trust & authority: the graph has not yet formed'],
    };
  }

  const total = balances.reduce((s, b) => s + b.standing, 0) || 1;
  const authorities = balances.filter((b) => b.standing >= 7).map((b) => b.entity);
  const deferring = balances.filter((b) => b.standing <= 3.5).map((b) => b.entity);

  // Concentration — the share of total standing held by the top voice.
  const topShare = balances[0].standing / total;
  const authority_concentration = round1(Math.min(10, topShare * balances.length * 3.2));
  const authority_too_concentrated = authority_concentration >= 7 && authorities.length <= 2;

  notes.push(`trust & authority: ${authorities.length} authorities, ${deferring.length} deferring, concentration ${authority_concentration}/10`);
  if (authority_too_concentrated) notes.push('WARNING: authority is over-concentrated — one voice is governing the civilization');

  return { authorities, deferring, authority_concentration, authority_too_concentrated, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
