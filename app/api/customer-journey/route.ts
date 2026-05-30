/**
 * /api/customer-journey
 *
 * Customer journey memory + analyzer · operator-supervised.
 *
 * GET   — returns journey events + analyzer reading (read-only).
 * POST  — operator-supervised. Operator MANUALLY logs a journey
 *         event pulled from external analytics / CRM / payments.
 *         Every write requires operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route NEVER fetches from analytics / CRM / payments / ad APIs
 *   - the route NEVER triggers any outbound action
 *   - the route NEVER auto-logs
 *   - the route NEVER predicts
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createCustomerJourneyMemoryStore, newJourneyEventId,
  type JourneyEvent, type JourneyEventType,
} from '@lib/customerJourneyMemory';
import { analyzeCustomerJourneys } from '@lib/customerJourneyEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_EVENT_TYPES: ReadonlySet<JourneyEventType> = new Set([
  'impression', 'view', 'click', 'landing-visit',
  'lead', 'call', 'purchase', 'repeat-purchase',
]);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const journeyFilter = url.searchParams.get('journeyId');
  const eventTypeFilter = url.searchParams.get('eventType') as JourneyEventType | null;

  const mem = await createCustomerJourneyMemoryStore().read().catch(() => null);
  let events = mem?.events ?? [];
  if (journeyFilter) events = events.filter((e) => e.journeyId === journeyFilter);
  if (eventTypeFilter && VALID_EVENT_TYPES.has(eventTypeFilter)) {
    events = events.filter((e) => e.eventType === eventTypeFilter);
  }
  const reading = analyzeCustomerJourneys({ events: mem?.events ?? [] });
  return NextResponse.json({
    totalEvents: mem?.totalEvents ?? 0,
    events: events.slice(-128),
    reading,
    advisoryNotice:
      'Customer journey · operator-supervised manual event logging. ' +
      'The route never fetches from analytics / CRM / payments / ad APIs, ' +
      'never triggers outbound actions. Human remains final authority.',
  });
}

// ─── POST ────────────────────────────────────────────────────

interface LogJourneyEventBody {
  operatorId: string;
  operatorReason: string;
  eventType: JourneyEventType;
  journeyId: string;
  publicationId?: string;
  assetId?: string;
  campaignPlanId?: string;
  revenueUSD?: number;
  channel?: string;
  audience?: string;
  occurredAt?: number;
  operatorNote?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: LogJourneyEventBody;
  try { body = await req.json() as LogJourneyEventBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (!body.eventType || !VALID_EVENT_TYPES.has(body.eventType)) {
    return NextResponse.json({ error: 'eventType is required and must be one of the supported types' }, { status: 400 });
  }
  if (typeof body.journeyId !== 'string' || body.journeyId.length === 0) {
    return NextResponse.json({ error: 'journeyId is required' }, { status: 400 });
  }

  const now = Date.now();
  const event: JourneyEvent = {
    eventId: newJourneyEventId(),
    eventType: body.eventType,
    journeyId: body.journeyId,
    publicationId: body.publicationId,
    assetId: body.assetId,
    campaignPlanId: body.campaignPlanId,
    revenueUSD: body.revenueUSD,
    channel: body.channel,
    audience: body.audience,
    occurredAt: body.occurredAt ?? now,
    operatorNote: body.operatorNote,
    operatorId: body.operatorId,
    loggedAt: now,
  };
  const store = createCustomerJourneyMemoryStore();
  const next = await store.append(event);
  return NextResponse.json({
    ok: true,
    event,
    totalEvents: next.totalEvents,
    advisoryNotice:
      'Operator-supervised — journey event logged. The route never fetches ' +
      'from analytics / CRM / payments / ad APIs. Human remains final authority.',
  });
}
