/**
 * SELF-IMAGE VS REALITY GAP (Phase 351 — Wave 15: Identity Preservation Under Live Reality)
 *
 * The gap between how the brand sees itself and how reality sees it.
 * Too large a gap = delusion. Too small = capture.
 */

export interface SelfImageVsRealityGapReading {
  /** 0..10 — size of the gap. */
  gap: number;
  /** True when the gap is healthy (small but not zero). */
  gap_is_healthy: boolean;
  notes: string[];
}

export interface SelfImageVsRealityGapInput {
  selfPerceivedReputation: number;
  receivedReputation: number;
}

export function readSelfImageVsRealityGap(input: SelfImageVsRealityGapInput): SelfImageVsRealityGapReading {
  const { selfPerceivedReputation, receivedReputation } = input;
  const notes: string[] = [];

  const gap = round1(Math.abs(selfPerceivedReputation - receivedReputation));
  const gap_is_healthy = gap > 0.3 && gap < 4;

  notes.push(`self-image vs reality gap: ${gap} — ${gap_is_healthy ? 'healthy' : gap < 0.3 ? 'CAPTURED (no gap)' : 'DELUDED (large gap)'}`);
  return { gap, gap_is_healthy, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
