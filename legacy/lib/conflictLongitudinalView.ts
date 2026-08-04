/**
 * CONFLICT LONGITUDINAL VIEW (Cross-Brain Conflict Engine — Phase Next)
 *
 * Read-only analyzer. Surfaces conflict patterns over time:
 *   - recurring disagreements (conflict-type counts + EWMA severity)
 *   - rising instability (instability trace trend)
 *   - stable alignment zones
 *   - long-term trust conflicts
 *   - emotional fatigue drift
 *   - conflict hotspots (by mode + by conflict type)
 *   - areas of strategic certainty / uncertainty
 *
 * Pure. No I/O. Deterministic for the same memory state.
 */

import type {
  ConflictMemoryState, ConflictObservation, InstabilityPoint,
} from './conflictMemory';
import type { ConflictType, CrossBrainConflict } from './crossBrainConflictEngine';

// ─── shape ─────────────────────────────────────────────────────

export interface RecurringConflictRow {
  type: ConflictType;
  count: number;
  share: number;
  ewmaSeverity: number;
}

export interface AgreementZoneRow {
  zone: string;
  count: number;
  share: number;
}

export interface ConflictHotspotRow {
  key: string;             // e.g. "Documentary · trust-vs-conversion"
  count: number;
  averageSeverity: number;
}

export interface InstabilityTrendPoint {
  at: number;
  overallTension: number;
  cognitiveStability: number;
}

export type InstabilityTrend = 'no-history' | 'establishing' | 'stable' | 'rising' | 'falling';

export interface ConflictLongitudinalView {
  present: boolean;
  statement: string;
  instabilityTrend: InstabilityTrend;

  totalObservations: number;
  averageTension: number;
  averageStability: number;
  averageAlignment: number;
  silentRiskRate: number;          // 0..1

  current: CrossBrainConflict | null;

  recurringConflicts: RecurringConflictRow[];
  stableAgreementZones: AgreementZoneRow[];
  conflictHotspots: ConflictHotspotRow[];
  instabilityTrace: InstabilityTrendPoint[];

  strategicCertaintyAreas: string[];
  strategicUncertaintyAreas: string[];

  // Themed slices.
  longTermTrustConflicts: RecurringConflictRow[];
  emotionalFatigueDrift: number;   // 0..10 — derived from emotion-vs-fatigue + familiarity-vs-freshness EWMA
  noveltyCollapseCycles: number;   // count of novelty-vs-authenticity + familiarity-vs-freshness recurrences
}

// ─── helpers ───────────────────────────────────────────────────

function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

// ─── trend classifier ─────────────────────────────────────────

function classifyInstability(trace: InstabilityPoint[]): InstabilityTrend {
  if (trace.length === 0) return 'no-history';
  if (trace.length < 4) return 'establishing';
  const half = Math.floor(trace.length / 2);
  const early = avg(trace.slice(0, half).map((p) => p.overallTension));
  const recent = avg(trace.slice(half).map((p) => p.overallTension));
  const delta = recent - early;
  if (delta > 0.8) return 'rising';
  if (delta < -0.8) return 'falling';
  return 'stable';
}

// ─── conflict hotspots by (mode, type) ────────────────────────

function buildHotspots(observations: ConflictObservation[]): ConflictHotspotRow[] {
  const buckets = new Map<string, { count: number; sevSum: number }>();
  for (const obs of observations) {
    const mode = obs.campaignMode ?? 'auto';
    for (const c of obs.activeConflicts) {
      const key = `${mode} · ${c.type}`;
      const cur = buckets.get(key) ?? { count: 0, sevSum: 0 };
      buckets.set(key, { count: cur.count + 1, sevSum: cur.sevSum + c.severity });
    }
  }
  return [...buckets.entries()]
    .map(([key, { count, sevSum }]) => ({
      key, count, averageSeverity: round1(sevSum / Math.max(1, count)),
    }))
    .filter((r) => r.count >= 2)
    .sort((a, b) =>
      b.count !== a.count
        ? b.count - a.count
        : b.averageSeverity - a.averageSeverity,
    )
    .slice(0, 6);
}

// ─── main ──────────────────────────────────────────────────────

export interface ConflictLongitudinalViewInput {
  memory: ConflictMemoryState | null;
  /** Optional just-shipped conflict snapshot — surfaced as `current`
   *  on the view so the panel can show "this run's reading" alongside
   *  the longitudinal slice. */
  current?: CrossBrainConflict | null;
}

export function buildConflictLongitudinalView(
  input: ConflictLongitudinalViewInput,
): ConflictLongitudinalView {
  const mem = input.memory;

  if (!mem || mem.totalObservations === 0) {
    return {
      present: false,
      statement: 'no internal disagreements observed yet — the conflict engine has no history to read',
      instabilityTrend: 'no-history',
      totalObservations: 0,
      averageTension: 0,
      averageStability: 10,
      averageAlignment: 10,
      silentRiskRate: 0,
      current: input.current ?? null,
      recurringConflicts: [],
      stableAgreementZones: [],
      conflictHotspots: [],
      instabilityTrace: [],
      strategicCertaintyAreas: input.current?.confidenceGradient.highConfidenceAreas ?? [],
      strategicUncertaintyAreas: input.current?.confidenceGradient.uncertainAreas ?? [],
      longTermTrustConflicts: [],
      emotionalFatigueDrift: 0,
      noveltyCollapseCycles: 0,
    };
  }

  // Aggregate scalars.
  const observations = mem.observations;
  const total = mem.totalObservations;
  const averageTension   = round1(avg(observations.map((o) => o.overallTension)));
  const averageStability = round1(avg(observations.map((o) => o.cognitiveStability)));
  const averageAlignment = round1(avg(observations.map((o) => o.alignmentScore)));
  const silentRiskRate   = round2(
    avg(observations.map((o) => o.silentRiskCount)) / 4,    // normalize: 4+ silent risks → ~1
  );

  // Recurring conflicts table.
  const totalConflicts = Object.values(mem.conflictTypeCounts).reduce((a, b) => a + b, 0);
  const recurringConflicts: RecurringConflictRow[] = Object.entries(mem.conflictTypeCounts)
    .map(([type, count]) => ({
      type: type as ConflictType,
      count,
      share: totalConflicts > 0 ? round2(count / totalConflicts) : 0,
      ewmaSeverity: round1(mem.conflictTypeSeverityEwma[type] ?? 0),
    }))
    .sort((a, b) =>
      b.count !== a.count
        ? b.count - a.count
        : b.ewmaSeverity - a.ewmaSeverity,
    )
    .slice(0, 8);

  // Stable agreement zones.
  const totalAgreement = Object.values(mem.agreementZoneCounts).reduce((a, b) => a + b, 0);
  const stableAgreementZones: AgreementZoneRow[] = Object.entries(mem.agreementZoneCounts)
    .map(([zone, count]) => ({
      zone,
      count,
      share: totalAgreement > 0 ? round2(count / totalAgreement) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Hotspots.
  const conflictHotspots = buildHotspots(observations);

  // Instability trace (small tail).
  const instabilityTrace: InstabilityTrendPoint[] = mem.instabilityTrace
    .slice(-24)
    .map((p) => ({
      at: p.at,
      overallTension: round1(p.overallTension),
      cognitiveStability: round1(p.cognitiveStability),
    }));

  const instabilityTrend = classifyInstability(mem.instabilityTrace);

  // Themed slices.
  const longTermTrustConflicts = recurringConflicts.filter((r) =>
    r.type === 'trust-vs-conversion' ||
    r.type === 'short-term-vs-long-term-trust' ||
    r.type === 'brand-vs-clickability',
  );

  const emotionalFatigueDrift = round1(
    Math.min(10,
      (mem.conflictTypeSeverityEwma['emotion-vs-fatigue'] ?? 0) * 0.6 +
      (mem.conflictTypeSeverityEwma['familiarity-vs-freshness'] ?? 0) * 0.4),
  );

  const noveltyCollapseCycles =
    (mem.conflictTypeCounts['novelty-vs-authenticity'] ?? 0) +
    (mem.conflictTypeCounts['familiarity-vs-freshness'] ?? 0);

  // Strategic certainty/uncertainty.
  const certainty: string[] = [];
  const uncertainty: string[] = [];
  if (input.current) {
    certainty.push(...input.current.confidenceGradient.highConfidenceAreas);
    uncertainty.push(...input.current.confidenceGradient.uncertainAreas);
  }
  // Add longitudinal signals.
  for (const r of recurringConflicts) {
    if (r.count >= 5 && r.ewmaSeverity >= 6) {
      uncertainty.push(`${r.type} — recurring ×${r.count}, ewma ${r.ewmaSeverity.toFixed(1)}/10`);
    }
  }
  for (const z of stableAgreementZones) {
    if (z.count >= 5) certainty.push(`stable agreement: ${z.zone} (×${z.count})`);
  }

  // Statement.
  const statement = (() => {
    if (instabilityTrend === 'rising') return `internal disagreement rising — ${total} observations, tension trending up`;
    if (instabilityTrend === 'falling') return `internal disagreement settling — tension trending down across ${total} observations`;
    if (instabilityTrend === 'stable')  return `internal cognition stable — average tension ${averageTension.toFixed(1)}/10 across ${total} observations`;
    return `establishing baseline — ${total} observation(s) recorded`;
  })();

  return {
    present: true,
    statement,
    instabilityTrend,
    totalObservations: total,
    averageTension,
    averageStability,
    averageAlignment,
    silentRiskRate,
    current: input.current ?? null,
    recurringConflicts,
    stableAgreementZones,
    conflictHotspots,
    instabilityTrace,
    strategicCertaintyAreas: certainty.slice(0, 8),
    strategicUncertaintyAreas: uncertainty.slice(0, 8),
    longTermTrustConflicts,
    emotionalFatigueDrift,
    noveltyCollapseCycles,
  };
}
