/**
 * ATTENTION ECONOMY PRESSURE (Phase 143 — Wave 10: Reality Coupling Architecture)
 *
 * The attention economy exerts a constant pull: post more, post
 * louder, never go quiet. This module measures that pressure — and
 * names it as pressure, so the organism can feel the pull without
 * obeying it.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface AttentionEconomyReading {
  /** 0..10 — how hard the attention economy is pulling. */
  attention_economy_pressure: number;
  /** True when the economy is demanding volume over truth. */
  economy_demands_volume: boolean;
  pressure_note: string;
  notes: string[];
}

export interface AttentionEconomyInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — platform drift toward noise (Phase 137). */
  platformDrift: number;
}

export function readAttentionEconomyPressure(input: AttentionEconomyInput): AttentionEconomyReading {
  const { worldState, platformDrift } = input;
  const notes: string[] = [];

  let attention_economy_pressure = 0;
  attention_economy_pressure += worldState.attention_chaos * 0.4;
  attention_economy_pressure += platformDrift * 0.4;
  attention_economy_pressure += worldState.digital_overload * 0.2;
  attention_economy_pressure = round1(Math.min(10, attention_economy_pressure));

  const economy_demands_volume = attention_economy_pressure >= 6.5;

  const pressure_note = economy_demands_volume
    ? 'the attention economy is demanding volume — the pull is to post more and post louder'
    : 'the attention economy pressure is bearable — the organism can speak on its own terms';

  notes.push(`attention economy pressure: ${attention_economy_pressure}/10 — ${pressure_note}`);
  return { attention_economy_pressure, economy_demands_volume, pressure_note, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
