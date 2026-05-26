/**
 * CONTRADICTION DETECTOR (pure, observational)
 *
 * Detects COMPETING TRUTHS across the system's signals. The engine
 * exists because human reality contains contradictions: high
 * performance can coexist with low trust; strong replay can pair
 * with emotional fatigue; engagement can coexist with manipulation
 * pressure. The engine NAMES contradictions — never resolves them
 * in favor of one side.
 *
 * Distinct from lib/contradictionEngine.ts (sacrifice physics).
 *
 * STRICT CONTRACT:
 *   - no auto-resolution
 *   - no forced certainty
 *   - never collapses ambiguity into a single conclusion
 */

// ─── loose structural subsets ────────────────────────────────

export interface ContradictionInput {
  outcomes?: { outcomes?: Array<{
    downstreamOutcome?: string;
    realismLevel?: number;
    persuasionIntensity?: number;
    cadenceState?: string;
    metrics?: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; follows?: number; rewatches?: number; ctr?: number };
  }> } | null;
  humanTruth?: {
    authenticityScore?: number;
    feltHumanScore?: number;
    optimizedContentScore?: number;
    overOptimizationRisk?: number;
    signals?: { dignity?: number; emotionalCoherence?: number; vulnerability?: number };
  } | null;
  manipulationPressure?: {
    pressureLevel?: 'low' | 'moderate' | 'high' | 'critical';
    pressureScore?: number;
  } | null;
  drift?: { observations?: Array<{
    overallCreativeHealth?: number;
    trustErosionDrift?: number;
    persuasionVariance?: number;
    narrativeStability?: number;
    emotionalDiversity?: number;
  }> } | null;
  fatigue?: { fatigueLevel?: number; freshnessScore?: number } | null;
  rituals?: { detected?: Array<{ emotionalAttachmentScore?: number }> } | null;
}

// ─── output ───────────────────────────────────────────────────

export interface Contradiction {
  key: string;
  sideA: string;
  sideB: string;
  severity: number;             // 0..10
  description: string;
}

export interface ContradictionReading {
  totalContradictions: number;
  contradictions: Contradiction[];
  contradictionDensity: number; // 0..10
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the contradiction detector surfaces COMPETING TRUTHS. ' +
  'It NEVER resolves them in favor of one side. Both readings remain valid.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeContradictions(input: ContradictionInput): ContradictionReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const driftObs = input.drift?.observations ?? [];
  const contradictions: Contradiction[] = [];

  // 1. high performance + low trust
  const highPerfNoTrust = outcomes.filter((o) =>
    ((o.metrics?.retention ?? 0) >= 0.6 || (o.metrics?.saves ?? 0) >= 3) &&
    (o.metrics?.follows ?? 0) === 0 &&
    o.downstreamOutcome !== 'trust-formation',
  ).length;
  if (highPerfNoTrust >= 1 && outcomes.length > 0) {
    contradictions.push({
      key: 'high-performance + low-trust',
      sideA: `${highPerfNoTrust} record(s) with strong retention/saves`,
      sideB: 'no trust formation in the same records',
      severity: r1(clamp10((highPerfNoTrust / outcomes.length) * 12)),
      description: 'audience held attention without forming trust — both are true at the same time',
    });
  }

  // 2. strong replay + emotional fatigue
  const strongReplayFatigued = outcomes.filter((o) =>
    (o.metrics?.rewatches ?? 0) >= 1 &&
    o.downstreamOutcome === 'fatigue-acceleration',
  ).length;
  if (strongReplayFatigued >= 1) {
    contradictions.push({
      key: 'replay + emotional-fatigue',
      sideA: `${strongReplayFatigued} record(s) prompted rewatches`,
      sideB: 'fatigue-acceleration was also labeled on those records',
      severity: r1(clamp10(strongReplayFatigued * 3)),
      description: 'the same content drew replays AND eroded audience freshness',
    });
  }

  // 3. high engagement + low authenticity
  const authenticity = input.humanTruth?.authenticityScore ?? -1;
  const meanRetention = avg(outcomes.map((o) => o.metrics?.retention ?? 0));
  if (authenticity >= 0 && authenticity <= 4 && meanRetention >= 0.5) {
    contradictions.push({
      key: 'engagement + low-authenticity',
      sideA: `mean retention ${r1(meanRetention)}`,
      sideB: `authenticity ${r1(authenticity)}/10`,
      severity: r1(clamp10((meanRetention * 10) - authenticity)),
      description: 'engagement is real; authenticity reads low — both observations remain on the table',
    });
  }

  // 4. high resonance + manipulation pressure
  const resonance = input.humanTruth?.feltHumanScore ?? -1;
  const manipScore = input.manipulationPressure?.pressureScore ?? -1;
  if (resonance >= 6 && manipScore >= 6) {
    contradictions.push({
      key: 'resonance + manipulation-pressure',
      sideA: `felt-human ${r1(resonance)}/10`,
      sideB: `manipulation pressure ${r1(manipScore)}/10`,
      severity: r1(clamp10(Math.min(resonance, manipScore))),
      description: 'the content feels human AND carries manipulation pressure — neither cancels the other',
    });
  }

  // 5. emotional openness + trust erosion
  const meanVuln = input.humanTruth?.signals?.vulnerability ?? -1;
  const trustErosion = avg(driftObs.map((o) => Math.abs(o.trustErosionDrift ?? 0)));
  if (meanVuln >= 6 && trustErosion >= 2) {
    contradictions.push({
      key: 'emotional-openness + trust-erosion',
      sideA: `vulnerability signal ${r1(meanVuln)}/10`,
      sideB: `trust erosion drift ${r1(trustErosion)}`,
      severity: r1(clamp10(Math.min(meanVuln, trustErosion * 3))),
      description: 'the content shows openness; trust still drifts — operator inspects what is honest vs performative',
    });
  }

  // 6. realism + low conversion
  const meanRealism = avg(outcomes.map((o) => o.realismLevel ?? 5));
  const conversionRate = outcomes.length === 0 ? 0 : outcomes.filter((o) =>
    o.downstreamOutcome === 'conversion-spike',
  ).length / outcomes.length;
  if (meanRealism >= 7 && conversionRate < 0.05 && outcomes.length >= 4) {
    contradictions.push({
      key: 'realism + low-conversion',
      sideA: `realism averaging ${r1(meanRealism)}/10`,
      sideB: `conversion-spike share ${Math.round(conversionRate * 100)}%`,
      severity: r1(clamp10((meanRealism - 5) * 1.5 + (1 - conversionRate) * 4)),
      description: 'the content is honest; conversion does not follow — both readings are useful',
    });
  }

  // 7. strong ritual attachment + low scalability
  const ritualAttachments = (input.rituals?.detected ?? []).map((d) => d.emotionalAttachmentScore ?? 0);
  const maxAttachment = ritualAttachments.length === 0 ? 0 : Math.max(...ritualAttachments);
  const ritualScale = ritualAttachments.length;
  if (maxAttachment >= 6 && ritualScale <= 2) {
    contradictions.push({
      key: 'ritual-attachment + low-scalability',
      sideA: `strongest ritual attachment ${r1(maxAttachment)}/10`,
      sideB: `only ${ritualScale} ritual theme(s) observed`,
      severity: r1(clamp10(maxAttachment - ritualScale)),
      description: 'the system has deep attachment to a narrow ritual base — both depth and limitation are present',
    });
  }

  contradictions.sort((a, b) => b.severity - a.severity || a.key.localeCompare(b.key));

  const contradictionDensity = contradictions.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...contradictions.map((c) => c.severity)) * 0.5 +
      avg(contradictions.map((c) => c.severity)) * 0.5,
    ));

  return {
    totalContradictions: contradictions.length,
    contradictions,
    contradictionDensity,
    reasonCodes: [
      `contradictions:${contradictions.length}`,
      `density:${contradictionDensity}/10`,
      ...contradictions.slice(0, 5).map((c) => `${c.key}:${c.severity}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
