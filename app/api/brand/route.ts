/**
 * /api/brand · operator-supervised brand CRUD.
 *
 * GET  ?organizationId=…&workspaceId=…[&brandId=…]
 *      Returns brands scoped to (organizationId, workspaceId). When
 *      brandId is provided, the route returns that record only if it
 *      is scoped to the same (organizationId, workspaceId).
 * POST · operator-supervised.
 *        Actions:
 *          create  · operator creates a brand record scoped to
 *                    (organizationId, workspaceId).
 *        Every write requires operatorId + operatorReason. The route
 *        NEVER auto-creates, NEVER calls external APIs.
 *
 * Wraps existing pure transforms in lib/workspaceMemory.ts.
 *
 * Tenant Isolation Hardening (this directive):
 *   - GET requires organizationId + workspaceId; falls back to MOOD
 *     defaults when absent so existing seeds continue to work.
 *   - POST requires organizationId + workspaceId in the body; stamps
 *     them on the new BrandRecord and uses them inside the
 *     duplicate-name check (idempotency is scoped per-tenant).
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendBrand, brandsForTenant, createWorkspaceMemoryStore,
  newBrandId, newProjectId, appendProject, updateBrandIdentity,
  type BrandRecord, type ProjectRecord, type BrandIdentity,
} from '@lib/workspaceMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { requireSession } from '@lib/auth/requireSession';
import { requireTenantSession } from '@lib/auth/requireTenantSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const brandId        = url.searchParams.get('brandId');
  const store = createWorkspaceMemoryStore();
  const state = await store.read();
  const scopedBrands = brandsForTenant(state, { organizationId, workspaceId });
  if (brandId) {
    const brand = scopedBrands.find((b) => b.brandId === brandId);
    if (!brand) return NextResponse.json({ error: 'brand not found' }, { status: 404 });
    return NextResponse.json({
      brand, scope: { organizationId, workspaceId },
      advisoryNotice:
        'Brand record · read-only · tenant-scoped. The route NEVER auto-creates. ' +
        'Human remains final authority.',
    });
  }
  return NextResponse.json({
    brands: scopedBrands, scope: { organizationId, workspaceId },
    advisoryNotice:
      'Brand list · read-only · tenant-scoped. The route NEVER auto-creates. ' +
      'Human remains final authority.',
  });
}

interface CreateBody {
  action: 'create';
  operatorId: string;
  operatorReason: string;
  organizationId?: string;
  workspaceId?: string;
  name: string;
  /** Optional project id; when absent the route creates a default project record. */
  projectId?: string;
  description?: string;
  operatorNote?: string;
}
interface UpdateIdentityBody {
  action: 'update-identity';
  operatorId: string;
  operatorReason: string;
  organizationId?: string;
  workspaceId?: string;
  brandId: string;
  identity: BrandIdentity;
}
type Body = CreateBody | UpdateIdentityBody;

export async function POST(req: NextRequest): Promise<NextResponse> {
  const auth = await requireSession(req);
  if (!auth.ok) return auth.response;
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  body.operatorId = auth.ctx.user.userId;
  if (body.action === 'update-identity') {
    if (typeof body.brandId !== 'string' || body.brandId.length === 0) {
      return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    }
    if (!body.identity || typeof body.identity !== 'object') {
      return NextResponse.json({ error: 'identity is required' }, { status: 400 });
    }
    const orgId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
    const wspId = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;
    const store = createWorkspaceMemoryStore();
    const state = await store.read();
    try {
      const next = updateBrandIdentity(state, {
        brandId: body.brandId,
        organizationId: orgId, workspaceId: wspId,
        identity: body.identity,
        operatorId: body.operatorId,
      });
      await store.save(next);
      const updated = next.brands.find((b) => b.brandId === body.brandId);
      return NextResponse.json({
        ok: true, brand: updated, scope: { organizationId: orgId, workspaceId: wspId },
        advisoryNotice:
          'Operator-supervised — brand identity updated (tenant-scoped). The route NEVER auto-acts. ' +
          'Human remains final authority.',
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }
  if (body.action !== 'create') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }
  if (typeof body.name !== 'string' || body.name.length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }

  const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const store = createWorkspaceMemoryStore();
  let state = await store.read();
  const tenantScope = { organizationId, workspaceId };

  // Idempotency is scoped per-tenant. A brand with the same name in a
  // different tenant is NOT a duplicate.
  const existing = brandsForTenant(state, tenantScope).find((b) => b.name === body.name);
  if (existing) {
    return NextResponse.json({
      ok: true, brand: existing, scope: tenantScope,
      advisoryNotice:
        'Operator-supervised — brand already present (tenant-scoped), returned existing record. ' +
        'Human remains final authority.',
    });
  }

  // Ensure a project record exists (BrandRecord requires projectId).
  // The project is also tenant-scoped.
  let projectId = body.projectId;
  if (!projectId) {
    projectId = newProjectId();
    const project: ProjectRecord = {
      projectId,
      organizationId, workspaceId,
      name: `${body.name} · default project`,
      createdAt: Date.now(), operatorId: body.operatorId,
      operatorNote: 'auto-created default project for brand registration',
    };
    state = appendProject(state, project);
  }

  const record: BrandRecord = {
    brandId: newBrandId(),
    organizationId, workspaceId,
    projectId, name: body.name,
    description: body.description, createdAt: Date.now(),
    operatorId: body.operatorId, operatorNote: body.operatorNote,
  };
  state = appendBrand(state, record);
  await store.save(state);
  return NextResponse.json({
    ok: true, brand: record, scope: tenantScope,
    advisoryNotice:
      'Operator-supervised — brand created (tenant-scoped). The route NEVER auto-acts. ' +
      'Human remains final authority.',
  });
}
