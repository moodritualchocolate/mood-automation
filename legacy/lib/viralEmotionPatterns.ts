/**
 * VIRAL EMOTION PATTERNS (Phase 21)
 *
 * Detects when a candidate banner is reaching for an EMOTIONAL
 * PATTERN that the culture has already over-circulated — the
 * "comfortable-burnout" pattern, the "soft-girl-era" pattern, the
 * "everything-is-fine" pattern. These have become viral templates
 * the moment they were named.
 *
 * The engine refuses banners that LAND ON these patterns. Detection
 * is by truth-text fingerprinting against known viral patterns.
 */

import type { HumanTruth } from '@/core/types';

export interface ViralPatternRecord {
  id: string;
  vocabulary: RegExp;
  status: 'over-circulated' | 'circulated' | 'still-fresh';
  retire_after: string;            // a description of why it has decayed
}

export const VIRAL_PATTERNS: ViralPatternRecord[] = [
  {
    id: 'soft-girl-era',
    vocabulary: /\b(soft girl era|main character|that girl|romanticis(e|ed) my life|hot girl walk)\b/i,
    status: 'over-circulated',
    retire_after: 'the phrase entered marketing within 9 weeks of becoming widespread',
  },
  {
    id: 'its-giving',
    vocabulary: /\b(its giving|it[' ]?s giving|delulu|no thoughts head empty|core memory)\b/i,
    status: 'over-circulated',
    retire_after: 'every brand account has used the phrase',
  },
  {
    id: 'romanticised-burnout',
    vocabulary: /\b(cozy burnout|cozy collapse|romanticis(e|ed) my exhaustion|aesthetic burnout)\b/i,
    status: 'over-circulated',
    retire_after: 'the phrase commodifies the suffering it claims to honour',
  },
  {
    id: 'therapy-speak-pop',
    vocabulary: /\b(holding space|emotional bandwidth|boundaries|tend to my inner child|sit with the discomfort|nervous system)\b/i,
    status: 'over-circulated',
    retire_after: 'therapy-derived vocabulary has been absorbed into branding',
  },
  {
    id: 'optimisation-poetry',
    vocabulary: /\b(deep work|monk mode|cold plunge|biohack|protocol|stack|10x)\b/i,
    status: 'circulated',
    retire_after: 'every productivity / wellness creator uses these',
  },
  {
    id: 'inspirational-cliche',
    vocabulary: /\b(you got this|trust the process|just breathe|you are enough|find your why)\b/i,
    status: 'over-circulated',
    retire_after: 'pure motivational vocabulary',
  },
];

export interface ViralEmotionPatternsReading {
  hits: ViralPatternRecord[];
  /** 0..10 — how viral-contaminated the truth is. */
  contamination_score: number;
  /** True when the truth uses any over-circulated pattern. */
  uses_over_circulated: boolean;
  notes: string[];
}

export interface ViralEmotionPatternsInput {
  truth: HumanTruth;
}

export function readViralEmotionPatterns(input: ViralEmotionPatternsInput): ViralEmotionPatternsReading {
  const { truth } = input;
  const notes: string[] = [];
  const hits = VIRAL_PATTERNS.filter((p) => p.vocabulary.test(truth.truth));
  const uses_over_circulated = hits.some((h) => h.status === 'over-circulated');

  let contamination_score = 0;
  for (const h of hits) {
    contamination_score += h.status === 'over-circulated' ? 4 : 2;
  }
  contamination_score = Math.min(10, contamination_score);

  for (const h of hits) {
    notes.push(`viral pattern detected: ${h.id} (${h.status}) — ${h.retire_after}`);
  }
  return { hits, contamination_score, uses_over_circulated, notes };
}
