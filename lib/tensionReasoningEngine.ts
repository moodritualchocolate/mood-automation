/**
 * TENSION REASONING ENGINE (pure, observational)
 *
 * Names UNRESOLVED TENSIONS in the system's observations. Tensions
 * are forces that pull in opposite directions but neither can win
 * without breaking the other. The engine PRESERVES tension — never
 * collapses it.
 *
 * STRICT CONTRACT:
 *   - never resolves a tension in favor of one side
 *   - never declares which side is "correct"
 *   - phrasing: "both ___ and ___ are pressing"
 */

export interface TensionInput {
  outcomes?: { outcomes?: Array<{
    realismLevel?: number;
    persuasionIntensity?: number;
    cadenceState?: string;
    downstreamOutcome?: string;
    metrics?: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; follows?: number; rewatches?: number };
  }> } | null;
  humanTruth?: {
    signals?: { dignity?: number; vulnerability?: number; observationalHonesty?: number; emotionalSpaciousness?: number };
  } | null;
  manipulationPressure?: { pressureScore?: number } | null;
  rituals?: { detected?: Array<{ emotionalAttachmentScore?: number }> } | null;
  fatigue?: { fatigueLevel?: number } | null;
}

export interface Tension {
  key: string;
  sideA: string;
  sideB: string;
  /** 0..10 — how strong the tension is. */
  tensionScore: number;
  /** Statement that PRESERVES both sides. */
  preservedStatement: string;
}

export interface TensionReasoningReading {
  totalTensions: number;
  tensions: Tension[];
  tensionDensity: number;       // 0..10
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — tensions are PRESERVED, never collapsed in favor of one side. ' +
  'The engine names what is in productive disagreement.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeTensions(input: TensionInput): TensionReasoningReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const tensions: Tension[] = [];

  const meanRetention = avg(outcomes.map((o) => o.metrics?.retention ?? 0));
  const meanFollows = avg(outcomes.map((o) => Math.min(1, (o.metrics?.follows ?? 0) / 5)));
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanRealism = avg(outcomes.map((o) => o.realismLevel ?? 5));
  const burstShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'burst').length / outcomes.length;
  const dignity = input.humanTruth?.signals?.dignity ?? -1;
  const vuln = input.humanTruth?.signals?.vulnerability ?? -1;
  const manip = input.manipulationPressure?.pressureScore ?? -1;
  const ritualAttachment = avg((input.rituals?.detected ?? []).map((d) => d.emotionalAttachmentScore ?? 0));
  const fatigueLevel = input.fatigue?.fatigueLevel ?? -1;

  // 1. performance vs dignity
  if (meanRetention >= 0.5 && dignity >= 0 && dignity <= 5) {
    tensions.push({
      key: 'performance ↔ dignity',
      sideA: `mean retention ${r1(meanRetention * 10)}/10`,
      sideB: `dignity signal ${r1(dignity)}/10`,
      tensionScore: r1(clamp10((meanRetention * 10) - dignity + 2)),
      preservedStatement: 'attention is being held AND dignity is fragile — both readings stand simultaneously',
    });
  }

  // 2. trust vs scalability — trust formation rare while reach grows
  const trustFormCount = outcomes.filter((o) => o.downstreamOutcome === 'trust-formation').length;
  if (outcomes.length >= 6 && trustFormCount / outcomes.length < 0.2) {
    tensions.push({
      key: 'trust ↔ scalability',
      sideA: `${outcomes.length} record(s) shipped`,
      sideB: `trust-formation share ${Math.round(trustFormCount / outcomes.length * 100)}%`,
      tensionScore: r1(clamp10(10 - (trustFormCount / outcomes.length) * 25)),
      preservedStatement: 'scale grows while trust formation lags — both are true',
    });
  }

  // 3. realism vs virality
  const meanShares = avg(outcomes.map((o) => o.metrics?.shares ?? 0));
  if (meanRealism >= 6 && meanShares < 1) {
    tensions.push({
      key: 'realism ↔ virality',
      sideA: `realism averaging ${r1(meanRealism)}/10`,
      sideB: `mean shares only ${r1(meanShares)}`,
      tensionScore: r1(clamp10((meanRealism - 5) * 2)),
      preservedStatement: 'the work is honest AND not spreading — both are present',
    });
  }

  // 4. ambiguity vs clarity
  const meanComments = avg(outcomes.map((o) => o.metrics?.comments ?? 0));
  const meanBounce = avg(outcomes.map((o) => o.metrics?.bounceRate ?? 0));
  if (meanComments >= 2 && meanBounce >= 0.3) {
    tensions.push({
      key: 'ambiguity ↔ clarity',
      sideA: `comments ${r1(meanComments)} per record`,
      sideB: `bounce ${r1(meanBounce * 10)}/10`,
      tensionScore: r1(clamp10(meanComments + meanBounce * 10)),
      preservedStatement: 'audience is interpreting AND leaving — both responses are valid',
    });
  }

  // 5. stillness vs stimulation
  if (burstShare >= 0.3 && ritualAttachment >= 5) {
    tensions.push({
      key: 'stillness ↔ stimulation',
      sideA: `${Math.round(burstShare * 100)}% burst-cadence`,
      sideB: `ritual attachment ${r1(ritualAttachment)}/10`,
      tensionScore: r1(clamp10(burstShare * 6 + ritualAttachment * 0.5)),
      preservedStatement: 'rituals are being attached to AND burst pacing is recurring — neither cancels the other',
    });
  }

  // 6. intimacy vs manipulation
  if (vuln >= 6 && manip >= 5) {
    tensions.push({
      key: 'intimacy ↔ manipulation',
      sideA: `vulnerability signal ${r1(vuln)}/10`,
      sideB: `manipulation pressure ${r1(manip)}/10`,
      tensionScore: r1(clamp10(Math.min(vuln, manip))),
      preservedStatement: 'the content reads vulnerable AND manipulation pressure is present — operator inspects which is which',
    });
  }

  // 7. ritual depth vs speed
  if (ritualAttachment >= 6 && burstShare >= 0.3) {
    tensions.push({
      key: 'ritual-depth ↔ speed',
      sideA: `ritual attachment ${r1(ritualAttachment)}/10`,
      sideB: `${Math.round(burstShare * 100)}% burst-cadence records`,
      tensionScore: r1(clamp10(ritualAttachment * 0.5 + burstShare * 8)),
      preservedStatement: 'the system has both depth and speed — at the same time, in the same window',
    });
  }

  // 8. emotional honesty vs optimization
  if (meanRealism >= 6 && meanPersuasion >= 6) {
    tensions.push({
      key: 'emotional-honesty ↔ optimization',
      sideA: `realism ${r1(meanRealism)}/10`,
      sideB: `persuasion intensity ${r1(meanPersuasion)}/10`,
      tensionScore: r1(clamp10(Math.min(meanRealism, meanPersuasion))),
      preservedStatement: 'honesty and optimization are both pressing — neither has retired',
    });
  }

  // 9. fatigue vs growth
  if (fatigueLevel >= 6 && outcomes.length >= 8) {
    tensions.push({
      key: 'fatigue ↔ growth',
      sideA: `fatigue ${r1(fatigueLevel)}/10`,
      sideB: `${outcomes.length} record(s) in window`,
      tensionScore: r1(clamp10(fatigueLevel)),
      preservedStatement: 'the system is producing volume AND showing fatigue — both must remain visible',
    });
  }

  tensions.sort((a, b) => b.tensionScore - a.tensionScore || a.key.localeCompare(b.key));

  const tensionDensity = tensions.length === 0
    ? 0
    : r1(clamp10(
      Math.max(...tensions.map((t) => t.tensionScore)) * 0.5 +
      avg(tensions.map((t) => t.tensionScore)) * 0.5,
    ));

  return {
    totalTensions: tensions.length,
    tensions,
    tensionDensity,
    reasonCodes: [
      `tensions:${tensions.length}`,
      `density:${tensionDensity}/10`,
      ...tensions.slice(0, 5).map((t) => `${t.key}:${t.tensionScore}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
