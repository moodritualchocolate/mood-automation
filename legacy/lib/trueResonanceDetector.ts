/**
 * TRUE RESONANCE DETECTOR (Phase 146 — Wave 10: Reality Coupling Architecture)
 *
 * The distinction the whole wave exists to make. A response can look
 * identical on a metric and be one of two opposite things: TRUE
 * RESONANCE — a real human met a real truth — or STIMULUS ADDICTION —
 * a nervous system twitched at novelty. This detector tells them
 * apart, because the organism's survival depends on never confusing
 * them.
 */

import type { TrustTrend } from './trustDecayEngine';

export type ResonanceKind = 'true-resonance' | 'stimulus-addiction' | 'neutral';

export interface TrueResonanceReading {
  resonance_kind: ResonanceKind;
  is_true_resonance: boolean;
  is_stimulus_addiction: boolean;
  /** 0..10 — how much of the response would be genuine resonance. */
  resonance_score: number;
  verdict: string;
  notes: string[];
}

export interface TrueResonanceInput {
  /** 0..10 — engagement truth score (Phase 132). */
  engagementTruthScore: number;
  readsAsStimulus: boolean;
  trustTrend: TrustTrend;
  audiencePastThreshold: boolean;
  feedbackIsNegative: boolean;
}

export function detectTrueResonance(input: TrueResonanceInput): TrueResonanceReading {
  const { engagementTruthScore, readsAsStimulus, trustTrend, audiencePastThreshold, feedbackIsNegative } = input;
  const notes: string[] = [];

  let resonance_score = engagementTruthScore;
  if (trustTrend === 'forming') resonance_score += 1.5;
  if (trustTrend === 'decaying') resonance_score -= 2;
  if (audiencePastThreshold) resonance_score -= 2;
  if (feedbackIsNegative) resonance_score -= 1;
  resonance_score = round1(Math.max(0, Math.min(10, resonance_score)));

  // Stimulus addiction — the response would be a twitch at novelty
  // while the deeper signals (trust, the audience's threshold) say the
  // organism is spending, not resonating.
  const is_stimulus_addiction =
    readsAsStimulus && (trustTrend === 'decaying' || audiencePastThreshold || resonance_score < 3.5);

  // True resonance — a real response to a real truth, with trust
  // holding or forming behind it.
  const is_true_resonance =
    !readsAsStimulus && resonance_score >= 6 && trustTrend !== 'decaying' && !audiencePastThreshold;

  const resonance_kind: ResonanceKind =
    is_stimulus_addiction ? 'stimulus-addiction' :
    is_true_resonance ? 'true-resonance' : 'neutral';

  const verdict =
    resonance_kind === 'stimulus-addiction'
      ? 'this would be stimulus addiction — a reaction to novelty the organism would mistake for being heard'
      : resonance_kind === 'true-resonance'
        ? 'this would be true resonance — a real human meeting a real truth'
        : 'this would be neither sharp resonance nor stimulus — an ordinary, honest run';

  notes.push(`true resonance detector: ${resonance_kind} (score ${resonance_score}/10) — ${verdict}`);
  return { resonance_kind, is_true_resonance, is_stimulus_addiction, resonance_score, verdict, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
