/**
 * MVP QUALITY SCORE (roadmap #9)
 *
 * The deterministic per-artifact scorer, extracted from the verifier
 * into the pipeline itself: weak output is filtered BEFORE it reaches
 * the customer, not just measured after the fact.
 *
 * Returns netQuality on the same 0-60 scale the audits use, so pipeline
 * thresholds and audit numbers speak the same language.
 */

const HEBREW_RE = /[֐-׿]/;
const LATIN_WORD_RE = /[A-Za-z][A-Za-z\s]{4,}/g;

export interface QualityInput {
  text: string;
  locale: 'he' | 'en';
  /** Vertical vocabulary that should appear (required list). */
  vocabulary: string[];
}

export function qualityScore({ text, locale, vocabulary }: QualityInput): number {
  const len = text.length;
  const codeSwitched = locale === 'he'
    ? HEBREW_RE.test(text) && (text.match(LATIN_WORD_RE) ?? []).length > 0
    : HEBREW_RE.test(text);

  let clarity = 7;
  if (len < 10) clarity -= 4;
  if (len > 240) clarity -= 2;
  if (codeSwitched) clarity -= 4;
  clarity = Math.max(1, Math.min(10, clarity));

  const hits = vocabulary.filter((k) => text.includes(k)).length;
  const specificity = Math.max(1, Math.min(10, 3 + hits * 2));

  let commercial = 6;
  if (text.includes('?')) commercial += 1;
  if (/[.!]$/.test(text.trim())) commercial += 1;
  if (len >= 12 && len <= 80) commercial += 1;
  if (codeSwitched) commercial -= 3;
  commercial = Math.max(1, Math.min(10, commercial));

  let emotional = 4;
  if (/(אתה|את|אתם|אתן|שלך|שלכם|שלי)/.test(text)) emotional += 2;
  if (/(\byou\b|\byour\b|\bI\b|\bmy\b|\bwe\b)/i.test(text)) emotional += 2;
  if (/(רגע|נוכחות|שקט|מותר|להרגיש|להיות|זוכר|איתך|כבוד)/.test(text)) emotional += 2;
  if (/\b(feel|remember|protect|keep|real|quiet|honest)\b/i.test(text)) emotional += 2;
  emotional = Math.max(1, Math.min(10, emotional));

  let scroll = 5;
  if (len >= 8 && len <= 50) scroll += 3;
  if (len < 8) scroll -= 2;
  if (len > 90) scroll -= 3;
  if (text.includes('.') && len > 30) scroll += 1;
  scroll = Math.max(1, Math.min(10, scroll));

  const relevance = Math.max(1, Math.min(10, 2 + hits * 2));

  let aiRisk = 3;
  if (/\$\{|undefined|null/.test(text)) aiRisk += 5;
  if (codeSwitched) aiRisk += 4;
  aiRisk = Math.max(1, Math.min(10, aiRisk));

  return clarity + specificity + commercial + emotional + scroll + relevance - aiRisk;
}

/** Pipeline floor — hooks below this are dropped when spares exist. */
export const HOOK_QUALITY_FLOOR = 24;
