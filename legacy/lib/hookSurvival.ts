/**
 * HOOK SURVIVAL ANALYSIS
 *
 * Determines which first 0.5 seconds survive scrolling — measured from
 * the ingested signals, not from the system's internal prediction.
 *
 * The reality check: the human-reaction simulator (lib/humanReaction.ts)
 * PREDICTS a curve. This module reads the actual signal aggregations
 * and computes:
 *
 *   - eye_interruption    — % of impressions that produced any
 *                           interaction in the first second (watch > 0.5,
 *                           pause, replay)
 *   - emotional_interruption — emotional comments / impressions
 *   - curiosity_hold      — proportion of viewers that watched > 2s
 *                           OR replayed
 *   - recognition_timing  — derived from how quickly saves/shares
 *                           accumulate vs total watch time
 *
 * The system uses hook survival to:
 *  (a) score the actual interruption power of a banner after the fact
 *  (b) feed Emotional Outcome Mapping's prediction-vs-reality
 *      comparison
 *  (c) influence which patterns the next banner avoids
 */

import type { BannerEngagement } from './engagementMemory';

export interface HookSurvival {
  /** Each axis 0..1. */
  eye_interruption: number;
  emotional_interruption: number;
  curiosity_hold: number;
  /** Recognition timing — 0 = slow / never, 1 = instant. */
  recognition_timing: number;
  /** Overall 0..10 survival score. */
  composite: number;
  /** True when we have enough signal volume to trust the numbers. */
  reliable: boolean;
}

export function analyzeHookSurvival(e: BannerEngagement | null): HookSurvival {
  if (!e || e.totals.impressions === 0) {
    return {
      eye_interruption: 0,
      emotional_interruption: 0,
      curiosity_hold: 0,
      recognition_timing: 0,
      composite: 0,
      reliable: false,
    };
  }

  const t = e.totals;
  const impressions = Math.max(1, t.impressions);

  // eye_interruption — any sign of attention in the first second.
  // Watch event with > 0.5s, pause, or replay count.
  const watchSignals = e.signals.filter((s) => s.kind === 'watch');
  const earlyAttention = watchSignals.filter((s) => (s.value ?? 0) > 0.5).length;
  const earlyPauseOrReplay = t.pauses + t.replays;
  const eye_interruption = clamp01((earlyAttention + earlyPauseOrReplay * 0.5) / impressions);

  // emotional_interruption — emotional comments per impression.
  const emotional_interruption = clamp01(t.emotionalComments / impressions * 30);
  // (×30 because emotional comments are rare — 0.03 per impression is huge)

  // curiosity_hold — share of viewers that watched > 2s OR replayed.
  const heldViewers = watchSignals.filter((s) => (s.value ?? 0) > 2).length + t.replays * 0.5;
  const curiosity_hold = clamp01(heldViewers / impressions);

  // recognition_timing — the faster saves/shares accumulate per unit
  // of watch time, the higher this score. Compares saves+shares to
  // total watch seconds.
  const recognitionEvents = t.saves + t.shares;
  const recognition_timing = t.watchSecTotal > 0
    ? clamp01(recognitionEvents / Math.sqrt(t.watchSecTotal) * 2)
    : 0;

  const composite = clamp10(
    eye_interruption * 3 +
    emotional_interruption * 3 +
    curiosity_hold * 2.5 +
    recognition_timing * 1.5,
  );

  const reliable = impressions >= 30;

  return { eye_interruption, emotional_interruption, curiosity_hold, recognition_timing, composite, reliable };
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
