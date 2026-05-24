/**
 * INTERNAL ECOLOGY ENGINE (Wave 37)
 *
 * Deterministic update of four numeric pressure species per cognitive
 * event. NOT chat agents. NOT personalities. NOT dialogue.
 *
 * Per event the engine:
 *
 *   1. computes a per-species pressure delta from the directive name
 *      + a small state-context modulation (energy / stress / tension /
 *      density). Fixed deterministic tables — no RNG, no LLM, no prose.
 *
 *   2. EWMA-smooths each species' intensity (alpha 0.15) so signals
 *      drift rather than jump.
 *
 *   3. updates per-species fatigue: high sustained intensity adds
 *      fatigue; low intensity decays it via recoveryRate.
 *
 *   4. normalizes influenceWeight across all species (sums to 1).
 *
 *   5. updates the four inter-species tension pairs: tension grows
 *      proportionally to min(intensityA, intensityB) above 4, decays
 *      otherwise. Velocity tracking + EWMA mean.
 *
 *   6. detects dominance shift with a 0.05-weight hysteresis margin
 *      (must beat the current dominant by ≥ 0.05).
 *
 *   7. classifies the system into one of six operational states.
 *
 *   8. produces an EcologyBias struct (six gradient deltas, each
 *      clamped to ±0.25) for governance to consume next event.
 *
 * Same inputs → same outputs. No species can swing more than
 * SPECIES_MAX_INTENSITY_DELTA per event.
 */

import type {
  InternalEcologyState, Species, SpeciesId, SpeciesPairId,
  SpeciesTensionPair, ActivationState, EcologyState, DominanceShift,
} from './internalEcologyMemory';

// ─── tuning constants ───────────────────────────────────────────

/** EWMA alpha for per-species intensity. Smaller = slower drift. */
export const SPECIES_EWMA_ALPHA = 0.15;
/** Max per-event change to intensity (after EWMA) to prevent jumps. */
export const SPECIES_MAX_INTENSITY_DELTA = 0.8;
/** Significant-pressure-history threshold. */
export const PRESSURE_HISTORY_DELTA = 0.3;
/** Margin a challenger must beat the current dominant by, in
 *  normalized influenceWeight, before a shift is recorded. */
export const DOMINANCE_HYSTERESIS_MARGIN = 0.05;
/** Max absolute value of any single gradient bias produced. */
export const ECOLOGY_BIAS_CLAMP = 0.25;
/** Tension grows from co-elevation, decays otherwise. */
export const TENSION_COELEVATION_THRESHOLD = 4;
/** Volatility window size. */
export const VOLATILITY_WINDOW = 6;

// ─── helpers ───────────────────────────────────────────────────

function clamp(min: number, max: number, n: number): number {
  return Math.max(min, Math.min(max, n));
}
function clamp01(n: number): number { return clamp(0, 1, n); }
function clamp10(n: number): number { return clamp(0, 10, n); }
function clampBias(n: number): number { return clamp(-ECOLOGY_BIAS_CLAMP, ECOLOGY_BIAS_CLAMP, n); }
function round1(n: number): number { return Math.round(n * 10) / 10; }
function round2(n: number): number { return Math.round(n * 100) / 100; }

// ─── per-verb pressure table ───────────────────────────────────
//
// Fixed deterministic mapping from directive name to per-species
// pressure direction. Refusals get a half-magnitude version.
// State-context adjustments are layered on after this lookup.

type SpeciesDelta = Record<SpeciesId, number>;

const ZERO: SpeciesDelta = { explorer: 0, conservator: 0, optimizer: 0, guardian: 0 };

const VERB_PRESSURE: Record<string, SpeciesDelta> = {
  observe:   { explorer: +0.2, conservator: +0.1, optimizer: +0.1, guardian: +0.1 },
  notice:    { explorer: +0.1, conservator: +0.1, optimizer: +0.2, guardian: +0.2 },
  consider:  { explorer: +0.1, conservator: +0.2, optimizer: +0.3, guardian: +0.1 },
  restrain:  { explorer: -0.3, conservator: +0.4, optimizer: +0.1, guardian: +0.3 },
  permit:    { explorer: +0.4, conservator: -0.1, optimizer: +0.1, guardian: -0.1 },
  prepare:   { explorer: +0.3, conservator:  0.0, optimizer: +0.2, guardian: +0.1 },
  draft:     { explorer: +0.6, conservator: -0.3, optimizer: +0.3, guardian: -0.3 },
  review:    { explorer: +0.1, conservator: +0.2, optimizer: +0.4, guardian: +0.4 },
  revise:    { explorer: +0.2, conservator: -0.1, optimizer: +0.5, guardian: +0.2 },
  approve:   { explorer: +0.2, conservator: +0.3, optimizer: +0.4, guardian: +0.3 },
  propose:   { explorer: +0.5, conservator: -0.2, optimizer: +0.2, guardian: -0.2 },
  rest:      { explorer: -0.4, conservator: +0.7, optimizer: +0.1, guardian: +0.5 },
  defer:     { explorer: -0.2, conservator: +0.5, optimizer: +0.3, guardian: +0.5 },
};

function pressureDeltaForDirective(directiveName: string): SpeciesDelta {
  if (directiveName.endsWith('-refused')) {
    const base = directiveName.replace('-refused', '');
    const found = VERB_PRESSURE[base] ?? ZERO;
    return {
      explorer: round2(found.explorer * 0.4),
      conservator: round2(found.conservator * 0.4),
      optimizer: round2(found.optimizer * 0.4),
      guardian: round2(found.guardian * 0.4),
    };
  }
  return VERB_PRESSURE[directiveName] ?? ZERO;
}

// ─── state-context modulation ───────────────────────────────────

export interface EcologyContext {
  energyReserves: number;        // 0..10
  stressAccumulation: number;    // 0..10
  fragmentationStreak: number;   // 0..N
  maxPairTension: number;        // 0..10 — current max in contradiction
  cognitionDensity: number;      // 0..10
  cumulativeReliability: number; // 0..10
}

function contextModulation(ctx: EcologyContext): SpeciesDelta {
  const d: SpeciesDelta = { explorer: 0, conservator: 0, optimizer: 0, guardian: 0 };

  // Low energy biases toward conservator + guardian, away from explorer.
  if (ctx.energyReserves <= 3) {
    d.conservator += 0.3; d.guardian += 0.2; d.explorer -= 0.3;
  } else if (ctx.energyReserves >= 8) {
    d.explorer += 0.15;
  }

  // High stress biases toward guardian + conservator, away from explorer.
  if (ctx.stressAccumulation >= 6) {
    d.guardian += 0.3; d.conservator += 0.2; d.explorer -= 0.2;
  }

  // Fragmentation streak strongly activates guardian, suppresses explorer.
  if (ctx.fragmentationStreak >= 2) {
    d.guardian += 0.3 * Math.min(3, ctx.fragmentationStreak);
    d.explorer -= 0.2 * Math.min(3, ctx.fragmentationStreak);
  }

  // High contradiction tension activates guardian + optimizer.
  if (ctx.maxPairTension >= 6) {
    d.guardian += (ctx.maxPairTension - 6) * 0.15;
    d.optimizer += (ctx.maxPairTension - 6) * 0.08;
  }

  // High density boosts optimizer (compression pressure).
  if (ctx.cognitionDensity >= 7) {
    d.optimizer += (ctx.cognitionDensity - 7) * 0.15;
  }

  // Low reliability nudges guardian up.
  if (ctx.cumulativeReliability < 5) {
    d.guardian += (5 - ctx.cumulativeReliability) * 0.1;
  }

  return d;
}

// ─── activation-state classifier ───────────────────────────────

function classifyActivation(intensity: number, fatigue: number, prev: ActivationState): ActivationState {
  // hysteresis: bands overlap by 0.5 so flicker around boundaries is avoided.
  if (fatigue >= 7) return 'fatigued';
  if (prev === 'fatigued' && fatigue >= 5) return 'fatigued';
  if (prev === 'fatigued') return 'recovering';
  if (prev === 'recovering' && fatigue >= 3) return 'recovering';
  if (intensity < 2) return 'dormant';
  if (prev === 'dormant' && intensity < 2.5) return 'dormant';
  if (intensity < 4) return 'forming';
  return 'active';
}

// ─── volatility ────────────────────────────────────────────────

function volatilityOf(species: Species): number {
  const window = species.pressureHistory.slice(-VOLATILITY_WINDOW);
  if (window.length < 2) return 0;
  const values = window.map((o) => o.intensity);
  const max = Math.max(...values);
  const min = Math.min(...values);
  return round1(clamp10(max - min));
}

// ─── species-level update ─────────────────────────────────────

function updateSpecies(
  species: Species, rawDelta: number, at: number, tick: number,
): Species {
  const prevIntensity = species.intensity;
  // EWMA blend the raw signal change with the previous intensity.
  // Cap per-event swing at SPECIES_MAX_INTENSITY_DELTA.
  let blended = prevIntensity + rawDelta * SPECIES_EWMA_ALPHA;
  if (blended - prevIntensity >  SPECIES_MAX_INTENSITY_DELTA) blended = prevIntensity + SPECIES_MAX_INTENSITY_DELTA;
  if (blended - prevIntensity < -SPECIES_MAX_INTENSITY_DELTA) blended = prevIntensity - SPECIES_MAX_INTENSITY_DELTA;
  const intensity = round1(clamp10(blended));
  const delta = round1(intensity - prevIntensity);

  // Pressure history (only record meaningful changes).
  let pressureHistory = species.pressureHistory;
  if (Math.abs(delta) >= PRESSURE_HISTORY_DELTA) {
    pressureHistory = [...pressureHistory, { at, tick, intensity, delta }];
  }

  // Fatigue: rises when intensity > 6, decays via recoveryRate otherwise.
  let fatigue = species.fatigue;
  if (intensity > 6) {
    fatigue = round1(clamp10(fatigue + (intensity - 6) * 0.08));
  } else {
    fatigue = round1(clamp10(fatigue - species.recoveryRate));
  }

  const updated: Species = {
    ...species,
    intensity, fatigue,
    pressureHistory,
  };
  updated.volatility = volatilityOf(updated);
  updated.activationState = classifyActivation(intensity, fatigue, species.activationState);
  return updated;
}

// ─── influence weights ─────────────────────────────────────────

function normalizeWeights(species: Species[]): Species[] {
  // Fatigued species contribute LESS to influence — they have less push.
  const effective = species.map((s) => s.intensity * (1 - s.fatigue / 12));
  const sum = effective.reduce((a, b) => a + b, 0);
  if (sum === 0) {
    return species.map((s) => ({ ...s, influenceWeight: 0.25 }));
  }
  return species.map((s, i) => ({
    ...s,
    influenceWeight: round2(effective[i] / sum),
  }));
}

// ─── inter-species tension pairs ───────────────────────────────

function intensityOf(species: Species[], id: SpeciesId): number {
  return species.find((s) => s.id === id)?.intensity ?? 0;
}

function updateTensionPair(
  pair: SpeciesTensionPair, species: Species[],
): SpeciesTensionPair {
  const a = intensityOf(species, pair.speciesA);
  const b = intensityOf(species, pair.speciesB);
  const co = Math.min(a, b);
  // tension grows from co-elevation above 4, decays otherwise.
  const growth = co > TENSION_COELEVATION_THRESHOLD
    ? (co - TENSION_COELEVATION_THRESHOLD) * 0.18
    : 0;
  const decay = co > TENSION_COELEVATION_THRESHOLD ? 0 : 0.15;
  const nextTension = round1(clamp10(pair.tension + growth - decay));
  const delta = nextTension - pair.tension;
  // EWMA historical mean.
  const historicalMean = round1(pair.historicalMean * 0.9 + nextTension * 0.1);
  // Velocities — EWMA-smoothed positive vs negative deltas.
  const escalationVelocity = delta > 0
    ? round2(pair.escalationVelocity * 0.7 + delta * 0.3)
    : round2(pair.escalationVelocity * 0.85);
  const recoveryVelocity = delta < 0
    ? round2(pair.recoveryVelocity * 0.7 + (-delta) * 0.3)
    : round2(pair.recoveryVelocity * 0.85);
  // Stability = inverse of recent absolute change (higher = more stable).
  const stability = round1(clamp10(10 - Math.abs(delta) * 5 - Math.abs(escalationVelocity - recoveryVelocity) * 3));
  return {
    ...pair,
    tension: nextTension, historicalMean,
    escalationVelocity, recoveryVelocity,
    stability, lastDelta: round2(delta),
  };
}

// ─── dominance ─────────────────────────────────────────────────

function detectDominance(
  prev: SpeciesId | null, species: Species[],
): { dominant: SpeciesId | null; shifted: boolean } {
  // Highest influenceWeight wins.
  let top: SpeciesId = species[0].id;
  let topW = species[0].influenceWeight;
  for (const s of species) {
    if (s.influenceWeight > topW) { top = s.id; topW = s.influenceWeight; }
  }
  if (prev === null) return { dominant: top, shifted: true };
  if (top === prev) return { dominant: prev, shifted: false };
  // hysteresis — the challenger must beat the previous by at least
  // DOMINANCE_HYSTERESIS_MARGIN before we declare a shift.
  const prevWeight = species.find((s) => s.id === prev)?.influenceWeight ?? 0;
  if (topW - prevWeight < DOMINANCE_HYSTERESIS_MARGIN) {
    return { dominant: prev, shifted: false };
  }
  return { dominant: top, shifted: true };
}

// ─── system state classifier ───────────────────────────────────

function classifyEcology(
  species: Species[], dominant: SpeciesId | null, volatilityField: number,
): EcologyState {
  // All species fatigued → exhausted.
  if (species.every((s) => s.fatigue >= 6)) return 'exhausted';
  // High overall volatility with no clear dominant → unstable.
  if (volatilityField >= 5 && dominant === null) return 'unstable';
  // Dominant species drives the named state.
  if (dominant === 'explorer')    return 'exploratory';
  if (dominant === 'guardian')    return 'defensive';
  if (dominant === 'optimizer')   return 'over-optimized';
  // Balanced: no species above 0.32 weight, volatility low.
  const maxW = species.reduce((m, s) => Math.max(m, s.influenceWeight), 0);
  if (maxW < 0.32 && volatilityField < 3) return 'balanced';
  // Fallback: if conservator dominant or no clear classification, balanced.
  return 'balanced';
}

// ─── EcologyBias output ────────────────────────────────────────

export interface EcologyBias {
  cognitionThroughput: number;
  escalationPermission: number;
  explorationIntensity: number;
  deferAcceptance: number;
  recoveryWeighting: number;
  burstTolerance: number;
}

/** Translate normalized influence weights into gradient bias deltas.
 *  Each output bounded to ±ECOLOGY_BIAS_CLAMP (±0.25). */
export function computeEcologyBias(species: Species[]): EcologyBias {
  const exp = species.find((s) => s.id === 'explorer')!.influenceWeight;
  const con = species.find((s) => s.id === 'conservator')!.influenceWeight;
  const opt = species.find((s) => s.id === 'optimizer')!.influenceWeight;
  const grd = species.find((s) => s.id === 'guardian')!.influenceWeight;

  // Deviations from neutral 0.25 share, weighted by direction of influence.
  const dExp = exp - 0.25;
  const dCon = con - 0.25;
  const dOpt = opt - 0.25;
  const dGrd = grd - 0.25;

  return {
    cognitionThroughput:  clampBias(round2(+dExp * 0.6 + dOpt * 0.3 - dCon * 0.4 - dGrd * 0.5)),
    escalationPermission: clampBias(round2(+dExp * 0.6 - dGrd * 0.6 - dCon * 0.3)),
    explorationIntensity: clampBias(round2(+dExp * 0.8 - dGrd * 0.5 - dCon * 0.3)),
    deferAcceptance:      clampBias(round2(+dCon * 0.5 + dGrd * 0.5 - dExp * 0.5)),
    recoveryWeighting:    clampBias(round2(+dCon * 0.6 + dGrd * 0.4 - dExp * 0.4 - dOpt * 0.2)),
    burstTolerance:       clampBias(round2(+dExp * 0.5 + dOpt * 0.3 - dCon * 0.4 - dGrd * 0.3)),
  };
}

// ─── main update ───────────────────────────────────────────────

export interface EcologySignal {
  at: number;
  tick: number;
  directiveName: string;
  context: EcologyContext;
}

export function updateEcology(
  state: InternalEcologyState, signal: EcologySignal,
): { newState: InternalEcologyState; bias: EcologyBias } {
  // 1. compute raw per-species pressure delta = verb-table + context-mod.
  const verbDelta = pressureDeltaForDirective(signal.directiveName);
  const ctxDelta = contextModulation(signal.context);

  // 2. update each species' intensity + fatigue + activation.
  let updatedSpecies: Species[] = state.species.map((sp) => {
    const total = (verbDelta[sp.id] ?? 0) + (ctxDelta[sp.id] ?? 0);
    return updateSpecies(sp, total, signal.at, signal.tick);
  });

  // 3. normalize influence weights.
  updatedSpecies = normalizeWeights(updatedSpecies);

  // 4. update inter-species tensions.
  const tensionPairs = state.tensionPairs.map((p) => updateTensionPair(p, updatedSpecies));

  // 5. detect dominance shift.
  const { dominant, shifted } = detectDominance(state.dominantSpecies, updatedSpecies);
  let dominanceShifts = state.dominanceShifts;
  let dominantSince = state.dominantSince;
  if (shifted && dominant) {
    dominanceShifts = [...dominanceShifts, {
      at: signal.at, tick: signal.tick,
      from: state.dominantSpecies,
      to: dominant,
      reason: `influence ${updatedSpecies.find((s) => s.id === dominant)!.influenceWeight.toFixed(2)} > prev + ${DOMINANCE_HYSTERESIS_MARGIN}`,
    }];
    dominantSince = { at: signal.at, tick: signal.tick };
    // wins/losses bookkeeping
    updatedSpecies = updatedSpecies.map((s) => {
      if (s.id === dominant) return { ...s, cumulativeWins: s.cumulativeWins + 1, lastShiftTick: signal.tick };
      if (s.id === state.dominantSpecies) return { ...s, cumulativeLosses: s.cumulativeLosses + 1, lastShiftTick: signal.tick };
      return s;
    });
  }

  // 6. dominance history sample for the current dominant.
  if (dominant) {
    updatedSpecies = updatedSpecies.map((s) =>
      s.id === dominant
        ? {
            ...s,
            dominanceHistory: [...s.dominanceHistory, {
              at: signal.at, tick: signal.tick,
              influenceWeight: s.influenceWeight,
            }],
          }
        : s,
    );
  }

  // 7. derived field metrics.
  const volatilityField = round1(
    updatedSpecies.reduce((a, s) => a + s.volatility, 0) / updatedSpecies.length,
  );
  // ecologicalBalance: 10 = perfectly even (all 0.25); 0 = one species owns it.
  const weights = updatedSpecies.map((s) => s.influenceWeight);
  const maxW = Math.max(...weights);
  const ecologicalBalance = round1(clamp10(10 - (maxW - 0.25) * 30));

  const bias = computeEcologyBias(updatedSpecies);

  const ecologyState = classifyEcology(updatedSpecies, dominant, volatilityField);

  const expansionBias = bias.explorationIntensity;
  const conservationBias = bias.recoveryWeighting;
  const survivabilityBias = bias.deferAcceptance;

  const newState: InternalEcologyState = {
    species: updatedSpecies,
    tensionPairs,
    dominantSpecies: dominant,
    dominantSince,
    ecologicalBalance,
    volatilityField,
    survivabilityBias,
    expansionBias,
    conservationBias,
    state: ecologyState,
    dominanceShifts,
    totalUpdates: state.totalUpdates + 1,
    firstUpdatedAt: state.firstUpdatedAt ?? signal.at,
    updatedAt: signal.at,
  };

  return { newState, bias };
}

/** Apply the ecology bias to a RegulationGradients struct, clamping
 *  each gradient back to [0,1]. Pure function — caller owns ordering
 *  with respect to other pressures. */
export function applyEcologyBias<G extends EcologyBias>(
  gradients: G, bias: EcologyBias,
): G {
  return {
    ...gradients,
    cognitionThroughput:  clamp01(round2(gradients.cognitionThroughput  + bias.cognitionThroughput)),
    escalationPermission: clamp01(round2(gradients.escalationPermission + bias.escalationPermission)),
    explorationIntensity: clamp01(round2(gradients.explorationIntensity + bias.explorationIntensity)),
    deferAcceptance:      clamp01(round2(gradients.deferAcceptance      + bias.deferAcceptance)),
    recoveryWeighting:    clamp01(round2(gradients.recoveryWeighting    + bias.recoveryWeighting)),
    burstTolerance:       clamp01(round2(gradients.burstTolerance       + bias.burstTolerance)),
  };
}

/** Additional pressure on governance from ecology when the system is
 *  in an exhausted / unstable state. 0..0.2 — small but real. */
export function ecologyPressureContribution(state: InternalEcologyState): number {
  if (state.state === 'exhausted') return 0.2;
  if (state.state === 'unstable')  return 0.15;
  // High volatility without exhaustion is still a mild pressure.
  if (state.volatilityField >= 4) return round2(0.05 + (state.volatilityField - 4) * 0.02);
  return 0;
}
