/**
 * POST /api/banner/:id/signal
 *
 * Ingest a single signal for a shipped banner. The body matches the
 * RawSignal shape from lib/engagementMemory. After ingestion we
 * re-compute the banner's aftertaste prediction so the store stays
 * current — the next pipeline run sees the updated reality.
 */

import { NextRequest } from 'next/server';
import { requireSession } from '@lib/auth/requireSession';
import { createEngagementStore, createAftertasteStore, predictAftertaste } from '@lib/index';
import type { RawSignal } from '@lib/engagementMemory';
import { recallBanner } from '@/core/banner-cache';

export const runtime = 'nodejs';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const _authGate = await requireSession(req);
  if (!_authGate.ok) return _authGate.response;
  const body = (await req.json()) as Partial<RawSignal>;
  if (!body.kind) {
    return Response.json({ error: 'missing kind' }, { status: 400 });
  }
  const signal: RawSignal = {
    kind: body.kind,
    value: body.value,
    text: body.text,
    viewerHash: body.viewerHash,
    ts: body.ts ?? Date.now(),
  };
  const store = createEngagementStore();
  const aftertaste = createAftertasteStore();
  const updated = await store.record(params.id, signal);

  // Re-predict aftertaste with the new signal mix if we still have the
  // banner in cache. (Production: pull DNA from a persistent store.)
  const banner = recallBanner(params.id);
  if (banner) {
    const refreshed = predictAftertaste({
      bannerId: params.id,
      shippedAt: banner.createdAt,
      engagement: updated,
      bannerDNA: banner.tasteSystem.dna,
      predictedReactionAt3s: banner.tasteSystem.reaction.at_3s,
      tensionPhrase: banner.truth.tension,
      truthLength: banner.truth.truth.length,
    });
    await aftertaste.upsert(refreshed);
    return Response.json({ engagement: updated.totals, aftertaste: refreshed });
  }

  return Response.json({ engagement: updated.totals, aftertaste: null });
}
