/**
 * REALITY VERIFICATION (Phase 15)
 *
 * Reads the engagement signals + emotional-comment text and asks:
 *
 *   "Did real audience behaviour later confirm this emotional truth?"
 *
 * Different from Phase 4's emotionalOutcome (which scored whether
 * the predicted reaction matched observed). This module asks the
 * deeper question — did the audience produce the SIGNATURE
 * RECOGNITION behaviours that prove the truth landed?
 *
 *   saves                   — kept it to come back to
 *   rewatches / replays     — watched it again on purpose
 *   shares without CTA      — sent it to someone they know
 *   emotional comments:
 *     "this is literally me"
 *     "why is this so accurate"
 *     "I thought I was the only one"
 *
 * The output weight is RECOGNITION over engagement.
 */

import type { BannerEngagement } from './engagementMemory';

export interface RealityVerificationReading {
  /** True when the engagement signals indicate the truth was
   *  confirmed by real audience recognition. */
  reality_confirmed: boolean;
  /** 0..10 — how strongly reality confirmed it. */
  confirmation_strength: number;
  /** The named signature behaviours present. */
  recognition_signals: string[];
  /** Specific comment-text patterns matched (when text is available). */
  matched_comment_patterns: string[];
  /** Per-impression rates, for transparency. */
  rates: {
    save_rate: number;
    share_rate: number;
    replay_rate: number;
    emotional_comment_rate: number;
    negative_rate: number;
  };
  notes: string[];
}

const RECOGNITION_TEXT_PATTERNS: Array<{ pattern: RegExp; signature: string }> = [
  { pattern: /\b(literally me|this is me|i feel seen|so accurate|so true|too accurate|stop it.*literally|this is so accurate)\b/i, signature: 'literally-me' },
  { pattern: /\b(why is this so accurate|how did you know|how did they know|how is this so accurate)\b/i, signature: 'how-did-you-know' },
  { pattern: /\b(i thought i was the only one|nice to know.*not alone|same here|me too)\b/i, signature: 'not-alone' },
  { pattern: /\b(this hit different|this hits different|this hits hard|hit too close|hits too close)\b/i, signature: 'hit-different' },
  { pattern: /\b(needed this|needed to see this|saving this|gonna come back to this)\b/i, signature: 'needed-this' },
  { pattern: /\b(שייכ|זה אני|זה ממש אני|למה זה כל כך אמיתי|איך ידעתם|רואים אותי)\b/i, signature: 'recognition-hebrew' },
];

export interface RealityVerificationInput {
  engagement: BannerEngagement | null;
  minImpressionsForReliability?: number;
}

export function verifyReality(input: RealityVerificationInput): RealityVerificationReading {
  const { engagement, minImpressionsForReliability = 20 } = input;
  const notes: string[] = [];

  if (!engagement || engagement.totals.impressions < minImpressionsForReliability) {
    return {
      reality_confirmed: false,
      confirmation_strength: 0,
      recognition_signals: [],
      matched_comment_patterns: [],
      rates: { save_rate: 0, share_rate: 0, replay_rate: 0, emotional_comment_rate: 0, negative_rate: 0 },
      notes: ['not enough audience signal to verify reality yet'],
    };
  }

  const t = engagement.totals;
  const imps = Math.max(1, t.impressions);
  const rates = {
    save_rate: t.saves / imps,
    share_rate: t.shares / imps,
    replay_rate: t.replays / imps,
    emotional_comment_rate: t.emotionalComments / imps,
    negative_rate: t.negative / imps,
  };

  // ─── recognition signals ──────────────────────────────────────
  const recognition_signals: string[] = [];

  // Saves are the strongest signal — somebody saved this to look at again.
  if (rates.save_rate >= 0.04) recognition_signals.push(`save rate ${(rates.save_rate * 100).toFixed(1)}% — viewers keep this`);

  // Shares without a CTA = pure recognition share.
  // (We do not store cta-attribution on shares; high share rate is a proxy.)
  if (rates.share_rate >= 0.03) recognition_signals.push(`share rate ${(rates.share_rate * 100).toFixed(1)}% — viewers send this to people they know`);

  // Replays = watched again on purpose.
  if (rates.replay_rate >= 0.02) recognition_signals.push(`replay rate ${(rates.replay_rate * 100).toFixed(1)}% — viewers watched again`);

  // Emotional comments — the strongest verbal signal.
  if (rates.emotional_comment_rate >= 0.02) recognition_signals.push(`${(rates.emotional_comment_rate * 100).toFixed(1)}% emotional comments`);

  // ─── matched comment patterns ─────────────────────────────────
  const matched_comment_patterns: string[] = [];
  for (const signal of engagement.signals) {
    if ((signal.kind === 'comment' || signal.kind === 'emotional-comment') && signal.text) {
      for (const { pattern, signature } of RECOGNITION_TEXT_PATTERNS) {
        if (pattern.test(signal.text) && !matched_comment_patterns.includes(signature)) {
          matched_comment_patterns.push(signature);
        }
      }
    }
  }
  if (matched_comment_patterns.length > 0) {
    notes.push(`comment patterns matched: ${matched_comment_patterns.join(', ')}`);
  }

  // ─── confirmation strength ────────────────────────────────────
  let strength = 0;
  strength += Math.min(3, rates.save_rate * 60);            // up to 3 from saves
  strength += Math.min(2.5, rates.share_rate * 50);         // up to 2.5 from shares
  strength += Math.min(2, rates.replay_rate * 80);          // up to 2 from replays
  strength += Math.min(2, rates.emotional_comment_rate * 80); // up to 2 from emotional comments
  strength += matched_comment_patterns.length * 0.8;        // each matched recognition phrase
  strength -= Math.min(3, rates.negative_rate * 60);        // negative reactions pull down

  const confirmation_strength = Math.max(0, Math.min(10, strength));
  const reality_confirmed = confirmation_strength >= 6;

  if (reality_confirmed) notes.push('reality confirmed — audience produced the signature recognition behaviours');
  else if (confirmation_strength >= 4) notes.push('partial confirmation — some signals of recognition present');
  else if (rates.negative_rate >= 0.04) notes.push('reality contradicted — audience reacted negatively');
  else if (notes.length === 0) notes.push('reality has not confirmed this truth yet');

  return {
    reality_confirmed,
    confirmation_strength,
    recognition_signals,
    matched_comment_patterns,
    rates,
    notes,
  };
}
