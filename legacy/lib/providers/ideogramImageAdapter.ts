/**
 * IDEOGRAM IMAGES ADAPTER (pure transform)
 *
 * Converts an approved ImageExecutionPackage into an Ideogram
 * request body shape. The adapter NEVER calls the API.
 *
 * Ideogram is particularly relevant for the Israeli market because
 * it handles Hebrew text rendering well — the adapter surfaces this
 * via the magic_prompt_option and the language hint.
 */

import type { ImageExecutionPackage } from '../imageExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

const IDEOGRAM_AR_MAP: Record<string, string> = {
  '1:1':  'ASPECT_1_1',
  '4:5':  'ASPECT_4_5',
  '9:16': 'ASPECT_9_16',
  '16:9': 'ASPECT_16_9',
  '3:4':  'ASPECT_3_4',
};

function inferLanguage(targetAudience: string): 'he' | 'en' {
  return /israel|hebrew/i.test(targetAudience) ? 'he' : 'en';
}

export function buildIdeogramImagePayload(pkg: ImageExecutionPackage): ProviderPayload {
  const language = inferLanguage(pkg.targetAudience);
  const aspectRatio = IDEOGRAM_AR_MAP[pkg.aspectRatio] ?? 'ASPECT_4_5';
  const requestBody = {
    image_request: {
      prompt: pkg.prompt,
      aspect_ratio: aspectRatio,
      model: 'V_2',
      magic_prompt_option: 'OFF',
      negative_prompt: pkg.negativePrompt,
      style_type: 'REALISTIC',
      seed: null,
    },
    /** Language hint for Hebrew rendering on Israeli-market outputs. */
    language,
  };
  return {
    providerId: 'ideogram',
    providerName: 'Ideogram',
    packageType: 'image',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'https://api.ideogram.ai/generate' },
    headersGuidance: {
      'Api-Key': '${IDEOGRAM_API_KEY}',
      'Content-Type': 'application/json',
    },
    curlEquivalent: [
      'curl -X POST https://api.ideogram.ai/generate \\',
      '  -H "Api-Key: $IDEOGRAM_API_KEY" \\',
      '  -H "Content-Type: application/json" \\',
      `  -d '${JSON.stringify(requestBody).replace(/'/g, "'\\''")}'`,
    ].join('\n'),
    estimatedCostUSD: 0.08,
    notes: [
      'STYLE_TYPE REALISTIC chosen to preserve documentary realism',
      'MAGIC_PROMPT_OPTION OFF to honor brand-guardian-validated prompt',
      language === 'he'
        ? 'language hint = he · Ideogram renders Hebrew text well for Israeli market'
        : 'language hint = en',
      'operator validates current API surface before submission',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
