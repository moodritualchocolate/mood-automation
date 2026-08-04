/**
 * EMOTIONAL STRATEGY PLANNER (Phase 35 — Autonomous Creative Direction / Wave 2)
 *
 * Turns the campaign hypothesis into an EMOTIONAL STRATEGY — the
 * concrete creative posture for the next move: which territory to
 * deepen, how much silence, how much pressure, what product role.
 */

import type { EmotionalContinuityRuntimeReading } from './emotionalContinuityRuntime';
import type { CampaignNervousSystemReading } from './campaignNervousSystem';
import type { AntiOptimizationReading } from './antiOptimization';

export interface EmotionalStrategy {
  /** The emotional posture for the next move. */
  posture: string;
  /** 0..10 — recommended silence / restraint level. */
  silenceLevel: number;
  /** 'increase' | 'hold' | 'reduce' — pressure direction. */
  pressureDirection: 'increase' | 'hold' | 'reduce';
  /** Recommended product visibility. */
  productVisibility: 'hidden' | 'environmental' | 'present';
  /** The emotional move this strategy serves. */
  emotionalMove: EmotionalContinuityRuntimeReading['nextEmotionalMove'];
}

export interface EmotionalStrategyInput {
  continuity: EmotionalContinuityRuntimeReading;
  nervousSystem: CampaignNervousSystemReading;
  antiOptimization: AntiOptimizationReading;
}

export function planEmotionalStrategy(input: EmotionalStrategyInput): EmotionalStrategy {
  const { continuity, nervousSystem, antiOptimization } = input;

  // Silence rises when the campaign is loud / saturated / drifting
  // toward optimisation; it falls when the campaign has gone cold.
  let silenceLevel = 5;
  if (nervousSystem.saturationRisk >= 6) silenceLevel += 2;
  if (antiOptimization.algorithmicPressure >= 5) silenceLevel += 1;
  if (nervousSystem.campaignPulse === 'cold') silenceLevel -= 2;
  silenceLevel = Math.max(0, Math.min(10, silenceLevel));

  // Pressure direction follows the emotional move.
  const pressureDirection: EmotionalStrategy['pressureDirection'] =
    continuity.nextEmotionalMove === 'deepen' || continuity.nextEmotionalMove === 'interrupt' ? 'increase'
    : continuity.nextEmotionalMove === 'retire' || continuity.nextEmotionalMove === 'reverse' ? 'reduce'
    : 'hold';

  // Product visibility — kept minimal under optimisation pressure, so
  // the product never becomes the interruption.
  const productVisibility: EmotionalStrategy['productVisibility'] =
    antiOptimization.optimization_corrupts_truth ? 'hidden'
    : nervousSystem.saturationRisk >= 6 ? 'environmental'
    : 'environmental';

  const posture =
    `${continuity.nextEmotionalMove} the ${continuity.activeEmotionalArc} arc, ` +
    `silence at ${silenceLevel}/10, pressure ${pressureDirection}, product ${productVisibility}`;

  return {
    posture,
    silenceLevel,
    pressureDirection,
    productVisibility,
    emotionalMove: continuity.nextEmotionalMove,
  };
}
