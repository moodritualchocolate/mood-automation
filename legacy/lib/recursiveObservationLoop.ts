/**
 * RECURSIVE OBSERVATION LOOP (pure, observational)
 *
 * Runs LAYERED REFLECTIVE PASSES over the system's observations.
 * Each pass may adjust interpretation confidence, but NEVER outputs
 * certainty. The loop documents what each pass added and what it
 * left unresolved.
 *
 * Passes (in order):
 *   1. observation             — what is present
 *   2. contradiction review    — what competing truths exist
 *   3. ambiguity review        — what cannot be disambiguated
 *   4. assumption review       — what we may be assuming
 *   5. hypothesis generation   — what possibilities the data allows
 *   6. tension reasoning       — what is pulling in opposite directions
 *   7. confidence re-check     — does the pass leave us more / less confident
 *   8. unresolved boundary     — what we still do not know
 *
 * STRICT CONTRACT:
 *   - never concludes certainty
 *   - each pass is independent and pure
 *   - never modifies prior passes
 *   - the loop expands uncertainty; never collapses it
 */

import { computeReflections, type ReflectionInput } from './reflectionEngine';
import { computeHypotheses, type HypothesisInput } from './hypothesisEngine';
import { computeAssumptionAudit, type AssumptionInput } from './assumptionAudit';
import { computeTensions, type TensionInput } from './tensionReasoningEngine';
import { computeExplanationVariance, type ExplanationVarianceInput } from './explanationVarianceEngine';

export interface RecursiveLoopInput {
  reflection?: ReflectionInput;
  hypothesis?: HypothesisInput;
  assumption?: AssumptionInput;
  tension?: TensionInput;
  variance?: ExplanationVarianceInput;
  /** Optional initial confidence reading. */
  initialConfidence?: { overallLevel?: string; overallScore?: number } | null;
  contradictions?: { contradictions?: Array<{ key: string; severity: number }> } | null;
  ambiguities?: { ambiguities?: Array<{ zone: string; severity: number }> } | null;
  boundaries?: { boundaries?: Array<{ zone: string; severity: number }> } | null;
}

export interface RecursivePass {
  index: number;
  pass: 'observation' | 'contradiction-review' | 'ambiguity-review' |
         'assumption-review' | 'hypothesis-generation' | 'tension-reasoning' |
         'confidence-recheck' | 'unresolved-boundary';
  /** What the pass added to the picture. */
  added: string[];
  /** What the pass left unresolved. */
  unresolved: string[];
  /** Signed delta on the running confidence trail (-10..+10).
   *  Positive = pass increased confidence; negative = pass decreased. */
  confidenceDelta: number;
}

export interface RecursiveLoopReading {
  totalPasses: number;
  passes: RecursivePass[];
  /** Final confidence score adjusted by all passes (0..10). */
  finalConfidenceScore: number;
  /** Net delta across all passes — usually negative in healthy loops. */
  netConfidenceDelta: number;
  /** Total unresolved items across all passes. */
  unresolvedCount: number;
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the recursive loop EXPANDS uncertainty. Each pass may add ' +
  'questions or remove false confidence; no pass outputs certainty.';

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main ─────────────────────────────────────────────────────

export function computeRecursiveLoop(input: RecursiveLoopInput): RecursiveLoopReading {
  const passes: RecursivePass[] = [];
  let runningConfidence = input.initialConfidence?.overallScore ?? 5;

  // ── Pass 1: observation ──────────────────────────────────
  const observationItems: string[] = [];
  const obsRecords = input.reflection?.outcomes?.outcomes?.length ?? 0;
  observationItems.push(`${obsRecords} outcome record(s) read`);
  observationItems.push(`${input.reflection?.drift?.observations?.length ?? 0} drift observation(s) read`);
  passes.push({
    index: 1, pass: 'observation',
    added: observationItems,
    unresolved: obsRecords < 6 ? [`only ${obsRecords} outcome record(s) — observation depth is thin`] : [],
    confidenceDelta: 0,
  });

  // ── Pass 2: contradiction review ─────────────────────────
  const contradictions = input.contradictions?.contradictions ?? [];
  const contradictionDelta = -Math.min(3, contradictions.length * 0.5);
  runningConfidence = clamp10(runningConfidence + contradictionDelta);
  passes.push({
    index: 2, pass: 'contradiction-review',
    added: contradictions.slice(0, 3).map((c) => `competing truth: ${c.key} (severity ${c.severity}/10)`),
    unresolved: contradictions.slice(3).map((c) => c.key),
    confidenceDelta: r1(contradictionDelta),
  });

  // ── Pass 3: ambiguity review ─────────────────────────────
  const ambig = input.ambiguities?.ambiguities ?? [];
  const ambigDelta = -Math.min(3, ambig.length * 0.4);
  runningConfidence = clamp10(runningConfidence + ambigDelta);
  passes.push({
    index: 3, pass: 'ambiguity-review',
    added: ambig.slice(0, 3).map((a) => `ambiguous zone: ${a.zone} (severity ${a.severity}/10)`),
    unresolved: ambig.slice(3).map((a) => a.zone),
    confidenceDelta: r1(ambigDelta),
  });

  // ── Pass 4: assumption review ────────────────────────────
  const assumptions = input.assumption ? computeAssumptionAudit(input.assumption) : null;
  const assumptionDelta = assumptions
    ? -Math.min(2, assumptions.findings.length * 0.4)
    : 0;
  runningConfidence = clamp10(runningConfidence + assumptionDelta);
  passes.push({
    index: 4, pass: 'assumption-review',
    added: (assumptions?.findings ?? []).slice(0, 3).map((f) => `assumption flagged: ${f.assumption}`),
    unresolved: (assumptions?.findings ?? []).slice(3).map((f) => f.key),
    confidenceDelta: r1(assumptionDelta),
  });

  // ── Pass 5: hypothesis generation ────────────────────────
  const hypotheses = input.hypothesis ? computeHypotheses(input.hypothesis) : null;
  passes.push({
    index: 5, pass: 'hypothesis-generation',
    added: (hypotheses?.hypotheses ?? []).slice(0, 3).map((h) => h.statement),
    unresolved: (hypotheses?.hypotheses ?? []).slice(3).map((h) => h.statement),
    confidenceDelta: 0,    // hypotheses do not change confidence
  });

  // ── Pass 6: tension reasoning ────────────────────────────
  const tensions = input.tension ? computeTensions(input.tension) : null;
  const tensionDelta = tensions
    ? -Math.min(2, tensions.tensions.length * 0.3)
    : 0;
  runningConfidence = clamp10(runningConfidence + tensionDelta);
  passes.push({
    index: 6, pass: 'tension-reasoning',
    added: (tensions?.tensions ?? []).slice(0, 3).map((t) => `tension: ${t.key} (score ${t.tensionScore}/10)`),
    unresolved: (tensions?.tensions ?? []).slice(3).map((t) => t.key),
    confidenceDelta: r1(tensionDelta),
  });

  // ── Pass 7: confidence re-check ──────────────────────────
  const checkDelta = 0;     // bookkeeping pass
  passes.push({
    index: 7, pass: 'confidence-recheck',
    added: [
      `running confidence after passes 1-6: ${r1(runningConfidence)}/10`,
      'no pass has output certainty',
    ],
    unresolved: ['confidence remains an observation, never a guarantee'],
    confidenceDelta: checkDelta,
  });

  // ── Pass 8: unresolved boundary ──────────────────────────
  const boundaries = input.boundaries?.boundaries ?? [];
  const variance = input.variance ? computeExplanationVariance(input.variance) : null;
  passes.push({
    index: 8, pass: 'unresolved-boundary',
    added: [
      ...boundaries.slice(0, 3).map((b) => `boundary: ${b.zone} (severity ${b.severity}/10)`),
      ...(variance?.clusters ?? []).slice(0, 2).map((c) =>
        `${c.observedPattern}: ${c.explanations.filter((e) => e.support >= 4).length} co-active explanations`),
    ],
    unresolved: [
      ...boundaries.slice(3).map((b) => b.zone),
      ...(variance?.clusters ?? []).slice(2).map((c) => c.observedPattern),
    ],
    confidenceDelta: 0,
  });

  const netConfidenceDelta = r1(passes.reduce((a, p) => a + p.confidenceDelta, 0));
  const unresolvedCount = passes.reduce((a, p) => a + p.unresolved.length, 0);

  return {
    totalPasses: passes.length,
    passes,
    finalConfidenceScore: r1(runningConfidence),
    netConfidenceDelta,
    unresolvedCount,
    reasonCodes: [
      `passes:${passes.length}`,
      `final-confidence:${r1(runningConfidence)}/10`,
      `net-delta:${netConfidenceDelta}`,
      `unresolved-items:${unresolvedCount}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
