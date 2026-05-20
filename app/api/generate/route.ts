/**
 * POST /api/generate
 *
 * Body: { formula: Formula, campaignMode?: CampaignMode, forceStateId?: string }
 *
 * Streams newline-delimited JSON payloads:
 *   { "type": "event", "event": PipelineEvent }
 *   { "type": "banner", "banner": Banner, "svg": string }
 *   { "type": "error", "error": string }
 */

import { NextRequest } from 'next/server';
import { runPipeline } from '@/core/pipeline';
import type { GenerateRequest } from '@/core/types';
import { composeBannerSvg } from '@/components/banner-svg';
import { rememberBanner } from '@/core/banner-cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBody extends GenerateRequest {
  /** Optional override for the meta-critic brutality (0..1). */
  brutality?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateBody;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + '\n'));
      try {
        const result = await runPipeline(body, {
          brutality: body.brutality,
          onEvent: (event) => write({ type: 'event', event }),
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
