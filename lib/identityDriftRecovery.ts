/**
 * IDENTITY DRIFT RECOVERY (Phase 328 — Wave 15: Identity Preservation Under Live Reality)
 *
 * When drift is detected, this module names the recovery — the
 * concrete way the brand returns to itself. Drift detected without
 * recovery is drift accepted.
 */

export interface IdentityDriftRecoveryReading {
  /** True when a drift was detected this cycle. */
  drift_present: boolean;
  /** True when a recovery is being executed. */
  recovery_in_progress: boolean;
  recovery_action: string;
  notes: string[];
}

export interface IdentityDriftRecoveryInput {
  driftMagnitude: number;     // 0..10
  invariantsViolated: number;
  immuneResponseTriggered: boolean;
}

export function readIdentityDriftRecovery(input: IdentityDriftRecoveryInput): IdentityDriftRecoveryReading {
  const { driftMagnitude, invariantsViolated, immuneResponseTriggered } = input;
  const notes: string[] = [];

  const drift_present = driftMagnitude >= 4 || invariantsViolated > 0;
  const recovery_in_progress = drift_present && immuneResponseTriggered;

  const recovery_action = !drift_present
    ? 'no recovery needed — no drift'
    : recovery_in_progress
      ? 'recovery in progress — the immune response is restoring invariants'
      : 'recovery NOT in progress — drift is detected but no recovery is running';

  notes.push(`identity drift recovery: ${recovery_action} (drift ${driftMagnitude}/10, violations ${invariantsViolated})`);
  return { drift_present, recovery_in_progress, recovery_action, notes };
}
