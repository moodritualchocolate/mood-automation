/**
 * VISUAL DNA MEMORY
 *
 * Persistent FIFO of deterministic VISUAL FINGERPRINTS extracted from
 * each generated banner. NOT image analysis — token extraction from
 * the structured banner.direction / banner.composition fields. The
 * tokens are stable across same inputs and serve as the substrate
 * for the creative fatigue engine.
 *
 * STRICT CONTRACT:
 *   - append-only, FIFO-capped
 *   - extracts only fields already present in the banner shape
 *   - never reads memories from other layers
 *   - never blocks generation
 *
 * Lives at data/memory/visual-dna-memory.json.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'memory');
const FILE = 'visual-dna-memory.json';

export const VISUAL_DNA_FINGERPRINT_LIMIT = 96;

// ─── shape ─────────────────────────────────────────────────────

export interface VisualFingerprint {
  at: number;
  bannerId: string;
  formula: string;
  campaignMode: string | null;
  /** layoutFamily · focalPoint · typographyDominance — the bones. */
  framingFingerprint: string;
  /** atmosphere · emotional family · color suggestion. */
  lightingSignature: string;
  /** focalPoint × productRole — what the lens is doing. */
  lensBehavior: string;
  /** layoutFamily × negativeSpaceBias — overall geometry. */
  compositionGeometry: string;
  /** Coarse pacing identity derived from negativeSpaceBias + tension. */
  pacingIdentity: string;
  /** Typography rhythm token (dominance + density). */
  typographyRhythm: string;
  /** Silence density — coarse 'low' / 'mid' / 'high'. */
  silenceDensity: string;
  /** Motion cadence — coarse from layout + product role. */
  motionCadence: string;
  /** Coarse color temperature — 'warm' / 'cool' / 'neutral' / 'desaturated'. */
  emotionalColorTemperature: string;
  /** 0..10 — heuristic from style signals. */
  realismLevel: number;
  /** 0..10 — heuristic, inverse of imperfection signals. */
  polishLevel: number;
}

export interface VisualDNAMemoryState {
  fingerprints: VisualFingerprint[];
  totalObservations: number;
  firstUpdatedAt: number | null;
  updatedAt: number;
}

const nowMs = (): number => Date.now();

export function createInitialVisualDNAMemory(): VisualDNAMemoryState {
  return { fingerprints: [], totalObservations: 0, firstUpdatedAt: null, updatedAt: nowMs() };
}

// ─── fingerprint extraction ───────────────────────────────────

/** Structural subset of a banner that the extractor reads. We
 *  intentionally accept a loose shape so the extractor never breaks
 *  when banner fields are missing or renamed. */
export interface BannerForVisualDNA {
  id: string;
  createdAt: number;
  formula: string;
  campaignMode?: string | null;
  state?: { family?: string; label?: string };
  direction?: {
    layoutFamily?: string;
    focalPoint?: string;
    typographyDominance?: string;
    productRole?: string;
    atmosphere?: string;
    restraint?: number;
  };
  composition?: {
    negativeSpaceBias?: string;
    typoZones?: { primary?: unknown; secondary?: unknown; timestamp?: unknown };
  };
  copywriter?: {
    emotionalFrame?: string;
    persuasionTone?: string;
  };
}

function safe(x: string | null | undefined): string {
  return (x ?? 'unknown').toString().toLowerCase().replace(/\s+/g, '-');
}

function densityFor(bias?: string): string {
  switch (bias) {
    case 'edge':   return 'low';
    case 'center': return 'high';
    case 'split':  return 'mid';
    case 'flush':  return 'low';
    default:       return 'mid';
  }
}

function colorTempFor(family?: string): string {
  switch (family) {
    case 'fatigue':         return 'desaturated';
    case 'pressure':        return 'warm';
    case 'overstimulation': return 'warm';
    case 'collapse':        return 'cool';
    case 'paralysis':       return 'cool';
    case 'numbness':        return 'neutral';
    case 'avoidance':       return 'neutral';
    case 'fragmentation':   return 'cool';
    default:                return 'neutral';
  }
}

function realismFrom(banner: BannerForVisualDNA): number {
  // Approximate realism = inverse of cinematic polish indicators.
  const family = banner.direction?.layoutFamily ?? '';
  const role = banner.direction?.productRole ?? '';
  let r = 6;
  if (family.includes('document')) r += 2;
  if (family.includes('editorial')) r += 1;
  if (role.includes('proof')) r += 1;
  if (role.includes('absent')) r -= 1;
  if ((banner.direction?.restraint ?? 0.5) >= 0.8) r += 1;
  return Math.max(0, Math.min(10, r));
}

function polishFrom(banner: BannerForVisualDNA): number {
  // Inverse of realism, biased toward 5 mid.
  return Math.max(0, Math.min(10, 10 - realismFrom(banner) + 1));
}

export function extractVisualFingerprint(banner: BannerForVisualDNA): VisualFingerprint {
  const layout = safe(banner.direction?.layoutFamily);
  const focal  = safe(banner.direction?.focalPoint);
  const typo   = safe(banner.direction?.typographyDominance);
  const role   = safe(banner.direction?.productRole);
  const atmosphere = safe(banner.direction?.atmosphere);
  const family = safe(banner.state?.family);
  const negBias = safe(banner.composition?.negativeSpaceBias);
  const typoSecondary = banner.composition?.typoZones?.secondary ? 'dual' : 'single';

  return {
    at: banner.createdAt,
    bannerId: banner.id,
    formula: banner.formula,
    campaignMode: banner.campaignMode ?? null,
    framingFingerprint:    `${layout}|${focal}|${typo}`,
    lightingSignature:     `${atmosphere}|${family}`,
    lensBehavior:          `${focal}×${role}`,
    compositionGeometry:   `${layout}|${negBias}`,
    pacingIdentity:        `${negBias}|restraint-${banner.direction?.restraint?.toFixed(1) ?? '0.5'}`,
    typographyRhythm:      `${typo}|${typoSecondary}`,
    silenceDensity:        densityFor(banner.composition?.negativeSpaceBias),
    motionCadence:         `${layout}|${role}`,
    emotionalColorTemperature: colorTempFor(banner.state?.family),
    realismLevel:          realismFrom(banner),
    polishLevel:           polishFrom(banner),
  };
}

// ─── store ─────────────────────────────────────────────────────

const g = globalThis as unknown as { __moodVisualDNA?: VisualDNAMemoryState };

export interface VisualDNAMemoryStore {
  read(): Promise<VisualDNAMemoryState>;
  append(fp: VisualFingerprint): Promise<VisualDNAMemoryState>;
  save(state: VisualDNAMemoryState): Promise<void>;
  reset(): Promise<void>;
}

export function createVisualDNAMemoryStore(
  dir = process.env.MOOD_MEMORY_DIR || DEFAULT_DIR,
): VisualDNAMemoryStore {
  const filePath = path.join(dir, FILE);
  const store: VisualDNAMemoryStore = {
    async read() {
      if (g.__moodVisualDNA) return g.__moodVisualDNA;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        const parsed = JSON.parse(txt) as Partial<VisualDNAMemoryState>;
        g.__moodVisualDNA = { ...createInitialVisualDNAMemory(), ...parsed };
      } catch {
        g.__moodVisualDNA = createInitialVisualDNAMemory();
      }
      return g.__moodVisualDNA;
    },
    async append(fp) {
      const cur = await store.read();
      const next: VisualDNAMemoryState = {
        ...cur,
        fingerprints: [...cur.fingerprints, fp].slice(-VISUAL_DNA_FINGERPRINT_LIMIT),
        totalObservations: cur.totalObservations + 1,
        firstUpdatedAt: cur.firstUpdatedAt ?? fp.at,
        updatedAt: nowMs(),
      };
      await store.save(next);
      return next;
    },
    async save(state) {
      state.fingerprints = state.fingerprints.slice(-VISUAL_DNA_FINGERPRINT_LIMIT);
      state.updatedAt = nowMs();
      g.__moodVisualDNA = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodVisualDNA = undefined;
    },
  };
  return store;
}

export async function recordVisualDNAFingerprint(banner: BannerForVisualDNA): Promise<void> {
  try {
    const fp = extractVisualFingerprint(banner);
    await createVisualDNAMemoryStore().append(fp);
  } catch {
    // non-fatal — never blocks generation
  }
}
