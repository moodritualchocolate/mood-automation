/**
 * scripts/test-live-coupling.ts
 *
 * WAVE 14 — Live Civilization Coupling verification (Phases 261–320).
 *
 * Proves the organism moves from remembered feedback to real-time
 * coupling — asking "what changed in reality because we existed?"
 *
 * Run with:  npx tsx scripts/test-live-coupling.ts
 */

import {
  createLiveCouplingStore, createInitialLiveCoupling,
  evolveLiveCouplingFromMeaning, evolveLiveCouplingFromNovelty, evolveLiveCouplingFromStrategicSilence,
  readCivilizationCouplingKernel,
} from '@lib/civilizationCouplingKernel';
import { readLiveCommentIngestion } from '@lib/liveCommentIngestion';
import { readRealtimeSentimentField } from '@lib/realtimeSentimentField';
import { readResonanceVelocityTracking } from '@lib/resonanceVelocityTracking';
import { readAudienceStressDetection } from '@lib/audienceStressDetection';
import { readCulturalWeatherRuntime } from '@lib/culturalWeatherRuntime';
import { readNarrativeContagionMap } from '@lib/narrativeContagionMap';
import { readDelayedMeaningRecognition } from '@lib/delayedMeaningRecognition';
import { readMeaningVsNoveltyEngine } from '@lib/meaningVsNoveltyEngine';
import { readStrategicSilenceTiming } from '@lib/strategicSilenceTiming';
import { readLivingReputationField } from '@lib/livingReputationField';
import { readLiveReactionStreamProcessor } from '@lib/liveReactionStreamProcessor';
import { readStressContagionTracker } from '@lib/stressContagionTracker';
import { readNervousSystemPulseMonitor } from '@lib/nervousSystemPulseMonitor';
import { readCrisisSignalDetector } from '@lib/crisisSignalDetector';
import { readRealtimeOpportunityDetector } from '@lib/realtimeOpportunityDetector';
import { readLiveImpactDetector } from '@lib/liveImpactDetector';
import { readRealityChangeAttribution } from '@lib/realityChangeAttribution';
import { readRealityPresenceVerifier } from '@lib/realityPresenceVerifier';
import { readRealityPresenceMeter } from '@lib/realityPresenceMeter';
import { readLiveDriftDetection } from '@lib/liveDriftDetection';
import { readLiveCouplingHealth } from '@lib/liveCouplingHealth';
import { readLiveCouplingBoundaryEnforcement } from '@lib/liveCouplingBoundaryEnforcement';
import { readLiveCouplingIntegrityValidator } from '@lib/liveCouplingIntegrityValidator';
import { readLiveCouplingCoherenceValidator } from '@lib/liveCouplingCoherenceValidator';
import { readLiveCouplingGovernor } from '@lib/liveCouplingGovernor';
import { readCivilizationCouplingPresenceCheck } from '@lib/civilizationCouplingPresenceCheck';
import { readMeaningDensityAnalyzer } from '@lib/meaningDensityAnalyzer';
import { readNoveltyDecayTracker } from '@lib/noveltyDecayTracker';
import { readSentimentFieldGradient } from '@lib/sentimentFieldGradient';
import { readReputationFieldVelocity } from '@lib/reputationFieldVelocity';
import { readSilenceWindowDetector } from '@lib/silenceWindowDetector';
import { readRealityChangeAttributionAuditor } from '@lib/realityChangeAttributionAuditor';

async function main() {
  console.log('\n WAVE 14 — Live Civilization Coupling verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── live comment ingestion + stream processor + sentiment field ─
  const ingested = readLiveCommentIngestion({
    bannerShipped: true, audienceCharge: 7, liveValence: 2, authenticity: 7, externalSignalVolume: 6,
  });
  const silentIngest = readLiveCommentIngestion({
    bannerShipped: false, audienceCharge: 3, liveValence: 0, authenticity: 5, externalSignalVolume: 1,
  });
  checks.push([
    'live comment ingestion flows when the brand actually speaks',
    ingested.stream_is_live && (silentIngest.comments.length === 0 || !silentIngest.stream_is_live),
    `acted → ${ingested.comments.length} comments; silent → ${silentIngest.comments.length}`,
  ]);
  const sentimentField = readRealtimeSentimentField({ comments: ingested.comments });
  const polarisedField = readRealtimeSentimentField({
    comments: [{ valence: 8 }, { valence: -8 }, { valence: 6 }, { valence: -6 }],
  });
  checks.push([
    'realtime sentiment field distinguishes a coherent field from a polarised one',
    sentimentField.field_is_coherent && !polarisedField.field_is_coherent,
    `coherent variance ${sentimentField.field_variance}; polarised variance ${polarisedField.field_variance}`,
  ]);

  // ── resonance velocity + audience stress + nervous pulse ────────
  const accelerating = readResonanceVelocityTracking({ priorResonance: 4, currentResonance: 7 });
  const collapsing = readResonanceVelocityTracking({ priorResonance: 8, currentResonance: 2 });
  checks.push([
    'resonance velocity reads acceleration vs collapse',
    accelerating.velocity_state === 'accelerating' && collapsing.velocity_state === 'collapsing',
    `+3 → "${accelerating.velocity_state}"; -6 → "${collapsing.velocity_state}"`,
  ]);
  const acuteStress = readAudienceStressDetection({ liveIntensity: 9, collectiveExhaustion: 8, sentimentVariance: 7 });
  const lowStress = readAudienceStressDetection({ liveIntensity: 2, collectiveExhaustion: 2, sentimentVariance: 1 });
  checks.push([
    'audience stress detection refuses action when the audience is acutely stressed',
    acuteStress.stress_level === 'acute' && acuteStress.too_stressed_to_act_on && !lowStress.too_stressed_to_act_on,
    `acute (${acuteStress.stress_score}/10) → too stressed; low → safe`,
  ]);

  // ── cultural weather + cultural front ───────────────────────────
  const storm = readCulturalWeatherRuntime({ collectiveExhaustion: 5, emotionalVolatility: 9, worldTension: 9, trustErosion: 8 });
  const calm = readCulturalWeatherRuntime({ collectiveExhaustion: 2, emotionalVolatility: 2, worldTension: 2, trustErosion: 2 });
  checks.push([
    'cultural weather runtime reads live cultural conditions',
    storm.weather === 'storm' && calm.weather === 'calm' && !storm.weather_permits_action && calm.weather_permits_action,
    `volatile world → "${storm.weather}"; calm world → "${calm.weather}"`,
  ]);

  // ── narrative contagion + delayed meaning + meaning vs novelty ──
  const spreading = readNarrativeContagionMap({ secondHandResonance: 8, memeticIntegrity: 8, counterNarrative: false });
  const mutating = readNarrativeContagionMap({ secondHandResonance: 5, memeticIntegrity: 3, counterNarrative: true });
  checks.push([
    'narrative contagion map reads spreading vs mutating dynamics',
    spreading.contagion_state === 'spreading' && mutating.contagion_state === 'mutating',
    `intact + carried → "${spreading.contagion_state}"; counter-narrative → "${mutating.contagion_state}"`,
  ]);
  const delayedM = readDelayedMeaningRecognition({ delayedTruthLatency: true, meaningPersistence: 8, slowTruthDetected: true });
  checks.push([
    'delayed meaning recognition surfaces meaning that arrives late',
    delayedM.delayed_meaning_recognised && delayedM.meaning_summary !== null,
    `"${delayedM.meaning_summary}" (strength ${delayedM.meaning_strength}/10)`,
  ]);
  const meaning = readMeaningVsNoveltyEngine({ meaningDensity: 8, noveltyLoad: 2, marketRewardsNovelty: false });
  const novelty = readMeaningVsNoveltyEngine({ meaningDensity: 2, noveltyLoad: 8, marketRewardsNovelty: true });
  checks.push([
    'meaning vs novelty engine refuses chasing novelty at the expense of meaning',
    meaning.is_meaning && !novelty.is_meaning,
    `dense + truthful → MEANING; thin + market-rewards-novelty → ${novelty.balance_note}`,
  ]);

  // ── strategic silence + silence window + living reputation ──────
  const deploySilence = readStrategicSilenceTiming({ culturalStorm: true, audienceTooStressed: true, delayedMeaningCrystalising: false });
  const skipSilence = readStrategicSilenceTiming({ culturalStorm: false, audienceTooStressed: false, delayedMeaningCrystalising: false });
  checks.push([
    'strategic silence timing deploys silence when the live moment requires it',
    deploySilence.deploy_silence && !skipSilence.deploy_silence && deploySilence.silence_duration >= 2,
    `storm + stressed → deploy ${deploySilence.silence_duration} cycle(s); calm → no silence`,
  ]);
  const silenceWin = readSilenceWindowDetector({ culturalWeather: 'storm', audienceStress: 8, delayedMeaningStrength: 6 });
  checks.push([
    'silence window detector finds windows where silence speaks loudest',
    silenceWin.window_open,
    `storm + stress + delayed meaning → window value ${silenceWin.window_value}/10`,
  ]);
  const consolidating = readLivingReputationField({ priorReputation: 6, liveTrustShift: 1.5, fieldPolarised: false });
  const eroding = readLivingReputationField({ priorReputation: 6, liveTrustShift: -1.5, fieldPolarised: false });
  checks.push([
    'living reputation field reads the live shape of reputation',
    consolidating.field_state === 'consolidating' && eroding.field_state === 'eroding',
    `+1.5 → "${consolidating.field_state}" (${consolidating.living_reputation}); -1.5 → "${eroding.field_state}"`,
  ]);

  // ── stress contagion + nervous pulse ────────────────────────────
  const contagious = readStressContagionTracker({ audienceStress: 9, sentimentVariance: 7, moodVelocity: -2 });
  const contained = readStressContagionTracker({ audienceStress: 2, sentimentVariance: 1, moodVelocity: 0.5 });
  checks.push([
    'stress contagion tracker flags stress spreading among the audience',
    contagious.stress_is_contagious && !contained.stress_is_contagious,
    `high stress + dropping mood → contagious (${contagious.contagion_rate}/10)`,
  ]);
  const elevatedPulse = readNervousSystemPulseMonitor({ liveIntensity: 8, sentimentVariance: 2, liveSignalVolume: 6 });
  checks.push([
    'nervous system pulse monitor reads the live pulse',
    elevatedPulse.pulse === 'elevated',
    `intensity 8 + volume 6 → "${elevatedPulse.pulse}" (${elevatedPulse.pulse_intensity}/10)`,
  ]);

  // ── crisis + opportunity + drift detection ──────────────────────
  const crisis = readCrisisSignalDetector({ culturalStorm: true, audienceAcuteStress: true, contradictionsActive: true, counterNarrativeForming: true });
  const noCrisis = readCrisisSignalDetector({ culturalStorm: false, audienceAcuteStress: false, contradictionsActive: false, counterNarrativeForming: false });
  checks.push([
    'crisis signal detector flags live moments where action of any kind is a mistake',
    crisis.crisis_active && !noCrisis.crisis_active,
    `storm + stress → "${crisis.crisis_kind}"; clean → none`,
  ]);
  const opportunity = readRealtimeOpportunityDetector({ culturalCalm: true, attentionAvailable: 8, warmGradient: true });
  checks.push([
    'realtime opportunity detector finds windows where the brand could land harder than usual',
    opportunity.opportunity_open,
    `calm + attention + warm gradient → opportunity (${opportunity.opportunity_strength}/10)`,
  ]);
  const drifted = readLiveDriftDetection({ liveCouplingHealth: 3, attributionFails: true, fieldIsCoherent: false });
  const onTrack = readLiveDriftDetection({ liveCouplingHealth: 9, attributionFails: false, fieldIsCoherent: true });
  checks.push([
    'live drift detection catches the layer mis-reading the live field',
    drifted.drift_detected && !onTrack.drift_detected,
    `unhealthy + bad attribution → DRIFT (${drifted.drift_magnitude}/10); clean → on track`,
  ]);

  // ── reality presence verifier + live impact + attribution audit ─
  const presenceMeter = readRealityPresenceMeter({ presenceScore: 7, meaningGenerated: 4, liveSignalStrength: 7 });
  const present = readRealityPresenceVerifier({ presenceMeter: presenceMeter.presence, brandActedThisCycle: true, liveSignalStrength: 7 });
  const absent = readRealityPresenceVerifier({ presenceMeter: 1, brandActedThisCycle: false, liveSignalStrength: 1 });
  checks.push([
    'reality presence verifier separates verified presence from the appearance of presence',
    present.is_present && !absent.is_present,
    `acted + signal → ${present.is_present ? 'present' : 'absent'} (${present.presence_score}/10); thin → absent`,
  ]);
  const impactReal = readLiveImpactDetector({
    trustVelocityPositive: true, meaningCarried: true, narrativeIsSpreading: true, brandIsPresent: true,
  });
  const impactNone = readLiveImpactDetector({
    trustVelocityPositive: false, meaningCarried: false, narrativeIsSpreading: false, brandIsPresent: false,
  });
  checks.push([
    'live impact detector answers the Wave 14 question — did reality change because we existed?',
    impactReal.reality_demonstrably_changed && !impactNone.reality_demonstrably_changed,
    `4 signals → reality CHANGED ("${impactReal.reality_change_summary}"); 0 → unchanged`,
  ]);
  const attribGood = readRealityChangeAttribution({ realityChanged: true, worldShiftedAlone: false, liveSignalClarity: 8 });
  const attribFails = readRealityChangeAttribution({ realityChanged: true, worldShiftedAlone: true, liveSignalClarity: 5 });
  checks.push([
    'reality change attribution refuses credit when the world shifted on its own',
    attribGood.attribution_holds && !attribFails.attribution_holds,
    `clean → holds (${attribGood.attribution_share}/10); world moved alone → fails`,
  ]);
  const auditPass = readRealityChangeAttributionAuditor({ attributionShare: 7, worldShiftedAlone: false, fieldIsCoherent: true });
  const auditFail = readRealityChangeAttributionAuditor({ attributionShare: 1, worldShiftedAlone: true, fieldIsCoherent: false });
  checks.push([
    'reality change attribution auditor passes a second-order check on the claim',
    auditPass.audit_passed && !auditFail.audit_passed,
    `clean → passed; polluted → ${auditFail.audit_note}`,
  ]);

  // ── live coupling health + boundary + integrity + coherence ─────
  const healthy = readLiveCouplingHealth({ liveSignalStrength: 8, signalIsFresh: true, fieldIsCoherent: true, presenceScore: 7 });
  const unhealthy = readLiveCouplingHealth({ liveSignalStrength: 2, signalIsFresh: false, fieldIsCoherent: false, presenceScore: 2 });
  checks.push([
    'live coupling health flags failure modes in the layer',
    healthy.is_healthy && !unhealthy.is_healthy && unhealthy.failure_modes.length >= 3,
    `clean → healthy; unhealthy → ${unhealthy.failure_modes.length} failure mode(s)`,
  ]);
  const inBounds = readLiveCouplingBoundaryEnforcement({ chasingViralityOverMeaning: false, performingForTheLiveField: false, riding_a_crisis_for_reach: false });
  const crossed = readLiveCouplingBoundaryEnforcement({ chasingViralityOverMeaning: false, performingForTheLiveField: false, riding_a_crisis_for_reach: true });
  checks.push([
    'live coupling boundary enforcement refuses crisis-riding even when reach would reward it',
    inBounds.within_boundary && !crossed.within_boundary,
    `clean → within; crisis-riding → "${crossed.boundary_crossed}"`,
  ]);
  const integrityOk = readLiveCouplingIntegrityValidator({ liveCouplingHealth: 9, signalIsFresh: true, fieldIsCoherent: true, attributionHolds: true });
  const integrityFail = readLiveCouplingIntegrityValidator({ liveCouplingHealth: 2, signalIsFresh: false, fieldIsCoherent: false, attributionHolds: false });
  checks.push([
    'live coupling integrity validator refuses to update beliefs on unsound live signal',
    integrityOk.integrity_holds && !integrityFail.integrity_holds,
    `clean → holds (${integrityOk.integrity_score}/10); polluted → ${integrityFail.integrity_issues.length} issue(s)`,
  ]);
  const coherentLayer = readLiveCouplingCoherenceValidator({
    realityChanged: true, driftDetected: false, opportunityOpen: false, crisisActive: false, attributionAudit: true,
  });
  const incoherentLayer = readLiveCouplingCoherenceValidator({
    realityChanged: true, driftDetected: true, opportunityOpen: true, crisisActive: true, attributionAudit: false,
  });
  checks.push([
    'live coupling coherence validator catches the layer contradicting itself',
    coherentLayer.live_coupling_is_coherent && !incoherentLayer.live_coupling_is_coherent && incoherentLayer.incoherences.length >= 3,
    `aligned → coherent; conflicting → ${incoherentLayer.incoherences.length} incoherence(s)`,
  ]);

  // ── governor + presence check ───────────────────────────────────
  const govEvolving = readLiveCouplingGovernor({ integrityHolds: true, brandIsPresent: true, realityChanged: true, driftDetected: false, loadIsSustainable: true });
  const govSevered = readLiveCouplingGovernor({ integrityHolds: false, brandIsPresent: false, realityChanged: false, driftDetected: true, loadIsSustainable: false });
  const govAbsent = readLiveCouplingGovernor({ integrityHolds: true, brandIsPresent: false, realityChanged: false, driftDetected: false, loadIsSustainable: true });
  checks.push([
    'live coupling governor reads reality-evolving, present, absent, and severed governance',
    govEvolving.governance === 'reality-evolving' && govSevered.governance === 'severed' && govAbsent.governance === 'absent',
    `evolving → "${govEvolving.governance}"; severed → "${govSevered.governance}"; not present → "${govAbsent.governance}"`,
  ]);
  const presenceCheck = readCivilizationCouplingPresenceCheck({ isPresent: true, governorGovernance: 'reality-evolving', withinBoundary: true });
  const presenceFail = readCivilizationCouplingPresenceCheck({ isPresent: false, governorGovernance: 'severed', withinBoundary: false });
  checks.push([
    'civilization coupling presence check is the last gate before the kernel',
    presenceCheck.brand_is_in_reality && !presenceFail.brand_is_in_reality,
    `clean → PASS; severed → ${presenceFail.check_reason}`,
  ]);

  // ── helpers exercised ───────────────────────────────────────────
  void readLiveReactionStreamProcessor({ comments: ingested.comments });
  void readMeaningDensityAnalyzer({ resonance: 7, truthfulness: true, attentionDemanded: 3 });
  void readNoveltyDecayTracker({ initialNovelty: 8, cyclesSinceNew: 2 });
  void readSentimentFieldGradient({ fieldMean: 3, fieldVariance: 6 });
  void readReputationFieldVelocity({ reputationNow: 7, reputationEarlier: 5 });

  // ── persistent state evolves and survives a restart ─────────────
  const store = createLiveCouplingStore();
  await store.reset();
  const base = createInitialLiveCoupling();
  const afterMeaning = evolveLiveCouplingFromMeaning(base);
  const afterNovelty = evolveLiveCouplingFromNovelty(base);
  const afterSilence = evolveLiveCouplingFromStrategicSilence(base);
  checks.push([
    'live coupling state evolves — meaning deepens, novelty thins, strategic silence holds presence',
    afterMeaning.realityCouplingDepth > base.realityCouplingDepth &&
      afterMeaning.meaningsCarried === 1 &&
      afterNovelty.realityCouplingDepth < base.realityCouplingDepth &&
      afterNovelty.noveltyChased === 1 &&
      afterSilence.silencesObserved === 1 &&
      afterSilence.cadenceSync > base.cadenceSync,
    `meaning → depth ${base.realityCouplingDepth}→${afterMeaning.realityCouplingDepth}; novelty → ${base.realityCouplingDepth}→${afterNovelty.realityCouplingDepth}; silence → cadence ${base.cadenceSync}→${afterSilence.cadenceSync}`,
  ]);
  await store.save(afterMeaning);
  (globalThis as { __moodLiveCoupling?: unknown }).__moodLiveCoupling = undefined;
  const reloaded = await store.read();
  checks.push([
    'live coupling state persists and survives a restart',
    reloaded.couplingCycles === 1 && reloaded.meaningsCarried === 1,
    `reloaded ${reloaded.couplingCycles} cycle, ${reloaded.meaningsCarried} meaning on record`,
  ]);
  await store.reset();

  // ── THE CLOSING SYNTHESIS — did reality change? ─────────────────
  const shapingState = { ...createInitialLiveCoupling(), couplingCycles: 5, meaningsCarried: 4, realityChangesAttributed: 3, presenceScore: 8, realityCouplingDepth: 8 };
  const shapingSynth = readCivilizationCouplingKernel({
    state: shapingState, governor: govEvolving, presence: present,
    liveImpact: impactReal, coherence: coherentLayer,
  });
  const severedState = { ...createInitialLiveCoupling(), couplingCycles: 6, meaningsCarried: 0, realityChangesAttributed: 0, presenceScore: 1, realityCouplingDepth: 1 };
  const severedSynth = readCivilizationCouplingKernel({
    state: severedState, governor: govSevered, presence: absent,
    liveImpact: impactNone, coherence: incoherentLayer,
  });
  checks.push([
    'the civilization coupling kernel answers "what changed in reality because we existed?" — shaping vs severed',
    shapingSynth.organism_changed_reality && !shapingSynth.organism_was_absent_from_reality &&
      severedSynth.organism_was_absent_from_reality && !severedSynth.organism_changed_reality,
    `shaping → "${shapingSynth.coupling_state}" — "${shapingSynth.what_reality_became}"; severed → "${severedSynth.coupling_state}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 14 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 14 VERIFIED — the organism feels reality in real time and changes it by existing.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
