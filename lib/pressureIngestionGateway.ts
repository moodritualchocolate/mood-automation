/**
 * PRESSURE INGESTION GATEWAY (Wave 17.7 — Embodied Runtime Presence)
 *
 * Architectural preparation for real-world coupling. External signals
 * (saves, repost velocity, sentiment drift, watch decay, attention
 * availability, trust velocity) eventually arrive from platforms;
 * they must never enter the organism raw. This gateway is where
 * they land — and where they slow down.
 *
 * The principle the user named:
 *   "external signals must enter as pressure — never commands."
 *
 * Three architectural commitments:
 *
 *   1.  Readings are typed and dimensional. Each one is a (kind,
 *       vector, confidence, source, at) tuple — never a raw value
 *       the organism is forced to obey.
 *
 *   2.  Ingestion is digestive, not reactive. Each kind has its own
 *       exponential moving average; the EMA alpha is small (default
 *       0.15) so a single spike does not move the smoothed state by
 *       more than 15% of the spike. Slow digestion is the whole
 *       point.
 *
 *   3.  The smoothed values can BIAS the atmosphere; they cannot
 *       SET the cognitive weather. Weather remains derived from
 *       internal state. Pressure adds vignette depth, nothing more.
 *
 * Persisted to data/runtime/pressure-gateway.json. Capped recent
 * raw-reading buffer (32); the EMAs are permanent state.
 *
 * No platform adapters are wired here. The gateway is ready to
 * receive readings when the first weak-signal adapter arrives.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

const DEFAULT_DIR = path.resolve(process.cwd(), 'data', 'runtime');
const FILE = 'pressure-gateway.json';
const MAX_RECENT = 32;

export type ExternalPressureKind =
  | 'audience-fatigue'        // saves dropping, watch time falling
  | 'cultural-tension'        // platform mood shifting
  | 'attention-availability'  // open window vs crowded feed
  | 'sentiment-drift'         // valence shifting in the field
  | 'resonance-decay'         // last meaning losing hold
  | 'trust-velocity';         // trust gaining or eroding faster than usual

/** A single external observation. -1..1 vector: negative = pressure
 *  away from action / inward; positive = invitation / outward. */
export interface ExternalPressureReading {
  kind: ExternalPressureKind;
  vector: number;
  /** 0..1 — confidence in this reading (low confidence → less digestion weight). */
  confidence: number;
  /** Free-form descriptor of source: 'instagram-saves', 'sentiment-stub', etc. */
  source: string;
  at: number;
}

export interface PressureGatewayState {
  bornAt: number;
  /** The smoothed pressure per kind, in [-1..1]. Slow EMA. */
  smoothed: Record<ExternalPressureKind, number>;
  /** Most recent raw readings, capped. */
  recent: ExternalPressureReading[];
  /** How many readings have been digested across the gateway's life. */
  readingsIngested: number;
  /** 0..1 — how slowly this organism metabolizes pressure. Higher =
   *  slower digestion. Default 0.85 means EMA alpha ≈ 0.15. */
  digestionInertia: number;
  updatedAt: number;
}

export function createInitialPressureGateway(): PressureGatewayState {
  return {
    bornAt: Date.now(),
    smoothed: {
      'audience-fatigue':        0,
      'cultural-tension':        0,
      'attention-availability':  0,
      'sentiment-drift':         0,
      'resonance-decay':         0,
      'trust-velocity':          0,
    },
    recent: [],
    readingsIngested: 0,
    digestionInertia: 0.85,
    updatedAt: Date.now(),
  };
}

const g = globalThis as unknown as { __moodPressureGateway?: PressureGatewayState };

export interface PressureGatewayStore {
  read(): Promise<PressureGatewayState>;
  save(state: PressureGatewayState): Promise<void>;
  reset(): Promise<void>;
}

export function createPressureGatewayStore(dir = process.env.MOOD_RUNTIME_DIR || DEFAULT_DIR): PressureGatewayStore {
  const filePath = path.join(dir, FILE);
  return {
    async read() {
      if (g.__moodPressureGateway) return g.__moodPressureGateway;
      try {
        const txt = await fs.readFile(filePath, 'utf8');
        g.__moodPressureGateway = { ...createInitialPressureGateway(), ...(JSON.parse(txt) as Partial<PressureGatewayState>) };
      } catch { g.__moodPressureGateway = createInitialPressureGateway(); }
      return g.__moodPressureGateway;
    },
    async save(state) {
      state.updatedAt = Date.now();
      g.__moodPressureGateway = state;
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(state, null, 2));
    },
    async reset() {
      try { await fs.unlink(filePath); } catch { /* idempotent */ }
      g.__moodPressureGateway = undefined;
    },
  };
}

function clamp(n: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, n)); }

/**
 * Digest one external reading into the gateway. The EMA alpha is
 * `(1 - digestionInertia) * confidence`, so:
 *
 *   - higher inertia → slower digestion
 *   - lower confidence → less weight given to this reading
 *
 * A single high-confidence spike at inertia 0.85 moves the smoothed
 * value by at most 15% toward the spike. To get the smoothed value
 * close to a sustained pressure, that pressure must hold across
 * many readings.
 */
export function digestPressure(
  state: PressureGatewayState,
  reading: ExternalPressureReading,
): PressureGatewayState {
  const v = clamp(reading.vector, -1, 1);
  const c = clamp(reading.confidence, 0, 1);
  const alpha = (1 - state.digestionInertia) * c;
  const previous = state.smoothed[reading.kind];
  const next = clamp(previous + (v - previous) * alpha, -1, 1);

  const smoothed = { ...state.smoothed, [reading.kind]: next };
  const recent = [...state.recent, { ...reading, vector: v, confidence: c }].slice(-MAX_RECENT);

  return {
    ...state,
    smoothed,
    recent,
    readingsIngested: state.readingsIngested + 1,
    updatedAt: Date.now(),
  };
}

/**
 * Net pressure across all kinds — a single magnitude in [0..1]
 * representing how loaded the organism's external field is. Used as
 * the bias contribution to the page vignette.
 *
 * Negative and positive vectors both contribute magnitude; the
 * organism feels pressure regardless of its sign. Saturation comes
 * from many pressures stacking, not from one extreme.
 */
export function pressureFieldMagnitude(state: PressureGatewayState): number {
  const values = Object.values(state.smoothed);
  if (values.length === 0) return 0;
  const sumAbs = values.reduce((s, v) => s + Math.abs(v), 0);
  // Average absolute value, then a gentle scaling so 0.5 average →
  // 0.6 magnitude (slightly above the linear mapping).
  const mean = sumAbs / values.length;
  return clamp(Math.pow(mean, 0.85), 0, 1);
}
