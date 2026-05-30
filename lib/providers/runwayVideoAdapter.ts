/**
 * RUNWAY VIDEO ADAPTER (pure transform · Runway Gen-3 / Gen-4)
 *
 * Converts an approved VideoExecutionPackage into a Runway request
 * body shape. The adapter NEVER calls the API.
 */

import type { VideoExecutionPackage } from '../videoExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function runwayDuration(total: number): 5 | 10 {
  return total >= 8 ? 10 : 5;
}
function runwayAspect(ar: string): string {
  if (['16:9', '9:16', '1:1'].includes(ar)) return ar;
  if (ar === '4:5') return '9:16';
  return '9:16';
}

export function buildRunwayVideoPayload(pkg: VideoExecutionPackage): ProviderPayload {
  const duration = runwayDuration(pkg.totalDurationSeconds);
  const composedPrompt = [
    pkg.prompt,
    '',
    'CAMERA: ' + pkg.camera,
    'TONE: restrained, documentary, ambient',
  ].join('\n');
  const requestBody = {
    model: 'gen4_turbo',
    promptText: composedPrompt,
    ratio: runwayAspect(pkg.aspectRatio),
    duration,
    seed: null,
  };
  return {
    providerId: 'runway',
    providerName: 'Runway (Gen-4)',
    packageType: 'video',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'https://api.dev.runwayml.com/v1/text_to_video' },
    headersGuidance: {
      Authorization: 'Bearer ${RUNWAY_API_KEY}',
      'X-Runway-Version': '2024-11-06',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST https://api.dev.runwayml.com/v1/text_to_video \\',
      '  -H "Authorization: Bearer $RUNWAY_API_KEY" \\',
      '  -H "X-Runway-Version: 2024-11-06" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: duration === 10 ? 1.0 : 0.5,
    notes: [
      `duration mapped: requested ${pkg.totalDurationSeconds}s → Runway ${duration}s tier`,
      `aspect ratio mapped: ${pkg.aspectRatio} → ${runwayAspect(pkg.aspectRatio)}`,
      'model gen4_turbo — operator may switch to gen4 or earlier gen3a_turbo',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
