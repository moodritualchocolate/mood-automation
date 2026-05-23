/**
 * CULTURAL FRONT DETECTION (Phase 277 — Wave 14: Live Civilization Coupling)
 *
 * Cultural fronts move across the field — a cold front of cynicism,
 * a warm front of optimism. This module flags when one is approaching.
 */

export type CulturalFront = 'cold-front-approaching' | 'warm-front-approaching' | 'stable' | 'front-passing';

export interface CulturalFrontReading {
  front: CulturalFront;
  /** True when a significant front is forming. */
  front_is_forming: boolean;
  notes: string[];
}

export interface CulturalFrontInput {
  moodVelocity: number;
  trustErosion: number;
  culturalWeather: 'calm' | 'unsettled' | 'storm' | 'aftermath';
}

export function readCulturalFrontDetection(input: CulturalFrontInput): CulturalFrontReading {
  const { moodVelocity, trustErosion, culturalWeather } = input;
  const notes: string[] = [];

  const front: CulturalFront =
    culturalWeather === 'aftermath' ? 'front-passing' :
    moodVelocity <= -1 || trustErosion >= 7 ? 'cold-front-approaching' :
    moodVelocity >= 1 ? 'warm-front-approaching' : 'stable';

  const front_is_forming = front === 'cold-front-approaching' || front === 'warm-front-approaching';

  notes.push(`cultural front detection: ${front}`);
  return { front, front_is_forming, notes };
}
