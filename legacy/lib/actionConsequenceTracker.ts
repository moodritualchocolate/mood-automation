/**
 * ACTION CONSEQUENCE TRACKER (Phase 199 — Wave 12: Autonomous Action Architecture)
 *
 * Every action taken leaves a wake. This tracker holds the organism
 * accountable to the consequences of what it has actually done — so
 * action is never consequence-free.
 */

export interface ActionConsequenceReading {
  /** 0..10 — net consequence of recent action (positive = good). */
  net_consequence: number;
  /** True when accumulated action is producing negative consequences. */
  consequences_turning_negative: boolean;
  consequence_summary: string;
  notes: string[];
}

export interface ActionConsequenceInput {
  /** Actions authorized so far. */
  actionsAuthorized: number;
  /** 0..10 — recovery time owed to the audience (a cost of action). */
  recoveryDebt: number;
  /** 0..10 — trust spent on action so far. */
  trustSpentOnAction: number;
  /** 0..10 — cadence health (a benefit of well-paced action). */
  cadenceHealth: number;
}

export function readActionConsequenceTracker(input: ActionConsequenceInput): ActionConsequenceReading {
  const { actionsAuthorized, recoveryDebt, trustSpentOnAction, cadenceHealth } = input;
  const notes: string[] = [];

  let net_consequence = 5;
  net_consequence += cadenceHealth * 0.3;
  net_consequence -= recoveryDebt * 0.35;
  net_consequence -= trustSpentOnAction * 0.25;
  net_consequence = round1(Math.max(0, Math.min(10, net_consequence)));

  const consequences_turning_negative = net_consequence < 4;

  const consequence_summary = actionsAuthorized === 0
    ? 'no actions taken yet — no consequences to track'
    : consequences_turning_negative
      ? `${actionsAuthorized} actions have left a negative wake — recovery debt and spent trust outweigh the gains`
      : `${actionsAuthorized} actions are netting positive — cadence held, costs stayed contained`;

  notes.push(`action consequence tracker: net ${net_consequence}/10 — ${consequence_summary}`);
  return { net_consequence, consequences_turning_negative, consequence_summary, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
