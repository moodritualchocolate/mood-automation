/**
 * 10. CREATIVE MEMORY ENGINE
 *
 * Remembers what the system has done: states used, layouts used,
 * hooks used, typography behaviors used, fatigue.
 *
 * V1 storage: a JSON file under MOOD_MEMORY_DIR (defaults to
 * ./data/memory). Architected as a repository so a future Postgres or
 * Redis store can drop in without touching engines.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Banner, Critique, MemorySnapshot } from '@/core/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'memory.json';

const EMPTY: MemorySnapshot = {
  totalBanners: 0,
  recentStateIds: [],
  recentLayouts: [],
  recentHooks: [],
  stateScores: {},
  layoutFatigue: {},
  // V2 rhythm intelligence
  pacingHistory: [],
  silenceCount: 0,
  aggressiveCount: 0,
  typographyFatigue: {},
  recurringEmotionalPatterns: {},
  overstimulationFlag: false,
  campaignArc: [],
};

/**
 * Forward-migrate a snapshot loaded from disk that pre-dates the V2
 * fields. Returns a snapshot with every V2 field defaulted, so older
 * memory files stay readable without manual intervention.
 */
function migrate(raw: Partial<MemorySnapshot>): MemorySnapshot {
  return { ...EMPTY, ...raw };
}

export interface MemoryStore {
  read(): Promise<MemorySnapshot>;
  record(banner: Banner): Promise<MemorySnapshot>;
  reset(): Promise<void>;
}

export function createMemoryStore(dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR): MemoryStore {
  const filePath = path.join(dir, FILE);

  async function ensure() {
    await fs.mkdir(dir, { recursive: true });
  }

  async function read(): Promise<MemorySnapshot> {
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      return migrate(JSON.parse(txt) as Partial<MemorySnapshot>);
    } catch {
      return { ...EMPTY };
    }
  }

  async function write(snap: MemorySnapshot) {
    await ensure();
    await fs.writeFile(filePath, JSON.stringify(snap, null, 2));
  }

  async function record(banner: Banner): Promise<MemorySnapshot> {
    const current = await read();
    const next = updateSnapshot(current, banner);
    await write(next);
    return next;
  }

  async function reset() {
    try {
      await fs.unlink(filePath);
    } catch { /* idempotent */ }
  }

  return { read, record, reset };
}

const RECENT_WINDOW = 12;
const ARC_WINDOW = 24;

function updateSnapshot(current: MemorySnapshot, b: Banner): MemorySnapshot {
  const pacing = b.direction.emotionalPacing;
  const restraint = b.direction.restraint;

  const next: MemorySnapshot = {
    totalBanners: current.totalBanners + 1,
    recentStateIds: [b.state.id, ...current.recentStateIds].slice(0, RECENT_WINDOW),
    recentLayouts: [b.direction.layoutFamily, ...current.recentLayouts].slice(0, RECENT_WINDOW),
    recentHooks: [b.direction.hook, ...current.recentHooks].slice(0, RECENT_WINDOW),
    stateScores: { ...current.stateScores },
    layoutFatigue: { ...current.layoutFatigue },
    // V2
    pacingHistory: [pacing, ...current.pacingHistory].slice(0, RECENT_WINDOW),
    silenceCount: current.silenceCount + (restraint > 0.7 ? 1 : 0),
    aggressiveCount: current.aggressiveCount + (restraint < 0.4 ? 1 : 0),
    typographyFatigue: { ...current.typographyFatigue },
    recurringEmotionalPatterns: { ...current.recurringEmotionalPatterns },
    overstimulationFlag: false,
    campaignArc: [
      {
        bannerId: b.id,
        family: b.state.family,
        pacing,
        restraint,
        ts: b.createdAt,
      },
      ...current.campaignArc,
    ].slice(0, ARC_WINDOW),
  };

  const score = scoreFromCritique(b.critique);
  next.stateScores[b.state.id] = ((current.stateScores[b.state.id] ?? 1) * 0.7) + score * 0.3;
  next.layoutFatigue[b.direction.layoutFamily] = (current.layoutFatigue[b.direction.layoutFamily] ?? 0) + 1;

  next.typographyFatigue[b.direction.typographyDominance] =
    (current.typographyFatigue[b.direction.typographyDominance] ?? 0) + 1;
  next.recurringEmotionalPatterns[b.state.family] =
    (current.recurringEmotionalPatterns[b.state.family] ?? 0) + 1;

  // Overstimulation: 3 or more "wired" / "tense" pacings in last 4 banners.
  const recent4 = next.pacingHistory.slice(0, 4);
  const hot = recent4.filter((p) => p === 'wired' || p === 'tense').length;
  next.overstimulationFlag = hot >= 3;

  return next;
}

function scoreFromCritique(c: Critique): number {
  // Reward emotional clarity + tension; penalise AI-feel + pasted product.
  const positive = (c.scores.emotionalTruthClarity + c.scores.tension + c.scores.feelsLikeRealCampaign) / 30;
  const negative = (c.scores.feelsAI + c.scores.productPasted + c.scores.typographyForced) / 30;
  // Map 0..1 to a multiplicative score around 1.
  return 0.6 + (positive - negative) * 1.2;
}
