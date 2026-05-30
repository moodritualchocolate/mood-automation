/**
 * PROVIDER ADAPTER TYPES (shared)
 *
 * Common shape for provider adapter outputs.
 *
 * An adapter is a PURE TRANSFORM:
 *   input  · approved ImageExecutionPackage / VideoExecutionPackage
 *   output · ProviderPayload (request body / endpoint hint /
 *            operator-runnable cURL equivalent)
 *
 * NO HTTP CALLS occur inside an adapter. The operator copies the
 * payload into their tool of choice. Human remains final authority.
 */

import type { Formula } from '@/core/types';

export type ImageProviderId =
  | 'openai-images' | 'flux' | 'midjourney' | 'ideogram' | 'gemini-images';

export type VideoProviderId =
  | 'veo' | 'runway' | 'kling' | 'hailuo' | 'pika';

export type ProviderId = ImageProviderId | VideoProviderId;

export interface ProviderEndpointHint {
  /** Coarse HTTP endpoint hint — operator validates against the
   *  provider's actual current API surface. */
  method: 'POST' | 'GET';
  /** A representative path. Always documented as "operator validates". */
  pathHint: string;
}

export interface ProviderPayload {
  providerId: ProviderId;
  providerName: string;
  packageType: 'image' | 'video';
  sourcePackageId: string;
  /** Provider-specific JSON body, ready for operator submission. */
  requestBody: Record<string, unknown>;
  /** Hint at the API endpoint shape — operator validates. */
  endpointHint: ProviderEndpointHint;
  /** Header guidance — uses environment-variable PLACEHOLDERS only.
   *  Never contains real secrets. */
  headersGuidance: Record<string, string>;
  /** An operator-runnable cURL one-liner using placeholders. */
  curlEquivalent: string;
  /** Coarse cost estimate (USD). */
  estimatedCostUSD: number;
  /** Notes from the adapter (translations, restrictions). */
  notes: string[];
  operatorApprovalRequired: true;
  advisoryNotice: string;
}

export interface ImagePackageHints {
  formula: Formula;
  sourceStoryName: string;
  prompt: string;
  negativePrompt: string;
  aspectRatio: string;
  dimensions: { width: number; height: number };
  style: string;
  targetAudience: string;
  platform: string;
  packageId: string;
}

export interface VideoPackageHints {
  formula: Formula;
  sourceStoryName: string;
  prompt: string;
  scenes: Array<{
    index: number; scene: string; beat: string;
    cameraDirection: string; durationSeconds: number; silenceShare: number;
  }>;
  totalDurationSeconds: number;
  aspectRatio: string;
  dimensions: { width: number; height: number };
  platform: string;
  camera: string;
  audio: string;
  caption: string;
  hashtags: string[];
  targetAudience: string;
  packageId: string;
}

export const ADVISORY_NOTICE_ADAPTER =
  'Provider payload is a specification only. ' +
  'No HTTP call is made by this adapter. ' +
  'Operator submits the payload manually. Human remains final authority.';
