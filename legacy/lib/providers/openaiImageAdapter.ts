/**
 * OPENAI IMAGES ADAPTER (pure transform)
 *
 * Converts an approved ImageExecutionPackage into the OpenAI Images
 * request body shape. The adapter NEVER calls the API.
 *
 * Operator validates the endpoint + headers against the OpenAI
 * Images API surface before submitting.
 */

import type { ImageExecutionPackage } from '../imageExecutionEngine';
import type { ProviderPayload, ImagePackageHints } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

const OPENAI_SUPPORTED_SIZES = new Set(['1024x1024', '1024x1536', '1536x1024', '1792x1024', '1024x1792']);

function snapToOpenAISize(width: number, height: number): { width: number; height: number; note: string } {
  const ar = width / height;
  if (Math.abs(ar - 1) < 0.05) return { width: 1024, height: 1024, note: 'snapped 1:1 → 1024×1024' };
  if (ar > 1.4) return { width: 1792, height: 1024, note: 'snapped wide → 1792×1024 (closest 16:9-ish)' };
  if (ar < 0.7) return { width: 1024, height: 1792, note: 'snapped tall → 1024×1792 (closest 9:16-ish)' };
  if (ar > 1.0) return { width: 1536, height: 1024, note: 'snapped wide-ish → 1536×1024' };
  return { width: 1024, height: 1536, note: 'snapped tall-ish → 1024×1536' };
}

function buildHints(pkg: ImageExecutionPackage): ImagePackageHints {
  return {
    formula: pkg.formula, sourceStoryName: pkg.sourceStoryName,
    prompt: pkg.prompt, negativePrompt: pkg.negativePrompt,
    aspectRatio: pkg.aspectRatio,
    dimensions: pkg.dimensions, style: pkg.style,
    targetAudience: pkg.targetAudience, platform: pkg.platform,
    packageId: pkg.packageId,
  };
}

export function buildOpenAIImagePayload(pkg: ImageExecutionPackage): ProviderPayload {
  const hints = buildHints(pkg);
  const snap = snapToOpenAISize(hints.dimensions.width, hints.dimensions.height);
  const sizeStr = `${snap.width}x${snap.height}`;
  // OpenAI Images does not accept a separate negative prompt field —
  // we inline restraint phrasing into the prompt itself.
  const combinedPrompt = [
    hints.prompt,
    '',
    'STYLE NOTES:',
    hints.style,
    '',
    'AVOID:',
    hints.negativePrompt,
  ].join('\n');
  const requestBody = {
    model: 'gpt-image-1',
    prompt: combinedPrompt,
    size: OPENAI_SUPPORTED_SIZES.has(sizeStr) ? sizeStr : '1024x1024',
    quality: 'high',
    n: 1,
    response_format: 'b64_json',
    user: `mood-${hints.formula.toLowerCase()}-operator`,
  };
  const notes: string[] = [
    snap.note,
    'OpenAI Images: no separate negative-prompt field — restraint inlined into prompt',
    'operator validates current API surface before submission',
  ];
  return {
    providerId: 'openai-images',
    providerName: 'OpenAI Images (gpt-image-1)',
    packageType: 'image',
    sourcePackageId: hints.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'https://api.openai.com/v1/images/generations' },
    headersGuidance: {
      Authorization: 'Bearer ${OPENAI_API_KEY}',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST https://api.openai.com/v1/images/generations \\',
      '  -H "Authorization: Bearer $OPENAI_API_KEY" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: 0.19,
    notes,
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
