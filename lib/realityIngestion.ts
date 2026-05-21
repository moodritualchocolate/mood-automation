/**
 * REALITY INGESTION (Phase 16)
 *
 * Unified ingestion layer for external observations of real human
 * behaviour. NOT social listening. NOT trend scraping. The spec
 * named this layer: BEHAVIORAL ANTHROPOLOGY INGESTION.
 *
 * Input sources the schema supports:
 *   - tiktok, reddit, youtube, twitter, ig-save, ig-share,
 *     anonymous-confessions, manual, plus arbitrary string sources
 *
 * Persisted to data/memory/ingested-signals.json so external
 * observations accumulate across runs. On first load the store is
 * seeded from data/seed-ingested-signals.ts (the starter catalog).
 *
 * The rest of Phase 16 (humanSignalExtraction, collectiveDriftTracker,
 * privateLanguageMap, realityWeighting) consume from THIS store.
 *
 * IMPORTANT: the spec's anti-trend warning is encoded structurally —
 * signals are weighted by EMOTIONAL_WEIGHT (recognition depth) not
 * by source virality or volume. The store filters out signals that
 * carry only meme/aesthetic markers.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'ingested-signals.json';

export type IngestionSource =
  | 'tiktok'
  | 'reddit'
  | 'youtube'
  | 'twitter'
  | 'ig-save'
  | 'ig-share'
  | 'anonymous-confessions'
  | 'manual'
  | string;

export interface IngestedSignal {
  id: string;
  source: IngestionSource;
  text: string;
  observed_at: number;
  /** 0..10 — how deeply the signal indicates recognition. A "this is
   *  literally me" comment scores 10; a like scores 1; a meme reply
   *  scores 0 and is filtered. */
  emotional_weight: number;
  /** Loose topical tags — useful for the extractor + the
   *  collective-drift tracker. */
  topical_tags: string[];
}

interface SignalBook {
  signals: Record<string, IngestedSignal>;
  /** True once the seed catalog has been merged into the store. */
  seeded: boolean;
}

const g = globalThis as unknown as { __moodIngestion?: SignalBook };

// Patterns the engine REFUSES to ingest — meme cycles, viral formats,
// performative vulnerability, aesthetic sadness. The spec's anti-
// trend filter made structural.
const TRENDY_FILTERS: RegExp[] = [
  /\b(no but seriously|wait this slaps|periodt|chefs kiss|main character energy)\b/i,
  /\b(it\'?s giving|the way that i|i\'?m living for|i can\'?t even)\b/i,
  /\b(soft girl era|soft boy era|sad girl autumn|hot girl|cottagecore)\b/i,
  /\b(bestie|girlie|gworl|fr fr|on god|no cap)\b/i,
  /\b(this hits different in a fun way|literally crying.{0,3}😂|i\'?m dead 💀💀)\b/i,
];

const RECOGNITION_PATTERNS: RegExp[] = [
  /\b(literally me|this is literally|so accurate|painfully accurate|how did you know|how did they know)\b/i,
  /\b(i didn'?t realize i do this|i thought i was the only one|nice to know.*not alone|saving this)\b/i,
  /\b(why is this so true|hits too close|hit too close)\b/i,
  /\b(זה אני|זה ממש אני|כל כך אמיתי|איך ידעתם)\b/i,
];

export interface RealityIngestionStore {
  read(): Promise<IngestedSignal[]>;
  add(signal: Omit<IngestedSignal, 'id'> & { id?: string }): Promise<IngestedSignal | null>;
  reset(): Promise<void>;
  /** Returns true when the candidate's truth resonates with at least
   *  one stored signal — used by the meta-critic. */
  hasResonatingSignal(candidateText: string, minStrength?: number): Promise<{
    resonates: boolean;
    matchedSignals: IngestedSignal[];
    overlap_score: number;
  }>;
}

export function createRealityIngestionStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
  seed: IngestedSignal[] = [],
): RealityIngestionStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<SignalBook> {
    if (g.__moodIngestion) return g.__moodIngestion;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      g.__moodIngestion = JSON.parse(txt) as SignalBook;
    } catch {
      g.__moodIngestion = { signals: {}, seeded: false };
    }
    // Seed on first load if not yet seeded.
    if (!g.__moodIngestion.seeded && seed.length > 0) {
      for (const s of seed) {
        if (!g.__moodIngestion.signals[s.id]) {
          g.__moodIngestion.signals[s.id] = s;
        }
      }
      g.__moodIngestion.seeded = true;
      await save(g.__moodIngestion);
    }
    return g.__moodIngestion;
  }
  async function save(book: SignalBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodIngestion = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }

  return {
    async read() {
      const book = await load();
      return Object.values(book.signals).sort((a, b) => b.observed_at - a.observed_at);
    },
    async add(signal) {
      // Anti-trend filter — reject signals that look like meme cycles.
      if (TRENDY_FILTERS.some((p) => p.test(signal.text))) return null;
      const book = await load();
      const id = signal.id ?? `ext-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const stored: IngestedSignal = {
        id,
        source: signal.source,
        text: signal.text,
        observed_at: signal.observed_at,
        emotional_weight: clampWeight(signal.emotional_weight, signal.text),
        topical_tags: signal.topical_tags ?? [],
      };
      book.signals[id] = stored;
      await save(book);
      return stored;
    },
    async reset() {
      g.__moodIngestion = { signals: {}, seeded: false };
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
    },
    async hasResonatingSignal(candidateText, minStrength = 7) {
      const signals = (await this.read()).filter((s) => s.emotional_weight >= minStrength);
      const matchedSignals: IngestedSignal[] = [];
      const candidateTokens = tokenize(candidateText);
      let overlap_score = 0;
      for (const s of signals) {
        const sTokens = tokenize(s.text);
        const overlap = jaccard(candidateTokens, sTokens);
        const tagBoost = s.topical_tags.some((tag) => candidateText.toLowerCase().includes(tag.replace(/-/g, ' '))) ? 0.15 : 0;
        const score = overlap + tagBoost;
        if (score >= 0.25) {
          matchedSignals.push(s);
          overlap_score += score;
        }
      }
      return {
        resonates: matchedSignals.length >= 1,
        matchedSignals: matchedSignals.slice(0, 5),
        overlap_score: Math.min(10, overlap_score * 4),
      };
    },
  };
}

function clampWeight(weight: number, text: string): number {
  // RECOGNITION patterns get bumped up — these are the spec's
  // signature signals.
  if (RECOGNITION_PATTERNS.some((p) => p.test(text))) return Math.max(weight, 9);
  return Math.max(0, Math.min(10, weight));
}

function tokenize(text: string): Set<string> {
  const STOPWORDS = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'for', 'with', 'this', 'that', 'is', 'am', 'are', 'was', 'i', 'you', 'me', 'my', 'your', 'his', 'her', 'we', 'they', 'them', 'it', 'be', 'to', 'of', 'in', 'on', 'at', 'so', 'too', 'as', 'do', 'does', 'did', 'have', 'has', 'had', 'just', 'still']);
  return new Set(
    text.toLowerCase()
      .replace(/[^\p{L}\p{N}\s]/gu, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 3 && !STOPWORDS.has(w)),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const t of a) if (b.has(t)) inter += 1;
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}
