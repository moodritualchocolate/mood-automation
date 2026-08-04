/**
 * SILENCE RECOMMENDATION RUNTIME (Phase 139 — Wave 10: Reality Coupling Architecture)
 *
 * The runtime that says: not now. When the audience is saturated, the
 * world exhausted, the climate closed — the strongest coupling to
 * reality is to add nothing to the feed. This module turns the
 * external signals into one recommendation: speak, or stay silent.
 */

export interface SilenceRecommendationReading {
  /** True when the runtime recommends silence over shipping. */
  recommend_silence: boolean;
  /** 0..10 — how strongly silence is the right move. */
  silence_strength: number;
  silence_reason: string;
  notes: string[];
}

export interface SilenceRecommendationInput {
  audienceSaturated: boolean;
  /** True when the audience nervous system is exhausted or numb. */
  audiencePastThreshold: boolean;
  climateRejectsAddition: boolean;
  /** 0..10 — collective social exhaustion (Phase 142). */
  socialExhaustion: number;
}

export function recommendSilence(input: SilenceRecommendationInput): SilenceRecommendationReading {
  const { audienceSaturated, audiencePastThreshold, climateRejectsAddition, socialExhaustion } = input;
  const notes: string[] = [];

  let silence_strength = 0;
  if (audienceSaturated) silence_strength += 3;
  if (audiencePastThreshold) silence_strength += 3.5;
  if (climateRejectsAddition) silence_strength += 2.5;
  silence_strength += Math.max(0, (socialExhaustion - 5) * 0.6);
  silence_strength = round1(Math.max(0, Math.min(10, silence_strength)));

  const recommend_silence = silence_strength >= 6;

  const silence_reason = !recommend_silence
    ? 'the world has room for a true banner — speaking is appropriate'
    : audiencePastThreshold
      ? 'the audience is past its threshold — another banner would land on a numbed nervous system'
      : climateRejectsAddition
        ? 'the narrative climate is saturated — silence carries further than addition'
        : 'the world is exhausted — the strongest move is to add nothing to the feed';

  notes.push(`silence recommendation runtime: ${recommend_silence ? 'RECOMMEND SILENCE' : 'speaking is appropriate'} ` +
    `(${silence_strength}/10) — ${silence_reason}`);
  return { recommend_silence, silence_strength, silence_reason, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
