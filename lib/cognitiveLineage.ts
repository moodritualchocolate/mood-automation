/**
 * COGNITIVE LINEAGE (Wave 26 — Phase 7)
 *
 * The organism's memory of its own cognition. A capped, append-only
 * archive of every structured artifact: drafts, reviews, revisions,
 * approvals. Lives at data/memory/cognitive-lineage.json — long-term
 * identity continuity, separate from the transient os-runtime.json.
 *
 * Each entry carries:
 *   - the kind (discriminated union)
 *   - a unique id (deterministic from at + tick)
 *   - timestamps (at + tick)
 *   - backlinks to the prior entry it derives from
 *   - the full payload (the structured artifact itself)
 *
 * This is the answer to "the original draft must NOT disappear" —
 * a revised draft replaces currentDraft, but the original is
 * preserved in the lineage with kind='draft'. Same for reviews;
 * the most recent is on os.currentReview, all are in the lineage.
 *
 * Capped at LINEAGE_LIMIT entries (recent slice). totalEntries
 * counts everything ever inscribed.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type {
  CurrentDraft, CurrentReview, CurrentRevision, ApprovalState,
} from './operatingSystemCore';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'cognitive-lineage.json';
const LINEAGE_LIMIT = 200;

export type LineageEntry =
  | { kind: 'draft';    id: string; at: number; tick: number;
      derivedFromPriorDraftId?: string;
      payload: CurrentDraft; }
  | { kind: 'review';   id: string; at: number; tick: number;
      derivedFromDraftId: string;
      payload: CurrentReview; }
  | { kind: 'revision'; id: string; at: number; tick: number;
      derivedFromDraftId: string; derivedFromReviewId: string;
      payload: CurrentRevision; }
  | { kind: 'approval'; id: string; at: number; tick: number;
      derivedFromDraftId: string; derivedFromReviewId: string;
      payload: ApprovalState; };

export interface CognitiveLineageState {
  entries: LineageEntry[];      // capped recent
  totalEntries: number;         // count of every entry ever inscribed
  firstEntryAt: number | null;
  lastEntryAt: number | null;
  updatedAt: number;
}

export function createInitialLineage(): CognitiveLineageState {
  return {
    entries: [],
    totalEntries: 0,
    firstEntryAt: null,
    lastEntryAt: null,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodLineage?: CognitiveLineageState };

export interface CognitiveLineageStore {
  read(): Promise<CognitiveLineageState>;
  append(entry: LineageEntry): Promise<CognitiveLineageState>;
  reset(): Promise<void>;
}

export function createCognitiveLineageStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): CognitiveLineageStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodLineage) return g.__moodLineage;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodLineage = {
          ...createInitialLineage(),
          ...(JSON.parse(txt) as Partial<CognitiveLineageState>),
        };
      } catch {
        g.__moodLineage = createInitialLineage();
      }
      return g.__moodLineage;
    },
    async append(entry) {
      const current = g.__moodLineage ?? (await this.read());
      const next: CognitiveLineageState = {
        entries: [...current.entries, entry].slice(-LINEAGE_LIMIT),
        totalEntries: current.totalEntries + 1,
        firstEntryAt: current.firstEntryAt ?? entry.at,
        lastEntryAt: entry.at,
        updatedAt: Date.now(),
      };
      g.__moodLineage = next;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(next, null, 2));
      return next;
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodLineage = undefined;
    },
  };
}
