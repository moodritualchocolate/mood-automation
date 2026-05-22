/**
 * PLATFORM DRIFT RUNTIME (Phase 137 — Wave 10: Reality Coupling Architecture)
 *
 * The distribution environment is not stable. Platforms drift — they
 * change what they reward, and the reward quietly pulls the organism
 * toward noise. This runtime watches that drift so the organism can
 * resist being shaped by a channel rather than by a truth.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface PlatformDriftReading {
  /** 0..10 — how far the platform environment has drifted toward noise. */
  platform_drift: number;
  /** True when the platform now rewards noise over truth. */
  platform_rewards_noise: boolean;
  drift_direction: string;
  notes: string[];
}

export interface PlatformDriftInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — virality risk this run carries. */
  viralityRisk: number;
}

export function readPlatformDrift(input: PlatformDriftInput): PlatformDriftReading {
  const { worldState, viralityRisk } = input;
  const notes: string[] = [];

  let platform_drift = 0;
  platform_drift += worldState.attention_chaos * 0.35;
  platform_drift += worldState.digital_overload * 0.35;
  platform_drift += viralityRisk * 0.3;
  platform_drift = round1(Math.min(10, platform_drift));

  const platform_rewards_noise = platform_drift >= 6.5;

  const drift_direction = platform_rewards_noise
    ? 'the platform is rewarding volume and speed — it pulls toward noise'
    : platform_drift >= 4
      ? 'the platform is drifting — the reward is beginning to favour noise'
      : 'the platform environment is stable enough to carry a quiet true banner';

  notes.push(`platform drift runtime: ${platform_drift}/10 — ${drift_direction}`);
  return { platform_drift, platform_rewards_noise, drift_direction, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
