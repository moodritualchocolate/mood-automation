/**
 * HUMAN REACTION SIMULATOR
 *
 * Predicts the emotional response curve at three timestamps:
 *
 *   0.3s — the involuntary moment. The first impression. The viewer
 *          either KEEPS LOOKING or moves on. Reactions allowed here:
 *          interruption, recognition, indifference, rejection, confusion.
 *
 *   1.0s — the recognition window. The viewer is now looking on
 *          purpose. Reactions allowed here: recognition, curiosity,
 *          emotional tension, intimacy, validation, discomfort.
 *
 *   3.0s — the resolution. The viewer has either bought in or moved
 *          on. Reactions allowed here: aspiration, validation,
 *          emotional tension, intimacy, indifference, rejection.
 *
 * The reactions are NOT probabilities. They are the system's best
 * named prediction at each moment, derived from the banner's DNA and
 * the truth's mechanics.
 *
 * "indifference" or "rejection" at 0.3s is a hard fail — the banner
 * never gets a second look.
 */

import type { CreativeDirection, HumanTruth } from '@/core/types';
import type { ReferenceDNA } from './referenceDNA';
import type { TasteVerdict } from './tasteJudge';

export const REACTIONS = [
  'confusion',
  'interruption',
  'recognition',
  'aspiration',
  'discomfort',
  'validation',
  'curiosity',
  'emotional tension',
  'intimacy',
  'indifference',
  'rejection',
] as const;
export type Reaction = (typeof REACTIONS)[number];

export interface ReactionCurve {
  at_0_3s: Reaction;
  at_1s: Reaction;
  at_3s: Reaction;
  /** Plain-text narration of the arc — what we predict the viewer feels. */
  arc: string;
  /** True if the curve never moves past indifference/rejection. */
  scrollPast: boolean;
  /** 0..10 — overall predicted engagement quality. */
  engagementQuality: number;
}

export interface SimulateInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  bannerDNA: ReferenceDNA;
  taste: TasteVerdict;
}

export function simulateHumanReaction(input: SimulateInput): ReactionCurve {
  const { truth, direction, bannerDNA, taste } = input;

  // ─── 0.3s — the involuntary moment ─────────────────────────────
  // Driven by interruption power and AI-look. Hard "rejection" requires
  // strong AI smell OR cringe risk. "Indifference" only fires when the
  // banner has neither interruption power nor recognition signals.
  const looksGenuine = bannerDNA.realism_type > 0.7 || bannerDNA.documentary_weight > 0.6;
  const at_0_3s: Reaction =
    taste.scores.AIlookPenalty >= 8 || taste.closestCategory === 'too_ai' ? 'rejection'
    : taste.scores.cringeRisk >= 7 ? 'rejection'
    : taste.scores.AIlookPenalty >= 7 && !looksGenuine ? 'indifference'
    : bannerDNA.interruption_style > 0.65 ? 'interruption'
    : bannerDNA.documentary_weight > 0.65 ? 'recognition'
    : bannerDNA.realism_type > 0.75 ? 'recognition'
    : taste.scores.interruptionPower >= 5 ? 'interruption'
    : taste.scores.authenticityScore >= 6 ? 'recognition'
    : 'indifference';

  // ─── 1.0s — the recognition window ─────────────────────────────
  // Driven by emotional truth, the state family, and the campaign mode
  // signals carried in the direction. The state family is the strongest
  // determinant — different fatigues feel different to a reader.
  const family = truth.state.family;
  const at_1s: Reaction =
    at_0_3s === 'rejection' || at_0_3s === 'indifference' ? at_0_3s
    : family === 'pressure'        ? 'discomfort'
    : family === 'overstimulation' ? 'discomfort'
    : family === 'fragmentation'   ? 'confusion'
    : family === 'numbness'        ? 'recognition'
    : family === 'paralysis'       ? 'recognition'
    : family === 'collapse'        ? 'intimacy'
    : family === 'fatigue'         ? 'recognition'
    : family === 'avoidance'       ? 'curiosity'
    : taste.scores.emotionalTruth >= 7 ? 'emotional tension'
    : taste.scores.documentaryBelievability >= 6 ? 'intimacy'
    : bannerDNA.fashion_influence > 0.7 ? 'curiosity'
    : 'recognition';

  // ─── 3.0s — the resolution ─────────────────────────────────────
  // Strongest determinants: campaign strength, family resolution, and
  // CTA behavior. Aggressive CTAs push toward aspiration; quiet CTAs
  // toward emotional tension or intimacy.
  const at_3s: Reaction =
    at_1s === 'rejection' || at_1s === 'indifference' ? at_1s
    : at_1s === 'discomfort' && taste.scores.humanRealism >= 6 ? 'emotional tension'
    : at_1s === 'discomfort'                                    ? 'rejection'        // unresolved discomfort = scroll
    : at_1s === 'confusion' && taste.scores.emotionalTruth >= 6 ? 'recognition'
    : at_1s === 'confusion'                                     ? 'indifference'
    : at_1s === 'intimacy'                                      ? 'emotional tension'
    : at_1s === 'curiosity'  && taste.scores.campaignStrength >= 7 ? 'aspiration'
    : at_1s === 'curiosity'                                     ? 'recognition'
    : direction.ctaBehavior === 'editorial' || direction.ctaBehavior === 'corner' ? 'aspiration'
    : taste.scores.campaignStrength >= 7 && truth.tension       ? 'emotional tension'
    : taste.scores.humanRealism >= 7                            ? 'intimacy'
    : at_1s === 'recognition'                                   ? 'validation'
    : taste.composite >= 6                                      ? 'recognition'
    : 'indifference';

  const scrollPast =
    (at_0_3s === 'indifference' || at_0_3s === 'rejection') &&
    (at_1s === 'indifference' || at_1s === 'rejection');

  const engagementQuality = engagementFromCurve(at_0_3s, at_1s, at_3s);

  const arc = describeArc(at_0_3s, at_1s, at_3s, truth);

  return { at_0_3s, at_1s, at_3s, arc, scrollPast, engagementQuality };
}

// ────────────────────────────────────────────────────────────────

function engagementFromCurve(a: Reaction, b: Reaction, c: Reaction): number {
  const points: Record<Reaction, number> = {
    'rejection':         -3,
    'indifference':      -2,
    'confusion':          0,
    'discomfort':         2,
    'curiosity':          3,
    'recognition':        4,
    'interruption':       4,
    'emotional tension':  5,
    'intimacy':           5,
    'validation':         4,
    'aspiration':         3,
  };
  // Later moments matter slightly more — the 3s reaction is what stays.
  const total = points[a] * 0.8 + points[b] * 1.0 + points[c] * 1.4;
  // Map ~-9..+15 onto 0..10.
  return Math.max(0, Math.min(10, (total + 9) / 24 * 10));
}

function describeArc(a: Reaction, b: Reaction, c: Reaction, truth: HumanTruth): string {
  if (a === 'rejection') return `Scrolled past at 0.3s — the eye dismissed the banner before it could speak.`;
  if (a === 'indifference' && b === 'indifference') return `Moved through without engagement — the truth never landed.`;
  if (a === 'interruption' && b === 'recognition' && c === 'emotional tension')
    return `Stopped the eye, named the day, left the viewer with the contradiction "${truth.tension}" still in their head.`;
  if (a === 'recognition' && b === 'recognition') return `Recognised instantly — "${truth.truth}" is observed before it is read.`;
  if (b === 'discomfort' && c === 'intimacy')
    return `The viewer flinched at 1s — then leaned in. The banner did the rare thing: it made discomfort feel familiar.`;
  if (a === 'interruption' && c === 'aspiration')
    return `Interruption resolved into want — the banner moved from "stop" to "I would like to be here."`;
  return `0.3s ${a} → 1s ${b} → 3s ${c}.`;
}
