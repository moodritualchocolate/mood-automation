/**
 * STRATEGIC TIMELINE BRANCHING (Phase 152 — Wave 11: Strategic Future Intelligence)
 *
 * From the present moment, several strategic timelines branch. This
 * module lays them out — the path of patience, the path of growth,
 * the path of reach — and names the branch that leads somewhere the
 * organism can survive as itself.
 */

import type { FutureScenarioReading } from './futureScenarioSimulation';

export interface TimelineBranch {
  path: string;
  leads_to: string;
  healthy: boolean;
}

export interface TimelineBranchingReading {
  branches: TimelineBranch[];
  chosen_branch: TimelineBranch;
  branch_count: number;
  /** True when the healthy branch is also the one being walked. */
  on_a_healthy_branch: boolean;
  notes: string[];
}

export interface TimelineBranchingInput {
  scenarios: FutureScenarioReading;
  /** 0..10 — how strong the brand identity is. */
  identityStrength: number;
  /** True when the run is currently being pushed for present reach. */
  pushedForReach: boolean;
}

export function readStrategicTimelineBranching(input: TimelineBranchingInput): TimelineBranchingReading {
  const { scenarios, identityStrength, pushedForReach } = input;
  const notes: string[] = [];

  const branches: TimelineBranch[] = [
    { path: 'patience', leads_to: 'compounding trust — slow, durable authority', healthy: identityStrength >= 5 },
    { path: 'measured growth', leads_to: scenarios.best_case.name, healthy: scenarios.expected_future >= 5 },
    { path: 'reach now', leads_to: 'a present spike, then erosion', healthy: false },
  ];

  // The organism is walking the "reach now" branch when it is being
  // pushed for present reach; otherwise the healthiest available.
  const chosen_branch = pushedForReach
    ? branches[2]
    : (branches.find((b) => b.healthy) ?? branches[0]);

  const on_a_healthy_branch = chosen_branch.healthy;

  notes.push(`strategic timeline branching: walking the "${chosen_branch.path}" branch → ${chosen_branch.leads_to}` +
    (on_a_healthy_branch ? '' : ' — this branch is not healthy'));
  return {
    branches, chosen_branch, branch_count: branches.length, on_a_healthy_branch, notes,
  };
}
