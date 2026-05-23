/**
 * ACTION EXISTENCE JUSTIFICATION (Phase 182 — Wave 12: Autonomous Action Architecture)
 *
 * Authorization answers "can we act?". This module answers the harder
 * Wave 12 question: "should this action exist in the world at all?"
 * An action that is permitted but adds nothing is not justified.
 */

export interface ActionExistenceReading {
  /** True when the action genuinely deserves to exist in the world. */
  action_should_exist: boolean;
  what_it_adds: string;
  justification: string;
  notes: string[];
}

export interface ActionExistenceInput {
  /** True when the action carries genuine resonance, not stimulus. */
  resonancePresent: boolean;
  /** True when the action adds meaning rather than noise. */
  addsMeaning: boolean;
  /** True when the world has room to receive it (silence not advised). */
  worldHasRoom: boolean;
  /** 0..10 — how saturated the feed the action would enter. */
  saturation: number;
}

export function readActionExistenceJustification(input: ActionExistenceInput): ActionExistenceReading {
  const { resonancePresent, addsMeaning, worldHasRoom, saturation } = input;
  const notes: string[] = [];

  const action_should_exist = resonancePresent && addsMeaning && worldHasRoom && saturation < 8;

  const what_it_adds = !addsMeaning
    ? 'nothing the world is missing — it would only add to the noise'
    : !resonancePresent
      ? 'a correct message with no resonance — technically present, emotionally absent'
      : 'a quiet, true note the feed does not already contain';

  const justification = action_should_exist
    ? 'this action should exist — it adds something real to a world with room for it'
    : saturation >= 8
      ? 'this action should not exist — the feed is already saturated, one more banner is subtraction'
      : !worldHasRoom
        ? 'this action should not exist right now — the world has no room to receive it'
        : 'this action should not exist — it adds nothing the world is missing';

  notes.push(`action existence justification: ${action_should_exist ? 'the action deserves to exist' : 'the action does not deserve to exist'} — ${justification}`);
  return { action_should_exist, what_it_adds, justification, notes };
}
