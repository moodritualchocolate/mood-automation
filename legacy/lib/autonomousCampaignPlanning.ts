/**
 * AUTONOMOUS CAMPAIGN PLANNING (Phase 47 — Wave 5)
 *
 * The council does not only judge the banner in front of it — it
 * PLANS. From the debate and the conflict standing it produces the
 * campaign's next planned move: what the society of entities, having
 * argued, agrees the campaign should do next.
 */

import type { CouncilBriefing } from './councilTypes';
import type { CouncilConflictReading } from './councilConflictResolution';
import type { InternalDebateReading } from './internalDebateEngine';

export type PlannedMove =
  | 'ship-this-banner'
  | 'ship-but-soften'
  | 'hold-and-rework'
  | 'change-territory'
  | 'rest-the-campaign';

export interface AutonomousCampaignPlanReading {
  planned_move: PlannedMove;
  /** The plan in one sentence. */
  plan_statement: string;
  /** 0..10 — how confident the council is in the plan. */
  plan_confidence: number;
  notes: string[];
}

export interface AutonomousCampaignPlanInput {
  briefing: CouncilBriefing;
  conflict: CouncilConflictReading;
  debate: InternalDebateReading;
}

export function planAutonomousCampaign(input: AutonomousCampaignPlanInput): AutonomousCampaignPlanReading {
  const { briefing, conflict, debate } = input;
  const notes: string[] = [];

  let planned_move: PlannedMove;
  let plan_statement: string;

  if (conflict.standing === 'blocked') {
    if (briefing.recommendSilence || briefing.lifecycleState === 'emotionally-drained') {
      planned_move = 'rest-the-campaign';
      plan_statement = 'the council blocked this banner and the campaign is drained — the plan is to rest, not to rework';
    } else {
      planned_move = 'change-territory';
      plan_statement = 'the council blocked this banner — the plan is to change emotional territory entirely';
    }
  } else if (conflict.standing === 'contested') {
    planned_move = 'hold-and-rework';
    plan_statement = `the council is split (${debate.central_disagreement ?? 'no central disagreement'}) — the plan is to hold and rework until the tension resolves`;
  } else if (conflict.standing === 'proceed-with-caution') {
    planned_move = 'ship-but-soften';
    plan_statement = 'the council will proceed but with caution — the plan is to ship a softened, more restrained version';
  } else {
    planned_move = 'ship-this-banner';
    plan_statement = 'the council is clear — the plan is to ship this banner as the campaign\'s next move';
  }

  const plan_confidence = round1(Math.max(0, Math.min(10,
    (conflict.standing === 'clear-to-proceed' ? 8 : conflict.standing === 'contested' ? 4 : 6) +
    (debate.tension_authenticity >= 6 ? 1 : -1))));

  notes.push(`autonomous campaign plan: ${planned_move} — ${plan_statement} (confidence ${plan_confidence}/10)`);
  return { planned_move, plan_statement, plan_confidence, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
