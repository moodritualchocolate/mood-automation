/**
 * CONTEXT SENSITIVITY (Phase 38 — Temporal Intelligence / Wave 4)
 *
 * The final temporal check: given everything — the hour, the day, the
 * cultural period — can the audience emotionally RECEIVE this banner
 * right now? Sometimes the honest answer is "not today".
 */

import type { CulturalTimingReading } from './culturalTimingEngine';
import type { MomentReadinessReading } from './momentReadiness';

export interface ContextSensitivityReading {
  /** 0..10 — how much the context can receive the banner. */
  context_receptivity: number;
  /** True when the audience psychologically cannot receive it now. */
  cannot_receive_now: boolean;
  /** A plain-language reason. */
  reason: string;
  notes: string[];
}

export interface ContextSensitivityInput {
  culturalTiming: CulturalTimingReading;
  momentReadiness: MomentReadinessReading;
}

export function readContextSensitivity(input: ContextSensitivityInput): ContextSensitivityReading {
  const { culturalTiming, momentReadiness } = input;
  const notes: string[] = [];

  const context_receptivity = round1(clamp10(
    momentReadiness.psychological_readiness * 0.5 +
    momentReadiness.moment_alignment * 0.3 +
    Math.max(culturalTiming.can_receive_softness, culturalTiming.can_receive_intensity) * 0.2,
  ));

  const cannot_receive_now = culturalTiming.timing_blocked || (!momentReadiness.moment_is_ready && context_receptivity < 4);

  let reason: string;
  if (culturalTiming.timing_blocked) {
    reason = `the cultural period (${culturalTiming.period}) cannot receive this emotional register`;
  } else if (cannot_receive_now) {
    reason = 'the moment is not psychologically ready — the audience cannot receive this banner today';
  } else {
    reason = 'the context can receive the banner';
  }

  notes.push(`context sensitivity: receptivity ${context_receptivity}/10 — ${reason}`);
  return { context_receptivity, cannot_receive_now, reason, notes };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
