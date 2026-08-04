/**
 * CULTURAL ACCELERATION (Phase 21)
 *
 * Measures how fast the culture is currently cycling through
 * emotional content — its meme cadence, its trend half-life, the
 * speed at which one "main thing" gives way to the next.
 *
 * High acceleration means the camera should slow DOWN, because the
 * viewer's nervous system is operating in a high-velocity field.
 * Low acceleration means the camera can move closer to the cultural
 * tempo.
 */

import type { IngestedSignal } from './realityIngestion';

export type AccelerationLevel = 'glacial' | 'low' | 'moderate' | 'high' | 'extreme';

export interface CulturalAccelerationReading {
  level: AccelerationLevel;
  /** Distinct topics counted across the most recent 30-day window. */
  topic_diversity: number;
  /** 0..10 — how much the camera should compensate by slowing down. */
  required_camera_restraint: number;
  notes: string[];
}

export function readCulturalAcceleration(args: { ingestedSignals: IngestedSignal[] }): CulturalAccelerationReading {
  const { ingestedSignals } = args;
  const notes: string[] = [];
  const now = Date.now();
  const THIRTY_DAYS = 30 * 24 * 3600 * 1000;
  const recent = ingestedSignals.filter((s) => now - s.observed_at < THIRTY_DAYS);

  const topics = new Set<string>();
  for (const s of recent) {
    for (const tag of s.topical_tags ?? []) topics.add(tag);
  }
  const topic_diversity = topics.size;

  let level: AccelerationLevel;
  if (topic_diversity <= 4) level = 'glacial';
  else if (topic_diversity <= 8) level = 'low';
  else if (topic_diversity <= 15) level = 'moderate';
  else if (topic_diversity <= 25) level = 'high';
  else level = 'extreme';

  // Required camera restraint scales inversely with the field tempo.
  const required_camera_restraint =
    level === 'extreme' ? 9 :
    level === 'high'    ? 7 :
    level === 'moderate'? 5 :
    level === 'low'     ? 3 : 1;

  notes.push(`cultural acceleration: ${level} (topic diversity ${topic_diversity})`);
  notes.push(`required camera restraint: ${required_camera_restraint}/10`);

  return { level, topic_diversity, required_camera_restraint, notes };
}
