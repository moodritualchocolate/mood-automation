/**
 * RESONANCE DECAY TRACKING (Phase 223 — Wave 13: Reality Feedback Infrastructure)
 *
 * Resonance does not last forever. This module reads the decay curve —
 * how quickly the action's emotional charge faded — and distinguishes
 * a healthy decay (a true moment fading) from a collapse (a moment
 * that never landed).
 */

export type DecayProfile = 'lingering' | 'natural' | 'fast-fade' | 'collapse';

export interface ResonanceDecayReading {
  decay_profile: DecayProfile;
  /** 0..10 — half-life of the resonance in cycles. */
  half_life_cycles: number;
  /** True when the decay shape is consistent with a true moment. */
  decay_is_healthy: boolean;
  notes: string[];
}

export interface ResonanceDecayInput {
  /** 0..10 — resonance immediately after the action. */
  initialResonance: number;
  /** 0..10 — resonance one cycle later (a proxy from cadence + persistence). */
  oneStepLaterResonance: number;
  /** True when the moment was a stimulus spike rather than a true beat. */
  wasStimulus: boolean;
}

export function readResonanceDecayTracking(input: ResonanceDecayInput): ResonanceDecayReading {
  const { initialResonance, oneStepLaterResonance, wasStimulus } = input;
  const notes: string[] = [];

  const lossRatio = initialResonance > 0
    ? Math.max(0, Math.min(1, (initialResonance - oneStepLaterResonance) / initialResonance))
    : 1;

  const half_life_cycles = round1(Math.max(0.2, 5 * (1 - lossRatio)));

  const decay_profile: DecayProfile =
    initialResonance < 2 ? 'collapse' :
    lossRatio >= 0.7 ? 'fast-fade' :
    lossRatio <= 0.25 ? 'lingering' : 'natural';

  // A healthy decay is natural or lingering. A stimulus-driven moment
  // is judged separately: even a "natural" decay reads as unhealthy
  // when the action that started it was stimulus.
  const decay_is_healthy =
    (decay_profile === 'natural' || decay_profile === 'lingering') && !wasStimulus;

  notes.push(`resonance decay tracking: ${decay_profile} (half-life ${half_life_cycles} cycles, ` +
    `${Math.round(lossRatio * 100)}% loss in one step) — ` +
    (decay_is_healthy ? 'a true moment fading well' : 'an unhealthy decay shape'));
  return { decay_profile, half_life_cycles, decay_is_healthy, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
