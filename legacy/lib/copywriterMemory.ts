/**
 * COPYWRITER MEMORY (Strategy-Conditioned Copywriter — Phase Next)
 *
 * Persistent copy-history store. Tracks what hooks / bodies / CTAs /
 * emotional frames / tones have been produced, so the engine can score
 * repetition similarity against the recent past WITHOUT changing
 * deterministic template selection.
 *
 * Same strategy → same copy. Memory only affects scoring + diagnostics.
 *
 * Lives at data/memory/copywriter-memory.json. FIFO-capped.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { CopyTone } from './copyPatterns';
import type { CampaignRole, AudienceArchetype } from './adStrategyMemory';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'copywriter-memory.json';

export const HOOK_HISTORY_LIMIT = 32;
export const BODY_HISTORY_LIMIT = 32;
export const CTA_HISTORY_LIMIT = 32;
export const FRAME_HISTORY_LIMIT = 32;
export const TONE_HISTORY_LIMIT = 32;
export const FORBIDDEN_HISTORY_LIMIT = 32;
export const MIRROR_HISTORY_LIMIT = 24;
export const STRUCTURE_HISTORY_LIMIT = 32;

export interface HookRecord {
  at: number;
  bannerId: string;
  hook: string;
  tone: CopyTone;
  audience: AudienceArchetype;
  role: CampaignRole;
}

export interface BodyRecord {
  at: number;
  bannerId: string;
  body: string;
  tone: CopyTone;
}

export interface CTARecord {
  at: number;
  bannerId: string;
  cta: string;
  role: CampaignRole;
  restraintBand: 'low' | 'medium' | 'high';
}

export interface EmotionalFrameRecord {
  at: number;
  bannerId: string;
  frame: string;            // wound + desire fingerprint
  audience: AudienceArchetype;
}

export interface ForbiddenTriggerRecord {
  at: number;
  bannerId: string;
  /** Which forbidden phrase was hit. */
  phrase: string;
  /** Which channel hit it (hook | body | cta). */
  channel: 'hook' | 'body' | 'cta';
}

export interface SuccessfulMirrorRecord {
  at: number;
  bannerId: string;
  audience: AudienceArchetype;
  tone: CopyTone;
  frame: string;
  trustAlignment: number;
  dignityAlignment: number;
}

export interface StructureRecord {
  at: number;
  bannerId: string;
  /** Compact structural signature: tone+role+restraint+hookLen+bodyLen. */
  signature: string;
}

export interface CopywriterMemoryState {
  hookHistory: HookRecord[];
  bodyHistory: BodyRecord[];
  ctaHistory: CTARecord[];
  frameHistory: EmotionalFrameRecord[];
  toneHistory: CopyTone[];
  forbiddenTriggers: ForbiddenTriggerRecord[];
  successfulMirrors: SuccessfulMirrorRecord[];
  structureHistory: StructureRecord[];
  /** Running 0..10 — drifts down on forbidden hits / clickbait, up on
   *  restrained + high trust-alignment outputs. */
  dignityErosionScore: number;
  /** Running 0..10 — rises when the same structural signature recurs. */
  repeatedStructuresScore: number;
  totalCopiesProduced: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = () => Date.now();

export function createInitialCopywriterMemory(): CopywriterMemoryState {
  return {
    hookHistory: [],
    bodyHistory: [],
    ctaHistory: [],
    frameHistory: [],
    toneHistory: [],
    forbiddenTriggers: [],
    successfulMirrors: [],
    structureHistory: [],
    dignityErosionScore: 0,
    repeatedStructuresScore: 0,
    totalCopiesProduced: 0,
    firstUpdatedAt: null,
    updatedAt: nowMs(),
  };
}

const g = globalThis as unknown as { __moodCopywriter?: CopywriterMemoryState };

export interface CopywriterMemoryStore {
  read(): Promise<CopywriterMemoryState>;
  save(state: CopywriterMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createCopywriterMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CopywriterMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodCopywriter) return g.__moodCopywriter;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodCopywriter = {
          ...createInitialCopywriterMemory(),
          ...(JSON.parse(txt) as Partial<CopywriterMemoryState>),
        };
      } catch {
        g.__moodCopywriter = createInitialCopywriterMemory();
      }
      return g.__moodCopywriter;
    },
    async save(state) {
      state.hookHistory       = state.hookHistory.slice(-HOOK_HISTORY_LIMIT);
      state.bodyHistory       = state.bodyHistory.slice(-BODY_HISTORY_LIMIT);
      state.ctaHistory        = state.ctaHistory.slice(-CTA_HISTORY_LIMIT);
      state.frameHistory      = state.frameHistory.slice(-FRAME_HISTORY_LIMIT);
      state.toneHistory       = state.toneHistory.slice(-TONE_HISTORY_LIMIT);
      state.forbiddenTriggers = state.forbiddenTriggers.slice(-FORBIDDEN_HISTORY_LIMIT);
      state.successfulMirrors = state.successfulMirrors.slice(-MIRROR_HISTORY_LIMIT);
      state.structureHistory  = state.structureHistory.slice(-STRUCTURE_HISTORY_LIMIT);
      state.updatedAt = nowMs();
      g.__moodCopywriter = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodCopywriter = undefined;
    },
  };
}
