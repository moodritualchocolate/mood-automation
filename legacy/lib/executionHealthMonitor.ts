/**
 * EXECUTION HEALTH MONITOR (Phase 215 — Wave 12: Autonomous Action Architecture)
 *
 * A continuous read on the health of the action layer itself — its
 * restraint, its cadence, its recovery debt — surfacing failure modes
 * before they reach the audience.
 */

export interface ExecutionHealthReading {
  /** 0..10 — overall health of the execution layer. */
  execution_health: number;
  /** True when the execution layer is healthy. */
  execution_is_healthy: boolean;
  failure_modes: string[];
  notes: string[];
}

export interface ExecutionHealthInput {
  /** 0..10 — restraint budget. */
  restraintBudget: number;
  /** 0..10 — cadence health. */
  cadenceHealth: number;
  /** 0..10 — audience recovery debt. */
  recoveryDebt: number;
  /** 0..10 — execution load. */
  executionLoad: number;
}

export function readExecutionHealthMonitor(input: ExecutionHealthInput): ExecutionHealthReading {
  const { restraintBudget, cadenceHealth, recoveryDebt, executionLoad } = input;
  const notes: string[] = [];

  const failure_modes: string[] = [];
  if (restraintBudget <= 3) failure_modes.push('restraint budget running low');
  if (cadenceHealth <= 4) failure_modes.push('action cadence has lost its rhythm');
  if (recoveryDebt >= 7) failure_modes.push('audience recovery debt is high');
  if (executionLoad >= 7) failure_modes.push('the execution layer is overloaded');

  let execution_health = 0;
  execution_health += restraintBudget * 0.3;
  execution_health += cadenceHealth * 0.3;
  execution_health += (10 - recoveryDebt) * 0.2;
  execution_health += (10 - executionLoad) * 0.2;
  execution_health = round1(Math.max(0, Math.min(10, execution_health)));

  const execution_is_healthy = execution_health >= 5.5 && failure_modes.length === 0;

  notes.push(`execution health monitor: ${execution_health}/10 — ` +
    (execution_is_healthy ? 'the action layer is healthy' : `failure modes: ${failure_modes.join(', ')}`));
  return { execution_health, execution_is_healthy, failure_modes, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
