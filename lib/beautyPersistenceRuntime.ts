/**
 * BEAUTY PERSISTENCE RUNTIME (Phase 409 — Wave 16: Generative Civilization Presence)
 *
 * The runtime that ensures beauty in the work outlives the moment.
 */

export interface BeautyPersistenceReading {
  beauty_persists: boolean;
  persistence_score: number;
  notes: string[];
}

export interface BeautyPersistenceInput {
  beautyPresent: boolean;
  truthful: boolean;
  carriedSecondHand: boolean;
}

export function readBeautyPersistenceRuntime(input: BeautyPersistenceInput): BeautyPersistenceReading {
  const { beautyPresent, truthful, carriedSecondHand } = input;
  const notes: string[] = [];

  let persistence_score = 0;
  if (beautyPresent) persistence_score += 5;
  if (truthful) persistence_score += 3;
  if (carriedSecondHand) persistence_score += 2;
  persistence_score = round1(Math.min(10, persistence_score));

  const beauty_persists = persistence_score >= 6;

  notes.push(`beauty persistence runtime: ${beauty_persists ? 'PERSISTS' : 'fading'} (${persistence_score}/10)`);
  return { beauty_persists, persistence_score, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
