/**
 * VERTICAL INTELLIGENCE · TYPES
 *
 * Shared types for the per-vertical knowledge layer.
 * Source: docs/vertical-intelligence-engine.md.
 *
 * STRICT CONTRACT:
 *   - all templates are FULLY-FORMED strings (no ${var} placeholders)
 *   - operator inputs are SIGNALS for ranking, not text to substitute
 *   - locale is enforced at selection time (no Hebrew text leaks into
 *     an English-only output, and vice-versa)
 *   - the chocolate vertical's vocabulary may only appear when the
 *     resolved vertical is `chocolate`
 */

export type Locale = 'he' | 'en';

export type LocaleRule =
  | 'hebrew-only'      // Hebrew input + Hebrew locale → Hebrew only
  | 'english-only'     // English input + English locale → English only
  | 'bilingual-allowed'; // explicitly opted-in (not used in V1)

export type VerticalId =
  | 'real-estate'
  | 'accountant'
  | 'lawyer'
  | 'fitness'
  | 'restaurant'
  | 'saas'
  | 'hvac'
  | 'jewelry'
  | 'cosmetics'
  | 'chocolate';

export type HookFamily =
  | 'authority'
  | 'pain-mirror'
  | 'permission'
  | 'invitation'
  | 'urgency'
  | 'social-proof'
  | 'contrast'
  | 'transparency'
  | 'craft'
  | 'identity'
  | 'sensory'
  | 'warning'
  | 'curiosity'
  | 'anti-marketing'
  | 'empathy'
  | 'truth-mirror'
  | 'checklist'
  | 'significance'
  | 'heirloom'
  | 'ingredient-truth'
  | 'real-photo'
  | 'founder-story'
  | 'chef-led'
  | 'scarcity'
  | 'regular'
  | 'competence'
  | 'roi'
  | 'child-focused';

export interface AudienceArchetype {
  id: string;
  label: string;
  demographic: string;
  psychographic: string;
}

export interface OneLinerTemplate {
  locale: Locale;
  text: string;
}

export interface HookTemplate {
  family: HookFamily;
  locale: Locale;
  text: string;
}

export interface UgcScriptTemplate {
  locale: Locale;
  title: string;
  durationSec: number;
  script: string;
  shotList: string[];
  cta: string;
  /** Angle-pattern label (e.g., 'reviewer-week-test', 'transformation-story'). */
  angle: string;
}

export interface ImageConceptTemplate {
  locale: Locale;
  title: string;
  description: string;
  renderingNote: string;
}

export interface Vocabulary {
  /** Words/phrases the output MUST include to feel industry-native. */
  required: { he: string[]; en: string[] };
  /** Words signalling sketchy operators in this vertical · always avoid. */
  forbidden: { he: string[]; en: string[] };
  /** Cross-vertical leakage prevention. e.g., MOOD's "presence" language
   * must not appear in HVAC. The MOOD chocolate vertical is the only one
   * that may contain its own canonical terms. */
  forbiddenWrongCategory: string[];
}

export interface VerticalKnowledge {
  id: VerticalId;
  displayName: string;
  /** Locales the vertical is curated for. Falls through to the first
   * entry when an unsupported locale is requested. */
  supportedLocales: Locale[];

  audienceArchetypes: AudienceArchetype[];

  customerPains: { he: string[]; en: string[] };
  customerDesires: { he: string[]; en: string[] };
  buyingTriggers: { he: string[]; en: string[] };
  purchaseMoments: { he: string[]; en: string[] };
  trustSignals: { he: string[]; en: string[] };
  proofTypes: string[];

  ctaStyles: { he: string[]; en: string[] };
  ugcAnglePatterns: string[];
  bestPerformingAdFormats: string[];

  vocabulary: Vocabulary;
  emotionalTerritory: { he: string; en: string };

  oneLiners: OneLinerTemplate[];
  hooks: HookTemplate[];
  ugcScripts: UgcScriptTemplate[];
  imageConcepts: ImageConceptTemplate[];

  legalConstraints: string[];
  /** Sensitivity warnings (e.g., divorce: avoid "easy/quick"). */
  regulatorySensitivityWarnings: string[];
}

export interface VerticalContext {
  verticalId: VerticalId;
  vertical: VerticalKnowledge;
  locale: Locale;
  localeRule: LocaleRule;
  resolvedAudience: AudienceArchetype;
  /** Confidence 0-1 of the keyword-match detection. */
  detectionConfidence: number;
  /** Top keyword matches that drove the resolution. */
  detectionEvidence: string[];
}

export interface GenerationContext {
  vertical: VerticalKnowledge;
  verticalId: VerticalId;
  locale: Locale;
  localeRule: LocaleRule;
  resolvedAudience: AudienceArchetype;

  /** Pulled from vocabulary, locale-aware. */
  vocabularyRequired: string[];
  vocabularyForbidden: string[];
  vocabularyForbiddenCrossVertical: string[];

  emotionalTerritory: string;
  customerPains: string[];
  customerDesires: string[];
  purchaseMoments: string[];
  trustSignals: string[];
  ctaStyles: string[];

  /** Pre-filtered to the resolved locale. */
  availableHooks: HookTemplate[];
  availableOneLiners: OneLinerTemplate[];
  availableUgcScripts: UgcScriptTemplate[];
  availableImageConcepts: ImageConceptTemplate[];
}

export interface BrandInputSignal {
  artifact: string;
  audience: string;
  emotional: string;
  locale: string;
}
