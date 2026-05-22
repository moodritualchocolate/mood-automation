/**
 * CULTURAL CLIMATE MODEL (Phase 42 — World-State Executive Brain / Wave 4)
 *
 * Synthesises the collective psychology and the pressure systems into
 * a single CULTURAL CLIMATE — the emotional weather the campaign is
 * about to step into.
 */

import type { CollectivePsychologyReading } from './collectivePsychologyState';
import type { SocialPressureReading } from './socialPressureSystems';

export type CulturalClimate =
  | 'calm' | 'low-grade-strain' | 'tense' | 'volatile' | 'collectively-exhausted';

export interface CulturalClimateReading {
  climate: CulturalClimate;
  /** A plain-language description of the climate. */
  description: string;
  /** What the climate can and cannot receive. */
  can_receive: string;
  notes: string[];
}

export interface CulturalClimateInput {
  collectivePsychology: CollectivePsychologyReading;
  socialPressure: SocialPressureReading;
}

export function readCulturalClimate(input: CulturalClimateInput): CulturalClimateReading {
  const { collectivePsychology, socialPressure } = input;
  const notes: string[] = [];

  const heat = (
    collectivePsychology.collective_exhaustion +
    collectivePsychology.anxiety_pressure +
    collectivePsychology.emotional_volatility +
    socialPressure.social_fragmentation
  ) / 4;

  let climate: CulturalClimate;
  let can_receive: string;
  if (collectivePsychology.collective_exhaustion >= 7.5 && heat >= 6.5) {
    climate = 'collectively-exhausted';
    can_receive = 'only the quietest, most recognising truths — nothing that asks for energy';
  } else if (collectivePsychology.emotional_volatility >= 7) {
    climate = 'volatile';
    can_receive = 'steady, grounded observation — nothing that adds heat';
  } else if (heat >= 6) {
    climate = 'tense';
    can_receive = 'restraint and recognition — intensity will be rejected';
  } else if (heat >= 4.5) {
    climate = 'low-grade-strain';
    can_receive = 'most registers, but softness lands best';
  } else {
    climate = 'calm';
    can_receive = 'a wide range — the climate is not contested';
  }

  const description = `the culture is ${climate.replace(/-/g, ' ')} (heat ${round1(heat)}/10)`;
  notes.push(`cultural climate: ${description} — can receive: ${can_receive}`);

  return { climate, description, can_receive, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
