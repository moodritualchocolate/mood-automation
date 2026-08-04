/**
 * VEO VIDEO ADAPTER (pure transform · Google Veo)
 *
 * Converts an approved VideoExecutionPackage into a Google Veo /
 * Vertex AI request body shape. The adapter NEVER calls the API.
 */

import type { VideoExecutionPackage } from '../videoExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function veoAspectRatio(ar: string): string {
  if (['16:9', '9:16'].includes(ar)) return ar;
  if (ar === '1:1') return '9:16';
  if (ar === '4:5') return '9:16';
  return '9:16';
}

function veoDurationSeconds(total: number): number {
  // Veo currently caps at 8s in most tiers — operator validates.
  return Math.min(8, Math.max(4, Math.round(total / 4)));
}

export function buildVeoVideoPayload(pkg: VideoExecutionPackage): ProviderPayload {
  const veoSeconds = veoDurationSeconds(pkg.totalDurationSeconds);
  // Compose a single rich text prompt for Veo (it currently takes a
  // single prompt + optional negative prompt + optional ref image).
  const composedPrompt = [
    pkg.prompt,
    '',
    'CAMERA: ' + pkg.camera,
    'AUDIO: ' + pkg.audio,
    'SCENES:',
    ...pkg.scenes.map((s) => `  · beat ${s.index} (${s.durationSeconds}s, silence ${s.silenceShare}): ${s.scene} — ${s.beat} — ${s.cameraDirection}`),
  ].join('\n');
  const requestBody = {
    instances: [{
      prompt: composedPrompt,
      // Veo accepts a coarse negative-prompt-like field via the prompt
      // suffix; we surface restraint signals explicitly.
      negativePrompt: 'hype cuts, fast zooms, dramatic music swell, manufactured urgency, aspirational voice-over, jump cuts, whip-pans',
    }],
    parameters: {
      sampleCount: 1,
      aspectRatio: veoAspectRatio(pkg.aspectRatio),
      durationSeconds: veoSeconds,
      enhancePrompt: false,
      personGeneration: 'allow_adult',
      addWatermark: false,
    },
  };
  return {
    providerId: 'veo',
    providerName: 'Google Veo (Vertex AI)',
    packageType: 'video',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: {
      method: 'POST',
      pathHint: 'https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/veo-3.0-generate-preview:predictLongRunning',
    },
    headersGuidance: {
      Authorization: 'Bearer $(gcloud auth print-access-token)',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST "https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/veo-3.0-generate-preview:predictLongRunning" \\',
      '  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: 0.75 * veoSeconds,
    notes: [
      `duration mapped: requested ${pkg.totalDurationSeconds}s → Veo ${veoSeconds}s (operator may chain multiple generations for longer pieces)`,
      `aspect ratio mapped: ${pkg.aspectRatio} → ${veoAspectRatio(pkg.aspectRatio)}`,
      'enhancePrompt false — operator-validated prompt is final',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
