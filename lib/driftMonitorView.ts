/**
 * DRIFT MONITOR VIEW (Phase 120 — Wave 9: Manifestation Architecture)
 *
 * The runtime watches its own mind for drift. This monitor reads the
 * persistent runtime history and surfaces whether the system is
 * holding its line or sliding — too much silence, narrowing territory,
 * collapsing coherence — so a viewer can see the drift before a metric
 * names it.
 */

import type { RuntimeSnapshot, Tone } from './runtimeUIBrain';

export interface DriftMonitorSignal {
  signal: string;
  tone: Tone;
}

export interface DriftMonitorViewModel {
  present: boolean;
  drift_detected: boolean;
  /** 0..10 — how far the runtime has drifted. */
  drift_magnitude: number;
  signals: DriftMonitorSignal[];
  statement: string;
}

export function buildDriftMonitorView(snap: RuntimeSnapshot): DriftMonitorViewModel {
  const runtime = snap.runtime;
  if (!runtime || runtime.history.length < 4) {
    return {
      present: false, drift_detected: false, drift_magnitude: 0, signals: [],
      statement: 'too little history to read drift — the runtime is still young',
    };
  }

  const history = runtime.history;
  const recent = history.slice(-6);
  const signals: DriftMonitorSignal[] = [];
  let drift_magnitude = 0;

  // Too much silence — recent runs are all heavily restrained.
  const avgSilence = recent.reduce((s, h) => s + h.silenceLevel, 0) / recent.length;
  if (avgSilence >= 7) {
    signals.push({ signal: `the runtime has gone quiet — average restraint ${avgSilence.toFixed(1)}/10`, tone: 'warn' });
    drift_magnitude += 3;
  }

  // Narrowing territory — recent runs keep returning to one family.
  const territories = new Set(recent.map((h) => h.emotionalTerritory));
  if (recent.length >= 4 && territories.size <= 1) {
    signals.push({ signal: 'emotional territory is narrowing into a monoculture', tone: 'warn' });
    drift_magnitude += 3;
  }

  // Collapsing coherence — field coherence trending down.
  const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
  const lastHalf = recent.slice(Math.floor(recent.length / 2));
  const cohFall =
    (firstHalf.reduce((s, h) => s + h.fieldCoherence, 0) / Math.max(1, firstHalf.length)) -
    (lastHalf.reduce((s, h) => s + h.fieldCoherence, 0) / Math.max(1, lastHalf.length));
  if (cohFall >= 2) {
    signals.push({ signal: `field coherence is falling (${cohFall.toFixed(1)} points)`, tone: 'bad' });
    drift_magnitude += 4;
  }

  // Rejection streak — the runtime keeps refusing itself.
  const recentRejections = recent.filter((h) => h.verdict !== 'approve').length;
  if (recentRejections >= 4) {
    signals.push({ signal: `${recentRejections} of the last ${recent.length} runs were refused`, tone: 'warn' });
    drift_magnitude += 2;
  }

  drift_magnitude = Math.min(10, drift_magnitude);
  const drift_detected = drift_magnitude >= 5;

  return {
    present: true, drift_detected, drift_magnitude, signals,
    statement: signals.length
      ? `${drift_detected ? 'DRIFT DETECTED' : 'mild drift'} — ${signals.map((s) => s.signal)[0]}`
      : 'the runtime is holding its line — no drift detected',
  };
}
