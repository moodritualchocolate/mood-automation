/**
 * SELF-MODEL MEMORY (Wave 33 — Self-Modeling Layer)
 *
 * Persistent longitudinal operational identity. The organism does
 * not narrate itself — it accumulates evidence. Each trait is a
 * deterministic measurement of behavioral tendency over time;
 * each pattern is a rule-based detection over real history.
 *
 * Lives at data/memory/self-model.json. Ten seeded trait definitions
 * cover the user's spec. Each carries:
 *   - intensity (0..10, EWMA-smoothed signal)
 *   - state (inactive / forming / active / fading)
 *   - observationCount + entered timestamps for hysteresis
 *
 * History arrays capped at HISTORY_LIMIT (32) with FIFO. Instability
 * windows capped at 16 (less frequent, longer-lived).
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'self-model.json';
export const HISTORY_LIMIT = 32;
export const INSTABILITY_WINDOWS_LIMIT = 16;
export const TRAIT_HISTORY_DELTA = 0.3;
/** EWMA alpha — fraction of the new signal that contributes to
 *  the smoothed intensity. 0.05 means slow convergence (~50 events
 *  to climb from 0 to ~5 on sustained signal). */
export const TRAIT_EWMA_ALPHA = 0.05;

export type TraitState = 'inactive' | 'forming' | 'active' | 'fading';

/** The ten canonical trait identifiers the user specified. Trait
 *  identity is in this fixed type — new traits require deliberate
 *  type-level addition. */
export type TraitId =
  | 'cadence-disciplined'
  | 'recovery-dependent'
  | 'fragmentation-prone'
  | 'contradiction-sensitive'
  | 'coherence-stable'
  | 'abandonment-reactive'
  | 'exploration-heavy'
  | 'defer-resistant'
  | 'pressure-resilient'
  | 'drift-sensitive';

export interface Trait {
  id: TraitId;
  label: string;
  intensity: number;       // 0..10, EWMA-smoothed signal
  state: TraitState;
  enteredAt?: number;
  enteredTick?: number;
  observationCount: number;
}

export interface IdentitySnapshot {
  at: number;
  tick: number;
  identityCoherence: number;
  behaviorConsistency: number;
  selfStability: number;
  activeTraitIds: TraitId[];
}

export interface TraitTransitionRecord {
  at: number;
  tick: number;
  traitId: TraitId;
  from: TraitState;
  to: TraitState;
  reason: string;
}

export interface DetectedPattern {
  patternId: string;
  label: string;
  detectedAt: number;
  detectedTick: number;
  /** Plain-numeric description: which thresholds matched and what
   *  values, so the dashboard never invents prose. */
  evidence: string;
}

export interface InstabilityWindow {
  windowId: string;
  startAt: number;
  startTick: number;
  /** undefined while the window is open. */
  endAt?: number;
  endTick?: number;
  dominantPressures: string[];
  resolutionMechanism?: string;
  peakInstability: number;
}

export interface ConsistencyObservation {
  at: number;
  tick: number;
  value: number;
  delta: number;
}

export interface SelfModelMemoryState {
  traits: Trait[];
  identityHistory: IdentitySnapshot[];
  traitEvolution: TraitTransitionRecord[];
  persistentPatterns: DetectedPattern[];
  instabilityWindows: InstabilityWindow[];
  /** Top traits by intensity, refreshed each update. */
  dominantBehaviorModes: TraitId[];
  selfConsistencyHistory: ConsistencyObservation[];
  /** 0..10, rolling indicator of how stable / well-formed identity
   *  has been across recent observations. */
  longitudinalIdentityScore: number;
  totalUpdates: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

const TRAIT_LABELS: Record<TraitId, string> = {
  'cadence-disciplined':     'cadence-disciplined',
  'recovery-dependent':      'recovery-dependent',
  'fragmentation-prone':     'fragmentation-prone',
  'contradiction-sensitive': 'contradiction-sensitive',
  'coherence-stable':        'coherence-stable',
  'abandonment-reactive':    'abandonment-reactive',
  'exploration-heavy':       'exploration-heavy',
  'defer-resistant':         'defer-resistant',
  'pressure-resilient':      'pressure-resilient',
  'drift-sensitive':         'drift-sensitive',
};

function seedTraits(): Trait[] {
  return (Object.keys(TRAIT_LABELS) as TraitId[]).map((id) => ({
    id,
    label: TRAIT_LABELS[id],
    intensity: 0,
    state: 'inactive',
    observationCount: 0,
  }));
}

export function createInitialSelfModel(): SelfModelMemoryState {
  return {
    traits: seedTraits(),
    identityHistory: [],
    traitEvolution: [],
    persistentPatterns: [],
    instabilityWindows: [],
    dominantBehaviorModes: [],
    selfConsistencyHistory: [],
    longitudinalIdentityScore: 5,
    totalUpdates: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodSelfModel?: SelfModelMemoryState };

export interface SelfModelMemoryStore {
  read(): Promise<SelfModelMemoryState>;
  save(state: SelfModelMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createSelfModelMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): SelfModelMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodSelfModel) return g.__moodSelfModel;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<SelfModelMemoryState>;
        g.__moodSelfModel = {
          ...createInitialSelfModel(),
          ...parsed,
          traits: parsed.traits && parsed.traits.length > 0
            ? parsed.traits
            : seedTraits(),
        };
      } catch {
        g.__moodSelfModel = createInitialSelfModel();
      }
      return g.__moodSelfModel;
    },
    async save(state) {
      state.identityHistory       = state.identityHistory.slice(-HISTORY_LIMIT);
      state.traitEvolution        = state.traitEvolution.slice(-HISTORY_LIMIT);
      state.persistentPatterns    = state.persistentPatterns.slice(-HISTORY_LIMIT);
      state.instabilityWindows    = state.instabilityWindows.slice(-INSTABILITY_WINDOWS_LIMIT);
      state.selfConsistencyHistory = state.selfConsistencyHistory.slice(-HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodSelfModel = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodSelfModel = undefined;
    },
  };
}
