/**
 * CREATIVE DRIFT LONGITUDINAL VIEW
 *
 * Pure analyzer over creative-drift FIFO memory. Surfaces:
 *   - long-term drift direction (improving / stable / worsening)
 *   - healthiest eras (consecutive observations with health ≥ 7)
 *   - collapse periods (when health < 4)
 *   - recovery periods (collapse → recovery transitions)
 *   - narrative / emotional / persuasion / formula diversity over time
 *   - entropy acceleration (Δ entropy / observations)
 *   - originality collapse risk
 *
 * No I/O. Same memory → same view.
 */

import type {
  CreativeDriftMemoryState, CreativeDriftObservation,
  CollapseEvent, RecoveryEvent,
  RepetitionCycleMarker, SaturationCycleMarker,
  ConvergenceCycleMarker, OriginalityCycleMarker,
} from './creativeDriftMemory';

export type LongTermDriftDirection =
  | 'improving' | 'stable' | 'worsening' | 'volatile' | 'unknown';

export interface DriftTrajectoryPoint {
  at: number;
  value: number;
}

export interface HealthyEra {
  startAt: number;
  endAt: number;
  observations: number;
  averageHealth: number;
}

export interface CollapsePeriod {
  startAt: number;
  endAt: number | null;        // null if still ongoing
  observations: number;
  averageHealth: number;
  dominantPattern: string | null;
}

export interface CreativeDriftLongitudinalView {
  present: boolean;
  statement: string;

  totalObservations: number;
  averageHealth: number;
  averageDrift: number;
  averageEntropy: number;
  averageOriginalityPressure: number;

  longTermDriftDirection: LongTermDriftDirection;
  entropyAcceleration: number;     // 0..10 — magnitude of recent entropy change
  originalityCollapseRisk: number; // 0..10

  /** Time-series of each scalar. */
  healthTrajectory: DriftTrajectoryPoint[];
  driftTrajectory: DriftTrajectoryPoint[];
  entropyTrajectory: DriftTrajectoryPoint[];
  originalityPressureTrajectory: DriftTrajectoryPoint[];
  narrativeStabilityTrajectory: DriftTrajectoryPoint[];
  emotionalDiversityTrajectory: DriftTrajectoryPoint[];
  persuasionVarianceTrajectory: DriftTrajectoryPoint[];
  formulaDistinctivenessTrajectory: DriftTrajectoryPoint[];

  /** Eras + periods. */
  healthiestEras: HealthyEra[];
  collapsePeriods: CollapsePeriod[];

  /** Markers carried over from memory (capped). */
  collapseEvents: CollapseEvent[];
  recoveryEvents: RecoveryEvent[];
  repetitionCycles: RepetitionCycleMarker[];
  saturationCycles: SaturationCycleMarker[];
  convergenceCycles: ConvergenceCycleMarker[];
  originalityCycles: OriginalityCycleMarker[];

  advisoryNotice: string;
  reasonCodes: string[];
}

// ─── helpers ──────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function avg(xs: number[]): number {
  if (xs.length === 0) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}

const RECENT_WINDOW = 12;
const HEALTHY_RUN_THRESHOLD = 7.0;
const COLLAPSE_THRESHOLD = 4.0;

const ADVISORY_NOTICE =
  'Observatory only — drift detection never modifies generation.';

function emptyView(): CreativeDriftLongitudinalView {
  return {
    present: false,
    statement: 'creative drift memory empty — no observations yet',
    totalObservations: 0,
    averageHealth: 0, averageDrift: 0, averageEntropy: 0, averageOriginalityPressure: 0,
    longTermDriftDirection: 'unknown',
    entropyAcceleration: 0,
    originalityCollapseRisk: 0,
    healthTrajectory: [], driftTrajectory: [], entropyTrajectory: [],
    originalityPressureTrajectory: [], narrativeStabilityTrajectory: [],
    emotionalDiversityTrajectory: [], persuasionVarianceTrajectory: [],
    formulaDistinctivenessTrajectory: [],
    healthiestEras: [], collapsePeriods: [],
    collapseEvents: [], recoveryEvents: [],
    repetitionCycles: [], saturationCycles: [],
    convergenceCycles: [], originalityCycles: [],
    advisoryNotice: ADVISORY_NOTICE,
    reasonCodes: ['empty-memory'],
  };
}

// ─── eras + periods ───────────────────────────────────────────

function findHealthyEras(obs: CreativeDriftObservation[]): HealthyEra[] {
  const out: HealthyEra[] = [];
  let runStart = -1;
  for (let i = 0; i < obs.length; i++) {
    const healthy = obs[i].overallCreativeHealth >= HEALTHY_RUN_THRESHOLD;
    if (healthy && runStart === -1) runStart = i;
    if ((!healthy || i === obs.length - 1) && runStart !== -1) {
      const end = healthy ? i : i - 1;
      if (end >= runStart) {
        const slice = obs.slice(runStart, end + 1);
        if (slice.length >= 2) {
          out.push({
            startAt: slice[0].at,
            endAt: slice[slice.length - 1].at,
            observations: slice.length,
            averageHealth: round1(avg(slice.map((o) => o.overallCreativeHealth))),
          });
        }
      }
      runStart = healthy ? i : -1;
    }
  }
  return out.sort((a, b) => b.observations - a.observations || b.averageHealth - a.averageHealth);
}

function findCollapsePeriods(obs: CreativeDriftObservation[]): CollapsePeriod[] {
  const out: CollapsePeriod[] = [];
  let runStart = -1;
  for (let i = 0; i < obs.length; i++) {
    const collapsed = obs[i].overallCreativeHealth < COLLAPSE_THRESHOLD;
    if (collapsed && runStart === -1) runStart = i;
    if ((!collapsed || i === obs.length - 1) && runStart !== -1) {
      const end = collapsed ? i : i - 1;
      if (end >= runStart) {
        const slice = obs.slice(runStart, end + 1);
        out.push({
          startAt: slice[0].at,
          endAt: collapsed && i === obs.length - 1 ? null : slice[slice.length - 1].at,
          observations: slice.length,
          averageHealth: round1(avg(slice.map((o) => o.overallCreativeHealth))),
          dominantPattern: null,
        });
      }
      runStart = collapsed && i === obs.length - 1 ? runStart : -1;
    }
  }
  return out;
}

// ─── main ─────────────────────────────────────────────────────

export interface CreativeDriftViewInput {
  memory: CreativeDriftMemoryState | null;
}

export function buildCreativeDriftLongitudinalView(
  input: CreativeDriftViewInput,
): CreativeDriftLongitudinalView {
  const mem = input.memory;
  if (!mem || mem.totalObservations === 0 || mem.observations.length === 0) {
    return emptyView();
  }

  const obs = mem.observations;
  const recent = obs.slice(-RECENT_WINDOW);

  const averageHealth = round1(avg(obs.map((o) => o.overallCreativeHealth)));
  const averageDrift = round1(avg(obs.map((o) => o.driftSeverity)));
  const averageEntropy = round1(avg(obs.map((o) => o.entropyLevel)));
  const averageOriginalityPressure = round1(avg(obs.map((o) => o.originalityPressure)));

  // ── long-term direction ──────────────────────────────────
  let longTermDriftDirection: LongTermDriftDirection = 'unknown';
  if (obs.length >= 4) {
    const half = Math.floor(obs.length / 2);
    const earlyH = avg(obs.slice(0, half).map((o) => o.overallCreativeHealth));
    const lateH  = avg(obs.slice(half).map((o) => o.overallCreativeHealth));
    const earlyD = avg(obs.slice(0, half).map((o) => o.driftSeverity));
    const lateD  = avg(obs.slice(half).map((o) => o.driftSeverity));
    const dh = lateH - earlyH;
    const dd = lateD - earlyD;
    if (Math.abs(dh) < 0.5 && Math.abs(dd) < 0.5) longTermDriftDirection = 'stable';
    else if (dh >= 0.5 && dd <= 0.5) longTermDriftDirection = 'improving';
    else if (dh <= -0.5) longTermDriftDirection = 'worsening';
    else longTermDriftDirection = 'volatile';
  }

  // ── entropy acceleration ─────────────────────────────────
  let entropyAcceleration = 0;
  if (recent.length >= 4) {
    const half = Math.floor(recent.length / 2);
    const earlyE = avg(recent.slice(0, half).map((o) => o.entropyLevel));
    const lateE  = avg(recent.slice(half).map((o) => o.entropyLevel));
    entropyAcceleration = round1(clamp10(Math.abs(lateE - earlyE) * 2));
  }

  // ── originality collapse risk ────────────────────────────
  const lastObs = recent[recent.length - 1];
  const originalityCollapseRisk = round1(clamp10(
    lastObs.originalityPressure * 0.6 + (10 - lastObs.entropyLevel) * 0.4,
  ));

  // ── trajectories ─────────────────────────────────────────
  const trajectory = <K extends keyof CreativeDriftObservation>(key: K): DriftTrajectoryPoint[] =>
    obs.map((o) => ({ at: o.at, value: Number(o[key] ?? 0) }));

  // ── eras + periods ───────────────────────────────────────
  const healthiestEras = findHealthyEras(obs).slice(0, 8);
  const collapsePeriods = findCollapsePeriods(obs).slice(-8);

  // ── statement ────────────────────────────────────────────
  const statement = (() => {
    const direction = longTermDriftDirection;
    const recentAvg = round1(avg(recent.map((o) => o.overallCreativeHealth)));
    if (direction === 'improving') return `creative health is improving — recent avg ${recentAvg}/10`;
    if (direction === 'stable')    return `creative health is stable — recent avg ${recentAvg}/10`;
    if (direction === 'worsening') return `creative health is worsening — recent avg ${recentAvg}/10`;
    if (direction === 'volatile')  return `creative health is volatile — recent avg ${recentAvg}/10`;
    return `creative drift observed (${mem.totalObservations} samples)`;
  })();

  const reasonCodes: string[] = [
    `obs:${mem.totalObservations}`,
    `avg-health:${averageHealth}/10`,
    `avg-drift:${averageDrift}/10`,
    `avg-entropy:${averageEntropy}/10`,
    `avg-originality-pressure:${averageOriginalityPressure}/10`,
    `direction:${longTermDriftDirection}`,
    `entropy-acceleration:${entropyAcceleration}/10`,
    `originality-collapse-risk:${originalityCollapseRisk}/10`,
    `healthy-eras:${healthiestEras.length}`,
    `collapse-periods:${collapsePeriods.length}`,
    `collapse-events:${mem.collapseEvents.length}`,
    `recovery-events:${mem.recoveryEvents.length}`,
  ];

  return {
    present: true,
    statement,
    totalObservations: mem.totalObservations,
    averageHealth,
    averageDrift,
    averageEntropy,
    averageOriginalityPressure,
    longTermDriftDirection,
    entropyAcceleration,
    originalityCollapseRisk,
    healthTrajectory:                  trajectory('overallCreativeHealth'),
    driftTrajectory:                   trajectory('driftSeverity'),
    entropyTrajectory:                 trajectory('entropyLevel'),
    originalityPressureTrajectory:     trajectory('originalityPressure'),
    narrativeStabilityTrajectory:      trajectory('narrativeStability'),
    emotionalDiversityTrajectory:      trajectory('emotionalDiversity'),
    persuasionVarianceTrajectory:      trajectory('persuasionVariance'),
    formulaDistinctivenessTrajectory:  trajectory('formulaDistinctiveness'),
    healthiestEras,
    collapsePeriods,
    collapseEvents:    mem.collapseEvents,
    recoveryEvents:    mem.recoveryEvents,
    repetitionCycles:  mem.repetitionCycles,
    saturationCycles:  mem.saturationCycles,
    convergenceCycles: mem.convergenceCycles,
    originalityCycles: mem.originalityCycles,
    advisoryNotice: ADVISORY_NOTICE,
    reasonCodes,
  };
}
