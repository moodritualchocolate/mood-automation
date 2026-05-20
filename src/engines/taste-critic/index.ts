/**
 * AESTHETIC / TASTE CRITIC (Phase 2)
 *
 * The scroll-stop critic asks: does the banner stop the scroll?
 * The taste critic asks: would a creative director with a portfolio
 * full of editorial work approve this?
 *
 * Eleven failure signals — all "higher = worse" — explicitly named by
 * the spec. Each signal has a deterministic heuristic AND, when
 * cognition is enabled, a Claude (Opus) opinion that overrides.
 *
 * Reject reasons are surfaced to the meta-critic for the final verdict.
 */

import type {
  AestheticCritique,
  CompositionPlan,
  CreativeDirection,
  EngineContext,
  HumanTruth,
  ImageResult,
  TypographyPlan,
} from '@/core/types';
import { AestheticCritiqueSchema } from '@/core/types';
import { cognitionEnabled, think } from '@/cognition/claude';
import { MOOD_VOICE } from '@/cognition/voice';

const SYSTEM = `
${MOOD_VOICE}

You are the TASTE CRITIC engine of MOOD CREATIVE OS.

You evaluate a banner against eleven failure signals. Every score is
0..10 where HIGHER means WORSE.

You are NOT being polite. You are reviewing for a portfolio that has
no room for "pretty but forgettable." You reject:
- fake premium      (decorative restraint with no emotional reason)
- startup AI feel   (gradient + sans-serif + symmetry)
- overdesigned      (multiple competing systems on one frame)
- generic gradients (atmosphere without authorship)
- forced cinematic  (lens flares and grain without observation)
- fake emotion      (poses, not behaviors)
- random typography (size or placement without justification)
- predictable hierarchy (headline-image-CTA stack with no tension)
- template energy   (could be any brand)
- safe composition  (centered, balanced, polite)
- AI ad feeling     (looks like every other generated banner)

You also write 1-3 reasons naming WHAT specifically fails, in plain
critic language ("the headline does not earn its size", "the photo is
posed, not observed").

VERDICT: "cleared" only if all failures are <= 4 AND no single failure
is >= 6. Otherwise "taste-reject".
`.trim();

export interface TasteInput {
  ctx: EngineContext;
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  typography: TypographyPlan;
  image: ImageResult;
}

export async function tasteCritique(input: TasteInput): Promise<AestheticCritique> {
  const { ctx } = input;
  const heuristic = heuristicTaste(input);

  let final = heuristic;

  if (cognitionEnabled()) {
    try {
      const raw = await think<AestheticCritique>({
        model: 'judgement',
        system: SYSTEM,
        user: buildPrompt(input, heuristic),
        jsonShape: shape,
        temperature: 0.4,
        maxTokens: 700,
      });
      final = AestheticCritiqueSchema.parse(raw);
    } catch (e) {
      ctx.emit({ stage: 'taste-critic', message: 'cognition failed; using heuristic', data: { error: (e as Error).message } });
    }
  }

  ctx.emit({
    stage: 'taste-critic',
    message: `verdict: ${final.verdict}`,
    data: { failures: final.failures, reasons: final.reasons },
  });
  return final;
}

const shape = `{
  "failures": {
    "fakePremium": 0, "startupAIFeeling": 0, "overdesigned": 0,
    "genericGradients": 0, "forcedCinematic": 0, "fakeEmotion": 0,
    "randomTypography": 0, "predictableHierarchy": 0, "templateEnergy": 0,
    "safeComposition": 0, "aiAdFeeling": 0
  },
  "verdict": "cleared" | "taste-reject",
  "notes": "short paragraph in critic voice",
  "reasons": ["string", ...]
}`;

function heuristicTaste(i: TasteInput): AestheticCritique {
  const { direction, composition, typography, image, truth } = i;

  // Fake premium: restraint > 0.7 with no emotional payoff (truth.tension empty)
  const fakePremium = direction.restraint > 0.7 && !truth.tension.trim() ? 6 : 2;

  // Startup AI feeling: stub provider + symmetric composition + sans-serif default
  const startupAIFeeling =
    (image.provider.startsWith('stub') ? 2 : 0) +
    (composition.negativeSpaceBias === 'center' ? 3 : 0) +
    (direction.layoutFamily === 'editorial-page' && direction.restraint < 0.4 ? 2 : 0);

  // Overdesigned: secondary typography present AND timestamp present AND
  // typography is "loud" — three systems competing.
  const overdesigned =
    (typography.secondary ? 1 : 0) +
    (typography.timestamp ? 1 : 0) +
    (direction.typographyDominance === 'loud' ? 4 : 0);

  // Generic gradients: stub provider always uses one — penalise mildly.
  const genericGradients = image.provider.startsWith('stub') ? 3 : 1;

  // Forced cinematic: real provider with low restraint AND wired pacing
  // implies "theatre" not observation.
  const forcedCinematic =
    direction.restraint < 0.4 && (direction.emotionalPacing === 'wired' || direction.emotionalPacing === 'tense') ? 5 : 2;

  // Fake emotion: focal=human-face + collapsed pacing + restraint < 0.5
  // tends toward "stock model with sad face."
  const fakeEmotion =
    direction.focalPoint === 'human-face' && direction.emotionalPacing === 'collapsed' && direction.restraint < 0.5
      ? 6
      : 2;

  // Random typography: timestamp dominance WITHOUT time anchor.
  const randomTypography =
    direction.typographyDominance === 'timestamp' && !truth.state.timeAnchor ? 8 : 2;

  // Predictable hierarchy: editorial-page + whisper + bare CTA + restraint > 0.6
  // is the safest possible combo — penalise even if quiet.
  const predictableHierarchy =
    direction.layoutFamily === 'editorial-page' && direction.typographyDominance === 'whisper' ? 5 : 3;

  // Template energy: direction landed on the safest possible combo —
  // documentary-crop layout + restraint in the safe-default band of
  // 0.60..0.70. Flagged because every brand ends up here.
  const inSafeBand = direction.restraint >= 0.60 && direction.restraint <= 0.70;
  const templateEnergy =
    direction.layoutFamily === 'documentary-crop' && inSafeBand ? 5 :
    inSafeBand ? 3 : 1;

  // Safe composition: centered or corners negative space + balanced focal.
  const safeComposition =
    composition.negativeSpaceBias === 'center' || composition.negativeSpaceBias === 'corners' ? 6 : 2;

  // AI ad feeling: composite — stub + safe + predictable + no time anchor.
  const aiAdFeeling = Math.min(
    10,
    (image.provider.startsWith('stub') ? 2 : 0) +
      (safeComposition >= 5 ? 2 : 0) +
      (predictableHierarchy >= 5 ? 2 : 0) +
      (truth.state.timeAnchor ? 0 : 2),
  );

  const failures = {
    fakePremium,
    startupAIFeeling: Math.min(10, startupAIFeeling),
    overdesigned,
    genericGradients,
    forcedCinematic,
    fakeEmotion,
    randomTypography,
    predictableHierarchy,
    templateEnergy,
    safeComposition,
    aiAdFeeling,
  };

  const reasons: string[] = [];
  if (failures.randomTypography >= 6) reasons.push('Timestamp typography used without a time anchor in the truth.');
  if (failures.fakePremium >= 5)     reasons.push('Restraint is decorative — the photo does not earn its quiet.');
  if (failures.overdesigned >= 5)    reasons.push('Three typography systems on one frame — pick one to dominate.');
  if (failures.fakeEmotion >= 5)     reasons.push('Face-forward sadness reads like a model holding a pose.');
  if (failures.safeComposition >= 5) reasons.push('Composition is centered and balanced — politely invisible.');
  if (failures.aiAdFeeling >= 5)     reasons.push('Reads like another generated banner; needs more authorship.');
  if (failures.templateEnergy >= 5)  reasons.push('Direction landed on default restraint — feels mass-produced.');

  const maxFailure = Math.max(...Object.values(failures));
  const avgFailure = Object.values(failures).reduce((a, b) => a + b, 0) / Object.values(failures).length;
  const verdict: AestheticCritique['verdict'] = avgFailure <= 4 && maxFailure < 6 ? 'cleared' : 'taste-reject';

  return {
    failures,
    verdict,
    notes:
      verdict === 'cleared'
        ? 'Banner survives taste. Quiet enough to be intentional, sharp enough to be observed.'
        : 'Banner reads safe or assembled. Push authorship.',
    reasons,
  };
}

function buildPrompt(i: TasteInput, h: AestheticCritique): string {
  return [
    `STATE: ${i.truth.state.label}`,
    `TRUTH: ${i.truth.truth}`,
    `TENSION: ${i.truth.tension}`,
    `HOOK: ${i.direction.hook}`,
    `LAYOUT: ${i.direction.layoutFamily}`,
    `PRODUCT ROLE: ${i.direction.productRole}`,
    `TYPO DOMINANCE: ${i.direction.typographyDominance}`,
    `RESTRAINT: ${i.direction.restraint.toFixed(2)}`,
    `HEADLINE (HE): ${i.typography.primary.text}`,
    `SECONDARY (HE): ${i.typography.secondary?.text ?? '—'}`,
    `TIMESTAMP: ${i.typography.timestamp?.text ?? '—'}`,
    `IMAGE PROVIDER: ${i.image.provider}`,
    `NEG SPACE BIAS: ${i.composition.negativeSpaceBias}`,
    `HEURISTIC PRESCORES (higher = worse): ${JSON.stringify(h.failures)}`,
    '',
    'Score honestly and return JSON.',
  ].join('\n');
}
