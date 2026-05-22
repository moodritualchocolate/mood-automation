/**
 * RUNTIME ORCHESTRATION VIEW (Phase 127 — Wave 9: Manifestation Architecture)
 *
 * The operating system's control surface. Posture, season, the
 * directive in force, coordination, uptime — the persistent OS state
 * laid out as the panel from which the whole runtime is governed.
 */

import type { RuntimeSnapshot, Tone } from './runtimeUIBrain';

export interface OrchestrationPanel {
  label: string;
  value: string;
  tone: Tone;
}

export interface RuntimeOrchestrationViewModel {
  present: boolean;
  posture: string;
  season: string;
  current_directive: string;
  coordination: number;
  uptime: number;
  panels: OrchestrationPanel[];
  statement: string;
}

export function buildRuntimeOrchestrationView(snap: RuntimeSnapshot): RuntimeOrchestrationViewModel {
  const os = snap.os;
  if (!os) {
    return {
      present: false, posture: 'offline', season: 'none', current_directive: 'none',
      coordination: 0, uptime: 0, panels: [],
      statement: 'the runtime is offline — there is nothing to orchestrate',
    };
  }

  const current_directive = os.directiveLog[os.directiveLog.length - 1]?.directive ?? 'none';
  const coordTone: Tone = os.coordinationEMA >= 7 ? 'good' : os.coordinationEMA >= 5 ? 'warn' : 'bad';
  const postureTone: Tone =
    os.operationalPosture === 'coordinated-operation' ? 'good' :
    os.operationalPosture === 'hibernating' || os.operationalPosture === 'protective-mode' ? 'bad' : 'warn';

  const panels: OrchestrationPanel[] = [
    { label: 'operational posture', value: os.operationalPosture, tone: postureTone },
    { label: 'strategic season', value: `${os.currentSeason} (${os.seasonAge} ticks)`, tone: 'cool' },
    { label: 'directive in force', value: current_directive, tone: 'neutral' },
    { label: 'coordination EMA', value: `${os.coordinationEMA}/10`, tone: coordTone },
    { label: 'kernel uptime', value: `${os.uptime} ticks`, tone: 'neutral' },
    { label: 'interrupts serviced', value: String(os.totalInterrupts), tone: 'neutral' },
  ];

  return {
    present: true,
    posture: os.operationalPosture,
    season: os.currentSeason,
    current_directive,
    coordination: os.coordinationEMA,
    uptime: os.uptime,
    panels,
    statement: `the runtime is orchestrated in "${os.operationalPosture}" — ` +
      `directive "${current_directive}", coordination ${os.coordinationEMA}/10`,
  };
}
