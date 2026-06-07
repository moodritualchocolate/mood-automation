/**
 * GET /api/mvp/library?selectionId=…
 *
 * Returns the operator's selected one-liner + kept hooks + kept UGC
 * scripts + kept image concepts. Tenant-scoped via the underlying
 * GenerationRecord. If no selectionId is supplied, returns the
 * operator's latest selection.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createMvpGenerationMemoryStore } from '@lib/mvpGenerationMemory';
import { createMvpSelectionMemoryStore } from '@lib/mvpSelectionMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const selectionIdParam = url.searchParams.get('selectionId');
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const operatorId = tenantAuth.ctx.user.userId;

  const selectionStore = createMvpSelectionMemoryStore();
  const selection = selectionIdParam
    ? await selectionStore.findById(selectionIdParam)
    : await selectionStore.findLatestForOperator(operatorId);

  if (!selection) {
    return NextResponse.json({
      empty: true,
      advisoryNotice: 'No selection found for this operator yet.',
    });
  }

  // The selection's operator must match the requesting operator.
  if (selection.operatorId !== operatorId) {
    return NextResponse.json({ error: 'selection not owned by this operator' }, { status: 403 });
  }

  const generation = await createMvpGenerationMemoryStore().findById(selection.generationId);
  if (!generation) {
    return NextResponse.json({ error: 'underlying generation not found' }, { status: 404 });
  }
  if (generation.organizationId !== organizationId || generation.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'generation not in this tenant' }, { status: 403 });
  }

  // Filter the generation to only the kept items.
  const keptHookSet = new Set(selection.keptHookIds);
  const keptUgcSet = new Set(selection.keptUgcScriptIds);
  const keptConceptSet = new Set(selection.keptImageConceptIds);

  const chosenOneLiner = generation.oneLinerCandidates.find((o) => o.id === selection.chosenOneLinerId) ?? null;
  const keptHooks = generation.hooks.filter((h) => keptHookSet.has(h.id));
  const keptUgc = generation.ugcScripts.filter((u) => keptUgcSet.has(u.id));
  const keptConcepts = generation.imageConcepts.filter((c) => keptConceptSet.has(c.id));

  return NextResponse.json({
    selection,
    library: {
      chosenOneLiner,
      hooks: keptHooks,
      ugcScripts: keptUgc,
      imageConcepts: keptConcepts,
    },
    generatedAt: generation.completedAt ?? generation.createdAt,
    advisoryNotice:
      'Creative library · operator-supervised · 90-day access. Human remains final authority.',
  });
}
