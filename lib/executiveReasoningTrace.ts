/**
 * EXECUTIVE REASONING TRACE (Phase 41 — Executive Decision Runtime / Wave 4)
 *
 * Every executive decision must explain itself. The trace records the
 * WHY across every dimension — identity, fatigue, timing, truth,
 * strategic value, audience state, emotional continuity, long-term
 * memory impact — in language a creative director would recognise.
 */

import type { ExecutiveAction } from './actionSelection';
import { describeAction } from './actionSelection';

export interface ExecutiveReasoningTrace {
  action: ExecutiveAction;
  why: {
    identity: string;
    fatigue: string;
    timing: string;
    truth: string;
    strategic_value: string;
    audience_state: string;
    emotional_continuity: string;
    long_term_memory_impact: string;
  };
  decision_confidence: number;
  identity_alignment: number;
  long_term_cost: number;
  /** The trace as one human-readable executive memo. */
  executive_memo: string;
}

export interface BuildExecutiveTraceInput {
  action: ExecutiveAction;
  decisionConfidence: number;
  identity: string;
  fatigue: string;
  timing: string;
  truth: string;
  strategicValue: string;
  audienceState: string;
  emotionalContinuity: string;
  longTermMemoryImpact: string;
  identityAlignment: number;
  longTermCost: number;
}

export function buildExecutiveReasoningTrace(input: BuildExecutiveTraceInput): ExecutiveReasoningTrace {
  const {
    action, decisionConfidence, identity, fatigue, timing, truth, strategicValue,
    audienceState, emotionalContinuity, longTermMemoryImpact, identityAlignment, longTermCost,
  } = input;

  const executive_memo =
    `Decision: ${action} — ${describeAction(action)}. ` +
    `Identity: ${identity}. ` +
    `Fatigue: ${fatigue}. ` +
    `Timing: ${timing}. ` +
    `Truth: ${truth}. ` +
    `Strategic value: ${strategicValue}. ` +
    `Audience: ${audienceState}. ` +
    `Continuity: ${emotionalContinuity}. ` +
    `Long-term: ${longTermMemoryImpact}. ` +
    `Confidence ${decisionConfidence}/10.`;

  return {
    action,
    why: {
      identity, fatigue, timing, truth,
      strategic_value: strategicValue,
      audience_state: audienceState,
      emotional_continuity: emotionalContinuity,
      long_term_memory_impact: longTermMemoryImpact,
    },
    decision_confidence: decisionConfidence,
    identity_alignment: identityAlignment,
    long_term_cost: longTermCost,
    executive_memo,
  };
}
