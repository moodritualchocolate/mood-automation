/**
 * /api/trial-outcome
 *
 * Operator-supervised trial-outcome attachment. The route stores
 * operator-supplied outcome data linked to existing operator
 * creative trials. It NEVER calls generation, NEVER publishes,
 * NEVER scrapes external platforms.
 *
 * STRICT CONTRACT:
 *   - GET returns outcome history + composed analysis (read-only)
 *   - POST is operator-supervised
 *     · requires: operatorId, trialId, platform, audienceSegment
 *     · requires at least one of: metrics, qualitativeSignals
 *   - the route also updates the matching trial's status to
 *     'outcome-attached' when the operator submits — this is the
 *     ONLY sibling-memory write, and it is operator-initiated
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import {
  createTrialOutcomeMemoryStore, newOutcomeId,
  type TrialOutcomeMetrics, type TrialOutcomeRecord,
} from '@lib/trialOutcomeMemory';
import { createOperatorTrialMemoryStore } from '@lib/operatorCreativeTrialMemory';
import { analyzeTrialOutcomes } from '@lib/trialOutcomeAnalyzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── GET — history + analysis ────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const [outcomeMem, trialMem] = await Promise.all([
    createTrialOutcomeMemoryStore().read().catch(() => null),
    createOperatorTrialMemoryStore().read().catch(() => null),
  ]);
  const trials = trialMem?.trials ?? [];
  const outcomes = outcomeMem?.outcomes ?? [];
  const analysis = analyzeTrialOutcomes(trials, outcomes);
  return NextResponse.json({
    totalOutcomes: outcomes.length,
    recentOutcomes: outcomes.slice(-24),
    analysis,
    advisoryNotice:
      'Operator-supervised — the route stores outcome data linked to existing ' +
      'trials. It NEVER calls generation, NEVER publishes, NEVER scrapes platforms.',
  });
}

// ─── POST — operator-supervised outcome attachment ───────────

interface OutcomeBody {
  operatorId?: string;
  trialId?: string;
  platform?: string;
  audienceSegment?: string;
  exposureWindow?: string;
  metrics?: TrialOutcomeMetrics;
  qualitativeSignals?: string[];
  operatorNotes?: string;
  outcomeLabels?: string[];
}

function hasMetrics(m?: TrialOutcomeMetrics): boolean {
  if (!m) return false;
  return Object.keys(m).length > 0 && Object.values(m).some((v) => typeof v === 'number');
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;

  let body: OutcomeBody;
  try { body = await req.json() as OutcomeBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body.operatorId || typeof body.operatorId !== 'string') {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (!body.trialId || typeof body.trialId !== 'string') {
    return NextResponse.json({ error: 'trialId is required' }, { status: 400 });
  }
  if (!body.platform || typeof body.platform !== 'string') {
    return NextResponse.json({ error: 'platform is required' }, { status: 400 });
  }
  if (!body.audienceSegment || typeof body.audienceSegment !== 'string') {
    return NextResponse.json({ error: 'audienceSegment is required' }, { status: 400 });
  }
  const qualitative = Array.isArray(body.qualitativeSignals) ? body.qualitativeSignals : [];
  if (!hasMetrics(body.metrics) && qualitative.length === 0) {
    return NextResponse.json({
      error: 'at least one of metrics or qualitativeSignals is required',
    }, { status: 400 });
  }

  // Verify the trial exists. If not, we 404 — the route never creates
  // a trial implicitly.
  const trialStore = createOperatorTrialMemoryStore();
  const trialMem = await trialStore.read();
  const trial = trialMem.trials.find((t) => t.trialId === body.trialId);
  if (!trial) {
    return NextResponse.json({ error: `trialId ${body.trialId} not found` }, { status: 404 });
  }

  // Build + persist the outcome record.
  const record: TrialOutcomeRecord = {
    outcomeId: newOutcomeId(),
    trialId: body.trialId,
    timestamp: Date.now(),
    operatorId: body.operatorId,
    platform: body.platform,
    audienceSegment: body.audienceSegment,
    exposureWindow: body.exposureWindow,
    metrics: body.metrics ?? {},
    qualitativeSignals: qualitative,
    operatorNotes: body.operatorNotes,
    outcomeLabels: Array.isArray(body.outcomeLabels) ? body.outcomeLabels : [],
  };
  await createTrialOutcomeMemoryStore().append(record);

  // Best-effort: also update the trial's status to 'outcome-attached'.
  // This sibling-memory write is operator-initiated (the operator
  // submitted the POST) and remains within the supervised contract.
  try {
    await trialStore.updateStatus({
      trialId: body.trialId,
      status: 'outcome-attached',
      operatorId: body.operatorId,
      note: 'outcome attached',
      outcomeId: record.outcomeId,
    });
  } catch {
    // non-fatal — the outcome is recorded even if status update fails
  }

  return NextResponse.json({
    ok: true,
    outcomeId: record.outcomeId,
    trialId: record.trialId,
    advisoryNotice:
      'Outcome attached. The system does not execute generation or publish ' +
      'anything; the operator supplied the data.',
  });
}
