/**
 * MOOD CREATIVE OS — core type contracts.
 *
 * Every engine input/output is typed here so the pipeline can be
 * recomposed for future formulas (CALM, FOCUS, etc.) and future
 * outputs (carousels, video, landing pages) without rewriting wiring.
 *
 * Treat this file as a public API. Engine internals may change freely;
 * these shapes must not change without a corresponding pipeline migration.
 */

import { z } from 'zod';

// ───────────────────────────────────────────────────────────
// FORMULAS — V1 ships ENERGY only. Architecture supports more.
// ───────────────────────────────────────────────────────────

export const FORMULAS = ['ENERGY'] as const;
export type Formula = (typeof FORMULAS)[number];

export const CAMPAIGN_MODES = [
  'Editorial',
  'Documentary',
  'Performance',
  'Emotional',
  'Minimal',
  'Aggressive',
  'Luxury',
  'Product-focused',
] as const;
export type CampaignMode = (typeof CAMPAIGN_MODES)[number];

// ───────────────────────────────────────────────────────────
// HUMAN STATE
// ───────────────────────────────────────────────────────────

export const HumanStateSchema = z.object({
  id: z.string(),                       // stable slug, e.g. "third-coffee"
  label: z.string(),                    // human-readable, e.g. "third coffee"
  family: z.enum([
    'fatigue',
    'overstimulation',
    'avoidance',
    'numbness',
    'pressure',
    'fragmentation',
    'paralysis',
    'collapse',
  ]),
  timeAnchor: z.string().nullable(),    // "16:30" if time is emotionally critical, else null
  setting: z.array(z.string()),         // physical contexts the state lives in
  body: z.array(z.string()),            // body language signals
  weight: z.number().min(0).max(1),     // base selection weight (raised by wins, lowered by fatigue)
});
export type HumanState = z.infer<typeof HumanStateSchema>;

// ───────────────────────────────────────────────────────────
// HUMAN TRUTH
// ───────────────────────────────────────────────────────────

export const HumanTruthSchema = z.object({
  state: HumanStateSchema,
  truth: z.string(),                    // the sharp human insight
  tension: z.string(),                  // the contradiction at the core
  voice: z.enum(['observed', 'overheard', 'internal']),
  forbidden: z.array(z.string()),       // motivational / wellness phrases to never use
});
export type HumanTruth = z.infer<typeof HumanTruthSchema>;

// ───────────────────────────────────────────────────────────
// CREATIVE DIRECTION
// ───────────────────────────────────────────────────────────

export const CreativeDirectionSchema = z.object({
  hook: z.string(),                     // the one-line visual hook
  focalPoint: z.enum([
    'human-face',
    'hands',
    'object',
    'environment',
    'gesture',
    'product-in-hand',
    'empty-space',
  ]),
  emotionalPacing: z.enum(['quiet', 'tense', 'interrupted', 'collapsed', 'wired']),
  productRole: z.enum([
    'hidden',
    'environmental',
    'hand-held',
    'partial-crop',
    'foreground-blur',
    'table-object',
    'desk-proof',
    'background-object',
    'emotional-proof',
  ]),
  typographyDominance: z.enum(['absent', 'whisper', 'editorial', 'loud', 'timestamp']),
  ctaBehavior: z.enum(['quiet', 'integrated', 'editorial', 'corner']),
  layoutFamily: z.enum([
    'documentary-crop',
    'editorial-page',
    'off-center-portrait',
    'environmental-wide',
    'timestamp-anchor',
    'negative-space',
  ]),
  restraint: z.number().min(0).max(1),  // 1 = extreme restraint, 0 = aggressive
});
export type CreativeDirection = z.infer<typeof CreativeDirectionSchema>;

// ───────────────────────────────────────────────────────────
// COMPOSITION PLAN
// ───────────────────────────────────────────────────────────

export const Zone = z.object({
  x: z.number(),                        // 0..1
  y: z.number(),
  w: z.number(),
  h: z.number(),
});
export type Zone = z.infer<typeof Zone>;

export const CompositionPlanSchema = z.object({
  aspect: z.enum(['1:1', '4:5', '9:16', '16:9']),
  focal: Zone,
  productZone: Zone.nullable(),         // null when product is hidden/environmental in the photo itself
  typoZones: z.object({
    primary: Zone,
    secondary: Zone.nullable(),
    cta: Zone,
    timestamp: Zone.nullable(),
  }),
  safeZones: z.array(Zone),
  eyeFlow: z.array(z.tuple([z.number(), z.number()])),
  negativeSpaceBias: z.enum(['top', 'bottom', 'left', 'right', 'center', 'corners']),
});
export type CompositionPlan = z.infer<typeof CompositionPlanSchema>;

// ───────────────────────────────────────────────────────────
// IMAGE BRIEF + RESULT
// ───────────────────────────────────────────────────────────

export const ImageBriefSchema = z.object({
  scene: z.string(),                    // cinematic-only scene description
  lighting: z.string(),
  framing: z.string(),
  lens: z.string(),
  mood: z.string(),
  forbiddenInImage: z.array(z.string()),// text, logos, packaging, fake typography
  imperfections: z.array(z.string()),
  aspect: z.string(),
});
export type ImageBrief = z.infer<typeof ImageBriefSchema>;

export const ImageResultSchema = z.object({
  provider: z.string(),
  url: z.string().nullable(),           // remote URL (provider) — may be null when inline
  dataUrl: z.string().nullable(),       // inline data URL — used by stub + PNG export
  width: z.number(),
  height: z.number(),
  cost: z.number().nullable(),
});
export type ImageResult = z.infer<typeof ImageResultSchema>;

// ───────────────────────────────────────────────────────────
// TYPOGRAPHY + CTA
// ───────────────────────────────────────────────────────────

export const TypographyPlanSchema = z.object({
  primary: z.object({
    text: z.string(),
    lang: z.enum(['he', 'en']),
    size: z.number(),                   // px at 1080px reference
    weight: z.number(),
    tracking: z.number(),               // em
    leading: z.number(),                // multiplier
    color: z.string(),
    align: z.enum(['start', 'end', 'center']),
  }),
  secondary: z.object({
    text: z.string(),
    lang: z.enum(['he', 'en']),
    size: z.number(),
    weight: z.number(),
    color: z.string(),
  }).nullable(),
  timestamp: z.object({
    text: z.string(),
    size: z.number(),
  }).nullable(),
});
export type TypographyPlan = z.infer<typeof TypographyPlanSchema>;

export const CTASchema = z.object({
  text: z.string(),                     // Hebrew CTA
  lang: z.literal('he'),
  style: z.enum(['underline', 'enclosed', 'bare', 'pill']),
  position: Zone,
});
export type CTA = z.infer<typeof CTASchema>;

// ───────────────────────────────────────────────────────────
// CRITIQUE
// ───────────────────────────────────────────────────────────

export const CritiqueSchema = z.object({
  scores: z.object({
    feelsAI: z.number().min(0).max(10),         // higher = more AI-feeling — BAD
    compositionGeneric: z.number().min(0).max(10),
    productPasted: z.number().min(0).max(10),
    typographyForced: z.number().min(0).max(10),
    emotionalTruthClarity: z.number().min(0).max(10), // higher = clearer — GOOD
    focalPointObvious: z.number().min(0).max(10),
    eyeStops: z.number().min(0).max(10),
    tension: z.number().min(0).max(10),
    curiosity: z.number().min(0).max(10),
    feelsLikeRealCampaign: z.number().min(0).max(10),
  }),
  verdict: z.enum(['approve', 'reject-image', 'reject-concept']),
  notes: z.string(),
  rejectionReasons: z.array(z.string()),
});
export type Critique = z.infer<typeof CritiqueSchema>;

// ───────────────────────────────────────────────────────────
// PIPELINE I/O
// ───────────────────────────────────────────────────────────

export interface GenerateRequest {
  formula: Formula;
  campaignMode?: CampaignMode;
  /** Optional override — when omitted the system chooses autonomously. */
  forceStateId?: string;
  /** Max critic-driven regeneration attempts. */
  maxAttempts?: number;
}

export interface Banner {
  id: string;
  createdAt: number;
  formula: Formula;
  campaignMode: CampaignMode | null;
  state: HumanState;
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  imageBrief: ImageBrief;
  image: ImageResult;
  typography: TypographyPlan;
  cta: CTA;
  critique: Critique;
  attempts: number;
  rejectedAttempts: Array<{ stage: string; reason: string }>;
  memorySnapshot: MemorySnapshot;
}

export interface MemorySnapshot {
  totalBanners: number;
  recentStateIds: string[];
  recentLayouts: string[];
  recentHooks: string[];
  stateScores: Record<string, number>;
  layoutFatigue: Record<string, number>;
}

export interface PipelineEvent {
  ts: number;
  stage: string;
  message: string;
  data?: unknown;
}

// ───────────────────────────────────────────────────────────
// ENGINE CONTRACT
// ───────────────────────────────────────────────────────────

export interface EngineContext {
  formula: Formula;
  campaignMode: CampaignMode | null;
  bannerId: string;
  emit: (event: Omit<PipelineEvent, 'ts'>) => void;
}
