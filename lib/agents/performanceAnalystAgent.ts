/**
 * PERFORMANCE ANALYST AGENT (pure orchestrator)
 *
 * Consumes performance + revenue + attribution layers and produces
 * operator-reviewable observations · patterns · research questions
 * · requires-more-evidence reports.
 *
 * The agent NEVER predicts, NEVER recommends, NEVER auto-applies a
 * signal to any upstream system.
 */

import type { PerformanceAnalyzerReading } from '../performanceAnalyzer';
import type { AttributionEngineReading } from '../attributionEngine';
import type { CustomerJourneyReading } from '../customerJourneyEngine';
import type { LearningSignalBridgeReading } from '../learningSignalBridge';
import type { RevenueLearningBridgeReading } from '../revenueLearningBridge';
import type { AgentDescriptor } from './types';
import { AGENT_CATALOG, AGENT_ADVISORY_NOTICE } from './types';

// ─── input ────────────────────────────────────────────────────

export interface PerformanceAnalystAgentInput {
  performance?: PerformanceAnalyzerReading | null;
  attribution?: AttributionEngineReading | null;
  journey?: CustomerJourneyReading | null;
  learningBridge?: LearningSignalBridgeReading | null;
  revenueBridge?: RevenueLearningBridgeReading | null;
}

// ─── output ───────────────────────────────────────────────────

export interface AnalystObservation {
  observationId: string;
  /** Plain-language note, allowed phrasing only. */
  note: string;
  /** 0..10 — observed strength. */
  strength: number;
  reasonCodes: string[];
}

export interface ResearchQuestion {
  questionId: string;
  question: string;
  /** Why this question matters — plain language. */
  rationale: string;
}

export interface EvidenceGap {
  gapId: string;
  description: string;
  /** Counter that motivated the gap. */
  counter: number;
}

export interface PerformanceAnalystAgentOutput {
  descriptor: AgentDescriptor;
  observations: AnalystObservation[];
  patterns: Array<{ patternId: string; description: string; strength: number; evidenceCount: number }>;
  researchQuestions: ResearchQuestion[];
  evidenceGaps: EvidenceGap[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main ─────────────────────────────────────────────────────

export function runPerformanceAnalystAgent(
  input: PerformanceAnalystAgentInput,
): PerformanceAnalystAgentOutput {
  const performance = input.performance;
  const attribution = input.attribution;
  const journey = input.journey;
  const learning = input.learningBridge;
  const revenue = input.revenueBridge;

  const observations: AnalystObservation[] = [];
  const patterns: PerformanceAnalystAgentOutput['patterns'] = [];
  const researchQuestions: ResearchQuestion[] = [];
  const evidenceGaps: EvidenceGap[] = [];

  if (performance && performance.totalPerformances > 0) {
    observations.push({
      observationId: 'perf-volume',
      note: `${performance.totalPerformances} performance observation(s) historically observed`,
      strength: r1(clamp10(performance.totalPerformances / 5)),
      reasonCodes: [`performances:${performance.totalPerformances}`],
    });
    if (performance.indicators.fatigueIndicator.level >= 6) {
      observations.push({
        observationId: 'perf-fatigue-elevated',
        note: 'fatigue indicator appears elevated — historically associated with audience exhaustion · operator review required',
        strength: r1(clamp10(performance.indicators.fatigueIndicator.level)),
        reasonCodes: [`fatigue:${performance.indicators.fatigueIndicator.level}`],
      });
    }
    if (performance.indicators.trustIndicator.migrationDirection >= 2) {
      observations.push({
        observationId: 'perf-trust-rising',
        note: 'trust indicator appears to be rising — historically associated with restraint-leaning outputs · operator review required',
        strength: r1(clamp10(performance.indicators.trustIndicator.level)),
        reasonCodes: [`trustMigration:${performance.indicators.trustIndicator.migrationDirection}`],
      });
    }
    for (const p of performance.historicallyAssociatedPatterns) {
      patterns.push({
        patternId: p.patternId, description: p.description,
        strength: r1(clamp10(p.strength)), evidenceCount: p.evidenceCount,
      });
    }
  } else {
    evidenceGaps.push({
      gapId: 'gap-perf-empty',
      description: 'no performance observations logged · requires more evidence',
      counter: 0,
    });
    researchQuestions.push({
      questionId: 'q-perf-pipeline',
      question: 'how can the operator pull performance data from external analytics into the performance memory?',
      rationale: 'no performance observations historically observed — agent cannot surface fatigue / attention / retention / trust indicators',
    });
  }

  if (attribution && attribution.totalRevenueUSD > 0) {
    observations.push({
      observationId: 'attribution-revenue',
      note: `$${attribution.totalRevenueUSD.toLocaleString()} revenue historically observed across ${attribution.totalJourneys} journey(s) · operator review required`,
      strength: r1(clamp10(attribution.totalRevenueUSD > 1000 ? 9 : 5)),
      reasonCodes: [`revenue:${attribution.totalRevenueUSD}`, `journeys:${attribution.totalJourneys}`],
    });
    const formulaDim = attribution.dimensions.find((d) => d.dimension === 'formula');
    if (formulaDim && formulaDim.rows.length > 0) {
      const top = formulaDim.rows[0];
      observations.push({
        observationId: 'attribution-top-formula',
        note: `${top.entityLabel} historically associated with $${top.observedRevenueUSD.toLocaleString()} observed revenue — requires more evidence`,
        strength: r1(clamp10(top.observedRevenueUSD > 500 ? 8 : 5)),
        reasonCodes: [`topFormula:${top.entityLabel}`, `revenue:${top.observedRevenueUSD}`],
      });
    }
    if ((attribution.attributionCoverage ?? 0) < 0.5) {
      researchQuestions.push({
        questionId: 'q-coverage-low',
        question: 'how can the operator increase attribution coverage above 50%?',
        rationale: `current attribution coverage ${Math.round((attribution.attributionCoverage ?? 0) * 100)}% historically observed — requires more evidence`,
      });
    }
  } else {
    evidenceGaps.push({
      gapId: 'gap-attribution-empty',
      description: 'no revenue events attributed yet · requires more evidence',
      counter: attribution?.totalJourneys ?? 0,
    });
  }

  if (journey && journey.totalJourneys > 0) {
    if (journey.stageCounts.purchase > 0) {
      const completion = journey.stageCounts.purchase / Math.max(1, journey.totalJourneys);
      observations.push({
        observationId: 'journey-completion',
        note: `journey completion rate historically observed at ${r1(completion * 100)}% — operator review required`,
        strength: r1(clamp10(completion * 12)),
        reasonCodes: [`completion:${r1(completion)}`],
      });
    }
    const totalDropOff = journey.dropOffLocations.reduce((a, l) => a + l.dropoffCount, 0);
    if (totalDropOff > 0) {
      observations.push({
        observationId: 'journey-dropoff',
        note: `${totalDropOff} historically observed drop-off(s) across ${journey.dropOffLocations.length} stage edge(s) — operator review required`,
        strength: r1(clamp10(journey.dropOffLocations.length)),
        reasonCodes: [`dropoffs:${totalDropOff}`, `edges:${journey.dropOffLocations.length}`],
      });
    }
  }

  if (learning && learning.bridgeSignals.length > 0) {
    patterns.push({
      patternId: 'learning-bridge-passthrough',
      description: `${learning.bridgeSignals.length} prior learning signal(s) historically observed alongside the analysis · operator review required`,
      strength: r1(clamp10(learning.bridgeSignals.length * 1.5)),
      evidenceCount: learning.bridgeSignals.length,
    });
  }
  if (revenue && revenue.revenueSignals.length > 0) {
    for (const sig of revenue.revenueSignals.slice(0, 4)) {
      observations.push({
        observationId: `revenue-${sig.signalId}`,
        note: sig.observation,
        strength: r1(clamp10(sig.strength)),
        reasonCodes: sig.reasonCodes,
      });
    }
  }

  // Generic research questions when evidence is sparse.
  if (observations.length === 0) {
    researchQuestions.push({
      questionId: 'q-evidence-thin',
      question: 'what additional operator-logged events would unlock further observations?',
      rationale: 'no observations composed yet · requires more evidence',
    });
  }

  const notes: string[] = [];
  notes.push('performance analyst agent run · operator-reviewable observations only');
  notes.push('agent NEVER predicts · NEVER recommends · NEVER auto-applies signals · operator review required');
  if (observations.length === 0 && patterns.length === 0) {
    notes.push('no observations or patterns composed · requires more evidence');
  }

  return {
    descriptor: AGENT_CATALOG['performance-analyst'],
    observations, patterns, researchQuestions, evidenceGaps,
    notes,
    reasonCodes: [
      `observations:${observations.length}`,
      `patterns:${patterns.length}`,
      `questions:${researchQuestions.length}`,
      `gaps:${evidenceGaps.length}`,
    ],
    advisoryNotice: AGENT_ADVISORY_NOTICE,
  };
}
