/**
 * EMOTIONAL SATURATION MAP (Phase 133 — Wave 10: Reality Coupling Architecture)
 *
 * An audience has finite emotional bandwidth. This module maps where
 * that bandwidth is already spent — how saturated the audience is with
 * the kind of emotion the organism keeps sending — so the runtime can
 * see when one more banner would land on a numbed audience.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface EmotionalSaturationReading {
  /** 0..10 — how saturated the audience's emotional bandwidth is. */
  saturation: number;
  /** True when the audience is too saturated to receive another banner. */
  audience_is_saturated: boolean;
  saturated_register: string;
  notes: string[];
}

export interface EmotionalSaturationInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — saturation carried from the persistent coupling state. */
  priorSaturation: number;
  /** How many banners the organism has shipped into the feed recently. */
  recentShipCount: number;
}

export function mapEmotionalSaturation(input: EmotionalSaturationInput): EmotionalSaturationReading {
  const { worldState, priorSaturation, recentShipCount } = input;
  const notes: string[] = [];

  let saturation = 0;
  saturation += priorSaturation * 0.5;
  saturation += worldState.attention_chaos * 0.2;
  saturation += worldState.digital_overload * 0.2;
  saturation += Math.min(3, recentShipCount * 0.6);
  saturation = round1(Math.min(10, saturation));

  const audience_is_saturated = saturation >= 6.5;

  const saturated_register =
    worldState.collective_exhaustion >= 7 ? 'the audience is saturated with intensity and wants quiet'
    : worldState.emotional_volatility >= 7 ? 'the audience is saturated with emotional volatility'
    : 'the audience still has bandwidth for a true, quiet banner';

  notes.push(`emotional saturation map: ${saturation}/10` +
    (audience_is_saturated ? ` — AUDIENCE SATURATED: ${saturated_register}` : ''));
  return { saturation, audience_is_saturated, saturated_register, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
