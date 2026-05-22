/**
 * WORLD STATE SIMULATION (Phase 26 — Unified Cognitive Field)
 *
 * Maintains a PERSISTENT EMOTIONAL REALITY over time. The world-state
 * is not static — it is the slow weather of modern life as the system
 * has observed it. Every generation, every rejection, and every
 * reality signal nudges it.
 *
 * This module is PURE: it defines the WorldState shape and the
 * evolution functions. Persistence is owned by worldStatePersistence.
 */

import type { HumanState } from '@/core/types';

export interface WorldState {
  version: number;
  updatedAt: number;
  generationCount: number;
  rejectionCount: number;
  /** All metrics 0..10. Higher = more of the named thing. */
  exhaustion_level: number;
  recovery_capacity: number;          // how able the modern human is to recover (erodes)
  ritual_intensity: number;            // how hard rituals are being leaned on
  identity_pressure: number;
  silence_availability: number;        // how much silence the day still contains (erodes)
  attention_fragmentation: number;
  cultural_pressure: number;
  desire_volatility: number;           // how unstable desire has become
  masking_normalization: number;       // how normal it has become to perform okay-ness
  behavioral_adaptation: number;       // how much the body has adapted around the deficit
  notes: string[];
}

const DEFICIT_FAMILIES = new Set(['fatigue', 'collapse', 'numbness', 'pressure', 'paralysis']);

export function createInitialWorldState(): WorldState {
  return {
    version: 1,
    updatedAt: Date.now(),
    generationCount: 0,
    rejectionCount: 0,
    // Modern baseline — the world does not start neutral.
    exhaustion_level: 5.5,
    recovery_capacity: 5,
    ritual_intensity: 4.5,
    identity_pressure: 5,
    silence_availability: 5,
    attention_fragmentation: 5.5,
    cultural_pressure: 5,
    desire_volatility: 4.5,
    masking_normalization: 5,
    behavioral_adaptation: 4.5,
    notes: ['world-state initialised at the modern baseline'],
  };
}

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }

/** A small drift toward a target — the world moves slowly. */
function drift(current: number, target: number, rate = 0.12): number {
  return clamp10(current + (target - current) * rate);
}

export interface WorldStateSignals {
  state: HumanState;
  attentionFragmentationScore?: number;   // 0..10
  recoveryFailing?: boolean;
  ritualIntensity?: number;               // 0..10
  identityPressure?: number;              // 0..10
  maskingActive?: boolean;
  desireVolatile?: boolean;
  culturalPressure?: number;              // 0..10
}

/**
 * Evolve the world-state from an APPROVED banner. Each banner is one
 * more observation of modern life — it nudges the weather.
 */
export function evolveWorldStateFromBanner(state: WorldState, signals: WorldStateSignals): WorldState {
  const next: WorldState = { ...state, notes: [] };
  next.generationCount += 1;
  next.updatedAt = Date.now();

  const inDeficit = DEFICIT_FAMILIES.has(signals.state.family);

  // Exhaustion accumulates when banners keep observing deficit states.
  next.exhaustion_level = drift(state.exhaustion_level, inDeficit ? 8 : 4);
  // Recovery capacity erodes when recovery is observed failing.
  next.recovery_capacity = drift(state.recovery_capacity, signals.recoveryFailing ? 2.5 : 6);
  // Ritual intensity rises with observed ritual leaning.
  next.ritual_intensity = drift(state.ritual_intensity, signals.ritualIntensity ?? state.ritual_intensity);
  // Identity pressure accumulates.
  next.identity_pressure = drift(state.identity_pressure, signals.identityPressure ?? (inDeficit ? 7 : 5));
  // Silence availability erodes structurally — modern life removes it.
  next.silence_availability = drift(state.silence_availability,
    (signals.attentionFragmentationScore ?? 5) >= 6 ? 2.5 : 5);
  // Attention fragmentation grows toward the observed score.
  next.attention_fragmentation = drift(state.attention_fragmentation,
    signals.attentionFragmentationScore ?? state.attention_fragmentation);
  // Cultural pressure mutates toward the observed value.
  next.cultural_pressure = drift(state.cultural_pressure, signals.culturalPressure ?? state.cultural_pressure);
  // Desire volatility rises when desire reads unstable.
  next.desire_volatility = drift(state.desire_volatility, signals.desireVolatile ? 7 : 4);
  // Masking normalisation rises whenever masking is observed and accepted.
  next.masking_normalization = drift(state.masking_normalization, signals.maskingActive ? 7.5 : 5);
  // Behavioral adaptation rises slowly — the body learns to run at deficit.
  next.behavioral_adaptation = drift(state.behavioral_adaptation, inDeficit ? 7 : 4.5);

  next.notes.push(
    `world-state evolved (gen ${next.generationCount}): exhaustion ${next.exhaustion_level.toFixed(1)}, ` +
    `silence ${next.silence_availability.toFixed(1)}, masking ${next.masking_normalization.toFixed(1)}`,
  );
  return next;
}

/** A rejection is also an observation — it slightly raises the system's
 *  sensitivity (cultural pressure to get it right). */
export function evolveWorldStateFromRejection(state: WorldState): WorldState {
  const next: WorldState = { ...state, notes: [] };
  next.rejectionCount += 1;
  next.updatedAt = Date.now();
  next.cultural_pressure = drift(state.cultural_pressure, 6, 0.05);
  next.notes.push(`world-state noted a rejection (total ${next.rejectionCount})`);
  return next;
}

/** Reality ingestion signals also move the weather. */
export function evolveWorldStateFromSignals(state: WorldState, signalCount: number): WorldState {
  if (signalCount < 8) return state;
  const next: WorldState = { ...state, notes: [] };
  next.updatedAt = Date.now();
  // A rich reality feed gently raises cultural pressure and fragmentation.
  next.cultural_pressure = drift(state.cultural_pressure, 6.5, 0.06);
  next.attention_fragmentation = drift(state.attention_fragmentation, 6.5, 0.04);
  next.notes.push(`world-state absorbed ${signalCount} reality signals`);
  return next;
}

/** A one-line read of the world the system is currently modelling. */
export function describeWorldState(state: WorldState): string {
  const parts: string[] = [];
  if (state.exhaustion_level >= 7) parts.push('chronically exhausted');
  if (state.silence_availability <= 3) parts.push('with almost no silence left');
  if (state.masking_normalization >= 7) parts.push('where performing okay-ness is the default');
  if (state.attention_fragmentation >= 7) parts.push('and attention is structurally fragmented');
  if (parts.length === 0) parts.push('still near the modern baseline');
  return `a world ${parts.join(', ')}`;
}
