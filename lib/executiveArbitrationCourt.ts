/**
 * EXECUTIVE ARBITRATION COURT (Phase 104 — Wave 8: Operating System Genesis)
 *
 * Six executive values constantly pull the runtime in different
 * directions: growth, truth, identity, survival, engagement, and
 * restraint. The arbitration court hears the strongest two and issues
 * a ruling — which value governs this tick. Survival and identity
 * outrank engagement; the court never lets engagement win alone.
 */

export type ExecutiveValue =
  | 'growth' | 'truth' | 'identity' | 'survival' | 'engagement' | 'restraint';

export interface ArbitrationReading {
  /** The two values most in tension this tick, strongest first. */
  the_conflict: [ExecutiveValue, ExecutiveValue] | null;
  /** The value the court rules should govern this tick. */
  arbitrated_winner: ExecutiveValue;
  ruling: string;
  notes: string[];
}

export interface ArbitrationInput {
  /** True when the organism's posture is expansion / growth. */
  wantsGrowth: boolean;
  /** True when optimization is corrupting truth. */
  optimizationCorrupts: boolean;
  /** 0..10 — existential risk to the organism. */
  existentialRisk: number;
  /** True when the identity stress test failed. */
  identityFailing: boolean;
  /** True when the organism chose silence. */
  silenceChosen: boolean;
  /** 0..10 — engagement / stimulation pull. */
  engagementPull: number;
}

export function readExecutiveArbitrationCourt(input: ArbitrationInput): ArbitrationReading {
  const { wantsGrowth, optimizationCorrupts, existentialRisk, identityFailing, silenceChosen, engagementPull } = input;
  const notes: string[] = [];

  // Each value's claim strength this tick.
  const claims: Record<ExecutiveValue, number> = {
    survival: existentialRisk,
    identity: identityFailing ? 9 : 3,
    truth: optimizationCorrupts ? 8 : 5,
    restraint: silenceChosen ? 8 : 3,
    growth: wantsGrowth ? 6 : 2,
    engagement: engagementPull,
  };

  const ranked = (Object.entries(claims) as Array<[ExecutiveValue, number]>)
    .sort((a, b) => b[1] - a[1]);

  // The court never lets engagement win alone — if engagement tops the
  // ranking, the next non-engagement value governs instead.
  let arbitrated_winner = ranked[0][0];
  if (arbitrated_winner === 'engagement') {
    arbitrated_winner = ranked.find(([v]) => v !== 'engagement')![0];
    notes.push('executive arbitration: engagement topped the claims — the court refused it and ruled for the next value');
  }

  const the_conflict: [ExecutiveValue, ExecutiveValue] | null =
    ranked.length >= 2 ? [ranked[0][0], ranked[1][0]] : null;

  const ruling = `the court rules that "${arbitrated_winner}" governs this tick` +
    (the_conflict ? `, over the competing claim of "${the_conflict[1]}"` : '');

  notes.push(`executive arbitration court: ${ruling}`);
  return { the_conflict, arbitrated_winner, ruling, notes };
}
