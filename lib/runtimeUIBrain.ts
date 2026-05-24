/**
 * RUNTIME UI BRAIN (Phase 111 — Wave 9: Manifestation Architecture)
 *
 * Wave 8 built a cognitive operating system. Wave 9 gives it a BODY —
 * a visible runtime. The UI is not separate from cognition: every
 * surface is built from the persistent runtime state, never fabricated.
 *
 * This module is the foundation of the wave. It defines the runtime
 * snapshot every manifestation surface reads from, and it decides the
 * one thing a viewer should feel first: is the organism alive, and
 * what is it doing right now?
 */

import type { OrganismVitalState } from './persistentOrganismCore';
import type { OSRuntimeState } from './operatingSystemCore';
import type { CivilizationState } from './civilizationArchive';
import type { ExecutiveWorldState } from './worldStateEngine';
import type { RuntimeBook } from './runtimeMemoryStore';
import type { RealityCouplingState } from './realityCouplingCore';
import type { StrategicFutureState } from './autonomousStrategicPlanningCore';
import type { ExecutionState } from './autonomousExecutionSynthesisCore';
import type { FeedbackState } from './civilizationFeedbackLoopCore';
import type { LiveCouplingState } from './civilizationCouplingKernel';
import type { SovereignIdentityState } from './existentialIntegrityEngine';
import type { GenerativePresenceState } from './civilizationCoherenceRuntime';
import type { ProtectionMemoryState } from './protectionMemoryArchive';
import type { ContradictionScarsState } from './contradictionScarsArchive';
import type { WeatherLogState } from './weatherLogArchive';
import type { PressureGatewayState } from './pressureIngestionGateway';

/** The complete persistent runtime state every manifestation surface
 *  reads from. Nothing in Wave 9 renders anything not derived here.
 *  Waves 10–16 contributed additional persistent stores; Wave 17 makes
 *  them all visible in one place. */
export interface RuntimeSnapshot {
  organism: OrganismVitalState | null;
  os: OSRuntimeState | null;
  civilization: CivilizationState | null;
  worldState: ExecutiveWorldState | null;
  runtime: RuntimeBook | null;
  // ─── Waves 10–16 — added to the manifestation in Wave 17. ────
  coupling?: RealityCouplingState | null;
  strategicFuture?: StrategicFutureState | null;
  execution?: ExecutionState | null;
  feedback?: FeedbackState | null;
  liveCoupling?: LiveCouplingState | null;
  sovereignIdentity?: SovereignIdentityState | null;
  generativePresence?: GenerativePresenceState | null;
  /** Wave 17 — runtime continuity: the record of what restraint protected. */
  protectionMemory?: ProtectionMemoryState | null;
  /** Wave 17.4 — the dark counterpart: scars from breaches that shipped. */
  contradictionScars?: ContradictionScarsState | null;
  /** Wave 17.6 — weather log: temporal continuity for the atmosphere. */
  weatherLog?: WeatherLogState | null;
  /** Wave 17.7 — external pressure gateway: weighted, digestive,
   *  never commanding. The architecture is ready to receive real-
   *  world weak signals; they enter here as pressure, not orders. */
  pressureGateway?: PressureGatewayState | null;
  /** Wave 26 — Phase 7 internal review architecture. The lineage
   *  archive (data/memory/cognitive-lineage.json) holds the full
   *  history of drafts, reviews, revisions, approvals. The dashboard
   *  reads from this for revision-trace and rolling-coherence views;
   *  os.currentDraft / currentReview / etc. hold only the most recent. */
  cognitiveLineage?: import('./cognitiveLineage').CognitiveLineageState | null;
  /** Wave 30 — temporal memory. Long-term operational observations
   *  (cadence, recovery, approval reliability, fragmentation cycles,
   *  defers) used to derive the temporal assessment. */
  temporalMemory?: import('./temporalMemory').TemporalMemoryState | null;
  /** Wave 31 — purpose memory. Persistent goals + activation /
   *  drift / alignment / fatigue history. Directional pressures
   *  the organism carries across time. */
  purposeMemory?: import('./purposeMemory').PurposeMemoryState | null;
  /** Wave 32 — contradiction memory. Seeded tension pairs +
   *  history of escalations, resolutions, and sacrifice events.
   *  Pure pressure topology — never invented narratives. */
  contradictionMemory?: import('./contradictionMemory').ContradictionMemoryState | null;
  /** Wave 33 — self-model memory. Ten EWMA-smoothed traits +
   *  identity history + instability windows + detected patterns.
   *  Longitudinal operational identity, never narrated. */
  selfModel?: import('./selfModelMemory').SelfModelMemoryState | null;
  /** Wave 34 — meta-cognitive reliability. Cognition stability,
   *  reasoning decay, prediction reliability, recovery efficiency
   *  trend + open/closed defer prediction traces. */
  metaCognitive?: import('./metaCognitive').MetaCognitiveState | null;
  /** Wave 35 — cognitive governance. Trust zone, budget, regulation
   *  gradients, instability forecast, decision history. Soft throttling
   *  layer that biases (never blocks) adaptive thresholds. */
  cognitiveGovernance?: import('./cognitiveGovernance').CognitiveGovernanceState | null;
  /** Wave 36 — consequence memory. Deterministic multi-horizon
   *  trajectory simulations (+5/+20/+50) + empirical verb cost map.
   *  Long-horizon survivability feeds back into governance gradients. */
  consequenceMemory?: import('./consequenceMemory').ConsequenceMemoryState | null;
  /** Wave 37 — internal ecology. Four numeric pressure species
   *  (explorer / conservator / optimizer / guardian) with intensity,
   *  fatigue, influenceWeight, tension matrix, dominance, and
   *  EcologyBias output that biases governance gradients ±0.25. */
  internalEcology?: import('./internalEcologyMemory').InternalEcologyState | null;
  capturedAt: number;
}

export type LivenessState = 'awakening' | 'alive' | 'breathing' | 'strained' | 'dormant' | 'critical';
export type Tone = 'good' | 'warn' | 'bad' | 'neutral' | 'cool';

/** A render-ready gauge — the UI draws a bar from this, nothing more. */
export interface Gauge {
  label: string;
  value: number;
  max: number;
  display: string;
  tone: Tone;
}

export interface RuntimeUIBrainViewModel {
  liveness: LivenessState;
  /** The one-line statement of what the organism is doing right now. */
  headline: string;
  is_booted: boolean;
  uptime_ticks: number;
  organism_age: number;
  civilization_generation: number;
  /** The surface a viewer's eye should be drawn to first. */
  foreground: string;
  notes: string[];
}

export function buildRuntimeUIBrain(snap: RuntimeSnapshot): RuntimeUIBrainViewModel {
  const { organism, os, civilization } = snap;
  const notes: string[] = [];

  const is_booted = !!os && os.uptime > 0;
  const uptime_ticks = os?.uptime ?? 0;
  const organism_age = organism?.age ?? 0;
  const civilization_generation = civilization?.generation ?? 0;

  let liveness: LivenessState;
  if (!os || !organism) liveness = 'dormant';
  else if (os.uptime === 0) liveness = 'awakening';
  else if (os.operationalPosture === 'hibernating') liveness = 'dormant';
  else if (os.fragmentationStreak >= 3 || organism.energyReserves <= 2) liveness = 'critical';
  else if (os.coordinationEMA < 5 || organism.stressAccumulation >= 7) liveness = 'strained';
  else if (os.operationalPosture === 'coordinated-operation' && os.coordinationEMA >= 7) liveness = 'alive';
  else liveness = 'breathing';

  // The surface to foreground — the most urgent truth on the runtime.
  let foreground = 'organism-state';
  if (liveness === 'critical') foreground = 'runtime-health';
  else if (os && os.fragmentationStreak >= 1) foreground = 'internal-conflict';
  else if (os && (os.operationalPosture === 'deep-pause' || os.operationalPosture === 'hibernating')) foreground = 'strategic-season';
  else if (organism && organism.consecutiveActions >= 6) foreground = 'cognitive-pulse';

  const headline = !is_booted
    ? 'the runtime has not yet drawn its first breath'
    : liveness === 'critical'
      ? 'the runtime is in distress — coordination is failing'
      : liveness === 'dormant'
        ? 'the runtime is dormant — the organism is hibernating'
        : liveness === 'strained'
          ? `the organism is strained — ${os!.operationalPosture}, holding under load`
          : `the organism is ${liveness} — ${os!.operationalPosture}, season "${os!.currentSeason}", ${uptime_ticks} ticks lived`;

  notes.push(`runtime UI brain: ${liveness} — ${headline}`);
  return {
    liveness, headline, is_booted, uptime_ticks, organism_age,
    civilization_generation, foreground, notes,
  };
}

export function clamp01(n: number): number { return Math.max(0, Math.min(1, n)); }
export function round1(n: number): number { return Math.round(n * 10) / 10; }
