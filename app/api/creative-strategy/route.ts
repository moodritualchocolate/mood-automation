/**
 * /api/creative-strategy
 *
 * POST · operator-supervised. Generates a full creative strategy for
 * one MOOD product (BOOST · CHILLAX · BUNDLE). The route NEVER
 * publishes. NEVER auto-saves to the asset library. Operator
 * decides which artifacts ship.
 *
 *   Body: {
 *     productCode: 'BOOST' | 'CHILLAX' | 'BUNDLE',
 *     brandId?:    string,        // optional · pulls identity defaults
 *     organizationId, workspaceId,
 *     operatorReason,
 *     save?: boolean,             // optional · save to memory store
 *   }
 *
 * GET · returns the FIFO list of saved strategies for the
 *      requesting tenant.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import {
  computeCreativeStrategy, PRODUCT_CODES, type ProductCode,
} from '@lib/creativeStrategyEngine';
import {
  createCreativeStrategyMemoryStore, newStrategyId,
  type StoredStrategyRecord,
} from '@lib/creativeStrategyMemory';
import { createWorkspaceMemoryStore, brandsForTenant } from '@lib/workspaceMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_CODES: ReadonlySet<ProductCode> = new Set(PRODUCT_CODES);

// ─── GET — list saved strategies ──────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const mem = await createCreativeStrategyMemoryStore().read().catch(() => null);
  const all = mem?.strategies ?? [];
  // Tenant-scope filter at the route layer.
  const scoped = all.filter((s) => s.organizationId === organizationId && s.workspaceId === workspaceId);
  return NextResponse.json({
    totalGenerated: mem?.totalGenerated ?? 0,
    strategies: scoped.slice(-32),
    advisoryNotice:
      'Creative strategy registry · read-only · tenant-scoped. ' +
      'Operator approval required before any artifact ships. Human remains final authority.',
  });
}

// ─── POST — generate (and optionally save) ────────────────────

interface Body {
  productCode: ProductCode;
  brandId?: string;
  organizationId?: string;
  workspaceId?: string;
  operatorReason: string;
  save?: boolean;
  brandOverride?: {
    brandName?: string;
    brandVoice?: string;
    brandAudience?: string;
    brandSignature?: string;
    market?: 'israel' | 'global';
  };
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (!VALID_CODES.has(body.productCode)) {
    return NextResponse.json({
      error: `productCode must be one of: ${[...VALID_CODES].join(', ')}`,
    }, { status: 400 });
  }

  const organizationId = body.organizationId ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = body.workspaceId    ?? PLATFORM_WORKSPACE_ID_MOOD;

  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;
  const operatorId = tenantAuth.ctx.user.userId;

  // Pull brand identity defaults if a brandId is provided + scoped.
  let brandOverride = body.brandOverride ?? {};
  if (body.brandId) {
    try {
      const wsp = await createWorkspaceMemoryStore().read();
      const scopedBrands = brandsForTenant(wsp, { organizationId, workspaceId });
      const brand = scopedBrands.find((b) => b.brandId === body.brandId);
      if (brand) {
        brandOverride = {
          brandName:      brandOverride.brandName ?? brand.name,
          brandVoice:     brandOverride.brandVoice ?? brand.identity?.voice,
          brandAudience:  brandOverride.brandAudience ?? brand.identity?.audience,
          brandSignature: brandOverride.brandSignature ?? brand.identity?.signature,
          market:         brandOverride.market ?? 'israel',
        };
      }
    } catch {/* non-fatal · falls back to defaults */}
  }

  const strategy = computeCreativeStrategy({
    productCode: body.productCode,
    brand: brandOverride,
  });

  let storedStrategyId: string | null = null;
  if (body.save) {
    const record: StoredStrategyRecord = {
      strategyId: newStrategyId(),
      productCode: body.productCode,
      brandId: body.brandId,
      organizationId, workspaceId,
      operatorId, operatorReason: body.operatorReason,
      strategy,
      createdAt: Date.now(),
      approvalStatus: 'pending',
    };
    try {
      await createCreativeStrategyMemoryStore().append(record);
      storedStrategyId = record.strategyId;
    } catch (e) {
      return NextResponse.json({
        ok: false,
        error: `Strategy generated but failed to save: ${(e as Error).message}`,
        strategy,
      }, { status: 500 });
    }
  }

  return NextResponse.json({
    ok: true,
    strategy,
    storedStrategyId,
    advisoryNotice:
      'Creative strategy generated. No publishing. No auto-approval. ' +
      'Each artifact (audience · pain · hook · concept · script · prompt · ' +
      'carousel · founder story · testimonial) is operator-facing exploration. ' +
      'Human remains final authority.',
  });
}
