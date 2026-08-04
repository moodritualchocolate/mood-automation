/**
 * RUNTIME DRIFT DETECTOR (Phase 27 — Persistent Cognitive Runtime)
 *
 * The system must watch its OWN mind. A persistent runtime can drift
 * into ruts no single generation would notice: the same truths, the
 * same objects, the same emotional territory, too much silence, too
 * much heaviness, too much refusal, lost commercial grounding.
 *
 * When drift is detected, the next-run directive must correct it.
 */

import type { RuntimeHistoryEntry } from './runtimeMemoryStore';

export interface RuntimeDriftReport {
  drift_signals: string[];
  drift_score: number;                 // 0..10
  drift_detected: boolean;
  most_severe: string | null;
  /** Instructions the next-run directive must act on. */
  correction_needed: string[];
  /** Convenience flags for the directive generator. */
  too_much_silence: boolean;
  too_much_heaviness: boolean;
  too_much_refusal: boolean;
  notes: string[];
}

const HEAVY_TERRITORIES = new Set(['collapse', 'fatigue', 'numbness', 'paralysis']);

export interface DetectRuntimeDriftInput {
  history: RuntimeHistoryEntry[];
}

export function detectRuntimeDrift(input: DetectRuntimeDriftInput): RuntimeDriftReport {
  const { history } = input;
  const notes: string[] = [];
  const drift_signals: string[] = [];
  const correction_needed: string[] = [];

  // Look at the most recent window — the runtime's recent behaviour.
  const window = history.slice(0, 8);
  if (window.length < 3) {
    return {
      drift_signals: [], drift_score: 0, drift_detected: false, most_severe: null,
      correction_needed: [], too_much_silence: false, too_much_heaviness: false,
      too_much_refusal: false,
      notes: ['runtime drift: history too short to assess self-drift'],
    };
  }

  // ─── overuse of the same truth ─────────────────────────────────
  const truthCounts: Record<string, number> = {};
  for (const h of window) truthCounts[h.dominantTruth] = (truthCounts[h.dominantTruth] ?? 0) + 1;
  const maxTruth = Math.max(...Object.values(truthCounts));
  if (maxTruth >= 3) {
    drift_signals.push('overuse-of-same-truth');
    correction_needed.push('rotate the dominant truth — the runtime is repeating one observation');
  }

  // ─── overuse of the same emotional territory ───────────────────
  const territoryCounts: Record<string, number> = {};
  for (const h of window) territoryCounts[h.emotionalTerritory] = (territoryCounts[h.emotionalTerritory] ?? 0) + 1;
  const maxTerritory = Math.max(...Object.values(territoryCounts));
  if (maxTerritory >= 4) {
    drift_signals.push('overuse-of-same-emotional-territory');
    correction_needed.push('change emotional territory — the runtime has been sitting in one place');
  }

  // ─── overuse of the same objects ───────────────────────────────
  const objectCounts: Record<string, number> = {};
  for (const h of window) for (const o of h.symbolicObjects) objectCounts[o] = (objectCounts[o] ?? 0) + 1;
  const overusedObject = Object.entries(objectCounts).find(([, c]) => c >= 4);
  if (overusedObject) {
    drift_signals.push(`overuse-of-object:${overusedObject[0]}`);
    correction_needed.push(`retire the "${overusedObject[0]}" motif — it has been overused`);
  }

  // ─── too much silence / heaviness ──────────────────────────────
  const avgSilence = window.reduce((s, h) => s + h.silenceLevel, 0) / window.length;
  const too_much_silence = avgSilence >= 7.5;
  if (too_much_silence) {
    drift_signals.push('too-much-silence');
    correction_needed.push('the campaign has been too restrained — allow more presence');
  }
  const heavyShare = window.filter((h) => HEAVY_TERRITORIES.has(h.emotionalTerritory)).length / window.length;
  const too_much_heaviness = heavyShare >= 0.75;
  if (too_much_heaviness) {
    drift_signals.push('too-much-heaviness-and-burnout');
    correction_needed.push('the campaign is accumulating heaviness — a lighter or more ordinary moment is needed');
  }

  // ─── too much refusal ──────────────────────────────────────────
  const rejectShare = window.filter((h) => h.verdict !== 'approve').length / window.length;
  const too_much_refusal = rejectShare >= 0.6;
  if (too_much_refusal) {
    drift_signals.push('too-much-refusal');
    correction_needed.push('the runtime is refusing too much — the bar may be mis-calibrated');
  }

  // ─── excessive abstraction / lost commercial grounding ─────────
  const avgEmergence = window.reduce((s, h) => s + h.emergence, 0) / window.length;
  if (avgEmergence >= 9) {
    drift_signals.push('excessive-intellectualization');
    correction_needed.push('the runtime may be over-thinking — keep a human simplicity');
  }

  const productAbsenceShare = window.filter((h) => h.symbolicObjects.length === 0).length / window.length;
  if (productAbsenceShare >= 0.8) {
    drift_signals.push('loss-of-commercial-grounding');
    correction_needed.push('rebalance product / object presence — the campaign is drifting into pure abstraction');
  }

  const drift_score = Math.min(10, drift_signals.length * 2.2);
  const drift_detected = drift_signals.length >= 2;
  const most_severe = drift_signals[0] ?? null;

  if (drift_detected) notes.push(`runtime drift detected: ${drift_signals.join(', ')}`);
  else notes.push('runtime drift: the system is not drifting — mind is varied and grounded');

  return {
    drift_signals, drift_score, drift_detected, most_severe, correction_needed,
    too_much_silence, too_much_heaviness, too_much_refusal, notes,
  };
}
