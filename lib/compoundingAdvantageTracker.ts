/**
 * COMPOUNDING ADVANTAGE TRACKER (Phase 168 — Wave 11: Strategic Future Intelligence)
 *
 * Some advantages add; the strategic ones compound. This tracker
 * watches the organism's compounding advantage — the edge that grows
 * on itself when the organism keeps choosing the future over the now.
 */

export interface CompoundingAdvantageReading {
  /** 0..10 — the organism's accumulated compounding advantage. */
  compounding_advantage: number;
  /** True when the advantage is genuinely compounding, not just held. */
  advantage_is_compounding: boolean;
  advantage_source: string;
  notes: string[];
}

export interface CompoundingAdvantageInput {
  /** 0..10 — compounding advantage carried from the strategic state. */
  priorAdvantage: number;
  /** True when trust is compounding (Phase 156). */
  trustCompounding: boolean;
  /** Ratio of future-compounding decisions to now-optimizing ones. */
  futureCompoundedCount: number;
  nowOptimizedCount: number;
}

export function readCompoundingAdvantage(input: CompoundingAdvantageInput): CompoundingAdvantageReading {
  const { priorAdvantage, trustCompounding, futureCompoundedCount, nowOptimizedCount } = input;
  const notes: string[] = [];

  const decided = futureCompoundedCount + nowOptimizedCount;
  const futureShare = decided > 0 ? futureCompoundedCount / decided : 0.5;

  const compounding_advantage = round1(Math.max(0, Math.min(10, priorAdvantage)));

  // The advantage compounds when trust is compounding and the organism
  // has been choosing the future more often than the now.
  const advantage_is_compounding = trustCompounding && futureShare >= 0.5 && compounding_advantage >= 4;

  const advantage_source =
    advantage_is_compounding
      ? 'compounding — trust and consistent future-choosing are growing the edge on themselves'
      : futureShare < 0.5
        ? 'not compounding — the organism has been spending the edge on present gains'
        : 'holding flat — the edge is intact but not yet growing on itself';

  notes.push(`compounding advantage tracker: ${compounding_advantage}/10 — ${advantage_source}`);
  return { compounding_advantage, advantage_is_compounding, advantage_source, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
