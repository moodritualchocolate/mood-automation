/**
 * TASTE JUDGE
 *
 * Scores emotional and visual AUTHENTICITY — not technical quality.
 *
 * The judge punishes:
 *   - giant decorative timestamps
 *   - centered fake compositions
 *   - "motivational quote" energy
 *   - floating product PNG behavior
 *   - too much typography
 *   - over-explaining
 *   - fake cinematic lighting
 *   - excessive gradients/glow
 *   - symmetrical layouts
 *   - "AI trying hard"
 *   - visual clutter
 *   - fake emotion
 *
 * The judge rewards:
 *   - restraint
 *   - asymmetry
 *   - imperfect framing
 *   - emotional ambiguity
 *   - silence
 *   - believable environments
 *   - natural product integration
 *   - documentary feeling
 *   - interruption through realism
 *   - subtle confidence
 *   - visual hierarchy clarity
 *
 * The judge does NOT vote. It reports. The meta-critic decides.
 * But the judge's `verdict` field DOES sit as the primary taste signal
 * in the synthesizer — when the judge says reject, the meta-critic
 * starts from reject and has to be talked out of it.
 */

import type {
  CompositionPlan,
  CreativeDirection,
  HumanTruth,
  ImageResult,
  TypographyPlan,
} from '@/core/types';
import type { ReferenceAnalysis } from './referenceDNA';
import { dnaDistance, type ReferenceDNA } from './referenceDNA';

export interface TasteScores {
  authenticityScore: number;          // higher = better
  emotionalTruth: number;             // higher = better
  antiTemplateScore: number;          // higher = better — refuses to be a template
  interruptionPower: number;          // higher = better
  humanRealism: number;               // higher = better
  visualConfidence: number;           // higher = better
  silenceConfidence: number;          // higher = better
  overDesignPenalty: number;          // higher = WORSE
  fakeAestheticPenalty: number;       // higher = WORSE
  cringeRisk: number;                 // higher = WORSE
  AIlookPenalty: number;              // higher = WORSE
  documentaryBelievability: number;   // higher = better
  visualRestraint: number;            // higher = better
  productNaturalness: number;         // higher = better
  campaignStrength: number;           // higher = better — would this anchor a campaign
}

export interface TasteVerdict {
  scores: TasteScores;
  rewards: string[];                  // named reasons the banner earned points
  punishments: string[];              // named reasons points were taken
  verdict: 'ship' | 'soft-refuse' | 'hard-refuse';
  composite: number;                  // 0..10 single number
  closestReference: ReferenceAnalysis | null;
  closestDistance: number;
  closestCategory: string | null;
}

export interface TasteJudgeInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
  image: ImageResult;
  bannerDNA: ReferenceDNA;
  references: ReferenceAnalysis[];
}

export function judgeTaste(input: TasteJudgeInput): TasteVerdict {
  const { truth, direction, composition, typography, image, bannerDNA, references } = input;
  const usingStub = image.provider.startsWith('stub');

  const rewards: string[] = [];
  const punishments: string[] = [];

  // ────────────────────────────────────────────────────────────────
  //  PUNISHMENTS first — every one of the spec's named offenses.
  // ────────────────────────────────────────────────────────────────

  // 1. Giant decorative timestamps (timestamp dominance without earned anchor).
  const giantDecorativeTimestamp =
    direction.typographyDominance === 'timestamp' && !truth.state.timeAnchor;
  if (giantDecorativeTimestamp) punishments.push('giant decorative timestamp — the truth has no time inside it');

  // 2. Centered fake composition.
  const centeredSymmetric = composition.negativeSpaceBias === 'center';
  if (centeredSymmetric) punishments.push('centered, symmetric composition — the layout chose itself');

  // 3. Motivational-quote energy (long, advisory truths).
  const motivationalEnergy = truth.truth.length > 110 && !truth.truth.includes('.') && !truth.truth.includes(',');
  if (motivationalEnergy) punishments.push('reads like motivational copy, not observation');

  // 4. Floating product PNG behavior — handled at planner level, but
  // re-checked: product inside the focal zone reads as hero placement.
  const productInsideFocal = composition.productZone && overlaps(composition.productZone, composition.focal, 0.4);
  if (productInsideFocal) punishments.push('product sits inside focal zone — behaves like a hero');

  // 5. Too much typography (primary + secondary + timestamp all present and large).
  const typographyOverload =
    typography.primary.size > 0 &&
    typography.secondary !== null &&
    typography.timestamp !== null &&
    direction.typographyDominance === 'loud';
  if (typographyOverload) punishments.push('three typography systems on one frame — overdesigned');

  // 6. Over-explaining (truth length above threshold AND secondary present).
  const overExplaining = truth.truth.length > 95 && typography.secondary !== null;
  if (overExplaining) punishments.push('over-explaining — headline plus secondary plus a long truth');

  // 7. Fake cinematic lighting — proxy: low restraint + collapsed pacing.
  const fakeCinematic = direction.restraint < 0.4 && direction.emotionalPacing === 'collapsed';
  if (fakeCinematic) punishments.push('forced cinematic — body posed, light theatrical');

  // 8. Excessive gradients/glow — stub provider always uses a radial
  // gradient; in real-image mode this is judged by vision. Stub adds a
  // small constant penalty.
  if (usingStub) punishments.push('stub provider gradient — would be judged harder under a real photo');

  // 9. Symmetrical layouts.
  const symmetricalLayout =
    direction.layoutFamily === 'editorial-page' &&
    composition.negativeSpaceBias === 'center';
  if (symmetricalLayout) punishments.push('symmetrical editorial layout — polite, invisible');

  // 10. "AI trying hard" — high restraint + loud dominance contradict.
  const aiTryingHard = direction.restraint > 0.75 && direction.typographyDominance === 'loud';
  if (aiTryingHard) punishments.push('restraint contradicted by loud typography — AI trying hard');

  // 11. Visual clutter — every typo zone present AND product zone too.
  const visualClutter =
    typography.secondary !== null &&
    typography.timestamp !== null &&
    composition.productZone !== null;
  if (visualClutter) punishments.push('every zone occupied — no room for the eye to land');

  // 12. Fake emotion — face-forward sadness with low restraint.
  const fakeEmotion =
    direction.focalPoint === 'human-face' &&
    direction.emotionalPacing === 'collapsed' &&
    direction.restraint < 0.55;
  if (fakeEmotion) punishments.push('face-forward sadness reads like a model holding a pose');

  // ────────────────────────────────────────────────────────────────
  //  REWARDS — every one of the spec's named virtues.
  // ────────────────────────────────────────────────────────────────

  if (direction.restraint > 0.7) rewards.push('genuine restraint');
  if (composition.negativeSpaceBias !== 'center') rewards.push('asymmetric composition');
  if (direction.layoutFamily === 'documentary-crop' || direction.layoutFamily === 'off-center-portrait')
    rewards.push('imperfect framing');
  if (truth.tension && truth.tension.length < 40) rewards.push('emotional ambiguity in the tension');
  if (bannerDNA.silence_ratio > 0.65) rewards.push('silence as authorship');
  if (bannerDNA.documentary_weight > 0.6) rewards.push('documentary feeling earned');
  if (direction.productRole === 'environmental' || direction.productRole === 'background-object')
    rewards.push('product as scene object, not hero');
  if (bannerDNA.realism_type > 0.75) rewards.push('observed, not posed');
  if (direction.typographyDominance === 'whisper' && truth.truth.length < 80)
    rewards.push('subtle typographic confidence');
  if (direction.focalPoint !== 'human-face' || direction.restraint > 0.6)
    rewards.push('hierarchy clarity — eye lands where intended');

  // ────────────────────────────────────────────────────────────────
  //  Reference DNA lookup — closest reference + named category bias.
  // ────────────────────────────────────────────────────────────────

  let closest: ReferenceAnalysis | null = null;
  let closestDistance = Number.POSITIVE_INFINITY;
  for (const r of references) {
    const d = dnaDistance(bannerDNA, r.dna);
    if (d < closestDistance) {
      closestDistance = d;
      closest = r;
    }
  }
  const closestCategory = closest?.category ?? null;

  // ────────────────────────────────────────────────────────────────
  //  Scoring. Every axis 0..10.
  // ────────────────────────────────────────────────────────────────

  const punish = (n: number) => Math.max(0, Math.min(10, n));

  const punishmentDensity = punishments.length;       // 0..12-ish
  const rewardDensity = rewards.length;               // 0..10-ish

  const authenticityScore       = punish(6 + (bannerDNA.realism_type * 4) - punishmentDensity * 0.6);
  const emotionalTruth          = punish(5 + bannerDNA.emotional_density * 5 - (motivationalEnergy ? 4 : 0));
  const antiTemplateScore       = punish(5 + (1 - sameLayoutBoredom(direction)) * 4 - (centeredSymmetric ? 2 : 0));
  const interruptionPower       = punish(4 + bannerDNA.interruption_style * 5 + (truth.state.timeAnchor && direction.typographyDominance === 'timestamp' ? 1 : 0));
  const humanRealism            = punish(4 + bannerDNA.documentary_weight * 5 + bannerDNA.camera_energy * 1.5 - (fakeEmotion ? 2 : 0));
  const visualConfidence        = punish(5 + bannerDNA.typography_confidence * 4 - (aiTryingHard ? 3 : 0));
  const silenceConfidence       = punish(3 + bannerDNA.silence_ratio * 6 + bannerDNA.negative_space_usage * 1.5 - (typographyOverload ? 4 : 0));
  const overDesignPenalty       = punish(2 + (typographyOverload ? 3 : 0) + (visualClutter ? 3 : 0) + (typography.secondary && typography.timestamp ? 1.5 : 0));
  const fakeAestheticPenalty    = punish(2 + (fakeCinematic ? 4 : 0) + (giantDecorativeTimestamp ? 3 : 0) + (aiTryingHard ? 2 : 0));
  const cringeRisk              = punish(1 + (motivationalEnergy ? 5 : 0) + (productInsideFocal ? 3 : 0) + (fakeEmotion ? 3 : 0));
  // Stub provider is acknowledged as a placeholder — we do not flagellate
  // it for not being a real photograph. The "too_ai" reference proximity
  // remains the strongest signal of actual AI smell.
  const AIlookPenalty           = punish(2.5 + (centeredSymmetric ? 2 : 0) + (1 - bannerDNA.realism_type) * 3 + (closestCategory === 'too_ai' ? 4 : 0));
  const documentaryBelievability= punish(3 + bannerDNA.documentary_weight * 6 + (bannerDNA.camera_energy > 0.3 ? 1 : 0));
  const visualRestraint         = punish(2 + direction.restraint * 7 + (typography.secondary ? -1 : 0));
  const productNaturalness      = punish(direction.productRole === 'hidden' ? 9 : 4 + (1 - bannerDNA.product_aggression_level) * 6 - (productInsideFocal ? 3 : 0));
  const campaignStrength        = punish(3 + rewardDensity * 0.6 + bannerDNA.anti_commercial_feel * 4 - punishmentDensity * 0.4);

  const scores: TasteScores = {
    authenticityScore, emotionalTruth, antiTemplateScore, interruptionPower,
    humanRealism, visualConfidence, silenceConfidence,
    overDesignPenalty, fakeAestheticPenalty, cringeRisk, AIlookPenalty,
    documentaryBelievability, visualRestraint, productNaturalness, campaignStrength,
  };

  // ────────────────────────────────────────────────────────────────
  //  Composite + verdict.
  // ────────────────────────────────────────────────────────────────

  // Positive axes (higher is better).
  const positives = [
    authenticityScore, emotionalTruth, antiTemplateScore, interruptionPower,
    humanRealism, visualConfidence, silenceConfidence,
    documentaryBelievability, visualRestraint, productNaturalness, campaignStrength,
  ];
  // Negative axes (higher is worse — invert).
  const negatives = [overDesignPenalty, fakeAestheticPenalty, cringeRisk, AIlookPenalty];

  const posAvg = positives.reduce((a, b) => a + b, 0) / positives.length;
  const negAvg = negatives.reduce((a, b) => a + b, 0) / negatives.length;
  const composite = punish(posAvg * 0.7 + (10 - negAvg) * 0.3);

  // Category-driven hard refusals (the spec's "be comfortable not generating").
  let verdict: TasteVerdict['verdict'] = 'ship';
  if (closestCategory === 'too_ai' && closestDistance < 0.18) {
    verdict = 'hard-refuse';
    punishments.push(`closest reference is in "too_ai" (${closestDistance.toFixed(2)}) — AI smell`);
  } else if (closestCategory === 'bad' && closestDistance < 0.15) {
    verdict = 'hard-refuse';
    punishments.push(`closest reference is in "bad" (${closestDistance.toFixed(2)})`);
  } else if (cringeRisk >= 7 || AIlookPenalty >= 8 || fakeAestheticPenalty >= 7) {
    verdict = 'hard-refuse';
  } else if (composite < 5.0 || punishmentDensity >= 4) {
    verdict = 'soft-refuse';
  } else if (composite < 6.5 && rewardDensity < 4) {
    verdict = 'soft-refuse';
  }

  return {
    scores,
    rewards,
    punishments,
    verdict,
    composite,
    closestReference: closest,
    closestDistance,
    closestCategory,
  };
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
  threshold: number,
): boolean {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.w, b.x + b.w);
  const y2 = Math.min(a.y + a.h, b.y + b.h);
  if (x2 <= x1 || y2 <= y1) return false;
  const overlap = (x2 - x1) * (y2 - y1);
  return overlap / (a.w * a.h) >= threshold;
}

function sameLayoutBoredom(d: CreativeDirection): number {
  // Documentary-crop with default restraint reads as the safest layout
  // a generation system can produce — give it a small boredom score.
  return d.layoutFamily === 'documentary-crop' && d.restraint > 0.55 && d.restraint < 0.75 ? 0.45 : 0.15;
}
