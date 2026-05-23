/**
 * OVERREACH DETECTOR (Phase 203 — Wave 12: Autonomous Action Architecture)
 *
 * Ambition is good; overreach is ambition without the ground to stand
 * on. This detector flags when an action reaches past what the
 * organism's trust, capacity, and standing can actually support.
 */

export interface OverReachReading {
  /** True when the action overreaches what the organism can support. */
  is_overreaching: boolean;
  /** 0..10 — the gap between the action's reach and the organism's grasp. */
  reach_gap: number;
  overreach_note: string;
  notes: string[];
}

export interface OverReachInput {
  /** 0..10 — how ambitious the action's reach is. */
  ambitionLevel: number;
  /** 0..10 — trust available to support it. */
  trustLevel: number;
  /** 0..10 — execution capacity available. */
  capacity: number;
  /** 0..10 — reputation standing. */
  reputationCredit: number;
}

export function readOverReachDetector(input: OverReachInput): OverReachReading {
  const { ambitionLevel, trustLevel, capacity, reputationCredit } = input;
  const notes: string[] = [];

  const grasp = (trustLevel + capacity + reputationCredit) / 3;
  const reach_gap = round1(Math.max(0, Math.min(10, ambitionLevel - grasp)));

  const is_overreaching = reach_gap >= 3.5;

  const overreach_note = !is_overreaching
    ? 'the action reaches within the organism\'s grasp — ambition is grounded'
    : reach_gap >= 6
      ? 'severe overreach — the action reaches far past what trust and standing can hold'
      : 'mild overreach — the action reaches a little past its ground; scale it back';

  notes.push(`overreach detector: ${is_overreaching ? 'OVERREACH' : 'grounded'} (reach gap ${reach_gap}/10) — ${overreach_note}`);
  return { is_overreaching, reach_gap, overreach_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
