/**
 * EMOTIONAL OBJECT MEMORY (Phase 7)
 *
 * Objects accumulate meaning across the campaign.
 *
 * Example the spec named:
 *   coffee cup → emotional exhaustion motif
 *   window light → emotional escape motif
 *   phone glow → isolation motif
 *
 * As banners ship, this store records every object the image brief
 * mentioned + the emotional core it appeared inside. Over time the
 * store can answer:
 *
 *   "the coffee cup has appeared in 4 banners — 3 inside depletion,
 *    1 inside silent-burnout. it is now the campaign's exhaustion motif."
 *
 * The Creative Director and Perception Critic read this so motifs
 * are reused INTENTIONALLY across the campaign, never accidentally.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { EmotionalCoreId } from './humanTruthEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'object-emotion.json';

export interface ObjectMotif {
  objectId: string;            // e.g. "coffee-cup", "phone-glow", "window-light"
  appearances: number;
  emotionalCoreCounts: Record<string, number>;
  /** The dominant emotional core associated with this object. */
  dominantCore: EmotionalCoreId | null;
  /** Computed at write time — the named motif this object has become. */
  motifLabel: string | null;
  lastSeen: number;
}

interface ObjectEmotionBook {
  motifs: Record<string, ObjectMotif>;
}

const g = globalThis as unknown as { __moodObjectEmotion?: ObjectEmotionBook };

export interface ObjectEmotionStore {
  read(): Promise<ObjectEmotionBook>;
  record(objectId: string, core: EmotionalCoreId | null): Promise<ObjectMotif>;
  list(): Promise<ObjectMotif[]>;
  reset(): Promise<void>;
}

export function createObjectEmotionStore(dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR): ObjectEmotionStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<ObjectEmotionBook> {
    if (g.__moodObjectEmotion) return g.__moodObjectEmotion;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      g.__moodObjectEmotion = JSON.parse(txt) as ObjectEmotionBook;
    } catch {
      g.__moodObjectEmotion = { motifs: {} };
    }
    return g.__moodObjectEmotion;
  }
  async function save(book: ObjectEmotionBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodObjectEmotion = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }

  return {
    async read() { return load(); },
    async record(objectId, core) {
      const book = await load();
      const m = book.motifs[objectId] ?? {
        objectId, appearances: 0, emotionalCoreCounts: {}, dominantCore: null, motifLabel: null, lastSeen: Date.now(),
      };
      m.appearances += 1;
      m.lastSeen = Date.now();
      if (core) {
        m.emotionalCoreCounts[core] = (m.emotionalCoreCounts[core] ?? 0) + 1;
      }
      // Recompute dominant + label.
      const sorted = Object.entries(m.emotionalCoreCounts).sort((a, b) => b[1] - a[1]);
      m.dominantCore = (sorted[0]?.[0] as EmotionalCoreId) ?? null;
      m.motifLabel = motifLabelFor(objectId, m.dominantCore);
      book.motifs[objectId] = m;
      await save(book);
      return m;
    },
    async list() { return Object.values((await load()).motifs); },
    async reset() {
      g.__moodObjectEmotion = { motifs: {} };
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
    },
  };
}

function motifLabelFor(objectId: string, core: EmotionalCoreId | null): string | null {
  if (!core) return null;
  // Build a human-readable motif label.
  const objectWord = objectId.replace(/-/g, ' ');
  const motifByCore: Partial<Record<EmotionalCoreId, string>> = {
    depletion: 'exhaustion',
    'silent-burnout': 'exhaustion',
    'too-tired-to-rest': 'sleeplessness',
    doomscrolling: 'isolation',
    'digital-fatigue': 'isolation',
    'emotional-drift': 'escape',
    'loneliness-in-public': 'loneliness',
    'hidden-anxiety': 'private storm',
    'invisible-pressure': 'weight',
    'functional-collapse': 'autopilot',
    'emotional-numbness': 'flatness',
  };
  const motif = motifByCore[core] ?? core;
  return `${objectWord} → ${motif}`;
}

/**
 * Extract candidate objects from the image brief + truth so the store
 * can be updated automatically when a banner ships.
 */
export function extractObjectsFromBrief(scene: string, artifactDescriptions: string[]): string[] {
  const text = (scene + ' ' + artifactDescriptions.join(' ')).toLowerCase();
  const candidates: Array<{ key: string; pattern: RegExp }> = [
    { key: 'coffee-cup', pattern: /\b(coffee|espresso|mug|cup)\b/ },
    { key: 'phone-glow', pattern: /\b(phone glow|screen glow|phone (light|lit|in hand))\b/ },
    { key: 'phone', pattern: /\bphone\b/ },
    { key: 'window-light', pattern: /\bwindow\b/ },
    { key: 'laptop', pattern: /\blaptop\b/ },
    { key: 'monitor', pattern: /\bmonitor\b/ },
    { key: 'keys', pattern: /\bkeys\b/ },
    { key: 'fridge-light', pattern: /\bfridge\b/ },
    { key: 'desk', pattern: /\bdesk\b/ },
    { key: 'bed', pattern: /\bbed\b/ },
    { key: 'hoodie', pattern: /\bhoodie\b/ },
    { key: 'jacket', pattern: /\bjacket\b/ },
    { key: 'kitchen-counter', pattern: /\bkitchen (counter|island|sink)\b/ },
    { key: 'mirror', pattern: /\bmirror\b/ },
    { key: 'cabinet', pattern: /\bcabinet\b/ },
    { key: 'notebook', pattern: /\bnotebook\b/ },
  ];
  const seen = new Set<string>();
  for (const c of candidates) {
    if (c.pattern.test(text)) seen.add(c.key);
  }
  return Array.from(seen);
}
