/**
 * VERTICAL INTELLIGENCE · RESOLVER
 *
 * Given a brand input (4 onboarding answers), deterministically pick
 * one of the 10 V1 verticals and the locale to generate in.
 *
 * Detection is deterministic keyword-scan. No LLM call. If no vertical
 * scores above zero, we fall back to chocolate (the canonical vertical)
 * with a low-confidence flag so the caller can warn the operator.
 *
 * Locale detection: scan the locale string + the artifact for Hebrew
 * characters. Hebrew wins if any Hebrew text is present in the artifact
 * OR if the locale string mentions Hebrew/Israel.
 */

import type {
  BrandInputSignal, VerticalId, VerticalContext, Locale, LocaleRule,
  AudienceArchetype,
} from './types';
import { VERTICAL_KNOWLEDGE_BASE, getVertical } from './verticalKnowledgeBase';

// ─── detection keywords per vertical (literal substrings, lowercased) ─

interface DetectionRule {
  id: VerticalId;
  keywordsHe: string[];
  keywordsEn: string[];
  /** Tie-breaker priority when multiple verticals match. Higher wins. */
  priority: number;
}

const DETECTION_RULES: DetectionRule[] = [
  {
    id: 'chocolate',
    keywordsHe: ['שוקולד', 'קקאו', 'ריבוע שוקולד', 'מותג שוקולד'],
    keywordsEn: ['chocolate', 'cacao', 'cocoa', 'truffle', 'praline'],
    priority: 100, // very specific keyword
  },
  {
    id: 'real-estate',
    keywordsHe: ['נדל"ן', 'נדלן', 'נכסים', 'דירות', 'בניינים', 'השקעת נדל'],
    keywordsEn: ['real estate', 'real-estate', 'property', 'properties', 'residential', 'rental portfolio', 'investment property'],
    priority: 90,
  },
  {
    id: 'accountant',
    keywordsHe: ['רואה חשבון', 'חשבונאות', 'הנהלת חשבונות', 'מס הכנסה', 'מע"מ', 'דוחות שנתיים', 'בוקקיפינג'],
    keywordsEn: ['accountant', 'accounting', 'bookkeeping', 'cpa', 'tax service', 'tax preparation', 'tax filing', 'p&l', 'balance sheet'],
    priority: 90,
  },
  {
    id: 'lawyer',
    keywordsHe: ['עורך דין', 'עורכת דין', 'גירושין', 'דין משפחה', 'משפט משפחה', 'גישור', 'משמורת'],
    keywordsEn: ['lawyer', 'attorney', 'family law', 'divorce', 'mediation', 'custody', 'legal firm', 'law firm'],
    priority: 90,
  },
  {
    id: 'fitness',
    keywordsHe: ['נעלי ריצה', 'אימון ריצה', 'מרתון', 'חצי מרתון', 'ריצה', 'אימון', 'כושר'],
    keywordsEn: ['running shoes', 'running', 'runner', 'marathon', 'comeback runner', 'fitness', 'gym', 'training plan'],
    priority: 80,
  },
  {
    id: 'restaurant',
    keywordsHe: ['מסעדה', 'ארוחת ערב', 'שף', 'תפריט', 'הזמנת שולחן', 'בישול'],
    keywordsEn: ['restaurant', 'dinner', 'chef', 'menu', 'reservation', 'bistro', 'eatery', 'fine dining', 'neighborhood restaurant'],
    priority: 90,
  },
  {
    id: 'saas',
    keywordsHe: ['תוכנה', 'אפליקציה', 'sas', 'פוקוס', 'הפרעות', 'עבודה עמוקה', 'פרודוקטיביות'],
    keywordsEn: ['saas', 'software', 'productivity', 'focus', 'notifications', 'deep work', 'flow', 'productivity software', 'app for'],
    priority: 80,
  },
  {
    id: 'hvac',
    keywordsHe: ['מזגן', 'מזגנים', 'תיקון מזגן', 'מיזוג אוויר', 'טכנאי מזגנים', 'תחזוקת מזגן'],
    keywordsEn: ['hvac', 'air conditioning', 'air-conditioning', 'ac repair', 'ac service', 'air conditioner repair', 'cooling service'],
    priority: 95,
  },
  {
    id: 'jewelry',
    keywordsHe: ['תכשיט', 'תכשיטים', 'טבעת', 'שרשרת', 'יהלום', 'תכשיטנות', 'תכשיט יוקרה'],
    keywordsEn: ['jewelry', 'jewellery', 'ring', 'necklace', 'earring', 'diamond', 'fine jewelry', 'gold piece'],
    priority: 85,
  },
  {
    id: 'cosmetics',
    keywordsHe: ['קוסמטיקה', 'קרם פנים', 'קרם לחות', 'סקין קר', 'טיפוח עור', 'סרום', 'נוקה'],
    keywordsEn: ['cosmetics', 'skincare', 'skin-care', 'beauty brand', 'face cream', 'moisturizer', 'serum', 'cleanser'],
    priority: 85,
  },
];

const HEBREW_RE = /[֐-׿]/;

// ─── public entry ──────────────────────────────────────────────

export interface ResolveOptions {
  /** Optional caller override. Used by the verifier to force a vertical. */
  forceVerticalId?: VerticalId;
}

export function resolveLocale(brand: BrandInputSignal): Locale {
  const localeStr = (brand.locale || '').toLowerCase();
  const artifact = brand.artifact || '';
  const audience = brand.audience || '';
  const emotional = brand.emotional || '';
  const blob = `${artifact}\n${audience}\n${emotional}`;
  const hasHebrew = HEBREW_RE.test(blob);
  if (hasHebrew) return 'he';
  if (localeStr.includes('hebrew') || localeStr.includes('israel')) return 'he';
  if (localeStr.includes('english') || localeStr.includes('global') || localeStr.includes('us')) return 'en';
  // Default English when the operator typed Latin-only inputs.
  return 'en';
}

export function localeRuleFor(locale: Locale): LocaleRule {
  return locale === 'he' ? 'hebrew-only' : 'english-only';
}

export interface DetectionResult {
  verticalId: VerticalId;
  confidence: number;     // 0-1 · normalized
  evidence: string[];     // matched keywords
}

export function detectVertical(brand: BrandInputSignal): DetectionResult {
  const blob = `${brand.artifact ?? ''}\n${brand.audience ?? ''}\n${brand.emotional ?? ''}`.toLowerCase();
  let best: DetectionResult = { verticalId: 'chocolate', confidence: 0, evidence: [] };

  for (const rule of DETECTION_RULES) {
    const hits: string[] = [];
    for (const kw of rule.keywordsHe) {
      if (blob.includes(kw.toLowerCase())) hits.push(kw);
    }
    for (const kw of rule.keywordsEn) {
      if (blob.includes(kw.toLowerCase())) hits.push(kw);
    }
    if (hits.length === 0) continue;
    // Score = priority × hit count, normalized later.
    const score = rule.priority * hits.length;
    const confidence = Math.min(1, score / 200);
    if (confidence > best.confidence
        || (confidence === best.confidence && rule.priority > priorityFor(best.verticalId))) {
      best = { verticalId: rule.id, confidence, evidence: hits };
    }
  }

  return best;
}

function priorityFor(id: VerticalId): number {
  return DETECTION_RULES.find((r) => r.id === id)?.priority ?? 0;
}

export function resolveAudienceArchetype(
  brand: BrandInputSignal,
  verticalId: VerticalId,
): AudienceArchetype {
  const vertical = getVertical(verticalId);
  const audienceText = (brand.audience || '').toLowerCase();
  // Simple keyword overlap scoring against each archetype's demographic + psychographic
  let best = vertical.audienceArchetypes[0];
  let bestScore = -1;
  for (const arch of vertical.audienceArchetypes) {
    const fingerprint = `${arch.demographic} ${arch.psychographic}`.toLowerCase();
    let score = 0;
    // Tokenize by whitespace; reward overlap of 4+ char words
    const words = audienceText.split(/\s+/).filter((w) => w.length >= 4);
    for (const w of words) {
      if (fingerprint.includes(w)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = arch;
    }
  }
  return best;
}

/**
 * Resolve the full vertical context for a brand input.
 * Operator overrides bypass detection (useful for tests/verifiers).
 */
export function resolveVerticalContext(
  brand: BrandInputSignal,
  options: ResolveOptions = {},
): VerticalContext {
  let detection: DetectionResult;
  if (options.forceVerticalId && VERTICAL_KNOWLEDGE_BASE[options.forceVerticalId]) {
    detection = { verticalId: options.forceVerticalId, confidence: 1, evidence: ['force-override'] };
  } else {
    detection = detectVertical(brand);
  }

  const vertical = getVertical(detection.verticalId);
  const locale = resolveLocale(brand);
  const localeRule = localeRuleFor(locale);
  const resolvedAudience = resolveAudienceArchetype(brand, detection.verticalId);

  return {
    verticalId: detection.verticalId,
    vertical,
    locale,
    localeRule,
    resolvedAudience,
    detectionConfidence: detection.confidence,
    detectionEvidence: detection.evidence,
  };
}
