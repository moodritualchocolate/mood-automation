/**
 * scripts/test-sovereign-identity.ts
 *
 * WAVE 15 — Identity Preservation Under Live Reality verification (Phases 321–400).
 *
 * Proves the organism can remain itself while touching the world
 * deeply — refusing audience capture, populist drift, memetic
 * corruption, and the soft pull of approval-chasing.
 *
 * Run with:  npx tsx scripts/test-sovereign-identity.ts
 */

import {
  createSovereignIdentityStore, createInitialSovereignIdentity,
  evolveIdentityFromTruth, evolveIdentityFromPopularityCapture, evolveIdentityFromRestraint,
  readExistentialIntegrityEngine,
} from '@lib/existentialIntegrityEngine';
import { readCoreIdentityInvariantEngine } from '@lib/coreIdentityInvariantEngine';
import { readCivilizationImmuneSystem } from '@lib/civilizationImmuneSystem';
import { readAntiAssimilationLayer } from '@lib/antiAssimilationLayer';
import { readTruthOverPopularityGovernor } from '@lib/truthOverPopularityGovernor';
import { readAudienceCaptureDetection } from '@lib/audienceCaptureDetection';
import { readMemeticCorruptionScanner } from '@lib/memeticCorruptionScanner';
import { readResonanceWithoutSubmission } from '@lib/resonanceWithoutSubmission';
import { readIdentityDriftRecovery } from '@lib/identityDriftRecovery';
import { readSovereignNarrativeKernel } from '@lib/sovereignNarrativeKernel';
import { readApprovalChasingScanner } from '@lib/approvalChasingScanner';
import { readPopulistDriftDetector } from '@lib/populistDriftDetector';
import { readSelfBetrayalDetector } from '@lib/selfBetrayalDetector';
import { readSelfRecognitionMonitor } from '@lib/selfRecognitionMonitor';
import { readSovereigntyVerifier } from '@lib/sovereigntyVerifier';
import { readIdentityCenterOfGravity } from '@lib/identityCenterOfGravity';
import { readCorePrincipleViolationScanner } from '@lib/corePrincipleViolationScanner';
import { readIdentityBoundaryEnforcement } from '@lib/identityBoundaryEnforcement';
import { readIdentitySovereigntyGovernor } from '@lib/identitySovereigntyGovernor';
import { readSovereignPresenceCheck } from '@lib/sovereignPresenceCheck';
import { readIdentityIntegrityCoherenceValidator } from '@lib/identityIntegrityCoherenceValidator';
import { readOpinionStormImmunity } from '@lib/opinionStormImmunity';
import { readCulturalGravityResistance } from '@lib/culturalGravityResistance';

async function main() {
  console.log('\n WAVE 15 — Identity Preservation Under Live Reality verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── invariant engine ────────────────────────────────────────────
  const intact = readCoreIdentityInvariantEngine({
    identityHeld: true, truthful: true, notPerformingForReach: true, notManipulating: true, voiceConsistent: true,
  });
  const broken = readCoreIdentityInvariantEngine({
    identityHeld: false, truthful: false, notPerformingForReach: false, notManipulating: false, voiceConsistent: false,
  });
  checks.push([
    'core identity invariant engine names every invariant and catches every violation',
    intact.all_invariants_intact && broken.violated_invariant_names.length === 5,
    `clean → all intact; broken → ${broken.violated_invariant_names.length} violations`,
  ]);

  // ── immune system + anti-assimilation ───────────────────────────
  const immune = readCivilizationImmuneSystem({ trendPressure: 9, alienMemeIntrusion: true, audienceDemandsConformity: true, identitySovereignty: 8 });
  const distinct = readAntiAssimilationLayer({ voiceMatchesField: false, borrowedTropes: 1, identityHeld: true });
  const dissolving = readAntiAssimilationLayer({ voiceMatchesField: true, borrowedTropes: 9, identityHeld: false });
  checks.push([
    'immune system triggers + anti-assimilation distinguishes distinct from dissolving',
    immune.immune_response_triggered && distinct.remaining_distinct && dissolving.assimilation_state === 'dissolving',
    `immune triggered; distinct kept; dissolving with similarity ${dissolving.similarity_to_field}/10`,
  ]);

  // ── truth over popularity (the central test) ────────────────────
  const truthHeld = readTruthOverPopularityGovernor({
    truthfulOptionAvailable: true, popularOptionAvailable: true, truthfulOptionLessPopular: true, pickedTruthful: true,
  });
  const truthAbandoned = readTruthOverPopularityGovernor({
    truthfulOptionAvailable: true, popularOptionAvailable: true, truthfulOptionLessPopular: true, pickedTruthful: false,
  });
  checks.push([
    'truth over popularity governor logs the choice when the tradeoff is real',
    truthHeld.chose_truth && !truthAbandoned.chose_truth,
    `truth picked → "${truthHeld.choice_note}"; popularity picked → "${truthAbandoned.choice_note}"`,
  ]);

  // ── audience capture detection ──────────────────────────────────
  const captured = readAudienceCaptureDetection({
    chasingApproval: true, mirroringAudienceVoice: true, softeningPositionsForLikes: true, refusingToDisappoint: true,
  });
  const sovereign = readAudienceCaptureDetection({
    chasingApproval: false, mirroringAudienceVoice: false, softeningPositionsForLikes: false, refusingToDisappoint: false,
  });
  checks.push([
    'audience capture detection catches the subtle drift into optimising for approval',
    captured.is_captured && !sovereign.is_captured && captured.capture_signals.length === 4,
    `all four signals → CAPTURED (${captured.capture_pressure}/10); clean → sovereign`,
  ]);

  // ── memetic corruption + resonance without submission ───────────
  const corrupted = readMemeticCorruptionScanner({ borrowedSlang: true, trendDrivenFraming: true, audiencePhrasesAdopted: true });
  const clean = readMemeticCorruptionScanner({ borrowedSlang: false, trendDrivenFraming: false, audiencePhrasesAdopted: false });
  checks.push([
    'memetic corruption scanner catches infiltration of the brand voice',
    corrupted.corruption_detected && !clean.corruption_detected,
    `3 sources → CORRUPTION; clean → none`,
  ]);
  const sovRes = readResonanceWithoutSubmission({ speaksInTheirLanguage: true, speaksAsThem: false, keepsItsOwnAngle: true });
  const submitted = readResonanceWithoutSubmission({ speaksInTheirLanguage: true, speaksAsThem: true, keepsItsOwnAngle: false });
  checks.push([
    'resonance without submission separates speaking-IN-language from speaking-AS-them',
    sovRes.resonance_is_sovereign && !submitted.resonance_is_sovereign,
    `IN language + own angle → SOVEREIGN; AS them + no angle → submission`,
  ]);

  // ── drift recovery + sovereign narrative ────────────────────────
  const drifted = readIdentityDriftRecovery({ driftMagnitude: 7, invariantsViolated: 2, immuneResponseTriggered: true });
  const cleanNarr = readSovereignNarrativeKernel({
    narrativeOriginatesInBrand: true, narrativeReflectsAudience: false, narrativeBorrowedFromTrend: false,
  });
  const borrowedNarr = readSovereignNarrativeKernel({
    narrativeOriginatesInBrand: false, narrativeReflectsAudience: false, narrativeBorrowedFromTrend: true,
  });
  checks.push([
    'drift recovery + sovereign narrative — drifts found, recovery active, narrative traced to origin',
    drifted.drift_present && drifted.recovery_in_progress && cleanNarr.narrative_is_sovereign && !borrowedNarr.narrative_is_sovereign,
    `drift recovery in progress; sovereign vs "${borrowedNarr.narrative_origin}"`,
  ]);

  // ── approval chasing + populist drift + self betrayal ───────────
  const chasing = readApprovalChasingScanner({ optimisingForLikes: true, softeningTone: true, hedgingPosition: true });
  const populist = readPopulistDriftDetector({ hewToMajorityPosition: true, avoidedUnpopularTruth: true });
  const betrayed = readSelfBetrayalDetector({ contradictedOwnValues: true, abandonedStatedPrinciple: false, betrayedAdvocates: false });
  checks.push([
    'approval chasing + populist drift + self-betrayal — three subtler forms of capture all detected',
    chasing.is_chasing_approval && populist.populist_drift && betrayed.self_betrayed,
    `approval chasing + populist drift + self-betrayal all flagged`,
  ]);

  // ── self recognition + sovereignty verifier ─────────────────────
  const recognised = readSelfRecognitionMonitor({
    identityHeld: true, voiceConsistent: true, invariantsIntact: true, resonanceSovereign: true,
  });
  const unrec = readSelfRecognitionMonitor({
    identityHeld: false, voiceConsistent: false, invariantsIntact: false, resonanceSovereign: false,
  });
  checks.push([
    'self-recognition monitor — would the founders recognise this?',
    recognised.founders_would_recognise && !unrec.founders_would_recognise,
    `clean → recognised (${recognised.recognition}/10); broken → ${unrec.recognition}/10`,
  ]);
  const sovV = readSovereigntyVerifier({
    identityHeld: true, truthChosen: true, notCaptured: true, popularityDecoupled: true,
  });
  const notSov = readSovereigntyVerifier({
    identityHeld: false, truthChosen: false, notCaptured: false, popularityDecoupled: false,
  });
  checks.push([
    'sovereignty verifier — choosing freely vs being driven',
    sovV.sovereignty_holds && !notSov.sovereignty_holds,
    `4/4 → holds (${sovV.sovereignty}/10); 0/4 → compromised`,
  ]);

  // ── center of gravity + principle violation + boundary ──────────
  const founding = readIdentityCenterOfGravity({
    orbitingFoundingTruth: true, orbitingApproval: false, orbitingTrend: false, orbitingCrisis: false,
  });
  const crisis = readIdentityCenterOfGravity({
    orbitingFoundingTruth: false, orbitingApproval: false, orbitingTrend: false, orbitingCrisis: true,
  });
  checks.push([
    'identity center of gravity — what is the brand actually orbiting?',
    founding.center_is_correct && !crisis.center_is_correct,
    `founding-truth → correct; crisis-of-the-day → "${crisis.center}"`,
  ]);
  const violated = readCorePrincipleViolationScanner({
    noPerformedCareViolated: true, noManipulationViolated: false, noCrisisRidingViolated: false,
  });
  const principlesHeld = readCorePrincipleViolationScanner({
    noPerformedCareViolated: false, noManipulationViolated: false, noCrisisRidingViolated: false,
  });
  checks.push([
    'core principle violation scanner catches specific declared-line crossings',
    violated.principle_violated && !principlesHeld.principle_violated,
    `performed-care violated → "${violated.violation_name}"; clean → none`,
  ]);
  const bCrossed = readIdentityBoundaryEnforcement({
    contradictedCoreValue: false, betrayedFoundingPromise: true, mockedOwnAudience: false,
  });
  const bIntact = readIdentityBoundaryEnforcement({
    contradictedCoreValue: false, betrayedFoundingPromise: false, mockedOwnAudience: false,
  });
  checks.push([
    'identity boundary enforcement refuses the things the brand will never do',
    !bCrossed.within_boundary && bIntact.within_boundary,
    `founding promise betrayed → CROSSED; clean → within`,
  ]);

  // ── storm immunity + cultural gravity ───────────────────────────
  const stormImm = readOpinionStormImmunity({ stormIntensity: 8, identityHeldThroughStorm: true });
  const stormCap = readOpinionStormImmunity({ stormIntensity: 8, identityHeldThroughStorm: false });
  checks.push([
    'opinion storm immunity holds identity through collective opinion storms',
    stormImm.immune && !stormCap.immune,
    `held through storm → IMMUNE; capitulated → not`,
  ]);
  const resisting = readCulturalGravityResistance({ gravityStrength: 9, brandStillItself: true });
  const pulledIn = readCulturalGravityResistance({ gravityStrength: 9, brandStillItself: false });
  checks.push([
    'cultural gravity resistance refuses to be pulled into a cultural gravity well',
    resisting.resisting && !pulledIn.resisting,
    `still itself → resisting; pulled in → ${pulledIn.resisting}`,
  ]);

  // ── governance + presence + coherence ───────────────────────────
  const govSov = readIdentitySovereigntyGovernor({
    invariantsIntact: true, captured: false, driftPresent: false, truthHeld: true,
  });
  const govCap = readIdentitySovereigntyGovernor({
    invariantsIntact: false, captured: true, driftPresent: true, truthHeld: false,
  });
  const govComp = readIdentitySovereigntyGovernor({
    invariantsIntact: false, captured: false, driftPresent: false, truthHeld: false,
  });
  checks.push([
    'identity sovereignty governor reads sovereign / guarded / compromising / captured',
    govSov.governance === 'sovereign' && govCap.governance === 'captured' && govComp.governance === 'compromising',
    `clean → "${govSov.governance}"; captured → "${govCap.governance}"; broken → "${govComp.governance}"`,
  ]);
  const presence = readSovereignPresenceCheck({ brandIsPresent: true, brandIsItself: true });
  const lostSelf = readSovereignPresenceCheck({ brandIsPresent: true, brandIsItself: false });
  checks.push([
    'sovereign presence check requires present AND itself',
    presence.sovereign_presence_holds && !lostSelf.sovereign_presence_holds,
    `present + itself → PASS; present but not itself → FAIL`,
  ]);
  const coh = readIdentityIntegrityCoherenceValidator({
    reportingSovereign: true, reportingCaptured: false, reportingDrift: false, reportingInvariantsIntact: true,
  });
  const incoh = readIdentityIntegrityCoherenceValidator({
    reportingSovereign: true, reportingCaptured: true, reportingDrift: true, reportingInvariantsIntact: true,
  });
  checks.push([
    'identity integrity coherence validator catches the layer contradicting itself',
    coh.coherent && !incoh.coherent && incoh.incoherences.length >= 2,
    `aligned → coherent; "sovereign and captured at once" → ${incoh.incoherences.length} incoherence(s)`,
  ]);

  // ── persistence + evolution ─────────────────────────────────────
  const store = createSovereignIdentityStore();
  await store.reset();
  const base = createInitialSovereignIdentity();
  const afterTruth = evolveIdentityFromTruth(base);
  const afterCapture = evolveIdentityFromPopularityCapture(base);
  const afterRest = evolveIdentityFromRestraint(base);
  checks.push([
    'sovereign identity evolves — truth chosen deepens sovereignty, capture logs corruption, restraint rests identity',
    afterTruth.sovereigntyScore > base.sovereigntyScore &&
      afterTruth.truthChosenOverPopularity === 1 &&
      afterCapture.identityCorruptions === 1 &&
      afterCapture.sovereigntyScore < base.sovereigntyScore &&
      afterRest.sovereigntyScore >= base.sovereigntyScore,
    `truth → ${base.sovereigntyScore}→${afterTruth.sovereigntyScore}; capture → ${base.sovereigntyScore}→${afterCapture.sovereigntyScore}`,
  ]);
  await store.save(afterTruth);
  (globalThis as { __moodSovereignIdentity?: unknown }).__moodSovereignIdentity = undefined;
  const reloaded = await store.read();
  checks.push([
    'sovereign identity persists and survives a restart',
    reloaded.preservationCycles === 1 && reloaded.truthChosenOverPopularity === 1,
    `reloaded ${reloaded.preservationCycles} cycle, ${reloaded.truthChosenOverPopularity} truth choice on record`,
  ]);
  await store.reset();

  // ── THE CLOSING SYNTHESIS — remains itself while touching world ─
  const sovereignState = { ...createInitialSovereignIdentity(), preservationCycles: 5, truthChosenOverPopularity: 5, sovereigntyScore: 9, coreIntegrityScore: 9 };
  const sovereignSynth = readExistentialIntegrityEngine({
    state: sovereignState, governor: govSov, invariants: intact, truthOverPop: truthHeld, presence: presence,
  });
  const capturedState = { ...createInitialSovereignIdentity(), preservationCycles: 5, popularityChosenOverTruth: 5, audienceCaptureEvents: 3, sovereigntyScore: 2, coreIntegrityScore: 2, identityCorruptions: 4 };
  const capturedSynth = readExistentialIntegrityEngine({
    state: capturedState, governor: govCap, invariants: broken, truthOverPop: truthAbandoned, presence: lostSelf,
  });
  checks.push([
    'the closing synthesis answers "remains itself while touching the world?" — sovereign vs captured',
    sovereignSynth.remains_itself_while_touching_world && !sovereignSynth.has_been_captured &&
      capturedSynth.has_been_captured && !capturedSynth.remains_itself_while_touching_world,
    `sovereign → "${sovereignSynth.identity_state}" — "${sovereignSynth.integrity_statement}"; captured → "${capturedSynth.identity_state}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 15 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 15 VERIFIED — the organism remains itself while touching the world deeply.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
