/**
 * HYPOTHESIS ENGINE (pure, observational)
 *
 * Generates NON-PREDICTIVE HYPOTHESES from observed correlations.
 * The engine phrases every hypothesis as a possibility — never a
 * fact, never a prediction, never an instruction.
 *
 * Phrasing locked to:
 *   "historically correlated possibility: …"
 *   "possible interpretation: …"
 *   "potential unresolved factor: …"
 *
 * STRICT CONTRACT:
 *   - hypotheses are NEVER treated as facts
 *   - no winner selection
 *   - no predictive language
 */

export interface HypothesisInput {
  outcomes?: { outcomes?: Array<{
    realismLevel?: number;
    persuasionIntensity?: number;
    cadenceState?: string;
    visualStyle?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    downstreamOutcome?: string;
    metrics?: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; follows?: number; rewatches?: number };
  }> } | null;
  humanTruth?: { signals?: { dignity?: number; vulnerability?: number; observationalHonesty?: number; emotionalSpaciousness?: number; humanPacing?: number } } | null;
  rituals?: { detected?: Array<{ key: string; emotionalAttachmentScore?: number }> } | null;
  symbolicResonance?: { symbols?: Array<{ symbol: string; resonance: number; occurrences: number }> } | null;
}

export type HypothesisKind = 'historically-correlated' | 'possible-interpretation' | 'potential-unresolved-factor';

export interface Hypothesis {
  kind: HypothesisKind;
  statement: string;
  evidence: string;
  /** 0..10 — how much data supports the framing (never confidence in truth). */
  support: number;
}

export interface HypothesisReading {
  totalHypotheses: number;
  hypotheses: Hypothesis[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — hypotheses are POSSIBILITIES the data could support. ' +
  'They are never treated as facts and never used as forecasts.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeHypotheses(input: HypothesisInput): HypothesisReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const hypotheses: Hypothesis[] = [];

  // 1. emotional restraint vs intensity
  const restraintRecords = outcomes.filter((o) => (o.persuasionIntensity ?? 5) <= 4);
  const intensityRecords = outcomes.filter((o) => (o.persuasionIntensity ?? 5) >= 7);
  if (restraintRecords.length >= 3 && intensityRecords.length >= 3) {
    const rEng = avg(restraintRecords.map((o) => o.metrics?.retention ?? 0));
    const iEng = avg(intensityRecords.map((o) => o.metrics?.retention ?? 0));
    if (rEng > iEng + 0.05) {
      hypotheses.push({
        kind: 'historically-correlated',
        statement: 'historically correlated possibility: emotional restraint may contribute more strongly than intensity.',
        evidence: `mean retention under restraint=${r1(rEng * 10)}/10 vs intensity=${r1(iEng * 10)}/10 (${restraintRecords.length} vs ${intensityRecords.length} records)`,
        support: r1(clamp10((rEng - iEng) * 30)),
      });
    }
  }

  // 2. reduced stimulation → ritual trust continuity
  const calmRecords = outcomes.filter((o) => o.cadenceState === 'gradual' && (o.persuasionIntensity ?? 5) <= 4);
  if (calmRecords.length >= 3) {
    const trustFormShare = calmRecords.filter((o) => o.downstreamOutcome === 'trust-formation').length / calmRecords.length;
    if (trustFormShare >= 0.3) {
      hypotheses.push({
        kind: 'possible-interpretation',
        statement: 'possible interpretation: reduced stimulation may increase ritual trust continuity.',
        evidence: `${calmRecords.length} calm/restrained records show ${Math.round(trustFormShare * 100)}% trust-formation share`,
        support: r1(clamp10(trustFormShare * 12)),
      });
    }
  }

  // 3. symbolic familiarity → replay behavior
  const familiarSymbols = (input.symbolicResonance?.symbols ?? []).filter((s) => s.occurrences >= 3 && s.resonance >= 5);
  const replayShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.downstreamOutcome === 'replay-behavior').length / outcomes.length;
  if (familiarSymbols.length >= 2 && replayShare >= 0.1) {
    hypotheses.push({
      kind: 'potential-unresolved-factor',
      statement: 'potential unresolved factor: symbolic familiarity may influence replay behavior.',
      evidence: `${familiarSymbols.length} symbols at high resonance + ${Math.round(replayShare * 100)}% replay share`,
      support: r1(clamp10(familiarSymbols.length * 1.5 + replayShare * 10)),
    });
  }

  // 4. silence → outcome
  const silenceRecords = outcomes.filter((o) =>
    /silen|still|wordless|pause/.test(((o.narrativeSignature ?? '') + ' ' + (o.visualStyle ?? '')).toLowerCase()),
  );
  if (silenceRecords.length >= 3) {
    const meanSavesSilence = avg(silenceRecords.map((o) => o.metrics?.saves ?? 0));
    const overallSaves = avg(outcomes.map((o) => o.metrics?.saves ?? 0));
    if (meanSavesSilence > overallSaves + 0.5) {
      hypotheses.push({
        kind: 'historically-correlated',
        statement: 'historically correlated possibility: silence may contribute to saves more than density does.',
        evidence: `silence-records mean saves=${r1(meanSavesSilence)} vs overall=${r1(overallSaves)}`,
        support: r1(clamp10((meanSavesSilence - overallSaves) * 3)),
      });
    }
  }

  // 5. pacing perception
  const burstRecords = outcomes.filter((o) => o.cadenceState === 'burst');
  const gradualRecords = outcomes.filter((o) => o.cadenceState === 'gradual');
  if (burstRecords.length >= 3 && gradualRecords.length >= 3) {
    const burstBounce = avg(burstRecords.map((o) => o.metrics?.bounceRate ?? 0));
    const gradualBounce = avg(gradualRecords.map((o) => o.metrics?.bounceRate ?? 0));
    if (burstBounce - gradualBounce >= 0.1) {
      hypotheses.push({
        kind: 'possible-interpretation',
        statement: 'possible interpretation: pacing may change perception more than content does.',
        evidence: `burst-cadence bounce=${r1(burstBounce * 10)}/10 vs gradual=${r1(gradualBounce * 10)}/10`,
        support: r1(clamp10((burstBounce - gradualBounce) * 30)),
      });
    }
  }

  // 6. symbolism vs CTA density
  const lowCtaHighSaves = outcomes.filter((o) =>
    (o.persuasionIntensity ?? 5) <= 4 && (o.metrics?.saves ?? 0) >= 3,
  );
  const highCtaLowSaves = outcomes.filter((o) =>
    (o.persuasionIntensity ?? 5) >= 7 && (o.metrics?.saves ?? 0) <= 1,
  );
  if (lowCtaHighSaves.length >= 2 && highCtaLowSaves.length >= 2) {
    hypotheses.push({
      kind: 'potential-unresolved-factor',
      statement: 'potential unresolved factor: symbolism may matter more than CTA density.',
      evidence: `${lowCtaHighSaves.length} low-CTA high-saves records vs ${highCtaLowSaves.length} high-CTA low-saves records`,
      support: r1(clamp10(lowCtaHighSaves.length + highCtaLowSaves.length)),
    });
  }

  // 7. ritual attachment matters
  const ritualHighAttachment = (input.rituals?.detected ?? []).filter((d) => (d.emotionalAttachmentScore ?? 0) >= 6);
  if (ritualHighAttachment.length >= 2) {
    hypotheses.push({
      kind: 'possible-interpretation',
      statement: 'possible interpretation: ritual attachment may compound over many small exposures.',
      evidence: `${ritualHighAttachment.length} ritual theme(s) at high emotional attachment`,
      support: r1(clamp10(ritualHighAttachment.length * 2)),
    });
  }

  // 8. dignity protects trust
  const dignity = input.humanTruth?.signals?.dignity ?? -1;
  if (dignity >= 6) {
    hypotheses.push({
      kind: 'historically-correlated',
      statement: 'historically correlated possibility: high dignity signals may protect trust formation over time.',
      evidence: `dignity signal averaging ${r1(dignity)}/10 in the current window`,
      support: r1(clamp10(dignity)),
    });
  }

  hypotheses.sort((a, b) => b.support - a.support || a.statement.localeCompare(b.statement));

  return {
    totalHypotheses: hypotheses.length,
    hypotheses,
    reasonCodes: [
      `hypotheses:${hypotheses.length}`,
      ...hypotheses.slice(0, 5).map((h) => `${h.kind}:${h.support}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
