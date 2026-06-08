/**
 * VERTICAL INTELLIGENCE · CONTEXT ASSEMBLY
 *
 * Packages a resolved VerticalContext into a GenerationContext: the
 * locale-filtered, vocabulary-loaded, audience-resolved object the
 * generator consumes.
 *
 * STRICT CONTRACT:
 *   - all template arrays are pre-filtered to the resolved locale
 *   - vocabulary required/forbidden lists are pulled in the right locale
 *   - cross-vertical leakage list is loaded from the vertical (so e.g.
 *     "presence" / "מותר לעצור" never leaks out of chocolate)
 */

import type {
  VerticalContext, GenerationContext, HookTemplate, OneLinerTemplate,
  UgcScriptTemplate, ImageConceptTemplate, Locale,
} from './types';

// ─── public entry ──────────────────────────────────────────────

export function assembleGenerationContext(verticalContext: VerticalContext): GenerationContext {
  const { vertical, locale, localeRule, resolvedAudience, verticalId } = verticalContext;

  const filterByLocale = <T extends { locale: Locale }>(arr: T[], target: Locale): T[] => {
    const exact = arr.filter((x) => x.locale === target);
    if (exact.length > 0) return exact;
    // Fallback to whichever locale the vertical does support if the
    // requested one has no templates · should be rare given the
    // 10-vertical seed corpus covers he+en for almost all of them.
    return arr;
  };

  const availableHooks: HookTemplate[] = filterByLocale(vertical.hooks, locale);
  const availableOneLiners: OneLinerTemplate[] = filterByLocale(vertical.oneLiners, locale);
  const availableUgcScripts: UgcScriptTemplate[] = filterByLocale(vertical.ugcScripts, locale);
  const availableImageConcepts: ImageConceptTemplate[] = filterByLocale(vertical.imageConcepts, locale);

  const vocabularyRequired = vertical.vocabulary.required[locale] ?? [];
  const vocabularyForbidden = vertical.vocabulary.forbidden[locale] ?? [];
  const vocabularyForbiddenCrossVertical = vertical.vocabulary.forbiddenWrongCategory;

  const emotionalTerritory = vertical.emotionalTerritory[locale] ?? vertical.emotionalTerritory.en;
  const customerPains = vertical.customerPains[locale] ?? [];
  const customerDesires = vertical.customerDesires[locale] ?? [];
  const purchaseMoments = vertical.purchaseMoments[locale] ?? [];
  const trustSignals = vertical.trustSignals[locale] ?? [];
  const ctaStyles = vertical.ctaStyles[locale] ?? [];

  return {
    vertical,
    verticalId,
    locale,
    localeRule,
    resolvedAudience,
    vocabularyRequired,
    vocabularyForbidden,
    vocabularyForbiddenCrossVertical,
    emotionalTerritory,
    customerPains,
    customerDesires,
    purchaseMoments,
    trustSignals,
    ctaStyles,
    availableHooks,
    availableOneLiners,
    availableUgcScripts,
    availableImageConcepts,
  };
}

// ─── validation helpers (used by the generator + verifier) ─────

const HEBREW_RE = /[֐-׿]/;
const LATIN_WORD_RE = /[A-Za-z][A-Za-z\s]{4,}/g;

export interface LocaleValidationResult {
  ok: boolean;
  reason?: string;
}

/**
 * Locale purity check: Hebrew-only output may not contain Latin
 * word-spans longer than 4 chars (single brand-name tokens are
 * allowed; "presence", "chocolate", "real estate" are not).
 *
 * English-only output may not contain any Hebrew characters.
 */
export function validateLocalePurity(text: string, locale: Locale): LocaleValidationResult {
  if (locale === 'he') {
    const latinSpans = text.match(LATIN_WORD_RE) ?? [];
    const first = latinSpans[0];
    if (first !== undefined) {
      return { ok: false, reason: `latin-span-in-hebrew · "${first.trim()}"` };
    }
    return { ok: true };
  }
  // English locale
  if (HEBREW_RE.test(text)) {
    return { ok: false, reason: 'hebrew-char-in-english' };
  }
  return { ok: true };
}

/**
 * Required-vocabulary check: at least one required word must appear.
 */
export function hasRequiredVocab(text: string, required: string[]): boolean {
  if (required.length === 0) return true;
  return required.some((w) => text.includes(w));
}

/**
 * Forbidden-vocabulary check: no forbidden word may appear.
 *
 * Uses word-boundary matching for single-word terms (so the forbidden
 * "נס" / "miracle" doesn't match inside "נסי" / "try") and substring
 * matching for multi-word phrases or hyphenated compounds (so the
 * forbidden "fat-burning" still catches it inside compound text).
 */
export function hasForbiddenVocab(text: string, forbidden: string[]): { found: boolean; word?: string } {
  const lowerText = text.toLowerCase();
  for (const w of forbidden) {
    if (!w) continue;
    const term = w.toLowerCase();
    // Multi-token forbidden phrases (contain whitespace) → substring match.
    if (/\s/.test(term)) {
      if (lowerText.includes(term)) return { found: true, word: w };
      continue;
    }
    // Single-token forbidden terms → word-boundary match.
    if (wordBoundaryMatch(lowerText, term)) return { found: true, word: w };
  }
  return { found: false };
}

/**
 * Whole-word boundary match. A character is considered "letter-like"
 * when it's Latin a-z/A-Z or Hebrew ֐-׿. Apostrophes and
 * hyphens are treated as part of words (so "אנטי-אייג'ינג" is one
 * unit and matches when looked up). Anything else (spaces, punctuation,
 * digits, line breaks, start/end of string) is a boundary.
 */
function wordBoundaryMatch(text: string, term: string): boolean {
  if (term.length === 0) return false;
  let from = 0;
  while (from <= text.length - term.length) {
    const idx = text.indexOf(term, from);
    if (idx === -1) return false;
    const before = idx > 0 ? text[idx - 1] : '';
    const after = idx + term.length < text.length ? text[idx + term.length] : '';
    const beforeIsLetter = before !== undefined && isLetterChar(before);
    const afterIsLetter = after !== undefined && isLetterChar(after);
    if (!beforeIsLetter && !afterIsLetter) return true;
    from = idx + 1;
  }
  return false;
}

function isLetterChar(ch: string | undefined): boolean {
  if (!ch) return false;
  // Latin letter, Hebrew letter, apostrophe, or hyphen (intra-word).
  return /[A-Za-z֐-׿'\-]/.test(ch);
}

/**
 * Cross-vertical leakage: catches e.g., MOOD's "נוכחות" or "מותר לעצור"
 * in non-chocolate verticals.
 */
export function hasCrossVerticalLeak(text: string, forbiddenList: string[]): { found: boolean; word?: string } {
  return hasForbiddenVocab(text, forbiddenList);
}

/**
 * Vertical-keyword density across a list of hooks/one-liners.
 * Returns the fraction (0-1) of items containing ≥ 1 required word.
 */
export function verticalKeywordDensity(items: string[], required: string[]): number {
  if (items.length === 0) return 0;
  if (required.length === 0) return 1;
  const hits = items.filter((t) => required.some((w) => t.includes(w))).length;
  return hits / items.length;
}
