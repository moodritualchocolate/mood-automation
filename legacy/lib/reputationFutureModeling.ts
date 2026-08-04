/**
 * REPUTATION FUTURE MODELING (Phase 155 — Wave 11: Strategic Future Intelligence)
 *
 * Reputation is an arc, not a number. This module projects that arc
 * forward — rising, plateauing, or eroding — across the long horizon.
 */

export type ReputationArc = 'rising' | 'plateau' | 'eroding';

export interface ReputationFutureReading {
  reputation_arc: ReputationArc;
  /** 0..10 — projected reputation a few cycles out. */
  projected_reputation: number;
  arc_note: string;
  notes: string[];
}

export interface ReputationFutureInput {
  /** 0..10 — current reputation credit. */
  reputationCredit: number;
  /** True when trust is forming. */
  trustForming: boolean;
  /** True when trust is decaying. */
  trustDecaying: boolean;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
}

export function modelReputationFuture(input: ReputationFutureInput): ReputationFutureReading {
  const { reputationCredit, trustForming, trustDecaying, strategicDebt } = input;
  const notes: string[] = [];

  let delta = 0;
  if (trustForming) delta += 1.5;
  if (trustDecaying) delta -= 2;
  delta -= strategicDebt * 0.3;

  const projected_reputation = round1(Math.max(0, Math.min(10, reputationCredit + delta)));

  const reputation_arc: ReputationArc =
    delta >= 0.6 ? 'rising' : delta <= -0.8 ? 'eroding' : 'plateau';

  const arc_note =
    reputation_arc === 'rising' ? 'reputation is on a rising arc — trust is compounding into standing'
    : reputation_arc === 'eroding' ? 'reputation is on an eroding arc — standing is being spent faster than earned'
    : 'reputation is holding flat — neither compounding nor eroding';

  notes.push(`reputation future modeling: ${reputation_arc} → ${projected_reputation}/10 — ${arc_note}`);
  return { reputation_arc, projected_reputation, arc_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
