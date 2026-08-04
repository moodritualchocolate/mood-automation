/**
 * MEANING COMPRESSION ENGINE (Phase 141 — Wave 10: Reality Coupling Architecture)
 *
 * The feed compresses meaning. A truth that took a life to earn is
 * flattened into a swipe. This engine detects when the external
 * environment is compressing meaning so hard that the organism's
 * banner would arrive already hollowed — and warns before it ships
 * into that compression.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface MeaningCompressionReading {
  /** 0..10 — how hard the environment is compressing meaning. */
  meaning_compression: number;
  /** True when meaning is being hollowed faster than it can be made. */
  meaning_is_hollowing: boolean;
  notes: string[];
}

export interface MeaningCompressionInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — emotional saturation (Phase 133). */
  saturation: number;
  /** 0..10 — the strategic truth value of the run. */
  truthValue: number;
}

export function readMeaningCompression(input: MeaningCompressionInput): MeaningCompressionReading {
  const { worldState, saturation, truthValue } = input;
  const notes: string[] = [];

  let meaning_compression = 0;
  meaning_compression += worldState.digital_overload * 0.35;
  meaning_compression += worldState.attention_chaos * 0.3;
  meaning_compression += saturation * 0.35;
  meaning_compression = round1(Math.min(10, meaning_compression));

  // Meaning hollows when the environment compresses harder than the
  // run's own truth can resist.
  const meaning_is_hollowing = meaning_compression - truthValue >= 2.5;

  notes.push(`meaning compression engine: ${meaning_compression}/10` +
    (meaning_is_hollowing ? ' — meaning is hollowing: the environment compresses faster than truth can be made' : ''));
  return { meaning_compression, meaning_is_hollowing, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
