/**
 * REACTION PATTERN MEMORY (Phase 239 — Wave 13: Reality Feedback Infrastructure)
 *
 * Across many cycles, audience reactions form patterns. This memory
 * names them — "the audience always softens after a quiet beat", "the
 * fast metric always reverses by cycle three" — so the next decision
 * can use the patterns rather than rediscover them.
 */

export interface ReactionPatternEntry {
  pattern_name: string;
  observed_count: number;
  is_active: boolean;
}

export interface ReactionPatternMemoryReading {
  recognised_patterns: ReactionPatternEntry[];
  /** True when a known pattern matches this cycle. */
  pattern_matched: boolean;
  notes: string[];
}

export interface ReactionPatternMemoryInput {
  /** Total reactions ingested across the campaign's life. */
  reactionsIngested: number;
  /** True when this cycle's reactions resemble the "soften after quiet" pattern. */
  softensAfterQuiet: boolean;
  /** True when this cycle's reactions resemble the "fast metric reverses" pattern. */
  fastMetricReverses: boolean;
}

export function readReactionPatternMemory(input: ReactionPatternMemoryInput): ReactionPatternMemoryReading {
  const { reactionsIngested, softensAfterQuiet, fastMetricReverses } = input;
  const notes: string[] = [];

  const recognised_patterns: ReactionPatternEntry[] = [];
  if (reactionsIngested >= 3) {
    recognised_patterns.push({
      pattern_name: 'audience softens after a quiet beat',
      observed_count: Math.floor(reactionsIngested / 3),
      is_active: softensAfterQuiet,
    });
    recognised_patterns.push({
      pattern_name: 'fast metric reverses by cycle three',
      observed_count: Math.floor(reactionsIngested / 4),
      is_active: fastMetricReverses,
    });
  }

  const pattern_matched = recognised_patterns.some((p) => p.is_active);

  notes.push(`reaction pattern memory: ${recognised_patterns.length} pattern(s) on file, ${pattern_matched ? 'one matches this cycle' : 'no active match'}`);
  return { recognised_patterns, pattern_matched, notes };
}
