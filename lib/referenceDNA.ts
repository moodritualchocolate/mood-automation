/**
 * REFERENCE DNA EXTRACTOR
 *
 * References are analyzed NOT by colors or fonts but by the sixteen
 * mechanics that decide why something feels premium, restrained, or
 * documentary. Those mechanics ARE the DNA.
 *
 * The extractor produces DNA from any banner (the banner the system
 * just composed) so it can be compared to the DNAs sitting in the
 * /references/ folder. The TasteJudge consumes DNA-distance as one of
 * its inputs; the meta-critic synthesizes it into the final verdict.
 *
 * Why this is separate from the Phase 2 ReferenceMatch:
 *  - the Phase 2 fingerprint encoded categorical mechanics (layout
 *    family, product behavior, pacing) into a 9-axis shape.
 *  - the DNA encodes 16 axes ALL as continuous 0..1 scores —
 *    silence_ratio, tension_map, editorial_level, anti_commercial_feel,
 *    etc. This continuous shape lets the extractor compare against
 *    reference DNAs no matter which discrete layout label they sit on.
 *  - the existing reference-bank stays for layout-family matching;
 *    the new DNA references in /references/ analyze the FEELING.
 */

import type {
  CompositionPlan,
  CreativeDirection,
  HumanTruth,
  ImageBrief,
  TypographyPlan,
} from '@/core/types';

export interface ReferenceDNA {
  silence_ratio: number;            // how much of the frame is unspoken (negative space + atmosphere)
  tension_map: number;              // 0 = calm; 1 = crackling
  framing_behavior: number;         // 0 = polite/centered; 1 = aggressively off-axis
  typography_confidence: number;    // 0 = decorative; 1 = restraint that says "this is enough"
  negative_space_usage: number;     // 0 = filled; 1 = expensive emptiness
  emotional_density: number;        // 0 = thin; 1 = a sentence loaded with one specific feeling
  product_aggression_level: number; // 0 = absent/hidden; 1 = floating PNG
  interruption_style: number;       // 0 = quiet recognition; 1 = staccato hard cut
  realism_type: number;             // 0 = posed studio; 1 = documentary witness
  visual_temperature: number;       // 0 = warm intimate; 1 = clinical cold
  camera_energy: number;            // 0 = still; 1 = unsteady human hand
  editorial_level: number;          // 0 = catalog; 1 = magazine spread
  fashion_influence: number;        // 0 = none; 1 = poster-feel attitude
  documentary_weight: number;       // 0 = staged; 1 = caught
  luxury_restraint: number;         // 0 = loud; 1 = expensive silence
  anti_commercial_feel: number;     // 0 = reads as ad; 1 = reads as a still from elsewhere
}

export interface ReferenceAnalysis {
  reference_id: string;
  category: string;                 // matches /references/{folder}/...
  why_it_works: string[];
  why_it_fails: string[];
  visual_confidence: number;        // 0..10
  restraint_score: number;          // 0..10
  ai_feel_risk: number;             // 0..10 (lower is better)
  humanity_score: number;           // 0..10
  interruption_type: string;        // free-form: "quiet realism", "staccato editorial", ...
  product_behavior: string;
  silence_ratio: number;            // 0..1, mirrors the DNA axis
  dna: ReferenceDNA;
}

/**
 * Extract DNA from the banner the system just composed. The values
 * come from the direction + composition + typography + brief — no
 * vision call needed (and none would help much for stub images).
 *
 * Every axis is on 0..1 so the distance metric is interpretable.
 */
export function extractDNA(args: {
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
  truth: HumanTruth;
  brief: ImageBrief;
  imageProvider: string;
}): ReferenceDNA {
  const { direction, composition, typography, truth, brief, imageProvider } = args;

  // ─── silence_ratio ─────────────────────────────────────────────
  // Driven by typography presence and negative-space bias position.
  const hasSecondary = typography.secondary !== null;
  const hasTimestamp = typography.timestamp !== null;
  const typographyDensity =
    (typography.primary.size > 0 ? 0.35 : 0) +
    (hasSecondary ? 0.15 : 0) +
    (hasTimestamp ? 0.1 : 0);
  const silence_ratio = clamp01(1 - typographyDensity - (direction.layoutFamily === 'editorial-page' ? 0.1 : 0));

  // ─── tension_map ───────────────────────────────────────────────
  // Truth-driven. Short, contradictory truths = crackling.
  const tensionFromTruth =
    (truth.truth.length < 70 ? 0.25 : 0) +
    (truth.tension && truth.tension.length < 40 ? 0.2 : 0) +
    (truth.state.family === 'pressure' || truth.state.family === 'fragmentation' ? 0.2 : 0);
  const tension_map = clamp01(0.3 + tensionFromTruth);

  // ─── framing_behavior ──────────────────────────────────────────
  const off = direction.layoutFamily === 'off-center-portrait' || direction.layoutFamily === 'documentary-crop';
  const wide = direction.layoutFamily === 'environmental-wide';
  const framing_behavior = clamp01((off ? 0.7 : 0) + (wide ? 0.55 : 0) + (composition.negativeSpaceBias === 'center' ? -0.3 : 0.15));

  // ─── typography_confidence ─────────────────────────────────────
  // Restraint that knows what it's doing. Loud + numbness = LOW confidence.
  let typography_confidence = direction.typographyDominance === 'whisper'
    ? 0.8
    : direction.typographyDominance === 'editorial'
      ? 0.7
      : direction.typographyDominance === 'absent'
        ? 0.9
        : direction.typographyDominance === 'loud'
          ? 0.45
          : 0.6;
  if (direction.typographyDominance === 'timestamp' && !truth.state.timeAnchor) typography_confidence -= 0.35;
  typography_confidence = clamp01(typography_confidence);

  // ─── negative_space_usage ──────────────────────────────────────
  const negative_space_usage = clamp01(direction.restraint * 0.9 + (composition.negativeSpaceBias === 'center' ? -0.2 : 0.1));

  // ─── emotional_density ─────────────────────────────────────────
  const emotional_density = clamp01(0.5 + (truth.tension ? 0.25 : 0) + (truth.truth.length < 80 ? 0.15 : -0.05));

  // ─── product_aggression_level ──────────────────────────────────
  // Maps the role to a 0..1 axis where 0 = hidden and 1 = floating PNG.
  const product_aggression_level = roleAggression(direction.productRole);

  // ─── interruption_style ────────────────────────────────────────
  const interruption_style = clamp01(
    (direction.emotionalPacing === 'interrupted' ? 0.7 : 0) +
      (direction.emotionalPacing === 'tense' ? 0.55 : 0) +
      (direction.emotionalPacing === 'wired' ? 0.65 : 0) +
      (direction.emotionalPacing === 'collapsed' ? 0.35 : 0) +
      (direction.emotionalPacing === 'quiet' ? 0.2 : 0),
  );

  // ─── realism_type ──────────────────────────────────────────────
  // Documentary vs posed. The brief contains "documentary still" — but
  // realism climbs when imperfection words appear too.
  const sceneText = (brief.scene + ' ' + brief.imperfections.join(' ')).toLowerCase();
  const realism_type = clamp01(
    0.6 +
      (sceneText.includes('documentary') ? 0.15 : 0) +
      (sceneText.includes('off-center') ? 0.08 : 0) +
      (sceneText.includes('not posed') ? 0.1 : 0) +
      (imageProvider.startsWith('stub') ? -0.1 : 0),
  );

  // ─── visual_temperature ────────────────────────────────────────
  // Family-driven. Clinical cold for fragmentation/overstimulation;
  // warm intimate for fatigue/collapse.
  const cool = ['fragmentation', 'overstimulation', 'pressure'].includes(truth.state.family);
  const warm = ['fatigue', 'collapse', 'numbness', 'paralysis'].includes(truth.state.family);
  const visual_temperature = clamp01(0.5 + (cool ? 0.25 : 0) - (warm ? 0.2 : 0));

  // ─── camera_energy ─────────────────────────────────────────────
  const camera_energy = clamp01(
    (direction.emotionalPacing === 'wired' ? 0.7 : 0) +
      (direction.emotionalPacing === 'interrupted' ? 0.55 : 0) +
      (direction.emotionalPacing === 'collapsed' ? 0.15 : 0) +
      (direction.emotionalPacing === 'quiet' ? 0.1 : 0),
  );

  // ─── editorial_level ───────────────────────────────────────────
  const editorial_level = clamp01(
    (direction.layoutFamily === 'editorial-page' ? 0.7 : 0) +
      (direction.layoutFamily === 'negative-space' ? 0.65 : 0) +
      (direction.layoutFamily === 'timestamp-anchor' ? 0.55 : 0) +
      (direction.restraint > 0.7 ? 0.15 : 0),
  );

  // ─── fashion_influence ─────────────────────────────────────────
  const fashion_influence = clamp01(
    (direction.layoutFamily === 'off-center-portrait' && direction.restraint < 0.6 ? 0.6 : 0) +
      (direction.typographyDominance === 'loud' ? 0.25 : 0) +
      (direction.emotionalPacing === 'wired' ? 0.2 : 0),
  );

  // ─── documentary_weight ────────────────────────────────────────
  const documentary_weight = clamp01(
    (direction.layoutFamily === 'documentary-crop' ? 0.55 : 0) +
      (direction.layoutFamily === 'environmental-wide' ? 0.5 : 0) +
      (direction.focalPoint === 'environment' || direction.focalPoint === 'empty-space' ? 0.2 : 0) +
      (truth.state.body.length > 0 ? 0.1 : 0),
  );

  // ─── luxury_restraint ──────────────────────────────────────────
  const luxury_restraint = clamp01(
    direction.restraint * 0.7 +
      (direction.typographyDominance === 'absent' ? 0.25 : 0) +
      (direction.layoutFamily === 'negative-space' ? 0.15 : 0),
  );

  // ─── anti_commercial_feel ──────────────────────────────────────
  // Inverse of "looks like an ad". CTA-as-pill drops it; CTA-as-bare
  // raises it. Product-hero behaviors drop it.
  const anti_commercial_feel = clamp01(
    0.55 +
      (direction.ctaBehavior === 'quiet' ? 0.15 : 0) +
      (direction.ctaBehavior === 'corner' ? -0.15 : 0) +
      (direction.productRole === 'hidden' || direction.productRole === 'environmental' ? 0.15 : 0) +
      (direction.productRole === 'partial-crop' ? 0.05 : 0) +
      (direction.productRole === 'background-object' ? 0.1 : 0) +
      (direction.restraint > 0.7 ? 0.1 : 0),
  );

  return {
    silence_ratio,
    tension_map,
    framing_behavior,
    typography_confidence,
    negative_space_usage,
    emotional_density,
    product_aggression_level,
    interruption_style,
    realism_type,
    visual_temperature,
    camera_energy,
    editorial_level,
    fashion_influence,
    documentary_weight,
    luxury_restraint,
    anti_commercial_feel,
  };
}

/**
 * L1 distance across all 16 axes, normalised to 0..1 by axis count.
 */
export function dnaDistance(a: ReferenceDNA, b: ReferenceDNA): number {
  const keys = Object.keys(a) as Array<keyof ReferenceDNA>;
  let d = 0;
  for (const k of keys) d += Math.abs(a[k] - b[k]);
  return d / keys.length;
}

/**
 * Named per-axis divergences — what the banner is doing differently
 * from the reference, in human language.
 */
export function dnaDivergences(banner: ReferenceDNA, ref: ReferenceDNA, threshold = 0.18): string[] {
  const out: string[] = [];
  const compare = (key: keyof ReferenceDNA, msgs: { low: string; high: string }) => {
    const diff = banner[key] - ref[key];
    if (Math.abs(diff) >= threshold) {
      out.push(diff > 0 ? msgs.high : msgs.low);
    }
  };

  compare('silence_ratio',           { low: 'banner is louder than the anchor — push more silence', high: 'banner is quieter than the anchor — earn the quiet with a sharper truth' });
  compare('tension_map',             { low: 'banner lacks the tension the anchor carries', high: 'banner is more tense than the anchor — risk reads as theatre' });
  compare('framing_behavior',        { low: 'framing is politer than the anchor', high: 'framing is more aggressive than the anchor' });
  compare('typography_confidence',   { low: 'typography hesitates — anchor commits', high: 'typography is more committed than the anchor — risk of decorative' });
  compare('product_aggression_level',{ low: 'product behaves quieter than anchor — fine if intentional', high: 'product sits forward — anchor keeps it as evidence' });
  compare('interruption_style',      { low: 'less interruption than anchor', high: 'more interruption than anchor — verify it is earned' });
  compare('realism_type',            { low: 'banner reads more posed than anchor', high: 'banner reads more documentary than anchor' });
  compare('editorial_level',         { low: 'less editorial than anchor', high: 'more editorial than anchor — verify it is not decorative' });
  compare('luxury_restraint',        { low: 'less restraint than anchor', high: 'more restraint than anchor' });
  compare('anti_commercial_feel',    { low: 'reads more like an ad than the anchor', high: 'reads further from an ad than the anchor' });

  return out;
}

// ────────────────────────────────────────────────────────────────

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function roleAggression(role: CreativeDirection['productRole']): number {
  switch (role) {
    case 'hidden':            return 0;
    case 'environmental':     return 0.2;
    case 'background-object': return 0.25;
    case 'foreground-blur':   return 0.3;
    case 'emotional-proof':   return 0.35;
    case 'desk-proof':        return 0.4;
    case 'table-object':      return 0.45;
    case 'partial-crop':      return 0.55;
    case 'hand-held':         return 0.65;
  }
}
