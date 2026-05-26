/**
 * /api/outcome
 *
 * Operator-supervised ingestion of REAL-WORLD outcomes attached to
 * creative fingerprints. POST writes one record to the FIFO. GET
 * returns the most recent slice.
 *
 * STRICT CONTRACT:
 *   - every write requires the operator to submit the body
 *   - the system never auto-scrapes platforms
 *   - never auto-derives outcomes from external sources
 *   - never auto-selects winners; this endpoint just stores what
 *     the operator says happened
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createOutcomeMemoryStore, recordOutcome, deriveOutcomeLabel,
  type OutcomeRecord, type OutcomeMetrics, type OutcomeLabel,
} from '@lib/outcomeMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const mem = await createOutcomeMemoryStore().read().catch(() => null);
  if (!mem) {
    return NextResponse.json({
      totalOutcomes: 0, outcomes: [],
      advisoryNotice: 'observatory only',
    });
  }
  return NextResponse.json({
    totalOutcomes: mem.totalOutcomes,
    outcomes: mem.outcomes.slice(-48),
    advisoryNotice: 'Observatory only — outcomes are operator-supplied; the system never auto-publishes.',
  });
}

interface OutcomeBody {
  bannerId?: string | null;
  platform?: string;
  audienceSegment?: string;
  campaignMode?: string | null;
  formula?: string;
  creativeFingerprint?: string;
  emotionalSignature?: string;
  narrativeSignature?: string;
  persuasionIntensity?: number;
  realismLevel?: number;
  visualStyle?: string;
  cadenceState?: string;
  mutationPressure?: number;
  metrics?: OutcomeMetrics;
  downstreamOutcome?: OutcomeLabel;
  operatorNote?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: OutcomeBody;
  try { body = await req.json() as OutcomeBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body.platform || !body.audienceSegment) {
    return NextResponse.json({ error: 'platform and audienceSegment are required' }, { status: 400 });
  }
  const metrics: OutcomeMetrics = body.metrics ?? {};
  const record: Omit<OutcomeRecord, 'downstreamOutcome'> & { downstreamOutcome?: OutcomeLabel } = {
    at: Date.now(),
    bannerId: body.bannerId ?? null,
    platform: body.platform,
    audienceSegment: body.audienceSegment,
    campaignMode: body.campaignMode ?? null,
    formula: body.formula ?? 'ENERGY',
    creativeFingerprint: body.creativeFingerprint ?? 'unknown',
    emotionalSignature: body.emotionalSignature ?? 'unsigned',
    narrativeSignature: body.narrativeSignature ?? 'unsigned',
    persuasionIntensity: typeof body.persuasionIntensity === 'number' ? body.persuasionIntensity : 5,
    realismLevel: typeof body.realismLevel === 'number' ? body.realismLevel : 5,
    visualStyle: body.visualStyle ?? 'unspecified',
    cadenceState: body.cadenceState ?? 'normal',
    mutationPressure: typeof body.mutationPressure === 'number' ? body.mutationPressure : 0,
    metrics,
    downstreamOutcome: body.downstreamOutcome,
    operatorNote: body.operatorNote,
  };
  await recordOutcome(record);
  return NextResponse.json({
    ok: true,
    derivedLabel: record.downstreamOutcome ?? deriveOutcomeLabel(metrics),
    advisoryNotice: 'Outcome recorded. The system observes; it does not act.',
  });
}
