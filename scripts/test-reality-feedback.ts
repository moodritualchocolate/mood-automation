/**
 * scripts/test-reality-feedback.ts
 *
 * WAVE 13 — Reality Feedback Infrastructure verification (Phases 221–260).
 *
 * Proves the organism stops asking "did we publish?" and begins
 * asking "what did this action become inside real human nervous
 * systems over time?" — including the critical guards against the
 * echo chamber, false success, and silent attribution failures.
 *
 * Run with:  npx tsx scripts/test-reality-feedback.ts
 */

import {
  createFeedbackStore, createInitialFeedback,
  evolveFeedbackFromCoherentReception, evolveFeedbackFromContradictoryReception, evolveFeedbackFromSilence,
  readCivilizationFeedbackLoopCore,
} from '@lib/civilizationFeedbackLoopCore';
import { readRealAudienceReactionIngestion } from '@lib/realAudienceReactionIngestion';
import { readTrustShiftDetection } from '@lib/trustShiftDetection';
import { readResonanceDecayTracking } from '@lib/resonanceDecayTracking';
import { readSilenceImpactMeasurement } from '@lib/silenceImpactMeasurement';
import { readEmotionalTruthAlignment } from '@lib/emotionalTruthAlignment';
import { readContradictionFeedbackScanner } from '@lib/contradictionFeedbackScanner';
import { readDelayedImpactAttribution } from '@lib/delayedImpactAttribution';
import { readCollectiveMoodInference } from '@lib/collectiveMoodInference';
import { readMemeticIntegrityTracking } from '@lib/memeticIntegrityTracking';
import { readAdaptiveIdentityCorrection } from '@lib/adaptiveIdentityCorrection';
import { readFeedbackSignalQualityFilter } from '@lib/feedbackSignalQualityFilter';
import { readEmotionalEchoTracker } from '@lib/emotionalEchoTracker';
import { readAudienceNervousSystemReadout } from '@lib/audienceNervousSystemReadout';
import { readReactionLatencyAnalyzer } from '@lib/reactionLatencyAnalyzer';
import { readSentimentDriftDetector } from '@lib/sentimentDriftDetector';
import { readReactionAuthenticityVerifier } from '@lib/reactionAuthenticityVerifier';
import { readActionResultLedger } from '@lib/actionResultLedger';
import { readFeedbackBiasFilter } from '@lib/feedbackBiasFilter';
import { readReactionPatternMemory } from '@lib/reactionPatternMemory';
import { readFeedbackToIdentityBridge } from '@lib/feedbackToIdentityBridge';
import { readFeedbackToStrategyAdjustment } from '@lib/feedbackToStrategyAdjustment';
import { readFeedbackToExecutionRefinement } from '@lib/feedbackToExecutionRefinement';
import { readTemporalImpactCurve } from '@lib/temporalImpactCurve';
import { readNarrativeReceptionMapping } from '@lib/narrativeReceptionMapping';
import { readCounterNarrativeDetection } from '@lib/counterNarrativeDetection';
import { readSecondHandResonanceTracking } from '@lib/secondHandResonanceTracking';
import { readSilenceAsFeedbackInterpreter } from '@lib/silenceAsFeedbackInterpreter';
import { readReactionGenreClassifier } from '@lib/reactionGenreClassifier';
import { readTrustEvolutionGraph } from '@lib/trustEvolutionGraph';
import { readMeaningPersistenceTracker } from '@lib/meaningPersistenceTracker';
import { readFalseSuccessDetector } from '@lib/falseSuccessDetector';
import { readFeedbackContradictionResolver } from '@lib/feedbackContradictionResolver';
import { readSlowMovingTruthDetector } from '@lib/slowMovingTruthDetector';
import { readFeedbackSignalIntegrityValidator } from '@lib/feedbackSignalIntegrityValidator';
import { readFeedbackEcologyMonitor } from '@lib/feedbackEcologyMonitor';
import { readFeedbackMemoryArchive } from '@lib/feedbackMemoryArchive';
import { readRealityAttributionAuditor } from '@lib/realityAttributionAuditor';
import { readFeedbackCoherenceValidator } from '@lib/feedbackCoherenceValidator';
import { readRealityFeedbackGovernor } from '@lib/realityFeedbackGovernor';

async function main() {
  console.log('\n WAVE 13 — Reality Feedback Infrastructure verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── reaction ingestion ──────────────────────────────────────────
  const ingestedActed = readRealAudienceReactionIngestion({
    bannerShipped: true, audienceEmotionalCharge: 7, trustTrendProxy: 2,
    authenticityProxy: 7, externalSignalVolume: 6,
  });
  const ingestedSilent = readRealAudienceReactionIngestion({
    bannerShipped: false, audienceEmotionalCharge: 4, trustTrendProxy: 0,
    authenticityProxy: 5, externalSignalVolume: 2,
  });
  checks.push([
    'real audience reaction ingestion observes reactions only when something was actually said',
    ingestedActed.reactions_observed && !ingestedSilent.reactions_observed &&
      ingestedActed.reactions.length === 2,
    `acted → ${ingestedActed.reactions.length} channels observed; silent → none`,
  ]);

  // ── trust shift, resonance decay, silence impact ────────────────
  const trustGaining = readTrustShiftDetection({ trustNetGain: 2, trustForming: true, trustDecaying: false, actionResonance: 8 });
  const trustEroding = readTrustShiftDetection({ trustNetGain: -2, trustForming: false, trustDecaying: true, actionResonance: 3 });
  checks.push([
    'trust shift detection reads gaining vs eroding and flags compounding shifts',
    trustGaining.shift_direction === 'gaining' && trustEroding.shift_direction === 'eroding' &&
      trustGaining.shift_is_compounding && trustEroding.shift_is_compounding,
    `forming + prior gain → "${trustGaining.shift_direction}" compounding; decaying + prior loss → "${trustEroding.shift_direction}" compounding`,
  ]);
  const decayCollapse = readResonanceDecayTracking({ initialResonance: 1, oneStepLaterResonance: 0, wasStimulus: true });
  const decayHealthy = readResonanceDecayTracking({ initialResonance: 8, oneStepLaterResonance: 6, wasStimulus: false });
  checks.push([
    'resonance decay tracking distinguishes a collapse from a healthy fade',
    decayCollapse.decay_profile === 'collapse' && decayHealthy.decay_is_healthy,
    `1→0 + stimulus → collapse; 8→6 + truthful → ${decayHealthy.decay_profile} (half-life ${decayHealthy.half_life_cycles})`,
  ]);
  const silenceWorked = readSilenceImpactMeasurement({ wasSilent: true, fatigueBefore: 8, fatigueAfter: 5, consecutiveSilenceCycles: 1 });
  const silenceForgotten = readSilenceImpactMeasurement({ wasSilent: true, fatigueBefore: 5, fatigueAfter: 5, consecutiveSilenceCycles: 5 });
  checks.push([
    'silence impact measurement treats silence as its own action with measurable impact',
    silenceWorked.silence_did_work && silenceForgotten.silence_impact === 'was-forgotten',
    `silence relieved fatigue → did work; 5 silent cycles → was-forgotten`,
  ]);

  // ── emotional truth alignment + contradiction scan ──────────────
  const aligned = readEmotionalTruthAlignment({ intendedValence: 3, receivedValence: 3, intendedIntensity: 5, receivedIntensity: 5 });
  const misaligned = readEmotionalTruthAlignment({ intendedValence: 3, receivedValence: -4, intendedIntensity: 3, receivedIntensity: 8 });
  checks.push([
    'emotional truth alignment measures whether the action felt like what it meant',
    aligned.aligned && !misaligned.aligned,
    `match → aligned (${aligned.alignment}/10); valence flipped + intensity off → ${misaligned.alignment}/10`,
  ]);
  const contradictions = readContradictionFeedbackScanner({
    promisedTruthReceivedAsStimulus: true, claimedAdditionReceivedAsNoise: true, claimedRestraintShowsFlooding: true,
  });
  checks.push([
    'contradiction feedback scanner catches gaps between what the brand claimed and what was received',
    contradictions.any_serious_contradiction && contradictions.contradictions_found.length === 3,
    `${contradictions.contradictions_found.length} contradiction(s) found, load ${contradictions.contradiction_load}`,
  ]);

  // ── delayed impact + collective mood ────────────────────────────
  const delayed = readDelayedImpactAttribution({ thisCycleTrustShift: 1.2, thisCycleActed: false, recentPriorAction: true });
  const direct = readDelayedImpactAttribution({ thisCycleTrustShift: 1.2, thisCycleActed: true, recentPriorAction: false });
  checks.push([
    'delayed impact attribution credits the cycle that actually caused the shift',
    delayed.shift_is_delayed && !direct.shift_is_delayed && delayed.attribution_lag >= 1,
    `silent cycle + prior action → delayed by ${delayed.attribution_lag} cycles; acting now → direct`,
  ]);
  const moodCynical = readCollectiveMoodInference({ averageReactionIntensity: 6, averageTrustSignal: 2, collectiveExhaustion: 5, trustErosion: 8 });
  const moodOpen = readCollectiveMoodInference({ averageReactionIntensity: 4, averageTrustSignal: 7, collectiveExhaustion: 3, trustErosion: 2 });
  checks.push([
    'collective mood inference reads the felt tone beneath the scatter of signals',
    moodCynical.inferred_mood === 'cynical' && moodOpen.inferred_mood === 'open',
    `eroded trust → "${moodCynical.inferred_mood}"; warm signals → "${moodOpen.inferred_mood}"`,
  ]);

  // ── memetic integrity + identity correction ─────────────────────
  const memeIntact = readMemeticIntegrityTracking({ emotionalAlignment: 8, receptionDrift: 1, counterNarrativeForming: false });
  const memeDistorted = readMemeticIntegrityTracking({ emotionalAlignment: 3, receptionDrift: 7, counterNarrativeForming: true });
  checks.push([
    'memetic integrity tracking flags when the meaning is being reshaped as it travels',
    memeIntact.integrity_state === 'intact' && memeDistorted.meaning_is_distorting,
    `aligned → "${memeIntact.integrity_state}"; counter + drift → "${memeDistorted.integrity_state}"`,
  ]);
  const needsCorrection = readAdaptiveIdentityCorrection({ perceivedIdentityAlignment: 3, meaningDistorting: true, identityHeld: true });
  const noCorrection = readAdaptiveIdentityCorrection({ perceivedIdentityAlignment: 9, meaningDistorting: false, identityHeld: true });
  checks.push([
    'adaptive identity correction proposes the smallest correction that preserves founding identity',
    needsCorrection.correction_recommended && needsCorrection.correction_preserves_identity && !noCorrection.correction_recommended,
    `misalignment → small correction proposed; alignment → none`,
  ]);

  // ── signal quality + bias filter + authenticity ─────────────────
  const goodSignal = readFeedbackSignalQualityFilter({ reactionClarity: 8, reactionCount: 5, feedbackContradicted: false });
  const noisySignal = readFeedbackSignalQualityFilter({ reactionClarity: 2, reactionCount: 1, feedbackContradicted: true });
  checks.push([
    'feedback signal quality filter separates updatable signal from noise',
    goodSignal.signal_is_usable && !noisySignal.signal_is_usable,
    `clear + many → usable (${goodSignal.signal_quality}); noisy + contradicted → ${noisySignal.signal_quality}/10`,
  ]);
  const flattering = readFeedbackBiasFilter({ confirmingPriorBeliefs: true, discountingPositive: false, positiveToNegativeRatio: 4 });
  const balanced = readFeedbackBiasFilter({ confirmingPriorBeliefs: false, discountingPositive: false, positiveToNegativeRatio: 1.2 });
  checks.push([
    'feedback bias filter counterweights the organism reading its own feedback flatteringly',
    flattering.detected_bias === 'self-flattering' && balanced.detected_bias === 'balanced',
    `confirming + high pos/neg → "${flattering.detected_bias}"; even → "${balanced.detected_bias}"`,
  ]);
  const authentic = readReactionAuthenticityVerifier({ averageAuthenticity: 8, audiencePerforming: false });
  const performed = readReactionAuthenticityVerifier({ averageAuthenticity: 8, audiencePerforming: true });
  checks.push([
    'reaction authenticity verifier distinguishes honest warmth from performed enthusiasm',
    authentic.reactions_are_authentic && !performed.reactions_are_authentic,
    `not performing → ${authentic.authentic_share}/10 authentic; performing → ${performed.authentic_share}/10`,
  ]);

  // ── audience nervous system + latency + reaction genre ──────────
  const nsOverloaded = readAudienceNervousSystemReadout({ audienceFatigue: 9, emotionalVolatility: 8, digitalOverload: 9 });
  const nsCalm = readAudienceNervousSystemReadout({ audienceFatigue: 2, emotionalVolatility: 2, digitalOverload: 2 });
  checks.push([
    'audience nervous system readout reads when another action would harm the audience nervous system',
    nsOverloaded.next_action_would_harm && !nsCalm.next_action_would_harm,
    `${nsOverloaded.nervous_system_state} → would harm; ${nsCalm.nervous_system_state} → safe`,
  ]);
  const reflex = readReactionLatencyAnalyzer({ immediateReactions: 9, delayedReactions: 1 });
  const considered = readReactionLatencyAnalyzer({ immediateReactions: 3, delayedReactions: 5 });
  checks.push([
    'reaction latency analyzer reads reflex vs reflection from when reactions arrived',
    reflex.pattern === 'reflex' && (considered.pattern === 'considered' || considered.pattern === 'delayed-truth'),
    `9 immediate → "${reflex.pattern}"; mixed → "${considered.pattern}" (thoughtfulness ${considered.thoughtfulness})`,
  ]);
  const recognition = readReactionGenreClassifier({ averageIntensity: 4, averageTrustSignal: 7, contradictionDetected: false, reactionCount: 5 });
  const argument = readReactionGenreClassifier({ averageIntensity: 7, averageTrustSignal: 3, contradictionDetected: true, reactionCount: 5 });
  checks.push([
    'reaction genre classifier names the shape of incoming reactions',
    recognition.dominant_genre === 'recognition' && argument.dominant_genre === 'argument',
    `quiet trust → "${recognition.dominant_genre}"; contradiction → "${argument.dominant_genre}"`,
  ]);

  // ── narrative reception + counter-narrative + second-hand ───────
  const recBland = readNarrativeReceptionMapping({ intendedNarrative: 'a quiet honest brand', emotionalAlignment: 8, receptionDrift: 1 });
  const recDrifted = readNarrativeReceptionMapping({ intendedNarrative: 'a quiet honest brand', emotionalAlignment: 3, receptionDrift: 7 });
  checks.push([
    'narrative reception mapping reads the gap between the story told and the story received',
    recBland.narrative_landed_as_intended && !recDrifted.narrative_landed_as_intended,
    `aligned → landed; misaligned → drifted (fidelity ${recDrifted.reception_fidelity}/10)`,
  ]);
  const counterForming = readCounterNarrativeDetection({ contradictionDetected: true, meaningDistortion: 7, sentimentReversed: true });
  const noCounter = readCounterNarrativeDetection({ contradictionDetected: false, meaningDistortion: 1, sentimentReversed: false });
  checks.push([
    'counter-narrative detection flags when the audience is writing its own version',
    counterForming.counter_narrative_forming && !noCounter.counter_narrative_forming,
    `contradiction + reversal → forming (${counterForming.counter_strength}/10); clean → none`,
  ]);
  const carried = readSecondHandResonanceTracking({ wordOfMouthReactions: 3, meaningPersistence: 8, averageAuthenticity: 8 });
  const notCarried = readSecondHandResonanceTracking({ wordOfMouthReactions: 0, meaningPersistence: 4, averageAuthenticity: 4 });
  checks.push([
    'second-hand resonance tracking reads the deepest resonance — the action being carried by others',
    carried.action_is_being_carried && !notCarried.action_is_being_carried,
    `3 word-of-mouth → being carried (${carried.second_hand_resonance}/10); none → not`,
  ]);

  // ── silence-as-feedback + sentiment drift + trust graph ─────────
  const attentiveSilence = readSilenceAsFeedbackInterpreter({ reactionCount: 0, meaningPersistence: 7, audienceFatigue: 3, cyclesSinceAction: 1 });
  const forgottenSilence = readSilenceAsFeedbackInterpreter({ reactionCount: 0, meaningPersistence: 3, audienceFatigue: 5, cyclesSinceAction: 5 });
  checks.push([
    'silence as feedback interpreter distinguishes attentive silence from forgotten silence',
    attentiveSilence.audience_silence === 'attentive-silence' && forgottenSilence.audience_silence === 'forgotten-silence',
    `meaning persisting → "${attentiveSilence.audience_silence}"; 5 silent cycles → "${forgottenSilence.audience_silence}"`,
  ]);
  const cooling = readSentimentDriftDetector({ sentimentEarlier: 2, sentimentNow: -3 });
  checks.push([
    'sentiment drift detector reads slow drift and sign reversal across cycles',
    cooling.drift_direction === 'reversing' && cooling.has_reversed,
    `2 → -3 → "${cooling.drift_direction}" with sign reversal`,
  ]);
  const buildingArc = readTrustEvolutionGraph({ trustNetGain: 4, trustShiftCount: 6, hasReversed: false });
  const volatileArc = readTrustEvolutionGraph({ trustNetGain: 0, trustShiftCount: 6, hasReversed: true });
  checks.push([
    'trust evolution graph reads the long arc — building, plateau, declining, or volatile',
    buildingArc.evolution_shape === 'building' && volatileArc.evolution_shape === 'volatile' && buildingArc.arc_is_healthy,
    `+4 → "${buildingArc.evolution_shape}"; reversed → "${volatileArc.evolution_shape}"`,
  ]);

  // ── meaning persistence + false success + slow truth ────────────
  const persists = readMeaningPersistenceTracker({ priorPersistence: 7, echoMagnitude: 7, beingCarried: true, reactionAuthenticity: 7 });
  const evaporates = readMeaningPersistenceTracker({ priorPersistence: 3, echoMagnitude: 1, beingCarried: false, reactionAuthenticity: 3 });
  checks.push([
    'meaning persistence tracker reads whether the action outlived the moment',
    persists.meaning_persists && !evaporates.meaning_persists,
    `carried + echo → ${persists.persistence_score}/10 persists; thin → ${evaporates.persistence_score}/10`,
  ]);
  const falseSuccess = readFalseSuccessDetector({ apparentEngagement: 9, actualTrustShift: -1, ranOnStimulus: true, reflexReactions: true });
  const realSuccess = readFalseSuccessDetector({ apparentEngagement: 6, actualTrustShift: 1.2, ranOnStimulus: false, reflexReactions: false });
  checks.push([
    'false success detector flags applause that cost trust — the deepest form of subtraction',
    falseSuccess.false_success_detected && !realSuccess.false_success_detected,
    `high engagement + trust slip → "${falseSuccess.false_success_kind}"; clean → none`,
  ]);
  const slowTruth = readSlowMovingTruthDetector({ priorSlowTruths: 2, delayedTruthLatency: true, slowSentimentDrift: true, trustQuietlyBuilding: true });
  checks.push([
    'slow-moving truth detector finds the truth beneath the noisy cycle-to-cycle signals',
    slowTruth.slow_truth_detected && slowTruth.slow_truth !== null,
    `3 slow signals → "${slowTruth.slow_truth}"`,
  ]);

  // ── signal integrity + ecology + reality attribution ────────────
  const integrityFail = readFeedbackSignalIntegrityValidator({ signalQuality: 3, reactionsAuthentic: false, biasDetected: true, unresolvedContradictions: true });
  const integrityOk = readFeedbackSignalIntegrityValidator({ signalQuality: 8, reactionsAuthentic: true, biasDetected: false, unresolvedContradictions: false });
  checks.push([
    'feedback signal integrity validator refuses to update beliefs on unsound feedback',
    !integrityFail.signal_has_integrity && integrityOk.signal_has_integrity,
    `4 issues → fail; clean → has integrity (${integrityOk.integrity_score}/10)`,
  ]);
  const ecologyHealthy = readFeedbackEcologyMonitor({ channelDiversity: 7, averageAuthenticity: 8, counterNarrativeForming: false, anyReactionsAtAll: true });
  const ecologyCollapsed = readFeedbackEcologyMonitor({ channelDiversity: 0, averageAuthenticity: 0, counterNarrativeForming: false, anyReactionsAtAll: false });
  checks.push([
    'feedback ecology monitor reads when the feedback environment supports learning',
    ecologyHealthy.ecology_supports_learning && ecologyCollapsed.ecology_state === 'collapsed',
    `diverse + authentic → ${ecologyHealthy.ecology_state}; no reactions → ${ecologyCollapsed.ecology_state}`,
  ]);
  const attributionFails = readRealityAttributionAuditor({ shiftClaimedAsCaused: true, isDelayedAttribution: false, worldShiftedIndependently: true, reactionClarity: 3 });
  const attributionOk = readRealityAttributionAuditor({ shiftClaimedAsCaused: true, isDelayedAttribution: true, worldShiftedIndependently: false, reactionClarity: 9 });
  checks.push([
    'reality attribution auditor refuses credit when the world shifted on its own',
    !attributionFails.attribution_holds_up && attributionOk.attribution_holds_up,
    `world shifted alone → attribution fails; clean signal → holds up (${attributionOk.attribution_confidence}/10)`,
  ]);

  // ── coherence + governor + helpers ──────────────────────────────
  const fbCoherent = readFeedbackCoherenceValidator({ trustGaining: true, resonanceCollapsed: false, narrativeLanded: true, counterNarrativeForming: false, signalHasIntegrity: true });
  const fbIncoherent = readFeedbackCoherenceValidator({ trustGaining: true, resonanceCollapsed: true, narrativeLanded: true, counterNarrativeForming: true, signalHasIntegrity: false });
  checks.push([
    'feedback coherence validator catches the feedback layer contradicting itself',
    fbCoherent.feedback_is_coherent && !fbIncoherent.feedback_is_coherent && fbIncoherent.incoherences.length >= 2,
    `aligned conclusions → coherent; conflicting → ${fbIncoherent.incoherences.length} incoherence(s)`,
  ]);
  const govEvolving = readRealityFeedbackGovernor({ signalHasIntegrity: true, ecologySupportsLearning: true, feedbackCoherent: true, anyReactionsAtAll: true, organismIsListeningToOnlyItself: false });
  const govEcho = readRealityFeedbackGovernor({ signalHasIntegrity: false, ecologySupportsLearning: false, feedbackCoherent: false, anyReactionsAtAll: false, organismIsListeningToOnlyItself: true });
  const govBlind = readRealityFeedbackGovernor({ signalHasIntegrity: true, ecologySupportsLearning: true, feedbackCoherent: true, anyReactionsAtAll: false, organismIsListeningToOnlyItself: false });
  checks.push([
    'reality feedback governor reads reality-evolving, learning, echo-chamber, and blind governance',
    govEvolving.governance === 'reality-evolving' && govEcho.governance === 'echo-chamber' && govBlind.governance === 'blind',
    `clean → "${govEvolving.governance}"; only-itself → "${govEcho.governance}"; no reactions → "${govBlind.governance}"`,
  ]);

  // ── helper readings exercised ───────────────────────────────────
  void readEmotionalEchoTracker({ meaningPersistence: 7, recentResonance: 7, cyclesSinceAction: 1 });
  void readActionResultLedger({ actionShipped: true, trustShift: 1, meaningPersistence: 7, priorEntries: 3, priorAverage: 0.5 });
  void readReactionPatternMemory({ reactionsIngested: 5, softensAfterQuiet: true, fastMetricReverses: false });
  void readFeedbackToIdentityBridge({ signalUsable: true, correctionRecommended: true, correctionPreservesIdentity: true });
  void readFeedbackToStrategyAdjustment({ trustShift: -1.5, underperformed: true, reflexReactions: true });
  void readFeedbackToExecutionRefinement({ emotionalTruthMisaligned: true, cadenceIsFlooding: false, audienceFatigued: false });
  void readTemporalImpactCurve({ impactNow: 7, impactNext: 8, impactPrior: 5 });
  void readFeedbackContradictionResolver({ trustShift: 1, resonance: 3, argumentReactions: false, applauseReactions: true });
  void readFeedbackMemoryArchive({ feedbackCycles: 8, reactionsIngested: 6, contradictionsFound: 1, slowTruthsDetected: 2 });

  // ── persistent state evolves and survives a restart ─────────────
  const store = createFeedbackStore();
  await store.reset();
  const base = createInitialFeedback();
  const afterCoherent = evolveFeedbackFromCoherentReception(base);
  const afterContra = evolveFeedbackFromContradictoryReception(base);
  const afterSilence = evolveFeedbackFromSilence(base);
  checks.push([
    'feedback state evolves — coherent reception accrues trust, contradiction logs it and erodes, silence surfaces slow truth',
    afterCoherent.trustNetGain > base.trustNetGain && afterContra.contradictionsFound === 1 &&
      afterContra.trustNetGain < base.trustNetGain && afterSilence.slowTruthsDetected === 1 &&
      afterSilence.meaningPersistenceScore > base.meaningPersistenceScore,
    `coherent → net gain ${base.trustNetGain}→${afterCoherent.trustNetGain}; ` +
      `contradiction → ${base.trustNetGain}→${afterContra.trustNetGain}; ` +
      `silence → meaning ${base.meaningPersistenceScore}→${afterSilence.meaningPersistenceScore}`,
  ]);
  await store.save(afterCoherent);
  (globalThis as { __moodFeedback?: unknown }).__moodFeedback = undefined;
  const reloaded = await store.read();
  checks.push([
    'feedback state persists and survives a restart',
    reloaded.feedbackCycles === 1 && reloaded.reactionsIngested === 1,
    `reloaded ${reloaded.feedbackCycles} cycle, ${reloaded.reactionsIngested} reaction on record`,
  ]);
  await store.reset();

  // ── THE CLOSING SYNTHESIS — what did the action become? ─────────
  const evolvingState = { ...createInitialFeedback(), feedbackCycles: 5, reactionsIngested: 5, trustNetGain: 4, resonanceCurveAUC: 7, meaningPersistenceScore: 8 };
  const evolvingSynth = readCivilizationFeedbackLoopCore({
    state: evolvingState, governor: govEvolving, trustShift: trustGaining,
    resonanceDecay: decayHealthy, meaningPersistence: persists, coherence: fbCoherent,
  });
  const echoState = { ...createInitialFeedback(), feedbackCycles: 6, reactionsIngested: 0 };
  const echoSynth = readCivilizationFeedbackLoopCore({
    state: echoState, governor: govEcho, trustShift: trustEroding,
    resonanceDecay: decayCollapse, meaningPersistence: evaporates, coherence: fbIncoherent,
  });
  checks.push([
    'the closing synthesis answers "what did this action become?" — reality-evolving vs echo-chamber',
    evolvingSynth.organism_evolves_from_reality && !evolvingSynth.organism_is_in_echo_chamber &&
      echoSynth.organism_is_in_echo_chamber && !echoSynth.organism_evolves_from_reality,
    `evolving → "${evolvingSynth.feedback_state}" — "${evolvingSynth.what_the_action_became}"; ` +
      `echo → "${echoSynth.feedback_state}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 13 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 13 VERIFIED — the organism evolves from what its actions become, never from itself alone.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
