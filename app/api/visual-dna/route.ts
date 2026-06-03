/**
 * GET /api/visual-dna
 *
 * Read-only. Returns visual DNA memory + per-token saturation.
 */
import { NextResponse, type NextRequest } from 'next/server';
import { requireTenantSession } from '@lib/auth/requireTenantSession';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '@lib/tenancy/types';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const organizationId = url.searchParams.get('organizationId') ?? PLATFORM_TENANT_ID_MOOD;
  const workspaceId    = url.searchParams.get('workspaceId')    ?? PLATFORM_WORKSPACE_ID_MOOD;
  const tenantAuth = await requireTenantSession(req, organizationId, workspaceId);
  if (!tenantAuth.ok) return tenantAuth.response;

  const mem = await createVisualDNAMemoryStore().read().catch(() => null);
  if (!mem) {
    return NextResponse.json({
      present: false, totalObservations: 0, fingerprints: [],
      saturations: {}, advisoryNotice: 'observatory only',
    });
  }
  const fps = mem.fingerprints;
  // Per-dimension saturation: dominant token share for each.
  const dimensions: Array<keyof typeof fps[number]> = [
    'framingFingerprint', 'lightingSignature', 'lensBehavior',
    'compositionGeometry', 'pacingIdentity', 'typographyRhythm',
    'silenceDensity', 'motionCadence', 'emotionalColorTemperature',
  ];
  const saturations: Record<string, { dominantToken: string | null; share: number; distinct: number }> = {};
  for (const dim of dimensions) {
    const tokens = fps.map((f) => f[dim]).filter((v): v is string => typeof v === 'string');
    const counts = new Map<string, number>();
    for (const t of tokens) counts.set(t, (counts.get(t) ?? 0) + 1);
    let best: [string, number] | null = null;
    for (const [k, v] of counts) {
      if (!best || v > best[1] || (v === best[1] && k.localeCompare(best[0]) < 0)) best = [k, v];
    }
    saturations[String(dim)] = {
      dominantToken: best?.[0] ?? null,
      share: tokens.length === 0 ? 0 : Math.round((best?.[1] ?? 0) / tokens.length * 100) / 100,
      distinct: counts.size,
    };
  }
  const avgRealism = fps.length === 0 ? 0 : Math.round(fps.reduce((a, f) => a + (f.realismLevel ?? 0), 0) / fps.length * 10) / 10;
  const avgPolish  = fps.length === 0 ? 0 : Math.round(fps.reduce((a, f) => a + (f.polishLevel  ?? 0), 0) / fps.length * 10) / 10;
  return NextResponse.json({
    present: mem.totalObservations > 0,
    totalObservations: mem.totalObservations,
    fingerprints: fps.slice(-32),  // recent slice for the panel
    saturations,
    averageRealism: avgRealism,
    averagePolish: avgPolish,
    advisoryNotice: 'Observatory only — visual DNA never modifies generation.',
  });
}
