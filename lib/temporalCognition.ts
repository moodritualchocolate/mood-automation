/**
 * TEMPORAL COGNITION LAYER (Wave 18 — Memory Continuity)
 *
 * The threshold this layer crosses:
 *
 *   most systems perceive INTENSITY.
 *   this one learns DURATION.
 *
 * Built only from archives that already accumulate organically —
 * weather log, protection memory, contradiction scars, pressure
 * gateway. No new adapter, no new write surface. A pure derivation:
 *
 *   (archives, now) → TemporalCognitionReading
 *
 * The reading answers questions a moment-only system cannot:
 *
 *   - what SURVIVED?
 *   - what RETURNED later?
 *   - what DECAYED?
 *   - what quietly ACCUMULATED?
 *   - what MEANING PERSISTED after attention left?
 *
 * These are not analytics. They are first-class perceptions: each
 * field describes how the organism remembers, not how the dashboard
 * graphs. Where a metric would expose a number, this layer exposes
 * the temporal shape of that number — half-life, recovery span,
 * recurrence after silence.
 *
 * The architectural promise repeats here: this layer NEVER touches
 * cognitive weather, never digests pressure, never writes. It only
 * derives. Sovereignty is preserved by composition again.
 */

import type { WeatherLogState, WeatherSampleKind } from './weatherLogArchive';
import type { ProtectionMemoryState } from './protectionMemoryArchive';
import type { ContradictionScarsState, ContradictionKind } from './contradictionScarsArchive';
import type {
  PressureGatewayState,
  ExternalPressureReading,
  ExternalPressureKind,
} from './pressureIngestionGateway';

const PRESSURE_KINDS: ExternalPressureKind[] = [
  'audience-fatigue', 'cultural-tension', 'attention-availability',
  'sentiment-drift', 'resonance-decay', 'trust-velocity',
];

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

// Persistence threshold: a meaning that held for ≥ 24h counts as
// having survived attention. Reasonable for a runtime that samples
// every cycle, large enough that brief reactions don't count.
const PERSISTENCE_MIN_SPAN_MS = DAY_MS;
// Delayed resonance: a kind that goes quiet for ≥ 12h and then
// re-emerges. The gap must be long enough to count as "later."
const RETURN_GAP_MIN_MS = 12 * HOUR_MS;
// Slow emergence: a same-sign run of ≥ 5 readings over ≥ 2h with
// no single |swing| > 0.25 between readings (no spike).
const EMERGENCE_MIN_RUN = 5;
const EMERGENCE_MIN_SPAN_MS = 2 * HOUR_MS;
const EMERGENCE_MAX_STEP = 0.25;
// Recovery: a kind that peaked at ≥ 0.5 and is now ≤ 0.2 of that peak.
const RECOVERY_PEAK_MIN = 0.5;
const RECOVERY_NOW_FRACTION = 0.2;
// Trust compounding: ≥ 5 readings, ≥ 70% positive, span ≥ 1h.
const TRUST_MIN_READINGS = 5;
const TRUST_MIN_POSITIVE_SHARE = 0.7;
const TRUST_MIN_SPAN_MS = HOUR_MS;
// Persistent lesson: a scar older than 7 days with severity ≥ 6.
const LESSON_MIN_AGE_MS = 7 * DAY_MS;
const LESSON_MIN_SEVERITY = 6;

/** Weather transitions that count as coherent. Same-weather (no
 *  transition) auto-counts as coherent. Anything not in this set
 *  AND not same-weather is whiplash. */
const COHERENT_PAIRS: ReadonlySet<string> = new Set([
  'awake|breathing', 'breathing|awake',
  'breathing|hushed', 'hushed|breathing',
  'hushed|restrained', 'restrained|hushed',
  'restrained|strained', 'strained|restrained',
  'awake|flourishing', 'flourishing|awake',
  'breathing|flourishing', 'flourishing|breathing',
  'awake|strained', 'strained|awake',
  'breathing|strained', 'strained|breathing',
  'hushed|strained', 'strained|hushed',
  'dormant|awake',
]);

export interface PressureKindDynamics {
  kind: ExternalPressureKind;
  /** ms between first and last reading of this kind. */
  span_ms: number;
  /** How many readings of this kind appeared in the recent buffer. */
  occurrences: number;
  /** Approximate half-life — ms from the peak |vector| to the
   *  first subsequent reading at ≤ half the peak. null when the
   *  signal never decayed within the window. */
  half_life_ms: number | null;
  /** True when occurrences ≥ 3 AND span ≥ PERSISTENCE_MIN_SPAN_MS. */
  persisted: boolean;
}

export interface DelayedResonance {
  kind: ExternalPressureKind;
  /** When the original signal appeared. */
  first_at: number;
  /** When it returned after the gap. */
  returned_at: number;
  /** ms the kind was quiet before returning. */
  gap_ms: number;
}

export interface SlowEmergence {
  kind: ExternalPressureKind;
  /** Number of consecutive same-sign readings without a spike. */
  run_length: number;
  /** ms over which the run accumulated. */
  span_ms: number;
  /** Sign of the build. */
  direction: -1 | 1;
}

export interface RecoverySignal {
  kind: ExternalPressureKind;
  /** Peak |vector| ever observed in the recent buffer. */
  peak: number;
  /** Smoothed magnitude at the most recent point. */
  current: number;
  /** ms from peak observation to most recent reading. */
  recovery_span_ms: number;
}

export interface TrustCompounding {
  /** Count of trust-velocity readings observed in the window. */
  readings: number;
  /** Fraction with positive vector. */
  positive_share: number;
  /** Mean of the positive readings (average rate of trust growth). */
  mean_positive: number;
  /** ms span across the trust readings. */
  span_ms: number;
}

export interface PersistentLesson {
  kind: ContradictionKind;
  /** ms since this scar was recorded. */
  age_ms: number;
  /** Severity at time of recording. */
  severity: number;
  /** The one-line wisdom — still teaching after this much time. */
  wisdom: string;
}

export interface TemporalCognitionReading {
  /** Total ms observable across all archives. */
  observed_span_ms: number;
  /** Counts of what the layer actually saw. */
  data_points: {
    weather: number;
    protection: number;
    scars: number;
    pressure: number;
  };
  /** Per-kind shape of how pressure has moved over time. */
  pressure_dynamics: PressureKindDynamics[];
  /** Kinds that went quiet then returned later. */
  delayed_resonance: DelayedResonance[];
  /** Kinds building gradually without spikes. */
  slow_emergence: SlowEmergence[];
  /** Kinds that saturated then came back to baseline. */
  recovery_signals: RecoverySignal[];
  /** Trust accumulating slowly — null when not yet present. */
  trust_compounding: TrustCompounding | null;
  /** Lessons that have outlived the events that taught them. */
  persistent_lessons: PersistentLesson[];
  /** 0..1 — how coherent the weather trajectory has been. */
  temporal_coherence: number;
  /** A single sentence describing what the organism remembers. */
  felt_as: string;
}

export interface TemporalArchives {
  weatherLog?: WeatherLogState | null;
  protectionMemory?: ProtectionMemoryState | null;
  contradictionScars?: ContradictionScarsState | null;
  pressureGateway?: PressureGatewayState | null;
}

function safeNumber(n: number): number { return Number.isFinite(n) ? n : 0; }

/** Group recent pressure readings by kind, sorted chronologically. */
function groupPressureByKind(recent: ExternalPressureReading[]): Map<ExternalPressureKind, ExternalPressureReading[]> {
  const byKind = new Map<ExternalPressureKind, ExternalPressureReading[]>();
  for (const k of PRESSURE_KINDS) byKind.set(k, []);
  for (const r of recent) {
    const arr = byKind.get(r.kind);
    if (arr) arr.push(r);
  }
  for (const arr of byKind.values()) arr.sort((a, b) => a.at - b.at);
  return byKind;
}

function dynamicsFor(kind: ExternalPressureKind, readings: ExternalPressureReading[]): PressureKindDynamics {
  if (readings.length === 0) {
    return { kind, span_ms: 0, occurrences: 0, half_life_ms: null, persisted: false };
  }
  const first = readings[0]!.at;
  const last = readings[readings.length - 1]!.at;
  const span_ms = Math.max(0, last - first);

  // Half-life: find the peak |vector|, then walk forward to the
  // first reading at ≤ half the peak. Gap is the half-life.
  let peakIdx = 0;
  let peakMag = 0;
  for (let i = 0; i < readings.length; i++) {
    const m = Math.abs(readings[i]!.vector);
    if (m > peakMag) { peakMag = m; peakIdx = i; }
  }
  let half_life_ms: number | null = null;
  if (peakMag > 0.05) {
    const halfThreshold = peakMag / 2;
    for (let i = peakIdx + 1; i < readings.length; i++) {
      if (Math.abs(readings[i]!.vector) <= halfThreshold) {
        half_life_ms = readings[i]!.at - readings[peakIdx]!.at;
        break;
      }
    }
  }

  const persisted = readings.length >= 3 && span_ms >= PERSISTENCE_MIN_SPAN_MS;
  return { kind, span_ms, occurrences: readings.length, half_life_ms, persisted };
}

function findDelayedResonance(kind: ExternalPressureKind, readings: ExternalPressureReading[]): DelayedResonance | null {
  if (readings.length < 2) return null;
  // Find the largest gap between consecutive readings. If it
  // exceeds the threshold, the second reading is the return.
  let bestGap = 0;
  let bestPair: [number, number] | null = null;
  for (let i = 1; i < readings.length; i++) {
    const gap = readings[i]!.at - readings[i - 1]!.at;
    if (gap > bestGap) {
      bestGap = gap;
      bestPair = [readings[i - 1]!.at, readings[i]!.at];
    }
  }
  if (bestGap >= RETURN_GAP_MIN_MS && bestPair) {
    return { kind, first_at: bestPair[0], returned_at: bestPair[1], gap_ms: bestGap };
  }
  return null;
}

function findSlowEmergence(kind: ExternalPressureKind, readings: ExternalPressureReading[]): SlowEmergence | null {
  if (readings.length < EMERGENCE_MIN_RUN) return null;
  // Walk for the longest same-sign run where no single step
  // exceeds EMERGENCE_MAX_STEP. A clean monotonic build.
  let bestRun = 0;
  let bestStart = 0;
  let bestSign: -1 | 1 = 1;
  let currentRun = 1;
  let currentStart = 0;
  let currentSign: -1 | 1 = readings[0]!.vector >= 0 ? 1 : -1;
  for (let i = 1; i < readings.length; i++) {
    const sign: -1 | 1 = readings[i]!.vector >= 0 ? 1 : -1;
    const step = Math.abs(readings[i]!.vector - readings[i - 1]!.vector);
    const sameSign = sign === currentSign && Math.abs(readings[i]!.vector) >= 0.02;
    const noSpike = step <= EMERGENCE_MAX_STEP;
    if (sameSign && noSpike) {
      currentRun++;
    } else {
      if (currentRun > bestRun) { bestRun = currentRun; bestStart = currentStart; bestSign = currentSign; }
      currentRun = 1;
      currentStart = i;
      currentSign = sign;
    }
  }
  if (currentRun > bestRun) { bestRun = currentRun; bestStart = currentStart; bestSign = currentSign; }

  if (bestRun >= EMERGENCE_MIN_RUN) {
    const span_ms = readings[bestStart + bestRun - 1]!.at - readings[bestStart]!.at;
    if (span_ms >= EMERGENCE_MIN_SPAN_MS) {
      return { kind, run_length: bestRun, span_ms, direction: bestSign };
    }
  }
  return null;
}

function findRecovery(
  kind: ExternalPressureKind,
  readings: ExternalPressureReading[],
  smoothedNow: number,
): RecoverySignal | null {
  if (readings.length < 2) return null;
  let peakIdx = 0;
  let peakMag = 0;
  for (let i = 0; i < readings.length; i++) {
    const m = Math.abs(readings[i]!.vector);
    if (m > peakMag) { peakMag = m; peakIdx = i; }
  }
  if (peakMag < RECOVERY_PEAK_MIN) return null;
  const currentMag = Math.abs(smoothedNow);
  if (currentMag > peakMag * RECOVERY_NOW_FRACTION) return null;
  const lastAt = readings[readings.length - 1]!.at;
  const recovery_span_ms = lastAt - readings[peakIdx]!.at;
  if (recovery_span_ms <= 0) return null;
  return { kind, peak: peakMag, current: currentMag, recovery_span_ms };
}

function findTrustCompounding(byKind: Map<ExternalPressureKind, ExternalPressureReading[]>): TrustCompounding | null {
  const trust = byKind.get('trust-velocity') ?? [];
  if (trust.length < TRUST_MIN_READINGS) return null;
  const positives = trust.filter((r) => r.vector > 0);
  const positive_share = positives.length / trust.length;
  if (positive_share < TRUST_MIN_POSITIVE_SHARE) return null;
  const span_ms = trust[trust.length - 1]!.at - trust[0]!.at;
  if (span_ms < TRUST_MIN_SPAN_MS) return null;
  const mean_positive = positives.reduce((s, r) => s + r.vector, 0) / Math.max(1, positives.length);
  return {
    readings: trust.length,
    positive_share: safeNumber(positive_share),
    mean_positive: safeNumber(mean_positive),
    span_ms,
  };
}

function findPersistentLessons(scars: ContradictionScarsState | null | undefined, now: number): PersistentLesson[] {
  if (!scars || scars.scars.length === 0) return [];
  const lessons: PersistentLesson[] = [];
  for (const scar of scars.scars) {
    const age_ms = now - scar.at;
    if (age_ms >= LESSON_MIN_AGE_MS && scar.severity >= LESSON_MIN_SEVERITY) {
      lessons.push({ kind: scar.kind, age_ms, severity: scar.severity, wisdom: scar.wisdom });
    }
  }
  // Sort by severity descending, then by age ascending (fresher
  // severe lessons first).
  lessons.sort((a, b) => b.severity - a.severity || a.age_ms - b.age_ms);
  return lessons.slice(0, 5);
}

function temporalCoherence(weatherLog: WeatherLogState | null | undefined): number {
  const samples = weatherLog?.samples ?? [];
  if (samples.length < 2) return 1;
  let coherent = 0;
  let total = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!.weather;
    const b = samples[i]!.weather;
    total++;
    if (a === b) { coherent++; continue; }
    if (COHERENT_PAIRS.has(`${a}|${b}`)) coherent++;
  }
  return total === 0 ? 1 : coherent / total;
}

function summarize(reading: TemporalCognitionReading): string {
  const bits: string[] = [];
  const persisted = reading.pressure_dynamics.filter((d) => d.persisted).length;
  if (persisted > 0) bits.push(`${persisted} signal${persisted > 1 ? 's' : ''} persisting`);
  if (reading.delayed_resonance.length > 0) bits.push(`${reading.delayed_resonance.length} return${reading.delayed_resonance.length > 1 ? 's' : ''} after silence`);
  if (reading.slow_emergence.length > 0) bits.push(`${reading.slow_emergence.length} slow build${reading.slow_emergence.length > 1 ? 's' : ''}`);
  if (reading.recovery_signals.length > 0) bits.push(`${reading.recovery_signals.length} recovery cycle${reading.recovery_signals.length > 1 ? 's' : ''}`);
  if (reading.trust_compounding) bits.push('trust compounding');
  if (reading.persistent_lessons.length > 0) bits.push(`${reading.persistent_lessons.length} lesson${reading.persistent_lessons.length > 1 ? 's' : ''} still teaching`);
  if (bits.length === 0) return 'no durable signal yet — perception is still in the moment';
  const coherenceWord = reading.temporal_coherence >= 0.85 ? 'coherent' : reading.temporal_coherence >= 0.6 ? 'mostly coherent' : 'fragmented';
  return `${bits.join(' · ')} (trajectory ${coherenceWord})`;
}

/**
 * Derive the temporal cognition reading from the archives.
 *
 * Pure function: same archives + same `now` → same reading. No I/O,
 * no clock access, no side effects. The reading is meant to be
 * recomputed every time the dashboard refreshes; nothing about it
 * is persisted independently — duration emerges from the archives
 * that already accumulate.
 */
export function deriveTemporalCognition(
  archives: TemporalArchives,
  now: number,
): TemporalCognitionReading {
  const weather = archives.weatherLog?.samples ?? [];
  const protection = archives.protectionMemory?.events ?? [];
  const scars = archives.contradictionScars?.scars ?? [];
  const pressure = archives.pressureGateway?.recent ?? [];
  const smoothed = archives.pressureGateway?.smoothed;

  // Total observed span across every dated record we have.
  const allTimes: number[] = [];
  for (const s of weather) allTimes.push(s.at);
  for (const e of protection) allTimes.push(e.at);
  for (const s of scars) allTimes.push(s.at);
  for (const r of pressure) allTimes.push(r.at);
  const observed_span_ms = allTimes.length === 0 ? 0 : Math.max(0, Math.max(...allTimes) - Math.min(...allTimes));

  const byKind = groupPressureByKind(pressure);

  const pressure_dynamics: PressureKindDynamics[] = PRESSURE_KINDS
    .map((k) => dynamicsFor(k, byKind.get(k) ?? []))
    .filter((d) => d.occurrences > 0);

  const delayed_resonance: DelayedResonance[] = [];
  const slow_emergence: SlowEmergence[] = [];
  const recovery_signals: RecoverySignal[] = [];
  for (const kind of PRESSURE_KINDS) {
    const readings = byKind.get(kind) ?? [];
    const dr = findDelayedResonance(kind, readings);
    if (dr) delayed_resonance.push(dr);
    const se = findSlowEmergence(kind, readings);
    if (se) slow_emergence.push(se);
    if (smoothed) {
      const rs = findRecovery(kind, readings, smoothed[kind]);
      if (rs) recovery_signals.push(rs);
    }
  }

  const trust_compounding = findTrustCompounding(byKind);
  const persistent_lessons = findPersistentLessons(archives.contradictionScars ?? null, now);
  const temporal_coherence = temporalCoherence(archives.weatherLog ?? null);

  const reading: TemporalCognitionReading = {
    observed_span_ms,
    data_points: {
      weather: weather.length,
      protection: protection.length,
      scars: scars.length,
      pressure: pressure.length,
    },
    pressure_dynamics,
    delayed_resonance,
    slow_emergence,
    recovery_signals,
    trust_compounding,
    persistent_lessons,
    temporal_coherence: safeNumber(temporal_coherence),
    felt_as: '',
  };
  reading.felt_as = summarize(reading);
  return reading;
}
