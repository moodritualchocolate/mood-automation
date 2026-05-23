/**
 * LIVE COMMENT INGESTION (Phase 261 — Wave 14: Live Civilization Coupling)
 *
 * The first job of live coupling: actually hear the audience as it
 * speaks. This module ingests the live comment stream (synthesised
 * from existing audience proxies until real telemetry is connected).
 */

export interface LiveComment {
  intensity: number;     // 0..10
  valence: number;       // -10..10
  authenticity: number;  // 0..10
}

export interface LiveCommentIngestionReading {
  comments: LiveComment[];
  /** True when the live comment stream is actually flowing. */
  stream_is_live: boolean;
  /** 0..10 — instantaneous volume of the live stream. */
  stream_volume: number;
  notes: string[];
}

export interface LiveCommentIngestionInput {
  /** True when the run shipped a banner this cycle. */
  bannerShipped: boolean;
  /** 0..10 — proxy audience emotional charge. */
  audienceCharge: number;
  /** -10..10 — proxy live valence (trust trend). */
  liveValence: number;
  /** 0..10 — proxy authenticity. */
  authenticity: number;
  /** 0..10 — external signal volume. */
  externalSignalVolume: number;
}

export function readLiveCommentIngestion(input: LiveCommentIngestionInput): LiveCommentIngestionReading {
  const { bannerShipped, audienceCharge, liveValence, authenticity, externalSignalVolume } = input;
  const notes: string[] = [];

  const count = bannerShipped ? Math.max(1, Math.round(externalSignalVolume * 0.6)) : Math.max(0, Math.round(externalSignalVolume * 0.2));
  const comments: LiveComment[] = Array.from({ length: count }, (_, i) => ({
    intensity: round1(audienceCharge * (0.7 + (i % 3) * 0.1)),
    valence: round1(liveValence + (i % 2 === 0 ? 0.5 : -0.5)),
    authenticity: round1(authenticity * (0.8 + (i % 4) * 0.05)),
  }));

  const stream_is_live = count > 0;
  const stream_volume = round1(Math.min(10, count * 1.2));

  notes.push(`live comment ingestion: ${count} live comment(s), stream volume ${stream_volume}/10`);
  return { comments, stream_is_live, stream_volume, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
