/**
 * IDENTITY DRIFT RECOVERY PROTOCOL (Phase 377 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The concrete sequence of moves to recover from a detected drift.
 */

export interface IdentityDriftRecoveryProtocolReading {
  /** True when the recovery protocol is executing. */
  executing: boolean;
  /** Steps in the protocol. */
  protocol_steps: string[];
  notes: string[];
}

export interface IdentityDriftRecoveryProtocolInput {
  driftPresent: boolean;
  driftSevere: boolean;
}

export function readIdentityDriftRecoveryProtocol(input: IdentityDriftRecoveryProtocolInput): IdentityDriftRecoveryProtocolReading {
  const { driftPresent, driftSevere } = input;
  const notes: string[] = [];

  const protocol_steps: string[] = [];
  if (driftPresent) {
    protocol_steps.push('pause action');
    protocol_steps.push('recall founding identity');
    protocol_steps.push('verify invariants');
    if (driftSevere) protocol_steps.push('reset narrative origin');
  }

  const executing = driftPresent;

  notes.push(`identity drift recovery protocol: ${executing ? `executing ${protocol_steps.length} step(s)` : 'standby'}`);
  return { executing, protocol_steps, notes };
}
