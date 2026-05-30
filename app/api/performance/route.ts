/**
 * /api/performance
 *
 * Performance memory · operator-supervised.
 *
 * GET   — returns the registry (read-only).
 * POST  — operator-supervised. Operator MANUALLY logs metrics
 *         pulled from external analytics. Every write requires
 *         operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route never fetches from platforms
 *   - the route never auto-derives metrics
 *   - the route never publishes
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createPerformanceMemoryStore, newPerformanceId,
  type PerformanceRecord, type PerformanceMetrics,
} from '@lib/performanceMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const assetFilter = url.searchParams.get('assetId');
  const publicationFilter = url.searchParams.get('publicationId');

  const mem = await createPerformanceMemoryStore().read().catch(() => null);
  let performances = mem?.performances ?? [];
  if (assetFilter) performances = performances.filter((p) => p.assetId === assetFilter);
  if (publicationFilter) performances = performances.filter((p) => p.publicationId === publicationFilter);

  return NextResponse.json({
    totalPerformances: mem?.totalPerformances ?? 0,
    performances: performances.slice(-128),
    advisoryNotice:
      'Performance memory · operator-supervised manual logging. ' +
      'The route never fetches from platforms, never auto-derives metrics, ' +
      'never publishes. Human remains final authority.',
  });
}

interface LogBody {
  operatorId: string;
  operatorReason: string;
  assetId: string;
  publicationId: string;
  platform: string;
  measuredAt?: number;
  measurementWindow: {
    startedAt: number;
    endedAt: number;
    durationHours: number;
  };
  metrics: PerformanceMetrics;
  operatorNote?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: LogBody;
  try { body = await req.json() as LogBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (!body.assetId) return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
  if (!body.publicationId) return NextResponse.json({ error: 'publicationId is required' }, { status: 400 });
  if (!body.measurementWindow || typeof body.measurementWindow.durationHours !== 'number') {
    return NextResponse.json({ error: 'measurementWindow is required' }, { status: 400 });
  }
  if (!body.metrics || typeof body.metrics !== 'object') {
    return NextResponse.json({ error: 'metrics is required' }, { status: 400 });
  }

  // Validate publication exists and matches assetId.
  const publications = (await createPublicationRegistryStore().read().catch(() => null))?.publications ?? [];
  const pub = publications.find((p) => p.publicationId === body.publicationId);
  if (!pub) {
    return NextResponse.json({ error: 'publicationId not found in publication registry' }, { status: 404 });
  }
  if (pub.assetId !== body.assetId) {
    return NextResponse.json({
      error: 'assetId does not match the publication asset',
      expected: pub.assetId,
    }, { status: 409 });
  }

  const at = body.measuredAt ?? Date.now();
  const record: PerformanceRecord = {
    performanceId: newPerformanceId(),
    assetId: body.assetId,
    publicationId: body.publicationId,
    platform: body.platform,
    measuredAt: at,
    measurementWindow: body.measurementWindow,
    metrics: body.metrics,
    operatorNote: body.operatorNote,
    operatorId: body.operatorId,
  };
  const store = createPerformanceMemoryStore();
  const next = await store.append(record);
  return NextResponse.json({
    ok: true,
    performance: record,
    totalPerformances: next.totalPerformances,
    advisoryNotice:
      'Operator-supervised — performance metrics logged. ' +
      'The route never fetches from platforms. Human remains final authority.',
  });
}
