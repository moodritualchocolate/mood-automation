/**
 * HUMAN DESIRE MEMORY (Phases 20–25 shared)
 *
 * The permanent human-longing memory graph.
 *
 * Across the campaign's lifetime, this store accumulates:
 *   - repeated aspirations
 *   - recurring emotional hunger
 *   - identity desires
 *   - validation patterns
 *   - emotional compensation loops
 *   - attachment behaviors
 *   - symbolic safety objects
 *   - status longing
 *   - invisible envy
 *   - modern loneliness structures
 *   - ritual dependency patterns
 *   - emotional drift over time
 *
 * Persisted to data/memory/human-desire.json. Read by every Phase
 * 20–25 engine. Written when a banner ships.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'human-desire.json';

export type DesireCategory =
  | 'aspiration'
  | 'emotional-hunger'
  | 'identity-desire'
  | 'validation-pattern'
  | 'compensation-loop'
  | 'attachment-behavior'
  | 'symbolic-safety-object'
  | 'status-longing'
  | 'invisible-envy'
  | 'loneliness-structure'
  | 'ritual-dependency'
  | 'emotional-drift';

export interface DesireMemoryEntry {
  category: DesireCategory;
  key: string;
  display: string;
  count: number;
  firstSeen: number;
  lastSeen: number;
  averageIntensity: number;       // 0..10 across appearances
  sampleTruths: string[];          // last 3
}

interface DesireBook {
  entries: Record<string, DesireMemoryEntry>;
}

const g = globalThis as unknown as { __moodHumanDesire?: DesireBook };

export interface HumanDesireMemoryStore {
  read(): Promise<DesireBook>;
  record(args: {
    category: DesireCategory;
    key: string;
    display: string;
    intensity: number;
    sampleTruth?: string;
  }): Promise<DesireMemoryEntry>;
  list(category?: DesireCategory): Promise<DesireMemoryEntry[]>;
  reset(): Promise<void>;
}

export function createHumanDesireMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): HumanDesireMemoryStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<DesireBook> {
    if (g.__moodHumanDesire) return g.__moodHumanDesire;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      g.__moodHumanDesire = JSON.parse(txt) as DesireBook;
    } catch {
      g.__moodHumanDesire = { entries: {} };
    }
    return g.__moodHumanDesire;
  }
  async function save(book: DesireBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodHumanDesire = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }
  return {
    read: load,
    async record({ category, key, display, intensity, sampleTruth }) {
      const book = await load();
      const compositeKey = `${category}:${key}`;
      const existing = book.entries[compositeKey];
      const now = Date.now();
      if (existing) {
        existing.count += 1;
        existing.lastSeen = now;
        existing.averageIntensity =
          (existing.averageIntensity * (existing.count - 1) + intensity) / existing.count;
        if (sampleTruth) {
          existing.sampleTruths = [sampleTruth, ...existing.sampleTruths.filter((s) => s !== sampleTruth)].slice(0, 3);
        }
      } else {
        book.entries[compositeKey] = {
          category,
          key,
          display,
          count: 1,
          firstSeen: now,
          lastSeen: now,
          averageIntensity: intensity,
          sampleTruths: sampleTruth ? [sampleTruth] : [],
        };
      }
      await save(book);
      return book.entries[compositeKey];
    },
    async list(category) {
      const book = await load();
      const all = Object.values(book.entries);
      return category ? all.filter((e) => e.category === category) : all;
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* ok */ }
      g.__moodHumanDesire = { entries: {} };
    },
  };
}
