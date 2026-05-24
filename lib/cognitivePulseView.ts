/**
 * COGNITIVE PULSE VISUALIZER (Phase 113 — Wave 9: Manifestation Architecture)
 *
 * The runtime has a heartbeat. This module turns the persistent
 * coordination, vitality, and tempo of the organism into a pulse — a
 * rate, an amplitude, a rhythm, and a waveform the UI can animate.
 * A viewer should be able to feel the organism is alive without
 * reading a single number.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import { round1 } from './runtimeUIBrain';

export type PulseRhythm = 'steady' | 'strong' | 'racing' | 'faint' | 'irregular' | 'flatline' | 'passive';

export interface CognitivePulseViewModel {
  present: boolean;
  /** Beats per minute — a felt tempo, not a literal measurement. */
  rate: number;
  /** 0..1 — how strong each beat is. */
  amplitude: number;
  rhythm: PulseRhythm;
  /** A normalised waveform (0..1) the UI animates as a heartbeat trace. */
  waveform: number[];
  statement: string;
  /**
   * Wave 19 — passive heartbeat surface. Populated when the organism
   * has not yet run any cognitive action; in that mode the cognitive
   * pulse fields (rate / amplitude / rhythm) are not meaningful, and
   * the UI should render this object instead. Bound directly to the
   * persisted OS uptime — no derivation, no fabrication.
   */
  passive?: {
    uptime_ticks: number;
    season_age: number;
    last_tick_at: number;
  };
}

export function buildCognitivePulseView(snap: RuntimeSnapshot): CognitivePulseViewModel {
  const { organism, os } = snap;
  if (!organism || !os) {
    return {
      present: false, rate: 0, amplitude: 0, rhythm: 'flatline',
      waveform: new Array(24).fill(0),
      statement: 'no pulse — the runtime is dormant',
    };
  }

  // Wave 19 — passive heartbeat mode. The cognitive pulse is derived
  // from stress, action count, energy, coordination — none of which
  // advance under passive ticking. Presenting a fixed 56-bpm 'steady'
  // pulse before any cognition has occurred is a stale derivation, not
  // a felt heartbeat. While there is no cognitive activity, the panel
  // shows the passive heartbeat instead: the count of OS ticks the
  // organism has lived through, bound straight from os-runtime.json.
  const hasCognitiveActivity =
    organism.age > 0 ||
    organism.consecutiveActions > 0 ||
    organism.restCount > 0 ||
    organism.adaptationCount > 0;
  if (!hasCognitiveActivity) {
    return {
      present: false,
      rate: 0,
      amplitude: 0,
      rhythm: 'passive',
      waveform: new Array(24).fill(0.12),
      statement: os.uptime === 0
        ? 'passive heartbeat — the runtime has not yet drawn its first breath'
        : `passive heartbeat — ${os.uptime} ticks lived, no cognitive activity yet`,
      passive: {
        uptime_ticks: os.uptime,
        season_age: os.seasonAge,
        last_tick_at: os.updatedAt,
      },
    };
  }

  const vitality = organism.energyReserves * 0.5 + (10 - organism.stressAccumulation) * 0.5;
  // Rate rises with stress and consecutive action, falls with rest.
  let rate = 48 + organism.stressAccumulation * 4 + Math.min(20, organism.consecutiveActions * 2.5);
  rate = Math.round(Math.max(36, Math.min(150, rate)));

  const amplitude = round1(Math.max(0.1, Math.min(1, vitality / 10)) * 100) / 100;

  let rhythm: PulseRhythm;
  if (os.operationalPosture === 'hibernating') rhythm = 'faint';
  else if (os.fragmentationStreak >= 2) rhythm = 'irregular';
  else if (rate >= 110) rhythm = 'racing';
  else if (amplitude >= 0.75 && os.coordinationEMA >= 7) rhythm = 'strong';
  else if (amplitude <= 0.3) rhythm = 'faint';
  else rhythm = 'steady';

  // A 24-sample heartbeat waveform — a quiet baseline with one spike
  // per beat, the spike scaled by amplitude, jittered when irregular.
  const waveform: number[] = [];
  for (let i = 0; i < 24; i++) {
    const beatPhase = i % 6;
    let v = beatPhase === 1 ? amplitude : beatPhase === 2 ? amplitude * 0.55 : 0.12;
    if (rhythm === 'irregular' && i % 5 === 0) v *= 0.4;
    if (rhythm === 'racing' && beatPhase === 4) v = amplitude * 0.7;
    waveform.push(Math.round(Math.max(0, Math.min(1, v)) * 100) / 100);
  }

  const statement = `pulse ${rate} — ${rhythm}, amplitude ${Math.round(amplitude * 100)}%`;

  return { present: true, rate, amplitude, rhythm, waveform, statement };
}
