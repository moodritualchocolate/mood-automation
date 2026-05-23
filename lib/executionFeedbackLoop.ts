/**
 * EXECUTION FEEDBACK LOOP (Phase 212 — Wave 12: Autonomous Action Architecture)
 *
 * Execution must close its own loop — observe the result of an action,
 * and let that observation shape the next one. This module reads
 * whether the loop is closed and learning, or open and blind.
 */

export interface ExecutionFeedbackReading {
  /** True when the execution feedback loop is closed and learning. */
  loop_is_closed: boolean;
  /** 0..10 — how well execution is learning from its own results. */
  learning_quality: number;
  loop_note: string;
  notes: string[];
}

export interface ExecutionFeedbackInput {
  /** True when the result of the last action was observed. */
  lastResultObserved: boolean;
  /** True when that observation was fed back to strategy. */
  feedbackRouted: boolean;
  /** True when the next action reflects what was learned. */
  nextActionAdjusted: boolean;
}

export function readExecutionFeedbackLoop(input: ExecutionFeedbackInput): ExecutionFeedbackReading {
  const { lastResultObserved, feedbackRouted, nextActionAdjusted } = input;
  const notes: string[] = [];

  const stagesClosed = [lastResultObserved, feedbackRouted, nextActionAdjusted].filter(Boolean).length;
  const learning_quality = round1((stagesClosed / 3) * 10);
  const loop_is_closed = stagesClosed === 3;

  const loop_note = loop_is_closed
    ? 'the feedback loop is closed — execution observes, reports, and adjusts'
    : !lastResultObserved ? 'the loop is open — execution is not observing the results of its own actions'
    : !feedbackRouted ? 'the loop is broken — results are observed but never reach strategy'
    : 'the loop is broken — feedback arrives but the next action ignores it';

  notes.push(`execution feedback loop: ${loop_is_closed ? 'closed' : 'OPEN'} (${learning_quality}/10) — ${loop_note}`);
  return { loop_is_closed, learning_quality, loop_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
