/**
 * REVENUE LEARNING BRIDGE (pure, observational)
 *
 * Phase 5 — Business Intelligence Layer.
 *
 * Connects revenue events → attribution → performance → learning →
 * story architect → campaign planner. Produces OBSERVATIONS only.
 * The bridge never auto-modifies any upstream system.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never auto-modifies any upstream system
 *   - never auto-selects
 *   - never auto-optimizes
 *   - allowed phrasing: "historically associated", "observed
 *     alongside", "correlated with", "requires more evidence",
 *     "operator review required"
 *   - forbidden: predict, will-perform, guaranteed, best, winner,
 *     recommended, selected, chosen, optimal, auto-apply,
 *     auto-optimize, viral, dopamine, outrage, manipulat, exploit
 */

import type { AttributionEngineReading } from './attributionEngine';
import type { CustomerJourneyReading } from './customerJourneyEngine';
import type { PerformanceAnalyzerReading } from './performanceAnalyzer';
import type { LearningSignalBridgeReading } from './learningSignalBridge';

// ─── input ────────────────────────────────────────────────────

export interface RevenueLearningBridgeInput {
  journey?: CustomerJourneyReading | null;
  attribution?: AttributionEngineReading | null;
  performance?: PerformanceAnalyzerReading | null;
  learningBridge?: LearningSignalBridgeReading | null;
}

// ─── output ───────────────────────────────────────────────────

export type RevenueSignalConsiderer =
  | 'attribution-layer'
  | 'performance-layer'
  | 'learning-layer'
  | 'story-architect'
  | 'campaign-planner';

export interface RevenueSignal {
  signalId: string;
  observation: string;
  strength: number;
  consideredBy: RevenueSignalConsiderer[];
  reasonCodes: string[];
}

export interface RevenueLearningBridgeReading {
  revenueSignals: RevenueSignal[];
  /** Operator explorations — never recommendations. */
  operatorExplorations: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Revenue learning bridge is observational only. It never auto-modifies ' +
  'any upstream system. It never auto-applies any signal. Operator review ' +
  'required. Human remains final authority.';

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }

// ─── main ─────────────────────────────────────────────────────

export function composeRevenueLearningBridge(
  input: RevenueLearningBridgeInput,
): RevenueLearningBridgeReading {
  const journey = input.journey;
  const attribution = input.attribution;
  const performance = input.performance;
  const learning = input.learningBridge;

  const revenueSignals: RevenueSignal[] = [];
  const operatorExplorations: string[] = [];

  // ── journey → attribution ────────────────────────────────
  if (journey && journey.totalJourneys > 0 && journey.stageCounts.purchase > 0) {
    const completionRate = journey.stageCounts.purchase / Math.max(1, journey.totalJourneys);
    revenueSignals.push({
      signalId: 'journey-completion',
      observation: `journey completion rate historically observed at ${r1(completionRate * 100)}% · ${journey.stageCounts.purchase} purchase(s) across ${journey.totalJourneys} journey(s) — requires more evidence`,
      strength: r1(clamp10(completionRate * 12)),
      consideredBy: ['attribution-layer', 'campaign-planner'],
      reasonCodes: [`purchases:${journey.stageCounts.purchase}`, `journeys:${journey.totalJourneys}`],
    });
  }

  if (attribution && attribution.totalRevenueUSD > 0) {
    revenueSignals.push({
      signalId: 'attribution-revenue-coverage',
      observation: `$${attribution.totalRevenueUSD.toLocaleString()} revenue historically observed with ${Math.round((attribution.attributionCoverage ?? 0) * 100)}% attribution coverage — requires more evidence`,
      strength: r1(clamp10(attribution.totalRevenueUSD > 1000 ? 8 : 5)),
      consideredBy: ['attribution-layer', 'performance-layer', 'campaign-planner'],
      reasonCodes: [`revenue:${attribution.totalRevenueUSD}`, `coverage:${attribution.attributionCoverage}`],
    });

    // Top formula by revenue — observation only.
    const formulaDim = attribution.dimensions.find((d) => d.dimension === 'formula');
    if (formulaDim && formulaDim.rows.length > 0) {
      const top = formulaDim.rows[0];
      revenueSignals.push({
        signalId: 'attribution-formula-leading',
        observation: `${top.entityLabel} historically associated with $${top.observedRevenueUSD.toLocaleString()} observed revenue across ${top.observedJourneys} journey(s) — requires more evidence`,
        strength: r1(clamp10(top.observedRevenueUSD > 500 ? 7 : 4)),
        consideredBy: ['campaign-planner', 'story-architect'],
        reasonCodes: [`topFormula:${top.entityLabel}`, `revenue:${top.observedRevenueUSD}`],
      });
      operatorExplorations.push(
        `operator may explore continuation of ${top.entityLabel} structures historically associated with observed revenue — requires more evidence`,
      );
    }

    const audienceDim = attribution.dimensions.find((d) => d.dimension === 'audience');
    if (audienceDim && audienceDim.rows.length > 0) {
      const top = audienceDim.rows[0];
      revenueSignals.push({
        signalId: 'attribution-audience-leading',
        observation: `${top.entityLabel} audience historically associated with $${top.observedRevenueUSD.toLocaleString()} observed revenue across ${top.observedJourneys} journey(s) — requires more evidence`,
        strength: r1(clamp10(top.observedRevenueUSD > 500 ? 7 : 4)),
        consideredBy: ['campaign-planner'],
        reasonCodes: [`topAudience:${top.entityLabel}`, `revenue:${top.observedRevenueUSD}`],
      });
    }

    const angleDim = attribution.dimensions.find((d) => d.dimension === 'creative-angle');
    if (angleDim && angleDim.rows.length > 0) {
      const top = angleDim.rows[0];
      if (top.observedRevenueUSD > 0) {
        revenueSignals.push({
          signalId: 'attribution-angle-leading',
          observation: `${top.entityLabel} angle historically associated with observed revenue — requires more evidence`,
          strength: r1(clamp10(top.observedRevenueUSD > 200 ? 7 : 4)),
          consideredBy: ['story-architect'],
          reasonCodes: [`topAngle:${top.entityLabel}`, `revenue:${top.observedRevenueUSD}`],
        });
        operatorExplorations.push(
          `operator may explore the ${top.entityLabel} angle in upcoming story-architect runs — requires more evidence`,
        );
      }
    }
  }

  // ── performance ↔ revenue ────────────────────────────────
  if (performance && attribution && attribution.totalRevenueUSD > 0) {
    if (performance.indicators.trustIndicator.migrationDirection >= 2) {
      revenueSignals.push({
        signalId: 'trust-rising-with-revenue',
        observation: 'trust indicator historically observed rising alongside observed revenue — correlated with — requires more evidence',
        strength: r1(clamp10(Math.max(performance.indicators.trustIndicator.level, 5))),
        consideredBy: ['performance-layer', 'learning-layer', 'campaign-planner'],
        reasonCodes: [
          `trustLevel:${performance.indicators.trustIndicator.level}`,
          `trustMigration:${performance.indicators.trustIndicator.migrationDirection}`,
        ],
      });
    }
    if (performance.indicators.fatigueIndicator.level >= 6) {
      revenueSignals.push({
        signalId: 'fatigue-elevated-vs-revenue',
        observation: 'fatigue indicator appears elevated while revenue is observed — operator review required',
        strength: r1(clamp10(performance.indicators.fatigueIndicator.level)),
        consideredBy: ['performance-layer', 'learning-layer'],
        reasonCodes: [`fatigueLevel:${performance.indicators.fatigueIndicator.level}`],
      });
      operatorExplorations.push(
        'operator may explore restraint-leaning campaign plans to balance fatigue while revenue is observed — operator review required',
      );
    }
  }

  // ── learning bridge passthrough ──────────────────────────
  if (learning && learning.bridgeSignals.length > 0) {
    revenueSignals.push({
      signalId: 'learning-bridge-passthrough',
      observation: `${learning.bridgeSignals.length} prior learning signal(s) observed alongside the revenue picture — operator review required`,
      strength: r1(clamp10(learning.bridgeSignals.length * 1.5)),
      consideredBy: ['learning-layer', 'story-architect'],
      reasonCodes: [`priorSignals:${learning.bridgeSignals.length}`],
    });
  }

  if (revenueSignals.length === 0) {
    revenueSignals.push({
      signalId: 'no-revenue-evidence',
      observation: 'no revenue signals composed yet — requires more evidence',
      strength: 0,
      consideredBy: ['attribution-layer', 'performance-layer', 'learning-layer', 'story-architect', 'campaign-planner'],
      reasonCodes: ['evidence:absent'],
    });
  }
  if (operatorExplorations.length === 0) {
    operatorExplorations.push('no operator explorations surfaced — requires more evidence');
  }

  const notes: string[] = [];
  notes.push('revenue signals are observational — never auto-applied to upstream systems');
  if (attribution) notes.push(`composed from ${attribution.dimensions.reduce((a, d) => a + d.rows.length, 0)} attribution row(s)`);

  return {
    revenueSignals,
    operatorExplorations,
    notes,
    reasonCodes: [
      `signals:${revenueSignals.length}`,
      `explorations:${operatorExplorations.length}`,
    ],
    advisoryNotice: ADVISORY_NOTICE,
  };
}
