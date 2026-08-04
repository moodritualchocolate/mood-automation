/**
 * COPY-QUALITY MEMORY (Longitudinal Quality Dashboard — Phase Next)
 *
 * Minimal persistent store for the copy-quality samples emitted per
 * generation. Lets the longitudinal dashboard show drift in
 * copyIntegrity / trustSafety / dignitySafety / etc. across time
 * without scanning every banner.
 *
 * Pure additive — does NOT modify strategy or copywriter memory.
 *
 * Lives at data/memory/copy-quality-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CopyQualityAxis } from './copyQualityAdapter';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'copy-quality-memory.json';

export const QUALITY_SAMPLE_LIMIT = 48;

export interface CopyQualitySample {
  at: number;
  bannerId: string;
  copyIntegrity: number;
  trustSafety: number;
  dignitySafety: number;
  repetitionConcern: number;
  proofAdequacy: number;
  ctaRestraint: number;
  hebrewNaturalness: number;
  strategicCopyFit: number;
  warningCount: number;
}

export interface CopyQualityMemoryState {
  samples: CopyQualitySample[];
  totalSamples: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialCopyQualityMemory(): CopyQualityMemoryState {
  return {
    samples: [],
    totalSamples: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

export function axisToSample(axis: CopyQualityAxis, bannerId: string, at: number): CopyQualitySample {
  return {
    at, bannerId,
    copyIntegrity:     axis.copyIntegrity,
    trustSafety:       axis.trustSafety,
    dignitySafety:     axis.dignitySafety,
    repetitionConcern: axis.repetitionConcern,
    proofAdequacy:     axis.proofAdequacy,
    ctaRestraint:      axis.ctaRestraint,
    hebrewNaturalness: axis.hebrewNaturalness,
    strategicCopyFit:  axis.strategicCopyFit,
    warningCount:      axis.warnings.length,
  };
}

const g = globalThis as unknown as { __moodCopyQualityHistory?: CopyQualityMemoryState };

export interface CopyQualityMemoryStore {
  read(): Promise<CopyQualityMemoryState>;
  append(sample: CopyQualitySample): Promise<CopyQualityMemoryState>;
  save(state: CopyQualityMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCopyQualityMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CopyQualityMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: CopyQualityMemoryStore = {
    async read() {
      if (g.__moodCopyQualityHistory) return g.__moodCopyQualityHistory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodCopyQualityHistory = {
          ...createInitialCopyQualityMemory(),
          ...(JSON.parse(txt) as Partial<CopyQualityMemoryState>),
        };
      } catch {
        g.__moodCopyQualityHistory = createInitialCopyQualityMemory();
      }
      return g.__moodCopyQualityHistory;
    },
    async append(sample) {
      const cur = await store.read();
      const next: CopyQualityMemoryState = {
        samples: [...cur.samples, sample].slice(-QUALITY_SAMPLE_LIMIT),
        totalSamples: cur.totalSamples + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? sample.at,
        updatedAt: sample.at,
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.samples = state.samples.slice(-QUALITY_SAMPLE_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCopyQualityHistory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCopyQualityHistory = undefined;
    },
  };
  return store;
}
