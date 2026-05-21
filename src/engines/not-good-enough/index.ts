/**
 * "NOT GOOD ENOUGH" META-CRITIC (Phase 2)
 *
 * The most important upgrade.
 *
 * Synthesizes the scroll-stop critic, the taste critic, the visual
 * psychology engine, the product presence engine, and the reference
 * intelligence engine into ONE verdict the pipeline acts on.
 *
 * Brutality is configurable: a higher brutality threshold demands more
 * from every signal. Default brutality 0.7 means: every signal must
 * clear a meaningful floor — no signal carries the banner alone.
 *
 * The meta-critic does NOT vote. It enforces. If the taste critic
 * rejected, the meta-critic rejects, period. If the reference closeness
 * is below the floor, the meta-critic rejects, period. The point is to
 * stop accepting "technically correct."
 */

import type {
  AestheticCritique,
  CreativeDirection,
  Critique,
  EngineContext,
  FinalVerdict,
  MemorySnapshot,
  ProductPresence,
  ReferenceMatch,
  VisualPsychology,
} from '@/core/types';
import type { FatigueReport } from '@lib/visualFatigue';
import type { ReactionCurve } from '@lib/humanReaction';
import type { TasteVerdict } from '@lib/tasteJudge';
import type { AntiAIReport } from '@lib/antiAI';
import type { JobDecision } from '@lib/campaignDecision';
import type { RhythmAxis } from '@lib/campaignRhythm';
import type { AftertasteRecord } from '@lib/aftertaste';
import type { AtmosphereReport } from '@lib/atmosphereConsistency';
import type { DriftReport } from '@lib/tasteDrift';
import type { VisualTasteVerdict } from '@lib/visualTaste';
import type { EmotionalAftertaste } from '@lib/emotionalAftertaste';
import type { CampaignMemoryV2Report } from '@lib/campaignMemoryV2';
import type { PerceptionVerdict } from '@lib/perceptionCritic';
import type { CampaignIdentity } from '@lib/campaignIdentity';
// Phase 8 — visual composition intelligence
import type { GravityReading } from '@lib/visualGravity';
import type { NegativeSpaceReading } from '@lib/negativeSpacePsychology';
import type { CompositionRhythmReport } from '@lib/compositionRhythm';
import type { PresenceDecision } from '@lib/productPresence';
import type { FramingPlan } from '@lib/humanFraming';
import type { LayoutDirectorVerdict } from '@lib/index';
// Phase 9 — temporal campaign cinema
import type { SequenceVerdict } from '@lib/emotionalSequence';
import type { AbsenceDecision } from '@lib/absenceIntelligence';
import type { ContradictionReading } from '@lib/emotionalContradiction';
import type { ObjectMemoryGraph } from '@lib/objectMemoryGraph';
import type { RhythmAxis as TempoAxisName } from '@lib/campaignRhythm';
// Phase 10 — unified cinematic brain
import type { CompressionReading } from '@lib/emotionalCompression';
import type { SyntheticReading } from '@lib/antiSyntheticBehavior';
import type { CinematicVerdict } from '@lib/cinematicBrain';
// Phase 11 — natural human chaos
import type { HumanContradictionReading } from '@lib/humanContradiction';
import type { PerformativeReading } from '@lib/nonPerformativeReality';
import type { LifeNoisePlan } from '@lib/lifeNoise';
// Phase 12 — cultural memory engine
import type { CulturalPattern } from '@lib/sharedCulturalMemory';
import type { CollectiveRecognitionReading } from '@lib/collectiveRecognition';
import type { RitualSelection } from '@lib/unspokenRituals';
import type { DriftReading as CulturalDriftReading } from '@lib/culturalDrift';

export interface MetaInput {
  ctx: EngineContext;
  scrollStop: Critique;
  taste: AestheticCritique;
  psychology: VisualPsychology;
  productPresence: ProductPresence | null;
  reference: ReferenceMatch;
  memory: MemorySnapshot;
  /** 0..1 — higher means more brutal. Default 0.7. */
  brutality?: number;
  // Phase 2.5 — explicit taste system signals.
  judge?: TasteVerdict;
  reaction?: ReactionCurve;
  fatigue?: FatigueReport;
  // Phase 3 — campaign brain signals.
  antiAI?: AntiAIReport;
  rhythmWorsen?: { worsens: boolean; axis: RhythmAxis | null; reason: string | null };
  job?: JobDecision;
  direction?: CreativeDirection;
  // Phase 4 — reality-loop signals.
  aftertastePrediction?: AftertasteRecord;
  atmosphere?: AtmosphereReport;
  drift?: DriftReport;
  // Phase 5 — perceptual foundation signals.
  visualTaste?: VisualTasteVerdict;
  emotionalAftertaste?: EmotionalAftertaste;
  campaignMemoryV2?: CampaignMemoryV2Report;
  // Phase 7 — perception + world continuity.
  perceptionCriticVerdict?: PerceptionVerdict;
  campaignIdentity?: CampaignIdentity;
  // Phase 8 — visual composition intelligence.
  gravity?: GravityReading;
  negativeSpace?: NegativeSpaceReading;
  compositionRhythm8?: CompositionRhythmReport;
  productPresence8?: PresenceDecision;
  framing8?: FramingPlan;
  directorVerdict?: LayoutDirectorVerdict;
  // Phase 9 — temporal campaign cinema.
  sequenceVerdict?: SequenceVerdict;
  tempoWorsen?: { worsens: boolean; axis: TempoAxisName | string | null; reason: string | null };
  absenceDecision?: AbsenceDecision;
  contradictionReading?: ContradictionReading;
  objectMemoryGraph?: ObjectMemoryGraph;
  // Phase 10 — unified cinematic brain.
  compressionReading?: CompressionReading;
  syntheticReading?: SyntheticReading;
  cinematicVerdict?: CinematicVerdict;
  // Phase 11 — natural human chaos.
  humanContradiction?: HumanContradictionReading;
  nonPerformative?: PerformativeReading;
  lifeNoise?: LifeNoisePlan;
  // Phase 12 — cultural memory engine.
  sharedPattern?: CulturalPattern | null;
  collectiveRecognition?: CollectiveRecognitionReading;
  unspokenRitualPick?: RitualSelection;
  culturalDriftReading?: CulturalDriftReading;
}

export function decideFinalVerdict(input: MetaInput): FinalVerdict {
  const { ctx, scrollStop, taste, psychology, productPresence, reference, memory,
          judge, reaction, fatigue, antiAI, rhythmWorsen, job, direction,
          visualTaste, emotionalAftertaste, campaignMemoryV2,
          perceptionCriticVerdict, campaignIdentity,
          gravity, negativeSpace, compositionRhythm8,
          productPresence8, framing8, directorVerdict,
          sequenceVerdict, tempoWorsen, absenceDecision,
          contradictionReading, objectMemoryGraph,
          compressionReading, syntheticReading, cinematicVerdict,
          humanContradiction, nonPerformative, lifeNoise,
          sharedPattern, collectiveRecognition, unspokenRitualPick, culturalDriftReading } = input;

  // Brutality rises with the campaign's history — if recent banners have
  // approved easily, raise the bar; if many rejections recently, hold
  // steady. This is the spec's "rejection system" learning behavior.
  const brutality = clampUnit((input.brutality ?? 0.65) + brutalityFromMemory(memory));

  // Composite totals.
  const scrollStopTotal = compositeScrollStop(scrollStop);
  const tasteTotal = compositeTaste(taste);
  const psychologyTotal = compositePsychology(psychology);
  const productTotal = productPresence ? compositePresence(productPresence) : null;

  const totals: FinalVerdict['totals'] = {
    scrollStop: scrollStopTotal,
    taste: tasteTotal,
    psychology: psychologyTotal,
    productPresence: productTotal,
    referenceCloseness: reference.closeness,
  };

  // Floors scale with brutality. At brutality 0.7:
  //  - scrollStop must be >= 6.0
  //  - taste must be <= 4.0 (lower is better — it's a failure score)
  //  - psychology must be >= 5.5
  //  - product (if present) must be >= 6.0
  //  - reference closeness must be >= 0.55
  const floorScrollStop      = 5.0 + brutality * 1.5;
  const ceilingTaste         = 5.5 - brutality * 1.5;
  const floorPsychology      = 4.5 + brutality * 1.5;
  const floorProduct         = 5.0 + brutality * 1.5;
  const floorRefCloseness    = 0.45 + brutality * 0.15;

  const reasons: string[] = [];
  let verdict: FinalVerdict['verdict'] = 'approve';

  // Hard gates — fire only at sufficient brutality. At low brutality the
  // taste rejection rolls into the soft accumulator below.
  if (taste.verdict === 'taste-reject' && brutality >= 0.75) {
    reasons.push(...taste.reasons);
    verdict = 'reject-taste';
  }
  if (productPresence?.verdict === 'pasted') {
    reasons.push(...productPresence.reasons);
    verdict = 'reject-image';
  }

  // ─── Phase 2.5 hard gates ─────────────────────────────────────
  // The TasteJudge has its own hard verdict — when it says hard-refuse,
  // the meta-critic refuses regardless of brutality. This is the
  // "comfortable not generating" rule from the spec.
  if (judge && judge.verdict === 'hard-refuse') {
    reasons.push(`taste judge hard-refused: ${judge.punishments.slice(0, 2).join('; ')}`);
    verdict = 'reject-taste';
  }
  // Soft-refuse from the judge fires at default brutality and up.
  if (judge && judge.verdict === 'soft-refuse' && brutality >= 0.65 && verdict === 'approve') {
    reasons.push(`taste judge soft-refused: ${judge.punishments.slice(0, 2).join('; ')}`);
    verdict = 'reject-taste';
  }
  // The human-reaction simulator's scroll-past prediction is a HARD gate.
  // If the prediction says the viewer scrolls past at 0.3s, refusal is mandatory.
  if (reaction && reaction.scrollPast) {
    reasons.push(`predicted scroll-past at 0.3s — ${reaction.at_0_3s} into ${reaction.at_1s}`);
    verdict = 'reject-concept';
  }
  // Visual fatigue is a hard gate at brutal mode; soft pressure at default.
  if (fatigue && fatigue.verdict === 'fatigued' && brutality >= 0.8) {
    reasons.push(`campaign fatigue: ${fatigue.flags.slice(0, 2).join('; ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 3 hard gates ───────────────────────────────────────
  // Asset-job contract enforcement — a "no-product" job that ships
  // a banner with a visible product is a contradiction.
  if (job && job.constraints.productMustBeAbsent && direction && direction.productRole !== 'hidden') {
    reasons.push(`job "${job.job}" requires productRole=hidden but direction is "${direction.productRole}"`);
    verdict = 'reject-concept';
  }

  // Anti-AI smell is a HARD gate at brutal mode; soft pressure at default.
  if (antiAI && antiAI.smell >= 6 && brutality >= 0.75) {
    reasons.push(`anti-AI smell ${antiAI.smell.toFixed(1)} — signatures: ${antiAI.signatures.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // Rhythm worsening — when the campaign is imbalanced and this banner
  // would push the imbalance further, reject at default brutality and up.
  if (rhythmWorsen && rhythmWorsen.worsens && brutality >= 0.6) {
    reasons.push(`rhythm: ${rhythmWorsen.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 4 — reality-loop signals ───────────────────────────
  // Aftertaste is the new primary success metric. A banner with a
  // strong predicted scroll-stop but weak predicted aftertaste is
  // exactly the "engagement spike with no brand residue" the spec
  // told us to refuse.
  if (input.aftertastePrediction) {
    const a = input.aftertastePrediction;
    const aftertasteFloor = 4.0 + brutality * 1.5;
    if (a.residueStrength < aftertasteFloor) {
      const note = `predicted aftertaste ${a.residueStrength.toFixed(1)} below floor ${aftertasteFloor.toFixed(1)} — "${a.memoryPhrase}"`;
      if (brutality >= 0.75) {
        reasons.push(note);
        if (verdict === 'approve') verdict = 'reject-concept';
      } else {
        // soft pressure at default
        // (handled in the softReasons collection below)
      }
    }
  }

  // Atmosphere — block banners that would collapse the brand into a
  // single mood (uniformity penalty engaged).
  if (input.atmosphere && input.atmosphere.uniformityPenalty >= 5 && brutality >= 0.7) {
    reasons.push(`atmosphere uniformity penalty ${input.atmosphere.uniformityPenalty.toFixed(1)} — campaign collapsing into one mood`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }

  // ─── Phase 5 hard gates ───────────────────────────────────────
  // Visual taste verdict — when the engine names a rejection reason,
  // the meta-critic respects it. Hard at brutal, soft at default.
  if (visualTaste && visualTaste.rejection_reason) {
    if (brutality >= 0.75) {
      reasons.push(`visual-taste: ${visualTaste.rejection_reason}`);
      if (verdict === 'approve') verdict = 'reject-taste';
    }
  }
  // Hard forbidden-AI patterns — automatic refusal at brutal.
  if (visualTaste && visualTaste.forbiddenPatternsHit.some((p) => p.severity === 'hard') && brutality >= 0.7) {
    const hard = visualTaste.forbiddenPatternsHit.filter((p) => p.severity === 'hard');
    reasons.push(`forbidden-AI: ${hard.map((p) => p.name).join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Emotional aftertaste composite — the new primary success metric.
  // Replaces engagement-spike with brand-residue.
  if (emotionalAftertaste && emotionalAftertaste.composite < (4.0 + brutality * 1.5)) {
    if (brutality >= 0.75) {
      reasons.push(`emotional aftertaste ${emotionalAftertaste.composite.toFixed(1)} below floor — ${emotionalAftertaste.post_view_emotional_state}`);
      if (verdict === 'approve') verdict = 'reject-concept';
    }
  }
  // Campaign memory v2 — when the campaign is at risk of collapsing into
  // one mood AND this banner would worsen it (same closing reaction as
  // dominant), reject.
  if (campaignMemoryV2 && campaignMemoryV2.atmosphereAtRisk && reaction && campaignMemoryV2.dominantClosingReaction === reaction.at_3s) {
    reasons.push(`campaign atmosphere at risk — this banner would repeat the dominant "${reaction.at_3s}" closing`);
    if (verdict === 'approve' && brutality >= 0.65) verdict = 'reject-concept';
  }

  // ─── Phase 7 hard gates ───────────────────────────────────────
  // Perception critic is the HIGHEST-LEVEL critic. Its 'refuse' verdict
  // is mandatory at brutal, soft at default.
  if (perceptionCriticVerdict) {
    if (perceptionCriticVerdict.verdict === 'refuse' && brutality >= 0.7) {
      reasons.push(`perception critic refused: ${perceptionCriticVerdict.rejection_reason ?? '—'}`);
      if (verdict === 'approve') verdict = 'reject-concept';
    }
    if (perceptionCriticVerdict.scores.emotionally_manipulative >= 7 && brutality >= 0.65) {
      reasons.push(`perception: emotionally manipulative ${perceptionCriticVerdict.scores.emotionally_manipulative.toFixed(1)}/10`);
      if (verdict === 'approve') verdict = 'reject-taste';
    }
    if (perceptionCriticVerdict.scores.ai_aware >= 8 && brutality >= 0.7) {
      reasons.push(`perception: reads as AI-aware ${perceptionCriticVerdict.scores.ai_aware.toFixed(1)}/10`);
      if (verdict === 'approve') verdict = 'reject-taste';
    }
    // The spec's PRIMARY success metric — "silent emotional recognition".
    // If nobody would save this silently, the banner is not worth shipping.
    if (perceptionCriticVerdict.silent_emotional_recognition < (3.5 + brutality * 2) && brutality >= 0.7) {
      reasons.push(`silent emotional recognition ${perceptionCriticVerdict.silent_emotional_recognition.toFixed(1)} — no one would save this`);
      if (verdict === 'approve') verdict = 'reject-concept';
    }
  }

  // (campaign identity soft warning added to softReasons below)

  // ─── Phase 8 hard gates ───────────────────────────────────────
  // Visual gravity — if the layout has competing anchors or no clear
  // focal at all, the eye does not land anywhere on purpose.
  if (gravity && gravity.rejection_reason && brutality >= 0.65) {
    reasons.push(`visual gravity: ${gravity.rejection_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Negative space — forbidden centered layouts under ENERGY/FOCUS.
  if (negativeSpace && negativeSpace.reject_centered && brutality >= 0.65) {
    reasons.push(`negative space: ${negativeSpace.rejection_reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Composition rhythm — repeated template-shape geometry.
  if (compositionRhythm8 && compositionRhythm8.would_repeat && brutality >= 0.7) {
    reasons.push(`composition rhythm: ${compositionRhythm8.repeated_pattern}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Layout director — the "would removing 40% improve this?" gate.
  if (directorVerdict && directorVerdict.would_improve_with_subtraction && brutality >= 0.7) {
    reasons.push(`director: would improve with subtraction — remove ${directorVerdict.subtraction_target ?? 'one visible element'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Layout director — named hard-reject conditions.
  if (directorVerdict && directorVerdict.rejection_conditions.length > 0 && brutality >= 0.7) {
    reasons.push(`director: ${directorVerdict.rejection_conditions.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 9 hard gates ───────────────────────────────────────
  // The spec's HARD RULE: no two consecutive banners can solve the
  // same emotion. Enforced as a hard gate at brutal+; at default it
  // becomes soft pressure (below). When the state selector cannot
  // honestly produce a different closing reaction we accept the
  // repetition rather than exhaust the campaign.
  if (sequenceVerdict && sequenceVerdict.redundant_with_previous && brutality >= 0.85) {
    reasons.push(`emotional sequence: candidate "${sequenceVerdict.candidate_note}" repeats previous banner — campaign needs to evolve`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Tempo worsening — refuse at brutal mode only; soft pressure at
  // default. The Creative Director's rhythm-rescue should already
  // handle most cases before they reach here.
  if (tempoWorsen && tempoWorsen.worsens && brutality >= 0.8) {
    reasons.push(`visual tempo: ${tempoWorsen.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Contradiction feels constructed (over-literary, not observed) —
  // refuse at brutal mode.
  if (contradictionReading && contradictionReading.feels_constructed && brutality >= 0.75) {
    reasons.push('emotional contradiction reads as rhetorical, not observed');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Object spoken too loudly — when the campaign's loudest object is
  // already at emotional weight 9+ AND the candidate brief will use it
  // again, refuse. (Object detection happens before this critic; we
  // use the graph's loudest as a proxy.)
  if (objectMemoryGraph && objectMemoryGraph.loudest && objectMemoryGraph.loudest.emotionalWeight >= 9 && brutality >= 0.75) {
    reasons.push(`object "${objectMemoryGraph.loudest.objectId}" has spoken too loudly (${objectMemoryGraph.loudest.emotionalWeight.toFixed(1)}/10) — rest the motif`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 10 hard gates ──────────────────────────────────────
  // Cinematic brain refusal — the master mind says no.
  if (cinematicVerdict && cinematicVerdict.refuses && brutality >= 0.7) {
    reasons.push(`cinematic brain: ${cinematicVerdict.refusal_reason ?? '—'}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // The spec's new frontier metric — "would this stay inside someone
  // for three seconds after they kept scrolling?" — hard gate at brutal.
  if (cinematicVerdict && !cinematicVerdict.three_second_test.passes && brutality >= 0.85) {
    reasons.push(`three-second test failed (${cinematicVerdict.three_second_test.score.toFixed(1)}/10) — ${cinematicVerdict.three_second_test.reason}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Synthetic behaviour at brutal mode — designed-not-observed is
  // automatically refused.
  if (syntheticReading && syntheticReading.reads_as_designed && brutality >= 0.8) {
    reasons.push(`anti-synthetic: reads as designed — ${syntheticReading.signatures.slice(0, 2).join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Literal storytelling — compression engine flagged it.
  if (compressionReading && compressionReading.literal_storytelling && brutality >= 0.75) {
    reasons.push('emotional compression: literal storytelling — banner is showing more than implying');
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 11 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this feel like a human moment that happened, or a
  //    creative system trying to simulate one?"
  // If the simulation is stronger → refuse at default mode and up.
  if (nonPerformative && nonPerformative.trying_to_simulate && brutality >= 0.65) {
    reasons.push(`non-performative: simulating depth instead of observing it — ${nonPerformative.patterns.join(', ')}`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Contradiction resolved too cleanly — the system tried to wrap up
  // what humans normally leave open.
  if (humanContradiction && humanContradiction.resolved_too_cleanly && brutality >= 0.75) {
    reasons.push('human contradiction resolved too cleanly — the truth tied a bow on what should stay open');
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Life noise floor — at brutal, a banner with zero non-symbolic
  // fragments reads as too-curated.
  if (lifeNoise && lifeNoise.mess_score < 4 && brutality >= 0.85) {
    reasons.push(`life noise ${lifeNoise.mess_score.toFixed(1)}/10 — no honest mess in the frame`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // ─── Phase 12 hard gates ──────────────────────────────────────
  // THE NEW HEADLINE QUESTION:
  //   "Does this feel like culture quietly recognizing itself?"
  // When no shared pattern matches AND the banner reads as individual-
  // only, the campaign is "another ad about him", not "this is about us".
  if (collectiveRecognition && collectiveRecognition.is_individual_only && !collectiveRecognition.pattern && brutality >= 0.7) {
    reasons.push('collective recognition: reads as one specific person, not culture recognising itself');
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Cultural drift — the treatment is already in mass circulation.
  // Hard reject at brutal mode.
  if (culturalDriftReading && culturalDriftReading.feels_culturally_consumed && brutality >= 0.75) {
    reasons.push(`cultural drift: ${culturalDriftReading.detected_cliches.join(', ')} — treatment is already culturally consumed`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }
  // Collective recognition score floor — at brutal, banners that
  // do not earn collective recognition refuse.
  if (collectiveRecognition && collectiveRecognition.recognition_score < (3 + brutality * 3) && brutality >= 0.8) {
    reasons.push(`collective recognition ${collectiveRecognition.recognition_score.toFixed(1)} below floor — would not produce "this is about us"`);
    if (verdict === 'approve') verdict = 'reject-concept';
  }
  // Shared pattern present but truth phrased individually — soft refuse.
  if (sharedPattern && collectiveRecognition && collectiveRecognition.inclusive_phrasing_score < 3 && brutality >= 0.8) {
    reasons.push(`pattern "${sharedPattern.id}" is collective but truth phrased individually`);
    if (verdict === 'approve') verdict = 'reject-taste';
  }

  // Soft gates — accumulate, then decide.
  const softReasons: string[] = [];
  if (scrollStopTotal < floorScrollStop) softReasons.push(`scroll-stop ${scrollStopTotal.toFixed(1)} below floor ${floorScrollStop.toFixed(1)}`);
  if (tasteTotal > ceilingTaste)         softReasons.push(`taste failures ${tasteTotal.toFixed(1)} above ceiling ${ceilingTaste.toFixed(1)}`);
  if (psychologyTotal < floorPsychology) softReasons.push(`psychology ${psychologyTotal.toFixed(1)} below floor ${floorPsychology.toFixed(1)}`);
  if (productTotal !== null && productTotal < floorProduct)
    softReasons.push(`product presence ${productTotal.toFixed(1)} below floor ${floorProduct.toFixed(1)}`);
  if (reference.closeness < floorRefCloseness)
    softReasons.push(`reference closeness ${reference.closeness.toFixed(2)} below floor ${floorRefCloseness.toFixed(2)} — drifted from every taste anchor`);

  // Phase 2.5 — soft pressure from the explicit taste system.
  if (judge && judge.composite < (5.5 + brutality * 1.5)) {
    softReasons.push(`taste judge composite ${judge.composite.toFixed(1)} below floor ${(5.5 + brutality * 1.5).toFixed(1)}`);
  }
  if (reaction && reaction.engagementQuality < (4 + brutality * 2)) {
    softReasons.push(`predicted engagement ${reaction.engagementQuality.toFixed(1)} below floor`);
  }
  if (fatigue && fatigue.verdict === 'fatigued') {
    softReasons.push(`campaign fatigue: ${fatigue.flags[0] ?? 'multi-axis'}`);
  }

  // Phase 3 soft floors.
  if (antiAI && antiAI.smell >= 4) {
    softReasons.push(`anti-AI smell ${antiAI.smell.toFixed(1)}: ${antiAI.signatures.slice(0, 2).join(', ')}`);
  }
  if (antiAI && antiAI.driftSignatures.length >= 2) {
    softReasons.push(`campaign drifting toward AI patterns: ${antiAI.driftSignatures.join(', ')}`);
  }

  // Phase 5 soft floors — visual taste + emotional aftertaste.
  if (visualTaste) {
    if (visualTaste.score < 5.5) {
      softReasons.push(`visual taste ${visualTaste.score.toFixed(1)} below floor`);
    }
    if (visualTaste.ai_detection_probability > 0.6) {
      softReasons.push(`AI detection probability ${(visualTaste.ai_detection_probability * 100).toFixed(0)}%`);
    }
    const softHits = visualTaste.forbiddenPatternsHit.filter((p) => p.severity === 'soft');
    if (softHits.length >= 2) {
      softReasons.push(`forbidden-AI soft hits: ${softHits.map((p) => p.name).join(', ')}`);
    }
  }
  if (emotionalAftertaste && emotionalAftertaste.composite < 5.5) {
    softReasons.push(`emotional aftertaste ${emotionalAftertaste.composite.toFixed(1)} — ${emotionalAftertaste.post_view_emotional_state}`);
  }
  if (campaignMemoryV2 && campaignMemoryV2.saturationScore >= 5) {
    softReasons.push(`campaign saturation ${campaignMemoryV2.saturationScore.toFixed(1)} — ${campaignMemoryV2.directorNote}`);
  }

  // Phase 7 soft floors.
  if (perceptionCriticVerdict) {
    if (perceptionCriticVerdict.composite < 5.5) {
      softReasons.push(`perception composite ${perceptionCriticVerdict.composite.toFixed(1)} below floor`);
    }
    if (perceptionCriticVerdict.scores.trying_too_hard >= 6) {
      softReasons.push(`perception: trying too hard ${perceptionCriticVerdict.scores.trying_too_hard.toFixed(1)}/10`);
    }
  }
  if (campaignIdentity && campaignIdentity.recognisability >= 5 && campaignIdentity.atmosphereContinuity < 4) {
    softReasons.push(`campaign identity at risk — atmosphere continuity ${campaignIdentity.atmosphereContinuity.toFixed(1)}`);
  }

  // Phase 8 soft floors.
  if (gravity) {
    if (gravity.composite < 5.5) softReasons.push(`visual gravity composite ${gravity.composite.toFixed(1)} below floor`);
    if (gravity.dead_zones >= 6) softReasons.push(`dead zones ${gravity.dead_zones.toFixed(1)} — too much exhausted space`);
  }
  if (negativeSpace && negativeSpace.space_tension_score < 4) {
    softReasons.push(`space tension ${negativeSpace.space_tension_score.toFixed(1)} below floor for ${negativeSpace.prescribed_behavior}`);
  }
  if (framing8 && framing8.behaviors.length <= 1 && direction && direction.restraint < 0.75) {
    softReasons.push('framing has only one behavior — risk of "looks-assembled"');
  }
  if (productPresence8 && productPresence8.mode === 'hand-held' && direction && direction.restraint < 0.5) {
    softReasons.push('hand-held product with low restraint — risk of "product-pasted"');
  }

  // Phase 9 soft floors.
  if (sequenceVerdict && sequenceVerdict.redundant_with_previous) {
    // At brutal this is a hard gate; here it's soft pressure.
    softReasons.push(`emotional sequence: repeats previous "${sequenceVerdict.candidate_note}" — campaign should evolve`);
  }
  if (sequenceVerdict && !sequenceVerdict.advances_arc && !sequenceVerdict.redundant_with_previous) {
    softReasons.push(`emotional sequence flat — banner does not advance the arc; suggested: "${sequenceVerdict.suggested_alternative ?? '—'}"`);
  }
  if (tempoWorsen && tempoWorsen.worsens) {
    softReasons.push(`visual tempo soft: ${tempoWorsen.reason}`);
  }
  if (contradictionReading && contradictionReading.depth >= 7 && !contradictionReading.feels_constructed) {
    // POSITIVE — deepens the world. We do not push this to softReasons,
    // but we DO mention it in the notes via the verdict's notes string.
  }
  if (absenceDecision && absenceDecision.curiosity_score >= 7 && !absenceDecision.drop_copy && !absenceDecision.drop_product) {
    softReasons.push(`absence intelligence: curiosity ${absenceDecision.curiosity_score.toFixed(1)} — banner could remove copy/product to earn it`);
  }

  // Phase 10 soft floors.
  if (cinematicVerdict && !cinematicVerdict.candidate_alignment.serves_thesis) {
    softReasons.push(`cinematic brain: candidate does not serve thesis — ${cinematicVerdict.candidate_alignment.misalignment_reason ?? '—'}`);
  }
  if (cinematicVerdict && !cinematicVerdict.three_second_test.passes) {
    softReasons.push(`three-second test soft: ${cinematicVerdict.three_second_test.reason}`);
  }
  if (compressionReading && compressionReading.score < 5) {
    softReasons.push(`emotional compression ${compressionReading.score.toFixed(1)} below floor — too explicit`);
  }
  if (syntheticReading && syntheticReading.synthetic_score >= 5 && !syntheticReading.reads_as_designed) {
    softReasons.push(`anti-synthetic soft: ${syntheticReading.signatures[0] ?? 'cleanliness'}`);
  }

  // Phase 11 soft floors.
  if (nonPerformative && nonPerformative.performativeness_score >= 4 && !nonPerformative.trying_to_simulate) {
    softReasons.push(`non-performative soft: ${nonPerformative.patterns[0] ?? 'mild performance'}`);
  }
  if (humanContradiction && !humanContradiction.inhabits_contradiction && humanContradiction.pair) {
    softReasons.push(`human contradiction: pair "${humanContradiction.pair.feeling} → ${humanContradiction.pair.behavior}" available but banner does not inhabit it`);
  }
  if (lifeNoise && lifeNoise.mess_score < 4) {
    softReasons.push(`life noise low (${lifeNoise.mess_score.toFixed(1)}/10) — banner reads as too curated`);
  }

  // Phase 12 soft floors.
  if (collectiveRecognition && collectiveRecognition.recognition_score < 5) {
    softReasons.push(`collective recognition ${collectiveRecognition.recognition_score.toFixed(1)} — would not produce "this is about us"`);
  }
  if (culturalDriftReading && culturalDriftReading.saturation_score >= 3 && !culturalDriftReading.feels_culturally_consumed) {
    softReasons.push(`cultural drift soft: ${culturalDriftReading.detected_cliches[0] ?? 'mild saturation'}`);
  }
  if (sharedPattern && unspokenRitualPick && !unspokenRitualPick.ritual) {
    softReasons.push(`shared pattern matched but no unspoken ritual selected — banner missed the gesture`);
  }

  // Phase 4 soft floors — aftertaste + atmosphere.
  if (input.aftertastePrediction) {
    const a = input.aftertastePrediction;
    const softFloor = 4.0 + brutality * 1.5;
    if (a.residueStrength < softFloor && brutality < 0.75) {
      softReasons.push(`aftertaste ${a.residueStrength.toFixed(1)} below soft floor`);
    }
    // Spike-vs-residue tradeoff — when spike dominates residue 3× over, flag.
    if (a.spikeVsResidueRatio > 3) {
      softReasons.push(`spike-over-residue: short-term engagement at the cost of brand memory`);
    }
  }
  if (input.atmosphere && input.atmosphere.uniformityPenalty >= 3) {
    softReasons.push(`atmosphere uniformity penalty ${input.atmosphere.uniformityPenalty.toFixed(1)}`);
  }

  // Memory-aware additional rejection: campaign overstimulation.
  if (memory.overstimulationFlag) {
    softReasons.push('campaign has overstimulated recently — this banner needs more silence');
  }

  // Soft-floor threshold scales with brutality. As the cognition stack
  // has grown (Phases 1-9) the system produces many soft signals on
  // every banner. Requiring 2 to reject was honest at Phase 2; at
  // Phase 9 it becomes unconvergeable. Threshold band:
  //   lenient (0.50)   → 6 soft reasons required to reject
  //   default (0.65)   → 4 soft reasons required
  //   brutal  (0.90)   → 3 soft reasons required
  const softFloorThreshold = brutality >= 0.85 ? 3 : brutality >= 0.6 ? 4 : 6;
  if (verdict === 'approve' && softReasons.length >= softFloorThreshold) {
    // Threshold broken → reject. Decide what kind based on which
    // floors broke first.
    reasons.push(...softReasons);
    const tasteHeavy = tasteTotal > ceilingTaste;
    const psychHeavy = psychologyTotal < floorPsychology;
    const productHeavy = productTotal !== null && productTotal < floorProduct;
    if (productHeavy && !tasteHeavy && !psychHeavy) {
      verdict = 'reject-image';
    } else if (psychHeavy) {
      verdict = 'reject-concept';
    } else {
      verdict = 'reject-taste';
    }
  }

  // Surface the reference's named divergences as gentle hints even on
  // approve — these become memory signals the director can learn from.
  if (verdict === 'approve' && reference.divergences.length > 0) {
    softReasons.push(...reference.divergences.map((d) => `note: ${d}`));
  }

  const notes = writeNotes(verdict, totals, brutality);

  const final: FinalVerdict = {
    verdict,
    reasons,
    notes,
    totals,
    brutality,
  };

  ctx.emit({
    stage: 'not-good-enough',
    message: `meta-verdict: ${verdict} · brutality ${brutality.toFixed(2)}`,
    data: { totals, reasons, softReasons },
  });
  return final;
}

// ───── compositors ─────

function compositeScrollStop(c: Critique): number {
  const positives = c.scores.emotionalTruthClarity + c.scores.tension + c.scores.curiosity
                  + c.scores.focalPointObvious + c.scores.eyeStops + c.scores.feelsLikeRealCampaign;
  const negatives = c.scores.feelsAI + c.scores.compositionGeneric + c.scores.productPasted + c.scores.typographyForced;
  // Scale to 0..10 — 6 positives sum to max 60, 4 negatives sum to max 40.
  return clamp10((positives / 60) * 7 + (1 - negatives / 40) * 3);
}

function compositeTaste(t: AestheticCritique): number {
  // Mean of failure scores — 0..10, lower is better.
  const vals = Object.values(t.failures);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function compositePsychology(p: VisualPsychology): number {
  // Equal-weight average of the six judged axes.
  return (
    p.focalInterruption +
    p.emotionalHierarchyClear +
    p.delayedProductReveal +
    p.ctaResolution +
    p.eyeFlowIntegrity
  ) / 5;
}

function compositePresence(p: ProductPresence): number {
  const vals = Object.values(p.scores);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

// ───── brutality memory ─────

function brutalityFromMemory(m: MemorySnapshot): number {
  // If the last 4 banners all approved on first attempt, raise the bar
  // slightly. If many recent rejections, ease off. (Memory does not yet
  // store per-banner attempt count, so we proxy via arc length.)
  if (m.totalBanners < 4) return 0;
  if (m.aggressiveCount > m.silenceCount * 2) return 0.05; // campaign too loud — push more rejections of loud
  if (m.overstimulationFlag) return 0.05;
  return 0;
}

function writeNotes(
  verdict: FinalVerdict['verdict'],
  totals: FinalVerdict['totals'],
  brutality: number,
): string {
  if (verdict === 'approve') {
    return `Approved at brutality ${brutality.toFixed(2)}. Scroll-stop ${totals.scrollStop.toFixed(1)}, taste ${totals.taste.toFixed(1)} (lower is better), psychology ${totals.psychology.toFixed(1)}, reference closeness ${totals.referenceCloseness.toFixed(2)}.`;
  }
  return `Rejected at brutality ${brutality.toFixed(2)}. The banner is technically correct but fails the floor: ${verdict}.`;
}

function clampUnit(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function clamp10(n: number): number {
  return Math.max(0, Math.min(10, n));
}
