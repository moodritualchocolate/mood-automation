/**
 * ACTION AUTHORIZATION RUNTIME (Phase 181 — Wave 12: Autonomous Action Architecture)
 *
 * The gate every action must pass through. An action is authorized
 * only when it clears all eight strategic gates — identity, resonance,
 * trust, timing, strategic debt, audience capacity, reality coupling,
 * and long-term future preservation. One failed gate is one too many.
 */

export interface ActionAuthorizationReading {
  /** True only when every gate passes. */
  authorized: boolean;
  gates_total: number;
  gates_passed: number;
  gates_failed: string[];
  authorization_note: string;
  notes: string[];
}

export interface ActionAuthorizationInput {
  identityIntact: boolean;
  resonancePresent: boolean;
  trustAvailable: boolean;
  timingRight: boolean;
  strategicDebtContained: boolean;
  audienceHasCapacity: boolean;
  realityCouplingHealthy: boolean;
  futurePreserved: boolean;
}

export function readActionAuthorizationRuntime(input: ActionAuthorizationInput): ActionAuthorizationReading {
  const notes: string[] = [];

  const gates: Array<[string, boolean]> = [
    ['identity', input.identityIntact],
    ['resonance', input.resonancePresent],
    ['trust', input.trustAvailable],
    ['timing', input.timingRight],
    ['strategic debt', input.strategicDebtContained],
    ['audience capacity', input.audienceHasCapacity],
    ['reality coupling', input.realityCouplingHealthy],
    ['future preservation', input.futurePreserved],
  ];

  const gates_failed = gates.filter(([, ok]) => !ok).map(([name]) => name);
  const gates_passed = gates.length - gates_failed.length;
  const authorized = gates_failed.length === 0;

  const authorization_note = authorized
    ? 'every strategic gate passed — the action is authorized'
    : `authorization denied — failed gate(s): ${gates_failed.join(', ')}`;

  notes.push(`action authorization runtime: ${gates_passed}/${gates.length} gates — ${authorization_note}`);
  return {
    authorized, gates_total: gates.length, gates_passed, gates_failed, authorization_note, notes,
  };
}
