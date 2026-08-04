/**
 * IMAGE EXECUTION ENGINE (pure, observational)
 *
 * Phase 1 — Execution Layer.
 *
 * Transforms an APPROVED image brief + production prompt into an
 * IMAGE GENERATION PACKAGE — the structured spec the operator
 * passes into their chosen image tool. This engine does NOT call
 * any image model. It composes the spec text only.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never calls a generator
 *   - never publishes
 *   - never auto-approves
 *   - allowed phrasing: "execution package", "operator approval
 *     required", "ready for operator-driven generation"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize,
 *     viral, dopamine, outrage, manipulat, exploit, auto-approve
 *
 * Human remains final authority.
 */

import type { Formula } from '@/core/types';
import type { ImageBrief } from './creativeBriefGenerator';
import type { PromptArtifact } from './promptArchitect';

// ─── input ────────────────────────────────────────────────────

export interface ImageExecutionInput {
  brief: ImageBrief;
  prompt: PromptArtifact;
  platform?: ImagePlatform;
  aspectRatio?: ImageAspectRatio;
  style?: string;
}

export type ImagePlatform =
  | 'instagram-feed' | 'instagram-story' | 'facebook-feed' | 'pinterest'
  | 'website-hero' | 'tiktok-static';

export type ImageAspectRatio = '1:1' | '4:5' | '9:16' | '16:9' | '3:4';

// ─── output ───────────────────────────────────────────────────

export interface ImageExecutionPackage {
  packageId: string;
  packageType: 'image';
  formula: Formula;
  sourceStoryName: string;
  sourceBriefId: string;
  sourcePromptId: string;
  /** The full prompt text — operator copies into their image tool. */
  prompt: string;
  /** Negative-prompt block — items to avoid (style language). */
  negativePrompt: string;
  aspectRatio: ImageAspectRatio;
  dimensions: { width: number; height: number };
  style: string;
  targetAudience: string;
  platform: ImagePlatform;
  /** Recommended seed / sampler hint — neutral, never asserting "best". */
  generationHints: {
    sampler: string;
    cfgGuidance: string;
    steps: string;
    seed: 'operator-choice';
  };
  copyOverlayGuidance: string;
  operatorApprovalRequired: true;
  notes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Image execution package is a specification only. ' +
  'No image generation occurs in this engine. ' +
  'Operator approval required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function platformFor(brief: ImageBrief): ImagePlatform {
  if (brief.audienceMarket === 'global') return 'instagram-feed';
  return 'instagram-feed';
}

function aspectFor(platform: ImagePlatform): ImageAspectRatio {
  switch (platform) {
    case 'instagram-feed':  return '4:5';
    case 'instagram-story': return '9:16';
    case 'facebook-feed':   return '1:1';
    case 'pinterest':       return '3:4';
    case 'website-hero':    return '16:9';
    case 'tiktok-static':   return '9:16';
  }
}

function dimensionsFor(ar: ImageAspectRatio): { width: number; height: number } {
  switch (ar) {
    case '1:1':  return { width: 1080, height: 1080 };
    case '4:5':  return { width: 1080, height: 1350 };
    case '9:16': return { width: 1080, height: 1920 };
    case '16:9': return { width: 1920, height: 1080 };
    case '3:4':  return { width: 1080, height: 1440 };
  }
}

function defaultStyle(brief: ImageBrief): string {
  // Documentary realism, restraint, brand-honest.
  return [
    brief.realism,
    'restrained color · soft falloff · single light source',
    'no commercial gloss · no plastic skin · no aspirational pose',
  ].join(' · ');
}

function targetAudienceFor(brief: ImageBrief): string {
  if (brief.audienceMarket === 'global') return 'Adults observed seeking restraint over hype · global';
  return 'Adults observed seeking restraint over hype · Israeli market · mobile-first';
}

function negativePromptFor(): string {
  return [
    'stock-photo gloss', 'plastic skin', 'over-saturated color',
    'aspirational pose', 'influencer styling',
    'cinematic-fake bokeh', 'unrealistic perfect lighting',
    'manufactured urgency overlay', 'sale banner aesthetic',
    'floating product', 'product as protagonist',
    'invented packaging', 'invented flavor',
    'luxury-performance aesthetic', 'TikTok-wellness aesthetic',
    'productivity-drug visual language',
  ].join(', ');
}

// ─── main ─────────────────────────────────────────────────────

export function composeImageExecutionPackage(input: ImageExecutionInput): ImageExecutionPackage {
  const { brief, prompt } = input;
  const platform = input.platform ?? platformFor(brief);
  const aspect = input.aspectRatio ?? aspectFor(platform);
  const dims = dimensionsFor(aspect);
  const style = input.style ?? defaultStyle(brief);

  const packageId = `exec-image-${brief.briefId.replace('brief-image-', '')}`;

  const copyOverlay = brief.audienceMarket === 'israel'
    ? 'Hebrew RTL · single line · 4-10 words · keep top-right and bottom-right safe areas clear'
    : 'single line · 4-10 words · keep top-right safe area clear';

  return {
    packageId,
    packageType: 'image',
    formula: brief.formula,
    sourceStoryName: brief.sourceStoryName,
    sourceBriefId: brief.briefId,
    sourcePromptId: prompt.promptId,
    prompt: prompt.promptText,
    negativePrompt: negativePromptFor(),
    aspectRatio: aspect,
    dimensions: dims,
    style,
    targetAudience: targetAudienceFor(brief),
    platform,
    generationHints: {
      sampler: 'operator choice (DDIM / DPM++ / Euler a — operator decides per tool)',
      cfgGuidance: 'CFG 3-5 for documentary realism (operator may adjust)',
      steps: '20-40 steps (operator may adjust per tool)',
      seed: 'operator-choice',
    },
    copyOverlayGuidance: copyOverlay,
    operatorApprovalRequired: true,
    notes: [
      'execution package — ready for operator-driven generation',
      'operator approval required before any generation',
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
