/**
 * CAROUSEL EXECUTION ENGINE (pure, observational)
 *
 * Phase 3 — Execution Layer.
 *
 * Transforms an APPROVED carousel brief + production prompt into a
 * CAROUSEL GENERATION PACKAGE — per-slide copy, visual instructions,
 * and layout. This engine does NOT call any image model. It composes
 * the spec text only.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never calls a generator
 *   - never publishes
 *   - never auto-approves
 *
 * Human remains final authority.
 */

import type { Formula } from '@/core/types';
import type { CarouselBrief } from './creativeBriefGenerator';
import type { PromptArtifact } from './promptArchitect';

// ─── input ────────────────────────────────────────────────────

export interface CarouselExecutionInput {
  brief: CarouselBrief;
  prompt: PromptArtifact;
  platform?: CarouselPlatform;
}

export type CarouselPlatform = 'instagram-feed' | 'facebook-feed';

// ─── output ───────────────────────────────────────────────────

export interface CarouselSlideSpec {
  /** 1-indexed. */
  index: number;
  slideId: string;
  framePurpose: string;
  /** Copy direction for the slide — NOT the copy text itself. */
  copy: string;
  /** Visual instructions for the slide. */
  visualInstructions: string;
  layout: string;
  silenceAllocation: string;
}

export interface CarouselExecutionPackage {
  packageId: string;
  packageType: 'carousel';
  formula: Formula;
  sourceStoryName: string;
  sourceBriefId: string;
  sourcePromptId: string;
  prompt: string;
  /** Ordered slide list. */
  slides: CarouselSlideSpec[];
  slideCount: number;
  emotionalArc: string;
  rhythm: string;
  aspectRatio: '4:5' | '1:1';
  dimensions: { width: number; height: number };
  platform: CarouselPlatform;
  targetAudience: string;
  operatorApprovalRequired: true;
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Carousel execution package is a specification only. ' +
  'No carousel generation occurs in this engine. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function platformFor(brief: CarouselBrief): CarouselPlatform {
  if (brief.audienceMarket === 'global') return 'instagram-feed';
  return 'instagram-feed';
}

function copyDirectionForSlide(brief: CarouselBrief, frameIndex: number, isClose: boolean): string {
  const lang = brief.audienceMarket === 'israel' ? 'Hebrew RTL · 4-12 words' : 'English · 4-12 words';
  if (isClose) {
    return `${lang} · small product line · no aspirational claim · no urgency`;
  }
  if (frameIndex === 1) {
    return `${lang} · open the moment · observed not declared · no headline gimmick`;
  }
  return `${lang} · carry the moment forward · restrained tone`;
}

function visualInstructionsForSlide(
  brief: CarouselBrief, frameIndex: number, totalFrames: number, scenePart: string, presence: string,
): string {
  if (frameIndex === 1) {
    return [
      `scene: ${scenePart}`,
      `presence: ${presence}`,
      'composition: large negative space top for Hebrew RTL copy · single focal anchor',
      'camera: 50mm handheld · close, low angle, off-center · single warm practical light',
      'avoid: stock-photo gloss · aspirational pose · oversized product',
    ].join(' · ');
  }
  if (frameIndex === totalFrames) {
    return [
      `scene: ${scenePart}`,
      `presence: ${presence}`,
      'composition: centered restraint · product as quiet object · large negative space',
      'camera: 50mm fixed · tight on hands and product · soft natural light',
      'avoid: dramatic flourish · sale-banner aesthetic',
    ].join(' · ');
  }
  return [
    `scene: ${scenePart}`,
    `presence: ${presence}`,
    'composition: off-center · single focal anchor · ambient room sound implied',
    'camera: 35mm handheld · mid-shot · soft natural light · minimal movement',
    'avoid: jump-cut energy · over-styling',
  ].join(' · ');
}

function layoutFor(brief: CarouselBrief, frameIndex: number): string {
  const lang = brief.audienceMarket === 'israel' ? 'Hebrew RTL safe areas top + bottom' : 'safe areas top + bottom';
  if (frameIndex === 1) {
    return `${lang} · headline area top · single line copy ~14% from top`;
  }
  return `${lang} · copy line low-left (LTR) or low-right (RTL) · 12% margin from edge`;
}

// ─── main ─────────────────────────────────────────────────────

export function composeCarouselExecutionPackage(input: CarouselExecutionInput): CarouselExecutionPackage {
  const { brief, prompt } = input;
  const platform = input.platform ?? platformFor(brief);
  const aspectRatio = '4:5' as const;
  const dimensions = { width: 1080, height: 1350 };
  const totalFrames = brief.frames.length;

  const slides: CarouselSlideSpec[] = brief.frames.map((f) => {
    const isClose = f.index === totalFrames;
    return {
      index: f.index,
      slideId: `slide-${f.index}`,
      framePurpose: f.framePurpose,
      copy: copyDirectionForSlide(brief, f.index, isClose),
      visualInstructions: visualInstructionsForSlide(brief, f.index, totalFrames, f.scene, f.presence),
      layout: layoutFor(brief, f.index),
      silenceAllocation: f.silenceAllocation,
    };
  });

  return {
    packageId: `exec-carousel-${brief.briefId.replace('brief-carousel-', '')}`,
    packageType: 'carousel',
    formula: brief.formula,
    sourceStoryName: brief.sourceStoryName,
    sourceBriefId: brief.briefId,
    sourcePromptId: prompt.promptId,
    prompt: prompt.promptText,
    slides,
    slideCount: slides.length,
    emotionalArc: brief.emotionalArc,
    rhythm: brief.rhythm,
    aspectRatio,
    dimensions,
    platform,
    targetAudience: brief.audienceMarket === 'israel'
      ? 'Adults observed seeking restraint over hype · Israeli market · mobile-first'
      : 'Adults observed seeking restraint over hype · global',
    operatorApprovalRequired: true,
    notes: [
      'execution package — ready for operator-driven generation',
      'operator approval required before any generation',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
