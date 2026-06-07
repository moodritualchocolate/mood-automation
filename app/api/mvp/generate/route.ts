/**
 * POST /api/mvp/generate — trigger generation
 * GET  /api/mvp/generate?generationId=… — poll status
 *
 * Operator-supervised. Tenant-scoped.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createMvpBrandInputMemoryStore } from '@lib/mvpBrandInputMemory';
import { createMvpGenerationMemoryStore } from '@lib/mvpGenerationMemory';
import { runMvpGeneration } from '@lib/mvpGenerationEngine';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const generationId = url.searchParams.get('generationId');
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  if (!generationId) {
    return NextResponse.json({ error: 'generationId is required' }, { status: 400 });
  }

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const record = await createMvpGenerationMemoryStore().findById(generationId);
  if (!record) {
    return NextResponse.json({ error: 'generation not found' }, { status: 404 });
  }
  // Tenant ownership check
  if (record.organizationId !== organizationId || record.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'generation not in this tenant' }, { status: 403 });
  }
  return NextResponse.json({ generation: record });
}

// ─── POST ────────────────────────────────────────────────────

interface PostBody {
  brandInputId: string;
  organizationId?: string;
  workspaceId?: string;
  operatorReason: string;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: PostBody;
  try { body = await req.json() as PostBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.brandInputId !== 'string' || body.brandInputId.length === 0) {
    return NextResponse.json({ error: 'brandInputId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const operatorId = tenantAuth.ctx.user.userId;

  // Confirm the brand input belongs to this tenant + operator
  const brandInput = await createMvpBrandInputMemoryStore().findById(body.brandInputId);
  if (!brandInput) {
    return NextResponse.json({ error: 'brand input not found' }, { status: 404 });
  }
  if (brandInput.organizationId !== organizationId || brandInput.workspaceId !== workspaceId) {
    return NextResponse.json({ error: 'brand input not in this tenant' }, { status: 403 });
  }
  if (brandInput.operatorId !== operatorId) {
    return NextResponse.json({ error: 'brand input not owned by this operator' }, { status: 403 });
  }

  const result = await runMvpGeneration({
    brandInputId: brandInput.brandInputId,
    operatorId,
    organizationId,
    workspaceId,
  });

  if (result.status === 'failed') {
    return NextResponse.json({
      ok: false,
      generationId: result.generationId,
      status: result.status,
      error: result.error,
    }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    generationId: result.generationId,
    status: result.status,
    advisoryNotice:
      'Generation triggered. Poll /api/mvp/generate?generationId=… for status. ' +
      'No publishing. Human remains final authority.',
  });
}
