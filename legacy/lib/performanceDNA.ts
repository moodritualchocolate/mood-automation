/**
 * PERFORMANCE DNA (pure, observational)
 *
 * Detects recurring TRAIT × OUTCOME correlations across outcome
 * memory. Names what historically performed — never predicts what
 * will. Pure function, deterministic.
 *
 * Examples surfaced (when supported by data):
 *
 *   - realism + stillness historically improved saves
 *   - high aggression historically reduced trust
 *   - cinematic polish historically reduced authenticity
 *   - lower CTA pressure improved retention
 *   - emotional ambiguity increased rewatches
 *   - narrative silence increased comments
 *   - high mutation cadence accelerated fatigue
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - never predicts
 *   - never auto-selects winners
 *   - phrasing: "historically improved / reduced / accelerated"
 */

import type { OutcomeRecord, OutcomeLabel, OutcomeMetrics } from './outcomeMemory';

// ─── trait predicates ─────────────────────────────────────────

interface TraitDefinition {
  key: string;
  match: (r: OutcomeRecord) => boolean;
  label: string;
}

const TRAITS: TraitDefinition[] = [
  { key: 'realism-high',          match: (r) => r.realismLevel >= 7,              label: 'high realism' },
  { key: 'realism-low',           match: (r) => r.realismLevel <= 3,              label: 'low realism (polished / cinematic)' },
  { key: 'stillness',             match: (r) => /still|silen|pause|breath/.test(r.visualStyle.toLowerCase()) ||
                                                /stillness|silence/.test(r.narrativeSignature.toLowerCase()), label: 'stillness / silence' },
  { key: 'cinematic-polish',      match: (r) => r.realismLevel <= 4 && /cinematic|polished|controlled/.test(r.visualStyle.toLowerCase()),
                                                                                  label: 'cinematic polish' },
  { key: 'aggression-high',       match: (r) => r.persuasionIntensity >= 7,       label: 'high persuasion / aggression' },
  { key: 'persuasion-low',        match: (r) => r.persuasionIntensity <= 3,       label: 'low CTA pressure' },
  { key: 'emotional-ambiguity',   match: (r) => /ambig|unresolved|open/.test(r.emotionalSignature.toLowerCase()), label: 'emotional ambiguity' },
  { key: 'narrative-silence',     match: (r) => /silent|wordless|unspoken/.test(r.narrativeSignature.toLowerCase()), label: 'narrative silence' },
  { key: 'mutation-burst',        match: (r) => r.cadenceState === 'burst' || r.mutationPressure >= 7, label: 'high mutation cadence' },
  { key: 'documentary-style',     match: (r) => /documentary|observed|verite/.test(r.visualStyle.toLowerCase()), label: 'documentary realism' },
];

// ─── metric helpers ───────────────────────────────────────────

function metricMean(records: OutcomeRecord[], pick: (m: OutcomeMetrics) => number | undefined): number {
  const xs = records.map((r) => pick(r.metrics)).filter((x): x is number => typeof x === 'number');
  if (xs.length === 0) return NaN;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

function r2(n: number): number { return Math.round(n * 100) / 100; }

// ─── output ───────────────────────────────────────────────────

export interface PerformanceTraitCorrelation {
  trait: string;
  metric: string;
  occurrences: number;
  baselineMean: number;
  traitMean: number;
  direction: 'improved' | 'reduced' | 'unchanged';
  description: string;
}

export interface PerformanceLabelCorrelation {
  trait: string;
  outcome: OutcomeLabel;
  occurrences: number;
  share: number;
  description: string;
}

export interface PerformanceDNA {
  totalOutcomes: number;
  traitCorrelations: PerformanceTraitCorrelation[];
  labelCorrelations: PerformanceLabelCorrelation[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — performance DNA describes historical correlation. ' +
  'It does not predict, auto-select, or apply patterns.';

// ─── main ─────────────────────────────────────────────────────

const METRIC_PICKERS: Array<{ name: string; pick: (m: OutcomeMetrics) => number | undefined; significantDelta: number }> = [
  { name: 'saves',         pick: (m) => m.saves,         significantDelta: 1 },
  { name: 'retention',     pick: (m) => m.retention,     significantDelta: 0.10 },
  { name: 'rewatches',     pick: (m) => m.rewatches,     significantDelta: 1 },
  { name: 'comments',      pick: (m) => m.comments,      significantDelta: 1 },
  { name: 'shares',        pick: (m) => m.shares,        significantDelta: 1 },
  { name: 'follows',       pick: (m) => m.follows,       significantDelta: 1 },
  { name: 'ctr',           pick: (m) => m.ctr,           significantDelta: 0.02 },
  { name: 'bounceRate',    pick: (m) => m.bounceRate,    significantDelta: 0.10 },
  { name: 'scrollDepth',   pick: (m) => m.scrollDepth,   significantDelta: 0.10 },
];

export function buildPerformanceDNA(outcomes: OutcomeRecord[]): PerformanceDNA {
  const traitCorrelations: PerformanceTraitCorrelation[] = [];
  const labelCorrelations: PerformanceLabelCorrelation[] = [];

  for (const trait of TRAITS) {
    const matching = outcomes.filter(trait.match);
    if (matching.length < 2) continue;

    // ── trait × metric correlations ─────────────────────────
    for (const metric of METRIC_PICKERS) {
      const baseline = metricMean(outcomes, metric.pick);
      const traitMean = metricMean(matching, metric.pick);
      if (Number.isNaN(baseline) || Number.isNaN(traitMean)) continue;
      const delta = traitMean - baseline;
      if (Math.abs(delta) < metric.significantDelta) continue;
      const direction = delta > 0 ? 'improved' : 'reduced';
      const verb = metric.name === 'bounceRate'
        ? (direction === 'improved' ? 'historically increased' : 'historically decreased')
        : `historically ${direction}`;
      traitCorrelations.push({
        trait: trait.label,
        metric: metric.name,
        occurrences: matching.length,
        baselineMean: r2(baseline),
        traitMean: r2(traitMean),
        direction,
        description:
          `${trait.label} ${verb} ${metric.name} ` +
          `(${matching.length} records: ${r2(traitMean)} vs baseline ${r2(baseline)}).`,
      });
    }

    // ── trait × outcome-label correlations ──────────────────
    const outcomeCounts = new Map<OutcomeLabel, number>();
    for (const r of matching) {
      outcomeCounts.set(r.downstreamOutcome, (outcomeCounts.get(r.downstreamOutcome) ?? 0) + 1);
    }
    for (const [outcome, count] of outcomeCounts) {
      const share = count / matching.length;
      if (share < 0.4 || count < 2) continue;
      labelCorrelations.push({
        trait: trait.label,
        outcome,
        occurrences: count,
        share: r2(share),
        description:
          `${trait.label} historically correlated with ${outcome} ` +
          `in ${count}/${matching.length} records (${Math.round(share * 100)}%).`,
      });
    }
  }

  traitCorrelations.sort((a, b) =>
    b.occurrences - a.occurrences ||
    Math.abs(b.traitMean - b.baselineMean) - Math.abs(a.traitMean - a.baselineMean) ||
    a.trait.localeCompare(b.trait) ||
    a.metric.localeCompare(b.metric),
  );
  labelCorrelations.sort((a, b) =>
    b.occurrences * b.share - a.occurrences * a.share ||
    a.trait.localeCompare(b.trait) ||
    a.outcome.localeCompare(b.outcome),
  );

  return {
    totalOutcomes: outcomes.length,
    traitCorrelations,
    labelCorrelations,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `trait-correlations:${traitCorrelations.length}`,
      `label-correlations:${labelCorrelations.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
