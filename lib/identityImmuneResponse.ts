/**
 * IDENTITY IMMUNE RESPONSE (Phase 335 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The active response when the immune system detects a foreign element.
 */

export interface IdentityImmuneResponseReading {
  /** True when an immune response is being executed. */
  response_executing: boolean;
  response_action: string;
  notes: string[];
}

export interface IdentityImmuneResponseInput {
  threatDetected: boolean;
  threatType: string | null;
}

export function readIdentityImmuneResponse(input: IdentityImmuneResponseInput): IdentityImmuneResponseReading {
  const { threatDetected, threatType } = input;
  const notes: string[] = [];

  const response_executing = threatDetected;
  const response_action = !threatDetected
    ? 'no immune response needed'
    : `rejecting "${threatType}" — restoring native identity`;

  notes.push(`identity immune response: ${response_action}`);
  return { response_executing, response_action, notes };
}
