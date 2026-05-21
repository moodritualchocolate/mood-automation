/**
 * EMOTIONAL OUTCOME MAPPING
 *
 * The system should ask: "What emotion did this ACTUALLY produce?"
 * not "What score did the critic give?"
 *
 * We infer the actual outcome from the ingested signal mix and
 * compare it to the prediction the human-reaction simulator made
 * BEFORE the banner shipped. The divergence is the learning signal.
 *
 * Mapping heuristic — based on the dominant signal types per impression:
 *
 *   high emotional comments + saves       → 'intimacy' / 'recognition'
 *   high shares + replays                 → 'emotional tension'
 *   high CTR with low save/share          → 'aspiration'
 *   high pauses + low save                → 'curiosity'
 *   high negative reactions               → 'rejection' / 'discomfort'
 *   short watch + low everything          → 'indifference'
 *
 * The divergence between predicted and observed is stored so the
 * system can later improve its predictor — and so the meta-critic
 * can lower its confidence in patterns that systematically over-predict.
 */

import type { BannerEngagement } from './engagementMemory';
import type { Reaction } from './humanReaction';

export interface EmotionalOutcome {
  observedReaction: Reaction;
  observedConfidence: number;     // 0..1, low when impressions are scarce
  divergenceFromPrediction: 'aligned' | 'soft-miss' | 'hard-miss';
  divergenceNotes: string[];
}

export function mapEmotionalOutcome(args: {
  engagement: BannerEngagement | null;
  predictedReactionAt3s: Reaction;
}): EmotionalOutcome | null {
  const { engagement, predictedReactionAt3s } = args;
  if (!engagement || engagement.totals.impressions < 20) {
    return null; // not enough signal yet
  }
  const t = engagement.totals;
  const imps = Math.max(1, t.impressions);

  // Normalised rates per impression.
  const rSave = t.saves / imps;
  const rShare = t.shares / imps;
  const rEmo = t.emotionalComments / imps;
  const rPause = t.pauses / imps;
  const rReplay = t.replays / imps;
  const rClick = t.clicks / imps;
  const rNeg = t.negative / imps;
  const watchAvg = t.watchSecAvg;

  // Decide the observed reaction by argmax across coarse heuristics.
  // The thresholds are intentionally generous — we are mapping
  // qualitative behaviour, not predicting clicks.
  let observedReaction: Reaction = 'recognition';
  let confidence = 0.4;

  if (rNeg > 0.05) {
    observedReaction = 'rejection';
    confidence = clamp01(0.5 + rNeg * 6);
  } else if (rNeg > 0.025) {
    observedReaction = 'discomfort';
    confidence = clamp01(0.4 + rNeg * 8);
  } else if (rEmo > 0.025) {
    observedReaction = rSave > 0.04 ? 'intimacy' : 'recognition';
    confidence = clamp01(0.5 + rEmo * 12);
  } else if (rShare > 0.04 && rReplay > 0.02) {
    observedReaction = 'emotional tension';
    confidence = clamp01(0.55 + rShare * 5);
  } else if (rPause > 0.05 && rSave < 0.02) {
    observedReaction = 'curiosity';
    confidence = clamp01(0.45 + rPause * 4);
  } else if (rClick > 0.07 && rSave < 0.03) {
    observedReaction = 'aspiration';
    confidence = clamp01(0.4 + rClick * 4);
  } else if (rSave > 0.04) {
    observedReaction = 'validation';
    confidence = clamp01(0.45 + rSave * 4);
  } else if (watchAvg < 0.8 && rSave < 0.01 && rShare < 0.01) {
    observedReaction = 'indifference';
    confidence = 0.65;
  } else {
    observedReaction = 'recognition';
    confidence = 0.5;
  }

  // Compare to prediction.
  const aligned = observedReaction === predictedReactionAt3s;
  let divergence: EmotionalOutcome['divergenceFromPrediction'];
  if (aligned) {
    divergence = 'aligned';
  } else if (sameValence(observedReaction, predictedReactionAt3s)) {
    divergence = 'soft-miss';
  } else {
    divergence = 'hard-miss';
  }

  const divergenceNotes: string[] = [];
  if (divergence === 'hard-miss') {
    divergenceNotes.push(`predicted "${predictedReactionAt3s}" but observed "${observedReaction}" — opposite valence`);
  } else if (divergence === 'soft-miss') {
    divergenceNotes.push(`predicted "${predictedReactionAt3s}", observed "${observedReaction}" — same direction, different intensity`);
  }
  if (rNeg > 0.04) divergenceNotes.push(`negative reactions are unusually high (${(rNeg * 100).toFixed(1)}%)`);
  if (rEmo > 0.04) divergenceNotes.push(`emotional comments unusually high — banner produced more feeling than predicted`);

  return { observedReaction, observedConfidence: confidence, divergenceFromPrediction: divergence, divergenceNotes };
}

const POSITIVE_VALENCE: Reaction[] = ['recognition', 'intimacy', 'validation', 'aspiration', 'curiosity', 'emotional tension', 'interruption'];
const NEGATIVE_VALENCE: Reaction[] = ['indifference', 'rejection', 'discomfort', 'confusion'];

function sameValence(a: Reaction, b: Reaction): boolean {
  const aPos = POSITIVE_VALENCE.includes(a);
  const bPos = POSITIVE_VALENCE.includes(b);
  return aPos === bPos;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}
