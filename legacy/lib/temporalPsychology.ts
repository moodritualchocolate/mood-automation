/**
 * TEMPORAL PSYCHOLOGY (Phase 38 — Wave 4: Executive Cognition)
 *
 * The system must understand timing PSYCHOLOGICALLY. This module
 * synthesises the Phase 38 sensors — attention windows, seasonality,
 * cultural timing, moment readiness, context sensitivity — into one
 * temporal reading.
 *
 * A beautiful banner can be rejected because "the audience
 * psychologically cannot receive softness today."
 */

import { readAttentionWindows } from './attentionWindows';
import { readPsychologicalSeasonality } from './psychologicalSeasonality';
import { readCulturalTiming } from './culturalTimingEngine';
import { readMomentReadiness } from './momentReadiness';
import { readContextSensitivity } from './contextSensitivity';

export interface TemporalPsychologyReading {
  timing_truth_score: number;       // 0..10
  collective_receptivity: number;   // 0..10
  moment_alignment: number;         // 0..10
  psychological_readiness: number;  // 0..10
  /** True when the moment is psychologically wrong for this banner. */
  timing_is_wrong: boolean;
  reason: string;
  notes: string[];
}

export interface TemporalPsychologyInput {
  now?: number;
  candidateRegister: 'soft' | 'intense' | 'neutral';
  /** From the Phase 42 world-state; optional. */
  collectiveTension?: number;
  collectiveExhaustion?: number;
}

export function readTemporalPsychology(input: TemporalPsychologyInput): TemporalPsychologyReading {
  const { now, candidateRegister, collectiveTension, collectiveExhaustion } = input;
  const notes: string[] = [];

  const attentionWindow = readAttentionWindows({ now });
  const seasonality = readPsychologicalSeasonality({ now });
  const culturalTiming = readCulturalTiming({ collectiveTension, collectiveExhaustion, candidateRegister });
  const momentReadiness = readMomentReadiness({ attentionWindow, seasonality, candidateRegister });
  const context = readContextSensitivity({ culturalTiming, momentReadiness });

  const collective_receptivity = context.context_receptivity;
  // Timing truth score — how true the timing is, not how convenient.
  const timing_truth_score = round1(clamp10(
    momentReadiness.psychological_readiness * 0.4 +
    momentReadiness.moment_alignment * 0.35 +
    collective_receptivity * 0.25,
  ));

  const timing_is_wrong = context.cannot_receive_now;

  notes.push(`temporal psychology: timing truth ${timing_truth_score}/10 — ${context.reason}`);
  notes.push(...attentionWindow.notes, ...seasonality.notes, ...culturalTiming.notes, ...momentReadiness.notes, ...context.notes);

  return {
    timing_truth_score,
    collective_receptivity,
    moment_alignment: momentReadiness.moment_alignment,
    psychological_readiness: momentReadiness.psychological_readiness,
    timing_is_wrong,
    reason: context.reason,
    notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
