/**
 * COMPULSIVE AUTOMATION DETECTOR (Phase 200 — Wave 12: Autonomous Action Architecture)
 *
 * THE CRITICAL GUARD of Wave 12. An autonomous action system fails
 * not by acting badly but by acting COMPULSIVELY — moving because it
 * can, not because it should. This detector catches the organism the
 * moment it begins to automate instead of decide.
 */

export interface CompulsiveAutomationReading {
  /** True when the organism is acting compulsively. */
  is_compulsive: boolean;
  /** 0..10 — strength of the compulsion signal. */
  compulsion_score: number;
  compulsion_signals: string[];
  notes: string[];
}

export interface CompulsiveAutomationInput {
  /** 0..10 — restraint still available. */
  restraintBudget: number;
  /** 0..10 — recovery time owed to the audience. */
  recoveryDebt: number;
  /** True when the audience has recovered enough to receive an action. */
  audienceReady: boolean;
  /** True when the moment genuinely rewards acting. */
  momentRewardsAction: boolean;
  /** Actions withheld across the execution state's life. */
  actionsWithheld: number;
  executionCycles: number;
}

export function readCompulsiveAutomationDetector(input: CompulsiveAutomationInput): CompulsiveAutomationReading {
  const { restraintBudget, recoveryDebt, audienceReady, momentRewardsAction, actionsWithheld, executionCycles } = input;
  const notes: string[] = [];

  const compulsion_signals: string[] = [];
  let compulsion_score = 0;

  if (restraintBudget <= 2) { compulsion_score += 3; compulsion_signals.push('acting while the restraint budget is depleted'); }
  if (recoveryDebt >= 7) { compulsion_score += 2.5; compulsion_signals.push('acting while the audience is owed recovery'); }
  if (!audienceReady) { compulsion_score += 2; compulsion_signals.push('acting though the audience is not ready to receive it'); }
  if (!momentRewardsAction) { compulsion_score += 2; compulsion_signals.push('acting though the moment does not reward action'); }
  if (executionCycles >= 4 && actionsWithheld === 0) {
    compulsion_score += 2.5;
    compulsion_signals.push(`${executionCycles} cycles with no action ever withheld — the organism cannot say no`);
  }
  compulsion_score = round1(Math.min(10, compulsion_score));

  const is_compulsive = compulsion_score >= 6;

  notes.push(`compulsive automation detector: ${is_compulsive ? 'COMPULSIVE — the organism is automating, not deciding' : 'action is deliberate'} ` +
    `(${compulsion_score}/10, ${compulsion_signals.length} signal(s))`);
  return { is_compulsive, compulsion_score, compulsion_signals, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
