/**
 * PROMPT ARCHITECT (pure, observational)
 *
 * Phase 2 — Creative Production Layer.
 *
 * Converts creative briefs into PRODUCTION PROMPTS. Outputs structured
 * imagePrompt, videoPrompt, bannerPrompt, landingPrompt strings ready
 * for operator review and operator-driven use in image / video / web
 * tooling.
 *
 * The engine produces PROMPT TEXT only. It does not call any image
 * model, video model, or publishing system.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never calls a generator
 *   - never publishes
 *   - allowed phrasing: "production prompt", "operator approval required",
 *     "may carry emotional weight", "observed alongside",
 *     "historically associated"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize,
 *     viral, dopamine, outrage, manipulat, exploit
 *
 * Human remains final authority.
 */

import type { Formula } from '@/core/types';
import type {
  BannerBrief, CarouselBrief, ImageBrief, VideoBrief, LandingSectionBrief,
} from './creativeBriefGenerator';

// ─── input ────────────────────────────────────────────────────

export interface PromptArchitectInput {
  banners?: BannerBrief[];
  carousels?: CarouselBrief[];
  images?: ImageBrief[];
  videos?: VideoBrief[];
  landings?: LandingSectionBrief[];
  formula?: Formula;
  brandLanguage?: 'hebrew' | 'mixed' | 'english';
  audienceMarket?: 'israel' | 'global';
}

// ─── output ───────────────────────────────────────────────────

export interface PromptArtifact {
  promptId: string;
  promptType: 'image' | 'video' | 'banner' | 'landing';
  formula: Formula;
  sourceStoryName: string;
  /** The full prompt text — ready for operator review. */
  promptText: string;
  /** A short summary line for the studio panel. */
  summary: string;
  /** Token-budget guidance for the operator. */
  tokenBudget: number;
  operatorReviewRequired: true;
  notes: string[];
}

export interface PromptArchitectReading {
  imagePrompts: PromptArtifact[];
  videoPrompts: PromptArtifact[];
  bannerPrompts: PromptArtifact[];
  landingPrompts: PromptArtifact[];
  carouselPrompts: PromptArtifact[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Production prompts are specifications for operator-driven asset creation. ' +
  'No asset creation occurs in this engine. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function formulaTone(formula: Formula): string {
  switch (formula) {
    case 'ENERGY': return 'MOOD ENERGY — quiet wake · grounded morning · soft warm light · no hype';
    case 'FOCUS':  return 'MOOD FOCUS — small steady · workspace stillness · cool neutral light · no productivity-drug language';
    case 'RELAX':  return 'MOOD RELAX — soft release · evening room · warm low light · no indulgence language';
    case 'SLEEP':  return 'MOOD SLEEP — gentle descent · night room · single warm lamp · no sedation language';
  }
}

function brandRules(language: 'hebrew' | 'mixed' | 'english', market: 'israel' | 'global'): string {
  const langLine = language === 'hebrew'
    ? 'all copy text in Hebrew · right-to-left layout for any text · keep Hebrew safe areas clear'
    : language === 'mixed'
    ? 'Hebrew-first copy with English variants for global reach · Hebrew RTL safe areas'
    : 'English copy';
  const marketLine = market === 'israel' ? 'Israeli audience · mobile-first composition' : 'mobile-first composition';
  return [
    'brand product: MOOD chocolate (real chocolate bar / square, present as a quiet object)',
    'no invented products · no fictional flavors · no packaging variants outside the brand line',
    'no luxury performance aesthetic · no influencer wellness aesthetic · no productivity-drug narrative',
    'no aspirational text overlay · no clickbait headline',
    langLine,
    marketLine,
  ].join(' · ');
}

function productDimensions(): string {
  return [
    'product dimension reference: chocolate bar (approx 80–100mm long) or single square (approx 25mm)',
    'product held by a human hand, set on a real surface, or beside a real object — never floating',
    'no scale exaggeration · no impossible angles · no product as protagonist',
  ].join(' · ');
}

// ─── prompt construction ──────────────────────────────────────

function constructImagePrompt(b: ImageBrief): string {
  return [
    `[PRODUCTION IMAGE PROMPT · MOOD ${b.formula} · ${b.sourceStoryName}]`,
    `Scene: ${b.scene}`,
    `Presence: ${b.presence}`,
    `Realism: ${b.realism}`,
    `Visual language: ${b.visualLanguage}`,
    `Memory anchors: ${b.memoryAnchors.join(' · ')}`,
    `Rhythm: ${b.rhythm}`,
    `Tone: ${formulaTone(b.formula)}`,
    `Product direction: ${b.productDirection}`,
    `Product dimensions: ${productDimensions()}`,
    `Brand rules: ${brandRules(b.audienceMarket === 'israel' ? 'hebrew' : 'english', b.audienceMarket as 'israel' | 'global')}`,
    `Composition: ${b.dimensionsGuidance}`,
    `Copy direction: ${b.copyDirection}`,
    `Avoid: stock-photo gloss, plastic skin, exaggerated polish, perfect lighting, aspirational pose`,
    `Operator note: production-ready prompt — operator approval required`,
  ].join('\n');
}

function constructVideoPrompt(b: VideoBrief): string {
  const beats = b.beats.map((beat) =>
    `· beat ${beat.index} (silence ${beat.silenceShare}): ${beat.scene} — ${beat.beat}`,
  ).join('\n');
  return [
    `[PRODUCTION VIDEO PROMPT · MOOD ${b.formula} · ${b.sourceStoryName}]`,
    `Duration: ${b.durationSeconds}s`,
    `Emotional arc: ${b.emotionalArc}`,
    `Rhythm: ${b.rhythm}`,
    `Beats:\n${beats}`,
    `Silence moments: ${b.silenceMoments.join(' · ')}`,
    `Presence moments: ${b.presenceMoments.join(' · ')}`,
    `Realism anchors: ${b.realismAnchors.join(' · ')}`,
    `Tone: ${formulaTone(b.formula)}`,
    `Product direction: ${b.productDirection}`,
    `Product dimensions: ${productDimensions()}`,
    `Brand rules: ${brandRules(b.audienceMarket === 'israel' ? 'hebrew' : 'english', b.audienceMarket as 'israel' | 'global')}`,
    `Output: ${b.dimensionsGuidance}`,
    `Copy direction: ${b.copyDirection}`,
    `Avoid: hype cuts, fast zooms, dramatic music swell, manufactured urgency, aspirational voice-over`,
    `Operator note: production-ready prompt — operator approval required`,
  ].join('\n');
}

function constructBannerPrompt(b: BannerBrief): string {
  return [
    `[PRODUCTION BANNER PROMPT · MOOD ${b.formula} · ${b.sourceStoryName}]`,
    `Composition: ${b.composition}`,
    `Emotional direction: ${b.emotionalDirection}`,
    `Visual direction: ${b.visualDirection}`,
    `Memory direction: ${b.memoryDirection}`,
    `Restraint direction: ${b.restraintDirection}`,
    `Tone: ${formulaTone(b.formula)}`,
    `Product direction: ${b.productDirection}`,
    `Product dimensions: ${productDimensions()}`,
    `Brand rules: ${brandRules(b.audienceMarket === 'israel' ? 'hebrew' : 'english', b.audienceMarket as 'israel' | 'global')}`,
    `Composition / sizing: ${b.dimensionsGuidance}`,
    `Copy direction: ${b.copyDirection}`,
    `Avoid: stock gloss, sale-banner aesthetic, aspirational pose, oversized product`,
    `Operator note: production-ready prompt — operator approval required`,
  ].join('\n');
}

function constructCarouselPrompt(c: CarouselBrief): string {
  const frames = c.frames.map((f) =>
    `· frame ${f.index} — ${f.framePurpose}\n    scene: ${f.scene}\n    presence: ${f.presence}\n    silence: ${f.silenceAllocation}`,
  ).join('\n');
  return [
    `[PRODUCTION CAROUSEL PROMPT · MOOD ${c.formula} · ${c.sourceStoryName}]`,
    `Frame count: ${c.frameCount}`,
    `Emotional arc: ${c.emotionalArc}`,
    `Rhythm: ${c.rhythm}`,
    `Frames:\n${frames}`,
    `Tone: ${formulaTone(c.formula)}`,
    `Product direction: ${c.productDirection}`,
    `Product dimensions: ${productDimensions()}`,
    `Brand rules: ${brandRules(c.audienceMarket === 'israel' ? 'hebrew' : 'english', c.audienceMarket as 'israel' | 'global')}`,
    `Sizing: ${c.dimensionsGuidance}`,
    `Copy direction: ${c.copyDirection}`,
    `Avoid: arc that resolves into a sales pitch, before-after gimmick, manufactured urgency`,
    `Operator note: production-ready prompt — operator approval required`,
  ].join('\n');
}

function constructLandingPrompt(b: LandingSectionBrief): string {
  return [
    `[PRODUCTION LANDING SECTION PROMPT · MOOD ${b.formula} · ${b.sourceStoryName}]`,
    `Section purpose: ${b.sectionPurpose}`,
    `Emotional purpose: ${b.emotionalPurpose}`,
    `Narrative purpose: ${b.narrativePurpose}`,
    `Memory anchor: ${b.memoryAnchor}`,
    `Visual anchor: ${b.visualAnchor}`,
    `Tone: ${formulaTone(b.formula)}`,
    `Product direction: ${b.productDirection}`,
    `Product dimensions: ${productDimensions()}`,
    `Brand rules: ${brandRules(b.audienceMarket === 'israel' ? 'hebrew' : 'english', b.audienceMarket as 'israel' | 'global')}`,
    `Layout: ${b.layoutGuidance}`,
    `Copy direction: ${b.copyDirection}`,
    `Avoid: marketing-speak headlines, aspirational claims, manufactured urgency, supplement framing`,
    `Operator note: production-ready prompt — operator approval required`,
  ].join('\n');
}

function tokenBudgetFor(promptText: string): number {
  // Coarse token estimate — characters / 4.
  return Math.ceil(promptText.length / 4);
}

// ─── main ─────────────────────────────────────────────────────

export function computeProductionPrompts(input: PromptArchitectInput): PromptArchitectReading {
  const banners = input.banners ?? [];
  const carousels = input.carousels ?? [];
  const images = input.images ?? [];
  const videos = input.videos ?? [];
  const landings = input.landings ?? [];

  const imagePrompts: PromptArtifact[] = images.map((b) => {
    const text = constructImagePrompt(b);
    return {
      promptId: `prompt-image-${b.briefId.replace('brief-image-', '')}`,
      promptType: 'image',
      formula: b.formula,
      sourceStoryName: b.sourceStoryName,
      promptText: text,
      summary: `Image · ${b.sourceStoryName} · ${b.scene}`,
      tokenBudget: tokenBudgetFor(text),
      operatorReviewRequired: true,
      notes: ['production-ready prompt — operator approval required'],
    };
  });

  const videoPrompts: PromptArtifact[] = videos.map((b) => {
    const text = constructVideoPrompt(b);
    return {
      promptId: `prompt-video-${b.briefId.replace('brief-video-', '')}`,
      promptType: 'video',
      formula: b.formula,
      sourceStoryName: b.sourceStoryName,
      promptText: text,
      summary: `Video · ${b.sourceStoryName} · ${b.durationSeconds}s · ${b.beats.length} beats`,
      tokenBudget: tokenBudgetFor(text),
      operatorReviewRequired: true,
      notes: ['production-ready prompt — operator approval required'],
    };
  });

  const bannerPrompts: PromptArtifact[] = banners.map((b) => {
    const text = constructBannerPrompt(b);
    return {
      promptId: `prompt-banner-${b.briefId.replace('brief-banner-', '')}`,
      promptType: 'banner',
      formula: b.formula,
      sourceStoryName: b.sourceStoryName,
      promptText: text,
      summary: `Banner · ${b.sourceStoryName} · ${b.composition.slice(0, 60)}`,
      tokenBudget: tokenBudgetFor(text),
      operatorReviewRequired: true,
      notes: ['production-ready prompt — operator approval required'],
    };
  });

  const landingPrompts: PromptArtifact[] = landings.map((b) => {
    const text = constructLandingPrompt(b);
    return {
      promptId: `prompt-landing-${b.briefId.replace('brief-landing-', '')}`,
      promptType: 'landing',
      formula: b.formula,
      sourceStoryName: b.sourceStoryName,
      promptText: text,
      summary: `Landing · ${b.sourceStoryName} · ${b.sectionPurpose}`,
      tokenBudget: tokenBudgetFor(text),
      operatorReviewRequired: true,
      notes: ['production-ready prompt — operator approval required'],
    };
  });

  const carouselPrompts: PromptArtifact[] = carousels.map((b) => {
    const text = constructCarouselPrompt(b);
    return {
      promptId: `prompt-carousel-${b.briefId.replace('brief-carousel-', '')}`,
      promptType: 'image', // carousel uses image-family tooling typically
      formula: b.formula,
      sourceStoryName: b.sourceStoryName,
      promptText: text,
      summary: `Carousel · ${b.sourceStoryName} · ${b.frameCount} frames`,
      tokenBudget: tokenBudgetFor(text),
      operatorReviewRequired: true,
      notes: ['production-ready prompt — operator approval required'],
    };
  });

  const notes: string[] = [];
  notes.push('production prompts — operator approval required before any operator-driven generation');
  if (images.length === 0 && videos.length === 0 && banners.length === 0 &&
      landings.length === 0 && carousels.length === 0) {
    notes.push('no source briefs provided — requires more evidence');
  }

  return {
    imagePrompts,
    videoPrompts,
    bannerPrompts,
    landingPrompts,
    carouselPrompts,
    notes,
    reasonCodes: [
      `image:${imagePrompts.length}`,
      `video:${videoPrompts.length}`,
      `banner:${bannerPrompts.length}`,
      `landing:${landingPrompts.length}`,
      `carousel:${carouselPrompts.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
