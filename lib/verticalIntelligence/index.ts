/**
 * VERTICAL INTELLIGENCE · barrel export.
 */

export * from './types';
export {
  VERTICAL_KNOWLEDGE_BASE,
  ALL_VERTICAL_IDS,
  getVertical,
} from './verticalKnowledgeBase';
export {
  resolveVerticalContext,
  detectVertical,
  resolveLocale,
  resolveAudienceArchetype,
  localeRuleFor,
  type DetectionResult,
  type ResolveOptions,
} from './resolveVerticalContext';
export {
  assembleGenerationContext,
  validateLocalePurity,
  hasRequiredVocab,
  hasForbiddenVocab,
  hasCrossVerticalLeak,
  verticalKeywordDensity,
  type LocaleValidationResult,
} from './contextAssembly';
