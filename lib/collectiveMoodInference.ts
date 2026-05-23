/**
 * COLLECTIVE MOOD INFERENCE (Phase 228 — Wave 13: Reality Feedback Infrastructure)
 *
 * Beneath the visible reactions lies a collective mood — the felt
 * tone of the audience as a body. This module infers it from the
 * scatter of individual signals.
 */

export type CollectiveMood = 'open' | 'guarded' | 'cynical' | 'restless' | 'tender';

export interface CollectiveMoodReading {
  inferred_mood: CollectiveMood;
  /** 0..10 — confidence in the inference. */
  confidence: number;
  mood_directive: string;
  notes: string[];
}

export interface CollectiveMoodInput {
  /** 0..10 — average emotional intensity of incoming reactions. */
  averageReactionIntensity: number;
  /** 0..10 — average trust signal across reactions. */
  averageTrustSignal: number;
  /** 0..10 — collective exhaustion from worldState. */
  collectiveExhaustion: number;
  /** 0..10 — trust erosion from worldState. */
  trustErosion: number;
}

export function readCollectiveMoodInference(input: CollectiveMoodInput): CollectiveMoodReading {
  const { averageReactionIntensity, averageTrustSignal, collectiveExhaustion, trustErosion } = input;
  const notes: string[] = [];

  const inferred_mood: CollectiveMood =
    trustErosion >= 7 ? 'cynical' :
    collectiveExhaustion >= 7 ? 'tender' :
    averageReactionIntensity >= 7 ? 'restless' :
    averageTrustSignal >= 5 ? 'open' : 'guarded';

  const confidence = round1(Math.min(10, 3 + Math.abs(averageTrustSignal - 5) * 0.7 + averageReactionIntensity * 0.2));

  const mood_directive =
    inferred_mood === 'open' ? 'the audience is open — depth will be received'
    : inferred_mood === 'guarded' ? 'the audience is guarded — earn the next inch of attention before asking for two'
    : inferred_mood === 'cynical' ? 'the audience is cynical — only quiet evidence, never persuasion, will work'
    : inferred_mood === 'restless' ? 'the audience is restless — hold one still note, do not match the noise'
    : 'the audience is tender — go softly; the wrong word now wounds';

  notes.push(`collective mood inference: ${inferred_mood} (confidence ${confidence}/10) — ${mood_directive}`);
  return { inferred_mood, confidence, mood_directive, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
