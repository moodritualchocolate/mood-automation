/**
 * /api/simple-performance · operator-facing performance entry surface.
 *
 * POST · operator-supervised.
 *        Input (minimum required):
 *          publicationId · views · clicks · engagement (0..1) · revenueUSD
 *        Optional:
 *          windowDays (defaults to 7)
 *          journeyId (for the revenue event, defaults to derived)
 *
 *        Maps internally to:
 *          - PerformanceRecord via appendPerformanceRecord (existing
 *            performance-memory schema preserved unchanged)
 *          - JourneyEvent of type 'purchase' via appendJourneyEvent
 *            when revenueUSD > 0
 *
 *        Closes the friction surfaced by `wk-performance-deep-shape`
 *        (8 required fields · nested measurementWindow · 12-field
 *        metrics) in the Reality Hardening audit. The existing schema
 *        is preserved; this route is an operator surface above it.
 *
 *        NEVER auto-acts. NEVER publishes. NEVER calls external APIs.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendPerformanceRecord, createPerformanceMemoryStore, newPerformanceId,
  type PerformanceRecord,
} from '@lib/performanceMemory';
import {
  createPublicationRegistryStore,
} from '@lib/publicationRegistryMemory';
import {
  appendJourneyEvent, createCustomerJourneyMemoryStore, newJourneyEventId,
  type JourneyEvent,
} from '@lib/customerJourneyMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SimpleBody {
  operatorId: string;
  operatorReason: string;
  publicationId: string;
  views: number;
  clicks: number;
  /** Engagement as a 0..1 fraction (e.g. 0.05 = 5%). */
  engagement: number;
  /** Revenue in USD (0 if no purchase event observed). */
  revenueUSD: number;
  /** Optional measurement window in days (defaults to 7). */
  windowDays?: number;
  /** Optional journey identifier for the revenue event. */
  journeyId?: string;
  operatorNote?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: SimpleBody;
  try { body = await req.json() as SimpleBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (typeof body.publicationId !== 'string' || body.publicationId.length === 0) {
    return NextResponse.json({ error: 'publicationId is required' }, { status: 400 });
  }
  if (typeof body.views !== 'number' || body.views < 0) {
    return NextResponse.json({ error: 'views must be a non-negative number' }, { status: 400 });
  }
  if (typeof body.clicks !== 'number' || body.clicks < 0) {
    return NextResponse.json({ error: 'clicks must be a non-negative number' }, { status: 400 });
  }
  if (typeof body.engagement !== 'number' || body.engagement < 0 || body.engagement > 1) {
    return NextResponse.json({ error: 'engagement must be a 0..1 fraction' }, { status: 400 });
  }
  if (typeof body.revenueUSD !== 'number' || body.revenueUSD < 0) {
    return NextResponse.json({ error: 'revenueUSD must be a non-negative number' }, { status: 400 });
  }

  const pubStore = createPublicationRegistryStore();
  const pubState = await pubStore.read();
  const pub = pubState.publications.find((p) => p.publicationId === body.publicationId);
  if (!pub) return NextResponse.json({ error: 'publication not found' }, { status: 404 });

  const at = Date.now();
  const windowDays = Math.max(1, body.windowDays ?? 7);
  const startedAt = at - windowDays * 24 * 60 * 60 * 1000;
  const ctr = body.views > 0 ? body.clicks / body.views : 0;

  // ── 1 · write to the existing performance schema ──────────
  const perfStore = createPerformanceMemoryStore();
  let perfState = await perfStore.read();
  const performance: PerformanceRecord = {
    performanceId: newPerformanceId(),
    assetId: pub.assetId,
    publicationId: pub.publicationId,
    platform: pub.platform,
    measuredAt: at,
    measurementWindow: { startedAt, endedAt: at, durationHours: windowDays * 24 },
    metrics: {
      views: body.views,
      reach: body.views, // reach defaults to views when the operator did not separate them
      ctr,
      engagementRate: body.engagement,
    },
    operatorNote: body.operatorNote ?? 'simple-performance entry',
    operatorId: body.operatorId,
  };
  perfState = appendPerformanceRecord(perfState, performance);
  await perfStore.save(perfState);

  // ── 2 · optionally append a journey 'purchase' event ──────
  let revenueEventId: string | null = null;
  if (body.revenueUSD > 0) {
    const journeyStore = createCustomerJourneyMemoryStore();
    let journeyState = await journeyStore.read();
    const event: JourneyEvent = {
      eventId: newJourneyEventId(),
      eventType: 'purchase',
      journeyId: body.journeyId ?? `j-simple-${pub.publicationId}-${at.toString(36)}`,
      publicationId: pub.publicationId,
      assetId: pub.assetId,
      channel: pub.channel,
      audience: pub.audience,
      revenueUSD: body.revenueUSD,
      occurredAt: at,
      operatorNote: body.operatorNote ?? 'simple-performance revenue event',
      operatorId: body.operatorId,
      loggedAt: at,
    };
    journeyState = appendJourneyEvent(journeyState, event);
    await journeyStore.save(journeyState);
    revenueEventId = event.eventId;
  }

  return NextResponse.json({
    ok: true,
    performance,
    revenueEventId,
    derived: { ctr, windowDays },
    advisoryNotice:
      'Operator-supervised — simple performance entry recorded. The route ' +
      'NEVER auto-publishes, NEVER spends money, NEVER calls external APIs. ' +
      'The existing performance + journey schemas are preserved; this route ' +
      'is an operator surface above them. Human remains final authority.',
  });
}
