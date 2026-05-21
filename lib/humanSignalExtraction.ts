/**
 * HUMAN SIGNAL EXTRACTION (Phase 16)
 *
 * Processes the raw ingested signals to extract:
 *   - phrases repeated organically across multiple signals
 *   - emotional contradiction patterns
 *   - modern coping behaviors mentioned in passing
 *   - unresolved emotional loops
 *   - subconscious rituals named without realising
 *   - recurring "private truth" language
 *
 * Different from Phase 12's culturalMemory (which encodes generational
 * tensions as STATIC catalog entries). Phase 16 extracts patterns
 * DYNAMICALLY from real observations as they accumulate over months.
 *
 * The output is consumed by:
 *   - the meta-critic, to confirm a banner's truth was discovered
 *     from reality and not just generated from internal aesthetics
 *   - the cinematic brain, as additional context for the campaign's
 *     emotional thesis
 *   - the private-language map, as the source of the unguarded
 *     vocabulary catalog
 */

import type { IngestedSignal } from './realityIngestion';

export interface ExtractedPattern {
  /** The recurring observation — a normalised phrase or motif. */
  pattern: string;
  /** Number of distinct signals that carried this pattern. */
  occurrences: number;
  /** Sources the pattern appeared in (deduped). */
  sources: string[];
  /** Average emotional_weight across the signals. */
  averageWeight: number;
  /** Most recent timestamp the pattern was observed. */
  lastSeen: number;
}

export interface ExtractionReport {
  /** Top organic phrases (recurring across signals). */
  recurring_phrases: ExtractedPattern[];
  /** Top contradiction markers (phrases that name two truths at once). */
  contradiction_markers: ExtractedPattern[];
  /** Behavioral patterns named in passing. */
  coping_behaviors: ExtractedPattern[];
  /** Recurring "private truth" markers. */
  private_truth_markers: ExtractedPattern[];
  /** How many signals participated in this extraction. */
  signal_count: number;
}

// Phrases that name a coping behaviour (low-grade, often involuntary).
const COPING_BEHAVIOR_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\b(open(s|ed)?\s+(the\s+)?fridge)\b/i, name: 'fridge-without-hunger' },
  { pattern: /\b(check(?:ing)?\s+(notifications?|slack|email))\b/i, name: 'checking-notifications' },
  { pattern: /\b(scroll(?:ing|ed)?\b.*\b(?:bed|tired|exhaust|in bed))\b/i, name: 'scrolling-while-tired' },
  { pattern: /\b(reopen(?:ed|ing)?\s+(?:the\s+)?laptop|laptop\s+open(?:ed)?\s+again)\b/i, name: 'reopen-laptop' },
  { pattern: /\b(sit(?:ting)?\s+in\s+the\s+car|car\s+for\s+\d+\s+(minutes?|min)s?)\b/i, name: 'car-pause-before-going-inside' },
  { pattern: /\b(closing\s+(?:the\s+)?laptop|close\s+(?:the\s+)?laptop\s+again)\b/i, name: 'close-reopen-loop' },
  { pattern: /\b(tabs?\s+open|too\s+many\s+tabs)\b/i, name: 'tab-pile' },
  { pattern: /\b(switching\s+(?:apps?|tabs?))\b/i, name: 'app-switching' },
];

// Markers of explicit recognition language — the "this is me" cluster.
const PRIVATE_TRUTH_MARKERS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /\bliterally\s+me\b|\bthis\s+is\s+me\b/i, name: 'literally-me' },
  { pattern: /\bhow\s+did\s+(you|they)\s+know\b/i, name: 'how-did-you-know' },
  { pattern: /\bthought\s+i\s+was\s+the\s+only\s+one\b/i, name: 'thought-i-was-the-only-one' },
  { pattern: /\bdid(?:n'?t)?\s+realize\s+i\s+do\s+this\b/i, name: 'didnt-realize-i-do-this' },
  { pattern: /\bso\s+(painfully\s+)?accurate\b/i, name: 'painfully-accurate' },
  { pattern: /\b(can'?t\s+mentally\s+land|cant\s+mentally\s+land|i\s+cannot\s+mentally\s+land)\b/i, name: 'cant-mentally-land' },
  { pattern: /\beverything\s+feels\s+half[-\s]open\b/i, name: 'everything-half-open' },
  { pattern: /\bmy\s+brain\s+feels\s+interrupted\b/i, name: 'brain-feels-interrupted' },
  { pattern: /\b(rest\s+but\s+(?:never|don'?t)\s+recover|i\s+rest\s+but)\b/i, name: 'rest-but-never-recover' },
  { pattern: /\btired\s+in\s+a\s+weird\s+way\b/i, name: 'tired-in-a-weird-way' },
  { pattern: /\bexhausted\s+but\s+can'?t\s+stop\b/i, name: 'exhausted-but-cant-stop' },
];

// Contradiction markers — "X but still Y", "Y and yet X" etc.
const CONTRADICTION_REGEX = /\b((?:[a-z][\w']{1,15}\s+){0,2}(but\s+still|and\s+yet|but\s+i\s+keep|but\s+i\s+can'?t\s+stop|but\s+also))\b/i;

export function extractHumanSignals(signals: IngestedSignal[]): ExtractionReport {
  const recurring: Map<string, ExtractedPattern> = new Map();
  const contradictions: Map<string, ExtractedPattern> = new Map();
  const coping: Map<string, ExtractedPattern> = new Map();
  const privateTruth: Map<string, ExtractedPattern> = new Map();

  const bumpInto = (map: Map<string, ExtractedPattern>, key: string, signal: IngestedSignal) => {
    const existing = map.get(key);
    if (existing) {
      existing.occurrences += 1;
      if (!existing.sources.includes(signal.source)) existing.sources.push(signal.source);
      existing.averageWeight = movingAverage(existing.averageWeight, signal.emotional_weight, existing.occurrences);
      existing.lastSeen = Math.max(existing.lastSeen, signal.observed_at);
    } else {
      map.set(key, {
        pattern: key,
        occurrences: 1,
        sources: [signal.source],
        averageWeight: signal.emotional_weight,
        lastSeen: signal.observed_at,
      });
    }
  };

  for (const signal of signals) {
    const text = signal.text;

    // ─── private-truth markers ──────────────────────────────────
    for (const { pattern, name } of PRIVATE_TRUTH_MARKERS) {
      if (pattern.test(text)) bumpInto(privateTruth, name, signal);
    }

    // ─── coping behaviors ───────────────────────────────────────
    for (const { pattern, name } of COPING_BEHAVIOR_PATTERNS) {
      if (pattern.test(text)) bumpInto(coping, name, signal);
    }

    // ─── contradiction markers ──────────────────────────────────
    const contradictionMatch = text.match(CONTRADICTION_REGEX);
    if (contradictionMatch) {
      const key = contradictionMatch[2].toLowerCase().trim();
      bumpInto(contradictions, key, signal);
    }

    // ─── recurring phrases ──────────────────────────────────────
    // We treat ngrams of 3-5 words occurring across signals as
    // recurring phrases. Cheap implementation: hash 4-grams.
    const tokens = text.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter((t) => t.length >= 3);
    for (let i = 0; i <= tokens.length - 4; i++) {
      const ngram = tokens.slice(i, i + 4).join(' ');
      if (ngram.length < 12) continue;
      bumpInto(recurring, ngram, signal);
    }
  }

  // Filter recurring phrases — we want patterns that occurred in
  // at least 2 distinct signals AND across at least 2 sources.
  const recurring_phrases = Array.from(recurring.values())
    .filter((p) => p.occurrences >= 2 && p.sources.length >= 2)
    .sort((a, b) => b.occurrences - a.occurrences)
    .slice(0, 10);

  return {
    recurring_phrases,
    contradiction_markers: Array.from(contradictions.values()).sort((a, b) => b.occurrences - a.occurrences).slice(0, 8),
    coping_behaviors: Array.from(coping.values()).sort((a, b) => b.occurrences - a.occurrences),
    private_truth_markers: Array.from(privateTruth.values()).sort((a, b) => b.occurrences - a.occurrences),
    signal_count: signals.length,
  };
}

function movingAverage(current: number, sample: number, count: number): number {
  return (current * (count - 1) + sample) / count;
}
