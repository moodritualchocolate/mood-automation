/**
 * PSYCHOLOGICAL SEASONALITY (Phase 38 — Temporal Intelligence / Wave 4)
 *
 * Maps the day of the week (and broad season) to the collective
 * psychological state — Sunday-night dread, the Wednesday trough, the
 * Friday exhale, the weekend's different texture.
 */

export type DayMood =
  | 'week-opening-dread' | 'mid-week-grind' | 'mid-week-trough'
  | 'friday-exhale' | 'weekend-different-texture';

export interface PsychologicalSeasonalityReading {
  day_mood: DayMood;
  dayOfWeek: number;
  /** 0..10 — how heavy the collective mood is on this day. */
  collective_heaviness: number;
  /** 0..10 — how much the day wants quiet vs energy. */
  wants_quiet: number;
  notes: string[];
}

export interface PsychologicalSeasonalityInput {
  now?: number;
}

export function readPsychologicalSeasonality(input: PsychologicalSeasonalityInput = {}): PsychologicalSeasonalityReading {
  const now = input.now ?? Date.now();
  const dayOfWeek = new Date(now).getDay(); // 0 = Sunday
  const notes: string[] = [];

  let day_mood: DayMood;
  let collective_heaviness: number;
  let wants_quiet: number;

  // Israeli week: Sunday is a work-week opening (heavier than a US Sunday).
  switch (dayOfWeek) {
    case 0: day_mood = 'week-opening-dread'; collective_heaviness = 7; wants_quiet = 6; break;
    case 1: day_mood = 'mid-week-grind';     collective_heaviness = 6; wants_quiet = 5; break;
    case 2: day_mood = 'mid-week-grind';     collective_heaviness = 6; wants_quiet = 5; break;
    case 3: day_mood = 'mid-week-trough';    collective_heaviness = 8; wants_quiet = 7; break;
    case 4: day_mood = 'friday-exhale';      collective_heaviness = 4; wants_quiet = 4; break;
    case 5: day_mood = 'friday-exhale';      collective_heaviness = 3; wants_quiet = 4; break;
    default: day_mood = 'weekend-different-texture'; collective_heaviness = 4; wants_quiet = 6; break;
  }

  notes.push(`psychological seasonality: ${day_mood} (day ${dayOfWeek}) — heaviness ${collective_heaviness}/10, wants quiet ${wants_quiet}/10`);
  return { day_mood, dayOfWeek, collective_heaviness, wants_quiet, notes };
}
