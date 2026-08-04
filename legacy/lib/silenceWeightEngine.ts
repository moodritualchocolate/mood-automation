/**
 * SILENCE WEIGHT ENGINE (pure, observational)
 *
 * Measures when silence carries more emotional force than speech.
 * The system learns: some moments are remembered because they were
 * not explained.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never recommends silence (or speech) as a target
 *   - allowed phrasing: "historically associated", "observed alongside",
 *     "may carry memory weight", "remembrance-oriented"
 *   - forbidden: prediction, optimization, manipulation phrasing
 */

// ─── loose structural subsets ────────────────────────────────

export interface SilenceOutcomeSubset {
  outcomes?: Array<{
    persuasionIntensity?: number;
    cadenceState?: string;
    metrics?: {
      retention?: number; saves?: number; rewatches?: number;
    };
  }>;
}

export interface SilenceVisualSubset {
  fingerprints?: Array<{
    silenceDensity?: string;
    polishLevel?: number;
    realismLevel?: number;
  }>;
}

export interface SilenceNarrativeSubset {
  fingerprints?: Array<{
    silenceUsage?: string;
    ctaPressure?: number;
    observationalDensity?: number;
    tensionCurve?: string;
    payoffTiming?: string;
  }>;
}

export interface SilenceWeightInput {
  outcomes?: SilenceOutcomeSubset | null;
  visualDNA?: SilenceVisualSubset | null;
  narrativeDNA?: SilenceNarrativeSubset | null;
}

// ─── output ───────────────────────────────────────────────────

export interface SilenceWeightSignals {
  pauseStrength: number;
  unspokenTension: number;
  breathingRoom: number;
  emotionalRestraint: number;
  viewerProjectionSpace: number;
  overExplanationRisk: number;
  silenceDignity: number;
  memoryEcho: number;
}

export interface SilenceWeightReading {
  totalObservations: number;
  signals: SilenceWeightSignals;
  /** 0..10 — composite silence weight. */
  silenceWeightIndex: number;
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system observes when silence carries memory weight. ' +
  'It does not select silence as a target.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

// ─── main ─────────────────────────────────────────────────────

export function computeSilenceWeight(input: SilenceWeightInput): SilenceWeightReading {
  const outcomes = input.outcomes?.outcomes ?? [];
  const visualFps = input.visualDNA?.fingerprints ?? [];
  const narrativeFps = input.narrativeDNA?.fingerprints ?? [];

  const silenceVisualShare = visualFps.length === 0 ? 0 :
    visualFps.filter((f) => f.silenceDensity === 'high' || f.silenceDensity === 'mid').length / visualFps.length;
  const sparseNarShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.silenceUsage === 'sparse').length / narrativeFps.length;
  const meanCta = avg(narrativeFps.map((f) => f.ctaPressure ?? 5));
  const meanPersuasion = avg(outcomes.map((o) => o.persuasionIntensity ?? 5));
  const meanObs = avg(narrativeFps.map((f) => f.observationalDensity ?? 5));

  // ── pause strength ───────────────────────────────────────
  const pauseStrength = clamp10(silenceVisualShare * 6 + sparseNarShare * 4);

  // ── unspoken tension ─────────────────────────────────────
  const sustainedShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) =>
      f.tensionCurve === 'sustained' || f.tensionCurve === 'unresolved',
    ).length / narrativeFps.length;
  const latePayoffShare = narrativeFps.length === 0 ? 0 :
    narrativeFps.filter((f) => f.payoffTiming === 'late' || f.payoffTiming === 'absent').length / narrativeFps.length;
  const unspokenTension = clamp10(sustainedShare * 6 + latePayoffShare * 4);

  // ── breathing room ───────────────────────────────────────
  const flowShare = outcomes.length === 0 ? 0 :
    outcomes.filter((o) => o.cadenceState === 'flow').length / outcomes.length;
  const breathingRoom = clamp10(flowShare * 5 + pauseStrength * 0.5);

  // ── emotional restraint ──────────────────────────────────
  const emotionalRestraint = clamp10(
    10 - Math.max(0, meanPersuasion - 5) * 0.8 -
    Math.max(0, meanCta - 5) * 0.5,
  );

  // ── viewer projection space ──────────────────────────────
  // Higher when restraint + observational density + late/absent payoff.
  const viewerProjectionSpace = clamp10(
    emotionalRestraint * 0.4 + meanObs * 0.3 + latePayoffShare * 10 * 0.3,
  );

  // ── over-explanation risk ────────────────────────────────
  const overExplanationRisk = clamp10(
    Math.max(0, meanCta - 5) * 0.7 +
    Math.max(0, meanPersuasion - 5) * 0.5 +
    (1 - sparseNarShare) * 4,
  );

  // ── silence dignity ──────────────────────────────────────
  // Silence with restraint (dignity-preserving) vs silence with manipulation.
  const silenceDignity = clamp10(
    pauseStrength * 0.4 + emotionalRestraint * 0.4 + meanObs * 0.2,
  );

  // ── memory echo ──────────────────────────────────────────
  // Retention + rewatches + observational density on silent outcomes.
  const meanRetention = avg(outcomes.map((o) => o.metrics?.retention ?? 0));
  const meanRewatch = avg(outcomes.map((o) => Math.min(1, (o.metrics?.rewatches ?? 0) / 3)));
  const memoryEcho = clamp10(
    meanRetention * 5 + meanRewatch * 3 + pauseStrength * 0.2,
  );

  const signals: SilenceWeightSignals = {
    pauseStrength:          r1(pauseStrength),
    unspokenTension:        r1(unspokenTension),
    breathingRoom:          r1(breathingRoom),
    emotionalRestraint:     r1(emotionalRestraint),
    viewerProjectionSpace:  r1(viewerProjectionSpace),
    overExplanationRisk:    r1(overExplanationRisk),
    silenceDignity:         r1(silenceDignity),
    memoryEcho:             r1(memoryEcho),
  };

  const silenceWeightIndex = r1(clamp10(
    (signals.pauseStrength + signals.unspokenTension + signals.breathingRoom +
     signals.emotionalRestraint + signals.viewerProjectionSpace +
     signals.silenceDignity + signals.memoryEcho) / 7 -
    signals.overExplanationRisk * 0.1,
  ));

  const notes: string[] = [];
  if (signals.pauseStrength >= 6) notes.push('pause strength observed alongside the outputs — historically associated with remembrance-oriented moments');
  if (signals.viewerProjectionSpace >= 6) notes.push('viewer projection space observed alongside the outputs');
  if (signals.overExplanationRisk >= 6) notes.push('over-explanation risk observed alongside elevated CTA / persuasion pressure');
  if (signals.silenceDignity >= 6) notes.push('silence dignity observed alongside the outputs');
  if (signals.memoryEcho >= 6) notes.push('memory echo observed alongside retention — may carry memory weight');
  if (notes.length === 0) notes.push('silence weight signals are balanced in this window');

  return {
    totalObservations: outcomes.length + visualFps.length + narrativeFps.length,
    signals,
    silenceWeightIndex,
    notes,
    reasonCodes: [
      `silenceWeight:${silenceWeightIndex}`,
      ...Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
