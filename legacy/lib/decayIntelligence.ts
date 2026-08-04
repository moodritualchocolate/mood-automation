/**
 * DECAY INTELLIGENCE (pure, observational)
 *
 * Tracks how long creative patterns survive across outcome memory.
 * Each fingerprint passes through lifecycle stages based on its
 * appearance count, engagement trajectory, and time-since-first-seen:
 *
 *   emerging       — first 1-2 appearances; not yet established
 *   accelerating   — recent appearances show rising engagement
 *   peak           — engagement at historical high; many recent uses
 *   saturation     — engagement plateauing despite heavy use
 *   fatigue        — engagement declining; bounce / retention regressing
 *   collapse       — engagement crash relative to early appearances
 *   dormant        — pattern unused for an extended period
 *   recovered      — pattern returned after dormancy with positive metrics
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - never predicts
 *   - phrasing names current lifecycle position, not future trajectory
 */

import type { OutcomeRecord, OutcomeMetrics } from './outcomeMemory';

export type LifecycleStage =
  | 'emerging'
  | 'accelerating'
  | 'peak'
  | 'saturation'
  | 'fatigue'
  | 'collapse'
  | 'dormant'
  | 'recovered';

export interface PatternLifecycle {
  fingerprint: string;
  occurrences: number;
  firstSeenAt: number;
  lastSeenAt: number;
  /** Mean engagement score across all appearances (0..10). */
  averageEngagement: number;
  earlyEngagement: number;
  recentEngagement: number;
  trajectoryDelta: number;       // recent - early
  stage: LifecycleStage;
  description: string;
}

export interface DecayIntelligence {
  totalOutcomes: number;
  totalPatterns: number;
  patternsByStage: Record<LifecycleStage, PatternLifecycle[]>;
  longTermPerformers: PatternLifecycle[];   // sustained engagement across many appearances
  fastBurnPatterns: PatternLifecycle[];     // peaked then collapsed quickly
  recoveryWindows: PatternLifecycle[];      // recovered patterns
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

const ADVISORY_NOTICE =
  'Observatory only — decay intelligence names current lifecycle position from history. ' +
  'It does not predict survival or schedule retirement.';

const DORMANT_GAP_MS = 14 * 24 * 60 * 60 * 1000;   // 14 days

function r1(n: number): number { return Math.round(n * 10) / 10; }

/** Engagement score 0..10 derived from a single record's metrics. */
function engagementScore(m: OutcomeMetrics): number {
  // Composite: retention (40%) + scrollDepth (15%) + normalized saves (15%)
  //          + normalized comments (10%) + normalized shares (10%)
  //          + (1 - bounceRate) (10%).
  const saves      = Math.min(1, (m.saves ?? 0) / 10);
  const comments   = Math.min(1, (m.comments ?? 0) / 20);
  const shares     = Math.min(1, (m.shares ?? 0) / 10);
  const retention  = m.retention ?? 0;
  const scrollDepth = m.scrollDepth ?? 0;
  const bouncePenalty = 1 - (m.bounceRate ?? 0);
  const score =
    retention * 0.40 +
    scrollDepth * 0.15 +
    saves * 0.15 +
    comments * 0.10 +
    shares * 0.10 +
    bouncePenalty * 0.10;
  return Math.max(0, Math.min(10, score * 10));
}

// ─── stage classification ─────────────────────────────────────

function classifyStage(
  earlyEngagement: number,
  recentEngagement: number,
  occurrences: number,
  msSinceLastSeen: number,
  averageEngagement: number,
): LifecycleStage {
  const delta = recentEngagement - earlyEngagement;

  // Dormancy check first — long absence regardless of recent engagement.
  if (msSinceLastSeen > DORMANT_GAP_MS && occurrences >= 2) {
    return 'dormant';
  }

  // Recovery: dormant break followed by positive engagement.
  // (Detection: late engagement above mid threshold but only a few
  // recent appearances since a long gap.) We approximate this as
  // recent engagement >= 6 but occurrences low; the dormant check
  // above already handles the no-recent-use case.

  // Emerging: very few appearances.
  if (occurrences <= 2) return 'emerging';

  // Trajectory-driven classifications.
  if (delta >= 2 && occurrences >= 3 && recentEngagement >= 6) return 'accelerating';
  if (averageEngagement >= 7 && Math.abs(delta) < 1.5 && occurrences >= 4) return 'peak';
  if (averageEngagement >= 5 && Math.abs(delta) < 1.5 && occurrences >= 4) return 'saturation';
  if (delta <= -2 && recentEngagement < earlyEngagement && occurrences >= 3) return 'fatigue';
  if (recentEngagement < earlyEngagement * 0.5 && occurrences >= 4) return 'collapse';

  // Recovered: came back from a previous low. We label as 'recovered'
  // when there was a long internal gap but the most-recent appearances
  // are strong. Without per-appearance timestamps we use a proxy: high
  // recent engagement after at least 5 appearances with mid-band avg.
  if (recentEngagement >= 7 && averageEngagement < 6 && occurrences >= 5) return 'recovered';

  return 'saturation';
}

// ─── main ─────────────────────────────────────────────────────

export function buildDecayIntelligence(outcomes: OutcomeRecord[]): DecayIntelligence {
  const groups = new Map<string, OutcomeRecord[]>();
  for (const r of outcomes) {
    const key = r.creativeFingerprint || 'unknown';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  const now = outcomes.length === 0 ? 0 : Math.max(...outcomes.map((r) => r.at));

  const patterns: PatternLifecycle[] = [];
  for (const [fingerprint, records] of groups) {
    records.sort((a, b) => a.at - b.at);
    const scores = records.map((r) => engagementScore(r.metrics));
    const half = Math.max(1, Math.floor(scores.length / 2));
    const earlyEngagement = r1(scores.slice(0, half).reduce((a, b) => a + b, 0) / Math.max(1, half));
    const recentEngagement = r1(scores.slice(-half).reduce((a, b) => a + b, 0) / Math.max(1, half));
    const averageEngagement = r1(scores.reduce((a, b) => a + b, 0) / scores.length);
    const trajectoryDelta = r1(recentEngagement - earlyEngagement);
    const firstSeenAt = records[0].at;
    const lastSeenAt = records[records.length - 1].at;
    const msSinceLastSeen = Math.max(0, now - lastSeenAt);

    const stage = classifyStage(
      earlyEngagement, recentEngagement, records.length, msSinceLastSeen, averageEngagement,
    );

    patterns.push({
      fingerprint,
      occurrences: records.length,
      firstSeenAt,
      lastSeenAt,
      averageEngagement,
      earlyEngagement,
      recentEngagement,
      trajectoryDelta,
      stage,
      description:
        `${fingerprint} · ${stage} · avg ${averageEngagement}/10 ` +
        `(${records.length} appearance${records.length === 1 ? '' : 's'}, ` +
        `Δ ${trajectoryDelta >= 0 ? '+' : ''}${trajectoryDelta})`,
    });
  }

  // Deterministic ordering for downstream consumers.
  patterns.sort((a, b) =>
    b.occurrences - a.occurrences ||
    b.averageEngagement - a.averageEngagement ||
    a.fingerprint.localeCompare(b.fingerprint),
  );

  const patternsByStage: Record<LifecycleStage, PatternLifecycle[]> = {
    emerging: [], accelerating: [], peak: [], saturation: [],
    fatigue: [], collapse: [], dormant: [], recovered: [],
  };
  for (const p of patterns) patternsByStage[p.stage].push(p);

  const longTermPerformers = patterns
    .filter((p) => p.occurrences >= 5 && p.averageEngagement >= 6 && (p.stage === 'peak' || p.stage === 'saturation' || p.stage === 'accelerating'))
    .sort((a, b) => b.averageEngagement - a.averageEngagement || b.occurrences - a.occurrences);

  const fastBurnPatterns = patterns
    .filter((p) => p.occurrences >= 3 && p.earlyEngagement >= 6 && p.recentEngagement <= 3)
    .sort((a, b) => (b.earlyEngagement - b.recentEngagement) - (a.earlyEngagement - a.recentEngagement));

  const recoveryWindows = patternsByStage.recovered;

  return {
    totalOutcomes: outcomes.length,
    totalPatterns: patterns.length,
    patternsByStage,
    longTermPerformers,
    fastBurnPatterns,
    recoveryWindows,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `patterns:${patterns.length}`,
      `long-term:${longTermPerformers.length}`,
      `fast-burn:${fastBurnPatterns.length}`,
      `recovered:${recoveryWindows.length}`,
      `dormant:${patternsByStage.dormant.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
