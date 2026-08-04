/**
 * ANTI-CYNICISM FIELD (Phase 410 — Wave 16: Generative Civilization Presence)
 *
 * The field that quietly repels cynicism by sustaining sincerity
 * over time.
 */

export interface AntiCynicismFieldReading {
  cynicism_repelled: boolean;
  field_strength: number;
  notes: string[];
}

export interface AntiCynicismFieldInput {
  sincerityPresent: boolean;
  sustainedOverTime: boolean;
  cynicismPressure: number;
}

export function readAntiCynicismField(input: AntiCynicismFieldInput): AntiCynicismFieldReading {
  const { sincerityPresent, sustainedOverTime, cynicismPressure } = input;
  const notes: string[] = [];

  const field_strength = round1(Math.max(0, (sincerityPresent ? 6 : 0) + (sustainedOverTime ? 3 : 0) - cynicismPressure * 0.3));
  const cynicism_repelled = field_strength >= 5;

  notes.push(`anti-cynicism field: ${cynicism_repelled ? 'REPELLING' : 'absorbing'} (${field_strength}/10)`);
  return { cynicism_repelled, field_strength, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
