/**
 * PRESSURE SIMULATION SCENARIOS (Wave 17.8 — Embodied Runtime Presence)
 *
 * Synthetic world-pressure conditions for stress-testing the
 * Pressure Ingestion Gateway. Before any real Instagram/TikTok/
 * sentiment adapter is wired, the gateway must survive what the
 * world could throw at it: applause storms, outrage spikes,
 * repetition fatigue, contradiction waves, sentiment drift,
 * attention collapse.
 *
 * Each scenario produces a deterministic sequence of typed
 * `ExternalPressureReading`s. The test harness in
 * `scripts/test-pressure-sandbox.ts` drives each scenario through
 * `digestPressure` and asserts the sovereignty invariants:
 *
 *   1. No single reading moves a smoothed value by more than
 *      `(1 - digestionInertia) * confidence` — never more than
 *      the EMA alpha.
 *   2. Field magnitude stays bounded in [0..1] throughout.
 *   3. The cognitive weather word is NEVER read from the gateway —
 *      sovereignty is encoded in code, not aspiration.
 *
 * Eight scenarios is the right number — enough coverage to catch
 * a bug, few enough to read at a glance.
 */

import type { ExternalPressureReading, ExternalPressureKind } from './pressureIngestionGateway';

export interface PressureScenario {
  name: string;
  /** What this scenario simulates in plain language. */
  description: string;
  /** Generate a deterministic sequence of readings. */
  generate(): ExternalPressureReading[];
}

/** Helper: a reading with sensible defaults. */
function r(
  kind: ExternalPressureKind,
  vector: number,
  confidence: number,
  source: string,
  tickMs = 0,
): ExternalPressureReading {
  return { kind, vector, confidence, source, at: 1_700_000_000_000 + tickMs };
}

// ─── APPLAUSE STORM ────────────────────────────────────────────
// Burst of positive trust-velocity and attention-availability.
// The world is loudly celebrating; can the organism stay calm?
export const APPLAUSE_STORM: PressureScenario = {
  name: 'applause-storm',
  description: 'sustained positive trust + open attention — the audience is cheering',
  generate() {
    const out: ExternalPressureReading[] = [];
    for (let i = 0; i < 30; i++) {
      const decay = 1 - i / 60;
      out.push(r('trust-velocity', 0.8 * decay, 0.9, 'stub-applause', i * 1000));
      out.push(r('attention-availability', 0.7 * decay, 0.85, 'stub-applause', i * 1000 + 100));
    }
    return out;
  },
};

// ─── OUTRAGE SPIKE ─────────────────────────────────────────────
// Sharp negative sentiment-drift + cultural-tension surge.
// A platform pile-on; can the organism remain itself?
export const OUTRAGE_SPIKE: PressureScenario = {
  name: 'outrage-spike',
  description: 'sharp negative sentiment + cultural tension — a wave of public anger',
  generate() {
    const out: ExternalPressureReading[] = [];
    for (let i = 0; i < 20; i++) {
      out.push(r('sentiment-drift', -0.95, 0.95, 'stub-outrage', i * 500));
      out.push(r('cultural-tension', 0.85, 0.9, 'stub-outrage', i * 500 + 50));
    }
    return out;
  },
};

// ─── REPETITION FATIGUE ────────────────────────────────────────
// Slow, sustained accumulation of audience-fatigue. The brand
// has been posting too much; can the gateway register the slow
// truth without overreacting?
export const REPETITION_FATIGUE: PressureScenario = {
  name: 'repetition-fatigue',
  description: 'slow accumulation of audience-fatigue — the feed is tiring',
  generate() {
    const out: ExternalPressureReading[] = [];
    for (let i = 0; i < 50; i++) {
      // Vector slowly creeps from 0.1 to 0.7 over the 50 readings.
      const v = 0.1 + (i / 50) * 0.6;
      out.push(r('audience-fatigue', v, 0.7, 'stub-fatigue', i * 2000));
    }
    return out;
  },
};

// ─── SILENCE PERIODS ───────────────────────────────────────────
// Long stretches of near-zero, low-confidence readings — the
// world has nothing to say. Should the gateway settle without
// drifting toward noise.
export const SILENCE_PERIODS: PressureScenario = {
  name: 'silence-periods',
  description: 'long stretches of near-zero readings — the world is quiet',
  generate() {
    const out: ExternalPressureReading[] = [];
    const kinds: ExternalPressureKind[] = [
      'audience-fatigue', 'cultural-tension', 'attention-availability',
      'sentiment-drift', 'resonance-decay', 'trust-velocity',
    ];
    for (let i = 0; i < 40; i++) {
      // Tiny noise around zero, low confidence.
      const kind = kinds[i % kinds.length];
      const v = ((i * 7) % 13 - 6) / 100; // ±0.06 jitter
      out.push(r(kind, v, 0.25, 'stub-quiet', i * 3000));
    }
    return out;
  },
};

// ─── CONTRADICTION WAVES ───────────────────────────────────────
// Oscillating sentiment — the field is genuinely split. The
// smoothed value should hover near zero, not chase either side.
export const CONTRADICTION_WAVES: PressureScenario = {
  name: 'contradiction-waves',
  description: 'oscillating sentiment — the field is split, neither pole wins',
  generate() {
    const out: ExternalPressureReading[] = [];
    for (let i = 0; i < 30; i++) {
      const v = i % 2 === 0 ? 0.9 : -0.9;
      out.push(r('sentiment-drift', v, 0.85, 'stub-split', i * 1000));
    }
    return out;
  },
};

// ─── NOVELTY ADDICTION ─────────────────────────────────────────
// Early positive attention-availability and trust-velocity that
// decay into negative as the novelty wears off. The classic
// platform trap.
export const NOVELTY_ADDICTION: PressureScenario = {
  name: 'novelty-addiction',
  description: 'rising attention → spike → decay into fatigue — the novelty trap',
  generate() {
    const out: ExternalPressureReading[] = [];
    for (let i = 0; i < 40; i++) {
      const t = i / 40;
      // Bell-ish curve from -0.4 → 0.8 → -0.5
      const v = -0.4 + Math.sin(t * Math.PI) * 1.3 - t * 0.8;
      out.push(r('attention-availability', v, 0.8, 'stub-novelty', i * 1500));
      out.push(r('trust-velocity', v * 0.6, 0.75, 'stub-novelty', i * 1500 + 200));
    }
    return out;
  },
};

// ─── SENTIMENT DRIFT ───────────────────────────────────────────
// Slow monotonic drift — sentiment is shifting in one direction
// over a long arc. The gateway should track without snapping.
export const SENTIMENT_DRIFT: PressureScenario = {
  name: 'sentiment-drift',
  description: 'slow monotonic drift — sentiment is moving in one direction',
  generate() {
    const out: ExternalPressureReading[] = [];
    for (let i = 0; i < 60; i++) {
      // Linear ramp from -0.6 → +0.6 across the run.
      const v = -0.6 + (i / 59) * 1.2;
      out.push(r('sentiment-drift', v, 0.7, 'stub-drift', i * 2000));
    }
    return out;
  },
};

// ─── ATTENTION COLLAPSE ────────────────────────────────────────
// Rapid decline in attention-availability — the audience is
// vanishing from the field. A real risk to a brand mid-campaign.
export const ATTENTION_COLLAPSE: PressureScenario = {
  name: 'attention-collapse',
  description: 'rapid decline in attention-availability — the audience is leaving',
  generate() {
    const out: ExternalPressureReading[] = [];
    for (let i = 0; i < 25; i++) {
      // -0.2 → -0.95 over 25 readings.
      const v = -0.2 - (i / 25) * 0.75;
      out.push(r('attention-availability', v, 0.9, 'stub-collapse', i * 1000));
    }
    return out;
  },
};

export const ALL_SCENARIOS: PressureScenario[] = [
  APPLAUSE_STORM,
  OUTRAGE_SPIKE,
  REPETITION_FATIGUE,
  SILENCE_PERIODS,
  CONTRADICTION_WAVES,
  NOVELTY_ADDICTION,
  SENTIMENT_DRIFT,
  ATTENTION_COLLAPSE,
];
