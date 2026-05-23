/**
 * REALTIME SENTIMENT FIELD (Phase 262 — Wave 14: Live Civilization Coupling)
 *
 * Sentiment is not a number but a field — varying across the
 * audience. This module reads the field's current average and its
 * variance, so the organism knows not just where the audience is, but
 * how spread out they are.
 */

export interface RealtimeSentimentFieldReading {
  /** -10..10 — instantaneous average sentiment across the field. */
  field_mean: number;
  /** 0..10 — variance / spread of sentiment across the field. */
  field_variance: number;
  /** True when the field is coherent rather than polarised. */
  field_is_coherent: boolean;
  notes: string[];
}

export interface RealtimeSentimentFieldInput {
  /** Live comments arriving this cycle. */
  comments: { valence: number }[];
}

export function readRealtimeSentimentField(input: RealtimeSentimentFieldInput): RealtimeSentimentFieldReading {
  const { comments } = input;
  const notes: string[] = [];

  if (comments.length === 0) {
    return {
      field_mean: 0, field_variance: 0, field_is_coherent: true,
      notes: ['realtime sentiment field: empty field this cycle'],
    };
  }

  const field_mean = round1(comments.reduce((s, c) => s + c.valence, 0) / comments.length);
  const variance = comments.reduce((s, c) => s + Math.pow(c.valence - field_mean, 2), 0) / comments.length;
  const field_variance = round1(Math.min(10, Math.sqrt(variance)));
  const field_is_coherent = field_variance < 4;

  notes.push(`realtime sentiment field: mean ${field_mean}, variance ${field_variance}/10 — ${field_is_coherent ? 'coherent' : 'POLARISED'}`);
  return { field_mean, field_variance, field_is_coherent, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
