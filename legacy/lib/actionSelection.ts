/**
 * ACTION SELECTION (Phase 41 — Executive Decision Runtime / Wave 4)
 *
 * Defines the executive ACTION VOCABULARY. The engine no longer only
 * generates — it chooses, from a real set of strategic actions, the
 * one this moment calls for.
 */

export type ExecutiveAction =
  | 'publish'      // ship the banner now
  | 'delay'        // the banner is sound but the moment is wrong
  | 'deepen'       // ship, and deepen the current emotional theme
  | 'reverse'      // ship, but reverse the emotional direction
  | 'continue'     // ship as a natural continuation of the arc
  | 'fragment'     // the idea is two ideas — split it
  | 'merge'        // fold this into an existing campaign thread
  | 'silence'      // do not speak — silence is the wiser move
  | 'archive'      // refuse and shelve — this should not be made
  | 'escalate';    // this is important — give it full executive energy

export interface ActionRecord {
  action: ExecutiveAction;
  is_an_output: boolean;          // does the action produce a banner?
  description: string;
}

export const ACTION_CATALOG: Record<ExecutiveAction, ActionRecord> = {
  publish:  { action: 'publish',  is_an_output: true,  description: 'ship the banner now' },
  delay:    { action: 'delay',    is_an_output: false, description: 'hold the banner — the moment is psychologically wrong' },
  deepen:   { action: 'deepen',   is_an_output: true,  description: 'ship and deepen the current emotional theme' },
  reverse:  { action: 'reverse',  is_an_output: true,  description: 'ship, but reverse the emotional direction' },
  continue: { action: 'continue', is_an_output: true,  description: 'ship as a natural continuation of the arc' },
  fragment: { action: 'fragment', is_an_output: false, description: 'the idea is two ideas — split it before shipping' },
  merge:    { action: 'merge',    is_an_output: false, description: 'fold this into an existing campaign thread' },
  silence:  { action: 'silence',  is_an_output: false, description: 'do not speak — silence is the wiser move' },
  archive:  { action: 'archive',  is_an_output: false, description: 'refuse and shelve — this should not be made' },
  escalate: { action: 'escalate', is_an_output: true,  description: 'this is important — give it full executive energy' },
};

export function describeAction(action: ExecutiveAction): string {
  return ACTION_CATALOG[action].description;
}

export function actionIsOutput(action: ExecutiveAction): boolean {
  return ACTION_CATALOG[action].is_an_output;
}
