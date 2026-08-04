/**
 * scripts/test-strategic-future.ts
 *
 * WAVE 11 — Strategic Future Intelligence verification (Phases 151–180).
 *
 * Proves the organism stops asking "what works now?" and begins
 * asking "what future are we compounding toward?" — simulating
 * scenarios, branching timelines, weighing second-order cost, holding
 * strategic patience, and protecting identity across the long horizon.
 *
 * Run with:  npx tsx scripts/test-strategic-future.ts
 */

import type { ExecutiveWorldState } from '@lib/worldStateEngine';
import {
  createStrategicFutureStore, createInitialStrategicFuture,
  evolveFutureFromCompounding, evolveFutureFromNowOptimization, evolveFutureFromPatience,
  readAutonomousStrategicPlanningCore,
} from '@lib/autonomousStrategicPlanningCore';
import { simulateFutureScenarios } from '@lib/futureScenarioSimulation';
import { readStrategicTimelineBranching } from '@lib/strategicTimelineBranching';
import { mapNarrativeFuture } from '@lib/narrativeFutureMapping';
import { predictCulturalShift } from '@lib/culturalShiftPrediction';
import { modelReputationFuture } from '@lib/reputationFutureModeling';
import { readTrustCompounding } from '@lib/trustCompoundingEngine';
import { readMarketTiming } from '@lib/marketTimingIntelligence';
import { readStrategicPatience } from '@lib/strategicPatienceRuntime';
import { readSecondOrderConsequence } from '@lib/secondOrderConsequenceEngine';
import { readAntiFragility } from '@lib/antiFragilityFutureArchitecture';
import { mapBlackSwanSensitivity } from '@lib/blackSwanSensitivityMapping';
import { simulateCompetitorEvolution } from '@lib/competitorEvolutionSimulation';
import { forecastEcosystemPressure } from '@lib/ecosystemPressureForecasting';
import { planIdentityContinuity } from '@lib/identityContinuityPlanner';
import { readStrategicSacrifice } from '@lib/strategicSacrificeEngine';
import { scanHorizon } from '@lib/horizonScanningEngine';
import { readOpportunityCost } from '@lib/opportunityCostLedger';
import { readCompoundingAdvantage } from '@lib/compoundingAdvantageTracker';
import { readStrategicDebt } from '@lib/strategicDebtMonitor';
import { readFutureMemoryArchive } from '@lib/futureMemoryArchive';
import { readLongHorizonRisk } from '@lib/longHorizonRiskBalance';
import { detectIrreversibility } from '@lib/irreversibilityDetector';
import { readStrategicOptionality } from '@lib/strategicOptionalityEngine';
import { readGenerationalStrategy } from '@lib/generationalStrategyLayer';
import { projectFutureIdentity } from '@lib/futureIdentityProjection';
import { readStrategicConviction } from '@lib/strategicConvictionEngine';
import { detectTemporalArbitrage } from '@lib/temporalArbitrageDetector';
import { validateFutureCoherence } from '@lib/futureCoherenceValidator';
import { readStrategicFutureGovernor } from '@lib/strategicFutureGovernor';

function makeWorld(overrides: Partial<ExecutiveWorldState> = {}): ExecutiveWorldState {
  return {
    updatedAt: Date.now(), observationCount: 8,
    collective_exhaustion: 4, emotional_volatility: 4, anxiety_pressure: 4,
    social_fragmentation: 4, attention_chaos: 4, economic_pressure: 4,
    loneliness_index: 4, digital_overload: 4, trust_erosion: 4, world_tension: 4,
    climate: 'low-grade-strain', climate_description: 'a workable world',
    most_acute_pressure: 'world tension', notes: [], ...overrides,
  };
}

async function main() {
  console.log('\n WAVE 11 — Strategic Future Intelligence verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── future scenario simulation lays out best / worst / likely ───
  const scenarios = simulateFutureScenarios({ worldState: makeWorld(), trustCarried: 7, organismVitality: 8 });
  checks.push([
    'future scenario simulation lays out best, worst, and most-likely futures',
    scenarios.scenarios.length === 3 && scenarios.best_case.desirability >= scenarios.worst_case.desirability,
    `most likely "${scenarios.most_likely.name}" — expected future ${scenarios.expected_future}/10`,
  ]);
  const grimScenarios = simulateFutureScenarios({ worldState: makeWorld({ world_tension: 9, collective_exhaustion: 9 }), trustCarried: 2, organismVitality: 2 });

  // ── strategic timeline branching picks a branch ─────────────────
  const healthyBranch = readStrategicTimelineBranching({ scenarios, identityStrength: 8, pushedForReach: false });
  const reachBranch = readStrategicTimelineBranching({ scenarios, identityStrength: 8, pushedForReach: true });
  checks.push([
    'strategic timeline branching walks a healthy branch unless pushed for reach',
    healthyBranch.on_a_healthy_branch && !reachBranch.on_a_healthy_branch &&
      reachBranch.chosen_branch.path === 'reach now',
    `unpushed → "${healthyBranch.chosen_branch.path}"; pushed for reach → "${reachBranch.chosen_branch.path}"`,
  ]);

  // ── narrative future mapping reads coherence vs drift ───────────
  const coherentNarrative = mapNarrativeFuture({ trustCarried: 8, strategicDebt: 1, identityHeld: true });
  const driftedNarrative = mapNarrativeFuture({ trustCarried: 2, strategicDebt: 9, identityHeld: false });
  checks.push([
    'narrative future mapping reads where the narrative is heading',
    coherentNarrative.narrative_is_coherent && !driftedNarrative.narrative_is_coherent,
    `identity held → coherent; debt + identity lost → drift ${driftedNarrative.drift_from_origin}/10`,
  ]);

  // ── cultural shift prediction names the coming shift ────────────
  const shift = predictCulturalShift({ worldState: makeWorld({ collective_exhaustion: 8 }) });
  checks.push([
    'cultural shift prediction names the coming cultural shift',
    shift.predicted_shift === 'toward-deeper-fatigue',
    `predicted "${shift.predicted_shift}" (magnitude ${shift.shift_magnitude}/10)`,
  ]);

  // ── reputation / trust compounding ──────────────────────────────
  const risingRep = modelReputationFuture({ reputationCredit: 6, trustForming: true, trustDecaying: false, strategicDebt: 1 });
  const erodingRep = modelReputationFuture({ reputationCredit: 6, trustForming: false, trustDecaying: true, strategicDebt: 8 });
  checks.push([
    'reputation future modeling projects a rising vs an eroding arc',
    risingRep.reputation_arc === 'rising' && erodingRep.reputation_arc === 'eroding',
    `trust forming → "${risingRep.reputation_arc}"; trust decaying + debt → "${erodingRep.reputation_arc}"`,
  ]);
  const compounding = readTrustCompounding({ trustLevel: 6, trustForming: true, trustDecaying: false, patienceHonored: 4 });
  const notCompounding = readTrustCompounding({ trustLevel: 6, trustForming: false, trustDecaying: true, patienceHonored: 0 });
  checks.push([
    'the trust compounding engine reads when trust is left to compound',
    compounding.trust_compounding && !notCompounding.trust_compounding,
    `forming + patience → compounding (rate ${compounding.compounding_rate}); decaying → not`,
  ]);

  // ── market timing + strategic patience ──────────────────────────
  const ripeTiming = readMarketTiming({ worldState: makeWorld(), culturalShift: predictCulturalShift({ worldState: makeWorld() }) });
  const earlyTiming = readMarketTiming({ worldState: makeWorld({ emotional_volatility: 2, attention_chaos: 2, collective_exhaustion: 2 }), culturalShift: predictCulturalShift({ worldState: makeWorld({ emotional_volatility: 2, attention_chaos: 2, collective_exhaustion: 2 }) }) });
  const patienceNow = readStrategicPatience({ timing: earlyTiming, scenarios: grimScenarios, strategicDebt: 8 });
  const actNow = readStrategicPatience({ timing: ripeTiming, scenarios, strategicDebt: 2 });
  checks.push([
    'market timing + strategic patience recommend the deliberate wait when the moment is early',
    patienceNow.recommend_patience && !actNow.recommend_patience,
    `early + grim + debt → patience (${patienceNow.patience_strength}/10); ripe → act`,
  ]);

  // ── second-order consequence catches the hidden cost ────────────
  const negativeSecondOrder = readSecondOrderConsequence({ optimizationCorrupts: true, chasedStimulus: true, saturation: 8 });
  const benignSecondOrder = readSecondOrderConsequence({ optimizationCorrupts: false, chasedStimulus: false, saturation: 3 });
  checks.push([
    'the second-order consequence engine catches a hidden future cost behind a present win',
    negativeSecondOrder.second_order_is_negative && !benignSecondOrder.second_order_is_negative,
    `stimulus run → hidden cost "${negativeSecondOrder.hidden_cost}"; true run → benign`,
  ]);

  // ── anti-fragility + black swan ─────────────────────────────────
  const fragile = readAntiFragility({ worstCaseDesirability: 1, compoundingAdvantage: 2, strategicDebt: 8, identitySurvives: false });
  const antifragile = readAntiFragility({ worstCaseDesirability: 6, compoundingAdvantage: 8, strategicDebt: 1, identitySurvives: true });
  checks.push([
    'anti-fragility architecture tells a fragile future from an anti-fragile one',
    fragile.is_fragile && !antifragile.is_fragile,
    `no buffer → fragile (${fragile.antifragility}/10); buffered → anti-fragile (${antifragile.antifragility}/10)`,
  ]);
  const exposed = mapBlackSwanSensitivity({ worldState: makeWorld({ trust_erosion: 8, emotional_volatility: 8 }), identityStrength: 3, compoundingAdvantage: 2 });
  checks.push([
    'black swan sensitivity mapping flags dangerous exposure to an unmodelled shock',
    exposed.exposure_is_dangerous,
    `volatile world + thin identity → exposure ${exposed.black_swan_exposure}/10, vulnerable to ${exposed.vulnerable_to}`,
  ]);

  // ── competitor + ecosystem ──────────────────────────────────────
  const racingField = simulateCompetitorEvolution({ worldState: makeWorld({ attention_chaos: 9 }), platformDrift: 9 });
  const tighteningEcosystem = forecastEcosystemPressure({ worldState: makeWorld({ digital_overload: 9, economic_pressure: 8, social_fragmentation: 8 }), attentionEconomyPressure: 9 });
  checks.push([
    'competitor evolution and ecosystem forecasting read a tightening field',
    racingField.must_differentiate && tighteningEcosystem.ecosystem_tightening,
    `field → must differentiate; ecosystem → tightening (${tighteningEcosystem.forecast_pressure}/10)`,
  ]);

  // ── identity continuity across the horizon ──────────────────────
  const identitySurvives = planIdentityContinuity({ identityStrength: 8, scenarios, strategicDebt: 1, narrativeDrift: 1 });
  const identityAtRisk = planIdentityContinuity({ identityStrength: 2, scenarios: grimScenarios, strategicDebt: 9, narrativeDrift: 8 });
  checks.push([
    'the identity continuity planner reads whether identity survives the long horizon',
    identitySurvives.identity_survives_horizon && !identityAtRisk.identity_survives_horizon,
    `strong identity → survives; debt + drift → at risk (continuity risk ${identityAtRisk.continuity_risk}/10)`,
  ]);

  // ── strategic sacrifice + opportunity cost + debt ───────────────
  const worthSacrifice = readStrategicSacrifice({ compoundingAdvantage: 8, strategicDebt: 1, timing: earlyTiming });
  checks.push([
    'the strategic sacrifice engine decides when giving up the present spike is worth it',
    worthSacrifice.sacrifice_is_worth_it,
    `early window + advantage → sacrifice worth it (value ${worthSacrifice.sacrifice_value}/10)`,
  ]);
  const dangerousDebt = readStrategicDebt({ priorDebt: 7, nowOptimizedCount: 5, optimizingForNow: true });
  checks.push([
    'the strategic debt monitor flags debt grown dangerous',
    dangerousDebt.debt_is_dangerous,
    `7/10 prior + now-optimizing → ${dangerousDebt.strategic_debt}/10 dangerous`,
  ]);

  // ── compounding advantage + optionality + irreversibility ───────
  const advCompounding = readCompoundingAdvantage({ priorAdvantage: 7, trustCompounding: true, futureCompoundedCount: 8, nowOptimizedCount: 1 });
  const advNotCompounding = readCompoundingAdvantage({ priorAdvantage: 5, trustCompounding: false, futureCompoundedCount: 1, nowOptimizedCount: 8 });
  checks.push([
    'the compounding advantage tracker reads an edge that grows on itself',
    advCompounding.advantage_is_compounding && !advNotCompounding.advantage_is_compounding,
    `trust + future-choosing → compounding; now-optimizing → not`,
  ]);
  const irreversible = detectIrreversibility({ sacrificeInPlay: true, continuityRisk: 8, optimizationCorrupts: true, narrativeDrift: 7 });
  const reversible = detectIrreversibility({ sacrificeInPlay: false, continuityRisk: 1, optimizationCorrupts: false, narrativeDrift: 1 });
  checks.push([
    'the irreversibility detector flags a decision that cannot be undone',
    irreversible.decision_is_irreversible && !reversible.decision_is_irreversible,
    `corruption + drift → irreversible (${irreversible.irreversibility}/10); clean → reversible`,
  ]);

  // ── future identity projection + generational strategy ──────────
  const trueProjection = projectFutureIdentity({ identityStrength: 8, narrativeDrift: 1, strategicDebt: 1, optimizingForNow: false });
  const driftedProjection = projectFutureIdentity({ identityStrength: 2, narrativeDrift: 8, strategicDebt: 9, optimizingForNow: true });
  checks.push([
    'future identity projection reads who the organism becomes if it keeps deciding this way',
    trueProjection.identity_projection_is_true && !driftedProjection.identity_projection_is_true,
    `disciplined → "${trueProjection.projected_identity}"; now-optimizing → "${driftedProjection.projected_identity}"`,
  ]);

  // ── future coherence + governor ─────────────────────────────────
  const coherentFuture = validateFutureCoherence({ narrativeCoherent: true, identitySurvivesHorizon: true, onHealthyBranch: true, identityProjectionTrue: true });
  const incoherentFuture = validateFutureCoherence({ narrativeCoherent: false, identitySurvivesHorizon: false, onHealthyBranch: false, identityProjectionTrue: false });
  checks.push([
    'the future coherence validator catches a future plan that contradicts itself',
    coherentFuture.future_is_coherent && !incoherentFuture.future_is_coherent,
    `aligned plan → coherent; contradictory plan → ${incoherentFuture.incoherences.length} incoherence(s)`,
  ]);
  const compoundingGov = readStrategicFutureGovernor({ strategicDebtDangerous: false, advantageIsCompounding: true, futureIsCoherent: true, secondOrderNegative: false });
  const nowGov = readStrategicFutureGovernor({ strategicDebtDangerous: true, advantageIsCompounding: false, futureIsCoherent: false, secondOrderNegative: true });
  checks.push([
    'the strategic future governor reads compounding vs now-optimizing governance',
    compoundingGov.governance === 'compounding' && nowGov.governance === 'now-optimizing',
    `contained + coherent → "${compoundingGov.governance}"; debt + negative second-order → "${nowGov.governance}"`,
  ]);

  // ── the persistent state evolves and survives a restart ─────────
  const store = createStrategicFutureStore();
  await store.reset();
  const base = createInitialStrategicFuture();
  const afterCompound = evolveFutureFromCompounding(base);
  const afterNow = evolveFutureFromNowOptimization(base);
  const afterPatience = evolveFutureFromPatience(base);
  checks.push([
    'the strategic-future state evolves — compounding builds advantage, now-optimizing accrues debt, patience eases it',
    afterCompound.compoundingAdvantage > base.compoundingAdvantage &&
      afterNow.strategicDebt > base.strategicDebt &&
      afterPatience.strategicDebt < base.strategicDebt && afterPatience.patienceHonored === 1,
    `compound → advantage ${base.compoundingAdvantage}→${afterCompound.compoundingAdvantage}; ` +
      `now → debt ${base.strategicDebt}→${afterNow.strategicDebt}; patience → debt ${base.strategicDebt}→${afterPatience.strategicDebt}`,
  ]);
  let state = evolveFutureFromCompounding(afterCompound);
  await store.save(state);
  (globalThis as { __moodStrategicFuture?: unknown }).__moodStrategicFuture = undefined;
  const reloaded = await store.read();
  checks.push([
    'the strategic-future state persists and survives a restart',
    reloaded.planningCycles === 2 && reloaded.futureCompoundedCount === 2,
    `reloaded ${reloaded.planningCycles} cycles, ${reloaded.futureCompoundedCount} futures compounded`,
  ]);
  await store.reset();

  // ── helper readings reachable without error ─────────────────────
  void readGenerationalStrategy({ civilizationGeneration: 12, compoundingAdvantage: 8, identitySurvivesHorizon: true });
  void readStrategicConviction({ identityStrength: 8, scenarios, timing: ripeTiming });
  void detectTemporalArbitrage({ timing: ripeTiming, horizon: scanHorizon({ worldState: makeWorld(), externalSignalVolume: 6 }), competitivePressure: 3 });
  void readLongHorizonRisk({ scenarios, antifragility: antifragile.antifragility, strategicDebt: 1 });
  void readFutureMemoryArchive({ predictionsLogged: 8, planningCycles: 8, futureCompoundedCount: 6, nowOptimizedCount: 2 });
  void readStrategicOptionality({ healthyBranchCount: 2, irreversibility: 2, strategicDebt: 1 });
  void readOpportunityCost({ scenarios, patienceHonored: 3, nowOptimizedCount: 1 });

  // ── THE CLOSING SYNTHESIS — compounding a future vs now ─────────
  const compoundingState = { ...createInitialStrategicFuture(), planningCycles: 8, futureCompoundedCount: 7, nowOptimizedCount: 1, compoundingAdvantage: 8, strategicDebt: 2 };
  const compounds = readAutonomousStrategicPlanningCore({
    state: compoundingState, governor: compoundingGov,
    compounding: advCompounding, debt: readStrategicDebt({ priorDebt: 2, nowOptimizedCount: 1, optimizingForNow: false }),
    coherence: coherentFuture,
  });
  const nowState = { ...createInitialStrategicFuture(), planningCycles: 8, futureCompoundedCount: 1, nowOptimizedCount: 7, compoundingAdvantage: 2, strategicDebt: 8 };
  const optimizesNow = readAutonomousStrategicPlanningCore({
    state: nowState, governor: nowGov,
    compounding: advNotCompounding, debt: dangerousDebt, coherence: incoherentFuture,
  });
  checks.push([
    'the closing synthesis distinguishes an organism COMPOUNDING a future from one OPTIMIZING for now',
    compounds.organism_compounds_a_future && !compounds.organism_optimizes_for_now &&
      optimizesNow.organism_optimizes_for_now && !optimizesNow.organism_compounds_a_future,
    `future-dominated → "${compounds.planning_state}"; now-dominated → "${optimizesNow.planning_state}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 11 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 11 VERIFIED — the organism compounds a future instead of optimizing for now.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
