/**
 * POST /api/banner/:id/simulate-signals
 *
 * Generates synthetic viewer signals for testing the reality loop
 * without real audience traffic. Body: { audience?: number } — default 200.
 *
 * The synthetic viewer is grounded in the system's own predicted
 * reaction curve (with noise) so the loop can run end-to-end and
 * the meta-critic, drift detector, and aftertaste predictor can be
 * exercised with realistic-looking data.
 */

import { NextRequest } from 'next/server';
import {
  createEngagementStore,
  createAftertasteStore,
  predictAftertaste,
  syntheticSignalsFor,
} from '@lib/index';
import { recallBanner } from '@/core/banner-cache';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const banner = recallBanner(params.id);
  if (!banner) {
    return Response.json({ error: 'banner not in cache — generate it first' }, { status: 404 });
  }
  const body = (await req.json().catch(() => ({}))) as { audience?: number; seed?: number };
  const audience = body.audience ?? 200;
  const seed = body.seed ?? Date.now();

  const signals = syntheticSignalsFor({
    bannerId: params.id,
    predictedReactionAt3s: banner.tasteSystem.reaction.at_3s,
    engagementQuality: banner.tasteSystem.reaction.engagementQuality,
    audienceSize: audience,
    seed,
  });

  const store = createEngagementStore();
  for (const s of signals) {
    await store.record(params.id, s);
  }

  const updated = await store.get(params.id);
  const refreshed = predictAftertaste({
    bannerId: params.id,
    shippedAt: banner.createdAt,
    engagement: updated,
    bannerDNA: banner.tasteSystem.dna,
    predictedReactionAt3s: banner.tasteSystem.reaction.at_3s,
    tensionPhrase: banner.truth.tension,
    truthLength: banner.truth.truth.length,
  });
  await createAftertasteStore().upsert(refreshed);

  return Response.json({
    signalsIngested: signals.length,
    engagement: updated?.totals,
    aftertaste: refreshed,
  });
}
