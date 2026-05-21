/**
 * HUMAN MEMORY ENGINE
 *
 * Memory should answer: "What did this asset make the viewer feel?"
 *
 * The standard memory tracks scores, layouts, fatigue. This engine
 * tracks the EMOTIONAL trace of every shipped banner:
 *
 *   - the human truth that was used
 *   - the predicted reaction at 0.3s / 1s / 3s
 *   - the tension phrase that drove the banner
 *   - the cultural moment it spoke from
 *   - the asset job it was for
 *   - the residue — a one-line predicted "what the viewer is left
 *     thinking" after the banner is gone
 *
 * Future banners read this trail to answer:
 *   - "what truths has this campaign already said?"
 *   - "what reactions have we already produced?"
 *   - "are we repeating the same residue?"
 *
 * Stored alongside the main memory in data/memory/emotional-trace.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Banner } from '@/core/types';
import type { Reaction } from './humanReaction';

export interface EmotionalTraceEntry {
  bannerId: string;
  createdAt: number;
  stateId: string;
  family: string;
  truth: string;
  tension: string;
  job: string | null;
  culturalMoment: string | null;
  reaction: { at_0_3s: Reaction; at_1s: Reaction; at_3s: Reaction };
  engagement: number;
  residue: string;        // one-line "what the viewer is left thinking"
  // Phase 4 — banner facts the drift detector needs to join across runs.
  facts?: {
    typographyDominance: string;
    layoutFamily: string;
    productRole: string;
    documentary_weight: number;
    realism_type: number;
    silence_ratio: number;
  };
}

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'emotional-trace.json';
const TRACE_LIMIT = 50;

export interface HumanMemoryStore {
  read(): Promise<EmotionalTraceEntry[]>;
  record(entry: EmotionalTraceEntry): Promise<EmotionalTraceEntry[]>;
  reset(): Promise<void>;
}

export function createHumanMemoryStore(dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR): HumanMemoryStore {
  const filePath = path.join(dir, FILE);

  async function ensure() {
    await fs.mkdir(dir, { recursive: true });
  }
  async function read(): Promise<EmotionalTraceEntry[]> {
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      return JSON.parse(txt) as EmotionalTraceEntry[];
    } catch {
      return [];
    }
  }
  async function write(entries: EmotionalTraceEntry[]) {
    await ensure();
    await fs.writeFile(filePath, JSON.stringify(entries, null, 2));
  }
  async function record(entry: EmotionalTraceEntry): Promise<EmotionalTraceEntry[]> {
    const current = await read();
    const next = [entry, ...current].slice(0, TRACE_LIMIT);
    await write(next);
    return next;
  }
  async function reset() {
    try { await fs.unlink(filePath); } catch { /* idempotent */ }
  }
  return { read, record, reset };
}

/**
 * Derive the residue — what the viewer is left thinking — from the
 * banner's truth, tension, and predicted 3s reaction.
 */
export function deriveResidue(args: {
  truth: string;
  tension: string;
  at_3s: Reaction;
}): string {
  const { truth, tension, at_3s } = args;

  // Residue templates per closing reaction.
  switch (at_3s) {
    case 'emotional tension':
      return `viewer carries the contradiction "${tension}" with them`;
    case 'intimacy':
      return `viewer feels seen — "${truth.slice(0, 60)}…" landed quietly`;
    case 'validation':
      return `viewer thinks: "yes — that was my day"`;
    case 'recognition':
      return `viewer thinks: "I have lived this exact second"`;
    case 'aspiration':
      return `viewer leaves wanting the version of themselves the banner suggested`;
    case 'curiosity':
      return `viewer leaves with a question they have not answered yet`;
    case 'discomfort':
      return `viewer flinched — and that is the residue`;
    case 'confusion':
      return `viewer left without resolving the truth — risk: forgettable`;
    case 'interruption':
      return `viewer stopped, then moved on — the interruption was the whole event`;
    case 'indifference':
      return `no residue — the viewer scrolled past`;
    case 'rejection':
      return `viewer pushed away from the banner — likely negative attribution to brand`;
  }
}

/**
 * Summarise the recent emotional trail — used by the campaign brain to
 * decide what feeling we have already produced too much of.
 */
export function summariseTrail(trail: EmotionalTraceEntry[]): {
  recentResidues: string[];
  dominantClosing: Reaction | null;
  dominantClosingCount: number;
  truthsUsed: string[];
} {
  const recent = trail.slice(0, 8);
  const closings: Record<string, number> = {};
  for (const e of recent) closings[e.reaction.at_3s] = (closings[e.reaction.at_3s] ?? 0) + 1;
  const sorted = Object.entries(closings).sort((a, b) => b[1] - a[1]);
  return {
    recentResidues: recent.map((e) => e.residue),
    dominantClosing: (sorted[0]?.[0] as Reaction | undefined) ?? null,
    dominantClosingCount: sorted[0]?.[1] ?? 0,
    truthsUsed: recent.map((e) => e.truth),
  };
}

/**
 * Build the trace entry from a fully-formed Banner.
 */
export function entryFromBanner(banner: Banner, job: string | null, culturalMoment: string | null): EmotionalTraceEntry {
  const r = banner.tasteSystem.reaction;
  const dna = banner.tasteSystem.dna;
  return {
    bannerId: banner.id,
    createdAt: banner.createdAt,
    stateId: banner.state.id,
    family: banner.state.family,
    truth: banner.truth.truth,
    tension: banner.truth.tension,
    job,
    culturalMoment,
    reaction: { at_0_3s: r.at_0_3s, at_1s: r.at_1s, at_3s: r.at_3s },
    engagement: r.engagementQuality,
    residue: deriveResidue({ truth: banner.truth.truth, tension: banner.truth.tension, at_3s: r.at_3s }),
    facts: {
      typographyDominance: banner.direction.typographyDominance,
      layoutFamily: banner.direction.layoutFamily,
      productRole: banner.direction.productRole,
      documentary_weight: dna.documentary_weight,
      realism_type: dna.realism_type,
      silence_ratio: dna.silence_ratio,
    },
  };
}
