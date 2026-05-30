/**
 * GET /api/performance-analyzer
 *
 * Pure analyzer over performance memory + publication registry +
 * asset registry. Read-only.
 *
 * STRICT CONTRACT:
 *   - GET only
 *   - the route never names a winner, never recommends
 *   - the route never auto-applies
 */

import { NextResponse } from 'next/server';
import { analyzePerformance } from '@lib/performanceAnalyzer';
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
  const reading = analyzePerformance({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  return NextResponse.json(reading);
}
