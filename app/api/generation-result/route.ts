/**
 * /api/generation-result
 *
 * Generation result registry · operator-supervised.
 *
 * GET   — returns the result registry (read-only).
 * POST  — operator-supervised. Operator logs the result of an
 *         externally-performed generation. Every write requires
 *         operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route never calls a provider
 *   - the route never publishes
 *   - the route never auto-approves
 *   - logging a result does NOT mark the source request "completed";
 *     the operator does that separately via /api/generation-queue
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createGenerationResultRegistryStore, newGenerationResultId,
  type GenerationResultRecord,
} from '@lib/generationResultRegistry';
import { PROVIDER_REGISTRY } from '@lib/providerRegistry';
import { createGenerationRequestQueueStore } from '@lib/generationRequestQueue';
import type { ProviderId } from '@lib/providers/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const assetFilter = url.searchParams.get('assetId');
  const requestFilter = url.searchParams.get('requestId');
  const providerFilter = url.searchParams.get('provider');

  const mem = await createGenerationResultRegistryStore().read().catch(() => null);
  let results = mem?.results ?? [];
  if (assetFilter) results = results.filter((r) => r.assetId === assetFilter);
  if (requestFilter) results = results.filter((r) => r.requestId === requestFilter);
  if (providerFilter) results = results.filter((r) => r.provider === providerFilter);

  return NextResponse.json({
    totalResults: mem?.totalResults ?? 0,
    results: results.slice(-64),
    advisoryNotice:
      'Generation result registry · operator-supervised log of external generations. ' +
      'The route never calls a provider, never publishes, never auto-approves. ' +
      'Human remains final authority.',
  });
}

// ─── POST ─────────────────────────────────────────────────────

interface LogResultBody {
  operatorId: string;
  operatorReason: string;
  assetId: string;
  requestId: string;
  provider: ProviderId;
  generatedAt?: number;
  preview?: string;
  metadata?: Record<string, unknown>;
  operatorNote?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: LogResultBody;
  try { body = await req.json() as LogResultBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (typeof body.assetId !== 'string' || body.assetId.length === 0) {
    return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
  }
  if (typeof body.requestId !== 'string' || body.requestId.length === 0) {
    return NextResponse.json({ error: 'requestId is required' }, { status: 400 });
  }
  if (!PROVIDER_REGISTRY[body.provider]) {
    return NextResponse.json({ error: 'unknown provider' }, { status: 400 });
  }

  // Confirm the requestId exists and belongs to the operator's queue.
  const queue = (await createGenerationRequestQueueStore().read().catch(() => null))?.requests ?? [];
  const sourceRequest = queue.find((r) => r.requestId === body.requestId);
  if (!sourceRequest) {
    return NextResponse.json({ error: 'requestId not found in generation request queue' }, { status: 404 });
  }
  if (sourceRequest.sourceAssetId !== body.assetId) {
    return NextResponse.json({
      error: 'assetId does not match the request source asset',
      expected: sourceRequest.sourceAssetId,
    }, { status: 409 });
  }

  const at = body.generatedAt ?? Date.now();
  const record: GenerationResultRecord = {
    resultId: newGenerationResultId(),
    assetId: body.assetId,
    requestId: body.requestId,
    provider: body.provider,
    operator: body.operatorId,
    generatedAt: at,
    preview: body.preview,
    metadata: body.metadata ?? {},
    operatorNote: body.operatorNote,
  };

  const store = createGenerationResultRegistryStore();
  const next = await store.append(record);

  return NextResponse.json({
    ok: true,
    result: record,
    totalResults: next.totalResults,
    advisoryNotice:
      'Operator-supervised — result logged. ' +
      'The route never calls a provider, never publishes, never auto-approves. ' +
      'Human remains final authority.',
  });
}
