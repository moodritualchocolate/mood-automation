/**
 * ENGAGEMENT MEMORY ENGINE
 *
 * Ingests real-world signals from viewers — not only likes. Stores
 * per-banner aggregations the rest of the reality loop reads from.
 *
 * Signal vocabulary follows the spec exactly:
 *   saves · shares · watch time · pauses · CTR · comments ·
 *   emotional comments · replays · negative reactions
 *
 * Stored in data/memory/engagement.json keyed by bannerId. Reads are
 * cached on globalThis to survive Next.js HMR. Writes are persistent.
 *
 * The store is intentionally minimal — the heavy logic (drift,
 * aftertaste, atmosphere) lives in the other modules. This file is
 * the source of truth for what we received.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'engagement.json';

export type SignalKind =
  | 'save'
  | 'share'
  | 'watch'           // seconds watched (carries `value`)
  | 'pause'
  | 'ctr'             // click-through (binary: 0 = impression, 1 = click)
  | 'comment'
  | 'emotional-comment'   // comment tagged emotional (e.g. "I felt this", "this is me")
  | 'replay'
  | 'negative-reaction';

export interface RawSignal {
  kind: SignalKind;
  /** Seconds watched, or 1 for binary signals. */
  value?: number;
  /** Optional viewer tag — never PII. Used only for de-duplication. */
  viewerHash?: string;
  /** Optional free-text payload (a comment body). */
  text?: string;
  ts: number;
}

export interface BannerEngagement {
  bannerId: string;
  signals: RawSignal[];
  totals: {
    impressions: number;
    saves: number;
    shares: number;
    pauses: number;
    replays: number;
    clicks: number;
    comments: number;
    emotionalComments: number;
    negative: number;
    watchSecTotal: number;
    watchSecAvg: number;
    /** 0..1 — derived from negative reactions / total signals. */
    negativeRatio: number;
  };
  /** Last signal timestamp. Used by aftertaste to know when 24h has elapsed. */
  lastSignalAt: number;
  /** First impression timestamp. Used for aftertaste windowing. */
  firstSignalAt: number;
}

interface EngagementBook {
  banners: Record<string, BannerEngagement>;
}

const empty: EngagementBook = { banners: {} };

const g = globalThis as unknown as { __moodEngagement?: EngagementBook };

export interface EngagementStore {
  read(): Promise<EngagementBook>;
  record(bannerId: string, signal: RawSignal): Promise<BannerEngagement>;
  get(bannerId: string): Promise<BannerEngagement | null>;
  list(): Promise<BannerEngagement[]>;
  reset(): Promise<void>;
}

export function createEngagementStore(dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR): EngagementStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<EngagementBook> {
    if (g.__moodEngagement) return g.__moodEngagement;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      g.__moodEngagement = JSON.parse(txt) as EngagementBook;
    } catch {
      g.__moodEngagement = { banners: {} };
    }
    return g.__moodEngagement;
  }

  async function save(book: EngagementBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodEngagement = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }

  return {
    async read() {
      return load();
    },
    async record(bannerId, signal) {
      const book = await load();
      if (!book.banners[bannerId]) {
        book.banners[bannerId] = {
          bannerId,
          signals: [],
          totals: emptyTotals(),
          firstSignalAt: signal.ts,
          lastSignalAt: signal.ts,
        };
      }
      const b = book.banners[bannerId];
      b.signals.push(signal);
      b.lastSignalAt = Math.max(b.lastSignalAt, signal.ts);
      b.firstSignalAt = Math.min(b.firstSignalAt, signal.ts);
      b.totals = recomputeTotals(b.signals);
      await save(book);
      return b;
    },
    async get(bannerId) {
      const book = await load();
      return book.banners[bannerId] ?? null;
    },
    async list() {
      const book = await load();
      return Object.values(book.banners);
    },
    async reset() {
      g.__moodEngagement = { banners: {} };
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
    },
  };
}

function emptyTotals(): BannerEngagement['totals'] {
  return {
    impressions: 0, saves: 0, shares: 0, pauses: 0, replays: 0,
    clicks: 0, comments: 0, emotionalComments: 0, negative: 0,
    watchSecTotal: 0, watchSecAvg: 0, negativeRatio: 0,
  };
}

function recomputeTotals(signals: RawSignal[]): BannerEngagement['totals'] {
  const t = emptyTotals();
  let watchEvents = 0;
  for (const s of signals) {
    switch (s.kind) {
      case 'save': t.saves += 1; break;
      case 'share': t.shares += 1; break;
      case 'pause': t.pauses += 1; break;
      case 'replay': t.replays += 1; break;
      case 'comment': t.comments += 1; break;
      case 'emotional-comment': t.emotionalComments += 1; t.comments += 1; break;
      case 'negative-reaction': t.negative += 1; break;
      case 'ctr':
        t.impressions += 1;
        if ((s.value ?? 0) > 0) t.clicks += 1;
        break;
      case 'watch':
        t.watchSecTotal += s.value ?? 0;
        watchEvents += 1;
        break;
    }
  }
  t.watchSecAvg = watchEvents > 0 ? t.watchSecTotal / watchEvents : 0;
  const totalActions = t.saves + t.shares + t.pauses + t.replays + t.comments + t.negative + t.clicks;
  t.negativeRatio = totalActions > 0 ? t.negative / totalActions : 0;
  return t;
}

/**
 * Simulate plausible signals from a synthetic viewer for testing.
 * Driven by the banner's predicted reaction curve so the simulator
 * stays grounded in the system's own theory of mind — but with noise
 * so it can sometimes disagree.
 */
export function syntheticSignalsFor(args: {
  bannerId: string;
  predictedReactionAt3s: string;
  engagementQuality: number;        // 0..10
  audienceSize?: number;
  seed?: number;
}): RawSignal[] {
  const { bannerId, predictedReactionAt3s, engagementQuality, audienceSize = 200, seed = Date.now() } = args;
  void bannerId; // included for caller clarity, signals carry no banner id at this layer
  const rng = mulberry32(seed);
  const out: RawSignal[] = [];

  const impressions = audienceSize;
  // base reaction probabilities derived from the predicted 3s reaction
  const baseRates: Record<string, { save: number; share: number; comment: number; emotional: number; click: number; replay: number; pause: number; negative: number; watchSec: number }> = {
    'emotional tension': { save: 0.08, share: 0.05, comment: 0.06, emotional: 0.04, click: 0.06, replay: 0.04, pause: 0.06, negative: 0.01, watchSec: 4.2 },
    'intimacy':          { save: 0.07, share: 0.03, comment: 0.05, emotional: 0.06, click: 0.04, replay: 0.03, pause: 0.04, negative: 0.005, watchSec: 4.0 },
    'recognition':       { save: 0.04, share: 0.05, comment: 0.03, emotional: 0.02, click: 0.05, replay: 0.02, pause: 0.04, negative: 0.005, watchSec: 3.4 },
    'validation':        { save: 0.05, share: 0.04, comment: 0.04, emotional: 0.02, click: 0.07, replay: 0.02, pause: 0.03, negative: 0.005, watchSec: 3.2 },
    'aspiration':        { save: 0.03, share: 0.02, comment: 0.02, emotional: 0.01, click: 0.10, replay: 0.01, pause: 0.02, negative: 0.005, watchSec: 2.8 },
    'curiosity':         { save: 0.03, share: 0.02, comment: 0.03, emotional: 0.02, click: 0.06, replay: 0.03, pause: 0.05, negative: 0.005, watchSec: 3.0 },
    'discomfort':        { save: 0.02, share: 0.01, comment: 0.04, emotional: 0.03, click: 0.02, replay: 0.01, pause: 0.06, negative: 0.04,  watchSec: 2.6 },
    'confusion':         { save: 0.01, share: 0.01, comment: 0.03, emotional: 0.01, click: 0.02, replay: 0.02, pause: 0.05, negative: 0.05,  watchSec: 2.0 },
    'interruption':      { save: 0.03, share: 0.03, comment: 0.02, emotional: 0.02, click: 0.05, replay: 0.02, pause: 0.06, negative: 0.01,  watchSec: 2.8 },
    'indifference':      { save: 0.005,share: 0.005,comment: 0.005,emotional: 0.001,click: 0.01, replay: 0.005,pause: 0.01, negative: 0.005, watchSec: 0.8 },
    'rejection':         { save: 0.001,share: 0.001,comment: 0.01, emotional: 0.001,click: 0.005,replay: 0.001,pause: 0.02, negative: 0.08,  watchSec: 0.4 },
  };
  const rates = baseRates[predictedReactionAt3s] ?? baseRates.recognition;

  // Engagement quality scales most positive rates; negative stays roughly constant.
  const eq = engagementQuality / 10;
  const scale = 0.5 + eq * 0.8;

  for (let i = 0; i < impressions; i++) {
    const ts = Date.now() + i * 100;
    out.push({ kind: 'ctr', value: rng() < rates.click * scale ? 1 : 0, ts });

    // Watch time per impression (always recorded — could be very short).
    const watchJitter = (rng() - 0.5) * 1.6;
    const sec = Math.max(0.2, rates.watchSec * scale + watchJitter);
    out.push({ kind: 'watch', value: sec, ts });

    if (rng() < rates.save * scale) out.push({ kind: 'save', ts });
    if (rng() < rates.share * scale) out.push({ kind: 'share', ts });
    if (rng() < rates.replay * scale) out.push({ kind: 'replay', ts });
    if (rng() < rates.pause * scale) out.push({ kind: 'pause', ts });
    if (rng() < rates.comment * scale) {
      out.push(rng() < rates.emotional / Math.max(rates.comment, 0.001)
        ? { kind: 'emotional-comment', ts, text: 'this is me' }
        : { kind: 'comment', ts },
      );
    }
    if (rng() < rates.negative) out.push({ kind: 'negative-reaction', ts });
  }
  return out;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
