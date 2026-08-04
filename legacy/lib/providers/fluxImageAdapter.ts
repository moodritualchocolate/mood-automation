/**
 * FLUX IMAGES ADAPTER (pure transform · Black Forest Labs)
 *
 * Converts an approved ImageExecutionPackage into a Flux request
 * body shape. The adapter NEVER calls the API.
 */

import type { ImageExecutionPackage } from '../imageExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function buildAspectFlag(aspectRatio: string): string {
  // Flux accepts ratios like "1:1", "16:9", "9:16", "4:5".
  return aspectRatio;
}

export function buildFluxImagePayload(pkg: ImageExecutionPackage): ProviderPayload {
  const requestBody = {
    model: 'flux-pro-1.1',
    prompt: pkg.prompt,
    aspect_ratio: buildAspectFlag(pkg.aspectRatio),
    width: pkg.dimensions.width,
    height: pkg.dimensions.height,
    output_format: 'png',
    safety_tolerance: 2,
    prompt_upsampling: false,
    seed: null,
    style_preset: pkg.style,
    // Flux accepts a separate negative-prompt-like style guidance via
    // prompt suffix. We keep it explicit.
    negative_prompt_hint: pkg.negativePrompt,
  };
  return {
    providerId: 'flux',
    providerName: 'Flux (Black Forest Labs)',
    packageType: 'image',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'https://api.bfl.ai/v1/flux-pro-1.1' },
    headersGuidance: {
      'x-key': '${BFL_API_KEY}',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST https://api.bfl.ai/v1/flux-pro-1.1 \\',
      '  -H "x-key: $BFL_API_KEY" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: 0.05,
    notes: [
      'Flux preserves provided width/height when given',
      'safety_tolerance 2 = conservative — operator may adjust',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
