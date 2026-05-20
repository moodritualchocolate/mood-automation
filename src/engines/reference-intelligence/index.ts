/**
 * REFERENCE INTELLIGENCE ENGINE (Phase 2)
 *
 * The system never copies references. It understands them.
 *
 * Given the current banner's direction + composition + typography, this
 * engine encodes the banner into the same shape as a reference, then
 * finds the closest taste anchor in the bank and reports which axes
 * of the banner have drifted from that anchor.
 *
 * The closeness score (1 - distance) is consumed by the meta-critic.
 * The named divergences are surfaced as rejection reasons when the
 * banner is judged "too far from any reference of feeling."
 */

import type {
  CompositionPlan,
  CreativeDirection,
  EngineContext,
  HumanTruth,
  Reference,
  ReferenceMatch,
  TypographyPlan,
} from '@/core/types';
import { REFERENCE_BANK } from '@data/reference-bank';

export interface MatchInput {
  ctx: EngineContext;
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
}

export function matchReference(input: MatchInput): ReferenceMatch {
  const { ctx, direction, composition, typography, truth } = input;
  const fingerprint = encode({ direction, composition, typography, truth });

  let best: { ref: Reference; distance: number } | null = null;
  for (const ref of REFERENCE_BANK) {
    const distance = distanceBetween(fingerprint, ref);
    if (!best || distance < best.distance) best = { ref, distance };
  }
  if (!best) throw new Error('reference-intelligence: empty bank');

  const divergences = nameDivergences(fingerprint, best.ref);
  const closeness = Math.max(0, 1 - best.distance);

  const match: ReferenceMatch = {
    reference: best.ref,
    distance: best.distance,
    divergences,
    closeness,
  };

  ctx.emit({
    stage: 'reference-intelligence',
    message: `nearest: ${best.ref.id} (closeness ${closeness.toFixed(2)})`,
    data: { divergences, family: best.ref.family, feeling: best.ref.campaign_feeling },
  });
  return match;
}

/** Encodes the banner into the same axes as a Reference. */
function encode(args: {
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
  truth: HumanTruth;
}): Reference {
  const { direction, composition, typography, truth } = args;
  return {
    id: 'banner-fingerprint',
    family: familyFromBanner(direction),
    emotional_category: pacingToCategory(direction.emotionalPacing),
    composition_type: layoutToComposition(direction.layoutFamily),
    pacing: pacingFromDirection(direction.emotionalPacing),
    product_behavior: productToBehavior(direction.productRole),
    typography_behavior: typoToBehavior(direction.typographyDominance, typography),
    restraint_score: direction.restraint,
    tension_score: tensionFromTruth(truth),
    realism_score: realismFromComposition(composition, direction),
    campaign_feeling: truth.tension,
  };
}

function distanceBetween(a: Reference, b: Reference): number {
  // Weighted axis distance — categorical axes count as 1 if mismatched,
  // numeric axes are L1 distance. Weights reflect what the spec calls
  // out as the "underlying emotional mechanics" — pacing/restraint/
  // tension dominate, composition and product follow, family is a
  // softer signal.
  const cat = (l: string, r: string, w: number) => (l === r ? 0 : w);
  const num = (l: number, r: number, w: number) => Math.abs(l - r) * w;

  let d = 0;
  d += cat(a.family, b.family, 0.6);
  d += cat(a.emotional_category, b.emotional_category, 0.9);
  d += cat(a.composition_type, b.composition_type, 0.8);
  d += cat(a.pacing, b.pacing, 1.0);
  d += cat(a.product_behavior, b.product_behavior, 0.9);
  d += cat(a.typography_behavior, b.typography_behavior, 1.0);
  d += num(a.restraint_score, b.restraint_score, 1.2);
  d += num(a.tension_score, b.tension_score, 1.2);
  d += num(a.realism_score, b.realism_score, 1.0);
  // Normalise to roughly 0..1 against the sum of weights.
  const maxWeight = 0.6 + 0.9 + 0.8 + 1.0 + 0.9 + 1.0 + 1.2 + 1.2 + 1.0;
  return d / maxWeight;
}

function nameDivergences(banner: Reference, ref: Reference): string[] {
  const out: string[] = [];
  if (banner.pacing !== ref.pacing) {
    out.push(`pacing drift: banner=${banner.pacing}, anchor=${ref.pacing}`);
  }
  if (banner.typography_behavior !== ref.typography_behavior) {
    out.push(`typography behavior off: banner=${banner.typography_behavior}, anchor=${ref.typography_behavior}`);
  }
  if (banner.product_behavior !== ref.product_behavior) {
    out.push(`product behavior off: banner=${banner.product_behavior}, anchor=${ref.product_behavior}`);
  }
  if (Math.abs(banner.restraint_score - ref.restraint_score) > 0.25) {
    out.push(
      `restraint mismatch: banner=${banner.restraint_score.toFixed(2)}, anchor=${ref.restraint_score.toFixed(2)} — the anchor is ${
        banner.restraint_score > ref.restraint_score ? 'less' : 'more'
      } restrained`,
    );
  }
  if (Math.abs(banner.tension_score - ref.tension_score) > 0.25) {
    out.push(
      `tension mismatch: banner=${banner.tension_score.toFixed(2)}, anchor=${ref.tension_score.toFixed(2)}`,
    );
  }
  if (Math.abs(banner.realism_score - ref.realism_score) > 0.2) {
    out.push(
      `realism mismatch: banner=${banner.realism_score.toFixed(2)}, anchor=${ref.realism_score.toFixed(2)} — push documentary further`,
    );
  }
  return out;
}

// ───── encoding helpers ─────

function familyFromBanner(d: CreativeDirection): Reference['family'] {
  switch (d.layoutFamily) {
    case 'editorial-page': return 'editorial-restraint';
    case 'documentary-crop': return 'documentary-quiet';
    case 'off-center-portrait': return d.restraint > 0.7 ? 'editorial-restraint' : 'fashion-aggressive';
    case 'environmental-wide': return 'intimate-documentary';
    case 'timestamp-anchor': return 'cinema-poster';
    case 'negative-space': return 'negative-space-luxury';
  }
}

function pacingToCategory(p: CreativeDirection['emotionalPacing']): Reference['emotional_category'] {
  switch (p) {
    case 'quiet': return 'quiet';
    case 'tense': return 'tense';
    case 'interrupted': return 'interrupted';
    case 'collapsed': return 'collapsed';
    case 'wired': return 'wired';
  }
}

function pacingFromDirection(p: CreativeDirection['emotionalPacing']): Reference['pacing'] {
  switch (p) {
    case 'quiet': return 'quiet';
    case 'tense': return 'staccato';
    case 'interrupted': return 'slow-interruption';
    case 'collapsed': return 'breath';
    case 'wired': return 'wired';
  }
}

function layoutToComposition(l: CreativeDirection['layoutFamily']): Reference['composition_type'] {
  switch (l) {
    case 'documentary-crop': return 'documentary-crop';
    case 'editorial-page': return 'centered-restraint';
    case 'off-center-portrait': return 'off-center-portrait';
    case 'environmental-wide': return 'environmental-wide';
    case 'timestamp-anchor': return 'timestamp-anchor';
    case 'negative-space': return 'negative-space-corner';
  }
}

function productToBehavior(r: CreativeDirection['productRole']): Reference['product_behavior'] {
  switch (r) {
    case 'hidden': return 'absent';
    case 'environmental': return 'environmental';
    case 'hand-held': return 'hand-held';
    case 'partial-crop': return 'partial-crop';
    case 'foreground-blur': return 'partial-crop';
    case 'table-object': return 'evidence';
    case 'desk-proof': return 'evidence';
    case 'background-object': return 'environmental';
    case 'emotional-proof': return 'evidence';
  }
}

function typoToBehavior(
  dom: CreativeDirection['typographyDominance'],
  typo: TypographyPlan,
): Reference['typography_behavior'] {
  if (dom === 'absent' || (!typo.primary.text || typo.primary.size === 0)) return 'silence';
  if (dom === 'timestamp') return 'timestamp-anchor';
  if (dom === 'loud') return 'interruption';
  if (dom === 'whisper') return 'whisper';
  if (dom === 'editorial') {
    return typo.primary.size > 70 ? 'restrained-oversized' : 'editorial-balanced';
  }
  return 'editorial-balanced';
}

function tensionFromTruth(t: HumanTruth): number {
  // Heuristic: short, sharp truths with internal contradictions read tense.
  // The bank stores tensions in roughly 0.4..0.9 range.
  const len = t.truth.length;
  const tensionPhraseLen = t.tension.length;
  let score = 0.5;
  if (len < 90) score += 0.15;
  if (tensionPhraseLen > 0 && tensionPhraseLen < 40) score += 0.15;
  if (/[.,;:]/.test(t.truth)) score += 0.1;
  return Math.min(0.95, score);
}

function realismFromComposition(c: CompositionPlan, d: CreativeDirection): number {
  // Realism comes from off-center framing, documentary crop, non-centered
  // negative space. Centered + balanced = lower realism.
  let score = 0.7;
  if (d.layoutFamily === 'documentary-crop' || d.layoutFamily === 'off-center-portrait') score += 0.1;
  if (c.negativeSpaceBias === 'left' || c.negativeSpaceBias === 'right') score += 0.05;
  if (d.focalPoint === 'environment' || d.focalPoint === 'empty-space') score += 0.05;
  return Math.min(0.95, score);
}
