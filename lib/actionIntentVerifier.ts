/**
 * ACTION INTENT VERIFIER (Phase 207 — Wave 12: Autonomous Action Architecture)
 *
 * Before an action ships, this module verifies the intent behind it.
 * An action driven by genuine purpose passes; one driven by habit,
 * pressure to perform, or fear of silence does not.
 */

export type ActionIntent = 'purpose' | 'habit' | 'performance-pressure' | 'fear-of-silence';

export interface ActionIntentReading {
  verified_intent: ActionIntent;
  /** True when the intent behind the action is genuine purpose. */
  intent_is_genuine: boolean;
  intent_note: string;
  notes: string[];
}

export interface ActionIntentInput {
  /** True when the action answers a real audience need. */
  answersRealNeed: boolean;
  /** True when the action exists mainly to keep the cadence going. */
  drivenByCadence: boolean;
  /** True when the action exists to hit a metric. */
  drivenByMetric: boolean;
  /** True when the action exists because silence felt uncomfortable. */
  drivenByDiscomfortWithSilence: boolean;
}

export function readActionIntentVerifier(input: ActionIntentInput): ActionIntentReading {
  const { answersRealNeed, drivenByCadence, drivenByMetric, drivenByDiscomfortWithSilence } = input;
  const notes: string[] = [];

  const verified_intent: ActionIntent =
    drivenByDiscomfortWithSilence ? 'fear-of-silence' :
    drivenByMetric ? 'performance-pressure' :
    drivenByCadence ? 'habit' :
    answersRealNeed ? 'purpose' :
    'habit';

  const intent_is_genuine = verified_intent === 'purpose';

  const intent_note =
    verified_intent === 'purpose' ? 'the action is driven by genuine purpose — it answers a real need'
    : verified_intent === 'habit' ? 'the action is driven by habit — it exists to keep the cadence, not to serve'
    : verified_intent === 'performance-pressure' ? 'the action is driven by pressure to hit a metric'
    : 'the action is driven by discomfort with silence — it exists to fill a quiet, not a need';

  notes.push(`action intent verifier: intent is "${verified_intent}" — ${intent_note}`);
  return { verified_intent, intent_is_genuine, intent_note, notes };
}
