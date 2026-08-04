/**
 * COLLECTIVE HEALING PATTERNS (Phase 406 — Wave 16: Generative Civilization Presence)
 *
 * Patterns the brand can offer that help collective wounds heal.
 */

export interface CollectiveHealingPatternsReading {
  healing_pattern_offered: boolean;
  pattern_kind: string | null;
  notes: string[];
}

export interface CollectiveHealingPatternsInput {
  audienceWoundedByExhaustion: boolean;
  audienceWoundedByCynicism: boolean;
  brandAbleToOfferQuiet: boolean;
}

export function readCollectiveHealingPatterns(input: CollectiveHealingPatternsInput): CollectiveHealingPatternsReading {
  const { audienceWoundedByExhaustion, audienceWoundedByCynicism, brandAbleToOfferQuiet } = input;
  const notes: string[] = [];

  const pattern_kind = !brandAbleToOfferQuiet ? null
    : audienceWoundedByExhaustion ? 'quiet, a pause, permission to rest'
    : audienceWoundedByCynicism ? 'evidence of sincerity that does not perform'
    : null;

  const healing_pattern_offered = pattern_kind !== null;

  notes.push(`collective healing patterns: ${healing_pattern_offered ? `OFFERED — ${pattern_kind}` : 'none'}`);
  return { healing_pattern_offered, pattern_kind, notes };
}
