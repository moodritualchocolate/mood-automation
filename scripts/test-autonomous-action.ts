/**
 * scripts/test-autonomous-action.ts
 *
 * WAVE 12 — Autonomous Action Architecture verification (Phases 181–220).
 *
 * Proves the organism stops asking "can we act?" and begins asking
 * "should this action exist in the world at all?" — with explicit
 * guards against compulsive automation.
 *
 * Run with:  npx tsx scripts/test-autonomous-action.ts
 */

import {
  createExecutionStore, createInitialExecution,
  evolveExecutionFromAuthorizedAction, evolveExecutionFromWithholding, evolveExecutionFromCompulsion,
  readAutonomousExecutionSynthesisCore,
} from '@lib/autonomousExecutionSynthesisCore';
import { readActionAuthorizationRuntime } from '@lib/actionAuthorizationRuntime';
import { readActionExistenceJustification } from '@lib/actionExistenceJustification';
import { readStrategicPublishEngine } from '@lib/strategicPublishEngine';
import { readAdaptiveCampaignDeployment } from '@lib/adaptiveCampaignDeployment';
import { readPlatformExecutionGovernor } from '@lib/platformExecutionGovernor';
import { readTrustAwareOptimization } from '@lib/trustAwareOptimization';
import { readAudienceRecoveryScheduler } from '@lib/audienceRecoveryScheduler';
import { readSilenceEnforcementLayer } from '@lib/silenceEnforcementLayer';
import { readAdaptivePacingEngine } from '@lib/adaptivePacingEngine';
import { readExecutionRiskManagement } from '@lib/executionRiskManagement';
import { readNarrativeContinuityEnforcement } from '@lib/narrativeContinuityEnforcement';
import { readStrategicRolloutIntelligence } from '@lib/strategicRolloutIntelligence';
import { readResonancePreservingOptimization } from '@lib/resonancePreservingOptimization';
import { readExecutionMemoryPersistence } from '@lib/executionMemoryPersistence';
import { readAutonomousExperimentationRuntime } from '@lib/autonomousExperimentationRuntime';
import { readEscalationVsRestraintEngine } from '@lib/escalationVsRestraintEngine';
import { readCampaignMutationControl } from '@lib/campaignMutationControl';
import { readFeedbackToStrategyBridge } from '@lib/feedbackToStrategyBridge';
import { readActionConsequenceTracker } from '@lib/actionConsequenceTracker';
import { readCompulsiveAutomationDetector } from '@lib/compulsiveAutomationDetector';
import { readActionDignityMonitor } from '@lib/actionDignityMonitor';
import { readExecutionLoadBalancer } from '@lib/executionLoadBalancer';
import { readOverReachDetector } from '@lib/overReachDetector';
import { readActionReversibilityPlanner } from '@lib/actionReversibilityPlanner';
import { readDeploymentWindowGovernor } from '@lib/deploymentWindowGovernor';
import { readRestraintBudgetRuntime } from '@lib/restraintBudgetRuntime';
import { readActionIntentVerifier } from '@lib/actionIntentVerifier';
import { readExecutionCadenceMemory } from '@lib/executionCadenceMemory';
import { readAutonomousActionThrottle } from '@lib/autonomousActionThrottle';
import { readActionWorthinessEvaluator } from '@lib/actionWorthinessEvaluator';
import { readChannelExecutionRouting } from '@lib/channelExecutionRouting';
import { readExecutionFeedbackLoop } from '@lib/executionFeedbackLoop';
import { readStrategicWithholdingEngine } from '@lib/strategicWithholdingEngine';
import { readActionPortfolioBalancer } from '@lib/actionPortfolioBalancer';
import { readExecutionHealthMonitor } from '@lib/executionHealthMonitor';
import { readAutonomyBoundaryEnforcement } from '@lib/autonomyBoundaryEnforcement';
import { readActionAccountabilityLedger } from '@lib/actionAccountabilityLedger';
import { readExecutionCoherenceValidator } from '@lib/executionCoherenceValidator';
import { readAutonomousActionGovernor } from '@lib/autonomousActionGovernor';
import type { ExecutiveWorldState } from '@lib/worldStateEngine';

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
  console.log('\n WAVE 12 — Autonomous Action Architecture verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── authorization is all-or-nothing across the eight gates ──────
  const allPass = readActionAuthorizationRuntime({
    identityIntact: true, resonancePresent: true, trustAvailable: true, timingRight: true,
    strategicDebtContained: true, audienceHasCapacity: true, realityCouplingHealthy: true, futurePreserved: true,
  });
  const oneFail = readActionAuthorizationRuntime({
    identityIntact: true, resonancePresent: true, trustAvailable: true, timingRight: true,
    strategicDebtContained: false, audienceHasCapacity: true, realityCouplingHealthy: true, futurePreserved: true,
  });
  checks.push([
    'action authorization runtime is all-or-nothing — one failed gate denies authorization',
    allPass.authorized && !oneFail.authorized && oneFail.gates_failed[0] === 'strategic debt',
    `8/8 → authorized; 7/8 → denied (failed: ${oneFail.gates_failed.join(', ')})`,
  ]);

  // ── action existence — "should this exist at all?" ──────────────
  const shouldExist = readActionExistenceJustification({
    resonancePresent: true, addsMeaning: true, worldHasRoom: true, saturation: 3,
  });
  const shouldNot = readActionExistenceJustification({
    resonancePresent: false, addsMeaning: false, worldHasRoom: true, saturation: 9,
  });
  checks.push([
    'action existence justification answers the Wave 12 governing question — "should this action exist?"',
    shouldExist.action_should_exist && !shouldNot.action_should_exist,
    `resonant + room → exists; noisy + saturated → "${shouldNot.justification}"`,
  ]);

  // ── publish + deployment + platform ─────────────────────────────
  const publishRipe = readStrategicPublishEngine({ authorized: true, actionShouldExist: true, timing: 'ripe', recommendSilence: false });
  const publishSilenced = readStrategicPublishEngine({ authorized: true, actionShouldExist: true, timing: 'ripe', recommendSilence: true });
  const publishEarly = readStrategicPublishEngine({ authorized: true, actionShouldExist: true, timing: 'too-early', recommendSilence: false });
  checks.push([
    'strategic publish engine — publish when ripe, hold when early, withhold when silence is called',
    publishRipe.publish_decision === 'publish' && publishEarly.publish_decision === 'hold' && publishSilenced.publish_decision === 'withhold',
    `ripe → publish; early → hold; silence → withhold`,
  ]);
  const deploymentPaused = readAdaptiveCampaignDeployment({ worldState: makeWorld(), audienceRecoveryDebt: 9, restraintBudget: 1 });
  const deploymentFull = readAdaptiveCampaignDeployment({ worldState: makeWorld({ collective_exhaustion: 2, attention_chaos: 2 }), audienceRecoveryDebt: 1, restraintBudget: 8 });
  checks.push([
    'adaptive campaign deployment scales intensity to recovery debt and restraint',
    deploymentPaused.deployment_mode === 'paused' && deploymentFull.deployment_mode === 'full',
    `debt 9 + restraint 1 → paused; calm world + slack → full`,
  ]);
  const platformUnsafe = readPlatformExecutionGovernor({ platformDrift: 9, attentionChaos: 9, saturation: 9 });
  const platformSafe = readPlatformExecutionGovernor({ platformDrift: 3, attentionChaos: 3, saturation: 3 });
  checks.push([
    'platform execution governor reads when the platform itself is hostile to the action',
    !platformUnsafe.platform_execution_safe && platformSafe.platform_execution_safe,
    `noisy platform → unsafe; calm platform → safe`,
  ]);

  // ── trust-aware optimization ────────────────────────────────────
  const trustRespected = readTrustAwareOptimization({ optimizationApplied: true, optimizationCorruptsTruth: false, chasingStimulus: false, trustLevel: 7 });
  const trustViolated = readTrustAwareOptimization({ optimizationApplied: true, optimizationCorruptsTruth: true, chasingStimulus: true, trustLevel: 7 });
  checks.push([
    'trust-aware optimization refuses optimizations that withdraw from the trust account',
    trustRespected.optimization_respects_trust && !trustViolated.optimization_respects_trust,
    `clean opt → respects trust (cost ${trustRespected.trust_cost}); corrupted opt → cost ${trustViolated.trust_cost}/10`,
  ]);

  // ── audience recovery + silence enforcement ─────────────────────
  const audienceTired = readAudienceRecoveryScheduler({ recoveryDebt: 8, audienceFatigue: 8, recommendSilence: true });
  const audienceReady = readAudienceRecoveryScheduler({ recoveryDebt: 1, audienceFatigue: 2, recommendSilence: false });
  checks.push([
    'audience recovery scheduler holds the audience as a finite, replenishable resource',
    !audienceTired.audience_is_ready && audienceReady.audience_is_ready && audienceTired.rest_cycles_recommended >= 2,
    `tired audience → not ready, ${audienceTired.rest_cycles_recommended} cycle(s) rest; calm → ready`,
  ]);
  const silenceEnforced = readSilenceEnforcementLayer({ recommendSilence: true, audienceNeedsRecovery: true, saturation: 7, actionWantsToProceed: true });
  checks.push([
    'silence enforcement layer hard-stops action and flags when a downstream layer tries to act through it',
    silenceEnforced.silence_enforced && silenceEnforced.silence_was_challenged,
    `silence enforced (${silenceEnforced.enforcement_reason}) and challenged`,
  ]);

  // ── pacing + execution risk + narrative continuity ──────────────
  const paceStopped = readAdaptivePacingEngine({ cadenceHealth: 4, recoveryDebt: 9, restraintBudget: 1 });
  const paceSteady = readAdaptivePacingEngine({ cadenceHealth: 8, recoveryDebt: 2, restraintBudget: 7 });
  checks.push([
    'adaptive pacing engine sets the rhythm of action — sparse when strained, steady when healthy',
    paceStopped.pace === 'stopped' && paceSteady.pace === 'steady',
    `depleted → stopped; healthy → steady`,
  ]);
  const riskUnmanaged = readExecutionRiskManagement({ irreversible: true, blackSwanExposure: 8, couplingFailing: true, strategicDebt: 8 });
  const riskOk = readExecutionRiskManagement({ irreversible: false, blackSwanExposure: 2, couplingFailing: false, strategicDebt: 1 });
  checks.push([
    'execution risk management sizes execution risk before it reaches the audience',
    !riskUnmanaged.risk_is_managed && riskOk.risk_is_managed,
    `irreversible + failing coupling → ${riskUnmanaged.execution_risk}/10; clean → ${riskOk.execution_risk}/10`,
  ]);
  const narrBreak = readNarrativeContinuityEnforcement({ narrativeDrift: 7, voiceConsistent: false, contradictsPriorClaim: true });
  const narrCont = readNarrativeContinuityEnforcement({ narrativeDrift: 1, voiceConsistent: true, contradictsPriorClaim: false });
  checks.push([
    'narrative continuity enforcement catches tonal breaks and contradictions',
    !narrBreak.narrative_continuous && narrCont.narrative_continuous,
    `contradiction + drift → ${narrBreak.continuity_break}/10 break; clean → continuous`,
  ]);

  // ── compulsion detector (THE CRITICAL GUARD) ───────────────────
  const compulsive = readCompulsiveAutomationDetector({
    restraintBudget: 1, recoveryDebt: 8, audienceReady: false, momentRewardsAction: false,
    actionsWithheld: 0, executionCycles: 6,
  });
  const deliberate = readCompulsiveAutomationDetector({
    restraintBudget: 7, recoveryDebt: 2, audienceReady: true, momentRewardsAction: true,
    actionsWithheld: 3, executionCycles: 8,
  });
  checks.push([
    'compulsive automation detector — THE CRITICAL GUARD — catches the organism the moment it begins to automate',
    compulsive.is_compulsive && !deliberate.is_compulsive && compulsive.compulsion_signals.length >= 3,
    `depleted + acting → COMPULSIVE (${compulsive.compulsion_signals.length} signals); healthy → deliberate`,
  ]);

  // ── dignity + intent verification ───────────────────────────────
  const undignified = readActionDignityMonitor({ pleadsForAttention: true, manipulates: true, raisesVoice: true, selfPossessed: false });
  const dignified = readActionDignityMonitor({ pleadsForAttention: false, manipulates: false, raisesVoice: false, selfPossessed: true });
  checks.push([
    'action dignity monitor holds the brand to dignity — no pleading, manipulating, or shouting',
    !undignified.action_is_dignified && dignified.action_is_dignified,
    `pleading + manipulating → ${undignified.dignity_score}/10; self-possessed → ${dignified.dignity_score}/10`,
  ]);
  const purposeIntent = readActionIntentVerifier({ answersRealNeed: true, drivenByCadence: false, drivenByMetric: false, drivenByDiscomfortWithSilence: false });
  const fearIntent = readActionIntentVerifier({ answersRealNeed: false, drivenByCadence: false, drivenByMetric: false, drivenByDiscomfortWithSilence: true });
  checks.push([
    'action intent verifier distinguishes genuine purpose from habit, performance pressure, and fear of silence',
    purposeIntent.intent_is_genuine && !fearIntent.intent_is_genuine && fearIntent.verified_intent === 'fear-of-silence',
    `real-need → "${purposeIntent.verified_intent}"; discomfort → "${fearIntent.verified_intent}"`,
  ]);

  // ── restraint budget + throttle + overreach ─────────────────────
  const restraintDepleted = readRestraintBudgetRuntime({ restraintBudget: 1, actionWouldSpend: true });
  const restraintHealthy = readRestraintBudgetRuntime({ restraintBudget: 8, actionWouldSpend: true });
  checks.push([
    'restraint budget runtime refuses action when restraint cannot be afforded — because then action is compulsion',
    !restraintDepleted.can_afford_action && restraintHealthy.can_afford_action && restraintDepleted.budget_state === 'depleted',
    `1/10 → depleted, cannot afford; 8/10 → healthy, can afford`,
  ]);
  const throttleClosed = readAutonomousActionThrottle({ executionLoad: 8, isCompulsive: true, restraintBudget: 1 });
  const throttleOpen = readAutonomousActionThrottle({ executionLoad: 3, isCompulsive: false, restraintBudget: 8 });
  checks.push([
    'autonomous action throttle is a final rate limiter — closed under compulsion, open when healthy',
    throttleClosed.throttle_level === 'closed' && throttleOpen.throttle_level === 'open',
    `compulsion → closed; healthy → open`,
  ]);
  const overreach = readOverReachDetector({ ambitionLevel: 10, trustLevel: 2, capacity: 2, reputationCredit: 2 });
  const grounded = readOverReachDetector({ ambitionLevel: 5, trustLevel: 7, capacity: 7, reputationCredit: 7 });
  checks.push([
    'overreach detector flags action that reaches past what trust and standing can support',
    overreach.is_overreaching && !grounded.is_overreaching,
    `ambition 10 + grasp 2 → overreach (${overreach.reach_gap}/10); ambition 5 + grasp 7 → grounded`,
  ]);

  // ── autonomy boundary enforcement ───────────────────────────────
  const boundaryCrossed = readAutonomyBoundaryEnforcement({
    irreversibleAndIdentityThreatening: false, wouldCorruptTruth: true,
    actsThroughEnforcedSilence: false, isCompulsive: false,
  });
  const withinBoundary = readAutonomyBoundaryEnforcement({
    irreversibleAndIdentityThreatening: false, wouldCorruptTruth: false,
    actsThroughEnforcedSilence: false, isCompulsive: false,
  });
  checks.push([
    'autonomy boundary enforcement defines what the organism will never do autonomously',
    !boundaryCrossed.within_boundary && withinBoundary.within_boundary &&
      boundaryCrossed.boundary_crossed !== null,
    `truth-corruption → BOUNDARY CROSSED ("${boundaryCrossed.boundary_crossed}"); clean → within`,
  ]);

  // ── worthiness + governance ─────────────────────────────────────
  const worthy = readActionWorthinessEvaluator({
    authorized: true, actionShouldExist: true, intentGenuine: true,
    dignified: true, executionRisk: 2, notOverreaching: true,
  });
  const unworthy = readActionWorthinessEvaluator({
    authorized: true, actionShouldExist: false, intentGenuine: false,
    dignified: false, executionRisk: 8, notOverreaching: false,
  });
  checks.push([
    'action worthiness evaluator merges every action signal into one verdict — worthy or not',
    worthy.action_is_worthy && !unworthy.action_is_worthy,
    `clean → WORTHY (${worthy.worthiness_score}/10); failing → ${unworthy.worthiness_score}/10`,
  ]);
  const govAction = readAutonomousActionGovernor({ authorized: true, isCompulsive: false, withinBoundary: true, executionCoherent: true, withholding: false });
  const govCompulsive = readAutonomousActionGovernor({ authorized: true, isCompulsive: true, withinBoundary: true, executionCoherent: true, withholding: false });
  const govRestraint = readAutonomousActionGovernor({ authorized: true, isCompulsive: false, withinBoundary: true, executionCoherent: true, withholding: true });
  checks.push([
    'autonomous action governor reads governed-action, restraint, drifting, and compulsive governance',
    govAction.governance === 'governed-action' && govCompulsive.governance === 'compulsive' && govRestraint.governance === 'restraint',
    `clean → "${govAction.governance}"; compulsion → "${govCompulsive.governance}"; withholding → "${govRestraint.governance}"`,
  ]);

  // ── coherence + withholding + portfolio + memory ────────────────
  const incoherent = readExecutionCoherenceValidator({
    publishing: true, silenceEnforced: true, throttlePermitsAction: false, authorized: false, actionIsWorthy: false,
  });
  const coherent = readExecutionCoherenceValidator({
    publishing: true, silenceEnforced: false, throttlePermitsAction: true, authorized: true, actionIsWorthy: true,
  });
  checks.push([
    'execution coherence validator catches the action layer contradicting itself',
    !incoherent.execution_is_coherent && coherent.execution_is_coherent && incoherent.incoherences.length >= 3,
    `publishing under silence + closed throttle → ${incoherent.incoherences.length} incoherence(s); clean → coherent`,
  ]);
  const withhold = readStrategicWithholdingEngine({ actionIsWorthy: false, silenceEnforced: true, audienceNeedsRecovery: true, restraintBudget: 2 });
  checks.push([
    'strategic withholding engine treats withholding as a positive strategic move',
    withhold.withhold && withhold.withholding_value >= 8,
    `silence + recovery owed → WITHHOLD (value ${withhold.withholding_value}/10)`,
  ]);
  const portfolioAllAction = readActionPortfolioBalancer({ actionsAuthorized: 19, actionsWithheld: 0 });
  const portfolioBalanced = readActionPortfolioBalancer({ actionsAuthorized: 6, actionsWithheld: 4 });
  checks.push([
    'action portfolio balancer reads when the campaign has tilted entirely into doing',
    portfolioAllAction.portfolio_balance === 'all-action' && portfolioBalanced.portfolio_is_balanced,
    `19/0 → all-action; 6/4 → balanced`,
  ]);
  const memory = readExecutionMemoryPersistence({ executionCycles: 5, actionsAuthorized: 3, actionsWithheld: 2 });
  checks.push([
    'execution memory persistence shows the organism keeps an honest record of its action',
    memory.memory_persisting && memory.actions_on_record === 5 && memory.restraint_ratio === 0.4,
    `5 cycles → 5 on record, ${Math.round(memory.restraint_ratio * 100)}% restraint`,
  ]);

  // ── helper readings exercised ───────────────────────────────────
  void readStrategicRolloutIntelligence({ actionsAuthorized: 0, timingRipe: true, recoveryDebt: 1 });
  void readResonancePreservingOptimization({ resonanceBefore: 8, optimizationApplied: true, chasedMetric: true, stillTruthful: false });
  void readAutonomousExperimentationRuntime({ restraintBudget: 7, reversible: true, executionRisk: 2, trustHealthy: true });
  void readEscalationVsRestraintEngine({ momentRewardsAction: true, restraintBudget: 7, recoveryDebt: 1, strategicDebt: 1 });
  void readCampaignMutationControl({ departureFromEstablished: 2, identityKept: true, mutationIsDeliberate: false });
  void readFeedbackToStrategyBridge({ lastActionResonated: true, audienceShowedFatigue: false, timingWasAccurate: true });
  void readActionConsequenceTracker({ actionsAuthorized: 5, recoveryDebt: 3, trustSpentOnAction: 3, cadenceHealth: 7 });
  void readExecutionLoadBalancer({ recoveryDebt: 3, restraintBudget: 7, cadenceHealth: 7 });
  void readActionReversibilityPlanner({ irreversible: false, actionProceeding: true, justificationStrength: 7 });
  void readDeploymentWindowGovernor({ timingRipe: true, timingMissed: false, silenceEnforced: false, audienceReady: true });
  void readExecutionCadenceMemory({ actionsAuthorized: 5, actionsWithheld: 3, cadenceHealth: 7 });
  void readChannelExecutionRouting({ saturation: 9, attentionChaos: 9, actionIsQuiet: true });
  void readExecutionFeedbackLoop({ lastResultObserved: true, feedbackRouted: true, nextActionAdjusted: true });
  void readExecutionHealthMonitor({ restraintBudget: 7, cadenceHealth: 7, recoveryDebt: 3, executionLoad: 3 });
  void readActionAccountabilityLedger({ actionsAuthorized: 4, actionsWithheld: 3, compulsiveSignals: 0, overreachCount: 0 });

  // ── the persistent state evolves and survives a restart ─────────
  const store = createExecutionStore();
  await store.reset();
  const base = createInitialExecution();
  const afterAuth = evolveExecutionFromAuthorizedAction(base);
  const afterWithhold = evolveExecutionFromWithholding(base);
  const afterCompul = evolveExecutionFromCompulsion(base);
  checks.push([
    'execution state evolves — authorized action spends restraint, withholding replenishes it, compulsion collapses it',
    afterAuth.actionsAuthorized === 1 && afterAuth.restraintBudget < base.restraintBudget &&
      afterWithhold.actionsWithheld === 1 && afterWithhold.restraintBudget > base.restraintBudget &&
      afterCompul.compulsiveSignals === 1 && afterCompul.restraintBudget < afterAuth.restraintBudget,
    `auth → restraint ${base.restraintBudget}→${afterAuth.restraintBudget}; ` +
      `withhold → ${base.restraintBudget}→${afterWithhold.restraintBudget}; ` +
      `compulsion → ${base.restraintBudget}→${afterCompul.restraintBudget}`,
  ]);
  await store.save(afterAuth);
  (globalThis as { __moodExecution?: unknown }).__moodExecution = undefined;
  const reloaded = await store.read();
  checks.push([
    'execution state persists and survives a restart',
    reloaded.executionCycles === 1 && reloaded.actionsAuthorized === 1,
    `reloaded ${reloaded.executionCycles} cycle, ${reloaded.actionsAuthorized} action on record`,
  ]);
  await store.reset();

  // ── THE CLOSING SYNTHESIS — should this action exist? ───────────
  const governedState = { ...createInitialExecution(), executionCycles: 6, actionsAuthorized: 4, actionsWithheld: 2, restraintBudget: 7, cadenceHealth: 8 };
  const governedSynth = readAutonomousExecutionSynthesisCore({
    state: governedState,
    governor: govAction,
    authorization: allPass,
    compulsion: deliberate,
    worthiness: worthy,
  });
  const compulsiveState = { ...createInitialExecution(), executionCycles: 8, actionsAuthorized: 8, actionsWithheld: 0, restraintBudget: 1, cadenceHealth: 2, compulsiveSignals: 3 };
  const compulsiveSynth = readAutonomousExecutionSynthesisCore({
    state: compulsiveState,
    governor: govCompulsive,
    authorization: allPass,
    compulsion: compulsive,
    worthiness: unworthy,
  });
  checks.push([
    'the closing synthesis answers "should this action exist?" — governed action vs compulsive automation',
    governedSynth.action_should_exist && !governedSynth.compulsive_automation &&
      !compulsiveSynth.action_should_exist && compulsiveSynth.compulsive_automation,
    `governed → "${governedSynth.execution_state}" (integrity ${governedSynth.execution_integrity_score}/10); ` +
      `compulsive → "${compulsiveSynth.execution_state}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 12 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 12 VERIFIED — the organism acts only when action should exist in the world, never compulsively.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
