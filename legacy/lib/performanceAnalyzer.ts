/**
 * PERFORMANCE ANALYZER (pure, observational)
 *
 * Phase 3 — Creative Performance Layer.
 *
 * Pure analyzer over PerformanceMemory + PublicationRegistry +
 * AssetRegistry. Produces historically-associated patterns and
 * coarse indicator signals (fatigue / attention / retention /
 * trust).
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never names a "best" or "winner" asset
 *   - never recommends
 *   - never auto-applies
 *   - allowed phrasing: "historically associated", "observed
 *     alongside", "may carry memory weight", "requires more
 *     evidence", "appears elevated", "appears suppressed"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply, optimize,
 *     viral, dopamine, outrage, manipulat, exploit
 */

import type { Formula } from '@/core/types';
import type { PerformanceRecord, PerformanceMetrics } from './performanceMemory';
import type { PublicationRecord, PublicationChannel } from './publicationRegistryMemory';
import type { AssetRecord } from './assetRegistryMemory';

// ─── input ────────────────────────────────────────────────────

export interface PerformanceAnalyzerInput {
  performances?: PerformanceRecord[];
  publications?: PublicationRecord[];
  assets?: AssetRecord[];
}

// ─── output ───────────────────────────────────────────────────

export interface IndicatorSignal {
  /** 0..10 — observed magnitude. */
  level: number;
  /** -10..+10 — recent migration (negative = receding). */
  migrationDirection: number;
  /** Plain-language observation, allowed phrasing only. */
  observation: string;
}

export interface PerformanceIndicators {
  fatigueIndicator: IndicatorSignal;
  attentionIndicator: IndicatorSignal;
  retentionIndicator: IndicatorSignal;
  trustIndicator: IndicatorSignal;
}

export interface HistoricallyAssociatedPattern {
  patternId: string;
  /** Plain-language description of the pattern (no winner language). */
  description: string;
  /** 0..10 — observed strength. */
  strength: number;
  /** Number of performance observations that fed this pattern. */
  evidenceCount: number;
}

export interface PerChannelObservation {
  channel: PublicationChannel;
  publicationCount: number;
  averageEngagementRate: number;
  averageCompletionRate: number;
  averageWatchTimeSeconds: number;
  observation: string;
}

export interface PerFormulaObservation {
  formula: Formula;
  publicationCount: number;
  averageEngagementRate: number;
  averageCompletionRate: number;
  averageRetentionSeconds: number;
  observation: string;
}

export interface PerformanceAnalyzerReading {
  totalPerformances: number;
  indicators: PerformanceIndicators;
  historicallyAssociatedPatterns: HistoricallyAssociatedPattern[];
  perChannel: PerChannelObservation[];
  perFormula: PerFormulaObservation[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Performance analyzer is observational only. It never names a winner, ' +
  'never recommends, never auto-applies. Operator approval required. ' +
  'Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function signedClamp10(n: number): number { return Math.max(-10, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function halves<T>(xs: T[]): { early: T[]; late: T[] } {
  if (xs.length < 2) return { early: xs, late: xs };
  const mid = Math.floor(xs.length / 2);
  return { early: xs.slice(0, mid), late: xs.slice(mid) };
}
function safeMetric(p: PerformanceRecord, k: keyof PerformanceMetrics): number {
  return Number(p.metrics?.[k] ?? 0);
}

function describeDirection(direction: number, label: string): string {
  if (direction >= 1.5) return `${label} appears to be rising`;
  if (direction <= -1.5) return `${label} appears to be receding`;
  return `${label} appears stable in the observed window`;
}

// ─── main ─────────────────────────────────────────────────────

export function analyzePerformance(input: PerformanceAnalyzerInput): PerformanceAnalyzerReading {
  const performances = (input.performances ?? []).slice().sort((a, b) => a.measuredAt - b.measuredAt);
  const publications = input.publications ?? [];
  const assets = input.assets ?? [];

  const assetById = new Map(assets.map((a) => [a.assetId, a] as const));
  const publicationById = new Map(publications.map((p) => [p.publicationId, p] as const));

  // ── indicator signals ────────────────────────────────────
  const { early, late } = halves(performances);

  // fatigue: high bounce + falling engagement on burst-like outputs.
  // We use saves+shares+comments as proxy for sticky engagement.
  // Falling stickiness in late half = fatigue rising.
  const stickyEarly = avg(early.map((p) =>
    safeMetric(p, 'saves') + safeMetric(p, 'shares') + safeMetric(p, 'comments')));
  const stickyLate = avg(late.map((p) =>
    safeMetric(p, 'saves') + safeMetric(p, 'shares') + safeMetric(p, 'comments')));
  const fatigueMigration = signedClamp10((stickyEarly - stickyLate) * 0.5);
  const fatigueLevel = clamp10(
    Math.max(0, fatigueMigration) +
    (avg(performances.map((p) => safeMetric(p, 'completionRate'))) < 0.3 ? 3 : 0),
  );

  // attention: completion rate + watch time as a composite. Higher
  // = audience held attention. Lower = attention drift.
  const attentionLevel = clamp10(
    avg(performances.map((p) => safeMetric(p, 'completionRate'))) * 8 +
    Math.min(2, avg(performances.map((p) => safeMetric(p, 'watchTimeSeconds') / 30))),
  );
  const attentionEarly = avg(early.map((p) =>
    safeMetric(p, 'completionRate') * 8 +
    Math.min(2, safeMetric(p, 'watchTimeSeconds') / 30)));
  const attentionLate = avg(late.map((p) =>
    safeMetric(p, 'completionRate') * 8 +
    Math.min(2, safeMetric(p, 'watchTimeSeconds') / 30)));
  const attentionMigration = signedClamp10((attentionLate - attentionEarly));

  // retention: watch time signal + rewatch proxy (we don't have rewatches
  // here but saves + completion correlate with retention).
  const retentionLevel = clamp10(
    Math.min(10, avg(performances.map((p) => safeMetric(p, 'watchTimeSeconds') / 6))) * 0.6 +
    avg(performances.map((p) => safeMetric(p, 'completionRate'))) * 4,
  );
  const retentionEarly = avg(early.map((p) =>
    Math.min(10, safeMetric(p, 'watchTimeSeconds') / 6) * 0.6 +
    safeMetric(p, 'completionRate') * 4));
  const retentionLate = avg(late.map((p) =>
    Math.min(10, safeMetric(p, 'watchTimeSeconds') / 6) * 0.6 +
    safeMetric(p, 'completionRate') * 4));
  const retentionMigration = signedClamp10((retentionLate - retentionEarly));

  // trust: profile visits + follows + saves (composite of "want more").
  const trustLevel = clamp10(
    Math.min(5, avg(performances.map((p) => safeMetric(p, 'follows') / 10))) +
    Math.min(3, avg(performances.map((p) => safeMetric(p, 'profileVisits') / 100))) +
    Math.min(2, avg(performances.map((p) => safeMetric(p, 'saves') / 50))),
  );
  const trustEarly = avg(early.map((p) =>
    Math.min(5, safeMetric(p, 'follows') / 10) +
    Math.min(3, safeMetric(p, 'profileVisits') / 100) +
    Math.min(2, safeMetric(p, 'saves') / 50)));
  const trustLate = avg(late.map((p) =>
    Math.min(5, safeMetric(p, 'follows') / 10) +
    Math.min(3, safeMetric(p, 'profileVisits') / 100) +
    Math.min(2, safeMetric(p, 'saves') / 50)));
  const trustMigration = signedClamp10((trustLate - trustEarly));

  const indicators: PerformanceIndicators = {
    fatigueIndicator: {
      level: r1(fatigueLevel),
      migrationDirection: r1(fatigueMigration),
      observation: describeDirection(fatigueMigration, 'fatigue indicator'),
    },
    attentionIndicator: {
      level: r1(attentionLevel),
      migrationDirection: r1(attentionMigration),
      observation: describeDirection(attentionMigration, 'attention indicator'),
    },
    retentionIndicator: {
      level: r1(retentionLevel),
      migrationDirection: r1(retentionMigration),
      observation: describeDirection(retentionMigration, 'retention indicator'),
    },
    trustIndicator: {
      level: r1(trustLevel),
      migrationDirection: r1(trustMigration),
      observation: describeDirection(trustMigration, 'trust indicator'),
    },
  };

  // ── per-channel observations ─────────────────────────────
  const channelBuckets = new Map<PublicationChannel, PerformanceRecord[]>();
  for (const perf of performances) {
    const pub = publicationById.get(perf.publicationId);
    if (!pub) continue;
    const arr = channelBuckets.get(pub.channel) ?? [];
    arr.push(perf);
    channelBuckets.set(pub.channel, arr);
  }
  const perChannel: PerChannelObservation[] = Array.from(channelBuckets.entries())
    .map(([channel, arr]) => {
      const avgEng = avg(arr.map((p) => safeMetric(p, 'engagementRate')));
      const avgComp = avg(arr.map((p) => safeMetric(p, 'completionRate')));
      const avgWatch = avg(arr.map((p) => safeMetric(p, 'watchTimeSeconds')));
      return {
        channel,
        publicationCount: arr.length,
        averageEngagementRate: r1(avgEng * 100) / 100,
        averageCompletionRate: r1(avgComp * 100) / 100,
        averageWatchTimeSeconds: r1(avgWatch),
        observation: `${channel}: ${arr.length} observation(s) historically associated with completion ${r1(avgComp * 10)}/10 and engagement ${r1(avgEng * 10)}/10`,
      };
    })
    .sort((a, b) => b.publicationCount - a.publicationCount);

  // ── per-formula observations ─────────────────────────────
  const formulaBuckets = new Map<Formula, PerformanceRecord[]>();
  for (const perf of performances) {
    const pub = publicationById.get(perf.publicationId);
    if (!pub) continue;
    const arr = formulaBuckets.get(pub.formula) ?? [];
    arr.push(perf);
    formulaBuckets.set(pub.formula, arr);
  }
  const perFormula: PerFormulaObservation[] = Array.from(formulaBuckets.entries())
    .map(([formula, arr]) => {
      const avgEng = avg(arr.map((p) => safeMetric(p, 'engagementRate')));
      const avgComp = avg(arr.map((p) => safeMetric(p, 'completionRate')));
      const avgWatch = avg(arr.map((p) => safeMetric(p, 'watchTimeSeconds')));
      return {
        formula,
        publicationCount: arr.length,
        averageEngagementRate: r1(avgEng * 100) / 100,
        averageCompletionRate: r1(avgComp * 100) / 100,
        averageRetentionSeconds: r1(avgWatch),
        observation: `MOOD ${formula}: ${arr.length} observation(s) historically associated with completion ${r1(avgComp * 10)}/10`,
      };
    })
    .sort((a, b) => a.formula.localeCompare(b.formula));

  // ── historically associated patterns ─────────────────────
  const patterns: HistoricallyAssociatedPattern[] = [];
  // Pattern 1: high completion + many saves → may carry memory weight.
  const stickyHits = performances.filter((p) =>
    safeMetric(p, 'completionRate') >= 0.5 && safeMetric(p, 'saves') >= 10);
  if (stickyHits.length > 0) {
    patterns.push({
      patternId: 'sticky-completion-saves',
      description: 'completion >= 50% observed alongside elevated saves — historically associated with memory weight',
      strength: r1(clamp10(stickyHits.length / Math.max(1, performances.length) * 10)),
      evidenceCount: stickyHits.length,
    });
  }
  // Pattern 2: low completion + high shares → curiosity-driven, not retention.
  const curiosityHits = performances.filter((p) =>
    safeMetric(p, 'completionRate') < 0.3 && safeMetric(p, 'shares') >= 5);
  if (curiosityHits.length > 0) {
    patterns.push({
      patternId: 'curiosity-only',
      description: 'low completion observed alongside shares — historically associated with curiosity, not retention — requires more evidence',
      strength: r1(clamp10(curiosityHits.length / Math.max(1, performances.length) * 10)),
      evidenceCount: curiosityHits.length,
    });
  }
  // Pattern 3: video assets with longer watch time → retention strength.
  const longWatchHits = performances.filter((p) => {
    const asset = assetById.get(p.assetId);
    return asset?.packageType === 'video' && safeMetric(p, 'watchTimeSeconds') >= 8;
  });
  if (longWatchHits.length > 0) {
    patterns.push({
      patternId: 'video-watchtime',
      description: 'video assets observed alongside watch time >= 8s — historically associated with retention',
      strength: r1(clamp10(longWatchHits.length / Math.max(1, performances.length) * 10)),
      evidenceCount: longWatchHits.length,
    });
  }
  // Pattern 4: high profile visits + follows after a publication.
  const trustHits = performances.filter((p) =>
    safeMetric(p, 'follows') >= 5 || safeMetric(p, 'profileVisits') >= 50);
  if (trustHits.length > 0) {
    patterns.push({
      patternId: 'trust-formation',
      description: 'elevated profile visits / follows observed alongside the publication — historically associated with trust formation',
      strength: r1(clamp10(trustHits.length / Math.max(1, performances.length) * 10)),
      evidenceCount: trustHits.length,
    });
  }

  const notes: string[] = [];
  if (performances.length === 0) {
    notes.push('no performance observations logged yet — requires more evidence');
  } else {
    notes.push(`${performances.length} performance observation(s) historically associated with ${publications.length} publication(s)`);
    if (indicators.fatigueIndicator.level >= 6) {
      notes.push('fatigue indicator appears elevated — operator review required');
    }
    if (indicators.attentionIndicator.migrationDirection <= -2) {
      notes.push('attention indicator appears to be receding — operator review required');
    }
    if (indicators.trustIndicator.migrationDirection >= 2) {
      notes.push('trust indicator appears to be rising — historically associated with restraint');
    }
  }

  return {
    totalPerformances: performances.length,
    indicators,
    historicallyAssociatedPatterns: patterns,
    perChannel,
    perFormula,
    notes,
    reasonCodes: [
      `performances:${performances.length}`,
      `publications:${publications.length}`,
      `patterns:${patterns.length}`,
      `fatigue:${indicators.fatigueIndicator.level}/${indicators.fatigueIndicator.migrationDirection}`,
      `attention:${indicators.attentionIndicator.level}/${indicators.attentionIndicator.migrationDirection}`,
      `retention:${indicators.retentionIndicator.level}/${indicators.retentionIndicator.migrationDirection}`,
      `trust:${indicators.trustIndicator.level}/${indicators.trustIndicator.migrationDirection}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
