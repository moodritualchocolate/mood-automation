/**
 * PRIVATE LANGUAGE MAP (Phase 16)
 *
 * Detects language humans use PRIVATELY, not performatively.
 *
 *   NOT therapy language       (boundaries, holding space, inner child)
 *   NOT TikTok aesthetic        (it's giving, soft girl era, this slaps)
 *   NOT self-aware poetry       (the weight of being, the ache of)
 *
 *   YES — unguarded sentences   ("i can't mentally land",
 *                                "I'm tired in a weird way",
 *                                "everything feels half-open",
 *                                "I keep switching tabs",
 *                                "my brain feels interrupted")
 *
 * The catalog SEEDS from a curated list AND grows from the
 * humanSignalExtraction private_truth_markers as they accumulate.
 *
 * The module scores the candidate banner's truth on
 * `private_language_score` — 0..10 — high when the truth uses
 * unguarded, observed vocabulary; low when it uses therapy or
 * TikTok-aesthetic vocabulary.
 *
 * Distinct from Phase 11's nonPerformativeReality (which detects
 * the visual patterns of performing depth). Phase 16's
 * privateLanguageMap is about LINGUISTIC register specifically.
 */

import type { ExtractionReport } from './humanSignalExtraction';

export interface PrivateLanguageReading {
  /** 0..10 — higher = more private / unguarded. */
  private_language_score: number;
  /** True when the truth carries the unguarded register. */
  is_unguarded: boolean;
  /** Markers detected in the candidate's truth that mirror private
   *  language observed in the ingestion store. */
  matched_private_phrases: string[];
  /** Therapy / TikTok / poetic patterns the truth contains. */
  performative_signatures: Array<'therapy-language' | 'tiktok-aesthetic' | 'self-aware-poetry' | 'inspirational-energy'>;
  notes: string[];
}

// Phrases / structural shapes that indicate UNGUARDED register.
// (Seeded; the live map grows from ExtractionReport.private_truth_markers.)
const UNGUARDED_PHRASE_PATTERNS: RegExp[] = [
  /\b(can'?t|cannot|cant)\s+mentally\s+land\b/i,
  /\beverything\s+feels\s+half[-\s]open\b/i,
  /\bmy\s+brain\s+feels\s+interrupted\b/i,
  /\btired\s+in\s+a\s+weird\s+way\b/i,
  /\brest\s+but\s+(?:never|don'?t)\s+recover\b/i,
  /\b(keep\s+switching|keep\s+checking)\b/i,
  /\b(open\s+the\s+fridge|opened\s+the\s+fridge)\b/i,
  /\b(check\s+notifications|checking\s+notifications)\b/i,
  /\bnot\s+hungry\b/i,
  /\bnobody\s+(saw|noticed|sees|notices)\b/i,
  /\bi\s+didn'?t\s+realize\b/i,
  /\b(half[-\s]done|half[-\s]finished)\b/i,
  /\bsame\s+sentence\s+(again|three|four|five)\s+times\b/i,
];

// Performative signatures the system refuses to amplify.
const PERFORMATIVE_PATTERNS: Array<{ pattern: RegExp; signature: PrivateLanguageReading['performative_signatures'][number] }> = [
  // therapy
  { pattern: /\b(boundaries|holding space|inner child|sit with|honour my truth|honor my truth)\b/i, signature: 'therapy-language' },
  { pattern: /\b(self[-\s]?love|self[-\s]?care|self[-\s]?worth)\b/i, signature: 'therapy-language' },
  // tiktok aesthetic
  { pattern: /\b(it'?s giving|main character energy|soft (girl|boy) era|cottagecore|chefs kiss|periodt)\b/i, signature: 'tiktok-aesthetic' },
  { pattern: /\b(bestie|girlie|gworl|i can'?t even|i'?m dead|literally crying)\b/i, signature: 'tiktok-aesthetic' },
  // self-aware poetry
  { pattern: /\b(the weight of being|the ache of|the soft (?:hum|weight) of|in the marrow of)\b/i, signature: 'self-aware-poetry' },
  { pattern: /\b(soul|essence|sacred|sanctity|divine|holy)\b/i, signature: 'self-aware-poetry' },
  // inspirational energy
  { pattern: /\b(you\s+are\s+enough|you\s+got\s+this|you\s+matter|reclaim(?:ed|ing)?\s+(my|your)|own\s+your)\b/i, signature: 'inspirational-energy' },
];

export interface PrivateLanguageInput {
  truthText: string;
  tensionText?: string;
  /** Optional — the live extraction report. The unguarded register
   *  expands as the ingestion store grows. */
  extraction?: ExtractionReport;
}

export function readPrivateLanguage(input: PrivateLanguageInput): PrivateLanguageReading {
  const { truthText, tensionText, extraction } = input;
  const fullText = `${truthText} ${tensionText ?? ''}`;
  const notes: string[] = [];

  // ─── unguarded phrase matches ──────────────────────────────────
  const matched_private_phrases: string[] = [];
  for (const p of UNGUARDED_PHRASE_PATTERNS) {
    const m = fullText.match(p);
    if (m) matched_private_phrases.push(m[0].toLowerCase());
  }

  // Augment with the live extraction's private_truth_markers — when
  // the truth's text contains a token from a marker the catalog has
  // already observed, count it.
  if (extraction) {
    for (const marker of extraction.private_truth_markers) {
      // Crude check — the marker's pattern name as a kebab phrase;
      // we look for any matching token from the marker's display.
      const phrase = marker.pattern.replace(/-/g, ' ');
      const tokens = phrase.split(/\s+/).filter((t) => t.length > 3);
      const overlap = tokens.filter((t) => fullText.toLowerCase().includes(t)).length;
      if (overlap >= 2 && !matched_private_phrases.includes(marker.pattern)) {
        matched_private_phrases.push(marker.pattern);
      }
    }
  }

  // ─── performative signature detection ─────────────────────────
  const performative_signatures: PrivateLanguageReading['performative_signatures'] = [];
  for (const { pattern, signature } of PERFORMATIVE_PATTERNS) {
    if (pattern.test(fullText) && !performative_signatures.includes(signature)) {
      performative_signatures.push(signature);
    }
  }

  // ─── score ────────────────────────────────────────────────────
  let private_language_score = 4;
  private_language_score += matched_private_phrases.length * 1.8;
  private_language_score -= performative_signatures.length * 2.2;
  // Short, punctuated truths read as private; long flowery ones read
  // as poetry.
  if (truthText.length > 0 && truthText.length < 90 && /[.,;:]/.test(truthText)) private_language_score += 1;
  if (truthText.length > 140) private_language_score -= 1.5;
  private_language_score = Math.max(0, Math.min(10, private_language_score));

  const is_unguarded = private_language_score >= 6 && performative_signatures.length === 0;

  if (is_unguarded) notes.push('truth uses unguarded register — sounds private, not performed');
  if (performative_signatures.length > 0) notes.push(`performative signatures present: ${performative_signatures.join(', ')}`);
  if (notes.length === 0) notes.push('truth is neither strongly unguarded nor performative');

  return {
    private_language_score,
    is_unguarded,
    matched_private_phrases,
    performative_signatures,
    notes,
  };
}
