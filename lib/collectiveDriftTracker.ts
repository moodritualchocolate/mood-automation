/**
 * COLLECTIVE DRIFT TRACKER (Phase 16)
 *
 * Tracks the slow emotional drift of society across months. Different
 * from Phase 4's audience tasteDrift (audience taste shifting) and
 * Phase 12's culturalDrift (the campaign drifting into clichés).
 * Phase 16's collectiveDrift tracks REAL OBSERVED LANGUAGE shifting
 * across months.
 *
 * The spec named the drift directions:
 *
 *   productivity      → overstimulation
 *   ambition           → invisible pressure
 *   self-improvement   → optimization fatigue
 *   relaxation         → passive consumption
 *   connection         → performance
 *
 * The engine bins signals by month (or 4-week period) and computes
 * the dominant topical tags per period. Drift is detected when the
 * dominant tag set CHANGES across consecutive periods.
 */

import type { IngestedSignal } from './realityIngestion';

const PERIOD_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export interface DriftPeriod {
  period_start: number;
  signal_count: number;
  dominant_tags: Array<{ tag: string; count: number }>;
  /** Composite emotional weight of the period. */
  total_weight: number;
}

export interface CollectiveDriftReport {
  periods: DriftPeriod[];
  /** Named drift directions detected between consecutive periods. */
  named_drifts: Array<{
    from_tag: string;
    to_tag: string;
    direction_name: string;
    confidence: number;
  }>;
  /** Plain-text director read of how society has been moving. */
  director_read: string;
}

// Named drift directions the spec called out. When the dominant
// tags shift across periods AND match one of these named pairs,
// the system surfaces it.
const NAMED_DRIFT_PAIRS: Array<{ from: RegExp; to: RegExp; name: string }> = [
  { from: /\b(productivity|productive|hustle)\b/, to: /\b(overstimulation|fragmentation|interrupted)\b/, name: 'productivity → overstimulation' },
  { from: /\b(ambition|drive|driven)\b/,           to: /\b(pressure|invisible-pressure|silent-burnout)\b/, name: 'ambition → invisible pressure' },
  { from: /\b(self[-\s]?improvement|optimization|optimisation)\b/, to: /\b(optimization-fatigue|optim.*fatigue)\b/, name: 'self-improvement → optimization fatigue' },
  { from: /\b(relax|relaxation|rest)\b/,           to: /\b(passive-consumption|doomscroll|content-while)\b/, name: 'relaxation → passive consumption' },
  { from: /\b(connection|connected|community)\b/,  to: /\b(performance|performed|loneliness-while-connected)\b/, name: 'connection → performance' },
  { from: /\b(achievement|reward)\b/,              to: /\b(numbness|emotional-numbness|achievement-numbness)\b/, name: 'achievement → numbness' },
];

export function trackCollectiveDrift(signals: IngestedSignal[]): CollectiveDriftReport {
  if (signals.length === 0) {
    return { periods: [], named_drifts: [], director_read: 'no observed signals yet to track collective drift' };
  }

  // Bucket by 30-day period (older → newer).
  const sorted = signals.slice().sort((a, b) => a.observed_at - b.observed_at);
  const earliest = sorted[0].observed_at;
  const buckets = new Map<number, IngestedSignal[]>();
  for (const s of sorted) {
    const periodIndex = Math.floor((s.observed_at - earliest) / PERIOD_MS);
    const key = earliest + periodIndex * PERIOD_MS;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key)!.push(s);
  }

  const periods: DriftPeriod[] = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([period_start, ps]) => {
      const tagCounts = new Map<string, number>();
      let total_weight = 0;
      for (const s of ps) {
        total_weight += s.emotional_weight;
        for (const t of s.topical_tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
      }
      const dominant_tags = Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag, count]) => ({ tag, count }));
      return { period_start, signal_count: ps.length, dominant_tags, total_weight };
    });

  // Detect named drifts between consecutive periods.
  const named_drifts: CollectiveDriftReport['named_drifts'] = [];
  for (let i = 1; i < periods.length; i++) {
    const prev = periods[i - 1].dominant_tags.map((t) => t.tag);
    const next = periods[i].dominant_tags.map((t) => t.tag);
    for (const drift of NAMED_DRIFT_PAIRS) {
      const fromHit = prev.find((tag) => drift.from.test(tag));
      const toHit = next.find((tag) => drift.to.test(tag));
      if (fromHit && toHit && !prev.some((tag) => drift.to.test(tag))) {
        named_drifts.push({
          from_tag: fromHit,
          to_tag: toHit,
          direction_name: drift.name,
          confidence: 6,
        });
      }
    }
  }

  // Director read.
  let director_read = '';
  if (periods.length < 2) {
    director_read = `collective signal too short to read drift (${periods.length} period${periods.length === 1 ? '' : 's'})`;
  } else if (named_drifts.length > 0) {
    director_read = `society is drifting: ${named_drifts.map((d) => d.direction_name).join(' · ')}`;
  } else {
    const latest = periods[periods.length - 1];
    const topTags = latest.dominant_tags.slice(0, 3).map((t) => t.tag).join(', ');
    director_read = `current dominant tags (last ${PERIOD_MS / (24 * 60 * 60 * 1000)}-day window): ${topTags}`;
  }

  return { periods, named_drifts, director_read };
}
