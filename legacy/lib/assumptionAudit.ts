/**
 * ASSUMPTION AUDIT (pure, observational)
 *
 * Detects HIDDEN ASSUMPTIONS that the observation pipeline may be
 * making — places where a metric is being read as if it means
 * something the data does not actually support. The engine NAMES
 * the assumption; it does not refute it.
 *
 * STRICT CONTRACT:
 *   - phrasing: "are we assuming that ___?"
 *   - never claims the assumption is wrong
 *   - never claims certainty
 */

export interface AssumptionInput {
  outcomes?: { outcomes?: Array<{
    persuasionIntensity?: number;
    downstreamOutcome?: string;
    metrics?: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; follows?: number; rewatches?: number; likes?: number };
  }> } | null;
  humanTruth?: { feltHumanScore?: number; signals?: { vulnerability?: number; dignity?: number } } | null;
  manipulationPressure?: { pressureScore?: number } | null;
}

export interface AssumptionFinding {
  key: string;
  /** Plain-language statement of what the system MIGHT be assuming. */
  assumption: string;
  evidenceForDoubt: string;
  /** 0..10 — strength of the case that this assumption deserves a doubt. */
  doubtWeight: number;
}

export interface AssumptionAuditReading {
  totalAssumptions: number;
  findings: AssumptionFinding[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the audit NAMES assumptions that may be reading metrics ' +
  'as if they mean more than they do. It never claims an assumption is wrong; ' +
  'it places it on the table for human review.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeAssumptionAudit(input: AssumptionInput): AssumptionAuditReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const findings: AssumptionFinding[] = [];

  // 1. higher engagement = healthier resonance
  const meanRetention = avg(outcomes.map((o) => o.metrics?.retention ?? 0));
  const resonanceShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'emotional-resonance').length / outcomes.length;
  if (meanRetention >= 0.55 && resonanceShare < 0.2 && outcomes.length >= 4) {
    findings.push({
      key: 'engagement-equals-resonance',
      assumption: 'are we assuming that higher retention means healthier emotional resonance?',
      evidenceForDoubt: `mean retention ${r1(meanRetention * 10)}/10 but only ${Math.round(resonanceShare * 100)}% emotional-resonance labels`,
      doubtWeight: r1(clamp10((meanRetention * 10 - resonanceShare * 20))),
    });
  }

  // 2. stronger emotion = stronger trust
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const trustShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'trust-formation').length / outcomes.length;
  if (meanPersuasion >= 6 && trustShare < 0.2 && outcomes.length >= 4) {
    findings.push({
      key: 'stronger-emotion-equals-stronger-trust',
      assumption: 'are we assuming that higher persuasion intensity strengthens trust?',
      evidenceForDoubt: `mean persuasion ${r1(meanPersuasion)}/10 but only ${Math.round(trustShare * 100)}% trust-formation labels`,
      doubtWeight: r1(clamp10(meanPersuasion - trustShare * 10)),
    });
  }

  // 3. conversion = long-term value
  const conversionShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'conversion-spike').length / outcomes.length;
  const followsRate = avg(outcomes.map((o) => Math.min(1, (o.metrics?.follows ?? 0) / 5)));
  if (conversionShare >= 0.25 && followsRate < 0.2) {
    findings.push({
      key: 'conversion-equals-long-term-value',
      assumption: 'are we assuming that conversion equals long-term audience value?',
      evidenceForDoubt: `${Math.round(conversionShare * 100)}% conversion share with low follow rate (${r1(followsRate * 10)}/10)`,
      doubtWeight: r1(clamp10(conversionShare * 10 - followsRate * 10)),
    });
  }

  // 4. replay = positive attachment
  const replayCount = outcomes.filter((o) => (o.metrics?.rewatches ?? 0) >= 1).length;
  const fatigueCount = outcomes.filter((o) =>
    o.downstreamOutcome === 'fatigue-acceleration' ||
    o.downstreamOutcome === 'visual-fatigue',
  ).length;
  if (replayCount >= 2 && fatigueCount >= 2) {
    findings.push({
      key: 'replay-equals-positive-attachment',
      assumption: 'are we assuming that replay always reflects positive attachment?',
      evidenceForDoubt: `${replayCount} record(s) had replays AND ${fatigueCount} had fatigue labels — overlap likely`,
      doubtWeight: r1(clamp10((replayCount + fatigueCount) * 1.2)),
    });
  }

  // 5. attention = emotional connection
  const meanLikes = avg(outcomes.map((o) => o.metrics?.likes ?? 0));
  const meanSaves = avg(outcomes.map((o) => o.metrics?.saves ?? 0));
  if (meanLikes >= 30 && meanSaves < 1.5) {
    findings.push({
      key: 'attention-equals-emotional-connection',
      assumption: 'are we assuming that likes/impressions reflect emotional connection?',
      evidenceForDoubt: `mean likes ${Math.round(meanLikes)} but saves only ${r1(meanSaves)} — attention is high; depth is low`,
      doubtWeight: r1(clamp10(Math.min(10, meanLikes / 10) - meanSaves * 2)),
    });
  }

  // 6. high felt-human means trust safety
  const feltHuman = input.humanTruth?.feltHumanScore ?? -1;
  const manipScore = input.manipulationPressure?.pressureScore ?? -1;
  if (feltHuman >= 7 && manipScore >= 5) {
    findings.push({
      key: 'felt-human-equals-trust-safety',
      assumption: 'are we assuming that felt-human content cannot also carry manipulation pressure?',
      evidenceForDoubt: `felt-human ${r1(feltHuman)}/10 alongside manipulation pressure ${r1(manipScore)}/10`,
      doubtWeight: r1(clamp10(Math.min(feltHuman, manipScore))),
    });
  }

  // 7. dignity is uniform across audiences
  const dignity = input.humanTruth?.signals?.dignity ?? -1;
  if (dignity >= 7) {
    findings.push({
      key: 'dignity-is-uniform',
      assumption: 'are we assuming that aggregate dignity score reflects every audience equally?',
      evidenceForDoubt: `composite dignity ${r1(dignity)}/10 may obscure per-segment variation`,
      doubtWeight: 4,
    });
  }

  findings.sort((a, b) => b.doubtWeight - a.doubtWeight || a.key.localeCompare(b.key));

  return {
    totalAssumptions: findings.length,
    findings,
    reasonCodes: [
      `assumptions:${findings.length}`,
      ...findings.slice(0, 5).map((f) => `${f.key}:${f.doubtWeight}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
