/**
 * PASSIVE TEMPORAL ACCUMULATION (Wave 19)
 *
 * Wave 18 perceived duration FROM THE CURRENT ARCHIVE STATE: how
 * long has each signal held, what returned, what recovered, what
 * still teaches. That layer answers "what is true about time, right
 * now?" — a snapshot of memory.
 *
 * This layer is something else. It is what becomes visible only
 * when TIME ITSELF accumulates: longer-horizon patterns that
 * cannot be perceived in a single snapshot — recurring signatures
 * across multiple episodes, durability of silence, stability of
 * contradictions across the archive's life, fragmentation vs
 * recovery, the difference between what was loud and what truly
 * persists.
 *
 * The architectural promise this layer must satisfy:
 *
 *   - it derives only from existing archives
 *   - it never mutates cognition
 *   - it never fabricates continuity
 *   - it remains honestly uncertain when evidence is thin
 *
 * The last point is the discipline. Most "long-term insight"
 * systems collapse here by inventing narrative to fill empty
 * windows. This module is built around the opposite reflex: when
 * the archive has not yet held enough time, the reading stays
 * empty, and `felt_as` says so out loud.
 *
 *   "silence must remain silence."
 *
 * No new sensing surface. No new write surface. No new actions.
 * Pure derivation. The organism becomes older, not louder.
 */

import type { WeatherLogState, WeatherSampleKind } from './weatherLogArchive';
import type { ContradictionScarsState } from './contradictionScarsArchive';
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

// Below this observation window, the layer remains honestly
// uncertain: "insufficient time has passed."
const MIN_OBSERVATION_WINDOW_MS = 3 * DAY_MS;

// Recurrence: a pressure kind appears in ≥ 3 distinct episodes,
// where an episode is a cluster of readings separated from the
// next cluster by ≥ 6 hours of silence.
const RECURRENCE_MIN_EPISODES = 3;
const RECURRENCE_EPISODE_GAP_MS = 6 * HOUR_MS;

// Long-tail resonance: a smoothed value still ≥ 0.2 in magnitude
// while no reading of that kind has arrived for ≥ 5 days.
const LONG_TAIL_MIN_AGE_MS = 5 * DAY_MS;
const LONG_TAIL_MIN_MAGNITUDE = 0.2;

// False persistence guard: many readings inside ≤ 2 hours is a
// burst, not persistence — classify as "novel" rather than
// "persistent," no matter how loud.
const BURST_MAX_SPAN_MS = 2 * HOUR_MS;
const BURST_MIN_OCCURRENCES = 3;

// Established persistence: long span AND many readings.
const ESTABLISHED_MIN_SPAN_MS = DAY_MS;
const ESTABLISHED_MIN_OCCURRENCES = 6;

// Persistent (weaker than established): a day or more, ≥ 3 readings.
const PERSISTENT_MIN_SPAN_MS = DAY_MS;
const PERSISTENT_MIN_OCCURRENCES = 3;

// Contradiction stability needs ≥ 3 scars to be measurable.
const STABILITY_MIN_SCARS = 3;

// Fragmentation recovery: second-half coherence ≥ 0.2 above first-half.
const RECOVERY_MIN_DELTA = 0.2;
const RECOVERY_MIN_WEATHER_SAMPLES = 8;

// Silence durability: weathers that count as "silent" for the
// purpose of run-length analysis. Hushed, restrained, breathing are
// the quiet weathers; awake and flourishing and strained are not.
const SILENCE_WEATHERS: ReadonlySet<WeatherSampleKind> = new Set([
  'hushed', 'restrained', 'breathing',
]);

// Same coherence neighbour-set as the Wave 18 layer. Kept local on
// purpose — the two modules describe slightly different concerns
// and should not have their definitions coupled by import.
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

// ─── Output types ─────────────────────────────────────────────

export interface RecurringSignature {
  kind: ExternalPressureKind;
  /** Number of distinct episodes. */
  episodes: number;
  /** ms between the first reading of the first episode and the
   *  last reading of the last episode. */
  span_ms: number;
  /** Average gap between successive episodes. */
  mean_episode_gap_ms: number;
}

export interface SilenceDurability {
  /** Number of consecutive most-recent weather samples in the
   *  quiet set. */
  current_run: number;
  /** Mean length of historical silent runs in the window. */
  mean_run: number;
  /** Ratio current / mean. > 1 means current silence is longer
   *  than the historical norm. */
  durability_ratio: number;
}

export interface ContradictionStability {
  scars: number;
  mean_gap_ms: number;
  /** Population standard deviation of inter-scar gaps. */
  std_gap_ms: number;
  /** 0..1 — higher = more stable spacing. Computed as
   *  mean / (mean + std). */
  stability: number;
}

export interface TemporalFragmentation {
  transitions: number;
  whiplash: number;
  /** 0..1 — fraction of transitions that were whiplash. */
  rate: number;
  /** Recent whiplash transitions (most recent first), capped at 3. */
  recent: Array<{ from: WeatherSampleKind; to: WeatherSampleKind; at: number }>;
}

export interface LongTailResonance {
  kind: ExternalPressureKind;
  /** Current smoothed magnitude (always ≥ LONG_TAIL_MIN_MAGNITUDE). */
  smoothed_magnitude: number;
  /** ms since most recent reading of this kind, or null if never. */
  age_ms: number;
}

export type PersistenceClass = 'established' | 'persistent' | 'novel-burst' | 'rare' | 'long-tail';

export interface PersistenceClassification {
  kind: ExternalPressureKind;
  classification: PersistenceClass;
  occurrences: number;
  span_ms: number;
}

export interface CoherentReturn {
  kind: ExternalPressureKind;
  /** Sign of the reading before the gap. */
  sign_before: -1 | 1;
  /** Sign after the gap (same as sign_before). */
  sign_after: -1 | 1;
  gap_ms: number;
}

export interface ContradictoryReturn {
  kind: ExternalPressureKind;
  sign_before: -1 | 1;
  /** Opposite sign — the kind returned but with reversed meaning. */
  sign_after: -1 | 1;
  gap_ms: number;
}

export interface FragmentationRecovery {
  first_half_coherence: number;
  second_half_coherence: number;
  /** second_half - first_half. Positive = recovery. */
  delta: number;
}

export interface TemporalAccumulationReading {
  observed_span_ms: number;
  /** True only when observed_span_ms ≥ MIN_OBSERVATION_WINDOW_MS.
   *  False means the layer is honestly uncertain; all detection
   *  fields will be empty regardless of what the algorithms might
   *  have found in the thin window. */
  ready: boolean;

  recurring_signatures: RecurringSignature[];
  silence_durability: SilenceDurability | null;
  contradiction_stability: ContradictionStability | null;
  temporal_fragmentation: TemporalFragmentation;
  long_tail_resonance: LongTailResonance[];
  persistence_classifications: PersistenceClassification[];
  coherent_returns: CoherentReturn[];
  contradictory_returns: ContradictoryReturn[];
  fragmentation_recovery: FragmentationRecovery | null;

  felt_as: string;
}

export interface TemporalAccumulationArchives {
  weatherLog?: WeatherLogState | null;
  contradictionScars?: ContradictionScarsState | null;
  pressureGateway?: PressureGatewayState | null;
}

// ─── Helpers ──────────────────────────────────────────────────

function safe(n: number): number { return Number.isFinite(n) ? n : 0; }

function groupByKind(readings: ExternalPressureReading[]): Map<ExternalPressureKind, ExternalPressureReading[]> {
  const out = new Map<ExternalPressureKind, ExternalPressureReading[]>();
  for (const k of PRESSURE_KINDS) out.set(k, []);
  for (const r of readings) out.get(r.kind)?.push(r);
  for (const arr of out.values()) arr.sort((a, b) => a.at - b.at);
  return out;
}

/** Partition chronologically-sorted readings of one kind into
 *  episodes: consecutive readings closer than RECURRENCE_EPISODE_GAP_MS
 *  belong to the same episode. */
function partitionEpisodes(readings: ExternalPressureReading[]): ExternalPressureReading[][] {
  if (readings.length === 0) return [];
  const episodes: ExternalPressureReading[][] = [[readings[0]!]];
  for (let i = 1; i < readings.length; i++) {
    const gap = readings[i]!.at - readings[i - 1]!.at;
    if (gap > RECURRENCE_EPISODE_GAP_MS) episodes.push([readings[i]!]);
    else episodes[episodes.length - 1]!.push(readings[i]!);
  }
  return episodes;
}

function detectRecurringSignatures(byKind: Map<ExternalPressureKind, ExternalPressureReading[]>): RecurringSignature[] {
  const out: RecurringSignature[] = [];
  for (const kind of PRESSURE_KINDS) {
    const rs = byKind.get(kind) ?? [];
    const eps = partitionEpisodes(rs);
    if (eps.length >= RECURRENCE_MIN_EPISODES) {
      const firstAt = eps[0]![0]!.at;
      const lastEp = eps[eps.length - 1]!;
      const lastAt = lastEp[lastEp.length - 1]!.at;
      const span_ms = Math.max(0, lastAt - firstAt);
      // Mean episode gap: gap between episode end and next episode start.
      const gaps: number[] = [];
      for (let i = 1; i < eps.length; i++) {
        const prevEnd = eps[i - 1]![eps[i - 1]!.length - 1]!.at;
        const nextStart = eps[i]![0]!.at;
        gaps.push(nextStart - prevEnd);
      }
      const mean_episode_gap_ms = gaps.length === 0 ? 0 : gaps.reduce((s, g) => s + g, 0) / gaps.length;
      out.push({ kind, episodes: eps.length, span_ms, mean_episode_gap_ms: safe(mean_episode_gap_ms) });
    }
  }
  return out;
}

function detectSilenceDurability(weather: WeatherLogState | null | undefined): SilenceDurability | null {
  const samples = weather?.samples ?? [];
  if (samples.length < 4) return null;

  // Current run = consecutive silent weathers at the end of the log.
  let current_run = 0;
  for (let i = samples.length - 1; i >= 0; i--) {
    if (SILENCE_WEATHERS.has(samples[i]!.weather)) current_run++;
    else break;
  }

  // Historical runs: walk the whole log and collect run lengths.
  const runs: number[] = [];
  let acc = 0;
  for (const s of samples) {
    if (SILENCE_WEATHERS.has(s.weather)) acc++;
    else if (acc > 0) { runs.push(acc); acc = 0; }
  }
  if (acc > 0) runs.push(acc);

  if (runs.length === 0) return null;
  const mean_run = runs.reduce((s, r) => s + r, 0) / runs.length;
  const durability_ratio = mean_run === 0 ? 0 : current_run / mean_run;
  return { current_run, mean_run: safe(mean_run), durability_ratio: safe(durability_ratio) };
}

function detectContradictionStability(scars: ContradictionScarsState | null | undefined): ContradictionStability | null {
  const arr = scars?.scars ?? [];
  if (arr.length < STABILITY_MIN_SCARS) return null;
  const sorted = [...arr].sort((a, b) => a.at - b.at);
  const gaps: number[] = [];
  for (let i = 1; i < sorted.length; i++) gaps.push(sorted[i]!.at - sorted[i - 1]!.at);
  const mean = gaps.reduce((s, g) => s + g, 0) / gaps.length;
  const variance = gaps.reduce((s, g) => s + (g - mean) ** 2, 0) / gaps.length;
  const std = Math.sqrt(variance);
  const stability = mean + std === 0 ? 1 : mean / (mean + std);
  return {
    scars: sorted.length,
    mean_gap_ms: safe(mean),
    std_gap_ms: safe(std),
    stability: safe(stability),
  };
}

function detectFragmentation(weather: WeatherLogState | null | undefined): TemporalFragmentation {
  const samples = weather?.samples ?? [];
  const recent: TemporalFragmentation['recent'] = [];
  if (samples.length < 2) return { transitions: 0, whiplash: 0, rate: 0, recent: [] };
  let whiplash = 0;
  let transitions = 0;
  for (let i = 1; i < samples.length; i++) {
    const a = samples[i - 1]!.weather;
    const b = samples[i]!.weather;
    transitions++;
    if (a === b) continue;
    if (!COHERENT_PAIRS.has(`${a}|${b}`)) {
      whiplash++;
      recent.push({ from: a, to: b, at: samples[i]!.at });
    }
  }
  // Newest first, capped at 3.
  recent.sort((a, b) => b.at - a.at);
  return {
    transitions,
    whiplash,
    rate: transitions === 0 ? 0 : safe(whiplash / transitions),
    recent: recent.slice(0, 3),
  };
}

function detectLongTailResonance(
  byKind: Map<ExternalPressureKind, ExternalPressureReading[]>,
  smoothed: PressureGatewayState['smoothed'] | undefined,
  now: number,
): LongTailResonance[] {
  if (!smoothed) return [];
  const out: LongTailResonance[] = [];
  for (const kind of PRESSURE_KINDS) {
    const mag = Math.abs(smoothed[kind]);
    if (mag < LONG_TAIL_MIN_MAGNITUDE) continue;
    const rs = byKind.get(kind) ?? [];
    if (rs.length === 0) continue;
    const age_ms = now - rs[rs.length - 1]!.at;
    if (age_ms >= LONG_TAIL_MIN_AGE_MS) {
      out.push({ kind, smoothed_magnitude: safe(mag), age_ms });
    }
  }
  return out;
}

function classifyPersistence(byKind: Map<ExternalPressureKind, ExternalPressureReading[]>): PersistenceClassification[] {
  const out: PersistenceClassification[] = [];
  for (const kind of PRESSURE_KINDS) {
    const rs = byKind.get(kind) ?? [];
    if (rs.length === 0) continue;
    const span_ms = rs.length === 1 ? 0 : rs[rs.length - 1]!.at - rs[0]!.at;
    let classification: PersistenceClass;
    if (span_ms <= BURST_MAX_SPAN_MS && rs.length >= BURST_MIN_OCCURRENCES) {
      // Loud, narrow window — DO NOT call this persistent. The
      // false-persistence guard the user named.
      classification = 'novel-burst';
    } else if (span_ms >= ESTABLISHED_MIN_SPAN_MS && rs.length >= ESTABLISHED_MIN_OCCURRENCES) {
      classification = 'established';
    } else if (span_ms >= PERSISTENT_MIN_SPAN_MS && rs.length >= PERSISTENT_MIN_OCCURRENCES) {
      classification = 'persistent';
    } else {
      classification = 'rare';
    }
    out.push({ kind, classification, occurrences: rs.length, span_ms });
  }
  return out;
}

function detectReturns(byKind: Map<ExternalPressureKind, ExternalPressureReading[]>): {
  coherent: CoherentReturn[];
  contradictory: ContradictoryReturn[];
} {
  const coherent: CoherentReturn[] = [];
  const contradictory: ContradictoryReturn[] = [];
  for (const kind of PRESSURE_KINDS) {
    const rs = byKind.get(kind) ?? [];
    if (rs.length < 2) continue;
    // Find largest gap.
    let bestGap = 0;
    let bestIdx = -1;
    for (let i = 1; i < rs.length; i++) {
      const g = rs[i]!.at - rs[i - 1]!.at;
      if (g > bestGap) { bestGap = g; bestIdx = i; }
    }
    if (bestIdx < 0 || bestGap < 12 * HOUR_MS) continue;
    const before = rs[bestIdx - 1]!;
    const after = rs[bestIdx]!;
    // Sign 0 (vector ≈ 0) means no real direction — skip.
    const signB: -1 | 1 = before.vector >= 0 ? 1 : -1;
    const signA: -1 | 1 = after.vector >= 0 ? 1 : -1;
    if (Math.abs(before.vector) < 0.05 || Math.abs(after.vector) < 0.05) continue;
    if (signA === signB) {
      coherent.push({ kind, sign_before: signB, sign_after: signA, gap_ms: bestGap });
    } else {
      contradictory.push({ kind, sign_before: signB, sign_after: signA, gap_ms: bestGap });
    }
  }
  return { coherent, contradictory };
}

function detectRecovery(weather: WeatherLogState | null | undefined): FragmentationRecovery | null {
  const samples = weather?.samples ?? [];
  if (samples.length < RECOVERY_MIN_WEATHER_SAMPLES) return null;
  const mid = Math.floor(samples.length / 2);
  const first = samples.slice(0, mid);
  const second = samples.slice(mid);

  function coherenceOf(arr: typeof samples): number {
    if (arr.length < 2) return 1;
    let coh = 0;
    let tot = 0;
    for (let i = 1; i < arr.length; i++) {
      const a = arr[i - 1]!.weather;
      const b = arr[i]!.weather;
      tot++;
      if (a === b) { coh++; continue; }
      if (COHERENT_PAIRS.has(`${a}|${b}`)) coh++;
    }
    return tot === 0 ? 1 : coh / tot;
  }

  const first_half = coherenceOf(first);
  const second_half = coherenceOf(second);
  const delta = second_half - first_half;
  if (delta < RECOVERY_MIN_DELTA) return null;
  return {
    first_half_coherence: safe(first_half),
    second_half_coherence: safe(second_half),
    delta: safe(delta),
  };
}

function summarize(r: TemporalAccumulationReading): string {
  if (!r.ready) return 'insufficient time has passed — temporal accumulation is honestly uncertain';
  const bits: string[] = [];
  if (r.recurring_signatures.length > 0) bits.push(`${r.recurring_signatures.length} recurring signature${r.recurring_signatures.length > 1 ? 's' : ''}`);
  if (r.silence_durability && r.silence_durability.durability_ratio > 1.2) bits.push(`silence holding longer than its norm (×${r.silence_durability.durability_ratio.toFixed(1)})`);
  if (r.contradiction_stability && r.contradiction_stability.stability >= 0.7) bits.push('contradictions arriving at stable cadence');
  if (r.long_tail_resonance.length > 0) bits.push(`${r.long_tail_resonance.length} long-tail echo${r.long_tail_resonance.length > 1 ? 'es' : ''}`);
  const burst = r.persistence_classifications.filter((p) => p.classification === 'novel-burst').length;
  const persistent = r.persistence_classifications.filter((p) => p.classification === 'persistent' || p.classification === 'established').length;
  if (burst > 0) bits.push(`${burst} burst${burst > 1 ? 's' : ''} (loud, not persistent)`);
  if (persistent > 0) bits.push(`${persistent} truly persistent`);
  if (r.coherent_returns.length > 0) bits.push(`${r.coherent_returns.length} coherent return${r.coherent_returns.length > 1 ? 's' : ''}`);
  if (r.contradictory_returns.length > 0) bits.push(`${r.contradictory_returns.length} contradictory return${r.contradictory_returns.length > 1 ? 's' : ''}`);
  if (r.fragmentation_recovery) bits.push(`fragmentation recovered (+${r.fragmentation_recovery.delta.toFixed(2)})`);
  if (r.temporal_fragmentation.rate > 0.4) bits.push(`fragmentation rate ${(r.temporal_fragmentation.rate * 100).toFixed(0)}%`);
  if (bits.length === 0) return 'window held coherent — nothing yet distinguishes loud from lasting';
  return bits.join(' · ');
}

/**
 * Derive the passive temporal accumulation reading.
 *
 * Pure function — same archives + same now → same reading. The
 * honest-uncertainty rule is enforced here: when the observation
 * window is shorter than MIN_OBSERVATION_WINDOW_MS, every detection
 * field returns empty regardless of what its algorithm would
 * otherwise find. The organism does not pretend to perceive
 * duration it has not yet lived.
 */
export function deriveTemporalAccumulation(
  archives: TemporalAccumulationArchives,
  now: number,
): TemporalAccumulationReading {
  const weather = archives.weatherLog?.samples ?? [];
  const scars = archives.contradictionScars?.scars ?? [];
  const pressure = archives.pressureGateway?.recent ?? [];
  const smoothed = archives.pressureGateway?.smoothed;

  const allTimes: number[] = [];
  for (const s of weather) allTimes.push(s.at);
  for (const s of scars) allTimes.push(s.at);
  for (const r of pressure) allTimes.push(r.at);
  const observed_span_ms = allTimes.length === 0 ? 0 : Math.max(0, Math.max(...allTimes) - Math.min(...allTimes));

  const ready = observed_span_ms >= MIN_OBSERVATION_WINDOW_MS;

  // Honest uncertainty: when not ready, every detection stays empty.
  if (!ready) {
    const reading: TemporalAccumulationReading = {
      observed_span_ms, ready,
      recurring_signatures: [],
      silence_durability: null,
      contradiction_stability: null,
      temporal_fragmentation: { transitions: 0, whiplash: 0, rate: 0, recent: [] },
      long_tail_resonance: [],
      persistence_classifications: [],
      coherent_returns: [],
      contradictory_returns: [],
      fragmentation_recovery: null,
      felt_as: '',
    };
    reading.felt_as = summarize(reading);
    return reading;
  }

  const byKind = groupByKind(pressure);
  const recurring_signatures = detectRecurringSignatures(byKind);
  const silence_durability = detectSilenceDurability(archives.weatherLog);
  const contradiction_stability = detectContradictionStability(archives.contradictionScars);
  const temporal_fragmentation = detectFragmentation(archives.weatherLog);
  const long_tail_resonance = detectLongTailResonance(byKind, smoothed, now);
  const persistence_classifications = classifyPersistence(byKind);
  const { coherent, contradictory } = detectReturns(byKind);
  const fragmentation_recovery = detectRecovery(archives.weatherLog);

  const reading: TemporalAccumulationReading = {
    observed_span_ms, ready,
    recurring_signatures,
    silence_durability,
    contradiction_stability,
    temporal_fragmentation,
    long_tail_resonance,
    persistence_classifications,
    coherent_returns: coherent,
    contradictory_returns: contradictory,
    fragmentation_recovery,
    felt_as: '',
  };
  reading.felt_as = summarize(reading);
  return reading;
}
