/** COLLECTIVE HEALING MONITOR (Phase 430 — Wave 16) */
export interface CollectiveHealingMonitorReading { healing_landing: boolean; impact: number; notes: string[]; }
export interface CollectiveHealingMonitorInput { dispatched: boolean; received: boolean; }
export function readCollectiveHealingMonitor(input: CollectiveHealingMonitorInput): CollectiveHealingMonitorReading {
  const impact = (input.dispatched ? 5 : 0) + (input.received ? 5 : 0);
  const healing_landing = impact >= 8;
  return { healing_landing, impact, notes: [`collective healing monitor: ${healing_landing ? 'landing' : 'no landing'} (${impact}/10)`] };
}
