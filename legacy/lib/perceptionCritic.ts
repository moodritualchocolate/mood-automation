/**
 * PERCEPTION CRITIC (Phase 7)
 *
 * The HIGHEST-LEVEL critic. Asks the twelve questions the spec named:
 *
 *   - Does this feel emotionally observed?
 *   - Does this feel culturally honest?
 *   - Would someone recognize themselves here?
 *   - Is this emotionally manipulative?
 *   - Is this trying too hard?
 *   - Does this feel "AI aware"?
 *   - Does this atmosphere linger?
 *   - Is this emotionally quiet enough?
 *   - Is the humanity believable?
 *   - Is the emotional contradiction real?
 *   - Would a human art director keep this?
 *   - Would someone save this silently?
 *
 * Scores each 0..10 then synthesises one verdict.
 *
 * The meta-critic respects this above every other signal. The
 * perception critic asking "would someone save this silently?" is the
 * spec's PRIMARY SUCCESS METRIC made operational.
 *
 * The critic protects against the "too smart" failure mode: a banner
 * with high taste-score and high visual-taste can STILL fail
 * perception if the emotional contradiction is not real or the
 * atmosphere does not linger.
 */

import type { CreativeDirection, HumanTruth, TypographyPlan } from '@/core/types';
import type { ReferenceDNA } from './referenceDNA';
import type { EmotionalCore } from './humanTruthEngine';
import type { EmotionalAftertaste } from './emotionalAftertaste';
import type { VisualTasteVerdict } from './visualTaste';
import type { WorldContinuityPlan } from './worldContinuity';
import type { MicroDetailPlan } from './microHumanDetails';
import type { InvisibleStory } from './invisibleStory';
import type { TasteVerdict } from './tasteJudge';

export interface PerceptionScores {
  emotionally_observed: number;
  culturally_honest: number;
  would_recognise_self: number;
  emotionally_manipulative: number;     // higher = WORSE
  trying_too_hard: number;              // higher = WORSE
  ai_aware: number;                     // higher = WORSE
  atmosphere_lingers: number;
  emotionally_quiet_enough: number;
  humanity_believable: number;
  contradiction_real: number;
  art_director_keep: number;
  saved_silently: number;
}

export interface PerceptionVerdict {
  scores: PerceptionScores;
  /** Composite 0..10 — high is good. */
  composite: number;
  /** The spec's PRIMARY success metric — "would someone quietly think
   *  'this is exactly how it feels'?" 0..10. */
  silent_emotional_recognition: number;
  verdict: 'keep' | 'pass' | 'refuse';
  /** Director-style notes — what the critic actually said in the room. */
  notes: string[];
  rejection_reason: string | null;
}

export interface PerceptionCriticInput {
  truth: HumanTruth;
  direction: CreativeDirection;
  typography: TypographyPlan;
  bannerDNA: ReferenceDNA;
  emotionalCore: EmotionalCore | null;
  emotionalAftertaste: EmotionalAftertaste;
  visualTaste: VisualTasteVerdict;
  tasteJudge: TasteVerdict;
  worldContinuity: WorldContinuityPlan | null;
  microDetails: MicroDetailPlan | null;
  invisibleStory: InvisibleStory | null;
  /** True when this run had a real cultural micro-moment grounding. */
  hasCulturalGrounding: boolean;
}

export function critiquePerception(input: PerceptionCriticInput): PerceptionVerdict {
  const {
    truth, direction, typography, bannerDNA,
    emotionalCore, emotionalAftertaste, visualTaste, tasteJudge,
    worldContinuity, microDetails, invisibleStory, hasCulturalGrounding,
  } = input;

  const notes: string[] = [];

  // ─── Per-question scoring ─────────────────────────────────────

  // emotionally_observed — driven by the imperfection / world-continuity
  // pair. If the world has lived-in artifacts AND micro-details, we feel
  // observed. Lacking either drops the score.
  let emotionally_observed = 4;
  if (worldContinuity && worldContinuity.artifacts.length >= 2) emotionally_observed += 2;
  if (microDetails && microDetails.details.length >= 3) emotionally_observed += 2;
  if (bannerDNA.documentary_weight > 0.65) emotionally_observed += 1.5;
  if (invisibleStory && invisibleStory.contextParagraph.length > 100) emotionally_observed += 0.5;
  emotionally_observed = clamp10(emotionally_observed);

  // culturally_honest — has the cultural-memory grounded the scene?
  let culturally_honest = hasCulturalGrounding ? 7 : 4;
  if (emotionalCore && emotionalCore.cultural_examples.length >= 2) culturally_honest += 1.5;
  if (bannerDNA.anti_commercial_feel > 0.7) culturally_honest += 1.5;
  culturally_honest = clamp10(culturally_honest);

  // would_recognise_self — silent_sentence presence + identity_resonance
  // from emotional aftertaste.
  let would_recognise_self = emotionalAftertaste.identity_resonance * 0.7;
  if (emotionalCore && emotionalCore.silent_sentence.length > 0 && emotionalCore.silent_sentence.length < 100) {
    would_recognise_self += 2;
  }
  if (truth.truth.length > 0 && truth.truth.length < 90) would_recognise_self += 1.5;
  would_recognise_self = clamp10(would_recognise_self);

  // emotionally_manipulative — HIGH score = bad. Fires on faked intensity
  // (face-forward + collapsed + low restraint) or buzzword tone.
  let emotionally_manipulative = 1.5;
  if (direction.focalPoint === 'human-face' && direction.emotionalPacing === 'collapsed' && direction.restraint < 0.5) {
    emotionally_manipulative += 4;
    notes.push('face-forward sadness with low restraint reads as manipulation');
  }
  if (visualTaste.forbiddenPatternsHit.some((p) => p.id === 'fake-emotional-intensity' || p.id === 'empty-emotional-buzzword')) {
    emotionally_manipulative += 4;
    notes.push('forbidden manipulation patterns present');
  }
  emotionally_manipulative = clamp10(emotionally_manipulative);

  // trying_too_hard — overdesign signals (loud + multiple typo systems +
  // low restraint + product hero).
  let trying_too_hard = 2;
  if (direction.typographyDominance === 'loud') trying_too_hard += 2;
  if (typography.secondary && typography.timestamp) trying_too_hard += 1.5;
  if (direction.restraint < 0.4) trying_too_hard += 1.5;
  if (tasteJudge.scores.overDesignPenalty >= 5) trying_too_hard += 2;
  trying_too_hard = clamp10(trying_too_hard);

  // ai_aware — derived directly from visual-taste's ai_detection_probability.
  const ai_aware = clamp10(visualTaste.ai_detection_probability * 10);
  if (ai_aware >= 6) notes.push(`AI awareness ${ai_aware.toFixed(1)}/10 — banner feels machine-aware`);

  // atmosphere_lingers — emotionalAftertaste.atmosphere_persistence + DNA luxury_restraint.
  const atmosphere_lingers = clamp10(emotionalAftertaste.atmosphere_persistence * 0.7 + bannerDNA.luxury_restraint * 3);

  // emotionally_quiet_enough — high silence_ratio + low typography loudness.
  let emotionally_quiet_enough = bannerDNA.silence_ratio * 7;
  if (direction.typographyDominance === 'whisper' || direction.typographyDominance === 'absent') emotionally_quiet_enough += 2.5;
  emotionally_quiet_enough = clamp10(emotionally_quiet_enough);

  // humanity_believable — micro-details + realism + documentary weight.
  let humanity_believable = bannerDNA.realism_type * 4 + bannerDNA.documentary_weight * 3;
  if (microDetails && microDetails.details.includes('skin-texture')) humanity_believable += 1.5;
  humanity_believable = clamp10(humanity_believable);

  // contradiction_real — tension phrase exists, is short, and the
  // emotional core's contradiction maps to it.
  let contradiction_real = 3;
  if (truth.tension && truth.tension.length > 0 && truth.tension.length < 40) contradiction_real += 4;
  if (emotionalCore && emotionalCore.contradiction.length > 0) contradiction_real += 2;
  contradiction_real = clamp10(contradiction_real);

  // art_director_keep — composite proxy: high taste + low manipulation + believable humanity.
  const art_director_keep = clamp10(
    tasteJudge.composite * 0.4 +
    (10 - emotionally_manipulative) * 0.3 +
    humanity_believable * 0.3,
  );

  // saved_silently — the spec's PRIMARY success metric. Would someone
  // quietly save this without telling anyone?
  let saved_silently = emotionalAftertaste.emotional_stickiness * 0.5;
  saved_silently += would_recognise_self * 0.3;
  saved_silently += (10 - emotionally_manipulative) * 0.2;
  saved_silently = clamp10(saved_silently);

  const scores: PerceptionScores = {
    emotionally_observed, culturally_honest, would_recognise_self,
    emotionally_manipulative, trying_too_hard, ai_aware,
    atmosphere_lingers, emotionally_quiet_enough, humanity_believable,
    contradiction_real, art_director_keep, saved_silently,
  };

  // ─── Composite + verdict ──────────────────────────────────────
  // Positive axes count up; "higher = worse" axes invert.
  const positives = [
    emotionally_observed, culturally_honest, would_recognise_self,
    atmosphere_lingers, emotionally_quiet_enough, humanity_believable,
    contradiction_real, art_director_keep, saved_silently,
  ];
  const negatives = [emotionally_manipulative, trying_too_hard, ai_aware];

  const posMean = positives.reduce((a, b) => a + b, 0) / positives.length;
  const negMean = negatives.reduce((a, b) => a + b, 0) / negatives.length;
  const composite = clamp10(posMean * 0.7 + (10 - negMean) * 0.3);

  // silent_emotional_recognition is the headline number.
  const silent_emotional_recognition = saved_silently;

  // Verdict.
  let verdict: PerceptionVerdict['verdict'];
  let rejection_reason: string | null = null;
  if (emotionally_manipulative >= 7 || ai_aware >= 8) {
    verdict = 'refuse';
    rejection_reason = emotionally_manipulative >= 7
      ? 'emotionally manipulative — fakes the contradiction'
      : `reads as AI-aware (${ai_aware.toFixed(1)}/10)`;
  } else if (composite < 5 || silent_emotional_recognition < 4) {
    verdict = 'refuse';
    rejection_reason = composite < 5
      ? `perception composite ${composite.toFixed(1)}/10 — banner does not feel observed`
      : `silent recognition ${silent_emotional_recognition.toFixed(1)}/10 — no one would save this`;
  } else if (composite < 6.5) {
    verdict = 'pass';
    notes.push('passes perception with reservations — would not be the campaign hero');
  } else {
    verdict = 'keep';
    notes.push('perception keeps it — would survive a creative director review');
  }

  // Always include a 1-line summary note.
  notes.unshift(`silent recognition ${silent_emotional_recognition.toFixed(1)}/10, composite ${composite.toFixed(1)}/10`);

  return {
    scores,
    composite,
    silent_emotional_recognition,
    verdict,
    notes,
    rejection_reason,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
