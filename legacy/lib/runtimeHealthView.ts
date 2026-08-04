/**
 * RUNTIME HEALTH VIEW (Phase 125 — Wave 9: Manifestation Architecture)
 *
 * The operating system's own vital signs, surfaced. Coordination,
 * fragmentation, hibernation history — the persistent OS state read
 * into one health reading of the runtime as a structure.
 */

import type { RuntimeSnapshot, Gauge, Tone } from './runtimeUIBrain';

export interface RuntimeHealthViewModel {
  present: boolean;
  status: 'coordinated' | 'holding' | 'strained' | 'fragmenting';
  gauges: Gauge[];
  fragmentation_streak: number;
  hibernation_count: number;
  statement: string;
}

export function buildRuntimeHealthView(snap: RuntimeSnapshot): RuntimeHealthViewModel {
  const os = snap.os;
  if (!os) {
    return {
      present: false, status: 'strained', gauges: [], fragmentation_streak: 0,
      hibernation_count: 0,
      statement: 'no runtime health — the operating system has not booted',
    };
  }

  const coordTone: Tone = os.coordinationEMA >= 7 ? 'good' : os.coordinationEMA >= 5 ? 'warn' : 'bad';
  const fragTone: Tone = os.fragmentationStreak === 0 ? 'good' : os.fragmentationStreak >= 3 ? 'bad' : 'warn';

  const gauges: Gauge[] = [
    { label: 'coordination (EMA)', value: os.coordinationEMA, max: 10, display: `${os.coordinationEMA}/10`, tone: coordTone },
    { label: 'fragmentation streak', value: os.fragmentationStreak, max: 5, display: `${os.fragmentationStreak} tick(s)`, tone: fragTone },
    { label: 'uptime', value: Math.min(10, os.uptime / 5), max: 10, display: `${os.uptime} ticks`, tone: 'neutral' },
  ];

  const status: RuntimeHealthViewModel['status'] =
    os.fragmentationStreak >= 3 ? 'fragmenting' :
    os.coordinationEMA < 5 ? 'strained' :
    os.coordinationEMA >= 7 && os.fragmentationStreak === 0 ? 'coordinated' : 'holding';

  return {
    present: true,
    status,
    gauges,
    fragmentation_streak: os.fragmentationStreak,
    hibernation_count: os.hibernationCount,
    statement: `the runtime is ${status} — coordination ${os.coordinationEMA}/10` +
      (os.fragmentationStreak ? `, ${os.fragmentationStreak} fragmented tick(s)` : '') +
      (os.hibernationCount ? `, hibernated ${os.hibernationCount}×` : ''),
  };
}
