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

/** The complete persistent runtime state every manifestation surface
 *  reads from. Nothing in Wave 9 renders anything not derived here. */
export interface RuntimeSnapshot {
  organism: OrganismVitalState | null;
  os: OSRuntimeState | null;
  civilization: CivilizationState | null;
  worldState: ExecutiveWorldState | null;
  runtime: RuntimeBook | null;
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
