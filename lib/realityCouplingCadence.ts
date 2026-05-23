/**
 * REALITY COUPLING CADENCE (Phase 312 — Wave 14: Live Civilization Coupling)
 *
 * The cadence at which the brand is coupling to reality — paced,
 * spasmodic, absent, or continuous.
 */

export type CouplingCadenceKind = 'continuous' | 'paced' | 'spasmodic' | 'absent';

export interface RealityCouplingCadenceReading {
  cadence: CouplingCadenceKind;
  /** 0..10 — cadence health. */
  cadence_health: number;
  notes: string[];
}

export interface RealityCouplingCadenceInput {
  couplingCycles: number;
  meaningsCarried: number;
  silencesObserved: number;
}

export function readRealityCouplingCadence(input: RealityCouplingCadenceInput): RealityCouplingCadenceReading {
  const { couplingCycles, meaningsCarried, silencesObserved } = input;
  const notes: string[] = [];

  if (couplingCycles === 0) {
    return { cadence: 'absent', cadence_health: 0, notes: ['reality coupling cadence: no cycles yet'] };
  }

  const meaningShare = meaningsCarried / couplingCycles;
  const silenceShare = silencesObserved / couplingCycles;

  const cadence: CouplingCadenceKind =
    meaningShare >= 0.4 && silenceShare >= 0.2 ? 'paced' :
    meaningShare >= 0.6 ? 'continuous' :
    meaningShare === 0 ? 'absent' : 'spasmodic';

  const cadence_health = round1(Math.min(10, (meaningShare * 8) + (silenceShare * 4)));

  notes.push(`reality coupling cadence: ${cadence} (health ${cadence_health}/10)`);
  return { cadence, cadence_health, notes };
}

function round1(n: number): number { return Math.round(n * 10) / 10; }
