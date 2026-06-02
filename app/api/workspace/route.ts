/**
 * /api/workspace · operator-supervised.
 *
 * GET   — returns the workspace tree (projects → brands → products
 *         → campaigns) joined with assets / publications / journey
 *         events.
 * POST  — operator-supervised. Actions: create-project | create-brand
 *         | create-product | create-campaign | update-campaign-status.
 *         Every write requires operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route NEVER publishes
 *   - the route NEVER fetches from external APIs
 *   - the route NEVER auto-creates entities
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import {
  brandsForTenant, campaignsForTenant, createWorkspaceMemoryStore,
  newProjectId, newBrandId, newProductId, newCampaignId,
  appendProject, appendBrand, appendProduct, appendCampaign,
  productsForTenant, projectsForTenant, updateCampaignStatus,
  type ProjectRecord, type BrandRecord, type ProductRecord, type CampaignRecord,
} from '@lib/workspaceMemory';
import { composeWorkspace } from '@lib/workspaceEngine';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createCustomerJourneyMemoryStore } from '@lib/customerJourneyMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import type { Formula } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_FORMULAS: ReadonlySet<Formula> = new Set(['ENERGY', 'FOCUS', 'RELAX', 'SLEEP']);
const VALID_CAMPAIGN_STATUSES: ReadonlySet<CampaignRecord['status']> =
  new Set(['planning', 'in-flight', 'completed', 'archived']);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantScope = { organizationId, workspaceId };
  const [wsMem, assetMem, pubMem, journeyMem] = await Promise.all([
    createWorkspaceMemoryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createCustomerJourneyMemoryStore().read().catch(() => null),
  ]);
  const tenantProjects  = wsMem ? projectsForTenant(wsMem, tenantScope)  : [];
  const tenantBrands    = wsMem ? brandsForTenant(wsMem, tenantScope)    : [];
  const tenantProducts  = wsMem ? productsForTenant(wsMem, tenantScope)  : [];
  const tenantCampaigns = wsMem ? campaignsForTenant(wsMem, tenantScope) : [];
  const reading = composeWorkspace({
    projects:  tenantProjects,
    brands:    tenantBrands,
    products:  tenantProducts,
    campaigns: tenantCampaigns,
    assets: assetMem?.assets ?? [],
    publications: pubMem?.publications ?? [],
    events: journeyMem?.events ?? [],
  });
  return NextResponse.json({
    reading,
    raw: {
      projects:  tenantProjects,
      brands:    tenantBrands,
      products:  tenantProducts,
      campaigns: tenantCampaigns,
    },
    scope: tenantScope,
    advisoryNotice:
      'Workspace · operator-supervised · tenant-scoped. The route never publishes, ' +
      'never fetches from external APIs, never auto-creates entities. ' +
      'Human remains final authority.',
  });
}

// ─── POST ────────────────────────────────────────────────────

interface TenantScopedBody {
  /** Tenancy stamp. Required for new records. Defaults to MOOD when
   *  the operator does not provide them so legacy callers continue
   *  to work; the stamp is recorded on the new entity. */
  organizationId?: string;
  workspaceId?: string;
}
interface CreateProjectBody extends TenantScopedBody {
  action: 'create-project';
  operatorId: string;
  operatorReason: string;
  name: string;
  description?: string;
  operatorNote?: string;
}
interface CreateBrandBody extends TenantScopedBody {
  action: 'create-brand';
  operatorId: string;
  operatorReason: string;
  projectId: string;
  name: string;
  description?: string;
  operatorNote?: string;
}
interface CreateProductBody extends TenantScopedBody {
  action: 'create-product';
  operatorId: string;
  operatorReason: string;
  brandId: string;
  name: string;
  formula?: Formula;
  description?: string;
  operatorNote?: string;
}
interface CreateCampaignBody extends TenantScopedBody {
  action: 'create-campaign';
  operatorId: string;
  operatorReason: string;
  productId: string;
  name: string;
  campaignPlanId?: string;
  operatorNote?: string;
}
interface UpdateCampaignStatusBody {
  action: 'update-campaign-status';
  operatorId: string;
  operatorReason: string;
  campaignId: string;
  status: CampaignRecord['status'];
}
type Body = CreateProjectBody | CreateBrandBody | CreateProductBody | CreateCampaignBody | UpdateCampaignStatusBody;

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

  const store = createWorkspaceMemoryStore();
  const state = await store.read();

  if (body.action === 'create-project') {
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
    const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;
    const record: ProjectRecord = {
      projectId: newProjectId(),
      organizationId, workspaceId,
      name: body.name, description: body.description,
      createdAt: Date.now(), operatorId: body.operatorId, operatorNote: body.operatorNote,
    };
    await store.save(appendProject(state, record));
    return NextResponse.json({ ok: true, project: record, scope: { organizationId, workspaceId } });
  }
  if (body.action === 'create-brand') {
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!body.projectId) return NextResponse.json({ error: 'projectId is required' }, { status: 400 });
    const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
    const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;
    // Project must exist AND be in the same tenant (cross-tenant attach rejected).
    const project = projectsForTenant(state, { organizationId, workspaceId })
      .find((p) => p.projectId === body.projectId);
    if (!project) {
      return NextResponse.json({ error: 'project not found in this tenant' }, { status: 404 });
    }
    const record: BrandRecord = {
      brandId: newBrandId(),
      organizationId, workspaceId,
      projectId: body.projectId, name: body.name,
      description: body.description, createdAt: Date.now(),
      operatorId: body.operatorId, operatorNote: body.operatorNote,
    };
    await store.save(appendBrand(state, record));
    return NextResponse.json({ ok: true, brand: record, scope: { organizationId, workspaceId } });
  }
  if (body.action === 'create-product') {
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!body.brandId) return NextResponse.json({ error: 'brandId is required' }, { status: 400 });
    if (body.formula && !VALID_FORMULAS.has(body.formula)) {
      return NextResponse.json({ error: 'invalid formula' }, { status: 400 });
    }
    const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
    const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;
    // Brand must exist AND be in the same tenant.
    const brand = brandsForTenant(state, { organizationId, workspaceId })
      .find((b) => b.brandId === body.brandId);
    if (!brand) {
      return NextResponse.json({ error: 'brand not found in this tenant' }, { status: 404 });
    }
    const record: ProductRecord = {
      productId: newProductId(),
      organizationId, workspaceId,
      brandId: body.brandId, name: body.name,
      formula: body.formula, description: body.description,
      createdAt: Date.now(), operatorId: body.operatorId, operatorNote: body.operatorNote,
    };
    await store.save(appendProduct(state, record));
    return NextResponse.json({ ok: true, product: record, scope: { organizationId, workspaceId } });
  }
  if (body.action === 'create-campaign') {
    if (!body.name) return NextResponse.json({ error: 'name is required' }, { status: 400 });
    if (!body.productId) return NextResponse.json({ error: 'productId is required' }, { status: 400 });
    const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
    const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;
    // Product must exist AND be in the same tenant.
    const product = productsForTenant(state, { organizationId, workspaceId })
      .find((p) => p.productId === body.productId);
    if (!product) {
      return NextResponse.json({ error: 'product not found in this tenant' }, { status: 404 });
    }
    const record: CampaignRecord = {
      campaignId: newCampaignId(),
      organizationId, workspaceId,
      productId: body.productId, name: body.name,
      campaignPlanId: body.campaignPlanId, status: 'planning',
      createdAt: Date.now(), operatorId: body.operatorId, operatorNote: body.operatorNote,
    };
    await store.save(appendCampaign(state, record));
    return NextResponse.json({ ok: true, campaign: record, scope: { organizationId, workspaceId } });
  }
  if (body.action === 'update-campaign-status') {
    if (!body.campaignId) return NextResponse.json({ error: 'campaignId is required' }, { status: 400 });
    if (!VALID_CAMPAIGN_STATUSES.has(body.status)) {
      return NextResponse.json({ error: 'invalid status' }, { status: 400 });
    }
    try {
      const next = updateCampaignStatus(state, body.campaignId, body.status);
      await store.save(next);
      const updated = next.campaigns.find((c) => c.campaignId === body.campaignId);
      return NextResponse.json({ ok: true, campaign: updated });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }
  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
