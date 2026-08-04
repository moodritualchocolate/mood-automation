/**
 * TRUST DECAY ENGINE (Phase 134 — Wave 10: Reality Coupling Architecture)
 *
 * Trust is the slowest-earned and fastest-lost resource the organism
 * has. This engine models how trust forms and decays: identity held
 * and resonance earned build it slowly; optimization and eroding
 * authenticity spend it fast.
 */

export type TrustTrend = 'forming' | 'holding' | 'decaying';

export interface TrustDecayReading {
  /** 0..10 — the organism's current standing of audience trust. */
  trust_level: number;
  trust_trend: TrustTrend;
  /** True when trust is actively decaying this cycle. */
  trust_is_decaying: boolean;
  notes: string[];
}

export interface TrustDecayInput {
  /** 0..10 — trust carried from the persistent coupling state. */
  priorTrust: number;
  identityHeld: boolean;
  optimizationCorrupts: boolean;
  authenticityEroding: boolean;
}

export function readTrustDecay(input: TrustDecayInput): TrustDecayReading {
  const { priorTrust, identityHeld, optimizationCorrupts, authenticityEroding } = input;
  const notes: string[] = [];

  let delta = 0;
  if (identityHeld) delta += 0.4;
  if (optimizationCorrupts) delta -= 1.4;
  if (authenticityEroding) delta -= 1.0;
  if (!identityHeld && !optimizationCorrupts) delta -= 0.2;

  const trust_level = round1(Math.max(0, Math.min(10, priorTrust + delta)));

  const trust_trend: TrustTrend = delta >= 0.3 ? 'forming' : delta <= -0.5 ? 'decaying' : 'holding';
  const trust_is_decaying = trust_trend === 'decaying';

  notes.push(`trust decay engine: trust ${trust_level}/10 — ${trust_trend}` +
    (trust_is_decaying ? ' — trust is being spent faster than it is earned' : ''));
  return { trust_level, trust_trend, trust_is_decaying, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
