/**
 * PRESENCE FIELD RADIUS (Phase 420 — Wave 16)
 */
export interface PresenceFieldRadiusReading { radius: number; notes: string[]; }
export interface PresenceFieldRadiusInput { fieldStrength: number; secondHandSpread: number; }
export function readPresenceFieldRadius(input: PresenceFieldRadiusInput): PresenceFieldRadiusReading {
  const radius = Math.min(10, input.fieldStrength * 0.5 + input.secondHandSpread * 0.5);
  return { radius, notes: [`presence field radius: ${radius}/10`] };
}
