/**
 * CONSEQUENCE ANALYZER (pure)
 *
 * Detects repeated historical chains in consequence memory and
 * reports them in observational, non-predictive language:
 *
 *   "Historically correlated with…"  ✓
 *   "This WILL happen."              ✗ (forbidden)
 *
 * The analyzer does NOT predict. It groups similar conditions
 * across recorded episodes and surfaces the dominant outcome for
 * each group. The output also includes the strategic memory
 * timeline (collapse periods, recovery periods, adaptation bursts,
 * trust restoration eras, identity erosion windows, healthiest
 * creative epochs).
 *
 * Same memory → same output.
 */

import type {
  ConsequenceEpisode, ConditionSnapshot, ConsequenceOutcome,
} from './consequenceIntelligenceMemory';
import {
  classifyConsequenceSeverity, type ConsequenceSeverity,
} from './consequenceSeverityEngine';

// ─── bucketing helpers ────────────────────────────────────────

function bucket(v: number): 'L' | 'M' | 'H' {
  if (v >= 7) return 'H';
  if (v >= 4) return 'M';
  return 'L';
}

function fingerprint(condition: ConditionSnapshot): string {
  return [
    `trust:${bucket(condition.trustDebt)}`,
    `fat:${bucket(condition.fatigue)}`,
    `mut:${bucket(condition.mutationPressure)}`,
    `pers:${bucket(condition.persuasionIntensity)}`,
    `vis:${bucket(condition.visualConvergence)}`,
    `emot:${bucket(condition.emotionalFlattening)}`,
  ].join('|');
}

// ─── output types ─────────────────────────────────────────────

export interface ConsequencePattern {
  conditionFingerprint: string;
  occurrences: number;
  primaryOutcome: ConsequenceOutcome;
  outcomeShare: number;          // 0..1
  averageMagnitude: number;
  averageSeverity: ConsequenceSeverity;
  exampleConditions: ConditionSnapshot[];   // up to 3
  description: string;
}

export interface HistoricalCorrelation {
  /** Condition trait that is over-represented in episodes with this outcome. */
  trait: string;
  outcome: ConsequenceOutcome;
  occurrences: number;
  share: number;                 // 0..1
  description: string;
}

export interface RiskEscalation {
  outcome: ConsequenceOutcome;
  occurrences: number;
  averageMagnitude: number;
  averageSeverity: ConsequenceSeverity;
  description: string;
}

export type TimelineEvent =
  | { type: 'collapse-period'; at: number; outcome: ConsequenceOutcome; magnitude: number; severity: ConsequenceSeverity }
  | { type: 'recovery-period'; at: number; outcome: ConsequenceOutcome; magnitude: number; severity: ConsequenceSeverity }
  | { type: 'adaptation-burst'; at: number; mutationPressure: number }
  | { type: 'trust-restoration-era'; at: number; trustDebt: number; trustDelta: number }
  | { type: 'identity-erosion-window'; at: number; severity: ConsequenceSeverity }
  | { type: 'healthiest-epoch'; at: number; healthDelta: number };

export interface ConsequenceAnalysis {
  totalEpisodes: number;
  consequencePatterns: ConsequencePattern[];
  historicalCorrelations: HistoricalCorrelation[];
  riskEscalations: RiskEscalation[];
  strategicTimeline: TimelineEvent[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — historical correlation, never prediction. The system ' +
  'does not act on consequence patterns; the operator interprets them.';

const RECOVERY_OUTCOMES = new Set<ConsequenceOutcome>([
  'trust-recovered', 'fatigue-improved', 'originality-restored',
  'persuasion-stabilized', 'identity-stabilized', 'convergence-reversed',
  'emotional-realism-improved', 'campaign-coherence-recovered',
]);

const COLLAPSE_OUTCOMES = new Set<ConsequenceOutcome>([
  'trust-collapsed', 'persuasion-collapsed', 'identity-eroded',
  'campaign-coherence-degraded', 'aggression-escalation-failed',
  'fatigue-worsened', 'convergence-accelerated',
  'emotional-flattening-worsened', 'originality-exhausted',
]);

// ─── pattern detection ────────────────────────────────────────

function detectPatterns(episodes: ConsequenceEpisode[]): ConsequencePattern[] {
  const groups = new Map<string, ConsequenceEpisode[]>();
  for (const ep of episodes) {
    const fp = fingerprint(ep.condition);
    if (!groups.has(fp)) groups.set(fp, []);
    groups.get(fp)!.push(ep);
  }
  const patterns: ConsequencePattern[] = [];
  for (const [fp, eps] of groups) {
    if (eps.length < 2) continue;          // need recurrence
    // Count outcomes.
    const counts = new Map<ConsequenceOutcome, number>();
    for (const ep of eps) counts.set(ep.downstreamOutcome, (counts.get(ep.downstreamOutcome) ?? 0) + 1);
    let best: [ConsequenceOutcome, number] | null = null;
    for (const [k, v] of counts) {
      if (!best || v > best[1] || (v === best[1] && k.localeCompare(best[0]) < 0)) best = [k, v];
    }
    const [primaryOutcome, count] = best!;
    const share = count / eps.length;
    const avgMag = Math.round(
      (eps.reduce((a, ep) => a + ep.outcomeMagnitude, 0) / eps.length) * 10,
    ) / 10;
    // Average severity is computed by ranked majority.
    const severityCounts = { minor: 0, moderate: 0, severe: 0, critical: 0 } as Record<ConsequenceSeverity, number>;
    for (const ep of eps) severityCounts[classifyConsequenceSeverity(ep)] += 1;
    const sortedSev = (Object.entries(severityCounts) as Array<[ConsequenceSeverity, number]>)
      .sort((a, b) => b[1] - a[1]);
    const averageSeverity = sortedSev[0][0];
    patterns.push({
      conditionFingerprint: fp,
      occurrences: eps.length,
      primaryOutcome,
      outcomeShare: Math.round(share * 100) / 100,
      averageMagnitude: avgMag,
      averageSeverity,
      exampleConditions: eps.slice(0, 3).map((e) => e.condition),
      description:
        `Historically correlated with ${primaryOutcome} ` +
        `(${count}/${eps.length} episodes, average magnitude ${avgMag}/10, ${averageSeverity}).`,
    });
  }
  // Sort by occurrences * share (most concentrated patterns first).
  patterns.sort((a, b) =>
    (b.occurrences * b.outcomeShare) - (a.occurrences * a.outcomeShare) ||
    a.conditionFingerprint.localeCompare(b.conditionFingerprint),
  );
  return patterns;
}

// ─── per-trait correlations ───────────────────────────────────

function detectCorrelations(episodes: ConsequenceEpisode[]): HistoricalCorrelation[] {
  const correlations: HistoricalCorrelation[] = [];
  // For each (trait, outcome) check episodes where the trait was high
  // and the outcome occurred.
  const TRAITS: Array<{ name: string; check: (c: ConditionSnapshot) => boolean }> = [
    { name: 'high-trust-debt',        check: (c) => c.trustDebt >= 7 },
    { name: 'high-mutation-pressure', check: (c) => c.mutationPressure >= 7 },
    { name: 'high-visual-convergence', check: (c) => c.visualConvergence >= 7 },
    { name: 'high-emotional-flattening', check: (c) => c.emotionalFlattening >= 7 },
    { name: 'high-fatigue',           check: (c) => c.fatigue >= 7 },
    { name: 'high-persuasion-intensity', check: (c) => c.persuasionIntensity >= 7 },
    { name: 'low-stabilization',      check: (c) => c.stabilizationWindows === 0 && c.mutationCount >= 2 },
    { name: 'recent-stabilization',   check: (c) => c.stabilizationWindows >= 1 && c.mutationCount === 0 },
  ];
  for (const trait of TRAITS) {
    const matching = episodes.filter((e) => trait.check(e.condition));
    if (matching.length < 2) continue;
    const outcomeCounts = new Map<ConsequenceOutcome, number>();
    for (const ep of matching) outcomeCounts.set(ep.downstreamOutcome, (outcomeCounts.get(ep.downstreamOutcome) ?? 0) + 1);
    for (const [outcome, count] of outcomeCounts) {
      const share = count / matching.length;
      // Only surface meaningful correlations.
      if (share < 0.4 || count < 2) continue;
      correlations.push({
        trait: trait.name,
        outcome,
        occurrences: count,
        share: Math.round(share * 100) / 100,
        description:
          `${trait.name} historically correlated with ${outcome} in ` +
          `${count}/${matching.length} episodes (${Math.round(share * 100)}%).`,
      });
    }
  }
  correlations.sort((a, b) =>
    (b.occurrences * b.share) - (a.occurrences * a.share) ||
    a.trait.localeCompare(b.trait),
  );
  return correlations;
}

// ─── risk escalations ─────────────────────────────────────────

function detectRiskEscalations(episodes: ConsequenceEpisode[]): RiskEscalation[] {
  const escalations: RiskEscalation[] = [];
  const byOutcome = new Map<ConsequenceOutcome, ConsequenceEpisode[]>();
  for (const ep of episodes) {
    if (!COLLAPSE_OUTCOMES.has(ep.downstreamOutcome)) continue;
    if (!byOutcome.has(ep.downstreamOutcome)) byOutcome.set(ep.downstreamOutcome, []);
    byOutcome.get(ep.downstreamOutcome)!.push(ep);
  }
  for (const [outcome, eps] of byOutcome) {
    const avgMag = Math.round(
      (eps.reduce((a, e) => a + e.outcomeMagnitude, 0) / eps.length) * 10,
    ) / 10;
    const severityCounts = { minor: 0, moderate: 0, severe: 0, critical: 0 } as Record<ConsequenceSeverity, number>;
    for (const ep of eps) severityCounts[classifyConsequenceSeverity(ep)] += 1;
    const averageSeverity = (Object.entries(severityCounts) as Array<[ConsequenceSeverity, number]>)
      .sort((a, b) => b[1] - a[1])[0][0];
    escalations.push({
      outcome,
      occurrences: eps.length,
      averageMagnitude: avgMag,
      averageSeverity,
      description: `${outcome} observed in ${eps.length} episode(s), avg magnitude ${avgMag}/10, ${averageSeverity}.`,
    });
  }
  escalations.sort((a, b) =>
    b.occurrences - a.occurrences || a.outcome.localeCompare(b.outcome),
  );
  return escalations;
}

// ─── strategic timeline ───────────────────────────────────────

function buildTimeline(episodes: ConsequenceEpisode[]): TimelineEvent[] {
  const events: TimelineEvent[] = [];
  for (const ep of episodes) {
    const severity = classifyConsequenceSeverity(ep);
    if (COLLAPSE_OUTCOMES.has(ep.downstreamOutcome)) {
      events.push({ type: 'collapse-period', at: ep.outcomeAt, outcome: ep.downstreamOutcome, magnitude: ep.outcomeMagnitude, severity });
    } else if (RECOVERY_OUTCOMES.has(ep.downstreamOutcome)) {
      events.push({ type: 'recovery-period', at: ep.outcomeAt, outcome: ep.downstreamOutcome, magnitude: ep.outcomeMagnitude, severity });
    }
    if (ep.condition.mutationPressure >= 6) {
      events.push({ type: 'adaptation-burst', at: ep.conditionAt, mutationPressure: ep.condition.mutationPressure });
    }
    if (ep.downstreamOutcome === 'trust-recovered' && ep.outcomeMagnitude >= 2) {
      events.push({ type: 'trust-restoration-era', at: ep.outcomeAt, trustDebt: ep.condition.trustDebt, trustDelta: ep.deltas.trustDebt });
    }
    if (ep.downstreamOutcome === 'identity-eroded') {
      events.push({ type: 'identity-erosion-window', at: ep.outcomeAt, severity });
    }
    if (ep.downstreamOutcome === 'campaign-coherence-recovered' && ep.deltas.overallCreativeHealth >= 3) {
      events.push({ type: 'healthiest-epoch', at: ep.outcomeAt, healthDelta: ep.deltas.overallCreativeHealth });
    }
  }
  events.sort((a, b) => a.at - b.at);
  return events;
}

// ─── main ─────────────────────────────────────────────────────

export function buildConsequenceAnalysis(episodes: ConsequenceEpisode[]): ConsequenceAnalysis {
  const consequencePatterns = detectPatterns(episodes);
  const historicalCorrelations = detectCorrelations(episodes);
  const riskEscalations = detectRiskEscalations(episodes);
  const strategicTimeline = buildTimeline(episodes);

  const reasonCodes: string[] = [
    `episodes:${episodes.length}`,
    `patterns:${consequencePatterns.length}`,
    `correlations:${historicalCorrelations.length}`,
    `risk-escalations:${riskEscalations.length}`,
    `timeline-events:${strategicTimeline.length}`,
  ];

  return {
    totalEpisodes: episodes.length,
    consequencePatterns,
    historicalCorrelations,
    riskEscalations,
    strategicTimeline,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
