/**
 * /api/operator-creative-trial
 *
 * Operator-supervised trial bookkeeping. The route may store
 * operator decisions about which sandbox candidates to mark for
 * trial — it NEVER executes generation, NEVER publishes, NEVER
 * runs the pipeline.
 *
 * STRICT CONTRACT:
 *   - GET returns trial history + analyzer view (read-only)
 *   - POST is operator-supervised; every write requires operatorId
 *     and operatorReason
 *   - the route may NOT call /api/generate, NEVER imports the
 *     pipeline, NEVER auto-selects a candidate
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  createOperatorTrialMemoryStore, newTrialId,
  type OperatorCreativeTrial, type TrialStatus,
} from '@lib/operatorCreativeTrialMemory';
import { analyzeOperatorTrials } from '@lib/operatorTrialAnalyzer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── GET — history + analysis ────────────────────────────────

export async function GET(): Promise<NextResponse> {
  const mem = await createOperatorTrialMemoryStore().read().catch(() => null);
  const trials = mem?.trials ?? [];
  const analysis = analyzeOperatorTrials(trials);
  return NextResponse.json({
    totalTrials: trials.length,
    pendingTrials: trials.filter((t) =>
      t.status === 'proposed' || t.status === 'approved' || t.status === 'tested',
    ),
    analysis,
    advisoryNotice:
      'Operator-supervised — the route stores explicit operator decisions. ' +
      'It NEVER executes generation, publishes, or auto-selects a candidate.',
  });
}

// ─── POST — create / update-status ───────────────────────────

const ALLOWED_STATUSES: ReadonlySet<TrialStatus> = new Set([
  'proposed', 'approved', 'rejected', 'tested', 'outcome-attached',
]);

interface CreateBody {
  action: 'create';
  operatorId: string;
  operatorReason: string;
  sourceCandidateId: string;
  formula: string;
  campaignMode?: string | null;
  mutationType: string;
  fingerprintDelta: string;
}
interface UpdateBody {
  action: 'update-status';
  operatorId: string;
  trialId: string;
  status: TrialStatus;
  note?: string;
  outcomeId?: string;
}
type Body = CreateBody | UpdateBody;

function isCreate(b: Body): b is CreateBody { return b.action === 'create'; }
function isUpdate(b: Body): b is UpdateBody { return b.action === 'update-status'; }

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }

  const store = createOperatorTrialMemoryStore();

  if (isCreate(body)) {
    if (typeof body.operatorReason !== 'string' || body.operatorReason.trim().length === 0) {
      return NextResponse.json({ error: 'operatorReason is required for create' }, { status: 400 });
    }
    if (!body.sourceCandidateId || !body.formula || !body.mutationType || !body.fingerprintDelta) {
      return NextResponse.json({
        error: 'sourceCandidateId, formula, mutationType, fingerprintDelta are required',
      }, { status: 400 });
    }
    const now = Date.now();
    const trial: OperatorCreativeTrial = {
      trialId: newTrialId(),
      createdAt: now,
      updatedAt: now,
      operatorId: body.operatorId,
      sourceCandidateId: body.sourceCandidateId,
      formula: body.formula,
      campaignMode: body.campaignMode ?? null,
      mutationType: body.mutationType,
      fingerprintDelta: body.fingerprintDelta,
      operatorReason: body.operatorReason.trim(),
      status: 'proposed',
      statusHistory: [{ at: now, status: 'proposed', operatorId: body.operatorId }],
    };
    await store.append(trial);
    return NextResponse.json({
      ok: true,
      trialId: trial.trialId,
      status: trial.status,
      advisoryNotice: 'Trial recorded. The system does not execute the mutation.',
    });
  }

  if (isUpdate(body)) {
    if (!body.trialId || !body.status) {
      return NextResponse.json({ error: 'trialId and status are required' }, { status: 400 });
    }
    if (!ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json({ error: `unknown status: ${body.status}` }, { status: 400 });
    }
    try {
      await store.updateStatus({
        trialId: body.trialId,
        status: body.status,
        operatorId: body.operatorId,
        note: body.note,
        outcomeId: body.outcomeId,
      });
    } catch (err) {
      return NextResponse.json({
        error: (err as Error).message,
      }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      trialId: body.trialId,
      status: body.status,
      advisoryNotice: 'Trial status updated. No generation, no publishing.',
    });
  }

  return NextResponse.json({
    error: `unknown action — expected "create" or "update-status"`,
  }, { status: 400 });
}
