/**
 * CIVILIZATION PRESENCE FIELD (Phase 401 — Wave 16: Generative Civilization Presence)
 *
 * The brand as a generative field — not a transmitter but a presence
 * that quietly reshapes the space around it.
 */

export interface CivilizationPresenceFieldReading {
  field_strength: number;
  field_is_generative: boolean;
  notes: string[];
}

export interface CivilizationPresenceFieldInput {
  sovereignty: number;
  livingReputation: number;
  forcedInfluence: boolean;
}

export function readCivilizationPresenceField(input: CivilizationPresenceFieldInput): CivilizationPresenceFieldReading {
  const { sovereignty, livingReputation, forcedInfluence } = input;
  const notes: string[] = [];

  const field_strength = round1(Math.min(10, (sovereignty * 0.6 + livingReputation * 0.4) - (forcedInfluence ? 3 : 0)));
  const field_is_generative = field_strength >= 5 && !forcedInfluence;

  notes.push(`civilization presence field: ${field_is_generative ? 'GENERATIVE' : 'thin'} (${field_strength}/10)`);
  return { field_strength, field_is_generative, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
