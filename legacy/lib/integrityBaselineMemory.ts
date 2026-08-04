/**
 * INTEGRITY BASELINE MEMORY
 *
 * Read frozen JSON baseline files from data/integrity-baselines/.
 * Each layer has its own baseline file:
 *   data/integrity-baselines/{layer}.json
 *
 * STRICTLY:
 *   - read-only by default (writeBaseline is gated behind explicit
 *     operator-script invocation — never invoked at runtime)
 *   - no automatic baseline rewriting
 *   - same baseline files → same comparison output
 *   - no critic imports / no external APIs / no spawn calls
 *
 * The system never modifies its own baselines at runtime.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { ShapeNode } from './integrityBaselineEngine';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'integrity-baselines');

// ─── known layers ─────────────────────────────────────────────

/** Every layer we anchor a baseline for. Names map 1:1 to the view
 *  builders / report functions that produce the shape. */
export const KNOWN_BASELINE_LAYERS = [
  'quality-longitudinal',
  'policy-audit',
  'cultural-perception',
  'cross-brain-conflict',
  'cognitive-weight',
  'identity-continuity',
  'executive-governance',
  'strategic-outcome',
  'counterfactual-cognition',
  'campaign-evolution',
  'branch-activation',
  'projection-calibration',
  'operator-confidence-preference',
  'operator-calibration-reconciliation',
  'system-integrity',
] as const;

export type KnownBaselineLayer = (typeof KNOWN_BASELINE_LAYERS)[number];

export function isKnownBaselineLayer(s: string): s is KnownBaselineLayer {
  return (KNOWN_BASELINE_LAYERS as readonly string[]).includes(s);
}

// ─── baseline file shape ──────────────────────────────────────

/** The frozen baseline file format. The `shape` field is the
 *  ShapeNode produced by deriveShape() on a known-good output. */
export interface BaselineFile {
  layer: string;
  anchoredAt: number;
  /** Hash of the shape (deterministic — same shape → same hash). */
  shapeFingerprint: string;
  /** Source describing how the baseline was anchored. */
  source: string;
  shape: ShapeNode;
}

// ─── deterministic fingerprint ────────────────────────────────

/** Stable canonical JSON: keys sorted alphabetically at every level.
 *  Same value → same canonical string → same FNV-1a hash. */
function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) {
    return '[' + value.map(canonicalJson).join(',') + ']';
  }
  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj).sort();
    return '{' + keys.map((k) => JSON.stringify(k) + ':' + canonicalJson(obj[k])).join(',') + '}';
  }
  return JSON.stringify(value);
}

/** FNV-1a 32-bit hash → hex string. Deterministic and pure. */
function fnv1aHex(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}

export function fingerprintShape(shape: ShapeNode): string {
  return `fnv1a-${fnv1aHex(canonicalJson(shape))}`;
}

// ─── read API (always available) ──────────────────────────────

export interface IntegrityBaselineReader {
  readBaseline(layer: string): Promise<BaselineFile | null>;
  readAll(): Promise<Record<string, BaselineFile | null>>;
}

export function createIntegrityBaselineReader(
  dir = DEFAULT_DIR,
): IntegrityBaselineReader {
  const filePath = (layer: string) => path.join(dir, `${layer}.json`);
  return {
    async readBaseline(layer) {
      try {
        const txt = await fs.readFile(filePath(layer), 'utf8');
        return JSON.parse(txt) as BaselineFile;
      } catch (e) {
        const err = e as NodeJS.ErrnoException;
        if (err.code === 'ENOENT') return null;
        throw e;
      }
    },
    async readAll() {
      const out: Record<string, BaselineFile | null> = {};
      for (const layer of KNOWN_BASELINE_LAYERS) {
        out[layer] = await this.readBaseline(layer);
      }
      return out;
    },
  };
}

// ─── write API (operator script only) ─────────────────────────

/**
 * Operator-script writer. ONLY invoked by
 * scripts/anchor-integrity-baselines.ts. The runtime API never
 * calls this. Calling code must show explicit intent — the function
 * name + caller location guard against accidental writes.
 *
 * Throws if called without `confirmOperatorIntent === true`.
 */
export interface AnchorBaselineRequest {
  layer: string;
  shape: ShapeNode;
  source: string;
  confirmOperatorIntent: true;
  dir?: string;
}

export async function anchorBaseline(req: AnchorBaselineRequest): Promise<BaselineFile> {
  if (req.confirmOperatorIntent !== true) {
    throw new Error(
      'anchorBaseline: refusing to write baseline without explicit operator intent. ' +
      'This function is only callable by scripts/anchor-integrity-baselines.ts.',
    );
  }
  const dir = req.dir ?? DEFAULT_DIR;
  const file: BaselineFile = {
    layer: req.layer,
    anchoredAt: Date.now(),
    shapeFingerprint: fingerprintShape(req.shape),
    source: req.source,
    shape: req.shape,
  };
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, `${req.layer}.json`), JSON.stringify(file, null, 2));
  return file;
}
