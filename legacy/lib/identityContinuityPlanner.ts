/**
 * IDENTITY CONTINUITY PLANNER (Phase 164 — Wave 11: Strategic Future Intelligence)
 *
 * Every future plan must answer one question before any other: at the
 * end of the horizon, is the organism still itself? This module plans
 * for identity continuity across the long arc.
 */

import type { FutureScenarioReading } from './futureScenarioSimulation';

export interface IdentityContinuityPlanReading {
  continuity_plan: string;
  /** True when the identity is projected to survive the full horizon. */
  identity_survives_horizon: boolean;
  /** 0..10 — risk to identity continuity. */
  continuity_risk: number;
  notes: string[];
}

export interface IdentityContinuityPlanInput {
  /** 0..10 — current identity strength. */
  identityStrength: number;
  scenarios: FutureScenarioReading;
  /** 0..10 — accrued strategic debt. */
  strategicDebt: number;
  /** 0..10 — drift of the projected narrative from its origin. */
  narrativeDrift: number;
}

export function planIdentityContinuity(input: IdentityContinuityPlanInput): IdentityContinuityPlanReading {
  const { identityStrength, scenarios, strategicDebt, narrativeDrift } = input;
  const notes: string[] = [];

  let continuity_risk = 0;
  continuity_risk += (10 - identityStrength) * 0.4;
  continuity_risk += strategicDebt * 0.3;
  continuity_risk += narrativeDrift * 0.3;
  if (scenarios.worst_case.desirability <= 2) continuity_risk += 1;
  continuity_risk = round1(Math.max(0, Math.min(10, continuity_risk)));

  const identity_survives_horizon = continuity_risk < 5.5;

  const continuity_plan = identity_survives_horizon
    ? 'hold the founding voice through every branch — the identity carries to the end of the horizon'
    : continuity_risk >= 7.5
      ? 'the identity will not survive the horizon unguarded — every other plan is subordinate to protecting it'
      : 'the identity is at risk across the horizon — anchor beliefs and refuse drift before pursuing growth';

  notes.push(`identity continuity planner: risk ${continuity_risk}/10 — ${identity_survives_horizon ? 'identity survives the horizon' : 'IDENTITY AT RISK'}`);
  return { continuity_plan, identity_survives_horizon, continuity_risk, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
