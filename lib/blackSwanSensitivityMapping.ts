/**
 * BLACK SWAN SENSITIVITY MAPPING (Phase 161 — Wave 11: Strategic Future Intelligence)
 *
 * The organism cannot predict a black swan — but it can know how
 * exposed it is to one. This module maps that exposure: how badly an
 * unmodelled, low-probability shock would hurt.
 */

import type { ExecutiveWorldState } from './worldStateEngine';

export interface BlackSwanReading {
  /** 0..10 — how exposed the organism is to an unmodelled shock. */
  black_swan_exposure: number;
  vulnerable_to: string;
  /** True when the exposure is dangerous enough to act on. */
  exposure_is_dangerous: boolean;
  notes: string[];
}

export interface BlackSwanInput {
  worldState: ExecutiveWorldState;
  /** 0..10 — how strong the identity is (a black-swan shock absorber). */
  identityStrength: number;
  /** 0..10 — compounding advantage (a buffer). */
  compoundingAdvantage: number;
}

export function mapBlackSwanSensitivity(input: BlackSwanInput): BlackSwanReading {
  const { worldState, identityStrength, compoundingAdvantage } = input;
  const notes: string[] = [];

  let black_swan_exposure = 5;
  black_swan_exposure += worldState.emotional_volatility * 0.2;
  black_swan_exposure += worldState.trust_erosion * 0.2;
  black_swan_exposure -= identityStrength * 0.3;
  black_swan_exposure -= compoundingAdvantage * 0.25;
  black_swan_exposure = round1(Math.max(0, Math.min(10, black_swan_exposure)));

  const vulnerable_to =
    worldState.trust_erosion >= 6 ? 'a sudden collapse of audience trust'
    : worldState.emotional_volatility >= 7 ? 'an abrupt swing in collective mood'
    : identityStrength < 5 ? 'any shock that tests an identity not yet anchored'
    : 'a platform or cultural rupture the model never priced in';

  const exposure_is_dangerous = black_swan_exposure >= 6.5;

  notes.push(`black swan sensitivity: exposure ${black_swan_exposure}/10` +
    (exposure_is_dangerous ? ` — DANGEROUS, vulnerable to ${vulnerable_to}` : ''));
  return { black_swan_exposure, vulnerable_to, exposure_is_dangerous, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
