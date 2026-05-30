/**
 * PROVIDER REGISTRY (pure, observational)
 *
 * Phase 3 — Generation Connector Layer.
 *
 * Capability registry for all image + video providers. Pure data —
 * no network calls. The registry surfaces:
 *   - capabilities (text-to-image, image-to-image, text-to-video,
 *     etc.)
 *   - limits (max duration, max resolution)
 *   - supported aspect ratios
 *   - supported languages (for in-image text generation)
 *   - cost estimation (USD per unit)
 *   - availability (publicly-documented · operator validates)
 *
 * STRICT CONTRACT:
 *   - this is a registry of FACTS the operator validates
 *   - the registry never calls a provider
 *   - the registry never executes a generation
 *   - operator approval required before any submission
 */

import type { ImageProviderId, VideoProviderId, ProviderId } from './providers/types';
import {
  buildOpenAIImagePayload, buildFluxImagePayload, buildMidjourneyImagePayload,
  buildIdeogramImagePayload, buildGeminiImagePayload,
} from './providers';
import {
  buildVeoVideoPayload, buildRunwayVideoPayload, buildKlingVideoPayload,
  buildHailuoVideoPayload, buildPikaVideoPayload,
} from './providers';
import type { ImageExecutionPackage } from './imageExecutionEngine';
import type { VideoExecutionPackage } from './videoExecutionEngine';
import type { ProviderPayload } from './providers/types';

// ─── capability descriptor ───────────────────────────────────

export type Capability = 'text-to-image' | 'image-to-image' | 'text-to-video' | 'image-to-video';

export interface ProviderCapability {
  providerId: ProviderId;
  providerName: string;
  packageType: 'image' | 'video';
  capabilities: Capability[];
  supportedAspectRatios: string[];
  /** Languages well-supported for in-image text rendering. */
  supportedLanguages: ('en' | 'he' | 'multi')[];
  /** Coarse cost in USD per unit (image or short clip). */
  costEstimateUSDPerUnit: number;
  /** Output limits — operator validates against current docs. */
  limits: {
    maxDurationSeconds?: number;
    maxResolution?: string;
    maxImagesPerRequest?: number;
  };
  /** "documented" = provider has a public API · "discord-mediated" =
   *  operator submits via Discord (Midjourney). */
  availability: 'documented' | 'discord-mediated' | 'preview' | 'partner-only';
  /** Notes / caveats. */
  notes: string[];
}

// ─── catalog ─────────────────────────────────────────────────

export const PROVIDER_REGISTRY: Record<ProviderId, ProviderCapability> = {
  'openai-images': {
    providerId: 'openai-images',
    providerName: 'OpenAI Images (gpt-image-1)',
    packageType: 'image',
    capabilities: ['text-to-image', 'image-to-image'],
    supportedAspectRatios: ['1:1', '4:5', '16:9', '9:16', '3:4', '4:3'],
    supportedLanguages: ['en', 'multi'],
    costEstimateUSDPerUnit: 0.19,
    limits: { maxResolution: '1792x1024', maxImagesPerRequest: 10 },
    availability: 'documented',
    notes: [
      'no separate negative-prompt field — adapter inlines restraint phrasing',
      'operator validates pricing and size catalog against current OpenAI docs',
    ],
  },
  'flux': {
    providerId: 'flux',
    providerName: 'Flux (Black Forest Labs)',
    packageType: 'image',
    capabilities: ['text-to-image', 'image-to-image'],
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:5', '3:4', '4:3'],
    supportedLanguages: ['en'],
    costEstimateUSDPerUnit: 0.05,
    limits: { maxResolution: '2048x2048', maxImagesPerRequest: 1 },
    availability: 'documented',
    notes: [
      'flux-pro-1.1 default · operator may switch to flux-dev / flux-schnell',
      'safety_tolerance default 2 — operator may adjust',
    ],
  },
  'midjourney': {
    providerId: 'midjourney',
    providerName: 'Midjourney (Discord-mediated)',
    packageType: 'image',
    capabilities: ['text-to-image'],
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:5', '3:4', '4:3', '2:3', '3:2'],
    supportedLanguages: ['en', 'multi'],
    costEstimateUSDPerUnit: 0.04,
    limits: { maxImagesPerRequest: 4 },
    availability: 'discord-mediated',
    notes: [
      'no public REST API — operator pastes prompt in Discord',
      '--style raw + --no list translated from negative prompt',
    ],
  },
  'ideogram': {
    providerId: 'ideogram',
    providerName: 'Ideogram',
    packageType: 'image',
    capabilities: ['text-to-image', 'image-to-image'],
    supportedAspectRatios: ['1:1', '16:9', '9:16', '4:5', '3:4', '4:3'],
    supportedLanguages: ['en', 'he', 'multi'],
    costEstimateUSDPerUnit: 0.08,
    limits: { maxImagesPerRequest: 4 },
    availability: 'documented',
    notes: [
      'renders Hebrew text well — relevant for Israeli market',
      'MAGIC_PROMPT_OPTION OFF to honor brand-guardian-validated prompt',
    ],
  },
  'gemini-images': {
    providerId: 'gemini-images',
    providerName: 'Google Imagen (Vertex AI)',
    packageType: 'image',
    capabilities: ['text-to-image'],
    supportedAspectRatios: ['1:1', '9:16', '16:9', '3:4', '4:3'],
    supportedLanguages: ['en', 'multi'],
    costEstimateUSDPerUnit: 0.04,
    limits: { maxImagesPerRequest: 4 },
    availability: 'documented',
    notes: [
      'gcloud auth required',
      '4:5 not supported — adapter snaps to 3:4',
    ],
  },
  'veo': {
    providerId: 'veo',
    providerName: 'Google Veo (Vertex AI)',
    packageType: 'video',
    capabilities: ['text-to-video', 'image-to-video'],
    supportedAspectRatios: ['16:9', '9:16'],
    supportedLanguages: ['en', 'multi'],
    costEstimateUSDPerUnit: 6.0,
    limits: { maxDurationSeconds: 8, maxResolution: '1080p' },
    availability: 'preview',
    notes: [
      'currently caps at ~8s per generation',
      'operator chains for longer pieces',
      'gcloud auth required',
    ],
  },
  'runway': {
    providerId: 'runway',
    providerName: 'Runway (Gen-4)',
    packageType: 'video',
    capabilities: ['text-to-video', 'image-to-video'],
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedLanguages: ['en'],
    costEstimateUSDPerUnit: 1.0,
    limits: { maxDurationSeconds: 10, maxResolution: '1080p' },
    availability: 'documented',
    notes: [
      'duration 5s / 10s tiers',
      'X-Runway-Version header required',
    ],
  },
  'kling': {
    providerId: 'kling',
    providerName: 'Kling (Kuaishou)',
    packageType: 'video',
    capabilities: ['text-to-video', 'image-to-video'],
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedLanguages: ['en', 'multi'],
    costEstimateUSDPerUnit: 0.8,
    limits: { maxDurationSeconds: 10, maxResolution: '1080p' },
    availability: 'documented',
    notes: [
      'JWT token required for auth',
      'std vs pro modes — adapter defaults to std',
    ],
  },
  'hailuo': {
    providerId: 'hailuo',
    providerName: 'MiniMax Hailuo',
    packageType: 'video',
    capabilities: ['text-to-video', 'image-to-video'],
    supportedAspectRatios: ['16:9', '9:16', '1:1'],
    supportedLanguages: ['en', 'multi'],
    costEstimateUSDPerUnit: 0.5,
    limits: { maxDurationSeconds: 6, maxResolution: '720p' },
    availability: 'documented',
    notes: [
      'currently caps at ~6s per generation',
      'operator chains for longer pieces',
    ],
  },
  'pika': {
    providerId: 'pika',
    providerName: 'Pika',
    packageType: 'video',
    capabilities: ['text-to-video', 'image-to-video'],
    supportedAspectRatios: ['16:9', '9:16', '1:1', '5:2', '4:5'],
    supportedLanguages: ['en'],
    costEstimateUSDPerUnit: 0.45,
    limits: { maxDurationSeconds: 10, maxResolution: '1080p' },
    availability: 'documented',
    notes: [
      'pika-2.1 default · operator may switch to pika-2.2 / 2.0',
    ],
  },
};

export const IMAGE_PROVIDER_IDS: ImageProviderId[] = ['openai-images', 'flux', 'midjourney', 'ideogram', 'gemini-images'];
export const VIDEO_PROVIDER_IDS: VideoProviderId[] = ['veo', 'runway', 'kling', 'hailuo', 'pika'];

// ─── dispatch helpers ────────────────────────────────────────

export function buildImagePayloadFor(
  providerId: ImageProviderId, pkg: ImageExecutionPackage,
): ProviderPayload {
  switch (providerId) {
    case 'openai-images':  return buildOpenAIImagePayload(pkg);
    case 'flux':           return buildFluxImagePayload(pkg);
    case 'midjourney':     return buildMidjourneyImagePayload(pkg);
    case 'ideogram':       return buildIdeogramImagePayload(pkg);
    case 'gemini-images':  return buildGeminiImagePayload(pkg);
  }
}

export function buildVideoPayloadFor(
  providerId: VideoProviderId, pkg: VideoExecutionPackage,
): ProviderPayload {
  switch (providerId) {
    case 'veo':     return buildVeoVideoPayload(pkg);
    case 'runway':  return buildRunwayVideoPayload(pkg);
    case 'kling':   return buildKlingVideoPayload(pkg);
    case 'hailuo':  return buildHailuoVideoPayload(pkg);
    case 'pika':    return buildPikaVideoPayload(pkg);
  }
}

// ─── capability filters ──────────────────────────────────────

export interface RegistryReading {
  providers: ProviderCapability[];
  totalImageProviders: number;
  totalVideoProviders: number;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Provider registry · facts the operator validates against current ' +
  'provider documentation. The registry never calls a provider, ' +
  'never executes a generation. Human remains final authority.';

export function getProviderRegistry(): RegistryReading {
  const providers = Object.values(PROVIDER_REGISTRY);
  return {
    providers,
    totalImageProviders: providers.filter((p) => p.packageType === 'image').length,
    totalVideoProviders: providers.filter((p) => p.packageType === 'video').length,
    reasonCodes: providers.map((p) => `${p.providerId}:${p.availability}`),
    advisoryNotice: ADVISORY_NOTICE,
  };
}
