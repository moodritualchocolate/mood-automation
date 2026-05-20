/**
 * CAMPAIGN RHYTHM ENGINE
 *
 * Tracks six axes across generations:
 *   - loud      vs quiet
 *   - product   vs no-product
 *   - direct CTA vs soft CTA
 *   - aggressive vs restrained
 *   - educational vs emotional
 *   - visual silence vs visual impact
 *
 * For each axis it reports the current bias and recommends moving
 * toward the under-used side. The Creative Director consumes these
 * nudges; the meta-critic can reject banners that double down on a
 * direction the rhythm engine just told to balance.
 *
 * "Avoid making every asset feel like the same type of ad."
 */

import type { Banner, MemorySnapshot } from '@/core/types';

export type RhythmAxis =
  | 'loud-vs-quiet'
  | 'product-vs-no-product'
  | 'direct-vs-soft-cta'
  | 'aggressive-vs-restrained'
  | 'educational-vs-emotional'
  | 'silence-vs-impact';

export interface AxisReading {
  axis: RhythmAxis;
  /** -1..+1 — negative means leaning toward the LEFT label, positive toward RIGHT. */
  bias: number;
  /** Plain-text suggestion for the next banner. */
  suggestion: string;
}

export interface RhythmReport {
  axes: AxisReading[];
  /** Compositional health — 0..10. Higher = better-balanced. */
  healthScore: number;
  /** Single most imbalanced axis — the one the next banner should correct. */
  mostImbalanced: RhythmAxis | null;
}

export function analyzeRhythm(memory: MemorySnapshot, window = 6): RhythmReport {
  const arc = memory.campaignArc.slice(0, window);
  if (arc.length === 0) {
    return {
      axes: AXES.map((axis) => ({ axis, bias: 0, suggestion: 'no rhythm yet — first banner can choose freely' })),
      healthScore: 10,
      mostImbalanced: null,
    };
  }

  // We pull job/dominance/role from auxiliary memory slots — kept separately
  // so the campaign arc remains lightweight.
  const recentJobs = (memory.recentJobs ?? []).slice(0, window);
  const recentRoles = (memory.recentProductRoles ?? []).slice(0, window);
  const recentDominances = (memory.recentTypographyDominances ?? []).slice(0, window);

  const axes: AxisReading[] = [];

  // 1) loud vs quiet — restraint axis (low restraint = loud).
  const restraintAvg = arc.reduce((a, b) => a + b.restraint, 0) / arc.length;
  axes.push({
    axis: 'loud-vs-quiet',
    bias: clamp(-(restraintAvg - 0.6) * 2.5),  // higher restraint → negative (quiet)
    suggestion:
      restraintAvg > 0.78 ? 'recent banners have been quiet — earn a louder moment'
      : restraintAvg < 0.45 ? 'recent banners have been loud — pull the next into silence'
      : 'rhythm is balanced on loud/quiet',
  });

  // 2) product vs no-product — product role recurrence.
  const productPresent = recentRoles.filter((r) => r !== 'hidden').length;
  const productBias = clamp(((productPresent / Math.max(arc.length, 1)) - 0.6) * 2);
  axes.push({
    axis: 'product-vs-no-product',
    bias: productBias,
    suggestion:
      productBias > 0.4 ? 'product has been present in most banners — let the next be product-less'
      : productBias < -0.4 ? 'no banner has carried product recently — bring it back as evidence'
      : 'product cadence is balanced',
  });

  // 3) direct vs soft CTA — driven by job mix.
  const directJobs = recentJobs.filter((j) => j === 'sell' || j === 'interrupt').length;
  const ctaBias = clamp(((directJobs / Math.max(recentJobs.length, 1)) - 0.4) * 2);
  axes.push({
    axis: 'direct-vs-soft-cta',
    bias: ctaBias,
    suggestion:
      ctaBias > 0.4 ? 'recent CTAs have been direct — soften the next'
      : ctaBias < -0.4 ? 'recent CTAs have been soft — name the conversion next'
      : 'CTA rhythm is balanced',
  });

  // 4) aggressive vs restrained — combines restraint + dominance.
  const loudCount = recentDominances.filter((d) => d === 'loud' || d === 'timestamp').length;
  const aggBias = clamp((loudCount / Math.max(recentDominances.length, 1) - 0.3) * 2);
  axes.push({
    axis: 'aggressive-vs-restrained',
    bias: aggBias,
    suggestion:
      aggBias > 0.4 ? 'campaign has run aggressive — pull restraint up'
      : aggBias < -0.4 ? 'campaign has been restrained — afford one aggressive next'
      : 'aggressive/restrained balance is healthy',
  });

  // 5) educational vs emotional — job-based.
  const eduCount = recentJobs.filter((j) => j === 'educate').length;
  const emoCount = recentJobs.filter((j) => j === 'validate' || j === 'atmosphere').length;
  const eduBias = clamp(((eduCount - emoCount) / Math.max(recentJobs.length, 1)) * 1.5);
  axes.push({
    axis: 'educational-vs-emotional',
    bias: eduBias,
    suggestion:
      eduBias > 0.4 ? 'we have been explaining — let the next banner feel'
      : eduBias < -0.4 ? 'we have been feeling — let the next banner explain'
      : 'education/emotion balance is healthy',
  });

  // 6) silence vs impact — typography dominance.
  const silenceCount = recentDominances.filter((d) => d === 'absent' || d === 'whisper').length;
  const silenceBias = clamp((silenceCount / Math.max(recentDominances.length, 1) - 0.4) * 2);
  axes.push({
    axis: 'silence-vs-impact',
    bias: -silenceBias, // negative = silent, positive = impact
    suggestion:
      silenceBias > 0.4 ? 'last several banners whispered — earn an impact moment'
      : silenceBias < -0.4 ? 'last several banners shouted — let the next be silent'
      : 'silence/impact balance is healthy',
  });

  // Health: lower mean |bias| = healthier rhythm.
  const meanAbsBias = axes.reduce((a, b) => a + Math.abs(b.bias), 0) / axes.length;
  const healthScore = Math.max(0, Math.min(10, (1 - meanAbsBias) * 10));

  // Most imbalanced.
  let mostImbalanced: RhythmAxis | null = null;
  let worst = 0;
  for (const a of axes) {
    if (Math.abs(a.bias) > worst) {
      worst = Math.abs(a.bias);
      mostImbalanced = a.axis;
    }
  }
  if (worst < 0.4) mostImbalanced = null;

  return { axes, healthScore, mostImbalanced };
}

const AXES: RhythmAxis[] = [
  'loud-vs-quiet',
  'product-vs-no-product',
  'direct-vs-soft-cta',
  'aggressive-vs-restrained',
  'educational-vs-emotional',
  'silence-vs-impact',
];

function clamp(n: number): number {
  return Math.max(-1, Math.min(1, n));
}

/**
 * Helper used by the meta-critic: returns true when the BANNER about to
 * ship would worsen the imbalance the rhythm engine just identified.
 */
export function bannerWouldWorsenRhythm(
  report: RhythmReport,
  banner: Pick<Banner, 'direction'> & { job?: string },
): { worsens: boolean; axis: RhythmAxis | null; reason: string | null } {
  if (!report.mostImbalanced) return { worsens: false, axis: null, reason: null };
  const reading = report.axes.find((a) => a.axis === report.mostImbalanced);
  if (!reading) return { worsens: false, axis: null, reason: null };

  const d = banner.direction;
  switch (report.mostImbalanced) {
    case 'loud-vs-quiet':
      // Negative bias means we are already quiet; another quiet (high restraint) worsens it.
      if (reading.bias < -0.4 && d.restraint > 0.7) return { worsens: true, axis: 'loud-vs-quiet', reason: 'campaign is already quiet — this banner adds more silence' };
      if (reading.bias > 0.4 && d.restraint < 0.45) return { worsens: true, axis: 'loud-vs-quiet', reason: 'campaign is already loud — this banner adds more noise' };
      return { worsens: false, axis: null, reason: null };
    case 'product-vs-no-product':
      if (reading.bias > 0.4 && d.productRole !== 'hidden') return { worsens: true, axis: 'product-vs-no-product', reason: 'product has been everywhere — this banner adds product again' };
      if (reading.bias < -0.4 && d.productRole === 'hidden') return { worsens: true, axis: 'product-vs-no-product', reason: 'product has been absent — this banner stays absent' };
      return { worsens: false, axis: null, reason: null };
    case 'silence-vs-impact':
      const isSilent = d.typographyDominance === 'absent' || d.typographyDominance === 'whisper';
      if (reading.bias < -0.4 && isSilent) return { worsens: true, axis: 'silence-vs-impact', reason: 'campaign has been silent — this banner whispers again' };
      const isImpact = d.typographyDominance === 'loud' || d.typographyDominance === 'timestamp';
      if (reading.bias > 0.4 && isImpact) return { worsens: true, axis: 'silence-vs-impact', reason: 'campaign has been impact-heavy — this banner adds more impact' };
      return { worsens: false, axis: null, reason: null };
    default:
      return { worsens: false, axis: null, reason: null };
  }
}
