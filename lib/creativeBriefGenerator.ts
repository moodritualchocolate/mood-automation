/**
 * CREATIVE BRIEF GENERATOR (pure, observational)
 *
 * Phase 1 — Creative Production Layer.
 *
 * Transforms Asset Composer packages into production-ready BRIEFS for
 * five asset families: BANNER, CAROUSEL, IMAGE, VIDEO, LANDING PAGE.
 *
 * A brief is a structured production document — not a prompt, not an
 * asset, not a generation request. The human operator reviews it and
 * decides whether to proceed.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never publishes
 *   - never auto-posts
 *   - never auto-approves
 *   - allowed phrasing: "production-ready brief", "operator approval
 *     required", "may carry emotional weight", "observed alongside",
 *     "historically associated", "requires more evidence"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize,
 *     viral, dopamine, outrage, manipulat
 *
 * Human remains final authority.
 */

import type { Formula } from '@/core/types';

// ─── loose structural subsets ────────────────────────────────

export interface BriefStoryHint {
  blueprintId?: string;
  storyName?: string;
  storyType?: string;
  humanTension?: string;
  emotionalArc?: string;
  memoryAnchor?: string;
  presenceAnchor?: string;
  mythicFrame?: string;
  realismStyle?: string;
  alignment?: number;
  dignityProtection?: number;
  manipulationRisk?: number;
  riskLevel?: string;
  audienceFeeling?: string;
  whyThisMayMatter?: string;
}

export interface BriefSceneHint {
  sourceBlueprintId?: string;
  sourceStoryName?: string;
  sceneId?: string;
  sceneType?: string;
  location?: string;
  environment?: string;
  timeOfDay?: string;
  realismLevel?: number;
  cameraLanguage?: string;
  framingStyle?: string;
  lightingStyle?: string;
  silenceAllocation?: string;
  presenceAnchors?: string[];
  memoryAnchors?: string[];
  symbolismAnchors?: string[];
  dignityAnchors?: string[];
  emotionalWeight?: number;
  restraintLevel?: number;
}

export interface BriefRhythmHint {
  pacingProfile?: string;
  restraintProfile?: string;
  rhythmProfile?: Record<string, number>;
  silenceMoments?: Array<{ moment?: string; alignment?: number }>;
  breathingMoments?: Array<{ moment?: string; alignment?: number }>;
}

export interface BriefAssetPackages {
  imagePackages?: Array<{
    packageId: string;
    narrative?: string;
    scene?: string;
    presence?: string;
    rhythm?: string;
    realism?: string;
    visualLanguage?: string;
    memoryAnchors?: string[];
    emotionalWeight?: number;
  }>;
  videoPackages?: Array<{
    packageId: string;
    narrative?: string;
    sceneSequence?: Array<{ index: number; scene?: string; emotionalBeat?: string; silenceShare?: number }>;
    rhythm?: string;
    silenceMoments?: string[];
    presenceMoments?: string[];
    emotionalArc?: string;
    realismAnchors?: string[];
    emotionalWeight?: number;
  }>;
  bannerPackages?: Array<{
    packageId: string;
    emotionalDirection?: string;
    visualDirection?: string;
    memoryDirection?: string;
    restraintDirection?: string;
    compositionDirection?: string;
    emotionalWeight?: number;
  }>;
  landingPackages?: Array<{
    packageId: string;
    sectionPurpose?: string;
    emotionalPurpose?: string;
    narrativePurpose?: string;
    memoryAnchor?: string;
    visualAnchor?: string;
    emotionalWeight?: number;
  }>;
}

export interface CreativeBriefGeneratorInput {
  stories?: BriefStoryHint[];
  scenes?: BriefSceneHint[];
  rhythm?: BriefRhythmHint | null;
  packages?: BriefAssetPackages | null;
  /** Active product formula. */
  formula?: Formula;
  /** Optional brand notes. */
  brandLanguage?: 'hebrew' | 'mixed' | 'english';
  audienceMarket?: 'israel' | 'global';
}

// ─── output ───────────────────────────────────────────────────

export interface BannerBrief {
  briefId: string;
  briefType: 'banner';
  formula: Formula;
  sourceStoryName: string;
  audienceMarket: string;
  /** Mobile-first composition guidance. */
  composition: string;
  emotionalDirection: string;
  visualDirection: string;
  memoryDirection: string;
  restraintDirection: string;
  /** Banner copy direction — never copy text itself, only direction. */
  copyDirection: string;
  productDirection: string;
  dimensionsGuidance: string;
  operatorReviewRequired: true;
  notes: string[];
}

export interface CarouselFrameBrief {
  index: number;
  framePurpose: string;
  scene: string;
  presence: string;
  silenceAllocation: string;
}

export interface CarouselBrief {
  briefId: string;
  briefType: 'carousel';
  formula: Formula;
  sourceStoryName: string;
  audienceMarket: string;
  frameCount: number;
  frames: CarouselFrameBrief[];
  emotionalArc: string;
  rhythm: string;
  copyDirection: string;
  productDirection: string;
  dimensionsGuidance: string;
  operatorReviewRequired: true;
  notes: string[];
}

export interface ImageBrief {
  briefId: string;
  briefType: 'image';
  formula: Formula;
  sourceStoryName: string;
  audienceMarket: string;
  scene: string;
  presence: string;
  rhythm: string;
  realism: string;
  visualLanguage: string;
  memoryAnchors: string[];
  productDirection: string;
  dimensionsGuidance: string;
  copyDirection: string;
  operatorReviewRequired: true;
  notes: string[];
}

export interface VideoBeatBrief {
  index: number;
  beat: string;
  scene: string;
  silenceShare: number;
}

export interface VideoBrief {
  briefId: string;
  briefType: 'video';
  formula: Formula;
  sourceStoryName: string;
  audienceMarket: string;
  durationSeconds: number;
  beats: VideoBeatBrief[];
  emotionalArc: string;
  rhythm: string;
  silenceMoments: string[];
  presenceMoments: string[];
  realismAnchors: string[];
  copyDirection: string;
  productDirection: string;
  dimensionsGuidance: string;
  operatorReviewRequired: true;
  notes: string[];
}

export interface LandingSectionBrief {
  briefId: string;
  briefType: 'landing-section';
  formula: Formula;
  sourceStoryName: string;
  audienceMarket: string;
  sectionPurpose: string;
  emotionalPurpose: string;
  narrativePurpose: string;
  memoryAnchor: string;
  visualAnchor: string;
  copyDirection: string;
  productDirection: string;
  layoutGuidance: string;
  operatorReviewRequired: true;
  notes: string[];
}

export interface CreativeBriefReading {
  banners: BannerBrief[];
  carousels: CarouselBrief[];
  images: ImageBrief[];
  videos: VideoBrief[];
  landings: LandingSectionBrief[];
  dominantBriefIds: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Creative briefs are production-ready specifications only. ' +
  'Operator approval required before any production. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function get(v: number | undefined, d = 0): number { return v ?? d; }

function pickFormulaCopyDirection(formula: Formula, language: 'hebrew' | 'mixed' | 'english'): string {
  const lang = language === 'hebrew' ? 'Hebrew copy' :
               language === 'mixed' ? 'Hebrew-first copy with English variants' :
                                       'English copy';
  const mood =
    formula === 'ENERGY' ? 'quiet wake — restraint over hype' :
    formula === 'FOCUS' ? 'small steady — restraint over performance' :
    formula === 'RELAX' ? 'soft release — restraint over indulgence' :
                           'gentle descent — restraint over sedation';
  return `${lang} · ${mood} · no productivity-drug language · no luxury performance language · no influencer wellness language · no supplement hype`;
}

function productDirectionFor(formula: Formula): string {
  // The product is the existing MOOD chocolate. Brief refers to it
  // by formula. Brand guardian validates packaging.
  return `MOOD ${formula} chocolate · present as a quiet object in the scene · never an indulgence treat · never a hack · never a drug · operator validates packaging against brand guardian`;
}

function dimensionsGuidanceFor(briefType: string, market: 'israel' | 'global'): string {
  const mobileFirst = market === 'israel' ? 'mobile-first, Israeli market' : 'mobile-first';
  switch (briefType) {
    case 'banner':   return `${mobileFirst} · 1080x1350 (4:5) primary · 1080x1080 (1:1) secondary · safe areas for Hebrew RTL text`;
    case 'carousel': return `${mobileFirst} · 1080x1350 (4:5) per frame · 5-8 frames · Hebrew RTL safe areas per frame`;
    case 'image':    return `${mobileFirst} · 1080x1350 (4:5) primary · 1080x1920 (9:16) story · Hebrew RTL safe areas`;
    case 'video':    return `${mobileFirst} · 1080x1920 (9:16) vertical · 1080x1080 (1:1) feed · captions in Hebrew · safe areas for Hebrew RTL`;
    case 'landing-section': return `${mobileFirst} · responsive · Hebrew RTL layout · max-width 1280px on desktop · safe touch targets`;
    default: return mobileFirst;
  }
}

function mobileBannerComposition(scene: BriefSceneHint | undefined): string {
  const framing = scene?.framingStyle ?? 'mid-shot, off-center';
  const negative = 'large negative space top and bottom for Hebrew RTL copy';
  const focal = 'single focal anchor — the memory anchor, never the product alone';
  return `${framing} · ${negative} · ${focal}`;
}

function copyDirectionFor(
  briefType: 'banner' | 'carousel' | 'image' | 'video' | 'landing-section',
  formula: Formula,
  language: 'hebrew' | 'mixed' | 'english',
): string {
  const base = pickFormulaCopyDirection(formula, language);
  if (briefType === 'banner') return `${base} · 4-12 words · headline + small product line`;
  if (briefType === 'carousel') return `${base} · 4-12 words per frame · arc across the carousel`;
  if (briefType === 'image') return `${base} · single line of Hebrew · 4-10 words · optional product line`;
  if (briefType === 'video') return `${base} · captions for accessibility · final frame Hebrew product line only`;
  return `${base} · short paragraphs · no manufactured urgency · no aspirational claims`;
}

// ─── main ─────────────────────────────────────────────────────

export function computeCreativeBriefs(input: CreativeBriefGeneratorInput): CreativeBriefReading {
  const formula = input.formula ?? 'ENERGY';
  const market = input.audienceMarket ?? 'israel';
  const language = input.brandLanguage ?? 'hebrew';
  const stories = input.stories ?? [];
  const scenesArr = input.scenes ?? [];
  const rh = input.rhythm ?? null;
  const pkgs = input.packages ?? {};

  const sceneById = new Map<string, BriefSceneHint>();
  for (const s of scenesArr) if (s.sourceBlueprintId) sceneById.set(s.sourceBlueprintId, s);

  const banners: BannerBrief[] = [];
  const carousels: CarouselBrief[] = [];
  const images: ImageBrief[] = [];
  const videos: VideoBrief[] = [];
  const landings: LandingSectionBrief[] = [];

  for (const story of stories) {
    const scene = story.blueprintId ? sceneById.get(story.blueprintId) : undefined;
    const id = story.blueprintId ?? 'unknown';
    const baseNotes: string[] = ['operator review required'];
    if ((story.manipulationRisk ?? 0) >= 5 || story.riskLevel === 'high' || story.riskLevel === 'do-not-use') {
      baseNotes.push(`elevated risk observed alongside the source story (level: ${story.riskLevel ?? 'unknown'}) — operator review required`);
    }

    // ── banner ───────────────────────────────────────────────
    const bannerPkg = pkgs.bannerPackages?.find((p) => p.packageId === `banner-${id}`);
    banners.push({
      briefId: `brief-banner-${id}`,
      briefType: 'banner',
      formula,
      sourceStoryName: story.storyName ?? id,
      audienceMarket: market,
      composition: mobileBannerComposition(scene),
      emotionalDirection: bannerPkg?.emotionalDirection ?? (story.emotionalArc ?? 'fatigue → tenderness → continuation'),
      visualDirection: bannerPkg?.visualDirection ?? `${scene?.cameraLanguage ?? '50mm handheld'} · ${scene?.lightingStyle ?? 'natural light'}`,
      memoryDirection: bannerPkg?.memoryDirection ?? (story.memoryAnchor ?? 'familiar room'),
      restraintDirection: bannerPkg?.restraintDirection ?? (rh?.restraintProfile ?? 'measured-restraint').replace(/-/g, ' '),
      copyDirection: copyDirectionFor('banner', formula, language),
      productDirection: productDirectionFor(formula),
      dimensionsGuidance: dimensionsGuidanceFor('banner', market),
      operatorReviewRequired: true,
      notes: baseNotes,
    });

    // ── carousel ─────────────────────────────────────────────
    // Frame structure: 3 beats expanded to 5 frames — open, hold,
    // mid, hold, close. Pull rhythm silence allocations into per-frame
    // silence guidance.
    const silenceAlloc = scene?.silenceAllocation ?? 'majority silence';
    const carouselFrames: CarouselFrameBrief[] = [
      { index: 1, framePurpose: 'open · observed moment',         scene: scene?.location ?? 'familiar room', presence: story.presenceAnchor ?? 'unperformed presence', silenceAllocation: silenceAlloc },
      { index: 2, framePurpose: 'hold · the breath',              scene: scene?.location ?? 'familiar room', presence: story.presenceAnchor ?? 'unperformed presence', silenceAllocation: 'sustained silence' },
      { index: 3, framePurpose: 'mid · the small turn',           scene: scene?.location ?? 'familiar room', presence: story.presenceAnchor ?? 'unperformed presence', silenceAllocation: silenceAlloc },
      { index: 4, framePurpose: 'hold · the recognition',         scene: scene?.location ?? 'familiar room', presence: story.presenceAnchor ?? 'unperformed presence', silenceAllocation: 'sustained silence' },
      { index: 5, framePurpose: 'close · the product as object',  scene: scene?.location ?? 'familiar room', presence: 'product in hand or on table', silenceAllocation: 'final silence' },
    ];
    carousels.push({
      briefId: `brief-carousel-${id}`,
      briefType: 'carousel',
      formula,
      sourceStoryName: story.storyName ?? id,
      audienceMarket: market,
      frameCount: carouselFrames.length,
      frames: carouselFrames,
      emotionalArc: story.emotionalArc ?? 'fatigue → tenderness → continuation',
      rhythm: `${(rh?.pacingProfile ?? 'measured-restrained').replace(/-/g, ' ')} · ${(rh?.restraintProfile ?? 'measured-restraint').replace(/-/g, ' ')}`,
      copyDirection: copyDirectionFor('carousel', formula, language),
      productDirection: productDirectionFor(formula),
      dimensionsGuidance: dimensionsGuidanceFor('carousel', market),
      operatorReviewRequired: true,
      notes: baseNotes,
    });

    // ── image ────────────────────────────────────────────────
    const imagePkg = pkgs.imagePackages?.find((p) => p.packageId === `image-${id}`);
    images.push({
      briefId: `brief-image-${id}`,
      briefType: 'image',
      formula,
      sourceStoryName: story.storyName ?? id,
      audienceMarket: market,
      scene: imagePkg?.scene ?? `${scene?.location ?? 'familiar room'} · ${scene?.timeOfDay ?? 'afternoon'}`,
      presence: imagePkg?.presence ?? (story.presenceAnchor ?? 'unperformed presence'),
      rhythm: imagePkg?.rhythm ?? `${(rh?.pacingProfile ?? 'measured-restrained').replace(/-/g, ' ')} · ${(rh?.restraintProfile ?? 'measured-restraint').replace(/-/g, ' ')}`,
      realism: imagePkg?.realism ?? 'documentary handheld · natural light · restrained edit',
      visualLanguage: imagePkg?.visualLanguage ?? `${scene?.cameraLanguage ?? '50mm handheld'} · ${scene?.framingStyle ?? 'mid-shot, off-center'} · ${scene?.lightingStyle ?? 'natural light'}`,
      memoryAnchors: imagePkg?.memoryAnchors ?? (scene?.memoryAnchors ?? [story.memoryAnchor ?? 'familiar room']).filter(Boolean) as string[],
      productDirection: productDirectionFor(formula),
      dimensionsGuidance: dimensionsGuidanceFor('image', market),
      copyDirection: copyDirectionFor('image', formula, language),
      operatorReviewRequired: true,
      notes: baseNotes,
    });

    // ── video ────────────────────────────────────────────────
    const videoPkg = pkgs.videoPackages?.find((p) => p.packageId === `video-${id}`);
    const beats: VideoBeatBrief[] = (videoPkg?.sceneSequence ?? [
      { index: 1, scene: scene?.location ?? 'familiar room', emotionalBeat: 'tension observed alongside the scene', silenceShare: 0.5 },
      { index: 2, scene: scene?.location ?? 'familiar room', emotionalBeat: 'pause / breathing room observed alongside the scene', silenceShare: 0.7 },
      { index: 3, scene: scene?.location ?? 'familiar room', emotionalBeat: 'release historically associated with restraint', silenceShare: 0.9 },
    ]).map((b) => ({
      index: b.index ?? 0,
      beat: b.emotionalBeat ?? '',
      scene: b.scene ?? '',
      silenceShare: b.silenceShare ?? 0,
    }));
    // Duration scales with weight + scene count — minimum 15s, max 30s.
    const baseDuration = 15 + Math.min(15, Math.round(get(story.alignment) * 1.5));
    videos.push({
      briefId: `brief-video-${id}`,
      briefType: 'video',
      formula,
      sourceStoryName: story.storyName ?? id,
      audienceMarket: market,
      durationSeconds: baseDuration,
      beats,
      emotionalArc: videoPkg?.emotionalArc ?? (story.emotionalArc ?? 'fatigue → tenderness → continuation'),
      rhythm: videoPkg?.rhythm ?? `${(rh?.pacingProfile ?? 'measured-restrained').replace(/-/g, ' ')} · ${(rh?.restraintProfile ?? 'measured-restraint').replace(/-/g, ' ')}`,
      silenceMoments: videoPkg?.silenceMoments ?? [scene?.silenceAllocation ?? 'majority silence'],
      presenceMoments: videoPkg?.presenceMoments ?? (scene?.presenceAnchors ?? [story.presenceAnchor ?? 'unperformed presence']) as string[],
      realismAnchors: videoPkg?.realismAnchors ?? ['documentary handheld · natural light · restrained edit'],
      copyDirection: copyDirectionFor('video', formula, language),
      productDirection: productDirectionFor(formula),
      dimensionsGuidance: dimensionsGuidanceFor('video', market),
      operatorReviewRequired: true,
      notes: baseNotes,
    });

    // ── landing section ──────────────────────────────────────
    const landingPkg = pkgs.landingPackages?.find((p) => p.packageId === `landing-${id}`);
    landings.push({
      briefId: `brief-landing-${id}`,
      briefType: 'landing-section',
      formula,
      sourceStoryName: story.storyName ?? id,
      audienceMarket: market,
      sectionPurpose: landingPkg?.sectionPurpose ?? `${(story.storyType ?? 'home').replace(/-/g, ' ')} section`,
      emotionalPurpose: landingPkg?.emotionalPurpose ?? (story.audienceFeeling ?? 'a quiet recognition observed alongside the outputs'),
      narrativePurpose: landingPkg?.narrativePurpose ?? (story.whyThisMayMatter ?? 'production-ready brief — operator approval required'),
      memoryAnchor: landingPkg?.memoryAnchor ?? (story.memoryAnchor ?? 'familiar room'),
      visualAnchor: landingPkg?.visualAnchor ?? (scene?.lightingStyle ?? 'natural light'),
      copyDirection: copyDirectionFor('landing-section', formula, language),
      productDirection: productDirectionFor(formula),
      layoutGuidance: dimensionsGuidanceFor('landing-section', market),
      operatorReviewRequired: true,
      notes: baseNotes,
    });
  }

  // Dominant briefs — top three by source-story alignment.
  const dominantBriefIds = stories
    .slice()
    .sort((a, b) => (b.alignment ?? 0) - (a.alignment ?? 0))
    .slice(0, 3)
    .flatMap((s) => [
      `brief-banner-${s.blueprintId ?? 'unknown'}`,
      `brief-image-${s.blueprintId ?? 'unknown'}`,
      `brief-video-${s.blueprintId ?? 'unknown'}`,
    ]);

  const notes: string[] = [];
  notes.push('production-ready briefs — operator approval required before any production');
  if (stories.length === 0) {
    notes.push('no source story blueprints provided — requires more evidence');
  }

  return {
    banners,
    carousels,
    images,
    videos,
    landings,
    dominantBriefIds,
    notes,
    reasonCodes: [
      `formula:${formula}`,
      `market:${market}`,
      `bannerCount:${banners.length}`,
      `carouselCount:${carousels.length}`,
      `imageCount:${images.length}`,
      `videoCount:${videos.length}`,
      `landingCount:${landings.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
