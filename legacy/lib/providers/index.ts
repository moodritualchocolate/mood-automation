/**
 * Provider adapter barrel.
 *
 * All adapters are PURE TRANSFORMS — they convert approved execution
 * packages into provider-specific payloads. They never call a
 * provider. Human remains final authority.
 */

export type {
  ImageProviderId, VideoProviderId, ProviderId,
  ProviderEndpointHint, ProviderPayload,
  ImagePackageHints, VideoPackageHints,
} from './types';
export { ADVISORY_NOTICE_ADAPTER } from './types';

export { buildOpenAIImagePayload } from './openaiImageAdapter';
export { buildFluxImagePayload } from './fluxImageAdapter';
export { buildMidjourneyImagePayload } from './midjourneyImageAdapter';
export { buildIdeogramImagePayload } from './ideogramImageAdapter';
export { buildGeminiImagePayload } from './geminiImageAdapter';

export { buildVeoVideoPayload } from './veoVideoAdapter';
export { buildRunwayVideoPayload } from './runwayVideoAdapter';
export { buildKlingVideoPayload } from './klingVideoAdapter';
export { buildHailuoVideoPayload } from './hailuoVideoAdapter';
export { buildPikaVideoPayload } from './pikaVideoAdapter';
