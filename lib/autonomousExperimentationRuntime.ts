/**
 * AUTONOMOUS EXPERIMENTATION RUNTIME (Phase 195 — Wave 12: Autonomous Action Architecture)
 *
 * The organism may experiment — but a true experiment is bounded,
 * reversible, and small. This runtime decides whether an experiment
 * is safe to run, or whether it is a gamble wearing an experiment's
 * clothes.
 */

export interface ExperimentationReading {
  /** True when an experiment is safe to run this cycle. */
  experiment_is_safe: boolean;
  /** True when the runtime recommends running an experiment now. */
  run_experiment: boolean;
  experiment_bounds: string;
  notes: string[];
}

export interface ExperimentationInput {
  /** 0..10 — restraint still available. */
  restraintBudget: number;
  /** True when the decision would be reversible. */
  reversible: boolean;
  /** 0..10 — execution risk of the action. */
  executionRisk: number;
  /** True when trust is healthy enough to absorb a small miss. */
  trustHealthy: boolean;
}

export function readAutonomousExperimentationRuntime(input: ExperimentationInput): ExperimentationReading {
  const { restraintBudget, reversible, executionRisk, trustHealthy } = input;
  const notes: string[] = [];

  const experiment_is_safe = reversible && executionRisk < 5 && trustHealthy;
  // Run an experiment only when it is safe AND there is restraint to
  // spare — never as a compulsion to keep moving.
  const run_experiment = experiment_is_safe && restraintBudget >= 5;

  const experiment_bounds = !experiment_is_safe
    ? !reversible ? 'an irreversible experiment is not an experiment — do not run it'
      : executionRisk >= 5 ? 'execution risk too high to bound an experiment safely'
      : 'trust too thin to absorb even a small experimental miss'
    : 'bounded, reversible, small — a true experiment the organism can afford';

  notes.push(`autonomous experimentation runtime: ${run_experiment ? 'run a bounded experiment' : 'do not experiment'} — ${experiment_bounds}`);
  return { experiment_is_safe, run_experiment, experiment_bounds, notes };
}
