/**
 * APPROVAL CHASING SCANNER (Phase 340 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Detects when the brand is chasing approval — a particularly subtle
 * form of capture.
 */

export interface ApprovalChasingReading {
  /** True when approval-chasing is detected. */
  is_chasing_approval: boolean;
  approval_chase_signals: string[];
  notes: string[];
}

export interface ApprovalChasingInput {
  optimisingForLikes: boolean;
  softeningTone: boolean;
  hedgingPosition: boolean;
}

export function readApprovalChasingScanner(input: ApprovalChasingInput): ApprovalChasingReading {
  const { optimisingForLikes, softeningTone, hedgingPosition } = input;
  const notes: string[] = [];

  const approval_chase_signals: string[] = [];
  if (optimisingForLikes) approval_chase_signals.push('optimising for likes');
  if (softeningTone) approval_chase_signals.push('softening tone to avoid pushback');
  if (hedgingPosition) approval_chase_signals.push('hedging a position to keep approval');

  const is_chasing_approval = approval_chase_signals.length >= 2;

  notes.push(`approval chasing scanner: ${is_chasing_approval ? 'CHASING' : 'sovereign'} (${approval_chase_signals.length} signal(s))`);
  return { is_chasing_approval, approval_chase_signals, notes };
}
