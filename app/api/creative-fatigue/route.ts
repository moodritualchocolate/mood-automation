/**
 * GET /api/creative-fatigue
 *
 * Read-only. Composes the creative-fatigue reading from visual + narrative
 * DNA memories + creative-drift snapshot (optional).
 */
import { NextResponse } from 'next/server';
import { computeCreativeFatigue } from '@lib/creativeFatigueEngine';
import { createVisualDNAMemoryStore } from '@lib/visualDNAMemory';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';
import { createCreativeDriftMemoryStore } from '@lib/creativeDriftMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const [vmem, nmem, dmem] = await Promise.all([
    createVisualDNAMemoryStore().read().catch(() => null),
    createNarrativeDNAMemoryStore().read().catch(() => null),
    createCreativeDriftMemoryStore().read().catch(() => null),
  ]);
  const lastDrift = dmem?.observations[dmem.observations.length - 1];
  const fatigue = computeCreativeFatigue({
    visualDNA:    vmem ? { fingerprints: vmem.fingerprints } : null,
    narrativeDNA: nmem ? { fingerprints: nmem.fingerprints } : null,
    driftEntropy:             lastDrift?.entropyLevel,
    driftOriginalityPressure: lastDrift?.originalityPressure,
  });
  return NextResponse.json(fatigue);
}
