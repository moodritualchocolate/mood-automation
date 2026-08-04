/**
 * HAILUO VIDEO ADAPTER (pure transform · MiniMax Hailuo)
 *
 * Converts an approved VideoExecutionPackage into a MiniMax Hailuo
 * request body shape. The adapter NEVER calls the API.
 */

import type { VideoExecutionPackage } from '../videoExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function hailuoAspect(ar: string): string {
  if (['16:9', '9:16', '1:1'].includes(ar)) return ar;
  if (ar === '4:5') return '9:16';
  return '9:16';
}

export function buildHailuoVideoPayload(pkg: VideoExecutionPackage): ProviderPayload {
  // Hailuo currently produces ~6s clips per request — operator chains for longer pieces.
  const composedPrompt = [
    pkg.prompt,
    '',
    'CAMERA: ' + pkg.camera,
    'AUDIO: ' + pkg.audio,
  ].join('\n');
  const requestBody = {
    model: 'MiniMax-Hailuo-02',
    prompt: composedPrompt,
    prompt_optimizer: false,
    aspect_ratio: hailuoAspect(pkg.aspectRatio),
    duration: 6,
    resolution: '720P',
  };
  return {
    providerId: 'hailuo',
    providerName: 'MiniMax Hailuo',
    packageType: 'video',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'https://api.minimaxi.com/v1/video_generation' },
    headersGuidance: {
      Authorization: 'Bearer ${MINIMAX_API_KEY}',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST https://api.minimaxi.com/v1/video_generation \\',
      '  -H "Authorization: Bearer $MINIMAX_API_KEY" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: 0.5,
    notes: [
      'Hailuo currently caps clips at ~6s — operator may chain for longer pieces',
      `aspect ratio mapped: ${pkg.aspectRatio} → ${hailuoAspect(pkg.aspectRatio)}`,
      'prompt_optimizer false — operator-validated prompt is final',
      'resolution 720P default — operator may upgrade to 1080P where available',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
