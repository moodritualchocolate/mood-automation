/**
 * /api/product · operator-supervised product CRUD.
 *
 * GET  ?organizationId=…&workspaceId=…[&brandId=…][&productId=…]
 *      Returns products scoped to (organizationId, workspaceId).
 *      When productId is provided, returns the record only if it is
 *      scoped to the requested tenant.
 * POST · operator-supervised.
 *        Actions:
 *          create · operator creates a product scoped to a brand that
 *                   belongs to the same (organizationId, workspaceId).
 *        Every write requires operatorId + operatorReason.
 *
 * Wraps existing pure transforms in lib/workspaceMemory.ts.
 *
 * Tenant Isolation Hardening (this directive):
 *   - GET requires organizationId + workspaceId; falls back to MOOD
 *     defaults when absent so existing seeds continue to work.
 *   - POST stamps organizationId + workspaceId on the new
 *     ProductRecord and refuses to attach a product to a brand that
 *     does not live in the same tenant.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  appendProduct, brandsForTenant, createWorkspaceMemoryStore,
  newProductId, productsForTenant,
  type ProductRecord,
} from '@lib/workspaceMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import type { Formula } from '@/core/types';
import { FORMULAS } from '@/core/types';
import { requireTenantSession } from '@lib/auth/requireTenantSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const productId      = url.searchParams.get('productId');
  const brandId        = url.searchParams.get('brandId');
  const store = createWorkspaceMemoryStore();
  const state = await store.read();
  const scopedProducts = productsForTenant(state, { organizationId, workspaceId });
  if (productId) {
    const product = scopedProducts.find((p) => p.productId === productId);
    if (!product) return NextResponse.json({ error: 'product not found' }, { status: 404 });
    return NextResponse.json({
      product, scope: { organizationId, workspaceId },
      advisoryNotice:
        'Product record · read-only · tenant-scoped. The route NEVER auto-creates. ' +
        'Human remains final authority.',
    });
  }
  const products = brandId
    ? scopedProducts.filter((p) => p.brandId === brandId)
    : scopedProducts;
  return NextResponse.json({
    products, scope: { organizationId, workspaceId },
    advisoryNotice:
      'Product list · read-only · tenant-scoped. The route NEVER auto-creates. ' +
      'Human remains final authority.',
  });
}

interface CreateBody {
  action: 'create';
  operatorId: string;
  operatorReason: string;
  organizationId?: string;
  workspaceId?: string;
  brandId: string;
  name: string;
  formula?: Formula;
  description?: string;
  operatorNote?: string;
}
type Body = CreateBody;

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
  if (body.action !== 'create') {
    return NextResponse.json({ error: 'unknown action' }, { status: 400 });
  }
  if (typeof body.brandId !== 'string' || body.brandId.length === 0) {
    return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
  }
  if (typeof body.name !== 'string' || body.name.length === 0) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 });
  }
  if (body.formula && !FORMULAS.includes(body.formula)) {
    return NextResponse.json({ error: 'unknown formula' }, { status: 400 });
  }

  const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantScope = { organizationId, workspaceId };

  const store = createWorkspaceMemoryStore();
  let state = await store.read();

  // Brand must exist AND be in the same tenant. The route refuses to
  // attach a product to a brand owned by another tenant — this is the
  // tenant-boundary check.
  const tenantBrands = brandsForTenant(state, tenantScope);
  const brand = tenantBrands.find((b) => b.brandId === body.brandId);
  if (!brand) {
    return NextResponse.json({
      error: 'brand not found in this tenant',
    }, { status: 404 });
  }

  // Idempotency is scoped per-tenant + per-brand.
  const tenantProducts = productsForTenant(state, tenantScope);
  const existing = tenantProducts.find(
    (p) => p.brandId === body.brandId && p.name === body.name);
  if (existing) {
    return NextResponse.json({
      ok: true, product: existing, scope: tenantScope,
      advisoryNotice:
        'Operator-supervised — product already present (tenant-scoped), returned existing record. ' +
        'Human remains final authority.',
    });
  }

  const at = Date.now();
  const record: ProductRecord = {
    productId: newProductId(),
    organizationId, workspaceId,
    brandId: body.brandId, name: body.name,
    formula: body.formula, description: body.description,
    createdAt: at, operatorId: body.operatorId, operatorNote: body.operatorNote,
  };
  state = appendProduct(state, record);
  await store.save(state);
  return NextResponse.json({
    ok: true, product: record, scope: tenantScope,
    advisoryNotice:
      'Operator-supervised — product created (tenant-scoped). The route NEVER auto-acts. ' +
      'Human remains final authority.',
  });
}
