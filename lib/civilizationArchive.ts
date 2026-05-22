/**
 * CIVILIZATION ARCHIVE (Wave 6 — Cognitive Civilization Infrastructure)
 *
 * Wave 5 created disagreement. Wave 6 creates HISTORY. This is the
 * single persistent store of the cognitive civilization — its
 * institutional memory, its inherited beliefs, its founding myths,
 * its psychological scars, its decision archive, its laws, and the
 * running record of whether optimization or identity has been
 * winning.
 *
 * Persisted to data/runtime/civilization.json. Every run is one more
 * year in the civilization's life.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'civilization.json';
const ARCHIVE_LIMIT = 200;
const MEMORY_LIMIT = 120;

/** 56 — a summary of one council session, kept as institutional memory. */
export interface InstitutionalRecord {
  generation: number;
  ts: number;
  verdict: string;
  governingPriority: string;
  consensusQuality: number;
  debateTension: number;
  emergedFromTension: boolean;
}

/** 58 — a belief the civilization has come to hold. */
export interface CivBelief {
  id: string;
  statement: string;
  strength: number;          // 0..10 — grows as it is reinforced
  bornGeneration: number;
  timesReinforced: number;
}

/** 59 — a founding myth: a past decision that became defining. */
export interface CivMyth {
  id: string;
  story: string;
  foundingGeneration: number;
}

/** 63 — a psychological scar from a past wound. */
export interface CivScar {
  id: string;
  wound: string;
  generation: number;
  severity: number;          // 0..10
  healed: boolean;
}

/** 64 — an archived decision with its context. */
export interface ArchivedDecision {
  generation: number;
  ts: number;
  verdict: string;
  dominantTruth: string;
  reason: string;
  optimizationWon: boolean;
}

/** 65 — a law the civilization has enacted from a repeated pattern. */
export interface CognitiveLaw {
  id: string;
  law: string;
  enactedGeneration: number;
  basis: string;
}

export interface CivilizationState {
  foundedAt: number;
  generation: number;
  institutionalMemory: InstitutionalRecord[];
  beliefs: CivBelief[];
  myths: CivMyth[];
  scars: CivScar[];
  decisionArchive: ArchivedDecision[];
  laws: CognitiveLaw[];
  /** 57 — running tally of which priority has governed, by name. */
  culturalTendency: Record<string, number>;
  /** 60 — entity standing balances (the reputation economy). */
  reputationEconomy: Record<string, number>;
  /** decay tracking — optimization vs identity over the civilization's life. */
  optimizationWins: number;
  identityWins: number;
  updatedAt: number;
}

export function createInitialCivilization(): CivilizationState {
  return {
    foundedAt: Date.now(),
    generation: 0,
    institutionalMemory: [],
    beliefs: [],
    myths: [],
    scars: [],
    decisionArchive: [],
    laws: [],
    culturalTendency: {},
    reputationEconomy: {},
    optimizationWins: 0,
    identityWins: 0,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodCivilization?: CivilizationState };

export interface CivilizationArchiveStore {
  read(): Promise<CivilizationState>;
  save(state: CivilizationState): Promise<void>;
  reset(): Promise<void>;
}

export function createCivilizationArchiveStore(
  dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR,
): CivilizationArchiveStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodCivilization) return g.__moodCivilization;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<CivilizationState>;
        g.__moodCivilization = { ...createInitialCivilization(), ...parsed };
      } catch {
        g.__moodCivilization = createInitialCivilization();
      }
      return g.__moodCivilization;
    },
    async save(state) {
      // Bound the unbounded collections so the archive stays portable.
      state.institutionalMemory = state.institutionalMemory.slice(-MEMORY_LIMIT);
      state.decisionArchive = state.decisionArchive.slice(-ARCHIVE_LIMIT);
      state.updatedAt = Date.now();
      g.__moodCivilization = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCivilization = undefined;
    },
  };
}
