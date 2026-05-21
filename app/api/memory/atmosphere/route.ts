/**
 * GET /api/memory/atmosphere
 *
 * Returns the current brand atmosphere consistency reading + the
 * aftertaste summary across all shipped banners. This is the "new
 * success metric" surface — not CTR, not approvals.
 */

import { createAftertasteStore, createHumanMemoryStore, analyzeAtmosphere, summariseResidue } from '@lib/index';
import type { BannerFootprint } from '@lib/atmosphereConsistency';
import type { ReferenceDNA } from '@lib/referenceDNA';

export const runtime = 'nodejs';

const NEUTRAL_DNA: ReferenceDNA = {
  silence_ratio: 0.5, tension_map: 0.5, framing_behavior: 0.5,
  typography_confidence: 0.5, negative_space_usage: 0.5,
  emotional_density: 0.5, product_aggression_level: 0.5,
  interruption_style: 0.5, realism_type: 0.5, visual_temperature: 0.5,
  camera_energy: 0.5, editorial_level: 0.5, fashion_influence: 0.5,
  documentary_weight: 0.5, luxury_restraint: 0.5, anti_commercial_feel: 0.5,
};

export async function GET() {
  const trail = await createHumanMemoryStore().read();
  const aftertasteRecords = await createAftertasteStore().read();

  const footprints: BannerFootprint[] = trail.map((e) => ({
    bannerId: e.bannerId,
    dna: NEUTRAL_DNA,
    job: e.job ?? 'sell',
    family: e.family,
    truth: e.truth,
    tension: e.tension,
  }));
  const atmosphere = analyzeAtmosphere(footprints);
  const residue = summariseResidue(aftertasteRecords);

  return Response.json({ atmosphere, residue, bannerCount: trail.length });
}
