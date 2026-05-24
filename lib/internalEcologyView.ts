/**
 * INTERNAL ECOLOGY VIEW (Wave 37)
 *
 * Dashboard view model for the four-species pressure ecology.
 * Surfaces species rows, dominance, tension topology, volatility,
 * exhaustion, and recent shifts. NO personality language anywhere —
 * every value is a deterministic operational measurement.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';
import type {
  InternalEcologyState, Species, SpeciesId, SpeciesTensionPair,
  EcologyState, DominanceShift, ActivationState,
} from './internalEcologyMemory';
import { computeEcologyBias, type EcologyBias } from './internalEcologyEngine';

export interface SpeciesView {
  id: SpeciesId;
  intensity: number;
  fatigue: number;
  influenceWeight: number;
  volatility: number;
  activationState: ActivationState;
  cumulativeWins: number;
  cumulativeLosses: number;
}

export interface TensionPairView {
  pairId: string;
  speciesA: SpeciesId;
  speciesB: SpeciesId;
  tension: number;
  stability: number;
  historicalMean: number;
  escalationVelocity: number;
  recoveryVelocity: number;
}

export interface InternalEcologyViewModel {
  present: boolean;
  state: EcologyState;
  dominantSpecies: SpeciesId | null;
  ecologicalBalance: number;
  volatilityField: number;
  expansionBias: number;
  conservationBias: number;
  survivabilityBias: number;
  species: SpeciesView[];
  tensionPairs: TensionPairView[];
  bias: EcologyBias;
  recentShifts: DominanceShift[];
  totalUpdates: number;
  statement: string;
}

const ZERO_BIAS: EcologyBias = {
  cognitionThroughput: 0, escalationPermission: 0, explorationIntensity: 0,
  deferAcceptance: 0, recoveryWeighting: 0, burstTolerance: 0,
};

function speciesToView(s: Species): SpeciesView {
  return {
    id: s.id,
    intensity: s.intensity,
    fatigue: s.fatigue,
    influenceWeight: s.influenceWeight,
    volatility: s.volatility,
    activationState: s.activationState,
    cumulativeWins: s.cumulativeWins,
    cumulativeLosses: s.cumulativeLosses,
  };
}

function tensionPairToView(p: SpeciesTensionPair): TensionPairView {
  return {
    pairId: p.pairId,
    speciesA: p.speciesA,
    speciesB: p.speciesB,
    tension: p.tension,
    stability: p.stability,
    historicalMean: p.historicalMean,
    escalationVelocity: p.escalationVelocity,
    recoveryVelocity: p.recoveryVelocity,
  };
}

export function buildInternalEcologyView(snap: RuntimeSnapshot): InternalEcologyViewModel {
  const e = snap.internalEcology ?? null;
  if (!e) {
    return {
      present: false,
      state: 'balanced',
      dominantSpecies: null,
      ecologicalBalance: 10,
      volatilityField: 0,
      expansionBias: 0,
      conservationBias: 0,
      survivabilityBias: 0,
      species: [],
      tensionPairs: [],
      bias: ZERO_BIAS,
      recentShifts: [],
      totalUpdates: 0,
      statement: 'ecology has not observed a cognitive event yet — pressure species at seed equilibrium',
    };
  }

  const bias = computeEcologyBias(e.species);
  const species = e.species.map(speciesToView);
  const tensionPairs = e.tensionPairs.map(tensionPairToView);
  const recentShifts = e.dominanceShifts.slice(-6).reverse();

  const statement = (() => {
    if (e.state === 'exhausted') {
      return `ecology EXHAUSTED — all species fatigued (mean fatigue ${(e.species.reduce((a, s) => a + s.fatigue, 0) / 4).toFixed(1)}/10)`;
    }
    if (e.state === 'unstable') {
      return `ecology UNSTABLE — volatility field ${e.volatilityField}/10, no stable dominance`;
    }
    if (e.dominantSpecies) {
      const dom = e.species.find((s) => s.id === e.dominantSpecies)!;
      return `${e.state} — ${e.dominantSpecies} dominant (influence ${dom.influenceWeight.toFixed(2)}, intensity ${dom.intensity.toFixed(1)}/10, fatigue ${dom.fatigue.toFixed(1)}/10); ` +
        `balance ${e.ecologicalBalance.toFixed(1)}/10`;
    }
    return `ecology balanced — no dominant species (balance ${e.ecologicalBalance.toFixed(1)}/10, volatility ${e.volatilityField.toFixed(1)}/10)`;
  })();

  return {
    present: true,
    state: e.state,
    dominantSpecies: e.dominantSpecies,
    ecologicalBalance: e.ecologicalBalance,
    volatilityField: e.volatilityField,
    expansionBias: e.expansionBias,
    conservationBias: e.conservationBias,
    survivabilityBias: e.survivabilityBias,
    species,
    tensionPairs,
    bias,
    recentShifts,
    totalUpdates: e.totalUpdates,
    statement,
  };
}
