/**
 * POST /api/generate
 *
 * Body: { formula: Formula, campaignMode?: CampaignMode, forceStateId?: string,
 *         copyQualityRefusalEnabled?: boolean }
 *
 * Streams newline-delimited JSON payloads:
 *   { "type": "event", "event": PipelineEvent }
 *   { "type": "banner", "banner": Banner, "svg": string }
 *   { "type": "error", "error": string }
 *
 * Pre-pipeline: when the request OMITS copyQualityRefusalEnabled, a
 * lightweight policy preflight defaults the flag from
 * lib/copyQualityPolicy. Explicit request values (true or false)
 * always win. The preflight result is emitted as a `preflight-policy`
 * stream event AND attached to the shipped banner.
 */

import { NextRequest } from 'next/server';
import { runPipeline } from '@/core/pipeline';
import type { GenerateRequest } from '@/core/types';
import { composeBannerSvg } from '@/components/banner-svg';
import { rememberBanner } from '@/core/banner-cache';
import { runCopyQualityPolicyPreflight } from '@lib/copyQualityPolicyPreflight';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBody extends GenerateRequest {
  /** Optional override for the meta-critic brutality (0..1). */
  brutality?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateBody;

  // ─── Copy-Quality Policy Preflight ──────────────────────────
  // EXPLICIT request value (true or false) ALWAYS wins. Only when
  // the flag is undefined does the preflight compute a default from
  // the policy helper. Failure to read memory degrades to "off".
  const brutalityResolved = body.brutality ?? 0.65;
  const preflight = await runCopyQualityPolicyPreflight({
    explicitFlag: body.copyQualityRefusalEnabled,
    formula: body.formula,
    campaignMode: body.campaignMode ?? null,
    brutality: brutalityResolved,
  });
  if (preflight.applied) {
    // Default-fill — only when request omitted the flag.
    body.copyQualityRefusalEnabled = preflight.enabled;
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      try {
        // Emit the preflight result up-front as a pipeline event so it
        // shows in the studio trace. Uses the existing PipelineEvent
        // envelope — no new stream type.
        write({
          type: 'event',
          event: {
            ts: Date.now(),
            stage: 'preflight-policy',
            message:
              `source:${preflight.source} · enabled:${preflight.enabled} · ` +
              `band:${preflight.policyBand} · confidence ${preflight.confidence}/10` +
              (preflight.applied ? ' (route applied default)' : ' (explicit; preflight skipped)'),
            data: {
              source: preflight.source,
              enabled: preflight.enabled,
              policyBand: preflight.policyBand,
              reasonCodes: preflight.reasonCodes.slice(0, 8),
            },
          },
        });
        const result = await runPipeline(body, {
          brutality: body.brutality,
          onEvent: (event) => write({ type: 'event', event }),
          copyQualityPolicyPreflight: preflight,
        });
        rememberBanner(result.banner);
        const svg = composeBannerSvg(result.banner);
        write({ type: 'banner', banner: result.banner, svg });
      } catch (e) {
        write({ type: 'error', error: (e as Error).message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'application/x-ndjson; charset=utf-8',
      'cache-control': 'no-cache, no-transform',
    },
  });
}
