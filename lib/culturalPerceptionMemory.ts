/**
 * CULTURAL PERCEPTION MEMORY (Cultural Intelligence Layer — Foundation)
 *
 * Persistent FIFO-capped observation store. After each banner ships,
 * the route appends one CulturalObservation: a compact snapshot of
 * the visual / emotional / pacing / hook / CTA / aesthetic signature.
 *
 * Filename uses "culturalPerception" because lib/culturalMemory.ts is
 * already a different layer (a catalog of cultural micro-moments).
 * Storage lives at data/memory/cultural-perception-memory.json so it
 * never collides with existing stores either.
 *
 * STRICTLY:
 *   - read-only perception input (no runtime mutation of generation)
 *   - deterministic — append is the only mutating operation
 *   - no external APIs / model calls
 *   - failure to write is non-fatal (caller swallows)
 *
 * Same observation stream → same memory state → same perception.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CampaignMode, Formula } from '@/core/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'cultural-perception-memory.json';

export const CULTURAL_OBSERVATION_LIMIT = 96;
export const TRUST_TRAJECTORY_LIMIT = 64;
export const EMOTIONAL_DRIFT_LIMIT = 64;
export const NOVELTY_DECAY_LIMIT = 48;
export const RESISTANCE_MARKER_LIMIT = 48;

// ─── observation ───────────────────────────────────────────────

/** Compact, deterministic-shaped snapshot of one shipped banner.
 *  Strings + scalars only — no nested objects — so the JSON file
 *  stays cheap to load and the FIFO is trivial. */
export interface CulturalObservation {
  at: number;
  bannerId: string;
  formula: Formula;
  campaignMode: CampaignMode | null;
  // visual pattern signatures
  layoutFamily: string;
  productRole: string;
  typographyDominance: string;
  focalPoint: string;
  // emotional patterns
  emotionalFamily: string;
  stateLabel: string;
  emotionalFrame: string | null;     // wound→desire fingerprint
  persuasionTone: string | null;
  // pacing / rhythm
  pacing: string;                    // emotional pacing
  restraint: number;                 // 0..1 — 1=restrained, 0=aggressive
  // hook / cta categories
  hookFingerprint: string;
  ctaStyle: string;
  ctaBehavior: string;
  // copy-quality signals
  copyIntegrity: number | null;
  trustSafety: number | null;
  dignitySafety: number | null;
  repetitionConcern: number | null;
  ctaRestraint: number | null;
  hebrewNaturalness: number | null;
  // policy + verdict
  policyBand: string | null;
  outcomeVerdict: string;
}

// ─── trajectory + drift bookkeeping ────────────────────────────

export interface TrustTrajectoryPoint {
  at: number;
  /** 0..10 composite — trustSafety + dignitySafety averaged, with a
   *  small penalty when copyIntegrity is below 5. Never NaN. */
  score: number;
  copyIntegrity: number | null;
  trustSafety: number | null;
  dignitySafety: number | null;
}

export interface EmotionalDriftPoint {
  at: number;
  family: string;
  pacing: string;
  restraint: number;
}

export interface NoveltyDecayPoint {
  at: number;
  /** 0..10 — how novel this observation was at observe-time vs the
   *  prior frequency table. Lower = more familiar. */
  noveltyAtObservation: number;
  patternKey: string;
}

export interface ResistanceMarker {
  at: number;
  /** Coarse — 'aggressive-cta' | 'low-trust-shipped' | 'low-dignity-shipped'. */
  kind: string;
}

// ─── state ─────────────────────────────────────────────────────

export interface CulturalPerceptionMemoryState {
  observations: CulturalObservation[];
  // Running frequency tables — kept in sync on append. Same history
  // → same tables (deterministic).
  visualPatternFrequency: Record<string, number>;
  emotionalPatternFrequency: Record<string, number>;
  pacingFrequency: Record<string, number>;
  hookFrequency: Record<string, number>;
  ctaFrequency: Record<string, number>;
  toneFrequency: Record<string, number>;
  // Trend lifecycle bookkeeping per visual pattern key.
  firstSeenAt: Record<string, number>;
  lastSeenAt: Record<string, number>;
  // Short FIFO timeseries.
  trustTrajectory: TrustTrajectoryPoint[];
  noveltyDecayTrace: NoveltyDecayPoint[];
  emotionalDriftBuckets: EmotionalDriftPoint[];
  resistanceMarkers: ResistanceMarker[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialCulturalPerceptionMemory(): CulturalPerceptionMemoryState {
  return {
    observations: [],
    visualPatternFrequency: {},
    emotionalPatternFrequency: {},
    pacingFrequency: {},
    hookFrequency: {},
    ctaFrequency: {},
    toneFrequency: {},
    firstSeenAt: {},
    lastSeenAt: {},
    trustTrajectory: [],
    noveltyDecayTrace: [],
    emotionalDriftBuckets: [],
    resistanceMarkers: [],
    totalObservations: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

// ─── derived keys ──────────────────────────────────────────────

export function visualPatternKey(o: Pick<CulturalObservation, 'layoutFamily' | 'productRole' | 'typographyDominance' | 'focalPoint'>): string {
  return `${o.layoutFamily}|${o.productRole}|${o.typographyDominance}|${o.focalPoint}`;
}
export function emotionalPatternKey(o: Pick<CulturalObservation, 'emotionalFamily' | 'emotionalFrame'>): string {
  return `${o.emotionalFamily}|${o.emotionalFrame ?? '-'}`;
}
export function ctaKey(o: Pick<CulturalObservation, 'ctaStyle' | 'ctaBehavior'>): string {
  return `${o.ctaStyle}|${o.ctaBehavior}`;
}

// ─── pure hook fingerprint ────────────────────────────────────

export function buildHookFingerprint(hook: string): string {
  if (!hook) return 'empty';
  const normalized = hook.replace(/\s+/g, ' ').trim().toLowerCase();
  const words = normalized.split(' ').slice(0, 6);
  return words.join(' ');
}

// ─── deterministic trust composite ────────────────────────────

function trustComposite(o: Pick<CulturalObservation, 'trustSafety' | 'dignitySafety' | 'copyIntegrity'>): number {
  const have: number[] = [];
  if (typeof o.trustSafety === 'number') have.push(o.trustSafety);
  if (typeof o.dignitySafety === 'number') have.push(o.dignitySafety);
  if (have.length === 0) {
    return typeof o.copyIntegrity === 'number' ? o.copyIntegrity : 5;
  }
  const base = have.reduce((a, b) => a + b, 0) / have.length;
  const integrityPenalty =
    typeof o.copyIntegrity === 'number' && o.copyIntegrity < 5
      ? (5 - o.copyIntegrity) * 0.3 : 0;
  return Math.max(0, Math.min(10, base - integrityPenalty));
}

// ─── pure transformer ─────────────────────────────────────────

function bumpFreq(table: Record<string, number>, key: string): Record<string, number> {
  return { ...table, [key]: (table[key] ?? 0) + 1 };
}

/** Compute the next state given current state + one new observation.
 *  Pure — no I/O. Append is the only mutating operation. Resulting
 *  state is fully determined by the observation stream. */
export function applyObservation(
  state: CulturalPerceptionMemoryState, obs: CulturalObservation,
): CulturalPerceptionMemoryState {
  const visualKey = visualPatternKey(obs);
  const emotionalKey = emotionalPatternKey(obs);
  const cta = ctaKey(obs);

  // Novelty at observation time: prior frequency → familiarity → invert.
  const priorVisualFreq = state.visualPatternFrequency[visualKey] ?? 0;
  const noveltyAtObservation = Math.max(0, 10 - priorVisualFreq * 1.2);

  // Deterministic resistance markers.
  const newResistance: ResistanceMarker[] = [];
  if (
    (obs.ctaBehavior === 'corner' || obs.ctaStyle === 'pill' || obs.ctaStyle === 'enclosed') &&
    obs.restraint < 0.4
  ) {
    newResistance.push({ at: obs.at, kind: 'aggressive-cta' });
  }
  if (typeof obs.trustSafety === 'number' && obs.trustSafety < 4) {
    newResistance.push({ at: obs.at, kind: 'low-trust-shipped' });
  }
  if (typeof obs.dignitySafety === 'number' && obs.dignitySafety < 4) {
    newResistance.push({ at: obs.at, kind: 'low-dignity-shipped' });
  }

  return {
    observations: [...state.observations, obs].slice(-CULTURAL_OBSERVATION_LIMIT),
    visualPatternFrequency: bumpFreq(state.visualPatternFrequency, visualKey),
    emotionalPatternFrequency: bumpFreq(state.emotionalPatternFrequency, emotionalKey),
    pacingFrequency: bumpFreq(state.pacingFrequency, obs.pacing),
    hookFrequency: bumpFreq(state.hookFrequency, obs.hookFingerprint),
    ctaFrequency: bumpFreq(state.ctaFrequency, cta),
    toneFrequency: obs.persuasionTone
      ? bumpFreq(state.toneFrequency, obs.persuasionTone)
      : state.toneFrequency,
    firstSeenAt: state.firstSeenAt[visualKey] !== undefined
      ? state.firstSeenAt
      : { ...state.firstSeenAt, [visualKey]: obs.at },
    lastSeenAt: { ...state.lastSeenAt, [visualKey]: obs.at },
    trustTrajectory: [...state.trustTrajectory, {
      at: obs.at,
      score: trustComposite(obs),
      copyIntegrity: obs.copyIntegrity,
      trustSafety: obs.trustSafety,
      dignitySafety: obs.dignitySafety,
    }].slice(-TRUST_TRAJECTORY_LIMIT),
    noveltyDecayTrace: [...state.noveltyDecayTrace, {
      at: obs.at, noveltyAtObservation, patternKey: visualKey,
    }].slice(-NOVELTY_DECAY_LIMIT),
    emotionalDriftBuckets: [...state.emotionalDriftBuckets, {
      at: obs.at, family: obs.emotionalFamily, pacing: obs.pacing, restraint: obs.restraint,
    }].slice(-EMOTIONAL_DRIFT_LIMIT),
    resistanceMarkers: [...state.resistanceMarkers, ...newResistance].slice(-RESISTANCE_MARKER_LIMIT),
    totalObservations: state.totalObservations + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? obs.at,
    updatedAt: obs.at,
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodCulturalPerception?: CulturalPerceptionMemoryState };

export interface CulturalPerceptionMemoryStore {
  read(): Promise<CulturalPerceptionMemoryState>;
  append(obs: CulturalObservation): Promise<CulturalPerceptionMemoryState>;
  save(state: CulturalPerceptionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCulturalPerceptionMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CulturalPerceptionMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CulturalPerceptionMemoryStore = {
    async read() {
      if (g.__moodCulturalPerception) return g.__moodCulturalPerception;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodCulturalPerception = {
          ...createInitialCulturalPerceptionMemory(),
          ...(JSON.parse(txt) as Partial<CulturalPerceptionMemoryState>),
        };
      } catch {
        g.__moodCulturalPerception = createInitialCulturalPerceptionMemory();
      }
      return g.__moodCulturalPerception;
    },
    async append(obs) {
      const cur = await store.read();
      const next = applyObservation(cur, obs);
      await store.save(next);
      return next;
    },
    async save(state) {
      state.observations         = state.observations.slice(-CULTURAL_OBSERVATION_LIMIT);
      state.trustTrajectory      = state.trustTrajectory.slice(-TRUST_TRAJECTORY_LIMIT);
      state.noveltyDecayTrace    = state.noveltyDecayTrace.slice(-NOVELTY_DECAY_LIMIT);
      state.emotionalDriftBuckets= state.emotionalDriftBuckets.slice(-EMOTIONAL_DRIFT_LIMIT);
      state.resistanceMarkers    = state.resistanceMarkers.slice(-RESISTANCE_MARKER_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCulturalPerception = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCulturalPerception = undefined;
    },
  };
  return store;
}

// ─── non-blocking writer ──────────────────────────────────────

export async function recordCulturalObservation(
  obs: CulturalObservation,
): Promise<void> {
  try {
    await createCulturalPerceptionMemoryStore().append(obs);
  } catch {
    // non-fatal — perception writes never block generation
  }
}
