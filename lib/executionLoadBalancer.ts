/**
 * EXECUTION LOAD BALANCER (Phase 202 — Wave 12: Autonomous Action Architecture)
 *
 * The organism has finite execution capacity — restraint, attention,
 * trust to spend. This balancer reads whether the current action load
 * is sustainable or whether the action layer is overcommitting.
 */

export interface ExecutionLoadReading {
  /** 0..10 — current load on the execution layer. */
  execution_load: number;
  /** True when the load is sustainable. */
  load_is_sustainable: boolean;
  load_advice: string;
  notes: string[];
}

export interface ExecutionLoadInput {
  /** 0..10 — recovery time owed to the audience. */
  recoveryDebt: number;
  /** 0..10 — restraint still available (inverse load). */
  restraintBudget: number;
  /** 0..10 — cadence health. */
  cadenceHealth: number;
}

export function readExecutionLoadBalancer(input: ExecutionLoadInput): ExecutionLoadReading {
  const { recoveryDebt, restraintBudget, cadenceHealth } = input;
  const notes: string[] = [];

  let execution_load = 0;
  execution_load += recoveryDebt * 0.4;
  execution_load += (10 - restraintBudget) * 0.35;
  execution_load += (10 - cadenceHealth) * 0.25;
  execution_load = round1(Math.min(10, execution_load));

  const load_is_sustainable = execution_load < 6.5;

  const load_advice = load_is_sustainable
    ? 'the execution load is sustainable — the action layer has capacity'
    : 'the execution layer is overcommitted — shed load before taking on another action';

  notes.push(`execution load balancer: load ${execution_load}/10 — ${load_advice}`);
  return { execution_load, load_is_sustainable, load_advice, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
