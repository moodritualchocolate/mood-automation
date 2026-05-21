/**
 * VISUAL TASTE ENGINE (Phase 5)
 *
 * This is NOT image quality. This is TASTE.
 *
 * Returns a single verdict shape with the spec's required fields:
 *   { score, emotional_honesty, ai_detection_probability,
 *     restraint_score, silence_score, framing_realism,
 *     premium_authenticity, campaign_belonging,
 *     atmosphere_integrity, rejection_reason }
 *
 * The engine combines:
 *  - the existing TasteJudge composite (Phase 2.5)
 *  - the explicit forbidden-AI-patterns detector (Phase 5 data)
 *  - the DNA fingerprint (Phase 2.5)
 *  - the emotional-core fit (Phase 5 — does the truth still resemble
 *    the emotional core it was supposed to express?)
 *
 * The verdict produces a top-level rejection_reason when the engine
 * decides the banner would not survive a creative director's eye.
 */

import type { CreativeDirection, TypographyPlan } from '@/core/types';
import type { ReferenceDNA } from './referenceDNA';
import type { EmotionalCore } from './humanTruthEngine';
import { detectForbiddenPatterns, type ForbiddenPattern } from '@data/forbidden-ai-patterns';

export interface VisualTasteVerdict {
  /** Composite 0..10 — high is good. */
  score: number;
  emotional_honesty: number;        // 0..10
  ai_detection_probability: number; // 0..1 — higher = more AI-feeling
  restraint_score: number;          // 0..10
  silence_score: number;            // 0..10
  framing_realism: number;          // 0..10
  premium_authenticity: number;     // 0..10
  campaign_belonging: number;       // 0..10 — does it fit the campaign atmosphere
  atmosphere_integrity: number;     // 0..10 — would adding this banner damage the campaign atmosphere
  rejection_reason: string | null;
  forbiddenPatternsHit: ForbiddenPattern[];
  notes: string[];
}

export interface VisualTasteInput {
  direction: CreativeDirection;
  typography: TypographyPlan;
  bannerDNA: ReferenceDNA;
  truth: { truth: string; tension: string };
  timeAnchor: string | null;
  imageProvider: string;
  /** Set when the upstream truth was grounded in a specific emotional core. */
  emotionalCore: EmotionalCore | null;
  /** Reference closeness from Phase 2 (0..1). */
  referenceCloseness: number;
  /** Atmosphere consistency reading at this moment (0..10). */
  atmosphereConsistency: number | null;
}

export function scoreVisualTaste(input: VisualTasteInput): VisualTasteVerdict {
  const {
    direction, typography, bannerDNA, truth, timeAnchor, imageProvider,
    emotionalCore, referenceCloseness, atmosphereConsistency,
  } = input;

  const notes: string[] = [];

  // ─── Forbidden-AI patterns ─────────────────────────────────────
  const patterns = detectForbiddenPatterns({
    direction, typography, dna: bannerDNA,
    truthText: truth.truth, timeAnchor, imageProvider,
  });
  const hardHits = patterns.filter((p) => p.severity === 'hard');
  const softHits = patterns.filter((p) => p.severity === 'soft');

  // ─── Per-axis scoring ──────────────────────────────────────────
  // Emotional honesty: does the banner's surface still feel like the
  // emotional core it claims to express?
  let emotional_honesty = 5;
  if (emotionalCore) {
    // Each axis of the core has a forbidden-tone list — penalise if the
    // truth contains any banned tone, reward if the typography behavior
    // matches the core's prescribed behavior.
    const lowerTruth = truth.truth.toLowerCase();
    const bannedHit = emotionalCore.forbidden_tones.find((t) => lowerTruth.includes(t.toLowerCase()));
    if (bannedHit) {
      emotional_honesty -= 4;
      notes.push(`emotional core "${emotionalCore.id}" forbids tone "${bannedHit}" — present in truth`);
    } else {
      emotional_honesty += 2;
    }
    if (direction.typographyDominance === emotionalCore.typography_behavior ||
        (emotionalCore.typography_behavior === 'restrained-oversized' && direction.typographyDominance === 'editorial')) {
      emotional_honesty += 2;
    }
    if (direction.productRole === emotionalCore.product_role) {
      emotional_honesty += 1;
    }
  } else {
    notes.push('no emotional core mapped — emotional_honesty is undetermined');
    emotional_honesty = 5;
  }
  emotional_honesty = clamp10(emotional_honesty);

  // AI detection probability: composite of bannerDNA anti_commercial_feel
  // (lower = more ad-like), realism_type, documentary_weight, plus
  // every forbidden hit raising the smell.
  const adAdjacent = 1 - bannerDNA.anti_commercial_feel;
  const lowRealism = 1 - bannerDNA.realism_type;
  let aiProb = (adAdjacent * 0.3) + (lowRealism * 0.3);
  aiProb += hardHits.length * 0.15;
  aiProb += softHits.length * 0.06;
  aiProb = clampUnit(aiProb);

  // Restraint score directly mirrors direction.restraint with a small
  // adjustment for typography density.
  const typoLoud = direction.typographyDominance === 'loud' ? 0.15 : 0;
  const restraint_score = clamp10(direction.restraint * 9 - typoLoud * 10);

  // Silence score: silence_ratio + negative_space_usage.
  const silence_score = clamp10(bannerDNA.silence_ratio * 6 + bannerDNA.negative_space_usage * 4);

  // Framing realism: realism_type + documentary_weight + camera_energy.
  const framing_realism = clamp10(
    bannerDNA.realism_type * 4 + bannerDNA.documentary_weight * 4 + bannerDNA.camera_energy * 2,
  );

  // Premium authenticity: restraint + anti_commercial_feel + documentary, MINUS
  // a heavy penalty for fake-luxury-minimalism hits.
  const fakeLuxuryHit = patterns.some((p) => p.id === 'fake-luxury-minimalism');
  const premium_authenticity = clamp10(
    direction.restraint * 5 + bannerDNA.anti_commercial_feel * 3 + bannerDNA.documentary_weight * 2
    - (fakeLuxuryHit ? 4 : 0),
  );

  // Campaign belonging — reference closeness from the Phase 2 anchors.
  const campaign_belonging = clamp10(referenceCloseness * 12);

  // Atmosphere integrity: derived from the atmosphereConsistency reading
  // if provided, otherwise neutral. Banners that would tank the
  // atmosphere should score low here.
  const atmosphere_integrity = atmosphereConsistency === null
    ? 6
    : clamp10(atmosphereConsistency * 0.9 + (1 - aiProb) * 1.5);

  // ─── Composite score ───────────────────────────────────────────
  const positives = [
    emotional_honesty, restraint_score, silence_score, framing_realism,
    premium_authenticity, campaign_belonging, atmosphere_integrity,
  ];
  const positiveAvg = positives.reduce((a, b) => a + b, 0) / positives.length;
  const score = clamp10(positiveAvg * (1 - aiProb * 0.4));

  // ─── Rejection reason ──────────────────────────────────────────
  let rejection_reason: string | null = null;
  if (hardHits.length > 0) {
    rejection_reason = `forbidden AI pattern: ${hardHits[0].name} — ${hardHits[0].director_note}`;
  } else if (aiProb > 0.72) {
    rejection_reason = `AI-detection probability ${(aiProb * 100).toFixed(0)}% — reads as machine output`;
  } else if (emotional_honesty <= 3) {
    rejection_reason = `banner contradicts its emotional core (${emotionalCore?.id ?? '—'})`;
  } else if (score < 4.5 && hardHits.length === 0) {
    rejection_reason = `composite taste score ${score.toFixed(1)} below floor`;
  }

  if (notes.length === 0 && rejection_reason === null) notes.push('passes visual taste');

  return {
    score,
    emotional_honesty,
    ai_detection_probability: aiProb,
    restraint_score,
    silence_score,
    framing_realism,
    premium_authenticity,
    campaign_belonging,
    atmosphere_integrity,
    rejection_reason,
    forbiddenPatternsHit: patterns,
    notes,
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function clampUnit(n: number): number { return Math.max(0, Math.min(1, n)); }
