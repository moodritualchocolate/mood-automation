/**
 * SUPERVISED LEARNING LOOP (pure, observational)
 *
 * Compares sandbox EXPECTATIONS (per mutation type) with the
 * operator-attached real-world OUTCOMES on trials that used that
 * mutation. The loop produces learning events labeled aligned /
 * contradicted / unresolved, plus per-axis adjustments and per-
 * mutation reliability summaries.
 *
 * STRICT CONTRACT:
 *   - no I/O
 *   - never selects a "best" mutation
 *   - never recommends, never auto-applies
 *   - allowed phrasing only:
 *       "observed learning", "operator-attached outcome suggests",
 *       "historically aligned", "historically contradicted",
 *       "requires more evidence"
 *   - forbidden phrasing: "best" · "winner" · "will" ·
 *       "guaranteed" · "auto-apply" · "optimize"
 *
 * Same input → same output. Pure function over arrays of trials +
 * outcomes + (optional) prior pattern reliability state.
 */

import type { OperatorCreativeTrial } from './operatorCreativeTrialMemory';
import type { TrialOutcomeRecord } from './trialOutcomeMemory';
import type {
  PatternAlignment, PatternReliabilityRecord,
} from './patternReliabilityMemory';
import { patternIdFor } from './patternReliabilityMemory';

// ─── expectation profiles ─────────────────────────────────────
//
// Each mutation type from the sandbox carries an "expected direction"
// per learning axis. These mirror the sandbox engine's profiles, but
// the loop does NOT import the sandbox — keeping the supervised
// layer fully decoupled from the simulation layer.
//
// Direction interpretation:
//   +1 — mutation EXPECTED to push the axis up (e.g. realism mutation
//        expects trust to rise)
//   -1 — mutation EXPECTED to push the axis down (e.g. realism
//        mutation expects fatigue to fall)
//    0 — no clear expectation on this axis

type Axis = 'trust' | 'fatigue' | 'realism' | 'symbolic';

interface MutationExpectations {
  trust: number;
  fatigue: number;
  realism: number;
  symbolic: number;
}

const MUTATION_EXPECTATIONS: Record<string, MutationExpectations> = {
  'pacing':              { trust:  1, fatigue: -1, realism:  0, symbolic:  0 },
  'silence':             { trust:  1, fatigue: -1, realism:  1, symbolic:  1 },
  'emotional-restraint': { trust:  1, fatigue: -1, realism:  1, symbolic:  0 },
  'realism':             { trust:  1, fatigue: -1, realism:  1, symbolic:  1 },
  'symbolism':           { trust:  1, fatigue:  0, realism:  1, symbolic:  1 },
  'composition':         { trust:  0, fatigue: -1, realism:  1, symbolic:  0 },
  'typography':          { trust:  0, fatigue:  0, realism:  0, symbolic:  0 },
  'narrative':           { trust:  1, fatigue: -1, realism:  0, symbolic:  1 },
  'contrast':            { trust:  1, fatigue: -1, realism:  1, symbolic:  1 },
  'intimacy':            { trust:  1, fatigue: -1, realism:  1, symbolic:  1 },
  'ritual':              { trust:  1, fatigue: -1, realism:  1, symbolic:  1 },
  'nostalgia':           { trust:  1, fatigue:  0, realism:  1, symbolic:  1 },
  'humor':               { trust:  1, fatigue: -1, realism:  0, symbolic:  0 },
  'documentary':         { trust:  1, fatigue: -1, realism:  1, symbolic:  1 },
  'tension':             { trust:  0, fatigue:  0, realism:  0, symbolic:  1 },
};

// ─── outcome → observed-direction labels ─────────────────────

const TRUST_POSITIVE_LABELS = /(trust-formation|identity-reinforcement)/i;
const TRUST_NEGATIVE_LABELS = /(authenticity-rejection|aggressive-cta-rejection)/i;
const FATIGUE_POSITIVE_LABELS = /(fatigue-acceleration|visual-fatigue|hook-collapse|retention-decay)/i;
const FATIGUE_NEGATIVE_LABELS = /(emotional-resonance|trust-formation|emotional-stillness-success)/i;
const REALISM_POSITIVE_LABELS = /(realism-success|emotional-stillness-success|emotional-resonance)/i;
const REALISM_NEGATIVE_LABELS = /(authenticity-rejection|hook-collapse)/i;
const SYMBOLIC_POSITIVE_LABELS = /(emotional-resonance|replay-behavior|identity-reinforcement)/i;
const SYMBOLIC_NEGATIVE_LABELS = /(fatigue-acceleration|narrative-saturation)/i;

function observedDirection(labels: string[], axis: Axis): number {
  const joined = labels.join(' ');
  const pos = (
    axis === 'trust'    ? TRUST_POSITIVE_LABELS :
    axis === 'fatigue'  ? FATIGUE_POSITIVE_LABELS :
    axis === 'realism'  ? REALISM_POSITIVE_LABELS :
                          SYMBOLIC_POSITIVE_LABELS
  );
  const neg = (
    axis === 'trust'    ? TRUST_NEGATIVE_LABELS :
    axis === 'fatigue'  ? FATIGUE_NEGATIVE_LABELS :
    axis === 'realism'  ? REALISM_NEGATIVE_LABELS :
                          SYMBOLIC_NEGATIVE_LABELS
  );
  const isPos = pos.test(joined);
  const isNeg = neg.test(joined);
  if (isPos && !isNeg) return +1;
  if (isNeg && !isPos) return -1;
  return 0;
}

function alignmentOf(expected: number, observed: number): PatternAlignment {
  if (expected === 0 || observed === 0) return 'unresolved';
  if (Math.sign(expected) === Math.sign(observed)) return 'aligned';
  return 'contradicted';
}

// ─── output ───────────────────────────────────────────────────

export interface LearningEvent {
  trialId: string;
  outcomeId: string;
  mutationType: string;
  formula: string;
  campaignMode: string | null;
  axis: Axis;
  expectedSignal: string;
  observedOutcome: string;
  alignment: PatternAlignment;
  /** Plain-language description using allowed phrasing only. */
  description: string;
  at: number;
}

export interface ReliabilityPattern {
  patternId: string;
  mutationType: string;
  formula: string;
  campaignMode: string | null;
  expectedSignal: string;
  evidenceCount: number;
  alignment: PatternAlignment;
  alignmentCounts: { aligned: number; contradicted: number; unresolved: number };
}

export interface AxisAdjustment {
  mutationType: string;
  axis: Axis;
  alignedCount: number;
  contradictedCount: number;
  unresolvedCount: number;
  /** -10..+10 — signed signature of how the observed evidence relates
   *  to the sandbox expectation. Positive means observed-aligned;
   *  negative means observed-contradicted. NEVER a recommendation. */
  signedSignature: number;
  description: string;
}

export interface MutationReliability {
  mutationType: string;
  evidenceCount: number;
  alignedCount: number;
  contradictedCount: number;
  unresolvedCount: number;
  /** 0..10 — observed reliability signature, not a winner score. */
  reliabilitySignature: number;
  description: string;
}

export interface SupervisedLearningReading {
  totalLearningEvents: number;
  learningEvents: LearningEvent[];
  confirmedPatterns: ReliabilityPattern[];
  contradictedPatterns: ReliabilityPattern[];
  unresolvedPatterns: ReliabilityPattern[];
  trustAdjustments: AxisAdjustment[];
  fatigueAdjustments: AxisAdjustment[];
  realismAdjustments: AxisAdjustment[];
  symbolicAdjustments: AxisAdjustment[];
  mutationReliability: MutationReliability[];
  operatorInsightSummary: string;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the supervised learning loop describes operator-attached ' +
  'outcomes against sandbox expectations. It never auto-applies, never selects ' +
  'a candidate, and never claims a pattern is final.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function signedClamp(n: number, max: number): number {
  return Math.max(-max, Math.min(max, n));
}
function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── pattern aggregation ─────────────────────────────────────

function expectedSignalFor(axis: Axis, sign: number): string {
  if (sign > 0) return `${axis}-up`;
  if (sign < 0) return `${axis}-down`;
  return `${axis}-neutral`;
}
function observedSignalFor(axis: Axis, sign: number): string {
  if (sign > 0) return `${axis}-rose`;
  if (sign < 0) return `${axis}-fell`;
  return `${axis}-flat`;
}
function describeAlignment(
  axis: Axis, mutationType: string, alignment: PatternAlignment,
  evidence: number,
): string {
  if (alignment === 'aligned') {
    return `operator-attached outcome suggests "${mutationType}" historically aligned with sandbox ${axis} expectation (${evidence} observation(s))`;
  }
  if (alignment === 'contradicted') {
    return `operator-attached outcome suggests "${mutationType}" historically contradicted sandbox ${axis} expectation (${evidence} observation(s))`;
  }
  return `"${mutationType}" requires more evidence on the ${axis} axis (${evidence} observation(s))`;
}

// ─── main ─────────────────────────────────────────────────────

export interface SupervisedLearningInput {
  trials: OperatorCreativeTrial[];
  outcomes: TrialOutcomeRecord[];
  /** Optional prior reliability records — used to seed counts so
   *  the loop's pattern aggregates include historical evidence even
   *  if this call only sees one new outcome. */
  priorPatterns?: PatternReliabilityRecord[];
}

export function computeSupervisedLearning(
  input: SupervisedLearningInput,
): SupervisedLearningReading {
  const events: LearningEvent[] = [];
  const trialById = new Map(input.trials.map((t) => [t.trialId, t] as const));

  // 1. Walk every outcome, look up the trial, generate per-axis events.
  for (const outcome of input.outcomes) {
    const trial = trialById.get(outcome.trialId);
    if (!trial) continue;   // unmatched outcomes are reported by the trial-outcome analyzer
    const exp = MUTATION_EXPECTATIONS[trial.mutationType];
    if (!exp) continue;     // unknown mutation type → skip silently
    const axes: Axis[] = ['trust', 'fatigue', 'realism', 'symbolic'];
    for (const axis of axes) {
      const expectedSign = exp[axis];
      if (expectedSign === 0) continue;       // no expectation → no event
      const observedSign = observedDirection(outcome.outcomeLabels, axis);
      const alignment = alignmentOf(expectedSign, observedSign);
      events.push({
        trialId: trial.trialId,
        outcomeId: outcome.outcomeId,
        mutationType: trial.mutationType,
        formula: trial.formula,
        campaignMode: trial.campaignMode,
        axis,
        expectedSignal: expectedSignalFor(axis, expectedSign),
        observedOutcome: observedSignalFor(axis, observedSign),
        alignment,
        description: describeAlignment(axis, trial.mutationType, alignment, 1),
        at: outcome.timestamp,
      });
    }
  }

  // 2. Aggregate into patterns keyed by (mutationType, formula, campaignMode, expectedSignal).
  //    Seed counts with priorPatterns so the loop layer surfaces accumulated evidence.
  type Acc = {
    patternId: string; mutationType: string; formula: string;
    campaignMode: string | null; expectedSignal: string;
    aligned: number; contradicted: number; unresolved: number;
  };
  const accs = new Map<string, Acc>();
  for (const prior of (input.priorPatterns ?? [])) {
    accs.set(prior.patternId, {
      patternId: prior.patternId,
      mutationType: prior.mutationType,
      formula: prior.formula,
      campaignMode: prior.campaignMode,
      expectedSignal: prior.expectedSignal,
      aligned: prior.alignmentCounts.aligned,
      contradicted: prior.alignmentCounts.contradicted,
      unresolved: prior.alignmentCounts.unresolved,
    });
  }
  for (const ev of events) {
    const key = patternIdFor(ev.mutationType, ev.formula, ev.campaignMode, ev.expectedSignal);
    if (!accs.has(key)) accs.set(key, {
      patternId: key, mutationType: ev.mutationType, formula: ev.formula,
      campaignMode: ev.campaignMode, expectedSignal: ev.expectedSignal,
      aligned: 0, contradicted: 0, unresolved: 0,
    });
    const acc = accs.get(key)!;
    if (ev.alignment === 'aligned')      acc.aligned += 1;
    else if (ev.alignment === 'contradicted') acc.contradicted += 1;
    else                                  acc.unresolved += 1;
  }

  const allPatterns: ReliabilityPattern[] = Array.from(accs.values()).map((a) => {
    const evidence = a.aligned + a.contradicted + a.unresolved;
    let alignment: PatternAlignment;
    if (a.aligned > a.contradicted && a.aligned > a.unresolved) alignment = 'aligned';
    else if (a.contradicted > a.aligned && a.contradicted > a.unresolved) alignment = 'contradicted';
    else alignment = 'unresolved';
    return {
      patternId: a.patternId,
      mutationType: a.mutationType,
      formula: a.formula,
      campaignMode: a.campaignMode,
      expectedSignal: a.expectedSignal,
      evidenceCount: evidence,
      alignment,
      alignmentCounts: { aligned: a.aligned, contradicted: a.contradicted, unresolved: a.unresolved },
    };
  });
  allPatterns.sort((a, b) =>
    b.evidenceCount - a.evidenceCount ||
    a.patternId.localeCompare(b.patternId),
  );

  const confirmedPatterns = allPatterns.filter((p) => p.alignment === 'aligned');
  const contradictedPatterns = allPatterns.filter((p) => p.alignment === 'contradicted');
  const unresolvedPatterns = allPatterns.filter((p) => p.alignment === 'unresolved');

  // 3. Per-axis adjustments. For each (mutationType, axis), tally events.
  function axisAdjustmentsFor(axis: Axis): AxisAdjustment[] {
    const byMutation = new Map<string, { aligned: number; contradicted: number; unresolved: number }>();
    for (const ev of events) {
      if (ev.axis !== axis) continue;
      if (!byMutation.has(ev.mutationType)) byMutation.set(ev.mutationType, { aligned: 0, contradicted: 0, unresolved: 0 });
      const b = byMutation.get(ev.mutationType)!;
      if (ev.alignment === 'aligned')      b.aligned += 1;
      else if (ev.alignment === 'contradicted') b.contradicted += 1;
      else                                  b.unresolved += 1;
    }
    const out: AxisAdjustment[] = [];
    for (const [mutationType, b] of byMutation) {
      const evidence = b.aligned + b.contradicted + b.unresolved;
      // Signed signature: aligned events push positive, contradicted negative.
      // We do NOT recommend any action — this is an observational signature.
      const raw = b.aligned - b.contradicted;
      const signed = r1(signedClamp(raw, 10));
      const description = b.contradicted > b.aligned
        ? `${mutationType} historically contradicted on ${axis} (${b.contradicted} vs ${b.aligned} aligned, ${b.unresolved} unresolved)`
        : b.aligned > b.contradicted
          ? `${mutationType} historically aligned on ${axis} (${b.aligned} aligned, ${b.contradicted} contradicted, ${b.unresolved} unresolved)`
          : `${mutationType} requires more evidence on ${axis} (${evidence} observation(s) so far)`;
      out.push({
        mutationType, axis,
        alignedCount: b.aligned,
        contradictedCount: b.contradicted,
        unresolvedCount: b.unresolved,
        signedSignature: signed,
        description,
      });
    }
    out.sort((a, b) =>
      b.alignedCount + b.contradictedCount - (a.alignedCount + a.contradictedCount) ||
      a.mutationType.localeCompare(b.mutationType),
    );
    return out;
  }

  const trustAdjustments    = axisAdjustmentsFor('trust');
  const fatigueAdjustments  = axisAdjustmentsFor('fatigue');
  const realismAdjustments  = axisAdjustmentsFor('realism');
  const symbolicAdjustments = axisAdjustmentsFor('symbolic');

  // 4. Per-mutation reliability summaries.
  const byMutationAll = new Map<string, { aligned: number; contradicted: number; unresolved: number }>();
  for (const ev of events) {
    if (!byMutationAll.has(ev.mutationType)) byMutationAll.set(ev.mutationType, { aligned: 0, contradicted: 0, unresolved: 0 });
    const b = byMutationAll.get(ev.mutationType)!;
    if (ev.alignment === 'aligned')      b.aligned += 1;
    else if (ev.alignment === 'contradicted') b.contradicted += 1;
    else                                  b.unresolved += 1;
  }
  const mutationReliability: MutationReliability[] = [];
  for (const [mutationType, b] of byMutationAll) {
    const evidence = b.aligned + b.contradicted + b.unresolved;
    const reliability = evidence === 0
      ? 0
      : r1(clamp10((b.aligned / evidence) * 10 - (b.contradicted / evidence) * 5));
    const description = evidence < 3
      ? `${mutationType} requires more evidence (${evidence} observation(s))`
      : b.contradicted > b.aligned
        ? `${mutationType} historically contradicted (${b.contradicted}/${evidence} observations)`
        : `${mutationType} historically aligned (${b.aligned}/${evidence} observations)`;
    mutationReliability.push({
      mutationType,
      evidenceCount: evidence,
      alignedCount: b.aligned,
      contradictedCount: b.contradicted,
      unresolvedCount: b.unresolved,
      reliabilitySignature: reliability,
      description,
    });
  }
  mutationReliability.sort((a, b) =>
    b.evidenceCount - a.evidenceCount ||
    a.mutationType.localeCompare(b.mutationType),
  );

  // 5. Operator insight summary.
  const operatorInsightSummary = (() => {
    const parts: string[] = [];
    parts.push(`observed learning over ${events.length} (trial, outcome, axis) event(s) across ${allPatterns.length} pattern(s)`);
    if (confirmedPatterns.length > 0) {
      parts.push(`${confirmedPatterns.length} historically aligned pattern(s)`);
    }
    if (contradictedPatterns.length > 0) {
      parts.push(`${contradictedPatterns.length} historically contradicted pattern(s)`);
    }
    if (unresolvedPatterns.length > 0) {
      parts.push(`${unresolvedPatterns.length} requires more evidence`);
    }
    if (events.length === 0) {
      parts.push('no trial-outcome pairs yet — supervised learning is dormant until the operator attaches outcomes');
    }
    return parts.join('. ') + '.';
  })();

  return {
    totalLearningEvents: events.length,
    learningEvents: events,
    confirmedPatterns,
    contradictedPatterns,
    unresolvedPatterns,
    trustAdjustments,
    fatigueAdjustments,
    realismAdjustments,
    symbolicAdjustments,
    mutationReliability,
    operatorInsightSummary,
    reasonCodes: [
      `events:${events.length}`,
      `patterns:${allPatterns.length}`,
      `confirmed:${confirmedPatterns.length}`,
      `contradicted:${contradictedPatterns.length}`,
      `unresolved:${unresolvedPatterns.length}`,
      `mutations:${mutationReliability.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
