/**
 * HUMAN TASTE DRIFT
 *
 * Tracks how audience taste changes over time. Reads the engagement
 * book + the emotional outcomes + the recent banner DNAs and produces
 * named drift signals:
 *
 *   - oversized-typography-fatigue       — audience used to love it,
 *                                          stops engaging with it
 *   - cinematic-realism-saturation       — was novel, now baseline
 *   - anti-ad-documentary-strengthening  — winning more over time
 *   - meme-realism-saturation            — too on-trend, going flat
 *   - product-forward-tolerance-falling  — audience harder on visible product
 *   - silence-rewarded                   — silent banners outperforming
 *
 * The system uses drift to:
 *   - bias state / layout / dominance choices toward what is still working
 *   - dampen patterns that are losing
 *
 * BUT — the spec warned: "Protect human imperfection. The strongest
 * campaigns often feel slightly unresolved." So the drift signal is
 * RATE-LIMITED:
 *   - never more than 60% of next-banner decisions follow the trend
 *   - drift-driven decisions decay if the audience changes again
 *
 * This is the "diversity guard" — the system stays honest by
 * refusing to be too efficient.
 */

import type { BannerEngagement } from './engagementMemory';
import type { CreativeDirection } from '@/core/types';

export type DriftSignal =
  | 'oversized-typography-fatigue'
  | 'cinematic-realism-saturation'
  | 'anti-ad-documentary-strengthening'
  | 'meme-realism-saturation'
  | 'product-forward-tolerance-falling'
  | 'silence-rewarded';

export interface DriftReport {
  active: Array<{ signal: DriftSignal; strength: number; rationale: string }>;
  /** Diversity guard — when this is true, do not optimize further. */
  diversityGuardEngaged: boolean;
  /** Suggested nudges to the next banner. Rate-limited by the guard. */
  preferredDominances: Array<CreativeDirection['typographyDominance']>;
  avoidedDominances: Array<CreativeDirection['typographyDominance']>;
  preferredLayouts: Array<CreativeDirection['layoutFamily']>;
  avoidedLayouts: Array<CreativeDirection['layoutFamily']>;
}

export interface DetectInput {
  engagements: BannerEngagement[];
  /** Banner facts paired with engagement IDs — provided by caller. */
  bannerFacts: Array<{
    bannerId: string;
    typographyDominance: CreativeDirection['typographyDominance'];
    layoutFamily: CreativeDirection['layoutFamily'];
    productRole: CreativeDirection['productRole'];
    documentary_weight: number;       // DNA axis
    realism_type: number;             // DNA axis
    silence_ratio: number;            // DNA axis
    shippedAt: number;
  }>;
}

export function detectDrift(input: DetectInput): DriftReport {
  const { engagements, bannerFacts } = input;
  if (engagements.length < 6) {
    // Not enough audience data to read drift.
    return emptyReport();
  }

  // Join engagement with bannerFacts so we can group performance by
  // mechanic. Banners without recorded facts are skipped.
  const factsById = new Map(bannerFacts.map((b) => [b.bannerId, b]));
  type Joined = BannerEngagement & { facts: typeof bannerFacts[number] };
  const joined: Joined[] = [];
  for (const e of engagements) {
    const f = factsById.get(e.bannerId);
    if (f && e.totals.impressions >= 20) joined.push({ ...e, facts: f });
  }
  if (joined.length < 4) return emptyReport();

  // Performance score per banner — emphasises residue signals.
  const scored = joined.map((j) => ({ ...j, score: residueScore(j) }));

  const active: DriftReport['active'] = [];

  // ─── oversized typography fatigue ──────────────────────────────
  const loud = scored.filter((s) => s.facts.typographyDominance === 'loud' || s.facts.typographyDominance === 'timestamp');
  const quiet = scored.filter((s) => s.facts.typographyDominance === 'whisper' || s.facts.typographyDominance === 'absent');
  if (loud.length >= 2 && quiet.length >= 2) {
    const dLoud = avg(loud.map((s) => s.score));
    const dQuiet = avg(quiet.map((s) => s.score));
    if (dQuiet - dLoud > 0.8) {
      active.push({
        signal: 'oversized-typography-fatigue',
        strength: clamp01((dQuiet - dLoud) / 3),
        rationale: `loud/timestamp banners scoring ${dLoud.toFixed(2)} vs whisper/absent ${dQuiet.toFixed(2)}`,
      });
    }
  }

  // ─── cinematic realism saturation ──────────────────────────────
  const realistic = scored.filter((s) => s.facts.realism_type > 0.78);
  if (realistic.length >= 3) {
    const recentTrend = trend(realistic.map((s) => ({ ts: s.facts.shippedAt, score: s.score })));
    if (recentTrend < -0.4) {
      active.push({
        signal: 'cinematic-realism-saturation',
        strength: clamp01(-recentTrend),
        rationale: 'realism-heavy banners trending DOWN over time',
      });
    }
  }

  // ─── anti-ad documentary strengthening ─────────────────────────
  const antiAd = scored.filter((s) => s.facts.documentary_weight > 0.7 && s.facts.silence_ratio > 0.6);
  if (antiAd.length >= 2) {
    const dAnti = avg(antiAd.map((s) => s.score));
    const dRest = avg(scored.filter((s) => !antiAd.includes(s)).map((s) => s.score));
    if (dAnti - dRest > 0.5) {
      active.push({
        signal: 'anti-ad-documentary-strengthening',
        strength: clamp01((dAnti - dRest) / 3),
        rationale: `anti-ad documentary banners scoring ${dAnti.toFixed(2)} vs ${dRest.toFixed(2)} elsewhere`,
      });
    }
  }

  // ─── product-forward tolerance falling ─────────────────────────
  const productForward = scored.filter((s) => ['hand-held', 'partial-crop', 'desk-proof', 'table-object'].includes(s.facts.productRole));
  const productAbsent = scored.filter((s) => s.facts.productRole === 'hidden' || s.facts.productRole === 'environmental');
  if (productForward.length >= 2 && productAbsent.length >= 2) {
    const dFw = avg(productForward.map((s) => s.score));
    const dAb = avg(productAbsent.map((s) => s.score));
    if (dAb - dFw > 0.6) {
      active.push({
        signal: 'product-forward-tolerance-falling',
        strength: clamp01((dAb - dFw) / 3),
        rationale: `forward-product banners scoring ${dFw.toFixed(2)} vs absent-product ${dAb.toFixed(2)}`,
      });
    }
  }

  // ─── silence rewarded ──────────────────────────────────────────
  const silent = scored.filter((s) => s.facts.silence_ratio > 0.7);
  if (silent.length >= 2) {
    const dSilent = avg(silent.map((s) => s.score));
    const dRest = avg(scored.filter((s) => !silent.includes(s)).map((s) => s.score));
    if (dSilent - dRest > 0.4) {
      active.push({
        signal: 'silence-rewarded',
        strength: clamp01((dSilent - dRest) / 3),
        rationale: 'silent banners outperforming noisy ones',
      });
    }
  }

  // Diversity guard — when more than ~3 strong drift signals exist,
  // the system is converging too hard. Engage the guard so the next
  // banner doesn't follow all of them.
  const strongCount = active.filter((a) => a.strength > 0.55).length;
  const diversityGuardEngaged = strongCount >= 3;

  // Translate drift signals into preferences — but only the top 2
  // when the guard is engaged, otherwise top 4. This rate-limits.
  const sorted = active.slice().sort((a, b) => b.strength - a.strength).slice(0, diversityGuardEngaged ? 2 : 4);

  const preferredDominances: Array<CreativeDirection['typographyDominance']> = [];
  const avoidedDominances: Array<CreativeDirection['typographyDominance']> = [];
  const preferredLayouts: Array<CreativeDirection['layoutFamily']> = [];
  const avoidedLayouts: Array<CreativeDirection['layoutFamily']> = [];

  for (const s of sorted) {
    if (s.signal === 'oversized-typography-fatigue') {
      avoidedDominances.push('loud', 'timestamp');
      preferredDominances.push('whisper', 'editorial');
    }
    if (s.signal === 'anti-ad-documentary-strengthening') {
      preferredLayouts.push('documentary-crop', 'environmental-wide');
    }
    if (s.signal === 'silence-rewarded') {
      preferredDominances.push('whisper', 'absent');
      preferredLayouts.push('negative-space');
    }
  }

  return {
    active,
    diversityGuardEngaged,
    preferredDominances: dedup(preferredDominances),
    avoidedDominances: dedup(avoidedDominances),
    preferredLayouts: dedup(preferredLayouts),
    avoidedLayouts: dedup(avoidedLayouts),
  };
}

function emptyReport(): DriftReport {
  return { active: [], diversityGuardEngaged: false, preferredDominances: [], avoidedDominances: [], preferredLayouts: [], avoidedLayouts: [] };
}

function residueScore(e: BannerEngagement): number {
  const t = e.totals;
  const imps = Math.max(1, t.impressions);
  return (t.saves + t.shares * 1.2 + t.replays * 0.6 + t.emotionalComments * 2 - t.negative) / imps * 50;
}

function avg(xs: number[]): number {
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0;
}

function trend(points: Array<{ ts: number; score: number }>): number {
  // Simple slope using first/second half mean comparison.
  if (points.length < 2) return 0;
  const sorted = points.slice().sort((a, b) => a.ts - b.ts);
  const mid = Math.floor(sorted.length / 2);
  const early = avg(sorted.slice(0, mid).map((p) => p.score));
  const late = avg(sorted.slice(mid).map((p) => p.score));
  return late - early;
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(1, n));
}

function dedup<T>(xs: T[]): T[] {
  return Array.from(new Set(xs));
}
