/**
 * TRUTH PERSISTENCE (Phase 15)
 *
 * Tracks which emotional truths keep resurfacing across the
 * campaign's history. NOT engagement. NOT virality. Truth
 * RECURRENCE — when the same psychological observation has been
 * worth saying multiple times, that observation is becoming a
 * persistent emotional law.
 *
 * Persisted to data/memory/truth-persistence.json. Keyed by a
 * normalised tension phrase (or, if absent, the emotional core id).
 * Each entry tracks total appearances, time bounds, sample truths,
 * average aftertaste, and a computed durability score.
 *
 * Used by:
 *   - the meta-critic, to weight banners that touch a persistent
 *     truth more favourably and to flag banners that ONLY exist
 *     because they were generated, not because they remain true.
 *   - the cinematic brain, to inform the campaign emotional
 *     thesis with what the campaign has been quietly proving.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Banner } from '@/core/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'truth-persistence.json';

export interface TruthPersistenceEntry {
  key: string;                       // tension phrase (lower-cased) or core id
  display: string;                   // human-readable phrase
  count: number;
  firstSeen: number;
  lastSeen: number;
  sampleTruths: string[];            // last 3 truths that carried it
  averageAftertaste: number;         // 0..10 across the entries' aftertaste predictions
  averageEngagementResidue: number;  // 0..10 derived from engagement records
}

export interface TruthPersistenceReport {
  /** All persistent truths the campaign has touched (count >= 2). */
  persistent: TruthPersistenceEntry[];
  /** Whether the current candidate touches a persistent truth. */
  candidate_touches_persistent: boolean;
  candidate_entry: TruthPersistenceEntry | null;
  /** 0..10 — how durable the candidate's truth has proven over time. */
  durability_score: number;
}

interface PersistenceBook {
  entries: Record<string, TruthPersistenceEntry>;
}

const g = globalThis as unknown as { __moodTruthPersistence?: PersistenceBook };

export interface TruthPersistenceStore {
  read(): Promise<PersistenceBook>;
  record(banner: Banner, engagementResidue: number): Promise<TruthPersistenceEntry>;
  report(candidateKey: string): Promise<TruthPersistenceReport>;
  reset(): Promise<void>;
}

export function createTruthPersistenceStore(dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR): TruthPersistenceStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<PersistenceBook> {
    if (g.__moodTruthPersistence) return g.__moodTruthPersistence;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      g.__moodTruthPersistence = JSON.parse(txt) as PersistenceBook;
    } catch {
      g.__moodTruthPersistence = { entries: {} };
    }
    return g.__moodTruthPersistence;
  }
  async function save(book: PersistenceBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodTruthPersistence = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }

  return {
    async read() { return load(); },
    async record(banner, engagementResidue) {
      const book = await load();
      const key = keyOfBanner(banner);
      const display = banner.truth.tension || banner.state.label;
      const existing = book.entries[key];
      const aftertasteScore = banner.tasteSystem.realityLoop.aftertastePrediction.residueStrength;
      if (existing) {
        existing.count += 1;
        existing.lastSeen = banner.createdAt;
        existing.sampleTruths = [banner.truth.truth, ...existing.sampleTruths].slice(0, 3);
        existing.averageAftertaste = movingAverage(existing.averageAftertaste, aftertasteScore, existing.count);
        existing.averageEngagementResidue = movingAverage(existing.averageEngagementResidue, engagementResidue, existing.count);
      } else {
        book.entries[key] = {
          key,
          display,
          count: 1,
          firstSeen: banner.createdAt,
          lastSeen: banner.createdAt,
          sampleTruths: [banner.truth.truth],
          averageAftertaste: aftertasteScore,
          averageEngagementResidue: engagementResidue,
        };
      }
      await save(book);
      return book.entries[key];
    },
    async report(candidateKey) {
      const book = await load();
      const persistent = Object.values(book.entries)
        .filter((e) => e.count >= 2)
        .sort((a, b) => b.count - a.count);
      const candidate_entry = book.entries[candidateKey] ?? null;
      const candidate_touches_persistent = !!candidate_entry && candidate_entry.count >= 2;
      const durability_score = candidate_entry
        ? Math.min(10, candidate_entry.count * 1.4 + candidate_entry.averageAftertaste * 0.3 + candidate_entry.averageEngagementResidue * 0.2)
        : 0;
      return { persistent, candidate_touches_persistent, candidate_entry, durability_score };
    },
    async reset() {
      g.__moodTruthPersistence = { entries: {} };
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
    },
  };
}

export function keyOfBanner(banner: Banner | { truth: { tension: string }; tasteSystem: { perception: { emotionalCore: { id: string } | null } } }): string {
  const tension = banner.truth.tension?.trim().toLowerCase();
  if (tension) return tension;
  const core = banner.tasteSystem.perception.emotionalCore?.id;
  return core ?? 'untracked';
}

function movingAverage(current: number, sample: number, count: number): number {
  return (current * (count - 1) + sample) / count;
}
