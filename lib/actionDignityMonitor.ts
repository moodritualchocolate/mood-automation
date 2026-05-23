/**
 * ACTION DIGNITY MONITOR (Phase 201 — Wave 12: Autonomous Action Architecture)
 *
 * An action can be authorized, justified, and well-timed, and still
 * be undignified — pleading, shouting, manipulating. This monitor
 * holds execution to the dignity the brand has always carried.
 */

export interface ActionDignityReading {
  /** True when the action carries the brand's dignity. */
  action_is_dignified: boolean;
  /** 0..10 — dignity of the action. */
  dignity_score: number;
  dignity_breach: string | null;
  notes: string[];
}

export interface ActionDignityInput {
  /** True when the action pleads for attention. */
  pleadsForAttention: boolean;
  /** True when the action manipulates rather than invites. */
  manipulates: boolean;
  /** True when the action raises its voice to compete. */
  raisesVoice: boolean;
  /** True when the action is still and self-possessed. */
  selfPossessed: boolean;
}

export function readActionDignityMonitor(input: ActionDignityInput): ActionDignityReading {
  const { pleadsForAttention, manipulates, raisesVoice, selfPossessed } = input;
  const notes: string[] = [];

  let dignity_score = selfPossessed ? 8 : 5;
  if (pleadsForAttention) dignity_score -= 3;
  if (manipulates) dignity_score -= 4;
  if (raisesVoice) dignity_score -= 2.5;
  dignity_score = round1(Math.max(0, Math.min(10, dignity_score)));

  const action_is_dignified = dignity_score >= 6 && !manipulates;

  const dignity_breach =
    manipulates ? 'the action manipulates instead of inviting — a breach of dignity'
    : pleadsForAttention ? 'the action pleads for attention — beneath the brand'
    : raisesVoice ? 'the action raises its voice to compete — the brand does not shout'
    : null;

  notes.push(`action dignity monitor: ${action_is_dignified ? 'dignified' : 'UNDIGNIFIED'} (${dignity_score}/10)` +
    (dignity_breach ? ` — ${dignity_breach}` : ''));
  return { action_is_dignified, dignity_score, dignity_breach, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
