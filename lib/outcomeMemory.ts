/**
 * OUTCOME MEMORY (Reality Attachment Layer)
 *
 * Persistent FIFO of REAL-WORLD outcomes attached to creative
 * fingerprints. The operator records what actually happened after
 * a banner shipped (impressions, retention, saves, conversions,
 * emotional response). The system observes — it never auto-publishes
 * and never auto-derives outcomes from external sources.
 *
 * STRICT CONTRACT:
 *   - append-only, FIFO-capped
 *   - every write is operator-supervised
 *   - never auto-optimizes, never auto-selects winners
 *   - never modifies any other memory file
 *   - no ML, no embeddings, no external APIs
 *
 * Lives at data/memory/outcome-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'outcome-memory.json';

export const OUTCOME_LIMIT = 256;

// ─── types ────────────────────────────────────────────────────

export type OutcomeLabel =
  | 'trust-formation'
  | 'emotional-resonance'
  | 'fatigue-acceleration'
  | 'replay-behavior'
  | 'retention-decay'
  | 'conversion-spike'
  | 'hook-collapse'
  | 'narrative-saturation'
  | 'realism-success'
  | 'authenticity-rejection'
  | 'aggressive-cta-rejection'
  | 'emotional-stillness-success'
  | 'curiosity-retention'
  | 'visual-fatigue'
  | 'identity-reinforcement'
  | 'unlabeled';

export interface OutcomeMetrics {
  impressions?: number;
  watchTime?: number;          // seconds
  retention?: number;          // 0..1
  rewatches?: number;
  saves?: number;
  shares?: number;
  comments?: number;
  likes?: number;
  profileVisits?: number;
  follows?: number;
  ctr?: number;                // 0..1
  addToCart?: number;
  checkoutRate?: number;       // 0..1
  purchases?: number;
  bounceRate?: number;         // 0..1
  scrollDepth?: number;        // 0..1
}

export interface OutcomeRecord {
  at: number;
  bannerId: string | null;
  platform: string;
  audienceSegment: string;
  campaignMode: string | null;
  formula: string;
  creativeFingerprint: string;
  emotionalSignature: string;
  narrativeSignature: string;
  persuasionIntensity: number;
  realismLevel: number;
  visualStyle: string;
  cadenceState: string;
  mutationPressure: number;
  metrics: OutcomeMetrics;
  downstreamOutcome: OutcomeLabel;
  /** Optional free-text operator note. Never displayed back to
   *  external systems; purely a journal entry. */
  operatorNote?: string;
}

// ─── outcome labeling from metrics ───────────────────────────

/**
 * Deterministic label derivation from metrics. The operator may
 * supply a label explicitly; when they do not, this heuristic
 * produces one from the metrics alone. The labels are descriptive
 * of WHAT HAPPENED (per metric thresholds), never predictive.
 *
 * Threshold values are conservative defaults — they are intentionally
 * NOT tuneable from outside this file, since the system must remain
 * deterministic across operators.
 */
export function deriveOutcomeLabel(m: OutcomeMetrics): OutcomeLabel {
  // Highly successful retention + saves → emotional resonance.
  if ((m.retention ?? 0) >= 0.6 && (m.saves ?? 0) >= 1) return 'emotional-resonance';
  // Conversion spike: high checkout/purchase rate.
  if ((m.checkoutRate ?? 0) >= 0.04 || (m.purchases ?? 0) >= 5) return 'conversion-spike';
  // Replay behavior: rewatches dominate.
  if ((m.rewatches ?? 0) >= 1) return 'replay-behavior';
  // Trust formation: follows + profile visits without aggressive CTA.
  if ((m.follows ?? 0) >= 1 && (m.profileVisits ?? 0) >= 2) return 'trust-formation';
  // Curiosity retention: long watchTime + high scroll depth + low CTA pressure.
  if ((m.watchTime ?? 0) >= 8 && (m.scrollDepth ?? 0) >= 0.5) return 'curiosity-retention';
  // Hook collapse: bounce rate very high.
  if ((m.bounceRate ?? 0) >= 0.7) return 'hook-collapse';
  // Retention decay: watch time low + bounce moderate.
  if ((m.retention ?? 0) <= 0.2 && (m.bounceRate ?? 0) >= 0.4) return 'retention-decay';
  // Authenticity rejection: high impressions, low engagement.
  if ((m.impressions ?? 0) >= 1000 && (m.likes ?? 0) + (m.saves ?? 0) + (m.comments ?? 0) <= 2) {
    return 'authenticity-rejection';
  }
  return 'unlabeled';
}

// ─── state ────────────────────────────────────────────────────

export interface OutcomeMemoryState {
  outcomes: OutcomeRecord[];
  totalOutcomes: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialOutcomeMemory(): OutcomeMemoryState {
  return { outcomes: [], totalOutcomes: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── store ────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodOutcome?: OutcomeMemoryState };

export interface OutcomeMemoryStore {
  read(): Promise<OutcomeMemoryState>;
  append(record: OutcomeRecord): Promise<OutcomeMemoryState>;
  save(state: OutcomeMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createOutcomeMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): OutcomeMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: OutcomeMemoryStore = {
    async read() {
      if (g.__moodOutcome) return g.__moodOutcome;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<OutcomeMemoryState>;
        g.__moodOutcome = { ...createInitialOutcomeMemory(), ...parsed };
      } catch {
        g.__moodOutcome = createInitialOutcomeMemory();
      }
      return g.__moodOutcome;
    },
    async append(record) {
      const cur = await store.read();
      const next: OutcomeMemoryState = {
        ...cur,
        outcomes: [...cur.outcomes, record].slice(-OUTCOME_LIMIT),
        totalOutcomes: cur.totalOutcomes + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? record.at,
        updatedAt: nowMs(),
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.outcomes = state.outcomes.slice(-OUTCOME_LIMIT);
      state.updatedAt = nowMs();
      g.__moodOutcome = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodOutcome = undefined;
    },
  };
  return store;
}

/** Non-blocking writer. Always fills the label when omitted, never
 *  overwrites an explicit operator label. */
export async function recordOutcome(input: Omit<OutcomeRecord, 'downstreamOutcome'> & { downstreamOutcome?: OutcomeLabel }): Promise<void> {
  try {
    const downstreamOutcome = input.downstreamOutcome ?? deriveOutcomeLabel(input.metrics);
    const record: OutcomeRecord = { ...input, downstreamOutcome };
    await createOutcomeMemoryStore().append(record);
  } catch {
    // non-fatal — outcome recording never blocks anything
  }
}
