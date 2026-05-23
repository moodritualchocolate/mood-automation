/** TRUST GRAVITY RADIUS (Phase 424 — Wave 16) */
export interface TrustGravityRadiusReading { radius: number; notes: string[]; }
export interface TrustGravityRadiusInput { gravityStrength: number; secondHandSpread: number; }
export function readTrustGravityRadius(input: TrustGravityRadiusInput): TrustGravityRadiusReading {
  const radius = Math.min(10, input.gravityStrength * 0.6 + input.secondHandSpread * 0.4);
  return { radius, notes: [`trust gravity radius: ${radius.toFixed(1)}/10`] };
}
