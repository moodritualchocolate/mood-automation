/**
 * PIKA VIDEO ADAPTER (pure transform · Pika)
 *
 * Converts an approved VideoExecutionPackage into a Pika request
 * body shape. The adapter NEVER calls the API.
 */

import type { VideoExecutionPackage } from '../videoExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function pikaAspect(ar: string): string {
  if (['16:9', '9:16', '1:1', '5:2', '4:5'].includes(ar)) return ar;
  return '9:16';
}

export function buildPikaVideoPayload(pkg: VideoExecutionPackage): ProviderPayload {
  const composedPrompt = [
    pkg.prompt,
    '',
    'CAMERA: ' + pkg.camera,
    'AUDIO: ' + pkg.audio,
  ].join('\n');
  const requestBody = {
    promptText: composedPrompt,
    model: 'pika-2.1',
    aspectRatio: pikaAspect(pkg.aspectRatio),
    duration: Math.min(10, Math.max(5, Math.round(pkg.totalDurationSeconds / 2))),
    negativePrompt: 'hype cuts, fast zooms, dramatic music swell, jump cuts',
    seed: null,
  };
  return {
    providerId: 'pika',
    providerName: 'Pika',
    packageType: 'video',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'https://api.pika.art/generate' },
    headersGuidance: {
      'X-API-KEY': '${PIKA_API_KEY}',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST https://api.pika.art/generate \\',
      '  -H "X-API-KEY: $PIKA_API_KEY" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: 0.45,
    notes: [
      `duration mapped: requested ${pkg.totalDurationSeconds}s → Pika ${requestBody.duration}s`,
      `aspect ratio mapped: ${pkg.aspectRatio} → ${pikaAspect(pkg.aspectRatio)}`,
      'model pika-2.1 — operator may switch to pika-2.2 / 2.0 where available',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
