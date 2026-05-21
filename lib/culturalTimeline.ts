/**
 * CULTURAL TIMELINE (Phase 15)
 *
 * Tracks the EVOLUTION of the campaign's emotional vocabulary over
 * time, bucketed by week. Different from Phase 9's campaignTimeline
 * (which scores per-banner emotional notes) — this is a longer-term
 * view across weeks and months.
 *
 * The spec named the cultural progression:
 *
 *   2021 — isolation, doomscrolling
 *   2023 — overstimulation, productivity guilt
 *   2025 — functional collapse, passive existence, inability to land
 *
 * The engine cannot know what year it is for the audience, but it
 * CAN track what the campaign has been quietly drifting toward —
 * and surface it as a director-level read of the campaign arc.
 *
 * Persisted to data/memory/cultural-timeline.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { Banner } from '@/core/types';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'cultural-timeline.json';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface TimelineBucket {
  weekStart: number;                  // unix ts at week boundary
  banners: string[];                  // banner ids in this bucket
  cores: Record<string, number>;
  patterns: Record<string, number>;
  averageAftertaste: number;
  averageFunctionalCollapse: number;  // 0..10
  averageAccidentallyTrue: number;    // 0..10
}

interface TimelineBook {
  buckets: Record<string, TimelineBucket>;
}

const g = globalThis as unknown as { __moodCulturalTimeline?: TimelineBook };

export interface CulturalTimelinePhase {
  weeks: number;
  dominant_cores: string[];
  dominant_patterns: string[];
  /** Director-style read of what this phase has been about. */
  phase_note: string;
}

export interface CulturalTimelineReport {
  buckets: TimelineBucket[];
  phases: CulturalTimelinePhase[];
  /** The campaign's current emotional drift — what it has been
   *  quietly trending toward. */
  current_drift: string;
}

export interface CulturalTimelineStore {
  read(): Promise<TimelineBook>;
  record(banner: Banner): Promise<TimelineBucket>;
  report(now?: number): Promise<CulturalTimelineReport>;
  reset(): Promise<void>;
}

export function createCulturalTimelineStore(dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR): CulturalTimelineStore {
  const filePath = path.join(dir, FILE);

  async function load(): Promise<TimelineBook> {
    if (g.__moodCulturalTimeline) return g.__moodCulturalTimeline;
    try {
      const txt = await fs.readFile(filePath, 'utf8');
      g.__moodCulturalTimeline = JSON.parse(txt) as TimelineBook;
    } catch {
      g.__moodCulturalTimeline = { buckets: {} };
    }
    return g.__moodCulturalTimeline;
  }
  async function save(book: TimelineBook) {
    await fs.mkdir(dir, { recursive: true });
    g.__moodCulturalTimeline = book;
    await fs.writeFile(filePath, JSON.stringify(book, null, 2));
  }

  return {
    async read() { return load(); },
    async record(banner) {
      const book = await load();
      const weekStart = Math.floor(banner.createdAt / ONE_WEEK_MS) * ONE_WEEK_MS;
      const key = String(weekStart);
      const bucket = book.buckets[key] ?? {
        weekStart,
        banners: [],
        cores: {},
        patterns: {},
        averageAftertaste: 0,
        averageFunctionalCollapse: 0,
        averageAccidentallyTrue: 0,
      };
      const count = bucket.banners.length;
      bucket.banners.push(banner.id);
      const coreId = banner.tasteSystem.perception.emotionalCore?.id;
      if (coreId) bucket.cores[coreId] = (bucket.cores[coreId] ?? 0) + 1;
      const patternId = banner.tasteSystem.culture.sharedPattern?.id;
      if (patternId) bucket.patterns[patternId] = (bucket.patterns[patternId] ?? 0) + 1;
      const aftertaste = banner.tasteSystem.realityLoop.aftertastePrediction.residueStrength;
      const functional = banner.tasteSystem.pressure.functionalCollapse.functional_collapse_score;
      const accidentallyTrue = banner.tasteSystem.pressure.functionalCollapse.accidentally_true_score;
      bucket.averageAftertaste = movingAverage(bucket.averageAftertaste, aftertaste, count + 1);
      bucket.averageFunctionalCollapse = movingAverage(bucket.averageFunctionalCollapse, functional, count + 1);
      bucket.averageAccidentallyTrue = movingAverage(bucket.averageAccidentallyTrue, accidentallyTrue, count + 1);
      book.buckets[key] = bucket;
      await save(book);
      return bucket;
    },
    async report(now = Date.now()) {
      const book = await load();
      const buckets = Object.values(book.buckets).sort((a, b) => a.weekStart - b.weekStart);

      // Group consecutive weeks into phases that share dominant cores.
      const phases: CulturalTimelinePhase[] = [];
      let currentPhase: { weeksCount: number; cores: Record<string, number>; patterns: Record<string, number> } | null = null;
      for (const bucket of buckets) {
        const dominantCore = topKey(bucket.cores);
        if (!currentPhase) {
          currentPhase = { weeksCount: 1, cores: { ...bucket.cores }, patterns: { ...bucket.patterns } };
        } else {
          const phaseDominant = topKey(currentPhase.cores);
          if (dominantCore && phaseDominant && dominantCore === phaseDominant) {
            currentPhase.weeksCount += 1;
            mergeCounts(currentPhase.cores, bucket.cores);
            mergeCounts(currentPhase.patterns, bucket.patterns);
          } else {
            phases.push(closePhase(currentPhase));
            currentPhase = { weeksCount: 1, cores: { ...bucket.cores }, patterns: { ...bucket.patterns } };
          }
        }
      }
      if (currentPhase) phases.push(closePhase(currentPhase));

      const lastBucket = buckets[buckets.length - 1];
      const current_drift = lastBucket
        ? buildDriftRead(lastBucket, buckets[buckets.length - 2] ?? null, now)
        : 'campaign has not run long enough to read a drift';

      return { buckets, phases, current_drift };
    },
    async reset() {
      g.__moodCulturalTimeline = { buckets: {} };
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
    },
  };
}

function closePhase(phase: { weeksCount: number; cores: Record<string, number>; patterns: Record<string, number> }): CulturalTimelinePhase {
  const dominant_cores = Object.entries(phase.cores).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k]) => k);
  const dominant_patterns = Object.entries(phase.patterns).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([k]) => k);
  const phase_note = `${phase.weeksCount}-week phase — voice: ${dominant_cores.join(', ') || 'mixed'}` +
    (dominant_patterns.length > 0 ? ` · patterns: ${dominant_patterns.join(', ')}` : '');
  return { weeks: phase.weeksCount, dominant_cores, dominant_patterns, phase_note };
}

function buildDriftRead(last: TimelineBucket, prev: TimelineBucket | null, now: number): string {
  const lastDominant = topKey(last.cores) ?? 'mixed';
  const prevDominant = prev ? topKey(prev.cores) : null;
  const weeksAgo = Math.floor((now - last.weekStart) / ONE_WEEK_MS);
  if (prevDominant && prevDominant !== lastDominant) {
    return `campaign is drifting from "${prevDominant}" toward "${lastDominant}" (this week)`;
  }
  if (weeksAgo === 0) return `current voice: "${lastDominant}"`;
  return `voice held steady on "${lastDominant}" (last touched ${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago)`;
}

function topKey(map: Record<string, number>): string | null {
  const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
  return sorted[0]?.[0] ?? null;
}
function mergeCounts(target: Record<string, number>, source: Record<string, number>) {
  for (const [k, v] of Object.entries(source)) target[k] = (target[k] ?? 0) + v;
}
function movingAverage(current: number, sample: number, count: number): number {
  return (current * (count - 1) + sample) / count;
}
