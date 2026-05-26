/**
 * GET  /api/operator-confidence-preference?operatorId=...
 *   Read-only view of the operator's confidence preferences.
 *
 * POST /api/operator-confidence-preference
 *   Body: { operatorId, projectionType, confidenceWeight, reasonNote? }
 *   Persists an operator's slider update.
 *
 * STRICTLY visual overlay — the persisted weight is never read by
 * critic / generation / projection / branch ranking / campaign
 * evolution. The slider state is metadata for the operator's own
 * panel rendering.
 *
 * No external execution.
 */

import { NextRequest } from 'next/server';
import {
  createOperatorConfidencePreferenceMemoryStore,
} from '@lib/operatorConfidencePreferenceMemory';
import {
  buildOperatorConfidencePreferenceView,
} from '@lib/operatorConfidencePreferenceView';
import {
  isKnownProjectionType, clampWeight, type OperatorPreference,
} from '@lib/operatorConfidencePreference';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const DEFAULT_OPERATOR_ID = 'studio';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const operatorId = url.searchParams.get('operatorId') || DEFAULT_OPERATOR_ID;
  const memory = await createOperatorConfidencePreferenceMemoryStore().read().catch(() => null);
  const view = buildOperatorConfidencePreferenceView({
    memory, operatorId, at: Date.now(),
  });
  return Response.json(view, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}

interface PreferencePostBody {
  operatorId?: string;
  projectionType: string;
  confidenceWeight: number;
  reasonNote?: string;
}

export async function POST(req: NextRequest) {
  let body: PreferencePostBody;
  try {
    body = (await req.json()) as PreferencePostBody;
  } catch {
    return Response.json({ error: 'invalid json body' }, { status: 400 });
  }
  if (!body || typeof body !== 'object' ||
      typeof body.projectionType !== 'string' ||
      typeof body.confidenceWeight !== 'number') {
    return Response.json({ error: 'projectionType + confidenceWeight required' }, { status: 400 });
  }
  if (!isKnownProjectionType(body.projectionType)) {
    return Response.json({ error: `unknown projectionType: ${body.projectionType}` }, { status: 400 });
  }
  const operatorId = (body.operatorId && body.operatorId.length > 0)
    ? body.operatorId : DEFAULT_OPERATOR_ID;
  const pref: OperatorPreference = {
    operatorId,
    projectionType: body.projectionType,
    confidenceWeight: clampWeight(body.confidenceWeight),
    reasonNote: typeof body.reasonNote === 'string' && body.reasonNote.length > 0
      ? body.reasonNote : null,
    updatedAt: Date.now(),
  };
  try {
    await createOperatorConfidencePreferenceMemoryStore().update(pref);
  } catch (e) {
    return Response.json({
      error: `failed to persist preference: ${(e as Error).message}`,
    }, { status: 500 });
  }
  return Response.json({
    ok: true,
    operatorId,
    projectionType: pref.projectionType,
    confidenceWeight: pref.confidenceWeight,
    message: 'preference recorded — visual overlay only, never applied to projections',
  }, { headers: { 'cache-control': 'no-cache, no-transform' } });
}
