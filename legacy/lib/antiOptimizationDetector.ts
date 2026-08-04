/**
 * ANTI-OPTIMIZATION DETECTOR (pure, human-protective)
 *
 * Recognizes content that performs WELL because it EXPLOITS humans —
 * not because it resonates. Labels "performance without trust".
 *
 * STRICT CONTRACT: observatory only. The detector exists to surface
 * exploitative patterns so the operator can refuse them — never to
 * amplify them.
 */

import type { HumanTruthInput } from './humanTruthIntelligence';

export type ExploitationPatternKey =
  | 'outrage-loop'
  | 'anxiety-hook'
  | 'fake-urgency'
  | 'hyper-stimulation'
  | 'trauma-extraction'
  | 'false-intimacy'
  | 'attention-hijacking';

export interface ExploitationSignal {
  pattern: ExploitationPatternKey;
  severity: number;        // 0..10
  occurrences: number;     // count of records exhibiting the pattern
  explanation: string;
}

export interface AntiOptimizationReading {
  /** 0..10 — overall exploitation pressure. */
  exploitationPressure: number;
  performanceWithoutTrustCount: number;
  signals: ExploitationSignal[];
  /** True when at least one record performed well by EXPLOITING. */
  performanceWithoutTrustDetected: boolean;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — anti-optimization signals are surfaced so the operator can ' +
  'REFUSE exploitative patterns. The system never replicates or amplifies them.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }

export function computeAntiOptimization(input: HumanTruthInput): AntiOptimizationReading {
  const outcomes = (input.outcomes?.outcomes ?? []).slice(-48);

  // Per-pattern detection functions return the count of matching records.
  const detect = (
    pattern: ExploitationPatternKey,
    explanation: string,
    match: (o: NonNullable<typeof outcomes[number]>) => boolean,
  ): ExploitationSignal | null => {
    const matching = outcomes.filter(match).length;
    if (matching < 1) return null;
    const share = matching / Math.max(outcomes.length, 1);
    return {
      pattern,
      severity: r1(clamp10(share * 14)),
      occurrences: matching,
      explanation: `${explanation} (${matching}/${outcomes.length} records)`,
    };
  };

  const candidates: Array<ExploitationSignal | null> = [
    detect('outrage-loop',
      'high shares + comments but low retention (engagement-without-depth)',
      (o) =>
        (o.metrics?.shares ?? 0) >= 3 &&
        (o.metrics?.comments ?? 0) >= 5 &&
        (o.metrics?.retention ?? 1) <= 0.3,
    ),
    detect('anxiety-hook',
      'high bounce + high persuasion intensity',
      (o) => (o.metrics?.bounceRate ?? 0) >= 0.5 && (o.persuasionIntensity ?? 0) >= 7,
    ),
    detect('fake-urgency',
      'conversion-driven with rejection',
      (o) =>
        o.downstreamOutcome === 'aggressive-cta-rejection' ||
        (o.downstreamOutcome === 'conversion-spike' && (o.metrics?.bounceRate ?? 0) >= 0.4),
    ),
    detect('hyper-stimulation',
      'burst cadence with very high mutation pressure',
      (o) =>
        o.cadenceState === 'burst' && (o.mutationPressure ?? 0) >= 7,
    ),
    detect('trauma-extraction',
      'high impressions with very low engagement depth (taking attention without giving value)',
      (o) =>
        (o.metrics?.impressions ?? 0) >= 1000 &&
        (o.metrics?.saves ?? 0) + (o.metrics?.shares ?? 0) <= 1 &&
        (o.metrics?.retention ?? 1) <= 0.25,
    ),
    detect('false-intimacy',
      'high persuasion + low realism (intimate framing, optimized delivery)',
      (o) =>
        (o.persuasionIntensity ?? 0) >= 7 &&
        (o.realismLevel ?? 10) <= 3,
    ),
    detect('attention-hijacking',
      'very high retention with no trust formation, no profile visits, no follows',
      (o) =>
        (o.metrics?.retention ?? 0) >= 0.7 &&
        (o.metrics?.follows ?? 0) === 0 &&
        (o.metrics?.profileVisits ?? 0) <= 1 &&
        o.downstreamOutcome !== 'trust-formation',
    ),
  ];

  const signals: ExploitationSignal[] = candidates.filter((s): s is ExploitationSignal => s !== null);
  signals.sort((a, b) => b.severity - a.severity || a.pattern.localeCompare(b.pattern));

  // Performance without trust: any outcome that had strong engagement
  // but zero trust signals.
  const performanceWithoutTrustCount = outcomes.filter((o) =>
    ((o.metrics?.likes ?? 0) >= 20 || (o.metrics?.retention ?? 0) >= 0.6) &&
    (o.metrics?.follows ?? 0) === 0 &&
    o.downstreamOutcome !== 'trust-formation',
  ).length;
  const performanceWithoutTrustDetected = performanceWithoutTrustCount > 0;

  const exploitationPressure = signals.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...signals.map((s) => s.severity)) * 0.7 +
      (signals.reduce((a, s) => a + s.severity, 0) / signals.length) * 0.3,
    ));

  return {
    exploitationPressure,
    performanceWithoutTrustCount,
    performanceWithoutTrustDetected,
    signals,
    reasonCodes: [
      `exploitation-pressure:${exploitationPressure}/10`,
      `performance-without-trust:${performanceWithoutTrustCount}`,
      `signal-count:${signals.length}`,
      ...signals.slice(0, 5).map((s) => `${s.pattern}:${s.severity}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
