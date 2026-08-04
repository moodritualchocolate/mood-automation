/**
 * REACTIVE BEHAVIOR DETECTOR (Phase 339 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Reactive behavior = the brand being driven by reaction rather than
 * by its own decision. This detector catches reactivity.
 */

export interface ReactiveBehaviorReading {
  /** True when the brand is acting reactively. */
  is_reactive: boolean;
  /** 0..10 — strength of reactivity. */
  reactivity_score: number;
  notes: string[];
}

export interface ReactiveBehaviorInput {
  triggeredByExternalEvent: boolean;
  followingTrendInstead: boolean;
  identityDriven: boolean;
}

export function readReactiveBehaviorDetector(input: ReactiveBehaviorInput): ReactiveBehaviorReading {
  const { triggeredByExternalEvent, followingTrendInstead, identityDriven } = input;
  const notes: string[] = [];

  let reactivity_score = 0;
  if (triggeredByExternalEvent) reactivity_score += 3;
  if (followingTrendInstead) reactivity_score += 4;
  if (!identityDriven) reactivity_score += 3;
  reactivity_score = round1(Math.min(10, reactivity_score));

  const is_reactive = reactivity_score >= 5 && !identityDriven;

  notes.push(`reactive behavior detector: ${is_reactive ? 'REACTIVE' : 'sovereign'} (${reactivity_score}/10)`);
  return { is_reactive, reactivity_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
