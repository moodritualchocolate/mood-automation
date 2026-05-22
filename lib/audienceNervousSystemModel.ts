/**
 * AUDIENCE NERVOUS SYSTEM MODEL (Phase 136 — Wave 10: Reality Coupling Architecture)
 *
 * The audience is not a target — it is a nervous system, with its own
 * arousal, its own fatigue, its own threshold past which more signal
 * stops registering. This module models that nervous system so the
 * organism speaks to a living listener, not a metric.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export type AudienceState = 'receptive' | 'alert' | 'overstimulated' | 'numb' | 'exhausted';

export interface AudienceNervousSystemReading {
  /** 0..10 — how aroused / activated the audience's nervous system is. */
  audience_arousal: number;
  /** 0..10 — how fatigued the audience's nervous system is. */
  audience_fatigue: number;
  audience_state: AudienceState;
  /** True when more signal will no longer register. */
  past_threshold: boolean;
  notes: string[];
}

export interface AudienceNervousSystemInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — emotional saturation (Phase 133). */
  saturation: number;
}

export function readAudienceNervousSystem(input: AudienceNervousSystemInput): AudienceNervousSystemReading {
  const { worldState, saturation } = input;
  const notes: string[] = [];

  const audience_arousal = round1(Math.min(10,
    worldState.attention_chaos * 0.4 + worldState.emotional_volatility * 0.35 + worldState.anxiety_pressure * 0.25));
  const audience_fatigue = round1(Math.min(10,
    worldState.collective_exhaustion * 0.5 + saturation * 0.35 + worldState.digital_overload * 0.15));

  const audience_state: AudienceState =
    audience_fatigue >= 8 ? 'exhausted' :
    audience_fatigue >= 6 && audience_arousal < 6 ? 'numb' :
    audience_arousal >= 7 ? 'overstimulated' :
    audience_arousal >= 5 ? 'alert' : 'receptive';

  const past_threshold = audience_state === 'numb' || audience_state === 'exhausted';

  notes.push(`audience nervous system: ${audience_state} — arousal ${audience_arousal}/10, fatigue ${audience_fatigue}/10` +
    (past_threshold ? ' — past threshold, more signal will not register' : ''));
  return { audience_arousal, audience_fatigue, audience_state, past_threshold, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
