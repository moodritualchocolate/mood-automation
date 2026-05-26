/**
 * POST /api/refusal-narrative
 *
 * Read-only. Accepts a current request context (formula, mode,
 * brutality) + lets the engine pull live signals from creative-drift
 * memory. Returns the refusal narrative output. ADVISORY ONLY — this
 * endpoint does NOT refuse anything; it just describes.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { computeRefusalNarrative } from '@lib/refusalNarrativeEngine';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  formula?: string;
  campaignMode?: string | null;
  brutality?: number;
  /** Optional override signals if the caller wants to model a hypothetical. */
  trustDebt?: number;
  repetitionPressure?: number;
  drift?: number;
  entropy?: number;
  narrativeStability?: number;
  persuasionVariance?: number;
  emotionalCompression?: number;
  identityErosion?: number;
  dignityErosion?: number;
  refusalReason?: string;
}

async function compose(body: Body): Promise<unknown> {
  const dmem = await createCreativeDriftMemoryStore().read().catch(() => null);
  const last = dmem?.observations[dmem.observations.length - 1] ?? null;
  return computeRefusalNarrative({
    formula:     body.formula     ?? 'ENERGY',
    campaignMode: body.campaignMode ?? null,
    brutality:   typeof body.brutality === 'number' ? body.brutality : 0.5,
    trustDebt:               body.trustDebt               ?? (last ? Math.min(10, Math.max(0, 5 + last.trustErosionDrift)) : undefined),
    repetitionPressure:      body.repetitionPressure      ?? last?.originalityPressure,
    drift:                   body.drift                   ?? last?.driftSeverity,
    entropy:                 body.entropy                 ?? last?.entropyLevel,
    narrativeStability:      body.narrativeStability      ?? last?.narrativeStability,
    persuasionVariance:      body.persuasionVariance      ?? last?.persuasionVariance,
    emotionalCompression:    body.emotionalCompression    ?? (last ? Math.max(0, 10 - last.emotionalDiversity) : undefined),
    identityErosion:         body.identityErosion,
    dignityErosion:          body.dignityErosion,
    refusalReason:           body.refusalReason,
  });
}

export async function GET(): Promise<NextResponse> {
  const out = await compose({});
  return NextResponse.json(out);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  const out = await compose(body);
  return NextResponse.json(out);
}
