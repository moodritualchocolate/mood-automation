/**
 * AUDIENCE SEGMENT MEMORY (pure analyzer, observational)
 *
 * Groups outcome memory by audience segment and surfaces per-segment
 * patterns. The system learns that different emotional truths work
 * for different humans — without prescribing any segmentation rule.
 *
 * Examples surfaced (when data supports):
 *
 *   - israeli audience: documentary realism historically improved retention
 *   - us-parents: low CTA pressure historically increased saves
 *   - crypto: aggressive CTA historically reduced trust
 *   - wellness: stillness historically increased rewatches
 *   - night audience: emotional ambiguity historically held attention
 *
 * Pure function. Same input → same output.
 */

import type { OutcomeRecord, OutcomeLabel, OutcomeMetrics } from './outcomeMemory';

// ─── output ───────────────────────────────────────────────────

export interface AudienceSegmentSummary {
  segment: string;
  outcomes: number;
  /** Mean engagement composite 0..10 across this segment. */
  averageEngagement: number;
  /** Most frequent outcome label in this segment. */
  dominantOutcome: OutcomeLabel | null;
  dominantOutcomeShare: number;
  /** Top-3 traits over-represented in this segment compared to the
   *  global outcome pool. */
  overRepresentedTraits: Array<{ trait: string; share: number; baseline: number }>;
  /** Plain-language line — "segment X historically ___" */
  description: string;
}

export interface AudienceSegmentReport {
  totalOutcomes: number;
  segments: AudienceSegmentSummary[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — audience segment intelligence describes historical group differences. ' +
  'It does not auto-target, auto-personalize, or auto-segment.';

// ─── helpers ──────────────────────────────────────────────────

function engagementScore(m: OutcomeMetrics): number {
  const saves      = Math.min(1, (m.saves ?? 0) / 10);
  const comments   = Math.min(1, (m.comments ?? 0) / 20);
  const shares     = Math.min(1, (m.shares ?? 0) / 10);
  const retention  = m.retention ?? 0;
  const scrollDepth = m.scrollDepth ?? 0;
  const bouncePenalty = 1 - (m.bounceRate ?? 0);
  return Math.max(0, Math.min(10,
    (retention * 0.40 + scrollDepth * 0.15 + saves * 0.15 +
     comments * 0.10 + shares * 0.10 + bouncePenalty * 0.10) * 10,
  ));
}

function r2(n: number): number { return Math.round(n * 100) / 100; }

const TRAIT_TESTS: Array<{ key: string; match: (r: OutcomeRecord) => boolean }> = [
  { key: 'high-realism',     match: (r) => r.realismLevel >= 7 },
  { key: 'low-realism',      match: (r) => r.realismLevel <= 3 },
  { key: 'high-persuasion',  match: (r) => r.persuasionIntensity >= 7 },
  { key: 'low-persuasion',   match: (r) => r.persuasionIntensity <= 3 },
  { key: 'stillness',        match: (r) => /still|silence|pause/.test((r.visualStyle + ' ' + r.narrativeSignature).toLowerCase()) },
  { key: 'mutation-burst',   match: (r) => r.cadenceState === 'burst' || r.mutationPressure >= 7 },
  { key: 'documentary',      match: (r) => /documentary|observed/.test(r.visualStyle.toLowerCase()) },
  { key: 'cinematic-polish', match: (r) => r.realismLevel <= 4 && /cinematic|polished/.test(r.visualStyle.toLowerCase()) },
];

// ─── main ─────────────────────────────────────────────────────

export function buildAudienceSegmentReport(outcomes: OutcomeRecord[]): AudienceSegmentReport {
  const groups = new Map<string, OutcomeRecord[]>();
  for (const r of outcomes) {
    const seg = r.audienceSegment || 'unspecified';
    if (!groups.has(seg)) groups.set(seg, []);
    groups.get(seg)!.push(r);
  }

  // Global trait baselines for over-representation calculation.
  const baselines = new Map<string, number>();
  for (const trait of TRAIT_TESTS) {
    const matching = outcomes.filter(trait.match).length;
    baselines.set(trait.key, outcomes.length === 0 ? 0 : matching / outcomes.length);
  }

  const segments: AudienceSegmentSummary[] = [];
  for (const [segment, records] of groups) {
    const engagement = records.length === 0
      ? 0
      : records.reduce((a, r) => a + engagementScore(r.metrics), 0) / records.length;
    const outcomeCounts = new Map<OutcomeLabel, number>();
    for (const r of records) outcomeCounts.set(r.downstreamOutcome, (outcomeCounts.get(r.downstreamOutcome) ?? 0) + 1);
    let dominant: [OutcomeLabel, number] | null = null;
    for (const [k, v] of outcomeCounts) {
      if (!dominant || v > dominant[1] || (v === dominant[1] && k.localeCompare(dominant[0]) < 0)) dominant = [k, v];
    }
    const dominantOutcome = dominant?.[0] ?? null;
    const dominantShare = dominant ? dominant[1] / records.length : 0;

    // Over-represented traits.
    const overRep: AudienceSegmentSummary['overRepresentedTraits'] = [];
    for (const trait of TRAIT_TESTS) {
      const segMatching = records.filter(trait.match).length;
      const segShare = records.length === 0 ? 0 : segMatching / records.length;
      const baselineShare = baselines.get(trait.key) ?? 0;
      if (segShare > baselineShare + 0.15 && segMatching >= 2) {
        overRep.push({ trait: trait.key, share: r2(segShare), baseline: r2(baselineShare) });
      }
    }
    overRep.sort((a, b) => (b.share - b.baseline) - (a.share - a.baseline) || a.trait.localeCompare(b.trait));

    const description = (() => {
      const parts: string[] = [`${segment} (${records.length} records, avg engagement ${r2(engagement)}/10)`];
      if (dominantOutcome) {
        parts.push(`most-common outcome: ${dominantOutcome} (${Math.round(dominantShare * 100)}%)`);
      }
      if (overRep.length > 0) {
        const top = overRep.slice(0, 2).map((t) => `${t.trait} (${Math.round(t.share * 100)}% vs ${Math.round(t.baseline * 100)}% baseline)`).join(', ');
        parts.push(`over-represented: ${top}`);
      }
      return parts.join('. ');
    })();

    segments.push({
      segment,
      outcomes: records.length,
      averageEngagement: r2(engagement),
      dominantOutcome,
      dominantOutcomeShare: r2(dominantShare),
      overRepresentedTraits: overRep.slice(0, 3),
      description,
    });
  }

  segments.sort((a, b) =>
    b.outcomes - a.outcomes ||
    b.averageEngagement - a.averageEngagement ||
    a.segment.localeCompare(b.segment),
  );

  return {
    totalOutcomes: outcomes.length,
    segments,
    reasonCodes: [
      `outcomes:${outcomes.length}`,
      `segments:${segments.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
