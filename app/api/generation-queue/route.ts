/**
 * /api/generation-queue
 *
 * Generation request queue · operator-supervised.
 *
 * GET   — returns the queue (read-only).
 * POST  — operator-supervised. Every write requires operatorId +
 *         operatorReason. Actions: draft | approve | submit |
 *         complete | fail | archive.
 *
 * STRICT CONTRACT:
 *   - the route never calls a provider
 *   - the route never publishes
 *   - the route never auto-approves
 *   - draft action requires sourceAssetId pointing at an APPROVED
 *     asset-registry record (operator chose the provider explicitly)
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createGenerationRequestQueueStore, newGenerationRequestId,
  type GenerationRequestStatus, type GenerationRequestRecord,
} from '@lib/generationRequestQueue';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import {
  PROVIDER_REGISTRY, buildImagePayloadFor, buildVideoPayloadFor,
} from '@lib/providerRegistry';
import { composeImageExecutionPackage } from '@lib/imageExecutionEngine';
import { composeVideoExecutionPackage } from '@lib/videoExecutionEngine';
import type { ImageProviderId, VideoProviderId, ProviderId } from '@lib/providers/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_TRANSITIONS: ReadonlySet<GenerationRequestStatus> = new Set([
  'approved', 'submitted', 'completed', 'failed', 'archived',
]);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const statusFilter = url.searchParams.get('status') as GenerationRequestStatus | null;

  const mem = await createGenerationRequestQueueStore().read().catch(() => null);
  const all = mem?.requests ?? [];
  const assets = (await createAssetRegistryMemoryStore().read().catch(() => null))?.assets ?? [];

  let requests = all;
  if (statusFilter) requests = requests.filter((r) => r.status === statusFilter);

  const counts: Record<GenerationRequestStatus, number> = {
    draft: 0, approved: 0, submitted: 0, completed: 0, failed: 0, archived: 0,
  };
  for (const r of all) counts[r.status] += 1;

  // For convenience surface the list of APPROVED assets eligible
  // for queue-drafting.
  const approvedAssets = assets.filter((a) => a.approvalStatus === 'approved');

  return NextResponse.json({
    totalRequests: mem?.totalRequests ?? 0,
    counts,
    requests: requests.slice(-64),
    eligibleAssets: approvedAssets.slice(-32).map((a) => ({
      assetId: a.assetId, formula: a.formula, packageType: a.packageType,
      sourceStoryName: a.sourceStoryName,
    })),
    advisoryNotice:
      'Generation request queue · operator-supervised. ' +
      'The route never calls a provider, never publishes, never auto-approves. ' +
      'Human remains final authority.',
  });
}

// ─── POST ─────────────────────────────────────────────────────

interface DraftBody {
  action: 'draft';
  operatorId: string;
  operatorReason: string;
  sourceAssetId: string;
  providerId: ProviderId;
  operatorNote?: string;
  /** Optional: a brief summary for the queue listing. */
  summary?: string;
}
interface TransitionBody {
  action: 'approve' | 'submit' | 'complete' | 'fail' | 'archive';
  operatorId: string;
  operatorReason: string;
  requestId: string;
}
type Body = DraftBody | TransitionBody;

function isDraft(b: Body): b is DraftBody { return b.action === 'draft'; }
function isTransition(b: Body): b is TransitionBody {
  return ['approve', 'submit', 'complete', 'fail', 'archive'].includes(b.action);
}

const IMAGE_PROVIDER_SET: ReadonlySet<string> = new Set(['openai-images', 'flux', 'midjourney', 'ideogram', 'gemini-images']);
const VIDEO_PROVIDER_SET: ReadonlySet<string> = new Set(['veo', 'runway', 'kling', 'hailuo', 'pika']);

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const queueStore = createGenerationRequestQueueStore();

  if (isDraft(body)) {
    if (!body.sourceAssetId) {
      return NextResponse.json({ error: 'sourceAssetId is required' }, { status: 400 });
    }
    if (!PROVIDER_REGISTRY[body.providerId]) {
      return NextResponse.json({ error: 'unknown providerId' }, { status: 400 });
    }
    const assets = (await createAssetRegistryMemoryStore().read().catch(() => null))?.assets ?? [];
    const asset = assets.find((a) => a.assetId === body.sourceAssetId);
    if (!asset) {
      return NextResponse.json({ error: 'asset not found' }, { status: 404 });
    }
    if (asset.approvalStatus !== 'approved') {
      return NextResponse.json({
        error: 'source asset not approved · operator approval gate requires approved status',
        status: asset.approvalStatus,
      }, { status: 409 });
    }
    // Determine if image or video provider.
    const isImageProvider = IMAGE_PROVIDER_SET.has(body.providerId);
    const isVideoProvider = VIDEO_PROVIDER_SET.has(body.providerId);
    if (!isImageProvider && !isVideoProvider) {
      return NextResponse.json({ error: 'providerId is neither image nor video' }, { status: 400 });
    }
    if (isImageProvider && asset.packageType !== 'image' && asset.packageType !== 'carousel') {
      return NextResponse.json({
        error: `image provider ${body.providerId} cannot accept ${asset.packageType} asset`,
      }, { status: 409 });
    }
    if (isVideoProvider && asset.packageType !== 'video') {
      return NextResponse.json({
        error: `video provider ${body.providerId} cannot accept ${asset.packageType} asset`,
      }, { status: 409 });
    }

    // Reconstruct a minimal execution package from the frozen asset
    // record (the registry stores the prompt + source ids; we need
    // enough for the adapter shape).
    // To keep this route self-contained we recompose a synthetic
    // ImageExecutionPackage / VideoExecutionPackage using the asset's
    // frozen prompt and conservative defaults — the operator drives
    // any final tweaks via the studio.
    const cap = PROVIDER_REGISTRY[body.providerId];
    let providerPayload: ReturnType<typeof buildImagePayloadFor> | ReturnType<typeof buildVideoPayloadFor>;
    if (isImageProvider) {
      const synth = composeImageExecutionPackage({
        brief: {
          briefId: asset.sourceBriefId, briefType: 'image',
          formula: asset.formula, sourceStoryName: asset.sourceStoryName,
          audienceMarket: 'israel',
          scene: asset.summary, presence: 'unperformed presence',
          rhythm: 'measured-restraint', realism: 'documentary handheld · natural light',
          visualLanguage: '50mm handheld · mid-shot, off-center · soft natural light',
          memoryAnchors: ['familiar room'], productDirection: `MOOD ${asset.formula} chocolate`,
          dimensionsGuidance: 'mobile-first · 1080x1350 (4:5) primary',
          copyDirection: 'Hebrew RTL · 4-10 words',
          operatorReviewRequired: true,
          notes: ['operator review required'],
        },
        prompt: {
          promptId: asset.sourcePromptId, promptType: 'image',
          formula: asset.formula, sourceStoryName: asset.sourceStoryName,
          promptText: asset.prompt, summary: asset.summary,
          tokenBudget: Math.ceil(asset.prompt.length / 4),
          operatorReviewRequired: true,
          notes: ['operator review required'],
        },
      });
      providerPayload = buildImagePayloadFor(body.providerId as ImageProviderId, synth);
    } else {
      const synth = composeVideoExecutionPackage({
        brief: {
          briefId: asset.sourceBriefId, briefType: 'video',
          formula: asset.formula, sourceStoryName: asset.sourceStoryName,
          audienceMarket: 'israel',
          durationSeconds: 15,
          beats: [
            { index: 1, beat: 'tension observed alongside the scene', scene: asset.summary, silenceShare: 0.5 },
            { index: 2, beat: 'pause / breathing room observed alongside the scene', scene: asset.summary, silenceShare: 0.7 },
            { index: 3, beat: 'release historically associated with restraint', scene: asset.summary, silenceShare: 0.9 },
          ],
          emotionalArc: 'fatigue → tenderness → continuation',
          rhythm: 'observational still · measured restraint',
          silenceMoments: ['after the door closes'],
          presenceMoments: ['unperformed presence'],
          realismAnchors: ['documentary handheld · natural light · restrained edit'],
          copyDirection: 'Hebrew RTL captions for accessibility',
          productDirection: `MOOD ${asset.formula} chocolate`,
          dimensionsGuidance: 'mobile-first · 1080x1920 (9:16) vertical',
          operatorReviewRequired: true,
          notes: ['operator review required'],
        },
        prompt: {
          promptId: asset.sourcePromptId, promptType: 'video',
          formula: asset.formula, sourceStoryName: asset.sourceStoryName,
          promptText: asset.prompt, summary: asset.summary,
          tokenBudget: Math.ceil(asset.prompt.length / 4),
          operatorReviewRequired: true,
          notes: ['operator review required'],
        },
      });
      providerPayload = buildVideoPayloadFor(body.providerId as VideoProviderId, synth);
    }

    const at = Date.now();
    const record: GenerationRequestRecord = {
      requestId: newGenerationRequestId(),
      sourceAssetId: asset.assetId,
      formula: asset.formula,
      campaign: asset.campaign,
      providerId: body.providerId,
      providerName: cap.providerName,
      packageType: cap.packageType,
      summary: body.summary ?? `${cap.providerName} · ${asset.sourceStoryName}`,
      providerPayload: providerPayload.requestBody,
      endpointHint: providerPayload.endpointHint,
      estimatedCostUSD: providerPayload.estimatedCostUSD,
      createdAt: at,
      operatorId: body.operatorId,
      status: 'draft',
      history: [{ at, status: 'draft', operatorId: body.operatorId, reason: body.operatorReason }],
      operatorNote: body.operatorNote,
    };
    const next = await queueStore.append(record);
    return NextResponse.json({
      ok: true,
      request: record,
      totalRequests: next.totalRequests,
      advisoryNotice:
        'Operator-supervised — drafted with status `draft`. ' +
        'The route never calls a provider, never auto-approves. ' +
        'Human remains final authority.',
    });
  }

  if (isTransition(body)) {
    const status: GenerationRequestStatus =
      body.action === 'approve' ? 'approved' :
      body.action === 'submit' ? 'submitted' :
      body.action === 'complete' ? 'completed' :
      body.action === 'fail' ? 'failed' :
                                'archived';
    if (!VALID_TRANSITIONS.has(status)) {
      return NextResponse.json({ error: 'invalid transition' }, { status: 400 });
    }
    try {
      const next = await queueStore.updateStatus(body.requestId, {
        at: Date.now(), status,
        operatorId: body.operatorId, reason: body.operatorReason,
      });
      const updated = next.requests.find((r) => r.requestId === body.requestId);
      return NextResponse.json({
        ok: true,
        request: updated,
        advisoryNotice:
          `Operator-supervised — status set to \`${status}\` for ${body.requestId}. ` +
          'No provider call, no publishing. Human remains final authority.',
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
