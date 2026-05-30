/**
 * GET /api/creative-dna-map
 *
 * Pure DNA aggregator over performance + publication + asset data.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never names a winner
 *   - the route never recommends
 *   - the route never auto-applies
 */

import { NextResponse } from 'next/server';
import { buildCreativeDNAMap } from '@lib/creativeDNAMap';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [perfMem, pubMem, assetMem] = await Promise.all([
    createPerformanceMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
  ]);
  const reading = buildCreativeDNAMap({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  return NextResponse.json(reading);
}
