/**
 * EXECUTION COHERENCE VALIDATOR (Phase 218 — Wave 12: Autonomous Action Architecture)
 *
 * The action layer is built of many sub-decisions — publish, pace,
 * route, throttle. This validator checks they agree: a publish
 * decision while silence is enforced, a full deployment while the
 * throttle is closed, are incoherences this module catches.
 */

export interface ExecutionCoherenceReading {
  /** True when the action layer's decisions agree with one another. */
  execution_is_coherent: boolean;
  incoherences: string[];
  /** 0..10 — coherence of the action layer. */
  coherence_score: number;
  notes: string[];
}

export interface ExecutionCoherenceInput {
  /** True when a publish/deploy is being decided. */
  publishing: boolean;
  /** True when silence is enforced. */
  silenceEnforced: boolean;
  /** True when the throttle permits action. */
  throttlePermitsAction: boolean;
  /** True when the action is authorized. */
  authorized: boolean;
  /** True when the action is worthy. */
  actionIsWorthy: boolean;
}

export function readExecutionCoherenceValidator(input: ExecutionCoherenceInput): ExecutionCoherenceReading {
  const { publishing, silenceEnforced, throttlePermitsAction, authorized, actionIsWorthy } = input;
  const notes: string[] = [];

  const incoherences: string[] = [];
  if (publishing && silenceEnforced) incoherences.push('publishing while silence is enforced');
  if (publishing && !throttlePermitsAction) incoherences.push('publishing while the action throttle is closed');
  if (publishing && !authorized) incoherences.push('publishing an action that was never authorized');
  if (authorized && !actionIsWorthy) incoherences.push('an authorized action that is nonetheless unworthy');

  const coherence_score = round1(Math.max(0, 10 - incoherences.length * 2.8));
  const execution_is_coherent = incoherences.length === 0;

  notes.push(`execution coherence validator: ${execution_is_coherent ? 'the action layer is coherent' : `${incoherences.length} incoherence(s) — the action layer contradicts itself`} (${coherence_score}/10)`);
  return { execution_is_coherent, incoherences, coherence_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
