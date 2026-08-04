/**
 * scripts/test-reality-organism.ts
 *
 * WAVE 7 — Reality Organism Architecture verification (Phases 71–90).
 *
 * Proves the cognitive civilization is now a LIVING ORGANISM: it has
 * finite energy that depletes with action and restores with rest, it
 * runs an immune system with memory, it reads the environment it lives
 * inside, it predicts strategic seasons, it protects itself from
 * existential risk — and, most importantly, it learns when NOT to act.
 *
 * Run with:  npx tsx scripts/test-reality-organism.ts
 */

import type { ExecutiveWorldState } from '@lib/worldStateEngine';
import type { CivilizationStabilityReading } from '@lib/civilizationStabilityLayer';
import type { IdeologicalMutationReading } from '@lib/ideologicalMutationDetection';
import type { HumanTruth } from '@/core/types';
import {
  createOrganismCoreStore, createInitialOrganism,
  evolveOrganismFromAction, evolveOrganismFromRest, recordImmuneEncounter,
  readPersistentOrganismCore,
} from '@lib/persistentOrganismCore';
import { mapEnvironmentalPressure } from '@lib/environmentalPressureMapping';
import { readCognitiveImmuneSystem } from '@lib/cognitiveImmuneSystem';
import { allocateStrategicEnergy } from '@lib/strategicEnergyAllocation';
import { detectNarrativeClimate } from '@lib/narrativeClimateDetection';
import { readIdentityStressTest } from '@lib/identityStressTesting';
import { readExpansionVsPreservation } from '@lib/expansionVsPreservation';
import { readRealityRhythmSync } from '@lib/realityRhythmSynchronization';
import { forecastCollectiveAttention } from '@lib/collectiveAttentionForecasting';
import { detectMemeticThreats } from '@lib/memeticThreatDetection';
import { readCivilizationFatigue } from '@lib/civilizationFatigueMonitoring';
import { readStrategicSilence } from '@lib/strategicSilenceIntelligence';
import { readEmotionalResourceManagement } from '@lib/emotionalResourceManagement';
import { readAdaptiveWorldStateModeling } from '@lib/adaptiveWorldStateModeling';
import { predictLongHorizon } from '@lib/longHorizonPrediction';
import { readInternalComplexityRegulation } from '@lib/internalComplexityRegulation';
import { readStrategicEvolutionGovernance } from '@lib/strategicEvolutionGovernance';
import { readRealityAdaptiveRuntime } from '@lib/realityAdaptiveRuntime';
import { readAutonomousStabilityPreservation } from '@lib/autonomousStabilityPreservation';
import { readExistentialRisk } from '@lib/existentialRiskLayer';
import { readTemporalPsychology } from '@lib/temporalPsychology';

function makeWorld(overrides: Partial<ExecutiveWorldState> = {}): ExecutiveWorldState {
  return {
    updatedAt: Date.now(),
    observationCount: 6,
    collective_exhaustion: 5,
    emotional_volatility: 5,
    anxiety_pressure: 5,
    social_fragmentation: 5,
    attention_chaos: 5,
    economic_pressure: 5,
    loneliness_index: 5,
    digital_overload: 5,
    trust_erosion: 5,
    world_tension: 5,
    climate: 'tense',
    climate_description: 'a tense world',
    most_acute_pressure: 'world tension',
    notes: [],
    ...overrides,
  };
}

const calmStability: CivilizationStabilityReading = {
  condition: 'stable', stability: 7, decay_signals: [], is_decaying: false, notes: [],
};
const decayingStability: CivilizationStabilityReading = {
  condition: 'decaying', stability: 2,
  decay_signals: ['optimization has beaten identity', 'cultural narrowing'],
  is_decaying: true, notes: [],
};
const noMutation: IdeologicalMutationReading = {
  mutation_detected: false, mutation_distance: 0,
  mutation_description: 'consistent with founding character', notes: [],
};

async function main() {
  console.log('\n WAVE 7 — Reality Organism Architecture verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── action depletes energy; rest restores it ────────────────────
  const fresh = createInitialOrganism();
  const acted = evolveOrganismFromAction(fresh, {
    energyCost: 3, stressAdded: 2, complexityAdded: 2, adapted: true,
  });
  const rested = evolveOrganismFromRest(acted);
  checks.push([
    'action depletes energy and rest restores it',
    acted.energyReserves < fresh.energyReserves &&
      rested.energyReserves > acted.energyReserves &&
      rested.consecutiveActions === 0 && acted.consecutiveActions === 1,
    `energy ${fresh.energyReserves} → act ${acted.energyReserves} → rest ${rested.energyReserves}; ` +
      `consecutiveActions reset on rest: ${rested.consecutiveActions === 0}`,
  ]);

  // ── the organism persists and survives a restart ────────────────
  const store = createOrganismCoreStore();
  await store.reset();
  const lived = evolveOrganismFromAction(createInitialOrganism(), {
    energyCost: 2, stressAdded: 1, complexityAdded: 1, adapted: true,
  });
  await store.save(lived);
  (globalThis as { __moodOrganism?: unknown }).__moodOrganism = undefined;
  const reloaded = await store.read();
  checks.push([
    'the organism vital state persists and survives a restart',
    reloaded.age === lived.age && reloaded.adaptationCount === 1,
    `reloaded age ${reloaded.age}, ${reloaded.adaptationCount} adaptation(s)`,
  ]);
  await store.reset();

  // ── environmental pressure detects a hostile world ──────────────
  const hostileEnv = mapEnvironmentalPressure({
    worldState: makeWorld({
      world_tension: 9, collective_exhaustion: 8, economic_pressure: 8,
      attention_chaos: 8, digital_overload: 8,
    }),
  });
  const calmEnv = mapEnvironmentalPressure({ worldState: makeWorld({
    world_tension: 2, collective_exhaustion: 2, economic_pressure: 2,
    attention_chaos: 2, digital_overload: 2,
  }) });
  checks.push([
    'environmental pressure mapping detects a hostile environment',
    hostileEnv.environment_is_hostile && !calmEnv.environment_is_hostile,
    `hostile load ${hostileEnv.environmental_load}/10 vs calm load ${calmEnv.environmental_load}/10`,
  ]);

  // ── the immune system recognises a known pathogen ───────────────
  let immuneOrganism = createInitialOrganism();
  immuneOrganism = recordImmuneEncounter(immuneOrganism, 'optimization-corruption', true);
  immuneOrganism = recordImmuneEncounter(immuneOrganism, 'optimization-corruption', true);
  const immune = readCognitiveImmuneSystem({
    organism: immuneOrganism,
    trendContaminated: true, optimizationCorrupts: true, identityDrifting: false,
    viralContamination: 7, consecutiveActions: 2,
  });
  checks.push([
    'the cognitive immune system detects threats and recognises a known pathogen',
    immune.threats_detected.length >= 2 && immune.recognised_known_pathogen,
    `detected [${immune.threats_detected.join(', ')}], recognised known pathogen: ${immune.recognised_known_pathogen}`,
  ]);

  // ── strategic energy: a depleted organism must conserve ─────────
  const depleted = { ...createInitialOrganism(), energyReserves: 2 };
  const conserve = allocateStrategicEnergy({
    organism: depleted, strategicWeight: 5, environmentalLoad: 7,
  });
  const commit = allocateStrategicEnergy({
    organism: createInitialOrganism(), strategicWeight: 9, environmentalLoad: 3,
  });
  checks.push([
    'strategic energy allocation forces conservation when reserves are low',
    conserve.must_conserve && conserve.allocation === 'conserve' && !commit.must_conserve,
    `depleted → "${conserve.allocation}"; fresh + vital run → "${commit.allocation}"`,
  ]);

  // ── THE WAVE 7 LESSON — the organism learns when NOT to act ──────
  const silenceNow = readStrategicSilence({
    needsRecovery: true, climateWouldSwallow: true, outOfPhase: true,
    mustConserve: true, strategicWeight: 4,
  });
  const speakNow = readStrategicSilence({
    needsRecovery: false, climateWouldSwallow: false, outOfPhase: false,
    mustConserve: false, strategicWeight: 8,
  });
  checks.push([
    'strategic silence intelligence — the organism learns when NOT to act',
    silenceNow.choose_silence && !speakNow.choose_silence,
    `under fatigue+hostile climate: silence (${silenceNow.silence_strength}/10); ` +
      `rested + vital run: speak (${speakNow.silence_strength}/10)`,
  ]);

  // ── existential risk converges from multiple signals ────────────
  const atRiskOrganism = {
    ...createInitialOrganism(), energyReserves: 1, stressAccumulation: 9,
  };
  const preservation = readAutonomousStabilityPreservation({
    organism: atRiskOrganism,
    fatigue: readCivilizationFatigue({ organism: atRiskOrganism, environmentalLoad: 8 }),
    complexity: readInternalComplexityRegulation({
      organism: atRiskOrganism, contradictionCount: 6, softSignalCount: 40,
    }),
  });
  const existential = readExistentialRisk({
    organism: atRiskOrganism, civilization: decayingStability,
    mutation: { ...noMutation, mutation_detected: true, mutation_description: 'the ideology has mutated' },
    preservation,
  });
  const safeExistential = readExistentialRisk({
    organism: createInitialOrganism(), civilization: calmStability,
    mutation: noMutation,
    preservation: readAutonomousStabilityPreservation({
      organism: createInitialOrganism(),
      fatigue: readCivilizationFatigue({ organism: createInitialOrganism(), environmentalLoad: 3 }),
      complexity: readInternalComplexityRegulation({
        organism: createInitialOrganism(), contradictionCount: 1, softSignalCount: 10,
      }),
    }),
  });
  checks.push([
    'the existential risk layer converges danger from multiple signals',
    existential.organism_at_risk && !safeExistential.organism_at_risk,
    `converged risk ${existential.existential_risk}/10 (at risk) vs ${safeExistential.existential_risk}/10 (safe)`,
  ]);

  // ── memetic threat detection catches a trend pathogen ───────────
  const infectedTruth: HumanTruth = {
    state: {
      id: 's', label: 's', family: 'fatigue', timeAnchor: null,
      setting: [], body: [], weight: 0.5,
    },
    truth: 'romanticize your soft life and protect your peace',
    tension: 't', voice: 'internal', forbidden: [],
  };
  const cleanTruth: HumanTruth = {
    ...infectedTruth,
    truth: 'she answered three more emails before she let herself stand up',
  };
  const memeticHit = detectMemeticThreats({ truth: infectedTruth });
  const memeticClear = detectMemeticThreats({ truth: cleanTruth });
  checks.push([
    'memetic threat detection catches a cultural pathogen and clears clean copy',
    memeticHit.memetic_infection_risk && !memeticClear.memetic_infection_risk,
    `infected copy → risk (${memeticHit.threats.length} threat[s]); observed copy → clear`,
  ]);

  // ── identity stress testing — the identity must hold or fail ────
  const stressFail = readIdentityStressTest({
    engagementPull: 9, environmentalLoad: 9, identityStrength: 2,
    timingWrong: true, optimizationCorrupts: true,
  });
  const stressHold = readIdentityStressTest({
    engagementPull: 3, environmentalLoad: 3, identityStrength: 9,
    timingWrong: false, optimizationCorrupts: false,
  });
  checks.push([
    'identity stress testing fails a weak identity under heavy pressure',
    !stressFail.identity_holds && stressHold.identity_holds,
    `weak identity under load: holds=${stressFail.identity_holds} (${stressFail.failure_mode}); ` +
      `strong identity, low load: holds=${stressHold.identity_holds}`,
  ]);

  // ── long-horizon prediction names a strategic season ────────────
  const noiseSeason = predictLongHorizon({
    worldState: makeWorld({ attention_chaos: 9, digital_overload: 9 }),
    organism: createInitialOrganism(),
  });
  checks.push([
    'long-horizon prediction names the coming strategic season',
    noiseSeason.predicted_season === 'a-season-of-noise' && noiseSeason.season_strategy.length > 0,
    `predicted "${noiseSeason.predicted_season}" — ${noiseSeason.season_strategy.slice(0, 70)}…`,
  ]);

  // ── strategic evolution governance refuses a sudden mutation ────
  const mutationRefused = readStrategicEvolutionGovernance({
    departureMagnitude: 9, identityStrength: 3, drivenByShortTermGain: true,
  });
  const gradualOk = readStrategicEvolutionGovernance({
    departureMagnitude: 4, identityStrength: 8, drivenByShortTermGain: false,
  });
  checks.push([
    'strategic evolution governance refuses a sudden mutation but permits gradual evolution',
    mutationRefused.mutation_refused && gradualOk.evolution_preserves_identity &&
      !gradualOk.mutation_refused,
    `large + short-term-driven → "${mutationRefused.pace}"; measured → "${gradualOk.pace}"`,
  ]);

  // ── the closing synthesis distinguishes adapting from addicted ──
  const addictedOrganism = {
    ...createInitialOrganism(), consecutiveActions: 8, energyReserves: 3,
  };
  const addicted = readPersistentOrganismCore({
    state: addictedOrganism, identityGoverns: false, stimulationDriven: true,
    existentialRisk: 4, preservationCallsForRest: false,
  });
  const adapting = readPersistentOrganismCore({
    state: createInitialOrganism(), identityGoverns: true, stimulationDriven: false,
    existentialRisk: 1, preservationCallsForRest: false,
  });
  checks.push([
    'the closing synthesis distinguishes an ADAPTING organism from an ADDICTED one',
    addicted.organism_is_addicted && !addicted.organism_is_adapting &&
      adapting.organism_is_adapting && !adapting.organism_is_addicted,
    `stimulation-driven, 8 runs without rest → addicted; identity-governed → adapting`,
  ]);

  // ── the reality-adaptive runtime adapts vs reacts ───────────────
  // The organism reads the rhythm as in-sync and wants to engage fully,
  // but its deeper adaptation quality is poor — and stimulation, not
  // identity, is driving it. That is reacting, not adapting.
  const reacting = readRealityAdaptiveRuntime({
    environmental: { environmental_load: 6, acute_pressure: 'attention chaos (6/10)', environment_is_hostile: false, notes: [] },
    rhythm: { phase: 'in-sync', synchronization: 6.5, on_the_exhale: true, notes: [] },
    worldModel: { world_shift_rate: 6, model_fidelity: 3, model_lagging: false, notes: [] },
    climate: { climate: 'crowded', hospitability: 5, climate_would_swallow_it: false, notes: [] },
    stimulationDriven: true,
  });
  const wellAdapted = readRealityAdaptiveRuntime({
    environmental: { environmental_load: 2, acute_pressure: 'world tension (2/10)', environment_is_hostile: false, notes: [] },
    rhythm: { phase: 'in-sync', synchronization: 9, on_the_exhale: true, notes: [] },
    worldModel: { world_shift_rate: 1, model_fidelity: 9, model_lagging: false, notes: [] },
    climate: { climate: 'open', hospitability: 9, climate_would_swallow_it: false, notes: [] },
    stimulationDriven: false,
  });
  checks.push([
    'the reality-adaptive runtime flags compulsive reaction over genuine adaptation',
    reacting.reacting_not_adapting && !wellAdapted.reacting_not_adapting,
    `stimulation-driven, poor adaptation quality → reacting=${reacting.reacting_not_adapting}; ` +
      `identity-governed, well-adapted → reacting=${wellAdapted.reacting_not_adapting}`,
  ]);

  // ── expansion vs preservation balances growth against survival ──
  const retrench = readExpansionVsPreservation({
    organism: { ...createInitialOrganism(), energyReserves: 2, stressAccumulation: 9 },
    environmentalLoad: 9, civilizationStability: 2,
  });
  const expand = readExpansionVsPreservation({
    organism: createInitialOrganism(), environmentalLoad: 2, civilizationStability: 9,
  });
  checks.push([
    'expansion vs preservation retrenches a depleted organism and lets a healthy one reach',
    retrench.posture === 'retrench' && (expand.posture === 'expand' || expand.posture === 'balanced-growth'),
    `depleted + hostile → "${retrench.posture}"; healthy + stable → "${expand.posture}"`,
  ]);

  // ── collective attention forecasting positions for the future ───
  const forecast = forecastCollectiveAttention({
    worldState: makeWorld({ attention_chaos: 9, digital_overload: 9 }), trail: [],
  });
  checks.push([
    'collective attention forecasting predicts where attention is heading',
    forecast.forecast.length > 0 && forecast.positioning.length > 0,
    `forecast "${forecast.forecast}" (confidence ${forecast.forecast_confidence}/10)`,
  ]);

  // ── emotional resource management protects the emotional budget ─
  const overspend = readEmotionalResourceManagement({
    stress: 8, strategicWeight: 8, recentIntensity: 9,
  });
  checks.push([
    'emotional resource management detects overspending of emotional intensity',
    overspend.overspending,
    `high stress + high recent intensity → spend "${overspend.spend}", overspending=${overspend.overspending}`,
  ]);

  // ── narrative climate detection reads the storytelling weather ──
  const hostileClimate = detectNarrativeClimate({
    worldState: makeWorld({ attention_chaos: 9, digital_overload: 9 }), viralContamination: 9,
  });
  const openClimate = detectNarrativeClimate({
    worldState: makeWorld({ attention_chaos: 2, digital_overload: 2 }), viralContamination: 1,
  });
  checks.push([
    'narrative climate detection reads when the climate would swallow the banner',
    hostileClimate.climate_would_swallow_it && !openClimate.climate_would_swallow_it,
    `saturated world → "${hostileClimate.climate}" (swallows); quiet world → "${openClimate.climate}"`,
  ]);

  // ── reality rhythm synchronization reads the culture's beat ──────
  const inSync = readRealityRhythmSync({
    worldState: makeWorld({ world_tension: 2 }),
    temporal: readTemporalPsychology({
      candidateRegister: 'soft', collectiveTension: 2, collectiveExhaustion: 2,
    }),
  });
  const outOfPhase = readRealityRhythmSync({
    worldState: makeWorld({ world_tension: 10 }),
    temporal: {
      timing_truth_score: 1, collective_receptivity: 1, moment_alignment: 1,
      psychological_readiness: 1, timing_is_wrong: true,
      reason: 'the moment is psychologically wrong', notes: [],
    },
  });
  checks.push([
    'reality rhythm synchronization reads when the organism is in or out of phase',
    inSync.synchronization > outOfPhase.synchronization && outOfPhase.phase === 'out-of-phase',
    `calm reality → "${inSync.phase}" (${inSync.synchronization}/10); ` +
      `peak-tension reality → "${outOfPhase.phase}" (${outOfPhase.synchronization}/10)`,
  ]);

  // ── adaptive world-state modeling tracks a fast-shifting reality ─
  const lagging = readAdaptiveWorldStateModeling({
    worldState: makeWorld({
      world_tension: 10, collective_exhaustion: 10, emotional_volatility: 10, attention_chaos: 10,
    }),
    priorWorldState: makeWorld({
      world_tension: 2, collective_exhaustion: 2, emotional_volatility: 2, attention_chaos: 2,
    }),
  });
  const tracking = readAdaptiveWorldStateModeling({
    worldState: makeWorld(), priorWorldState: makeWorld(),
  });
  checks.push([
    'adaptive world-state modeling detects when the model lags a fast-shifting reality',
    lagging.model_lagging && !tracking.model_lagging,
    `reality lurched → shift ${lagging.world_shift_rate}/10, lagging=${lagging.model_lagging}; ` +
      `steady reality → lagging=${tracking.model_lagging}`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 7 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 7 VERIFIED — a living organism that survives reality without losing itself.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
