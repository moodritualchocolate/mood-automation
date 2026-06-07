/**
 * POST /api/mvp/selection — save the operator's review choices.
 *
 * Operator-supervised. Tenant-scoped via the underlying GenerationRecord.
 *
 * Body:
 *   { generationId, chosenOneLinerId, keptHookIds[], keptUgcScriptIds[],
 *     keptImageConceptIds[], operatorReason }
 *
 * Response:
 *   { selectionId }
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createMvpGenerationMemoryStore } from '@lib/mvpGenerationMemory';
import {
  createMvpSelectionMemoryStore, newSelectionId,
  type SelectionRecord,
} from '@lib/mvpSelectionMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface Body {
  generationId: string;
  chosenOneLinerId: string;
  keptHookIds: string[];
  keptUgcScriptIds: string[];
  keptImageConceptIds: string[];
  organizationId?: string;
  workspaceId?: string;
  operatorReason: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.generationId !== 'string' || body.generationId.length === 0) {
    return NextResponse.json({ error: 'generationId is required' }, { status: 400 });
  }
  if (typeof body.chosenOneLinerId !== 'string' || body.chosenOneLinerId.length === 0) {
    return NextResponse.json({ error: 'chosenOneLinerId is required' }, { status: 400 });
  }
  if (!Array.isArray(body.keptHookIds)) {
    return NextResponse.json({ error: 'keptHookIds must be an array' }, { status: 400 });
  }
  if (!Array.isArray(body.keptUgcScriptIds)) {
    return NextResponse.json({ error: 'keptUgcScriptIds must be an array' }, { status: 400 });
  }
  if (!Array.isArray(body.keptImageConceptIds)) {
    return NextResponse.json({ error: 'keptImageConceptIds must be an array' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const operatorId = tenantAuth.ctx.user.userId;

  // Verify the generation belongs to this tenant + operator + is ready
  const generation = await createMvpGenerationMemoryStore().findById(body.generationId);
  if (!generation) {
    return NextResponse.json({ error: 'generation not found' }, { status: 404 });
  }
  if (generation.organizationId !== organizationId || generation.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'generation not in this tenant' }, { status: 403 });
  }
  if (generation.operatorId !== operatorId) {
    return NextResponse.json({ error: 'generation not owned by this operator' }, { status: 403 });
  }
  if (generation.status !== 'ready') {
    return NextResponse.json({
      error: `generation not ready (status: ${generation.status})`,
    }, { status: 409 });
  }

  // Validate IDs reference real items
  const validOneLiner = generation.oneLinerCandidates.some((o) => o.id === body.chosenOneLinerId);
  if (!validOneLiner) {
    return NextResponse.json({ error: 'chosenOneLinerId not found in generation' }, { status: 400 });
  }
  const hookIds = new Set(generation.hooks.map((h) => h.id));
  for (const id of body.keptHookIds) {
    if (!hookIds.has(id)) {
      return NextResponse.json({ error: `keptHookId not found: ${id}` }, { status: 400 });
    }
  }
  const ugcIds = new Set(generation.ugcScripts.map((u) => u.id));
  for (const id of body.keptUgcScriptIds) {
    if (!ugcIds.has(id)) {
      return NextResponse.json({ error: `keptUgcScriptId not found: ${id}` }, { status: 400 });
    }
  }
  const conceptIds = new Set(generation.imageConcepts.map((c) => c.id));
  for (const id of body.keptImageConceptIds) {
    if (!conceptIds.has(id)) {
      return NextResponse.json({ error: `keptImageConceptId not found: ${id}` }, { status: 400 });
    }
  }

  const record: SelectionRecord = {
    selectionId: newSelectionId(),
    generationId: body.generationId,
    operatorId,
    chosenOneLinerId: body.chosenOneLinerId,
    keptHookIds: body.keptHookIds,
    keptUgcScriptIds: body.keptUgcScriptIds,
    keptImageConceptIds: body.keptImageConceptIds,
    finalizedAt: Date.now(),
    operatorReason: body.operatorReason,
  };

  await createMvpSelectionMemoryStore().append(record);

  return NextResponse.json({
    ok: true,
    selectionId: record.selectionId,
    advisoryNotice:
      'Operator-supervised — selection saved. The creative library is ' +
      'now available. Human remains final authority.',
  });
}
