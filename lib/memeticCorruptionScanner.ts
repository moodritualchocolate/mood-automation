/**
 * MEMETIC CORRUPTION SCANNER (Phase 326 — Wave 15: Identity Preservation Under Live Reality)
 *
 * Scans for memetic corruption — moments where an alien idea, slang,
 * or framing has slipped into the brand's voice and is reshaping it
 * from inside.
 */

export interface MemeticCorruptionReading {
  /** True when memetic corruption was detected. */
  corruption_detected: boolean;
  /** 0..10 — corruption load. */
  corruption_load: number;
  corruption_sources: string[];
  notes: string[];
}

export interface MemeticCorruptionInput {
  borrowedSlang: boolean;
  trendDrivenFraming: boolean;
  audiencePhrasesAdopted: boolean;
}

export function readMemeticCorruptionScanner(input: MemeticCorruptionInput): MemeticCorruptionReading {
  const { borrowedSlang, trendDrivenFraming, audiencePhrasesAdopted } = input;
  const notes: string[] = [];

  const corruption_sources: string[] = [];
  if (borrowedSlang) corruption_sources.push('borrowed slang the brand never used');
  if (trendDrivenFraming) corruption_sources.push('trend-driven framing replacing native framing');
  if (audiencePhrasesAdopted) corruption_sources.push('audience phrases adopted wholesale');

  const corruption_load = round1(Math.min(10, corruption_sources.length * 3.5));
  const corruption_detected = corruption_sources.length >= 1;

  notes.push(`memetic corruption scanner: ${corruption_detected ? 'CORRUPTION' : 'clean'} (${corruption_load}/10)`);
  return { corruption_detected, corruption_load, corruption_sources, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
