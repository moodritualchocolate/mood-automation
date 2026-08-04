/**
 * MIDJOURNEY IMAGES ADAPTER (pure transform)
 *
 * Midjourney does not currently expose a public API directly —
 * operator typically submits the prompt via Discord bot or via
 * an authorised proxy. This adapter produces the proper
 * MIDJOURNEY-FLAVOR prompt string (with --ar, --style, --no
 * parameter flags). The adapter NEVER calls Discord or any proxy.
 */

import type { ImageExecutionPackage } from '../imageExecutionEngine';
import type { ProviderPayload } from './types';
import { ADVISORY_NOTICE_ADAPTER } from './types';

function buildMidjourneyPromptString(pkg: ImageExecutionPackage): string {
  // Convert negativePrompt (comma list) into --no tokens.
  const noTokens = pkg.negativePrompt
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .slice(0, 12) // MJ has practical limits
    .join(', ');
  return [
    pkg.prompt,
    `--ar ${pkg.aspectRatio}`,
    `--style raw`,
    `--no ${noTokens}`,
    '--v 6.1',
  ].join(' ');
}

export function buildMidjourneyImagePayload(pkg: ImageExecutionPackage): ProviderPayload {
  const promptString = buildMidjourneyPromptString(pkg);
  const requestBody = {
    /** Channel for the imagine command — operator-provided. */
    channelId: '${MJ_CHANNEL_ID}',
    /** Imagine prompt string with --ar, --style, --no flags. */
    promptString,
    /** Coarse output dimensions — Midjourney resolves internally. */
    aspectRatio: pkg.aspectRatio,
  };
  return {
    providerId: 'midjourney',
    providerName: 'Midjourney (Discord-mediated)',
    packageType: 'image',
    sourcePackageId: pkg.packageId,
    requestBody,
    endpointHint: { method: 'POST', pathHint: 'discord://imagine (operator submits manually in Discord)' },
    headersGuidance: {
      Note: 'Midjourney has no public REST API — operator submits via Discord',
    },
    curlEquivalent: [
      '# Midjourney has no public REST API; operator submits the',
      '# prompt below in the Midjourney Discord channel:',
      '#',
      `/imagine ${promptString}`,
    ].join('\n'),
    estimatedCostUSD: 0.04,
    notes: [
      '--ar uses provided aspect ratio',
      '--style raw chosen to avoid Midjourney over-stylization',
      '--no captures the top-12 negative-prompt tokens',
      '--v 6.1 is a conservative default — operator may adjust',
      'no programmatic submission — operator pastes the prompt in Discord',
    ],
    operatorApprovalRequired: true,
    advisoryNotice: ADVISORY_NOTICE_ADAPTER,
  };
}
