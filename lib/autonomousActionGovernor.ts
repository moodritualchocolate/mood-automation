/**
 * AUTONOMOUS ACTION GOVERNOR (Phase 219 — Wave 12: Autonomous Action Architecture)
 *
 * The governor of the whole action layer. It reads the key signals —
 * authorization, compulsion, restraint, boundary, coherence — into one
 * judgement: is the organism taking governed action, exercising
 * restraint, drifting, or automating compulsively?
 */

export type ActionGovernance = 'governed-action' | 'restraint' | 'drifting' | 'compulsive';

export interface AutonomousActionGovernorReading {
  governance: ActionGovernance;
  /** True when the action layer is genuinely governing itself. */
  action_governed: boolean;
  reason: string;
  notes: string[];
}

export interface AutonomousActionGovernorInput {
  authorized: boolean;
  isCompulsive: boolean;
  withinBoundary: boolean;
  executionCoherent: boolean;
  withholding: boolean;
}

export function readAutonomousActionGovernor(input: AutonomousActionGovernorInput): AutonomousActionGovernorReading {
  const { authorized, isCompulsive, withinBoundary, executionCoherent, withholding } = input;
  const notes: string[] = [];

  let governance: ActionGovernance;
  let reason: string;

  if (isCompulsive || !withinBoundary) {
    governance = 'compulsive';
    reason = isCompulsive
      ? 'the organism is acting compulsively — automating instead of deciding'
      : 'the action crossed the autonomy boundary — autonomy has exceeded its limits';
  } else if (withholding) {
    governance = 'restraint';
    reason = 'the organism is exercising restraint — choosing not to act is itself the governed decision';
  } else if (!authorized || !executionCoherent) {
    governance = 'drifting';
    reason = !authorized
      ? 'an action is proceeding without authorization — the layer is not governing'
      : 'the action layer contradicts itself — execution is drifting';
  } else {
    governance = 'governed-action';
    reason = 'authorized, coherent, within bounds, deliberate — this is governed action';
  }

  const action_governed = governance === 'governed-action' || governance === 'restraint';

  notes.push(`autonomous action governor: ${governance} — ${reason}`);
  return { governance, action_governed, reason, notes };
}
