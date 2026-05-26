/**
 * CONFIDENCE MODEL (pure, observational)
 *
 * Measures how confident the system can be about each observational
 * axis. Confidence is NOT a prediction — it is a statement about how
 * well the data supports the observation.
 *
 * STRICT CONTRACT:
 *   - never claims certainty it does not have
 *   - never collapses uncertainty into a single answer
 *   - never used to gate or mutate generation
 *   - observatory only
 *
 * Same input → same output.
 */

// ─── loose structural subsets ────────────────────────────────

export interface OutcomeSubset {
  outcomes?: Array<{
    at?: number;
    audienceSegment?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    downstreamOutcome?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    metrics?: {
      retention?: number; saves?: number; comments?: number;
      shares?: number; bounceRate?: number; follows?: number;
      scrollDepth?: number;
    };
  }>;
}

export interface DriftSubset {
  observations?: Array<{
    overallCreativeHealth?: number;
    driftSeverity?: number;
    entropyLevel?: number;
    originalityPressure?: number;
    narrativeStability?: number;
    emotionalDiversity?: number;
    persuasionVariance?: number;
    trustErosionDrift?: number;
  }>;
}

export interface CulturalSubset {
  segments?: Array<{ segment: string; outcomes: number; averageEngagement: number }>;
  collectiveMemory?: Array<{ theme: string; occurrences: number; durability: number }>;
}

export interface ConfidenceInput {
  outcomes?: OutcomeSubset | null;
  drift?: DriftSubset | null;
  cultural?: CulturalSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export type ConfidenceLevel = 'low' | 'moderate' | 'stable' | 'high';

export interface AxisConfidence {
  axis: string;
  level: ConfidenceLevel;
  /** 0..10 — composite confidence reading. */
  score: number;
  sampleSize: number;
  variance: number;             // 0..10 — lower = more stable
  recurrenceCount: number;
  reasons: string[];
}

export interface ConfidenceReading {
  /** Overall composite confidence 0..10. */
  overallScore: number;
  overallLevel: ConfidenceLevel;
  axes: AxisConfidence[];
  /** Axes where confidence is below 'stable'. */
  unstableAxes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — confidence measures how well DATA supports observations. ' +
  'Uncertainty is preserved, never suppressed. The model never claims certainty ' +
  'it does not have and is never used to gate generation.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
function variance(xs: number[]): number {
  if (xs.length === 0) return 0;
  const m = avg(xs);
  return avg(xs.map((x) => Math.abs(x - m)));
}

function levelOf(score: number, sampleSize: number): ConfidenceLevel {
  if (sampleSize < 3) return 'low';
  if (score >= 8) return 'high';
  if (score >= 6) return 'stable';
  if (score >= 4) return 'moderate';
  return 'low';
}

/** Confidence for an axis whose value we have repeated samples for.
 *  Score combines sample-size adequacy + low variance + recurrence
 *  of the same observation. */
function axisConfidenceFromSamples(
  axis: string, values: number[], extraReasons: string[] = [],
): AxisConfidence {
  const sampleSize = values.length;
  const v = variance(values);
  // Score = sampleSize-weight + low-variance-weight.
  const sizeWeight = Math.min(sampleSize / 6, 1) * 5;     // up to +5 at 6 samples
  const stabilityWeight = (10 - clamp10(v * 2)) * 0.5;    // up to +5 if variance=0
  const score = r1(clamp10(sizeWeight + stabilityWeight));
  const recurrenceCount = sampleSize;
  const reasons: string[] = [...extraReasons];
  if (sampleSize < 3) reasons.push(`only ${sampleSize} sample(s)`);
  if (v >= 3) reasons.push(`high variance (${r1(v)})`);
  if (sampleSize >= 6 && v < 1.5) reasons.push('strong recurrence with low variance');
  return {
    axis, level: levelOf(score, sampleSize), score,
    sampleSize, variance: r1(v), recurrenceCount, reasons,
  };
}

// ─── main ─────────────────────────────────────────────────────

export function computeConfidence(input: ConfidenceInput): ConfidenceReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const driftObs = input.drift?.observations ?? [];
  const cultural = input.cultural;

  const axes: AxisConfidence[] = [];

  // Retention confidence
  axes.push(axisConfidenceFromSamples(
    'retention',
    outcomes.map((o) => o.metrics?.retention ?? -1).filter((v) => v >= 0) as number[],
  ));
  // Saves confidence
  axes.push(axisConfidenceFromSamples(
    'saves',
    outcomes.map((o) => o.metrics?.saves ?? -1).filter((v) => v >= 0) as number[],
  ));
  // Trust formation confidence
  axes.push(axisConfidenceFromSamples(
    'trust-formation',
    outcomes
      .map((o) => o.downstreamOutcome === 'trust-formation' ? 1 : 0)
      .slice(0, 24),
    ['outcome label aggregation'],
  ));
  // Creative health confidence
  axes.push(axisConfidenceFromSamples(
    'creative-health',
    driftObs.map((o) => o.overallCreativeHealth ?? -1).filter((v) => v >= 0) as number[],
  ));
  // Trust erosion confidence
  axes.push(axisConfidenceFromSamples(
    'trust-erosion',
    driftObs.map((o) => o.trustErosionDrift ?? 0),
  ));
  // Narrative stability confidence
  axes.push(axisConfidenceFromSamples(
    'narrative-stability',
    driftObs.map((o) => o.narrativeStability ?? -1).filter((v) => v >= 0) as number[],
  ));
  // Cultural per-segment confidence — based on sample size per segment.
  if (cultural?.segments) {
    const counts = cultural.segments.map((s) => s.outcomes);
    axes.push(axisConfidenceFromSamples(
      'cultural-signatures',
      counts,
      cultural.segments.length === 0 ? ['no segments observed'] : [],
    ));
  }
  // Collective memory durability confidence.
  if (cultural?.collectiveMemory) {
    const durabilities = cultural.collectiveMemory.map((m) => m.durability);
    axes.push(axisConfidenceFromSamples(
      'collective-memory-durability',
      durabilities,
    ));
  }

  // Overall composite — weighted average of axis scores, sample-size weighted.
  const totalSamples = axes.reduce((a, ax) => a + ax.sampleSize, 0);
  const overallScore = totalSamples === 0
    ? 0
    : r1(clamp10(
      axes.reduce((sum, ax) => sum + ax.score * (ax.sampleSize / totalSamples), 0),
    ));
  const overallLevel = levelOf(overallScore, totalSamples);
  const unstableAxes = axes
    .filter((ax) => ax.level === 'low' || ax.level === 'moderate')
    .map((ax) => ax.axis);

  return {
    overallScore,
    overallLevel,
    axes,
    unstableAxes,
    reasonCodes: [
      `overall:${overallLevel}`,
      `overall-score:${overallScore}/10`,
      `total-samples:${totalSamples}`,
      `unstable-axes:${unstableAxes.length}`,
      ...axes.map((ax) => `${ax.axis}:${ax.level}(${ax.score})`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
