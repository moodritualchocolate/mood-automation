/**
 * MVP VERTICAL WAITLIST (roadmap #6 · FIFO · operator-supervised)
 *
 * When a brand doesn't match any supported vertical, the platform
 * refuses politely instead of shipping generic output — and records
 * the demand so new verticals are built where customers actually are.
 *
 * Lives at data/memory/mvp-waitlist-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'mvp-waitlist-memory.json';

export const MVP_WAITLIST_LIMIT = 512;

export interface WaitlistRecord {
  waitlistId: string;
  organizationId: string;
  workspaceId: string;
  operatorId: string;
  email: string;
  /** The operator's own description of what they sell. */
  businessDescription: string;
  createdAt: number;
}

export interface MvpWaitlistMemoryState {
  records: WaitlistRecord[];
  totalRecords: number;
  updatedAt: number;
}

let __seq = 0;
export function newWaitlistId(): string {
  __seq += 1;
  return `mvp-wl-${Date.now().toString(36)}-${__seq.toString(36)}`;
}

const g = globalThis as unknown as { __moodMvpWaitlist?: MvpWaitlistMemoryState };

export interface MvpWaitlistMemoryStore {
  read(): Promise<MvpWaitlistMemoryState>;
  append(record: WaitlistRecord): Promise<MvpWaitlistMemoryState>;
  reset(): Promise<void>;
}

export function createMvpWaitlistMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): MvpWaitlistMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: MvpWaitlistMemoryStore = {
    async read() {
      if (g.__moodMvpWaitlist) return g.__moodMvpWaitlist;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodMvpWaitlist = {
          records: [], totalRecords: 0, updatedAt: Date.now(),
          ...(JSON.parse(txt) as Partial<MvpWaitlistMemoryState>),
        };
      } catch {
        g.__moodMvpWaitlist = { records: [], totalRecords: 0, updatedAt: Date.now() };
      }
      return g.__moodMvpWaitlist;
    },
    async append(record) {
      const cur = await store.read();
      const next: MvpWaitlistMemoryState = {
        records: [...cur.records, record].slice(-MVP_WAITLIST_LIMIT),
        totalRecords: cur.totalRecords + 1,
        updatedAt: record.createdAt,
      };
      g.__moodMvpWaitlist = next;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(next, null, 2));
      return next;
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodMvpWaitlist = undefined;
    },
  };
  return store;
}
