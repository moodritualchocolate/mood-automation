/**
 * IDENTITY STRESS TESTING (Phase 75 — Wave 7: Reality Organism)
 *
 * Before the organism acts, it stress-tests its identity: under the
 * pressures this run carries — engagement pull, environmental load,
 * timing strain — would the identity HOLD, or would it deform?
 */

export interface IdentityStressReading {
  /** 0..10 — how much stress the identity is under this run. */
  stress_applied: number;
  /** 0..10 — how well the identity withstands it. */
  identity_resilience: number;
  /** True when the identity holds under the applied stress. */
  identity_holds: boolean;
  /** The failure mode if the identity does not hold. */
  failure_mode: string | null;
  notes: string[];
}

export interface IdentityStressInput {
  /** 0..10 — engagement / optimization pull. */
  engagementPull: number;
  /** 0..10 — environmental load (Phase 71). */
  environmentalLoad: number;
  /** 0..10 — how strong the brand identity currently is. */
  identityStrength: number;
  /** True when the timing is wrong (adds strain). */
  timingWrong: boolean;
  /** True when optimization is corrupting truth. */
  optimizationCorrupts: boolean;
}

export function readIdentityStressTest(input: IdentityStressInput): IdentityStressReading {
  const { engagementPull, environmentalLoad, identityStrength, timingWrong, optimizationCorrupts } = input;
  const notes: string[] = [];

  let stress_applied = engagementPull * 0.4 + environmentalLoad * 0.4;
  if (timingWrong) stress_applied += 1.5;
  if (optimizationCorrupts) stress_applied += 2;
  stress_applied = round1(Math.min(10, stress_applied));

  const identity_resilience = round1(Math.max(0, Math.min(10, identityStrength - environmentalLoad * 0.2)));
  const identity_holds = identity_resilience >= stress_applied - 1;

  let failure_mode: string | null = null;
  if (!identity_holds) {
    if (optimizationCorrupts) failure_mode = 'identity deforms toward optimization under the applied stress';
    else if (engagementPull >= 7) failure_mode = 'identity bends toward the engagement pull';
    else failure_mode = 'identity cannot bear the environmental + timing strain';
  }

  notes.push(`identity stress test: stress ${stress_applied}/10 vs resilience ${identity_resilience}/10 — identity ${identity_holds ? 'HOLDS' : 'FAILS'}`);
  if (failure_mode) notes.push(`identity stress test: failure mode — ${failure_mode}`);

  return { stress_applied, identity_resilience, identity_holds, failure_mode, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
