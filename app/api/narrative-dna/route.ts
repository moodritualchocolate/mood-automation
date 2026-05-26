/**
 * GET /api/narrative-dna
 *
 * Read-only. Returns narrative DNA memory + per-token saturation.
 */
import { NextResponse } from 'next/server';
import { createNarrativeDNAMemoryStore } from '@lib/narrativeDNAMemory';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const mem = await createNarrativeDNAMemoryStore().read().catch(() => null);
  if (!mem) {
    return NextResponse.json({
      present: false, totalObservations: 0, fingerprints: [],
      saturations: {}, advisoryNotice: 'observatory only',
    });
  }
  const fps = mem.fingerprints;
  const dimensions: Array<keyof typeof fps[number]> = [
    'hookFamily', 'persuasionStructure', 'emotionalCadence',
    'tensionCurve', 'payoffTiming', 'silenceUsage', 'narrationStyle',
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
  const avgObs    = fps.length === 0 ? 0 : Math.round(fps.reduce((a, f) => a + (f.observationalDensity ?? 0), 0) / fps.length * 10) / 10;
  const avgReal   = fps.length === 0 ? 0 : Math.round(fps.reduce((a, f) => a + (f.humanRealism         ?? 0), 0) / fps.length * 10) / 10;
  const avgCta    = fps.length === 0 ? 0 : Math.round(fps.reduce((a, f) => a + (f.ctaPressure          ?? 0), 0) / fps.length * 10) / 10;
  return NextResponse.json({
    present: mem.totalObservations > 0,
    totalObservations: mem.totalObservations,
    fingerprints: fps.slice(-32),
    saturations,
    averageObservationalDensity: avgObs,
    averageHumanRealism: avgReal,
    averageCtaPressure: avgCta,
    advisoryNotice: 'Observatory only — narrative DNA never modifies generation.',
  });
}
