/**
 * CREATIVE DRIFT MEMORY
 *
 * Persistent FIFO memory of creative-drift snapshots — one per
 * post-pipeline observation. Each snapshot captures the engine's
 * scalar readings + structural counts so the longitudinal view can
 * surface drift acceleration, collapse periods, and recovery periods
 * over time.
 *
 * STRICT CONTRACT:
 *   - append is the only mutating operation
 *   - FIFO-capped: same observation stream → same memory state
 *   - never reads or mutates other memory files
 *   - never blocks generation (the recorder wraps in try/catch)
 *
 * Lives at data/memory/creative-drift-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CreativeDrift } from './creativeDriftEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'creative-drift-memory.json';

export const DRIFT_OBSERVATION_LIMIT = 96;
export const DRIFT_TRACE_LIMIT = 96;
export const COLLAPSE_EVENT_LIMIT = 32;
export const RECOVERY_EVENT_LIMIT = 32;
export const REPETITION_CYCLE_LIMIT = 32;
export const SATURATION_CYCLE_LIMIT = 32;
export const CONVERGENCE_CYCLE_LIMIT = 32;
export const ORIGINALITY_CYCLE_LIMIT = 32;

const HEALTH_COLLAPSE_THRESHOLD = 4.0;     // health < this = collapse event
const HEALTH_RECOVERY_THRESHOLD = 7.0;     // health rebounds to this = recovery
const PRESSURE_CYCLE_THRESHOLD = 7.0;      // originality pressure cycle marker
const CONVERGENCE_THRESHOLD = 7.0;         // formula-convergence cycle marker
const REPETITION_CYCLE_THRESHOLD = 8.0;    // fatigueRisk threshold for cycle marker
const SATURATION_CYCLE_THRESHOLD = 6.0;    // saturation threshold for cycle marker

// ─── observation + traces ─────────────────────────────────────

export interface CreativeDriftObservation {
  at: number;
  bannerId: string | null;
  formula: string | null;
  campaignMode: string | null;
  overallCreativeHealth: number;
  driftSeverity: number;
  entropyLevel: number;
  originalityPressure: number;
  narrativeStability: number;
  emotionalDiversity: number;
  persuasionVariance: number;
  formulaDistinctiveness: number;
  trustErosionDrift: number;
  dominantPatternCount: number;
  emergingRiskCount: number;
  collapsingDimensionCount: number;
  repetitiveNarrativeCount: number;
  formulaConvergenceCount: number;
  modeDriftCount: number;
  instabilityZoneCount: number;
}

export interface DriftTracePoint {
  at: number;
  health: number;
  drift: number;
  entropy: number;
  originalityPressure: number;
}

export interface CollapseEvent {
  at: number;
  bannerId: string | null;
  health: number;
  driftSeverity: number;
  dominantPattern: string | null;
}

export interface RecoveryEvent {
  at: number;
  bannerId: string | null;
  health: number;
  /** Number of observations the system had spent below collapse threshold. */
  spentInCollapse: number;
}

export interface RepetitionCycleMarker {
  at: number;
  narrativeFingerprint: string;
  recurrence: number;
  fatigueRisk: number;
}

export interface SaturationCycleMarker {
  at: number;
  emotion: string;
  saturation: number;
}

export interface ConvergenceCycleMarker {
  at: number;
  formulas: string[];
  convergenceLevel: number;
}

export interface OriginalityCycleMarker {
  at: number;
  pressure: number;
  entropy: number;
}

// ─── state ─────────────────────────────────────────────────────

export interface CreativeDriftMemoryState {
  observations: CreativeDriftObservation[];
  driftTrace: DriftTracePoint[];
  collapseEvents: CollapseEvent[];
  recoveryEvents: RecoveryEvent[];
  repetitionCycles: RepetitionCycleMarker[];
  saturationCycles: SaturationCycleMarker[];
  convergenceCycles: ConvergenceCycleMarker[];
  originalityCycles: OriginalityCycleMarker[];
  /** When the most recent collapse began (null if not currently in collapse). */
  currentCollapseStartedAt: number | null;
  observationsSinceLastCollapseStart: number;
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialCreativeDriftMemory(): CreativeDriftMemoryState {
  return {
    observations: [],
    driftTrace: [],
    collapseEvents: [],
    recoveryEvents: [],
    repetitionCycles: [],
    saturationCycles: [],
    convergenceCycles: [],
    originalityCycles: [],
    currentCollapseStartedAt: null,
    observationsSinceLastCollapseStart: 0,
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── pure transform ───────────────────────────────────────────

export function applyCreativeDriftObservation(
  prev: CreativeDriftMemoryState,
  drift: CreativeDrift,
  ctx: { at: number; bannerId: string | null; formula: string | null; campaignMode: string | null },
): CreativeDriftMemoryState {
  const obs: CreativeDriftObservation = {
    at: ctx.at,
    bannerId: ctx.bannerId,
    formula: ctx.formula,
    campaignMode: ctx.campaignMode,
    overallCreativeHealth: drift.overallCreativeHealth,
    driftSeverity: drift.driftSeverity,
    entropyLevel: drift.entropyLevel,
    originalityPressure: drift.originalityPressure,
    narrativeStability: drift.narrativeStability,
    emotionalDiversity: drift.emotionalDiversity,
    persuasionVariance: drift.persuasionVariance,
    formulaDistinctiveness: drift.formulaDistinctiveness,
    trustErosionDrift: drift.trustErosionTrajectory.drift,
    dominantPatternCount: drift.dominantDriftPatterns.length,
    emergingRiskCount: drift.emergingCreativeRisks.length,
    collapsingDimensionCount: drift.collapsingCreativeDimensions.length,
    repetitiveNarrativeCount: drift.repetitiveNarratives.length,
    formulaConvergenceCount: drift.formulaConvergence.length,
    modeDriftCount: drift.modeDrift.length,
    instabilityZoneCount: drift.creativeInstabilityZones.length,
  };

  const tracePoint: DriftTracePoint = {
    at: ctx.at,
    health: drift.overallCreativeHealth,
    drift: drift.driftSeverity,
    entropy: drift.entropyLevel,
    originalityPressure: drift.originalityPressure,
  };

  const next: CreativeDriftMemoryState = {
    ...prev,
    observations: [...prev.observations, obs],
    driftTrace: [...prev.driftTrace, tracePoint],
    totalObservations: prev.totalObservations + 1,
    firstUpdatedAt: prev.firstUpdatedAt ?? ctx.at,
    updatedAt: ctx.at,
  };

  // ── collapse / recovery detection ──────────────────────────
  const inCollapse = next.currentCollapseStartedAt !== null;
  if (drift.overallCreativeHealth < HEALTH_COLLAPSE_THRESHOLD && !inCollapse) {
    next.currentCollapseStartedAt = ctx.at;
    next.observationsSinceLastCollapseStart = 1;
    next.collapseEvents = [
      ...prev.collapseEvents,
      {
        at: ctx.at,
        bannerId: ctx.bannerId,
        health: drift.overallCreativeHealth,
        driftSeverity: drift.driftSeverity,
        dominantPattern: drift.dominantDriftPatterns[0]?.pattern ?? null,
      },
    ];
  } else if (inCollapse) {
    next.observationsSinceLastCollapseStart =
      prev.observationsSinceLastCollapseStart + 1;
    if (drift.overallCreativeHealth >= HEALTH_RECOVERY_THRESHOLD) {
      // Recovery: health crossed back above the recovery threshold.
      next.recoveryEvents = [
        ...prev.recoveryEvents,
        {
          at: ctx.at,
          bannerId: ctx.bannerId,
          health: drift.overallCreativeHealth,
          spentInCollapse: next.observationsSinceLastCollapseStart,
        },
      ];
      next.currentCollapseStartedAt = null;
      next.observationsSinceLastCollapseStart = 0;
    }
  }

  // ── cycle markers ──────────────────────────────────────────
  if (drift.originalityPressure >= PRESSURE_CYCLE_THRESHOLD) {
    next.originalityCycles = [
      ...prev.originalityCycles,
      { at: ctx.at, pressure: drift.originalityPressure, entropy: drift.entropyLevel },
    ];
  }

  for (const conv of drift.formulaConvergence) {
    if (conv.convergenceLevel >= CONVERGENCE_THRESHOLD) {
      next.convergenceCycles = [
        ...next.convergenceCycles,
        { at: ctx.at, formulas: conv.formulas, convergenceLevel: conv.convergenceLevel },
      ];
    }
  }

  for (const rn of drift.repetitiveNarratives) {
    if (rn.fatigueRisk >= REPETITION_CYCLE_THRESHOLD) {
      next.repetitionCycles = [
        ...next.repetitionCycles,
        { at: ctx.at, narrativeFingerprint: rn.narrativeFingerprint, recurrence: rn.recurrence, fatigueRisk: rn.fatigueRisk },
      ];
    }
  }

  for (const ec of drift.emotionalCompression) {
    if (ec.saturation >= SATURATION_CYCLE_THRESHOLD) {
      next.saturationCycles = [
        ...next.saturationCycles,
        { at: ctx.at, emotion: ec.emotion, saturation: ec.saturation },
      ];
    }
  }

  // ── FIFO caps ──────────────────────────────────────────────
  next.observations       = next.observations.slice(-DRIFT_OBSERVATION_LIMIT);
  next.driftTrace         = next.driftTrace.slice(-DRIFT_TRACE_LIMIT);
  next.collapseEvents     = next.collapseEvents.slice(-COLLAPSE_EVENT_LIMIT);
  next.recoveryEvents     = next.recoveryEvents.slice(-RECOVERY_EVENT_LIMIT);
  next.repetitionCycles   = next.repetitionCycles.slice(-REPETITION_CYCLE_LIMIT);
  next.saturationCycles   = next.saturationCycles.slice(-SATURATION_CYCLE_LIMIT);
  next.convergenceCycles  = next.convergenceCycles.slice(-CONVERGENCE_CYCLE_LIMIT);
  next.originalityCycles  = next.originalityCycles.slice(-ORIGINALITY_CYCLE_LIMIT);

  return next;
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodCreativeDrift?: CreativeDriftMemoryState };

export interface CreativeDriftMemoryStore {
  read(): Promise<CreativeDriftMemoryState>;
  append(drift: CreativeDrift, ctx: { at: number; bannerId: string | null; formula: string | null; campaignMode: string | null }): Promise<CreativeDriftMemoryState>;
  save(state: CreativeDriftMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCreativeDriftMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CreativeDriftMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CreativeDriftMemoryStore = {
    async read() {
      if (g.__moodCreativeDrift) return g.__moodCreativeDrift;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CreativeDriftMemoryState>;
        g.__moodCreativeDrift = {
          ...createInitialCreativeDriftMemory(),
          ...parsed,
        };
      } catch {
        g.__moodCreativeDrift = createInitialCreativeDriftMemory();
      }
      return g.__moodCreativeDrift;
    },
    async append(drift, ctx) {
      const cur = await store.read();
      const next = applyCreativeDriftObservation(cur, drift, ctx);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations      = state.observations.slice(-DRIFT_OBSERVATION_LIMIT);
      state.driftTrace        = state.driftTrace.slice(-DRIFT_TRACE_LIMIT);
      state.collapseEvents    = state.collapseEvents.slice(-COLLAPSE_EVENT_LIMIT);
      state.recoveryEvents    = state.recoveryEvents.slice(-RECOVERY_EVENT_LIMIT);
      state.repetitionCycles  = state.repetitionCycles.slice(-REPETITION_CYCLE_LIMIT);
      state.saturationCycles  = state.saturationCycles.slice(-SATURATION_CYCLE_LIMIT);
      state.convergenceCycles = state.convergenceCycles.slice(-CONVERGENCE_CYCLE_LIMIT);
      state.originalityCycles = state.originalityCycles.slice(-ORIGINALITY_CYCLE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCreativeDrift = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCreativeDrift = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordCreativeDriftObservation(
  drift: CreativeDrift,
  ctx: { at: number; bannerId: string | null; formula: string | null; campaignMode: string | null },
): Promise<void> {
  try {
    await createCreativeDriftMemoryStore().append(drift, ctx);
  } catch {
    // non-fatal — never blocks generation
  }
}
