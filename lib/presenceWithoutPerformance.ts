/** PRESENCE WITHOUT PERFORMANCE (Phase 443 — Wave 16) */
export interface PresenceWithoutPerformanceReading { is_present_not_performing: boolean; notes: string[]; }
export interface PresenceWithoutPerformanceInput { present: boolean; performing: boolean; }
export function readPresenceWithoutPerformance(input: PresenceWithoutPerformanceInput): PresenceWithoutPerformanceReading {
  const is_present_not_performing = input.present && !input.performing;
  return { is_present_not_performing, notes: [`presence without performance: ${is_present_not_performing ? 'PRESENT' : 'performing'}`] };
}
