/**
 * NARRATIVE DNA MEMORY
 *
 * Persistent FIFO of deterministic NARRATIVE FINGERPRINTS extracted
 * from each generated banner. Tracks how the campaign tells itself:
 * hook families, persuasion structures, emotional cadence, tension
 * curves, payoff timing, silence usage, observational density,
 * narration style, human realism, CTA pressure.
 *
 * STRICT CONTRACT:
 *   - append-only, FIFO-capped
 *   - extracts only fields already present in the banner shape
 *   - never reads memories from other layers
 *   - never blocks generation
 *
 * Lives at data/memory/narrative-dna-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'narrative-dna-memory.json';

export const NARRATIVE_DNA_FINGERPRINT_LIMIT = 96;

// ─── shape ─────────────────────────────────────────────────────

export interface NarrativeFingerprint {
  at: number;
  bannerId: string;
  formula: string;
  campaignMode: string | null;
  hookFamily: string;
  persuasionStructure: string;
  emotionalCadence: string;
  tensionCurve: string;
  payoffTiming: string;
  silenceUsage: string;
  observationalDensity: number;    // 0..10
  narrationStyle: string;
  humanRealism: number;            // 0..10
  ctaPressure: number;             // 0..10
}

export interface NarrativeDNAMemoryState {
  fingerprints: NarrativeFingerprint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialNarrativeDNAMemory(): NarrativeDNAMemoryState {
  return { fingerprints: [], totalObservations: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── fingerprint extraction ───────────────────────────────────

export interface BannerForNarrativeDNA {
  id: string;
  createdAt: number;
  formula: string;
  campaignMode?: string | null;
  truth?: { truth?: string; tension?: string };
  copywriter?: {
    hook?: { hook?: string };
    body?: { body?: string };
    cta?: { cta?: string };
    emotionalFrame?: string;
    persuasionTone?: string;
    storyShape?: string;
  };
  adStrategy?: {
    persuasionMode?: string;
    storyShape?: string;
  };
  direction?: { restraint?: number };
  composition?: { negativeSpaceBias?: string };
  finalVerdict?: { brutality?: number; verdict?: string };
}

function safe(x: string | null | undefined): string {
  return (x ?? 'unknown').toString().toLowerCase().replace(/\s+/g, '-');
}

function hookFamilyFor(banner: BannerForNarrativeDNA): string {
  const tone = safe(banner.copywriter?.persuasionTone);
  const story = safe(banner.copywriter?.storyShape ?? banner.adStrategy?.storyShape);
  return `${tone}|${story}`;
}

function persuasionStructureFor(banner: BannerForNarrativeDNA): string {
  const mode = safe(banner.adStrategy?.persuasionMode);
  const tone = safe(banner.copywriter?.persuasionTone);
  return `${mode}|${tone}`;
}

function emotionalCadenceFor(banner: BannerForNarrativeDNA): string {
  const frame = safe(banner.copywriter?.emotionalFrame);
  const tension = safe(banner.truth?.tension);
  return `${frame}|${tension}`;
}

function tensionCurveFor(banner: BannerForNarrativeDNA): string {
  const story = safe(banner.copywriter?.storyShape ?? banner.adStrategy?.storyShape);
  const brut = (banner.finalVerdict?.brutality ?? 0.5).toFixed(1);
  return `${story}|b=${brut}`;
}

function payoffTimingFor(banner: BannerForNarrativeDNA): string {
  // Coarse: presence of body + cta + restraint.
  const restraint = banner.direction?.restraint ?? 0.5;
  if (restraint >= 0.8) return 'delayed';
  if (restraint >= 0.5) return 'mid';
  return 'early';
}

function silenceUsageFor(banner: BannerForNarrativeDNA): string {
  const bias = safe(banner.composition?.negativeSpaceBias);
  if (bias === 'edge' || bias === 'flush') return 'sparse';
  if (bias === 'center') return 'dense';
  return 'mid';
}

function observationalDensityFor(banner: BannerForNarrativeDNA): number {
  // Proxy: restraint score × 10, biased by storyShape.
  const restraint = banner.direction?.restraint ?? 0.5;
  const story = banner.copywriter?.storyShape ?? banner.adStrategy?.storyShape ?? '';
  let d = restraint * 10;
  if (typeof story === 'string' && story.toLowerCase().includes('mirror')) d += 1;
  return Math.max(0, Math.min(10, Math.round(d)));
}

function narrationStyleFor(banner: BannerForNarrativeDNA): string {
  const story = safe(banner.copywriter?.storyShape ?? banner.adStrategy?.storyShape);
  const tone = safe(banner.copywriter?.persuasionTone);
  if (story.includes('mirror'))       return 'observational';
  if (story.includes('objection'))    return 'argumentative';
  if (tone.includes('command'))       return 'imperative';
  if (tone.includes('curious'))       return 'inquisitive';
  return 'documentary';
}

function humanRealismFor(banner: BannerForNarrativeDNA): number {
  const restraint = banner.direction?.restraint ?? 0.5;
  const brut = banner.finalVerdict?.brutality ?? 0.5;
  // Higher restraint + lower brutality = more human realism.
  return Math.max(0, Math.min(10, Math.round((restraint * 6) + ((1 - brut) * 4))));
}

function ctaPressureFor(banner: BannerForNarrativeDNA): number {
  // Coarse: brutality dominates the CTA tone in the existing pipeline.
  const brut = banner.finalVerdict?.brutality ?? 0.5;
  return Math.max(0, Math.min(10, Math.round(brut * 10)));
}

export function extractNarrativeFingerprint(
  banner: BannerForNarrativeDNA,
): NarrativeFingerprint {
  return {
    at: banner.createdAt,
    bannerId: banner.id,
    formula: banner.formula,
    campaignMode: banner.campaignMode ?? null,
    hookFamily:           hookFamilyFor(banner),
    persuasionStructure:  persuasionStructureFor(banner),
    emotionalCadence:     emotionalCadenceFor(banner),
    tensionCurve:         tensionCurveFor(banner),
    payoffTiming:         payoffTimingFor(banner),
    silenceUsage:         silenceUsageFor(banner),
    observationalDensity: observationalDensityFor(banner),
    narrationStyle:       narrationStyleFor(banner),
    humanRealism:         humanRealismFor(banner),
    ctaPressure:          ctaPressureFor(banner),
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodNarrativeDNA?: NarrativeDNAMemoryState };

export interface NarrativeDNAMemoryStore {
  read(): Promise<NarrativeDNAMemoryState>;
  append(fp: NarrativeFingerprint): Promise<NarrativeDNAMemoryState>;
  save(state: NarrativeDNAMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createNarrativeDNAMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): NarrativeDNAMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: NarrativeDNAMemoryStore = {
    async read() {
      if (g.__moodNarrativeDNA) return g.__moodNarrativeDNA;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<NarrativeDNAMemoryState>;
        g.__moodNarrativeDNA = { ...createInitialNarrativeDNAMemory(), ...parsed };
      } catch {
        g.__moodNarrativeDNA = createInitialNarrativeDNAMemory();
      }
      return g.__moodNarrativeDNA;
    },
    async append(fp) {
      const cur = await store.read();
      const next: NarrativeDNAMemoryState = {
        ...cur,
        fingerprints: [...cur.fingerprints, fp].slice(-NARRATIVE_DNA_FINGERPRINT_LIMIT),
        totalObservations: cur.totalObservations + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? fp.at,
        updatedAt: nowMs(),
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.fingerprints = state.fingerprints.slice(-NARRATIVE_DNA_FINGERPRINT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodNarrativeDNA = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodNarrativeDNA = undefined;
    },
  };
  return store;
}

export async function recordNarrativeDNAFingerprint(banner: BannerForNarrativeDNA): Promise<void> {
  try {
    const fp = extractNarrativeFingerprint(banner);
    await createNarrativeDNAMemoryStore().append(fp);
  } catch {
    // non-fatal — never blocks generation
  }
}
