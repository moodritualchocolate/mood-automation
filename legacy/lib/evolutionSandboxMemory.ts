/**
 * EVOLUTION SANDBOX MEMORY
 *
 * Persistent FIFO of SANDBOX SIMULATION snapshots. Each entry is a
 * record of a sandbox run — what candidates were generated, what
 * survivability signals were observed, what convergence pressure
 * was detected. No mutation execution history is ever stored
 * (because no mutation is ever executed).
 *
 * STRICT CONTRACT:
 *   - append-only, FIFO-capped
 *   - the memory tracks SIMULATIONS only
 *   - never records "applied" / "selected" / "winner"
 *   - never blocks generation
 *
 * Lives at data/memory/evolution-sandbox-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'evolution-sandbox-memory.json';

export const SANDBOX_SIMULATION_LIMIT = 64;

// ─── snapshot ─────────────────────────────────────────────────

export interface SandboxSimulationSnapshot {
  at: number;
  candidateCount: number;
  /** Aggregate signature scalars from the run. */
  creativeEntropy: number;
  convergenceRisk: number;
  realismRetention: number;
  symbolicContinuity: number;
  trustStability: number;
  replayabilityEstimate: number;
  averageFatigueProjection: number;
  /** Anchor preservation composite from realityAnchorEngine. */
  anchorPreservation: number;
  /** Survivability composite from creativeSurvivabilityModel. */
  overallSurvivability: number;
  /** Sorted list of mutation types in the run (deterministic). */
  mutationTypes: string[];
  /** Any candidates that drifted from ≥2 reality anchors. */
  driftingCandidates: string[];
  /** Highest-risk candidates by survivability burnout / overexposure / collapse. */
  highRiskCandidates: string[];
  /** Optional operator note (free text). */
  operatorNote?: string;
}

export interface EvolutionSandboxMemoryState {
  simulations: SandboxSimulationSnapshot[];
  totalSimulations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialEvolutionSandboxMemory(): EvolutionSandboxMemoryState {
  return { simulations: [], totalSimulations: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── store ────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodEvolutionSandbox?: EvolutionSandboxMemoryState };

export interface EvolutionSandboxMemoryStore {
  read(): Promise<EvolutionSandboxMemoryState>;
  append(snapshot: SandboxSimulationSnapshot): Promise<EvolutionSandboxMemoryState>;
  save(state: EvolutionSandboxMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createEvolutionSandboxMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): EvolutionSandboxMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: EvolutionSandboxMemoryStore = {
    async read() {
      if (g.__moodEvolutionSandbox) return g.__moodEvolutionSandbox;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<EvolutionSandboxMemoryState>;
        g.__moodEvolutionSandbox = { ...createInitialEvolutionSandboxMemory(), ...parsed };
      } catch {
        g.__moodEvolutionSandbox = createInitialEvolutionSandboxMemory();
      }
      return g.__moodEvolutionSandbox;
    },
    async append(snapshot) {
      const cur = await store.read();
      const next: EvolutionSandboxMemoryState = {
        ...cur,
        simulations: [...cur.simulations, snapshot].slice(-SANDBOX_SIMULATION_LIMIT),
        totalSimulations: cur.totalSimulations + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? snapshot.at,
        updatedAt: nowMs(),
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.simulations = state.simulations.slice(-SANDBOX_SIMULATION_LIMIT);
      state.updatedAt = nowMs();
      g.__moodEvolutionSandbox = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodEvolutionSandbox = undefined;
    },
  };
  return store;
}

export async function recordSandboxSimulation(
  snapshot: SandboxSimulationSnapshot,
): Promise<void> {
  try {
    await createEvolutionSandboxMemoryStore().append(snapshot);
  } catch {
    // non-fatal — sandbox recording never blocks anything
  }
}
