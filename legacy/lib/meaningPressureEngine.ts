/**
 * MEANING PRESSURE ENGINE (pure, observational)
 *
 * Observes the eight collective meaning-pressures: meaning, belonging,
 * calm, emotional honesty, ritual, groundedness, humanity, depth.
 * Each is a 0..10 descriptive demand signal — never a target, never a
 * thing to "deliver". The system observes what the audience appears to
 * be seeking; the operator decides whether to respond.
 *
 * STRICT CONTRACT:
 *   - no I/O, pure function
 *   - never tells the operator what to create
 *   - allowed phrasing: "observed alongside", "historically associated",
 *     "appears to be sought"
 *   - forbidden: prediction, persuasion steering, behavioral targeting,
 *     optimization, manipulation scoring, political segmentation
 */

import type { WorldStateSignals } from './worldModelEngine';
import type { AestheticMigrationReading } from './aestheticMigrationEngine';
import type { CollectiveAttentionReading } from './collectiveAttentionEngine';

// ─── input ───────────────────────────────────────────────────

export interface MeaningPressureInput {
  worldSignals?: WorldStateSignals | null;
  aesthetic?: AestheticMigrationReading | null;
  attention?: CollectiveAttentionReading | null;
}

// ─── output ──────────────────────────────────────────────────

export interface MeaningPressureSignals {
  meaning: number;
  belonging: number;
  calm: number;
  emotionalHonesty: number;
  ritual: number;
  groundedness: number;
  humanity: number;
  depth: number;
}

export interface MeaningPressureReading {
  signals: MeaningPressureSignals;
  /** Top 3 by magnitude. */
  dominantPressures: string[];
  notes: string[];
  reasonCodes: string[];
  advisoryNotice: string;
}

const ADVISORY_NOTICE =
  'Observatory only — the system observes what humans appear to be seeking. ' +
  'It never tells the operator what to deliver, and it never persuades.';

// ─── helpers ─────────────────────────────────────────────────

function clamp10(n: number): number { return Math.max(0, Math.min(10, n)); }
function r1(n: number): number { return Math.round(n * 10) / 10; }
function safeWorld(): WorldStateSignals {
  return {
    stimulationSaturation: 0, trustFragility: 0, emotionalExhaustion: 0,
    realismDemand: 0, ironyDensity: 0, optimismDrift: 0, anxietyClimate: 0,
    ritualHunger: 0, symbolicFatigue: 0, authenticityDemand: 0,
    nostalgiaPressure: 0, lonelinessSignals: 0, attentionFragmentation: 0,
    emotionalOverload: 0, simplicityCraving: 0, meaningSeeking: 0,
  };
}

// ─── main ────────────────────────────────────────────────────

export function computeMeaningPressure(input: MeaningPressureInput): MeaningPressureReading {
  const w = input.worldSignals ?? safeWorld();
  const aest = input.aesthetic;
  const att = input.attention;

  // ── meaning ──
  // Direct from worldSignals + ritual hunger.
  const meaning = clamp10(w.meaningSeeking * 0.7 + w.ritualHunger * 0.3);

  // ── belonging ──
  // Loneliness signals + ritual + (low fragmentation as confirmation).
  const belonging = clamp10(
    w.lonelinessSignals * 0.5 +
    w.ritualHunger * 0.3 +
    (10 - w.attentionFragmentation) * 0.2,
  );

  // ── calm ──
  // Anxiety + overstimulation rejection + stillness resurgence.
  const calm = clamp10(
    w.anxietyClimate * 0.4 +
    (att?.overstimulationRejection.level ?? 0) * 0.3 +
    (aest?.stillnessResurgence.level ?? 0) * 0.3,
  );

  // ── emotional honesty ──
  // Authenticity demand + realism demand + imperfection preference.
  const emotionalHonesty = clamp10(
    w.authenticityDemand * 0.4 +
    w.realismDemand * 0.3 +
    (aest?.imperfectionPreference.level ?? 0) * 0.3,
  );

  // ── ritual ──
  // Ritual hunger + simplicity craving.
  const ritual = clamp10(
    w.ritualHunger * 0.6 +
    w.simplicityCraving * 0.4,
  );

  // ── groundedness ──
  // Simplicity craving + nostalgia + low irony.
  const groundedness = clamp10(
    w.simplicityCraving * 0.4 +
    w.nostalgiaPressure * 0.3 +
    (10 - w.ironyDensity) * 0.3,
  );

  // ── humanity ──
  // Loneliness + authenticity + emotional rawness demand.
  const humanity = clamp10(
    w.lonelinessSignals * 0.3 +
    w.authenticityDemand * 0.3 +
    (aest?.emotionalRawnessDemand.level ?? 0) * 0.4,
  );

  // ── depth ──
  // Meaning + long-form trust restoration + low irony.
  const depth = clamp10(
    w.meaningSeeking * 0.4 +
    (att?.longFormTrustRestoration.level ?? 0) * 0.3 +
    (10 - w.ironyDensity) * 0.3,
  );

  const signals: MeaningPressureSignals = {
    meaning: r1(meaning),
    belonging: r1(belonging),
    calm: r1(calm),
    emotionalHonesty: r1(emotionalHonesty),
    ritual: r1(ritual),
    groundedness: r1(groundedness),
    humanity: r1(humanity),
    depth: r1(depth),
  };

  // dominant pressures (top 3 by magnitude)
  const ranked = Object.entries(signals)
    .map(([k, v]) => [k, v as number] as const)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 3)
    .map(([k]) => k);

  const notes: string[] = [];
  if (signals.calm >= 6) notes.push('calm appears to be sought — historically associated with overstimulation recovery');
  if (signals.emotionalHonesty >= 6) notes.push('emotional honesty appears to be sought — observed alongside authenticity demand');
  if (signals.belonging >= 6) notes.push('belonging appears to be sought — historically associated with loneliness signals');
  if (signals.ritual >= 6) notes.push('ritual appears to be sought — historically associated with meaning-seeking');
  if (signals.depth >= 6) notes.push('depth appears to be sought — observed alongside long-form retention');
  if (signals.humanity >= 6) notes.push('humanity appears to be sought — observed alongside emotional rawness demand');
  if (notes.length === 0) notes.push('meaning pressures appear balanced in this observation window');

  return {
    signals,
    dominantPressures: ranked,
    notes,
    reasonCodes: Object.entries(signals).map(([k, v]) => `${k}:${v}`),
    advisoryNotice: ADVISORY_NOTICE,
  };
}
