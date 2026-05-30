/**
 * GEMINI IMAGES ADAPTER (pure transform · Google Imagen)
 *
 * Converts an approved ImageExecutionPackage into a Google
 * Imagen / Vertex AI Imagen request body shape. The adapter
 * NEVER calls the API.
 */

import type { ImageExecutionPackage } from '../imageExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function imagenAspectRatio(ar: string): string {
  // Imagen accepts "1:1", "9:16", "16:9", "3:4", "4:3".
  if (['1:1', '9:16', '16:9', '3:4', '4:3'].includes(ar)) return ar;
  if (ar === '4:5') return '3:4';
  return '1:1';
}

export function buildGeminiImagePayload(pkg: ImageExecutionPackage): ProviderPayload {
  const language = /israel|hebrew/i.test(pkg.targetAudience) ? 'he' : 'en';
  const requestBody = {
    instances: [{
      prompt: pkg.prompt,
      negativePrompt: pkg.negativePrompt,
    }],
    parameters: {
      sampleCount: 1,
      aspectRatio: imagenAspectRatio(pkg.aspectRatio),
      addWatermark: false,
      safetyFilterLevel: 'block_some',
      personGeneration: 'allow_adult',
      includeRaiReason: true,
      language,
    },
  };
  return {
    providerId: 'gemini-images',
    providerName: 'Google Imagen (Vertex AI)',
    packageType: 'image',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: {
      method: 'POST',
      pathHint: 'https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/imagen-3.0-generate-002:predict',
    },
    headersGuidance: {
      Authorization: 'Bearer $(gcloud auth print-access-token)',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST "https://${REGION}-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/${REGION}/publishers/google/models/imagen-3.0-generate-002:predict" \\',
      '  -H "Authorization: Bearer $(gcloud auth print-access-token)" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: 0.04,
    notes: [
      `aspect ratio mapped: ${pkg.aspectRatio} → ${imagenAspectRatio(pkg.aspectRatio)}`,
      'addWatermark false — operator validates Google policy',
      'safetyFilterLevel block_some · personGeneration allow_adult — operator may adjust',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
