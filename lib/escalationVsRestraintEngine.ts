/**
 * ESCALATION VS RESTRAINT ENGINE (Phase 196 — Wave 12: Autonomous Action Architecture)
 *
 * At every action the organism faces one choice: push harder, or hold
 * back. This engine weighs escalation against restraint — and the
 * default, when the case is unclear, is restraint.
 */

export type ActionDisposition = 'escalate' | 'hold' | 'restrain';

export interface EscalationRestraintReading {
  disposition: ActionDisposition;
  /** -10..10 — positive favors escalation, negative favors restraint. */
  escalation_balance: number;
  disposition_reason: string;
  notes: string[];
}

export interface EscalationRestraintInput {
  /** True when the moment genuinely rewards acting (Wave 11 ripe). */
  momentRewardsAction: boolean;
  /** 0..10 — restraint still available. */
  restraintBudget: number;
  /** 0..10 — recovery time owed to the audience. */
  recoveryDebt: number;
  /** 0..10 — strategic debt. */
  strategicDebt: number;
}

export function readEscalationVsRestraintEngine(input: EscalationRestraintInput): EscalationRestraintReading {
  const { momentRewardsAction, restraintBudget, recoveryDebt, strategicDebt } = input;
  const notes: string[] = [];

  let escalation_balance = 0;
  if (momentRewardsAction) escalation_balance += 4;
  escalation_balance += (restraintBudget - 5) * 0.4;
  escalation_balance -= recoveryDebt * 0.5;
  escalation_balance -= strategicDebt * 0.3;
  escalation_balance = round1(escalation_balance);

  const disposition: ActionDisposition =
    escalation_balance >= 3 ? 'escalate' :
    escalation_balance <= -2 ? 'restrain' :
    'hold';

  const disposition_reason =
    disposition === 'escalate' ? 'conditions clearly reward acting — escalation is earned'
    : disposition === 'restrain' ? 'debt and recovery owed outweigh the case to act — restrain'
    : 'the case is not clear — hold; when in doubt, the organism does not escalate';

  notes.push(`escalation vs restraint engine: ${disposition} (balance ${escalation_balance}) — ${disposition_reason}`);
  return { disposition, escalation_balance, disposition_reason, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
