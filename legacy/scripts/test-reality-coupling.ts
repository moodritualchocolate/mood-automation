/**
 * scripts/test-reality-coupling.ts
 *
 * WAVE 10 — Reality Coupling Architecture verification (Phases 131–150).
 *
 * Proves the organism stops living only inside itself and begins
 * learning from the external world — audience, trust, saturation,
 * fatigue — and, above all, that it can tell TRUE RESONANCE apart
 * from STIMULUS ADDICTION.
 *
 * Run with:  npx tsx scripts/test-reality-coupling.ts
 */

import type { ExecutiveWorldState } from '@lib/worldStateEngine';
import {
  createRealityCouplingStore, createInitialCoupling,
  evolveCouplingFromResonance, evolveCouplingFromStimulus, evolveCouplingFromSilence,
  readRealityCouplingCore,
} from '@lib/realityCouplingCore';
import { readRealityIngestionEngine } from '@lib/realityIngestionEngine';
import { scoreEngagementTruth } from '@lib/engagementTruthScoring';
import { mapEmotionalSaturation } from '@lib/emotionalSaturationMap';
import { readTrustDecay } from '@lib/trustDecayEngine';
import { monitorNarrativeClimate } from '@lib/narrativeClimateMonitor';
import { readAudienceNervousSystem } from '@lib/audienceNervousSystemModel';
import { readPlatformDrift } from '@lib/platformDriftRuntime';
import { trackAuthenticityErosion } from '@lib/authenticityErosionTracker';
import { recommendSilence } from '@lib/silenceRecommendationRuntime';
import { readReputationPressure } from '@lib/reputationPressureEngine';
import { readMeaningCompression } from '@lib/meaningCompressionEngine';
import { detectSocialExhaustion } from '@lib/socialExhaustionDetector';
import { readAttentionEconomyPressure } from '@lib/attentionEconomyPressure';
import { detectRealityContradiction } from '@lib/contradictionDetectionLayer';
import { fuseWorldFeedback } from '@lib/worldFeedbackFusion';
import { detectTrueResonance } from '@lib/trueResonanceDetector';
import { governRealityCoupling } from '@lib/realityCouplingGovernor';
import { readExternalRealityModel } from '@lib/externalRealityModel';
import { readCouplingHealth } from '@lib/couplingHealthMonitor';

function makeWorld(overrides: Partial<ExecutiveWorldState> = {}): ExecutiveWorldState {
  return {
    updatedAt: Date.now(), observationCount: 8,
    collective_exhaustion: 5, emotional_volatility: 5, anxiety_pressure: 5,
    social_fragmentation: 5, attention_chaos: 5, economic_pressure: 5,
    loneliness_index: 5, digital_overload: 5, trust_erosion: 5, world_tension: 5,
    climate: 'tense', climate_description: 'a tense world', most_acute_pressure: 'world tension',
    notes: [], ...overrides,
  };
}

async function main() {
  console.log('\n WAVE 10 — Reality Coupling Architecture verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── reality ingestion reads whether the world is speaking ───────
  const speaking = readRealityIngestionEngine({ worldState: makeWorld(), externalSignalCount: 9 });
  const quiet = readRealityIngestionEngine({ worldState: makeWorld({ observationCount: 0 }), externalSignalCount: 0 });
  checks.push([
    'reality ingestion reads whether the world is speaking',
    speaking.world_is_speaking && !quiet.world_is_speaking,
    `9 signals → speaking (${speaking.external_signal_volume}/10); 0 signals → quiet`,
  ]);

  // ── engagement truth scoring tells resonance from stimulus ──────
  const stimulusEng = scoreEngagementTruth({ engagementCorruption: 9, viralityRisk: 8, truthValue: 3, optimizationCorrupts: true });
  const trueEng = scoreEngagementTruth({ engagementCorruption: 2, viralityRisk: 2, truthValue: 9, optimizationCorrupts: false });
  checks.push([
    'engagement truth scoring separates stimulus from a real response to truth',
    stimulusEng.reads_as_stimulus && !trueEng.reads_as_stimulus,
    `corrupted run → stimulus (${stimulusEng.engagement_truth_score}/10); true run → resonance (${trueEng.engagement_truth_score}/10)`,
  ]);

  // ── emotional saturation map detects a saturated audience ───────
  const saturated = mapEmotionalSaturation({ worldState: makeWorld({ attention_chaos: 9, digital_overload: 9 }), priorSaturation: 7, recentShipCount: 5 });
  const fresh = mapEmotionalSaturation({ worldState: makeWorld({ attention_chaos: 2, digital_overload: 2 }), priorSaturation: 1, recentShipCount: 0 });
  checks.push([
    'the emotional saturation map detects a saturated audience',
    saturated.audience_is_saturated && !fresh.audience_is_saturated,
    `heavy feed → saturated (${saturated.saturation}/10); quiet feed → fresh (${fresh.saturation}/10)`,
  ]);

  // ── trust decay engine models trust forming and decaying ────────
  const decaying = readTrustDecay({ priorTrust: 6, identityHeld: false, optimizationCorrupts: true, authenticityEroding: true });
  const forming = readTrustDecay({ priorTrust: 6, identityHeld: true, optimizationCorrupts: false, authenticityEroding: false });
  checks.push([
    'the trust decay engine models trust forming and decaying',
    decaying.trust_is_decaying && forming.trust_trend === 'forming',
    `optimization + erosion → decaying (${decaying.trust_level}/10); identity held → forming (${forming.trust_level}/10)`,
  ]);

  // ── narrative climate monitor reads a closed climate ────────────
  const closedClimate = monitorNarrativeClimate({ worldState: makeWorld({ attention_chaos: 9, digital_overload: 9 }), externalSignalVolume: 9 });
  const openClimate = monitorNarrativeClimate({ worldState: makeWorld({ attention_chaos: 2, digital_overload: 2 }), externalSignalVolume: 1 });
  checks.push([
    'the narrative climate monitor reads when the climate rejects addition',
    closedClimate.climate_rejects_addition && !openClimate.climate_rejects_addition,
    `noisy world → "${closedClimate.climate}"; quiet world → "${openClimate.climate}"`,
  ]);

  // ── audience nervous system models a listener past threshold ────
  const exhaustedAudience = readAudienceNervousSystem({ worldState: makeWorld({ collective_exhaustion: 10, digital_overload: 9 }), saturation: 9 });
  const receptiveAudience = readAudienceNervousSystem({ worldState: makeWorld({ collective_exhaustion: 2, attention_chaos: 2, emotional_volatility: 2, anxiety_pressure: 2 }), saturation: 1 });
  checks.push([
    'the audience nervous system models a listener past its threshold',
    exhaustedAudience.past_threshold && !receptiveAudience.past_threshold,
    `tired world → "${exhaustedAudience.audience_state}"; calm world → "${receptiveAudience.audience_state}"`,
  ]);

  // ── platform drift detects an environment rewarding noise ───────
  const driftedPlatform = readPlatformDrift({ worldState: makeWorld({ attention_chaos: 9, digital_overload: 9 }), viralityRisk: 9 });
  checks.push([
    'platform drift detects a distribution environment rewarding noise',
    driftedPlatform.platform_rewards_noise,
    `noisy platform → drift ${driftedPlatform.platform_drift}/10 — ${driftedPlatform.drift_direction}`,
  ]);

  // ── authenticity erosion erodes on stimulus, restores when clean ─
  const eroded = trackAuthenticityErosion({ priorAuthenticity: 8, optimizationCorrupts: true, readsAsStimulus: true, platformRewardsNoise: true });
  const restored = trackAuthenticityErosion({ priorAuthenticity: 6, optimizationCorrupts: false, readsAsStimulus: false, platformRewardsNoise: false });
  checks.push([
    'authenticity erosion drains the reserve on stimulus and restores it on a clean cycle',
    eroded.authenticity_eroding && eroded.authenticity_reserve < 8 && !restored.authenticity_eroding && restored.authenticity_reserve > 6,
    `stimulus cycle → ${eroded.authenticity_reserve}/10; clean cycle → ${restored.authenticity_reserve}/10`,
  ]);

  // ── social exhaustion detects an exhausted world ────────────────
  const exhaustedWorld = detectSocialExhaustion({ worldState: makeWorld({ collective_exhaustion: 10, anxiety_pressure: 9, digital_overload: 9, loneliness_index: 9 }) });
  const okWorld = detectSocialExhaustion({ worldState: makeWorld({ collective_exhaustion: 2, anxiety_pressure: 2, digital_overload: 2, loneliness_index: 2 }) });
  checks.push([
    'the social exhaustion detector reads when the whole world is exhausted',
    exhaustedWorld.world_is_exhausted && !okWorld.world_is_exhausted,
    `tired world → exhausted (${exhaustedWorld.social_exhaustion}/10); rested world → ok`,
  ]);

  // ── silence recommendation says "not now" for an exhausted world ─
  const silenceNow = recommendSilence({ audienceSaturated: true, audiencePastThreshold: true, climateRejectsAddition: true, socialExhaustion: 9 });
  const speakNow = recommendSilence({ audienceSaturated: false, audiencePastThreshold: false, climateRejectsAddition: false, socialExhaustion: 2 });
  checks.push([
    'the silence recommendation runtime says "not now" when the world is exhausted',
    silenceNow.recommend_silence && !speakNow.recommend_silence,
    `saturated + exhausted → silence (${silenceNow.silence_strength}/10); open world → speak`,
  ]);

  // ── meaning compression detects a hollowing environment ─────────
  const hollowing = readMeaningCompression({ worldState: makeWorld({ digital_overload: 10, attention_chaos: 9 }), saturation: 9, truthValue: 3 });
  checks.push([
    'the meaning compression engine detects meaning being hollowed by the feed',
    hollowing.meaning_is_hollowing,
    `heavy compression (${hollowing.meaning_compression}/10) against thin truth → hollowing`,
  ]);

  // ── attention economy pressure names the pull to post louder ────
  const economyPressure = readAttentionEconomyPressure({ worldState: makeWorld({ attention_chaos: 9, digital_overload: 9 }), platformDrift: 9 });
  checks.push([
    'attention economy pressure names the pull to post more and louder',
    economyPressure.economy_demands_volume,
    `${economyPressure.attention_economy_pressure}/10 — ${economyPressure.pressure_note}`,
  ]);

  // ── reputation pressure reads protective vs extractive ──────────
  const extractive = readReputationPressure({ reputationCredit: 7, trustLevel: 7, optimizationCorrupts: true });
  const protective = readReputationPressure({ reputationCredit: 8, trustLevel: 8, optimizationCorrupts: false });
  checks.push([
    'the reputation pressure engine reads extractive vs protective pressure',
    extractive.reputation_at_risk && extractive.pressure_kind === 'extractive' && protective.pressure_kind === 'protective',
    `optimization corrupts → "${extractive.pressure_kind}"; identity held → "${protective.pressure_kind}"`,
  ]);

  // ── contradiction detection catches a self-model diverged ───────
  const contradicted = detectRealityContradiction({
    organismBelievesItIsAdapting: true, runtimeBelievesItIsCoordinated: true,
    trustIsDecaying: true, audienceExhausted: true, readsAsStimulus: true, authenticityEroding: true,
  });
  const honest = detectRealityContradiction({
    organismBelievesItIsAdapting: true, runtimeBelievesItIsCoordinated: true,
    trustIsDecaying: false, audienceExhausted: false, readsAsStimulus: false, authenticityEroding: false,
  });
  checks.push([
    'the contradiction detection layer catches a self-model diverged from reality',
    contradicted.contradiction_detected && !honest.contradiction_detected,
    `organism believes it adapts while trust decays → ${contradicted.contradictions.length} contradiction(s)`,
  ]);

  // ── THE CORE DISTINCTION — true resonance vs stimulus addiction ─
  const trueResonance = detectTrueResonance({
    engagementTruthScore: 8, readsAsStimulus: false, trustTrend: 'forming',
    audiencePastThreshold: false, feedbackIsNegative: false,
  });
  const stimulusAddiction = detectTrueResonance({
    engagementTruthScore: 3, readsAsStimulus: true, trustTrend: 'decaying',
    audiencePastThreshold: true, feedbackIsNegative: true,
  });
  checks.push([
    'the true resonance detector tells TRUE RESONANCE apart from STIMULUS ADDICTION',
    trueResonance.is_true_resonance && !trueResonance.is_stimulus_addiction &&
      stimulusAddiction.is_stimulus_addiction && !stimulusAddiction.is_true_resonance,
    `truth + forming trust → "${trueResonance.resonance_kind}"; stimulus + decaying trust → "${stimulusAddiction.resonance_kind}"`,
  ]);

  // ── the coupling governor holds the healthy band ────────────────
  const overCoupled = governRealityCoupling({ worldIsSpeaking: true, externalSignalVolume: 7, isStimulusAddiction: true, feedbackIsNegative: true });
  const decoupled = governRealityCoupling({ worldIsSpeaking: false, externalSignalVolume: 1, isStimulusAddiction: false, feedbackIsNegative: false });
  const coupled = governRealityCoupling({ worldIsSpeaking: true, externalSignalVolume: 7, isStimulusAddiction: false, feedbackIsNegative: false });
  checks.push([
    'the reality coupling governor holds the band between over-coupled and decoupled',
    overCoupled.coupling_mode === 'over-coupled' && decoupled.coupling_mode === 'decoupled' &&
      coupled.coupling_mode === 'coupled' && coupled.coupling_is_healthy,
    `stimulus addiction → "${overCoupled.coupling_mode}"; no signal → "${decoupled.coupling_mode}"; healthy → "${coupled.coupling_mode}"`,
  ]);

  // ── coupling health monitor reads a failing coupling ────────────
  const failingHealth = readCouplingHealth({ couplingMode: 'over-coupled', trustIsDecaying: true, authenticityEroding: true, isStimulusAddiction: true, modelDiverges: true });
  const wellHealth = readCouplingHealth({ couplingMode: 'coupled', trustIsDecaying: false, authenticityEroding: false, isStimulusAddiction: false, modelDiverges: false });
  checks.push([
    'the coupling health monitor reads when the coupling itself is failing',
    failingHealth.coupling_is_failing && !wellHealth.coupling_is_failing,
    `over-coupled + decay → failing (${failingHealth.coupling_health}/10); healthy → ${wellHealth.coupling_health}/10`,
  ]);

  // ── the persistent coupling state evolves and survives a restart ─
  const store = createRealityCouplingStore();
  await store.reset();
  let coupling = createInitialCoupling();
  const afterResonance = evolveCouplingFromResonance(coupling);
  const afterStimulus = evolveCouplingFromStimulus(coupling);
  const afterSilence = evolveCouplingFromSilence({ ...coupling, saturationMemory: 6 });
  checks.push([
    'the coupling state evolves — resonance compounds trust, stimulus erodes authenticity, silence recovers saturation',
    afterResonance.trustLevel > coupling.trustLevel &&
      afterStimulus.authenticityReserve < coupling.authenticityReserve &&
      afterSilence.saturationMemory < 6 && afterSilence.silenceHonored === 1,
    `resonance → trust ${coupling.trustLevel}→${afterResonance.trustLevel}; ` +
      `stimulus → authenticity ${coupling.authenticityReserve}→${afterStimulus.authenticityReserve}; ` +
      `silence → saturation 6→${afterSilence.saturationMemory}`,
  ]);

  coupling = evolveCouplingFromResonance(afterResonance);
  await store.save(coupling);
  (globalThis as { __moodCoupling?: unknown }).__moodCoupling = undefined;
  const reloaded = await store.read();
  checks.push([
    'the coupling state persists and survives a restart',
    reloaded.couplingCycles === 2 && reloaded.resonanceWins === 2,
    `reloaded ${reloaded.couplingCycles} cycles, ${reloaded.resonanceWins} resonance wins`,
  ]);
  await store.reset();

  // ── the closing synthesis — coupled to reality vs addicted ──────
  const addictedState = { ...createInitialCoupling(), couplingCycles: 8, stimulusWins: 6, resonanceWins: 2, authenticityReserve: 2 };
  const addictedFeedback = fuseWorldFeedback({ externalSignalVolume: 7, saturation: 8, trustTrend: 'decaying' as const, audienceState: 'exhausted' as const, platformRewardsNoise: true, worldIsExhausted: true });
  const addicted = readRealityCouplingCore({
    state: addictedState, worldFeedback: addictedFeedback,
    resonance: stimulusAddiction, governor: overCoupled, health: failingHealth,
  });
  const coupledState = { ...createInitialCoupling(), couplingCycles: 8, resonanceWins: 7, stimulusWins: 1 };
  const coupledFeedback = fuseWorldFeedback({ externalSignalVolume: 7, saturation: 3, trustTrend: 'forming' as const, audienceState: 'receptive' as const, platformRewardsNoise: false, worldIsExhausted: false });
  const coupledCore = readRealityCouplingCore({
    state: coupledState, worldFeedback: coupledFeedback,
    resonance: trueResonance, governor: coupled, health: wellHealth,
  });
  checks.push([
    'the closing synthesis distinguishes an organism COUPLED to reality from one ADDICTED to stimulus',
    addicted.organism_is_addicted_to_stimulus && !addicted.organism_is_coupled_to_reality &&
      coupledCore.organism_is_coupled_to_reality && !coupledCore.organism_is_addicted_to_stimulus,
    `stimulus-dominated → "${addicted.coupling_state}"; resonance-dominated → "${coupledCore.coupling_state}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 10 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 10 VERIFIED — the organism learns from reality without becoming addicted to it.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
