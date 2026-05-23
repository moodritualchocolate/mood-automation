/**
 * FEEDBACK TO EXECUTION REFINEMENT (Phase 242 — Wave 13: Reality Feedback Infrastructure)
 *
 * Feedback also tunes execution, not just strategy. This module
 * proposes the specific refinement the next action's craft should
 * make based on how the last action was actually received.
 */

export interface ExecutionRefinementReading {
  /** True when an execution refinement is being proposed. */
  refinement_proposed: boolean;
  refinement: string;
  notes: string[];
}

export interface ExecutionRefinementInput {
  /** True when intended emotional truth misaligned with reception. */
  emotionalTruthMisaligned: boolean;
  /** True when the cadence is reading as flooding. */
  cadenceIsFlooding: boolean;
  /** True when the audience nervous system is fatigued. */
  audienceFatigued: boolean;
}

export function readFeedbackToExecutionRefinement(input: ExecutionRefinementInput): ExecutionRefinementReading {
  const { emotionalTruthMisaligned, cadenceIsFlooding, audienceFatigued } = input;
  const notes: string[] = [];

  const refinement_proposed = emotionalTruthMisaligned || cadenceIsFlooding || audienceFatigued;

  const refinement = !refinement_proposed
    ? 'no refinement — execution craft is landing as intended'
    : emotionalTruthMisaligned
      ? 'refine the emotional register — what was meant did not feel like what was received'
      : cadenceIsFlooding
        ? 'widen spacing — execution cadence is reading as flooding'
        : 'lighten the action weight — the audience nervous system is fatigued';

  notes.push(`feedback to execution refinement: ${refinement}`);
  return { refinement_proposed, refinement, notes };
}
