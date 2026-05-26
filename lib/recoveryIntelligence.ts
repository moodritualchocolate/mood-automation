/**
 * RECOVERY INTELLIGENCE (pure)
 *
 * Tracks what HISTORICALLY HELPED. Looks across consequence-memory
 * episodes for conditions that consistently led to recovery
 * outcomes, and surfaces them so the operator can choose to repeat
 * those interventions.
 *
 * Examples the engine identifies (when supported by data):
 *
 *   - stabilization windows reduced fatigue
 *   - reduced CTA pressure restored trust
 *   - realism recovery restored engagement diversity
 *   - cadence slowing improved narrative health
 *   - mutation pauses reduced convergence
 *
 * Not every mutation helps. Some stabilization periods historically
 * outperform optimization. This engine names them — it does not
 * apply them.
 *
 * Pure function. Same input → same output.
 */

import type {
  ConsequenceEpisode, ConditionSnapshot, ConsequenceOutcome,
} from './consequenceIntelligenceMemory';

const ADVISORY_NOTICE =
  'Observatory only — recovery intelligence describes what historically helped. ' +
  'The system does not auto-apply any of these patterns.';

const RECOVERY_OUTCOMES: ReadonlySet<ConsequenceOutcome> = new Set([
  'trust-recovered',
  'fatigue-improved',
  'originality-restored',
  'persuasion-stabilized',
  'identity-stabilized',
  'convergence-reversed',
  'emotional-realism-improved',
  'campaign-coherence-recovered',
]);

// ─── intervention taxonomy ────────────────────────────────────

interface InterventionDefinition {
  key: string;
  /** Condition predicate — what intervention pattern was present. */
  match: (c: ConditionSnapshot) => boolean;
  label: string;
}

const INTERVENTIONS: InterventionDefinition[] = [
  {
    key: 'stabilization-window',
    match: (c) => c.stabilizationWindows >= 1 && c.mutationCount === 0,
    label: 'stabilization window (no mutations applied)',
  },
  {
    key: 'reduced-cta-pressure',
    match: (c) => c.persuasionIntensity <= 4,
    label: 'reduced CTA / persuasion pressure',
  },
  {
    key: 'realism-recovery',
    match: (c) => c.visualConvergence <= 3 || c.adaptationPriority === 'realism-recovery',
    label: 'realism-recovery focus (low visual convergence)',
  },
  {
    key: 'cadence-slowing',
    match: (c) => c.cadenceState === 'gradual' || c.cadenceState === 'stabilizing',
    label: 'cadence slowing (gradual / stabilizing)',
  },
  {
    key: 'mutation-pause',
    match: (c) => c.mutationCount === 0 && (c.mutationPressure <= 3 || c.cadenceState === 'paused'),
    label: 'mutation pause (no recent mutations applied)',
  },
  {
    key: 'low-trust-debt-stance',
    match: (c) => c.trustDebt <= 3,
    label: 'low trust debt stance',
  },
  {
    key: 'fatigue-recovery-window',
    match: (c) => c.adaptationPriority === 'fatigue-recovery',
    label: 'fatigue-recovery prioritization',
  },
];

// ─── output ───────────────────────────────────────────────────

export interface RecoveryPattern {
  intervention: string;
  recoveryOutcome: ConsequenceOutcome;
  occurrences: number;
  /** Recovery share within the intervention pool. */
  recoveryShare: number;
  /** Average magnitude of the recovery delta. */
  averageMagnitude: number;
  description: string;
}

export interface StabilizationSuccess {
  intervention: string;
  totalEpisodes: number;
  recoveryEpisodes: number;
  recoveryShare: number;
  dominantOutcome: ConsequenceOutcome | null;
  description: string;
}

export interface RecoveryIntelligence {
  totalEpisodes: number;
  recoveryEpisodeCount: number;
  recoveryPatterns: RecoveryPattern[];
  stabilizationSuccesses: StabilizationSuccess[];
  /** Plain-language top-3 takeaways. */
  topRecoveryTakeaways: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── main ─────────────────────────────────────────────────────

export function buildRecoveryIntelligence(
  episodes: ConsequenceEpisode[],
): RecoveryIntelligence {
  const recoveryEpisodes = episodes.filter((e) => RECOVERY_OUTCOMES.has(e.downstreamOutcome));

  // ── Per (intervention, outcome) — recovery patterns ───────
  const recoveryPatterns: RecoveryPattern[] = [];
  for (const intervention of INTERVENTIONS) {
    const matching = recoveryEpisodes.filter((e) => intervention.match(e.condition));
    if (matching.length < 1) continue;
    const byOutcome = new Map<ConsequenceOutcome, ConsequenceEpisode[]>();
    for (const ep of matching) {
      if (!byOutcome.has(ep.downstreamOutcome)) byOutcome.set(ep.downstreamOutcome, []);
      byOutcome.get(ep.downstreamOutcome)!.push(ep);
    }
    for (const [outcome, eps] of byOutcome) {
      const avgMag = Math.round(
        (eps.reduce((a, e) => a + e.outcomeMagnitude, 0) / eps.length) * 10,
      ) / 10;
      const share = eps.length / matching.length;
      recoveryPatterns.push({
        intervention: intervention.label,
        recoveryOutcome: outcome,
        occurrences: eps.length,
        recoveryShare: Math.round(share * 100) / 100,
        averageMagnitude: avgMag,
        description:
          `${intervention.label} historically correlated with ${outcome} ` +
          `(${eps.length} episode${eps.length === 1 ? '' : 's'}, avg magnitude ${avgMag}/10).`,
      });
    }
  }
  recoveryPatterns.sort((a, b) =>
    (b.occurrences * b.recoveryShare) - (a.occurrences * a.recoveryShare) ||
    a.intervention.localeCompare(b.intervention),
  );

  // ── Per intervention — stabilization success rate ─────────
  const stabilizationSuccesses: StabilizationSuccess[] = [];
  for (const intervention of INTERVENTIONS) {
    const matching = episodes.filter((e) => intervention.match(e.condition));
    if (matching.length === 0) continue;
    const recoveries = matching.filter((e) => RECOVERY_OUTCOMES.has(e.downstreamOutcome));
    const share = recoveries.length / matching.length;
    if (share < 0.3 && recoveries.length < 2) continue;  // not strong enough
    // Pick dominant recovery outcome.
    const outcomeCounts = new Map<ConsequenceOutcome, number>();
    for (const ep of recoveries) outcomeCounts.set(ep.downstreamOutcome, (outcomeCounts.get(ep.downstreamOutcome) ?? 0) + 1);
    let dominantOutcome: ConsequenceOutcome | null = null;
    let dominantCount = 0;
    for (const [k, v] of outcomeCounts) {
      if (v > dominantCount || (v === dominantCount && dominantOutcome !== null && k.localeCompare(dominantOutcome) < 0)) {
        dominantOutcome = k; dominantCount = v;
      }
    }
    stabilizationSuccesses.push({
      intervention: intervention.label,
      totalEpisodes: matching.length,
      recoveryEpisodes: recoveries.length,
      recoveryShare: Math.round(share * 100) / 100,
      dominantOutcome,
      description:
        `${intervention.label}: ${recoveries.length}/${matching.length} episodes ended in recovery ` +
        `(${Math.round(share * 100)}%)` +
        (dominantOutcome ? ` — most common: ${dominantOutcome}.` : '.'),
    });
  }
  stabilizationSuccesses.sort((a, b) =>
    b.recoveryShare - a.recoveryShare ||
    b.totalEpisodes - a.totalEpisodes ||
    a.intervention.localeCompare(b.intervention),
  );

  const topRecoveryTakeaways: string[] = stabilizationSuccesses.slice(0, 3).map((s) => s.description);

  const reasonCodes: string[] = [
    `episodes:${episodes.length}`,
    `recovery-episodes:${recoveryEpisodes.length}`,
    `recovery-patterns:${recoveryPatterns.length}`,
    `stabilization-successes:${stabilizationSuccesses.length}`,
  ];

  return {
    totalEpisodes: episodes.length,
    recoveryEpisodeCount: recoveryEpisodes.length,
    recoveryPatterns,
    stabilizationSuccesses,
    topRecoveryTakeaways,
    reasonCodes,
    advisoryNotice: ADVISORY_NOTICE,
  };
}
