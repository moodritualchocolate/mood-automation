/**
 * CAMPAIGN AFTERTASTE MEMORY
 *
 * "What stayed in memory after 24 hours?" — not what performed immediately.
 *
 * Aftertaste is a PREDICTION informed by:
 *   - the signals received in the first 24 hours after impression
 *   - the banner's structural DNA (memorable layouts last; templates don't)
 *   - the predicted reaction curve (emotional tension > engagement spike
 *     for residue)
 *   - the human-truth tension phrase (sharp contradictions live longer
 *     than smooth slogans)
 *
 * The store keeps an aftertaste record per shipped banner with a
 * residueStrength 0..10 + a one-line memory phrase. Banners under a
 * threshold can be "retired" from the campaign's effective memory —
 * the system stops counting them in fatigue/rhythm so newer banners
 * have room to differ.
 *
 * The most important rule for this module: brand residue is NOT the
 * same as engagement spike. A banner can win on residue with low
 * clicks (a quiet, unresolved moment that stays in the head).
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { BannerEngagement } from './engagementMemory';
import type { ReferenceDNA } from './referenceDNA';
import type { Reaction } from './humanReaction';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'aftertaste.json';

export interface AftertasteRecord {
  bannerId: string;
  /** When the banner shipped. */
  shippedAt: number;
  /** When this aftertaste prediction was computed. */
  measuredAt: number;
  /** 0..10 — predicted memorability at 24h. */
  residueStrength: number;
  /** One-line predicted "what the viewer will remember". */
  memoryPhrase: string;
  /** Signals that contributed positively / negatively. */
  signalAttribution: {
    positive: string[];
    negative: string[];
  };
  /** True after at least 24h have elapsed AND we have signal volume. */
  matured: boolean;
  /** Engagement-spike vs residue tradeoff — used by the meta-critic. */
  spikeVsResidueRatio: number;  // > 1 means spike heavy, < 1 means residue heavy
}

interface AftertasteBook {
  records: Record<string, AftertasteRecord>;
}

const g = globalThis as unknown as { __moodAftertaste?: AftertasteBook };

export interface AftertasteStore {
  read(): Promise<AftertasteRecord[]>;
  upsert(rec: AftertasteRecord): Promise<AftertasteRecord>;
  get(bannerId: string): Promise<AftertasteRecord | null>;
  reset(): Promise<void>;
}

export function createAftertasteStore(dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR): AftertasteStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<AftertasteBook> {
    if (g.__moodAftertaste) return g.__moodAftertaste;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      g.__moodAftertaste = JSON.parse(txt) as AftertasteBook;
    } catch {
      g.__moodAftertaste = { records: {} };
    }
    return g.__moodAftertaste;
  }
  async function save(book: AftertasteBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodAftertaste = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }

  return {
    async read() { return Object.values((await load()).records); },
    async upsert(rec) {
      const book = await load();
      book.records[rec.bannerId] = rec;
      await save(book);
      return rec;
    },
    async get(bannerId) {
      const book = await load();
      return book.records[bannerId] ?? null;
    },
    async reset() {
      g.__moodAftertaste = { records: {} };
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
    },
  };
}

const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export interface PredictInput {
  bannerId: string;
  shippedAt: number;
  engagement: BannerEngagement | null;
  bannerDNA: ReferenceDNA;
  predictedReactionAt3s: Reaction;
  tensionPhrase: string;
  truthLength: number;
  /** Now — defaults to Date.now() but override-able for testing. */
  now?: number;
}

export function predictAftertaste(input: PredictInput): AftertasteRecord {
  const { bannerId, shippedAt, engagement, bannerDNA, predictedReactionAt3s, tensionPhrase, truthLength } = input;
  const now = input.now ?? Date.now();

  const positive: string[] = [];
  const negative: string[] = [];

  // Residue starts from the DNA mechanics — emotional density, anti-commercial
  // feel, and a sharp tension phrase carry the most long-term memory.
  let residue = 3.5;
  residue += bannerDNA.emotional_density * 2.5;
  residue += bannerDNA.anti_commercial_feel * 1.5;
  residue += bannerDNA.tension_map * 1.0;
  residue += bannerDNA.documentary_weight * 0.8;

  if (bannerDNA.emotional_density > 0.7) positive.push('high emotional density');
  if (bannerDNA.anti_commercial_feel > 0.75) positive.push('does not read as an ad');
  if (bannerDNA.tension_map > 0.65) positive.push('tension carries beyond first look');
  if (bannerDNA.documentary_weight > 0.7) positive.push('documentary believability');

  // Sharp tension phrases linger; smooth slogans do not.
  if (tensionPhrase && tensionPhrase.length > 0 && tensionPhrase.length < 40) {
    residue += 0.8;
    positive.push(`tension "${tensionPhrase}" is sharp enough to repeat`);
  }
  // Long truth = explanation, not memory.
  if (truthLength > 110) {
    residue -= 1.0;
    negative.push('truth length suggests explanation, not memory');
  }

  // Predicted reaction at 3s matters but NOT linearly. Unresolved reactions
  // (emotional tension, discomfort, curiosity) stay longer than resolved
  // ones (validation, aspiration).
  const reactionResidueBonus: Record<Reaction, number> = {
    'emotional tension': +1.8,
    'intimacy':          +1.2,
    'discomfort':        +1.4,   // unresolved discomfort lingers
    'curiosity':         +1.0,
    'confusion':         +0.4,   // mild — can read as forgettable
    'recognition':       +0.6,
    'interruption':      +0.4,
    'validation':        +0.2,   // resolves too cleanly
    'aspiration':        +0.1,   // wears off
    'indifference':      -2.0,
    'rejection':         -1.5,
  };
  residue += reactionResidueBonus[predictedReactionAt3s];
  if (reactionResidueBonus[predictedReactionAt3s] > 0.5) {
    positive.push(`closing reaction "${predictedReactionAt3s}" leaves an unresolved trace`);
  } else if (reactionResidueBonus[predictedReactionAt3s] < 0) {
    negative.push(`closing reaction "${predictedReactionAt3s}" carries no residue`);
  }

  // Signal-derived adjustments (when we have signals).
  let spikeVsResidue = 1.0;
  if (engagement && engagement.totals.impressions >= 20) {
    const t = engagement.totals;
    const imps = Math.max(1, t.impressions);
    const rSave = t.saves / imps;
    const rShare = t.shares / imps;
    const rReplay = t.replays / imps;
    const rEmo = t.emotionalComments / imps;
    const rClick = t.clicks / imps;
    const rNeg = t.negative / imps;

    // Residue signals: save, share, emotional-comment, replay.
    const residueSignals = rSave + rShare + rEmo * 2 + rReplay;
    residue += clamp(residueSignals * 30, -2, +3);
    if (residueSignals > 0.05) positive.push('strong residue signals (saves + shares + emotional comments)');

    // Spike signals: clicks without saves.
    const spikeOnly = Math.max(0, rClick - (rSave + rShare));
    residue -= clamp(spikeOnly * 10, 0, 1.5);
    if (spikeOnly > 0.04) negative.push('clicks without saves — engagement spike, no residue');

    // Negative reactions hurt residue.
    residue -= clamp(rNeg * 30, 0, 2.5);
    if (rNeg > 0.03) negative.push(`${(rNeg * 100).toFixed(1)}% negative reactions`);

    spikeVsResidue = (rClick + 0.01) / (rSave + rShare + rEmo + 0.01);
  }

  residue = Math.max(0, Math.min(10, residue));

  const matured = now - shippedAt >= TWENTY_FOUR_HOURS && (engagement?.totals.impressions ?? 0) >= 50;

  const memoryPhrase = buildMemoryPhrase(predictedReactionAt3s, tensionPhrase, residue);

  return {
    bannerId,
    shippedAt,
    measuredAt: now,
    residueStrength: residue,
    memoryPhrase,
    signalAttribution: { positive, negative },
    matured,
    spikeVsResidueRatio: spikeVsResidue,
  };
}

function buildMemoryPhrase(reaction: Reaction, tension: string, residue: number): string {
  if (residue >= 7) {
    if (reaction === 'emotional tension' && tension) return `viewer still remembers the contradiction "${tension}"`;
    if (reaction === 'intimacy') return 'viewer remembers feeling seen — quietly';
    if (reaction === 'discomfort') return 'the flinch stayed — uncomfortable but unforgotten';
    return 'banner lives in viewer memory as a felt moment';
  }
  if (residue >= 5) {
    return 'banner is recalled vaguely — the truth landed, the visual did not';
  }
  if (residue >= 3) {
    return 'banner is gone from memory by tomorrow — recognized but not retained';
  }
  return 'no residue — viewer forgot before they finished scrolling';
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Summarise the campaign's overall residue health.
 * Used by the meta-critic and surfaced in /api/memory/atmosphere.
 */
export function summariseResidue(records: AftertasteRecord[]): {
  averageResidue: number;
  matureCount: number;
  averageSpikeVsResidue: number;
  topMemoryPhrases: string[];
} {
  if (records.length === 0) {
    return { averageResidue: 0, matureCount: 0, averageSpikeVsResidue: 1, topMemoryPhrases: [] };
  }
  const mature = records.filter((r) => r.matured);
  const averageResidue = mature.length > 0
    ? mature.reduce((a, b) => a + b.residueStrength, 0) / mature.length
    : records.reduce((a, b) => a + b.residueStrength, 0) / records.length;
  const averageSpikeVsResidue = records.reduce((a, b) => a + b.spikeVsResidueRatio, 0) / records.length;
  const topMemoryPhrases = records
    .slice()
    .sort((a, b) => b.residueStrength - a.residueStrength)
    .slice(0, 5)
    .map((r) => r.memoryPhrase);
  return { averageResidue, matureCount: mature.length, averageSpikeVsResidue, topMemoryPhrases };
}
