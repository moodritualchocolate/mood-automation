/** COLLECTIVE HEALING DISPATCH (Phase 429 — Wave 16) */
export interface CollectiveHealingDispatchReading { dispatched: boolean; pattern: string | null; notes: string[]; }
export interface CollectiveHealingDispatchInput { woundDetected: boolean; patternAvailable: string | null; }
export function readCollectiveHealingDispatch(input: CollectiveHealingDispatchInput): CollectiveHealingDispatchReading {
  const dispatched = input.woundDetected && input.patternAvailable !== null;
  const pattern = dispatched ? input.patternAvailable : null;
  return { dispatched, pattern, notes: [`collective healing dispatch: ${dispatched ? `DISPATCHED — ${pattern}` : 'none'}`] };
}
