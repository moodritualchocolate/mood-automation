/**
 * GENERATIVE PRESENCE METER (Phase 419 — Wave 16)
 */
export interface GenerativePresenceMeterReading { presence: number; is_generative: boolean; notes: string[]; }
export interface GenerativePresenceMeterInput { fieldStrength: number; meaningPropagating: boolean; }
export function readGenerativePresenceMeter(input: GenerativePresenceMeterInput): GenerativePresenceMeterReading {
  const presence = input.fieldStrength + (input.meaningPropagating ? 2 : 0);
  const is_generative = presence >= 6;
  return { presence: Math.min(10, presence), is_generative, notes: [`generative presence meter: ${presence}/10`] };
}
