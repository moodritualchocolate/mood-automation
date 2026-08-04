/**
 * CINEMATIC BRAIN (Phase 10) — the unified directorial mind.
 *
 * This is NOT another layer.
 *
 * It reads every prior phase's output and synthesises ONE directorial
 * decision — what the campaign is BECOMING — plus a set of PERMISSIONS
 * the Creative Director honours and the meta-critic respects.
 *
 * Inputs (campaign-level):
 *   - emotional trail / aftertaste records
 *   - campaign timeline + unresolved emotion
 *   - world persistence + object memory graph
 *   - campaign identity + subconscious recognition
 *   - rhythm + visual tempo
 *   - perception critic verdicts so far
 *
 * Inputs (per-banner — used to validate the candidate against the
 * thesis):
 *   - emotional aftertaste prediction
 *   - emotional contradiction reading
 *   - emotional compression reading
 *   - synthetic behaviour reading
 *
 * Outputs:
 *   - campaign_emotional_thesis   — one sentence answering "what is
 *                                   this campaign becoming?"
 *   - emotional_trajectory        — escalating / quieting / drifting /
 *                                   resolving / re-opening
 *   - permissions                 — what the next banner is ALLOWED
 *                                   to do
 *   - candidate_alignment         — does the candidate banner SERVE
 *                                   the thesis?
 *   - three_second_test           — would this stay inside someone
 *                                   3 seconds after they scrolled past?
 *
 * The cinematicBrain refuses banners that would betray the thesis.
 */

import type { EmotionalTraceEntry } from './humanMemory';
import type { CampaignTimeline } from './campaignTimeline';
import type { UnresolvedReport } from './unresolvedEmotion';
import type { WorldDNA } from './worldPersistence';
import type { ObjectMemoryGraph } from './objectMemoryGraph';
import type { CampaignIdentity } from './campaignIdentity';
import type { RecognitionReport } from './subconsciousRecognition';
import type { TempoReport } from './visualTempo';
import type { EmotionalAftertaste } from './emotionalAftertaste';
import type { ContradictionReading } from './emotionalContradiction';
import type { CompressionReading } from './emotionalCompression';
import type { SyntheticReading } from './antiSyntheticBehavior';

export interface CinematicPermissions {
  visual_restraint_floor: number;       // 0..1 — minimum restraint
  pacing: 'breath' | 'quiet' | 'slow-interruption' | 'staccato' | 'wired';
  escalation_permission: boolean;       // can this banner escalate?
  silence_permission: 'forbidden' | 'allowed' | 'preferred' | 'mandated';
  product_visibility_permission: 'absent' | 'evidence-only' | 'partial' | 'visible';
  typography_aggression_ceiling: number; // 0..10
  emotional_temperature: 'warm' | 'cool' | 'flat' | 'mixed';
  world_decay_mode: 'introduce-new' | 'deepen-existing' | 'rest-the-world';
  memory_residue_strategy: 'extend-unresolved' | 'open-new-thread' | 'close-existing' | 'quiet-pause';
}

export interface ThreeSecondTest {
  passes: boolean;
  score: number;                        // 0..10
  reason: string;
}

export interface CinematicVerdict {
  campaign_emotional_thesis: string;
  emotional_trajectory: 'opening' | 'escalating' | 'quieting' | 'drifting' | 'resolving' | 're-opening' | 'haunting';
  permissions: CinematicPermissions;
  /** Does the candidate banner SERVE the thesis? */
  candidate_alignment: {
    serves_thesis: boolean;
    aligned_score: number;              // 0..10
    misalignment_reason: string | null;
  };
  /** The spec's frontier metric. */
  three_second_test: ThreeSecondTest;
  /** Single hard refusal — fires when the candidate betrays the
   *  thesis materially. */
  refuses: boolean;
  refusal_reason: string | null;
  director_voice: string;
}

export interface CinematicInput {
  // Campaign-level
  trail: EmotionalTraceEntry[];
  timeline: CampaignTimeline;
  unresolved: UnresolvedReport;
  worldDNA: WorldDNA;
  objectGraph: ObjectMemoryGraph;
  campaignIdentity: CampaignIdentity;
  subconsciousRecognition: RecognitionReport;
  tempo: TempoReport;
  // Per-candidate
  candidateAftertaste: EmotionalAftertaste;
  candidateContradiction: ContradictionReading;
  candidateCompression: CompressionReading;
  candidateSynthetic: SyntheticReading;
  candidateNote: string;
}

export function decideCinematicVerdict(input: CinematicInput): CinematicVerdict {
  const {
    trail, timeline, unresolved, worldDNA, objectGraph,
    campaignIdentity, subconsciousRecognition, tempo,
    candidateAftertaste, candidateContradiction, candidateCompression, candidateSynthetic, candidateNote,
  } = input;

  // ─── thesis & trajectory ──────────────────────────────────────
  const trajectory = readTrajectory(timeline, tempo, unresolved);
  const thesis = writeThesis({
    trail, timeline, unresolved, campaignIdentity, subconsciousRecognition,
    objectGraph, trajectory,
  });

  // ─── permissions ──────────────────────────────────────────────
  const permissions = buildPermissions({
    trajectory, tempo, unresolved, worldDNA, subconsciousRecognition, campaignIdentity, timeline,
  });

  // ─── candidate alignment ──────────────────────────────────────
  const alignment = scoreCandidateAlignment({
    permissions, candidateNote, unresolved, candidateContradiction, candidateCompression, candidateSynthetic, candidateAftertaste,
  });

  // ─── three-second test ────────────────────────────────────────
  // "Would this stay inside someone for three seconds AFTER they
  // scrolled past?" — synthesises residue + compression + contradiction
  // + anti-synthetic. The viewer keeps it when:
  //   - the contradiction is real (depth >= 6, not constructed)
  //   - compression is dense (score >= 6)
  //   - the banner is NOT synthetic (synthetic_score < 5)
  //   - the aftertaste composite >= 6
  let three_second_score = 0;
  if (candidateContradiction.depth >= 6 && !candidateContradiction.feels_constructed) three_second_score += 2.5;
  if (candidateCompression.score >= 6) three_second_score += 2.5;
  if (candidateSynthetic.synthetic_score < 5) three_second_score += 2.5;
  if (candidateAftertaste.composite >= 6) three_second_score += 2.5;
  const three_second_test: ThreeSecondTest = {
    passes: three_second_score >= 6,
    score: three_second_score,
    reason: three_second_score >= 8
      ? 'this would stay inside the viewer past the scroll'
      : three_second_score >= 6
        ? 'this could linger — depends on the viewer'
        : 'viewer would have already forgotten by the next banner',
  };

  // ─── refusal — the brain refuses when alignment is poor AND the
  //               three-second test fails AND the candidate is
  //               synthetic.
  let refuses = false;
  let refusal_reason: string | null = null;
  if (alignment.misalignment_reason && !three_second_test.passes && candidateSynthetic.reads_as_designed) {
    refuses = true;
    refusal_reason = `cinematic brain refuses — banner serves no part of the unfinished sentence, fails the three-second test, AND reads as designed`;
  }

  // ─── director voice (one line) ────────────────────────────────
  const director_voice = writeDirectorVoice({
    thesis, trajectory, alignment, three_second_test, refuses,
  });

  return {
    campaign_emotional_thesis: thesis,
    emotional_trajectory: trajectory,
    permissions,
    candidate_alignment: alignment,
    three_second_test,
    refuses,
    refusal_reason,
    director_voice,
  };
}

// ────────────────────────────────────────────────────────────────
// helpers
// ────────────────────────────────────────────────────────────────

function readTrajectory(timeline: CampaignTimeline, tempo: TempoReport, unresolved: UnresolvedReport): CinematicVerdict['emotional_trajectory'] {
  if (timeline.entries.length === 0) return 'opening';
  if (unresolved.campaign_over_resolved) return 're-opening';
  if (tempo.needs_breath_next || tempo.axes.silence_weight < 0.4) return 'escalating';
  if (tempo.axes.silence_weight > 0.75 && tempo.axes.visual_loudness < 0.3) return 'quieting';
  // Did the last 3 banners progress along the arc?
  const last3 = timeline.entries.slice(-3).map((e) => e.note);
  const unique = new Set(last3).size;
  if (unique <= 1) return 'drifting';
  if (last3.includes('aftermath') || last3.includes('recovery')) return 'resolving';
  if (unresolved.most_active && unresolved.most_active.pressure >= 6) return 'haunting';
  return 'escalating';
}

function writeThesis(args: {
  trail: EmotionalTraceEntry[];
  timeline: CampaignTimeline;
  unresolved: UnresolvedReport;
  campaignIdentity: CampaignIdentity;
  subconsciousRecognition: RecognitionReport;
  objectGraph: ObjectMemoryGraph;
  trajectory: CinematicVerdict['emotional_trajectory'];
}): string {
  const { trail, unresolved, campaignIdentity, subconsciousRecognition, objectGraph, trajectory } = args;

  if (trail.length === 0) {
    return 'campaign has not opened yet — the thesis will form once a tension is named';
  }

  const voice = campaignIdentity.dominantEmotionalVoice ?? 'no clear voice yet';
  const loudest = objectGraph.loudest ? objectGraph.loudest.currentLoadedMeaning : null;
  const recogPhrase = subconsciousRecognition.recognisable_without_logo
    ? 'world is becoming recognisable without a logo'
    : 'world still forming a signature';

  const parts: string[] = [];
  parts.push(`This campaign is about ${voice}, ${trajectory}.`);
  if (unresolved.most_active) parts.push(`The unfinished sentence: ${unresolved.most_active.description}.`);
  if (loudest) parts.push(`The motif the campaign keeps returning to: ${loudest}.`);
  parts.push(recogPhrase + '.');
  return parts.join(' ');
}

function buildPermissions(args: {
  trajectory: CinematicVerdict['emotional_trajectory'];
  tempo: TempoReport;
  unresolved: UnresolvedReport;
  worldDNA: WorldDNA;
  subconsciousRecognition: RecognitionReport;
  campaignIdentity: CampaignIdentity;
  timeline: CampaignTimeline;
}): CinematicPermissions {
  const { trajectory, tempo, unresolved, worldDNA, subconsciousRecognition, campaignIdentity } = args;

  const visual_restraint_floor =
    trajectory === 'quieting' || trajectory === 'haunting' ? 0.78
    : trajectory === 'escalating' ? 0.45
    : trajectory === 'opening' ? 0.55
    : 0.62;

  const pacing: CinematicPermissions['pacing'] =
    trajectory === 'quieting' || trajectory === 'resolving' ? 'breath'
    : trajectory === 'haunting' ? 'quiet'
    : trajectory === 'escalating' ? 'staccato'
    : trajectory === 're-opening' ? 'slow-interruption'
    : 'slow-interruption';

  const escalation_permission =
    trajectory === 'escalating' || trajectory === 're-opening' || trajectory === 'opening';

  const silence_permission: CinematicPermissions['silence_permission'] =
    trajectory === 'quieting' || trajectory === 'haunting' ? 'mandated'
    : trajectory === 'resolving' ? 'preferred'
    : tempo.advisory.silence_weight === 'lower' ? 'forbidden'
    : 'allowed';

  const product_visibility_permission: CinematicPermissions['product_visibility_permission'] =
    tempo.advisory.object_pressure === 'lower' ? 'absent'
    : trajectory === 'haunting' || trajectory === 'quieting' ? 'evidence-only'
    : trajectory === 'escalating' ? 'partial'
    : 'visible';

  const typography_aggression_ceiling =
    silence_permission === 'mandated' ? 3
    : silence_permission === 'preferred' ? 5
    : trajectory === 'escalating' ? 9
    : 7;

  const temperatureBalance = worldDNA.emotionalTemperature;
  let emotional_temperature: CinematicPermissions['emotional_temperature'] = 'mixed';
  if (temperatureBalance.warm > temperatureBalance.cool * 2) emotional_temperature = 'cool';   // counter-balance
  else if (temperatureBalance.cool > temperatureBalance.warm * 2) emotional_temperature = 'warm';
  else if (temperatureBalance.flat > Math.max(temperatureBalance.warm, temperatureBalance.cool)) emotional_temperature = 'flat';

  // World decay / evolution.
  const world_decay_mode: CinematicPermissions['world_decay_mode'] =
    subconsciousRecognition.recognition_score < 4 ? 'introduce-new'
    : subconsciousRecognition.recognition_score >= 7 && unresolved.most_active === null ? 'rest-the-world'
    : 'deepen-existing';

  // Residue strategy.
  const memory_residue_strategy: CinematicPermissions['memory_residue_strategy'] =
    unresolved.most_active && unresolved.most_active.pressure >= 6 ? 'extend-unresolved'
    : unresolved.campaign_over_resolved ? 'open-new-thread'
    : trajectory === 'resolving' ? 'close-existing'
    : trajectory === 'quieting' ? 'quiet-pause'
    : 'extend-unresolved';

  void campaignIdentity;
  return {
    visual_restraint_floor,
    pacing,
    escalation_permission,
    silence_permission,
    product_visibility_permission,
    typography_aggression_ceiling,
    emotional_temperature,
    world_decay_mode,
    memory_residue_strategy,
  };
}

function scoreCandidateAlignment(args: {
  permissions: CinematicPermissions;
  candidateNote: string;
  unresolved: UnresolvedReport;
  candidateContradiction: ContradictionReading;
  candidateCompression: CompressionReading;
  candidateSynthetic: SyntheticReading;
  candidateAftertaste: EmotionalAftertaste;
}): CinematicVerdict['candidate_alignment'] {
  const { permissions, candidateNote, unresolved, candidateContradiction, candidateCompression, candidateSynthetic, candidateAftertaste } = args;

  let aligned_score = 5;
  let misalignment_reason: string | null = null;

  // Memory residue strategy: extend-unresolved → candidate must inherit
  // an unfinished beat (a contradiction OR carry a similar note).
  if (permissions.memory_residue_strategy === 'extend-unresolved' && unresolved.most_active) {
    if (candidateContradiction.the_contradiction || candidateCompression.score >= 6) {
      aligned_score += 2;
    } else {
      aligned_score -= 1.5;
      misalignment_reason = `brain wants to extend "${unresolved.most_active.description}" but candidate contributes no contradiction or compression`;
    }
  }
  // Quiet-pause: candidate should not be loud / not aggressive.
  if (permissions.memory_residue_strategy === 'quiet-pause' && candidateCompression.shown_emotions.includes('headline-shouting')) {
    aligned_score -= 2;
    misalignment_reason = 'brain wanted a quiet pause; candidate is loud';
  }
  // Anti-synthetic alignment: even if everything else is fine, a designed
  // banner is an alignment failure.
  if (candidateSynthetic.reads_as_designed) {
    aligned_score -= 2;
    misalignment_reason = misalignment_reason ?? 'candidate reads as designed';
  }
  // Compression alignment: a literal-storytelling banner is a misalignment.
  if (candidateCompression.literal_storytelling) {
    aligned_score -= 1.5;
    misalignment_reason = misalignment_reason ?? 'candidate explains instead of implies';
  }
  // Aftertaste alignment.
  if (candidateAftertaste.composite < 5) {
    aligned_score -= 1;
  } else if (candidateAftertaste.composite >= 7) {
    aligned_score += 1.5;
  }

  aligned_score = Math.max(0, Math.min(10, aligned_score));
  void candidateNote;
  return { serves_thesis: aligned_score >= 5.5, aligned_score, misalignment_reason };
}

function writeDirectorVoice(args: {
  thesis: string;
  trajectory: CinematicVerdict['emotional_trajectory'];
  alignment: CinematicVerdict['candidate_alignment'];
  three_second_test: ThreeSecondTest;
  refuses: boolean;
}): string {
  const { trajectory, alignment, three_second_test, refuses } = args;
  if (refuses) return `cinematic brain refuses: ${alignment.misalignment_reason ?? 'misalignment'} · ${three_second_test.reason}`;
  if (alignment.serves_thesis && three_second_test.passes) return `serves the campaign (${trajectory}) · ${three_second_test.reason}`;
  if (alignment.serves_thesis) return `serves the campaign (${trajectory}) but may not linger`;
  if (three_second_test.passes) return `would linger — but does not serve the thesis (${trajectory})`;
  return `holds together; nothing exceptional · ${trajectory}`;
}
