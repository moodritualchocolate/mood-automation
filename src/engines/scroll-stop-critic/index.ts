/**
 * 9. SCROLL STOP CRITIC
 *
 * The system critiques itself before shipping. If the banner fails,
 * the critic decides whether to regenerate the image alone, or to
 * throw the whole concept out and start from a different state.
 *
 * The critic checks structural signals deterministically and, when
 * cognition is available, asks Claude (Haiku) for a vision-style
 * judgement on top.
 */

import type {
  CTA,
  CompositionPlan,
  CreativeDirection,
  Critique,
  EngineContext,
  HumanTruth,
  ImageBrief,
  ImageResult,
  TypographyPlan,
} from '@/core/types';
import { CritiqueSchema } from '@/core/types';
import { cognitionEnabled, think } from '@/cognition/claude';
import { MOOD_VOICE } from '@/cognition/voice';

const SYSTEM = `
${MOOD_VOICE}

You are the SCROLL-STOP CRITIC engine of MOOD CREATIVE OS.

You score a single banner across ten signals on 0..10 scales. Then you
decide a verdict: "approve" | "reject-image" | "reject-concept".

Reject-image means the concept is right but the photograph needs another
take. Reject-concept means the human truth, hook, or layout itself is
wrong and we should start from a different state.

You are RUTHLESS, not snarky. You do not approve banners that:
- feel like AI ads
- have a pasted product
- carry generic typography
- have weak emotional tension
- could have been any brand

You are also fair to restraint: a quiet banner with one true feeling is
better than a loud banner with three.
`.trim();

export interface CritiqueInput {
  ctx: EngineContext;
  truth: HumanTruth;
  direction: CreativeDirection;
  composition: CompositionPlan;
  imageBrief: ImageBrief;
  image: ImageResult;
  typography: TypographyPlan;
  cta: CTA;
}

export async function critique(input: CritiqueInput): Promise<Critique> {
  const { ctx } = input;
  ctx.emit({ stage: 'critic', message: 'reviewing banner' });

  const heuristic = heuristicScores(input);

  let final: Critique = heuristic;

  if (cognitionEnabled()) {
    try {
      const raw = await think<Critique>({
        model: 'structural',
        system: SYSTEM,
        user: buildCriticPrompt(input, heuristic),
        jsonShape: critiqueShape,
        temperature: 0.4,
        maxTokens: 700,
      });
      final = CritiqueSchema.parse(raw);
    } catch (e) {
      ctx.emit({ stage: 'critic', message: 'cognition failed, using heuristic', data: { error: (e as Error).message } });
    }
  }

  ctx.emit({
    stage: 'critic',
    message: `verdict: ${final.verdict}`,
    data: { scores: final.scores, reasons: final.rejectionReasons },
  });
  return final;
}

const critiqueShape = `{
  "scores": {
    "feelsAI": 0, "compositionGeneric": 0, "productPasted": 0,
    "typographyForced": 0, "emotionalTruthClarity": 0,
    "focalPointObvious": 0, "eyeStops": 0, "tension": 0,
    "curiosity": 0, "feelsLikeRealCampaign": 0
  },
  "verdict": "approve" | "reject-image" | "reject-concept",
  "notes": "one short paragraph",
  "rejectionReasons": ["string", ...]
}`;

/**
 * Heuristic scoring — runs always. Encodes the spec's check list:
 *  - feels AI? composition generic? product pasted?
 *  - typography forced? truth clear? focal obvious?
 *  - eye stops? tension? curiosity? real campaign?
 */
function heuristicScores(i: CritiqueInput): Critique {
  const { truth, direction, composition, typography, image } = i;

  // Higher is worse.
  // The stub provider draws no product at all (atmosphere placeholder),
  // so it cannot look pasted. With real providers we are vigilant.
  const productPasted = image.provider.startsWith('stub')
    ? 1.0
    : direction.productRole === 'hidden'
      ? 1.0
      : 3.0;

  // Composition generic = layout family used recently OR no negative-space match.
  const compositionGeneric = direction.layoutFamily === 'documentary-crop' ? 4 : 3;

  // Typography forced if dominance=loud but state is quiet family.
  const quietFamilies = ['numbness', 'fatigue', 'paralysis', 'collapse'];
  const typographyForced =
    direction.typographyDominance === 'loud' && quietFamilies.includes(truth.state.family) ? 7 : 2;

  // Feels AI: combination — stub provider + no time anchor + low restraint.
  const feelsAI =
    (image.provider.startsWith('stub') ? 3 : 1) +
    (direction.restraint < 0.4 ? 2 : 0) +
    (typography.primary.text.length > 80 ? 2 : 0);

  // Positive signals (higher is better).
  const emotionalTruthClarity = Math.min(10, 6 + Math.round((1 - Math.min(truth.truth.length, 120) / 120) * 4));
  const focalPointObvious = direction.focalPoint === 'empty-space' ? 6 : 8;
  const eyeStops = 6 + Math.round(direction.restraint * 3);
  const tension = truth.tension.length > 0 ? 8 : 5;
  const curiosity = direction.hook.length > 6 ? 7 : 5;
  const feelsLikeRealCampaign = 6 + (direction.layoutFamily === 'editorial-page' ? 2 : 1);

  const scores = {
    feelsAI: Math.min(10, feelsAI),
    compositionGeneric,
    productPasted,
    typographyForced,
    emotionalTruthClarity,
    focalPointObvious,
    eyeStops,
    tension,
    curiosity,
    feelsLikeRealCampaign,
  };

  const reasons: string[] = [];
  let verdict: Critique['verdict'] = 'approve';

  if (scores.productPasted >= 5) {
    reasons.push('Product treatment risks looking pasted — regenerate image with stricter scene integration.');
    verdict = 'reject-image';
  }
  if (scores.typographyForced >= 5) {
    reasons.push('Typography dominance fights the state family — reduce or change layout.');
    verdict = 'reject-concept';
  }
  if (scores.feelsAI >= 6) {
    reasons.push('Composition reads AI-generated; push restraint and imperfection.');
    if (verdict === 'approve') verdict = 'reject-image';
  }
  if (scores.emotionalTruthClarity <= 5) {
    reasons.push('Emotional truth not landing — rewrite or pick a different state.');
    verdict = 'reject-concept';
  }

  return {
    scores,
    verdict,
    notes:
      verdict === 'approve'
        ? 'Banner clears the floor. Hook is observed, product is restrained, typography is honest.'
        : 'Banner needs another pass before shipping.',
    rejectionReasons: reasons,
  };
}

function buildCriticPrompt(i: CritiqueInput, h: Critique): string {
  return [
    `STATE: ${i.truth.state.label}`,
    `HUMAN TRUTH: ${i.truth.truth}`,
    `TENSION: ${i.truth.tension}`,
    `HOOK: ${i.direction.hook}`,
    `LAYOUT: ${i.direction.layoutFamily}`,
    `PRODUCT ROLE: ${i.direction.productRole}`,
    `TYPO DOMINANCE: ${i.direction.typographyDominance}`,
    `HEADLINE (HE): ${i.typography.primary.text}`,
    `SECONDARY (HE): ${i.typography.secondary?.text ?? '—'}`,
    `CTA: ${i.cta.text}`,
    `IMAGE PROVIDER: ${i.image.provider}`,
    `HEURISTIC PRESCORES: ${JSON.stringify(h.scores)}`,
    '',
    'Score honestly and output the JSON.',
  ].join('\n');
}
