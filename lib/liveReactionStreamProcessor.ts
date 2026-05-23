/**
 * LIVE REACTION STREAM PROCESSOR (Phase 271 — Wave 14: Live Civilization Coupling)
 *
 * The live comment stream needs to be processed into structured
 * signals the rest of the live layer can use. This module summarises
 * the stream — average intensity, valence, authenticity, volume.
 */

export interface LiveReactionStreamReading {
  /** 0..10 — average intensity across the stream. */
  average_intensity: number;
  /** -10..10 — average valence. */
  average_valence: number;
  /** 0..10 — average authenticity. */
  average_authenticity: number;
  /** True when the stream carries enough signal to be processed. */
  stream_is_processable: boolean;
  notes: string[];
}

export interface LiveReactionStreamInput {
  comments: { intensity: number; valence: number; authenticity: number }[];
}

export function readLiveReactionStreamProcessor(input: LiveReactionStreamInput): LiveReactionStreamReading {
  const { comments } = input;
  const notes: string[] = [];

  if (comments.length === 0) {
    return {
      average_intensity: 0, average_valence: 0, average_authenticity: 0,
      stream_is_processable: false,
      notes: ['live reaction stream processor: empty stream — nothing to process'],
    };
  }

  const average_intensity = round1(comments.reduce((s, c) => s + c.intensity, 0) / comments.length);
  const average_valence = round1(comments.reduce((s, c) => s + c.valence, 0) / comments.length);
  const average_authenticity = round1(comments.reduce((s, c) => s + c.authenticity, 0) / comments.length);
  const stream_is_processable = comments.length >= 2;

  notes.push(`live reaction stream processor: ${comments.length} comment(s) processed — intensity ${average_intensity}/10, valence ${average_valence}, authenticity ${average_authenticity}/10`);
  return { average_intensity, average_valence, average_authenticity, stream_is_processable, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
