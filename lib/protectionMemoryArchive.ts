/**
 * PROTECTION MEMORY ARCHIVE (Wave 17 — Embodied Runtime Presence)
 *
 * The first runtime continuity layer. The Silence Engine reads the
 * moment; this archive remembers the choices. Every time the organism
 * withholds action, the silence directive that held the line is
 * recorded — with timestamp, strength, reasons, and statement.
 *
 * Most autonomous systems log what they DID. This one logs what it
 * REFUSED to do, and why. Silence, when remembered, stops looking
 * like absence and starts looking like a track record.
 *
 * Persisted to data/runtime/protection-memory.json. Capped at 100
 * events (most recent kept) so the archive grows without bound is
 * not a future surprise.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { SilenceDirective, SilenceReason, SilenceEngineReading } from './silenceEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'protection-memory.json';
const MAX_EVENTS = 100;

export type ProtectionSource = 'exhausted-run' | 'pre-action-check' | 'cycle-tick' | 'manual';

export interface ProtectionEvent {
  /** When this protection was recorded (epoch ms). */
  at: number;
  /** The silence directive at the time. */
  directive: SilenceDirective;
  /** 0..10 — how strongly silence was the move. */
  strength: number;
  /** Every reason that contributed (in priority order). */
  reasons: SilenceReason[];
  /** The statement the engine produced. */
  statement: string;
  /** What part of the runtime invoked the record. */
  source: ProtectionSource;
}

export interface ProtectionMemoryState {
  bornAt: number;
  totalEvents: number;            // monotonic, includes evicted history
  events: ProtectionEvent[];      // capped to MAX_EVENTS, most recent last
  updatedAt: number;
}

export function createInitialProtectionMemory(): ProtectionMemoryState {
  return { bornAt: Date.now(), totalEvents: 0, events: [], updatedAt: Date.now() };
}

const g = globalThis as unknown as { __moodProtectionMemory?: ProtectionMemoryState };

export interface ProtectionMemoryStore {
  read(): Promise<ProtectionMemoryState>;
  save(state: ProtectionMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createProtectionMemoryStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): ProtectionMemoryStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodProtectionMemory) return g.__moodProtectionMemory;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodProtectionMemory = { ...createInitialProtectionMemory(), ...(JSON.parse(txt) as Partial<ProtectionMemoryState>) };
      } catch { g.__moodProtectionMemory = createInitialProtectionMemory(); }
      return g.__moodProtectionMemory;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodProtectionMemory = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodProtectionMemory = undefined;
    },
  };
}

/**
 * Record a protection event from a Silence Engine reading. The
 * recording only happens when silence was actually the move — a
 * `speak` reading is never logged here, because nothing was
 * protected.
 *
 * Returns the state unchanged when the reading does not represent
 * a protective act, so the caller can pass any reading through
 * without branching.
 */
export function recordProtectionEvent(
  state: ProtectionMemoryState,
  reading: SilenceEngineReading,
  source: ProtectionSource,
): ProtectionMemoryState {
  if (!reading.silence_is_the_move) return state;

  const event: ProtectionEvent = {
    at: Date.now(),
    directive: reading.directive,
    strength: reading.silence_strength,
    reasons: reading.contributing_reasons.filter((r) => r !== 'none'),
    statement: reading.statement,
    source,
  };

  const events = [...state.events, event].slice(-MAX_EVENTS);
  return {
    ...state,
    events,
    totalEvents: state.totalEvents + 1,
    updatedAt: Date.now(),
  };
}
