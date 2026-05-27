/**
 * EXPLANATION VARIANCE ENGINE (pure, observational)
 *
 * For each observable outcome pattern, generates MULTIPLE COMPETING
 * EXPLANATIONS. The engine NEVER picks one. Example: high replay
 * may result from emotional comfort, addiction loops, ritual
 * familiarity, anxiety repetition, symbolic attachment, or
 * unresolved emotional tension — all six readings remain on the
 * table.
 *
 * STRICT CONTRACT:
 *   - never selects a single explanation
 *   - explanations are co-active possibilities
 *   - phrasing: "may result from", "could be due to", "one possible reading"
 */

export interface ExplanationVarianceInput {
  outcomes?: { outcomes?: Array<{
    persuasionIntensity?: number;
    realismLevel?: number;
    cadenceState?: string;
    visualStyle?: string;
    emotionalSignature?: string;
    narrativeSignature?: string;
    downstreamOutcome?: string;
    metrics?: { retention?: number; saves?: number; comments?: number; shares?: number; bounceRate?: number; follows?: number; rewatches?: number };
  }> } | null;
  rituals?: { detected?: Array<{ key: string; emotionalAttachmentScore?: number }> } | null;
  symbolicResonance?: { symbols?: Array<{ symbol: string; resonance: number }> } | null;
}

export interface Explanation {
  candidate: string;
  /** 0..10 — how well the data could support this reading. */
  support: number;
  reason: string;
}

export interface ExplanationCluster {
  observedPattern: string;
  occurrences: number;
  explanations: Explanation[];
  notes: string[];
}

export interface ExplanationVarianceReading {
  totalPatterns: number;
  clusters: ExplanationCluster[];
  /** 0..10 — overall variance: how many alternate explanations co-exist. */
  varianceScore: number;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the variance engine generates COMPETING EXPLANATIONS. ' +
  'It NEVER selects one. All readings remain on the table.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── pattern-specific explanation generators ──────────────────

type Outcome = NonNullable<NonNullable<ExplanationVarianceInput['outcomes']>['outcomes']>[number];

function explainReplay(
  records: Outcome[], input: ExplanationVarianceInput,
): Explanation[] {
  const meanPersuasion = avg(records.map((r) => r.persuasionIntensity ?? 5));
  const meanRealism = avg(records.map((r) => r.realismLevel ?? 5));
  const burstShare = records.filter((r) => r.cadenceState === 'burst').length / Math.max(records.length, 1);
  const ritualAttachment = avg((input.rituals?.detected ?? []).map((d) => d.emotionalAttachmentScore ?? 0));
  const symbolicResonance = avg((input.symbolicResonance?.symbols ?? []).map((s) => s.resonance));
  return [
    {
      candidate: 'emotional-comfort',
      support: r1(clamp10(meanRealism * 0.7 + (10 - meanPersuasion) * 0.3)),
      reason: `realism ${r1(meanRealism)}/10, low persuasion ${r1(meanPersuasion)}/10`,
    },
    {
      candidate: 'addiction-loop',
      support: r1(clamp10(burstShare * 6 + meanPersuasion * 0.4)),
      reason: `burst share ${Math.round(burstShare * 100)}%, persuasion ${r1(meanPersuasion)}/10`,
    },
    {
      candidate: 'ritual-familiarity',
      support: r1(clamp10(ritualAttachment)),
      reason: `ritual attachment ${r1(ritualAttachment)}/10`,
    },
    {
      candidate: 'anxiety-repetition',
      support: r1(clamp10(Math.max(0, meanPersuasion - 5) * 1.5 + burstShare * 4)),
      reason: 'high persuasion + burst cadence are present in the window',
    },
    {
      candidate: 'symbolic-attachment',
      support: r1(clamp10(symbolicResonance)),
      reason: `symbolic resonance ${r1(symbolicResonance)}/10 in the symbol pool`,
    },
    {
      candidate: 'unresolved-emotional-tension',
      support: r1(clamp10(Math.max(0, meanPersuasion - meanRealism) + Math.abs(meanRealism - 5))),
      reason: 'the gap between realism and persuasion is non-zero',
    },
  ];
}

function explainTrustFormation(
  records: Outcome[], input: ExplanationVarianceInput,
): Explanation[] {
  const meanRealism = avg(records.map((r) => r.realismLevel ?? 5));
  const meanFollows = avg(records.map((r) => Math.min(1, (r.metrics?.follows ?? 0) / 5)));
  const ritualAttachment = avg((input.rituals?.detected ?? []).map((d) => d.emotionalAttachmentScore ?? 0));
  return [
    { candidate: 'observational-honesty',     support: r1(clamp10(meanRealism)),                 reason: `realism ${r1(meanRealism)}/10` },
    { candidate: 'ritual-continuity',         support: r1(clamp10(ritualAttachment * 0.8)),       reason: `ritual attachment ${r1(ritualAttachment)}/10` },
    { candidate: 'restraint-rewarded',        support: r1(clamp10(10 - avg(records.map((r) => r.persuasionIntensity ?? 5)))), reason: 'low persuasion intensity in this set' },
    { candidate: 'audience-self-selection',   support: r1(clamp10(meanFollows * 10)),             reason: `follows rate ${r1(meanFollows * 10)}/10 — audience may have already been aligned` },
    { candidate: 'novelty-effect',            support: r1(clamp10(Math.min(5, records.length))),  reason: 'small sample — novelty may inflate the read' },
  ];
}

function explainHookCollapse(records: Outcome[]): Explanation[] {
  const meanBounce = avg(records.map((r) => r.metrics?.bounceRate ?? 0));
  const meanPersuasion = avg(records.map((r) => r.persuasionIntensity ?? 5));
  return [
    { candidate: 'wrong-emotional-frame',     support: r1(clamp10(meanBounce * 10 * 0.6 + 2)),    reason: `bounce ${r1(meanBounce * 10)}/10` },
    { candidate: 'pacing-mismatch',           support: r1(clamp10(meanBounce * 10 * 0.5 + 2)),    reason: 'audience left in the opening seconds' },
    { candidate: 'audience-mismatch',         support: r1(clamp10(meanBounce * 10 * 0.4 + 3)),    reason: 'the audience may not be the one the content addresses' },
    { candidate: 'persuasion-too-aggressive', support: r1(clamp10(meanPersuasion)),               reason: `persuasion ${r1(meanPersuasion)}/10` },
    { candidate: 'context-too-saturated',     support: 4,                                          reason: 'the broader environment may already be tired of this hook family' },
  ];
}

function explainEmotionalResonance(
  records: Outcome[], input: ExplanationVarianceInput,
): Explanation[] {
  const meanRealism = avg(records.map((r) => r.realismLevel ?? 5));
  const meanSaves = avg(records.map((r) => r.metrics?.saves ?? 0));
  const symbolicResonance = avg((input.symbolicResonance?.symbols ?? []).map((s) => s.resonance));
  return [
    { candidate: 'lived-recognition',         support: r1(clamp10(meanRealism)),                  reason: `realism ${r1(meanRealism)}/10` },
    { candidate: 'symbolic-memory-evoked',    support: r1(clamp10(symbolicResonance)),            reason: `symbolic resonance ${r1(symbolicResonance)}/10` },
    { candidate: 'rare-permission-to-feel',   support: r1(clamp10(meanSaves * 1.5)),              reason: `saves rate ${r1(meanSaves)}` },
    { candidate: 'audience-state-readiness',  support: 4,                                          reason: 'audience may have been emotionally available at delivery moment' },
    { candidate: 'survivorship-bias',         support: 3,                                          reason: 'the labels themselves may over-fit positive-leaning data' },
  ];
}

// ─── main ─────────────────────────────────────────────────────

const PATTERN_HANDLERS: Array<{
  outcome: string;
  label: string;
  handler: (records: Outcome[], input: ExplanationVarianceInput) => Explanation[];
}> = [
  { outcome: 'replay-behavior',          label: 'high replay',                handler: explainReplay },
  { outcome: 'trust-formation',          label: 'trust formation',            handler: explainTrustFormation },
  { outcome: 'hook-collapse',            label: 'hook collapse',              handler: explainHookCollapse },
  { outcome: 'emotional-resonance',      label: 'emotional resonance',        handler: explainEmotionalResonance },
];

export function computeExplanationVariance(
  input: ExplanationVarianceInput,
): ExplanationVarianceReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const clusters: ExplanationCluster[] = [];

  for (const ph of PATTERN_HANDLERS) {
    const matching = outcomes.filter((o) => o.downstreamOutcome === ph.outcome);
    if (matching.length === 0) continue;
    const explanations = ph.handler(matching, input).sort(
      (a, b) => b.support - a.support || a.candidate.localeCompare(b.candidate),
    );
    const notes: string[] = [];
    const supported = explanations.filter((e) => e.support >= 4);
    if (supported.length >= 3) {
      notes.push(`${supported.length} explanations are simultaneously supported by the data`);
    } else if (supported.length >= 1) {
      notes.push(`${supported.length} explanation(s) supported; others remain possible but less attested`);
    } else {
      notes.push('no single explanation is strongly supported — all readings remain possible');
    }
    notes.push('the engine never picks one; the operator interprets');
    clusters.push({
      observedPattern: ph.label,
      occurrences: matching.length,
      explanations,
      notes,
    });
  }
  clusters.sort((a, b) => b.occurrences - a.occurrences || a.observedPattern.localeCompare(b.observedPattern));

  const varianceScore = clusters.length === 0 ? 0 : r1(clamp10(
    avg(clusters.map((c) =>
      c.explanations.filter((e) => e.support >= 4).length,
    )) * 2,
  ));

  return {
    totalPatterns: clusters.length,
    clusters,
    varianceScore,
    reasonCodes: [
      `patterns:${clusters.length}`,
      `variance-score:${varianceScore}/10`,
      ...clusters.slice(0, 5).map((c) => `${c.observedPattern}:${c.occurrences}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
