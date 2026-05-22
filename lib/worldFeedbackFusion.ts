/**
 * WORLD FEEDBACK FUSION (Phase 145 — Wave 10: Reality Coupling Architecture)
 *
 * The external signals arrive scattered — saturation here, trust
 * there, platform drift elsewhere. This module fuses them into one
 * coherent reading of what the world is telling the organism, and
 * whether that telling is a welcome or a refusal.
 */

import type { TrustTrend } from './trustDecayEngine';
import type { AudienceState } from './audienceNervousSystemModel';

export interface WorldFeedbackFusionReading {
  /** 0..10 — how strong and clear the fused feedback signal is. */
  world_feedback_signal: number;
  /** One sentence: what the world is telling the organism. */
  world_says: string;
  /** True when the world is pushing back on the organism. */
  feedback_is_negative: boolean;
  notes: string[];
}

export interface WorldFeedbackFusionInput {
  externalSignalVolume: number;
  saturation: number;
  trustTrend: TrustTrend;
  audienceState: AudienceState;
  platformRewardsNoise: boolean;
  worldIsExhausted: boolean;
}

export function fuseWorldFeedback(input: WorldFeedbackFusionInput): WorldFeedbackFusionReading {
  const { externalSignalVolume, saturation, trustTrend, audienceState, platformRewardsNoise, worldIsExhausted } = input;
  const notes: string[] = [];

  // Signal strength — how much real, legible feedback there is.
  const world_feedback_signal = round1(Math.min(10, externalSignalVolume * 0.6 + saturation * 0.2 + 2));

  const negatives: string[] = [];
  if (saturation >= 6.5) negatives.push('the audience is saturated');
  if (trustTrend === 'decaying') negatives.push('trust is decaying');
  if (audienceState === 'numb' || audienceState === 'exhausted') negatives.push(`the audience is ${audienceState}`);
  if (worldIsExhausted) negatives.push('the world is exhausted');
  if (platformRewardsNoise) negatives.push('the platform rewards noise');

  const feedback_is_negative = negatives.length >= 2;

  const world_says = feedback_is_negative
    ? `the world is pushing back — ${negatives.slice(0, 2).join(', ')}`
    : negatives.length === 1
      ? `the world is mostly receptive, with one caution: ${negatives[0]}`
      : 'the world is receptive — there is room for a true banner';

  notes.push(`world feedback fusion: signal ${world_feedback_signal}/10 — ${world_says}`);
  return { world_feedback_signal, world_says, feedback_is_negative, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
