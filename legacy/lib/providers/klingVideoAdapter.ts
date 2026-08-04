/**
 * KLING VIDEO ADAPTER (pure transform · Kuaishou Kling)
 *
 * Converts an approved VideoExecutionPackage into a Kling request
 * body shape. The adapter NEVER calls the API.
 */

import type { VideoExecutionPackage } from '../videoExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function klingDuration(total: number): 5 | 10 {
  return total >= 8 ? 10 : 5;
}
function klingAspect(ar: string): string {
  if (['16:9', '9:16', '1:1'].includes(ar)) return ar;
  if (ar === '4:5') return '9:16';
  return '9:16';
}

export function buildKlingVideoPayload(pkg: VideoExecutionPackage): ProviderPayload {
  const duration = klingDuration(pkg.totalDurationSeconds);
  const composedPrompt = [
    pkg.prompt,
    '',
    'CAMERA: ' + pkg.camera,
    'AUDIO: ' + pkg.audio,
  ].join('\n');
  const requestBody = {
    model: 'kling-v1-5',
    prompt: composedPrompt,
    negative_prompt: 'hype cuts, fast zooms, dramatic music swell, manufactured urgency, jump cuts, whip pans',
    aspect_ratio: klingAspect(pkg.aspectRatio),
    duration: String(duration),
    mode: 'std',  // 'std' or 'pro' — operator may upgrade
    cfg_scale: 0.5,
    seed: null,
  };
  return {
    providerId: 'kling',
    providerName: 'Kling (Kuaishou)',
    packageType: 'video',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'https://api.klingai.com/v1/videos/text2video' },
    headersGuidance: {
      Authorization: 'Bearer ${KLING_JWT_TOKEN}',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST https://api.klingai.com/v1/videos/text2video \\',
      '  -H "Authorization: Bearer $KLING_JWT_TOKEN" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: duration === 10 ? 0.8 : 0.4,
    notes: [
      `duration mapped: requested ${pkg.totalDurationSeconds}s → Kling ${duration}s`,
      `aspect ratio mapped: ${pkg.aspectRatio} → ${klingAspect(pkg.aspectRatio)}`,
      'mode std — operator may upgrade to pro',
      'cfg_scale 0.5 — restrained · operator may adjust',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
