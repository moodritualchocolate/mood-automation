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
import { recordPolicyAudit } from '@lib/copyQualityPolicyAudit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface GenerateBody extends GenerateRequest {
  /** Optional override for the meta-critic brutality (0..1). */
  brutality?: number;
}

export async function POST(req: NextRequest) {
  const body = (await req.json()) as GenerateBody;

  // Capture the ORIGINAL request flag before the preflight may
  // overwrite it. The audit trail records this verbatim so the
  // governance memory shows what the caller actually asked for.
  const requestedFlag = body.copyQualityRefusalEnabled;

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

        // ─── Policy Audit Trail ─────────────────────────────────
        // Governance memory: one entry per generation attempt. The
        // pipeline computes a fuller policy recommendation with real
        // signal — prefer that over the preflight's pre-pipeline
        // synthesis when present. Write failure is swallowed inside
        // recordPolicyAudit; nothing downstream blocks on the audit.
        const banner = result.banner;
        const livePolicy = banner.copyQualityPolicy ?? null;
        const liveQuality = banner.copyQuality ?? null;
        await recordPolicyAudit({
          at: banner.createdAt,
          formula: banner.formula,
          campaignMode: banner.campaignMode,
          brutality: banner.finalVerdict.brutality,
          attempt: banner.attempts,
          requestedFlag,
          preflightRecommendedEnabled: preflight.enabled,
          preflightSource: preflight.source,
          finalAppliedEnabled: body.copyQualityRefusalEnabled === true,
          policyBand: livePolicy?.policyBand ?? preflight.policyBand,
          confidence: livePolicy?.confidence ?? preflight.confidence,
          suggestedIntegrityThreshold: livePolicy?.suggestedIntegrityThreshold ?? 0,
          suggestedBrutalityThreshold: livePolicy?.suggestedBrutalityThreshold ?? 0,
          reasonCodes: [
            ...preflight.reasonCodes,
            ...(livePolicy?.reasonCodes ?? []),
          ],
          policyRecommendsEnabled: livePolicy?.recommendedEnabled ?? preflight.enabled,
          outcomeVerdict: banner.finalVerdict.verdict,
          outcomeReasons: banner.finalVerdict.reasons,
          copyIntegrity:     liveQuality?.copyIntegrity     ?? null,
          trustSafety:       liveQuality?.trustSafety       ?? null,
          dignitySafety:     liveQuality?.dignitySafety     ?? null,
          repetitionConcern: liveQuality?.repetitionConcern ?? null,
        });
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
