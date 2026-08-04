/**
 * CONTENT PRODUCER AGENT (pure orchestrator)
 *
 * Consumes an approved brief and composes banner · video · carousel
 * · landing packages using the existing production systems. The
 * agent NEVER generates real assets — it produces operator-reviewable
 * SPECIFICATIONS (the same packages the asset composer / brief
 * generator already produce). The operator then walks the existing
 * approval gate to register them with the asset registry.
 */

import type { Formula } from '@/core/types';
import { computeCreativeBriefs } from '../creativeBriefGenerator';
import { computeProductionPrompts } from '../promptArchitect';
import { composeImageExecutionPackage } from '../imageExecutionEngine';
import { composeVideoExecutionPackage } from '../videoExecutionEngine';
import { composeCarouselExecutionPackage } from '../carouselExecutionEngine';
import { composeLandingExecutionPackage } from '../landingExecutionEngine';
import type { AgentDescriptor } from './types';
import { AGENT_CATALOG, AGENT_ADVISORY_NOTICE } from './types';

// ─── input ────────────────────────────────────────────────────

export interface ContentProducerAgentInput {
  /** A coarse approved brief — the operator routes one of their
   *  briefs into the agent. */
  briefRef: {
    blueprintId: string;
    storyName: string;
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
  };
  formula: Formula;
  brandLanguage?: 'hebrew' | 'mixed' | 'english';
  audienceMarket?: 'israel' | 'global';
}

// ─── output ───────────────────────────────────────────────────

export interface ContentProducerAgentOutput {
  descriptor: AgentDescriptor;
  bannerPackage: unknown;
  videoPackage: unknown;
  carouselPackage: unknown;
  landingPackage: unknown;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── main ─────────────────────────────────────────────────────

export function runContentProducerAgent(
  input: ContentProducerAgentInput,
): ContentProducerAgentOutput {
  const brandLanguage = input.brandLanguage ?? 'hebrew';
  const audienceMarket = input.audienceMarket ?? 'israel';

  // Wrap the operator's brief ref into a synthetic story blueprint
  // shape that the brief generator + downstream engines accept.
  const stories = [{
    blueprintId: input.briefRef.blueprintId,
    storyName: input.briefRef.storyName,
    storyType: input.briefRef.storyType ?? 'observation',
    humanTension: input.briefRef.humanTension ?? 'observed quietness',
    emotionalArc: input.briefRef.emotionalArc ?? 'fatigue → tenderness → continuation',
    memoryAnchor: input.briefRef.memoryAnchor ?? 'familiar room',
    presenceAnchor: input.briefRef.presenceAnchor ?? 'unperformed presence',
    silencePlacement: 'majority silence',
    mythicFrame: input.briefRef.mythicFrame ?? 'home',
    realismStyle: input.briefRef.realismStyle ?? 'documentary handheld',
    dignityProtection: input.briefRef.dignityProtection ?? 8,
    manipulationRisk: input.briefRef.manipulationRisk ?? 2,
    alignment: input.briefRef.alignment ?? 7,
    riskLevel: (input.briefRef.riskLevel as 'low' | 'moderate' | 'high' | 'do-not-use') ?? 'low',
    audienceFeeling: input.briefRef.audienceFeeling ?? 'a quiet recognition observed alongside the outputs',
    whyThisMayMatter: input.briefRef.whyThisMayMatter ?? 'operator-reviewable specification — operator review required',
    reasonCodes: [],
  }];

  const briefs = computeCreativeBriefs({
    stories,
    scenes: [],
    packages: {},
    formula: input.formula,
    brandLanguage,
    audienceMarket,
  });

  const prompts = computeProductionPrompts({
    banners: briefs.banners, carousels: briefs.carousels, images: briefs.images,
    videos: briefs.videos, landings: briefs.landings,
    formula: input.formula, brandLanguage, audienceMarket,
  });

  const imagePromptForBrief = prompts.imagePrompts[0];
  const videoPromptForBrief = prompts.videoPrompts[0];
  const carouselPromptForBrief = prompts.carouselPrompts[0];
  const landingPromptForBrief = prompts.landingPrompts[0];

  const imagePackage = briefs.images[0] && imagePromptForBrief
    ? composeImageExecutionPackage({ brief: briefs.images[0], prompt: imagePromptForBrief })
    : null;
  const videoPackage = briefs.videos[0] && videoPromptForBrief
    ? composeVideoExecutionPackage({ brief: briefs.videos[0], prompt: videoPromptForBrief })
    : null;
  const carouselPackage = briefs.carousels[0] && carouselPromptForBrief
    ? composeCarouselExecutionPackage({ brief: briefs.carousels[0], prompt: carouselPromptForBrief })
    : null;
  const landingPackage = briefs.landings[0] && landingPromptForBrief
    ? composeLandingExecutionPackage({ brief: briefs.landings[0], prompt: landingPromptForBrief })
    : null;

  return {
    descriptor: AGENT_CATALOG['content-producer'],
    bannerPackage: briefs.banners[0] ?? null,
    videoPackage, carouselPackage, landingPackage,
    notes: [
      'content producer agent run · operator-reviewable specifications composed',
      'no asset generation occurs here · operator submits via the existing operator-supervised registries · operator review required',
    ],
    reasonCodes: [
      `briefId:${input.briefRef.blueprintId}`,
      `formula:${input.formula}`,
      `market:${audienceMarket}`,
      `image:${imagePackage ? 'composed' : 'absent'}`,
      `video:${videoPackage ? 'composed' : 'absent'}`,
      `carousel:${carouselPackage ? 'composed' : 'absent'}`,
      `landing:${landingPackage ? 'composed' : 'absent'}`,
    ],
    advisoryNotice: AGENT_ADVISORY_NOTICE,
  };
}
