/**
 * POST /api/ingest
 *
 * Accept one or more external observations for the reality-ingestion
 * layer. The body matches the IngestedSignal shape:
 *
 *   { signals: Array<{
 *       source: string,
 *       text: string,
 *       observed_at?: number,
 *       emotional_weight?: number,
 *       topical_tags?: string[],
 *     }> }
 *
 * Anti-trend signals (meme cycles, viral formats) are filtered at
 * the store level. The endpoint returns the count of signals
 * actually ingested vs filtered.
 */

import { NextRequest } from 'next/server';
import { createRealityIngestionStore } from '@lib/realityIngestion';
import type { IngestionSource } from '@lib/realityIngestion';
import { SEED_INGESTED_SIGNALS } from '@data/seed-ingested-signals';

export const runtime = 'nodejs';

interface IngestBody {
  signals: Array<{
    source: IngestionSource;
    text: string;
    observed_at?: number;
    emotional_weight?: number;
    topical_tags?: string[];
  }>;
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as IngestBody | null;
  if (!body || !Array.isArray(body.signals) || body.signals.length === 0) {
    return Response.json({ error: 'expected { signals: [...] }' }, { status: 400 });
  }

  const store = createRealityIngestionStore(undefined, SEED_INGESTED_SIGNALS);
  let ingested = 0;
  let filtered = 0;
  for (const s of body.signals) {
    if (!s.source || !s.text) { filtered += 1; continue; }
    const result = await store.add({
      source: s.source,
      text: s.text,
      observed_at: s.observed_at ?? Date.now(),
      emotional_weight: s.emotional_weight ?? 5,
      topical_tags: s.topical_tags ?? [],
    });
    if (result) ingested += 1;
    else filtered += 1;
  }
  const total = (await store.read()).length;
  return Response.json({ ingested, filtered, total_in_store: total });
}

export async function GET() {
  const store = createRealityIngestionStore(undefined, SEED_INGESTED_SIGNALS);
  const signals = await store.read();
  return Response.json({
    total: signals.length,
    recent: signals.slice(0, 20),
  });
}
