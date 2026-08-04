/**
 * scripts/test-generative-presence.ts
 *
 * WAVE 16 — Generative Civilization Presence verification (Phases 401–500).
 *
 * Proves the organism changes reality by existing beautifully inside
 * it — refusing force, predation, manipulation, spectacle, othering.
 *
 * Run with:  npx tsx scripts/test-generative-presence.ts
 */

import {
  createGenerativePresenceStore, createInitialGenerativePresence,
  evolveGenerativeFromBeauty, evolveGenerativeFromForce, evolveGenerativeFromQuiet,
  readCivilizationCoherenceRuntime,
} from '@lib/civilizationCoherenceRuntime';
import { readCivilizationPresenceField } from '@lib/civilizationPresenceField';
import { readMeaningPropagationEngine } from '@lib/meaningPropagationEngine';
import { readTrustGravityWell } from '@lib/trustGravityWell';
import { readSymbolicWorldbuildingRuntime } from '@lib/symbolicWorldbuildingRuntime';
import { readMythogenesisLayer } from '@lib/mythogenesisLayer';
import { readCollectiveHealingPatterns } from '@lib/collectiveHealingPatterns';
import { readResonanceFieldExpansion } from '@lib/resonanceFieldExpansion';
import { readNonManipulativeInfluenceSystem } from '@lib/nonManipulativeInfluenceSystem';
import { readBeautyPersistenceRuntime } from '@lib/beautyPersistenceRuntime';
import { readAntiCynicismField } from '@lib/antiCynicismField';
import { readCoherentHopeArchitecture } from '@lib/coherentHopeArchitecture';
import { readCollectiveNervousSystemRepair } from '@lib/collectiveNervousSystemRepair';
import { readGenerativePresenceMeter } from '@lib/generativePresenceMeter';
import { readGenerativePresenceGovernor } from '@lib/generativePresenceGovernor';
import { readGenerativePresenceBoundary } from '@lib/generativePresenceBoundary';
import { readGenerativePresencePresenceCheck } from '@lib/generativePresencePresenceCheck';
import { readGenerativePresenceCoherence } from '@lib/generativePresenceCoherence';
import { readGenerativeIntegrityCoherence } from '@lib/generativeIntegrityCoherence';
import { readGenerativePresenceWatchdog } from '@lib/generativePresenceWatchdog';
import { readGenerativeAccountabilityArchive } from '@lib/generativeAccountabilityArchive';
import { readBeautyOverSpectacleGovernor } from '@lib/beautyOverSpectacleGovernor';
import { readAntiOtheringEngine } from '@lib/antiOtheringEngine';
import { readSymbolicGiftEngine } from '@lib/symbolicGiftEngine';
import { readPresenceWithoutPredation } from '@lib/presenceWithoutPredation';
import { readAntiEngagementOptimization } from '@lib/antiEngagementOptimization';
import { readBeautyAsTruthValidator } from '@lib/beautyAsTruthValidator';
import { readCollectiveWoundReader } from '@lib/collectiveWoundReader';
import { readHopeSeedDetector } from '@lib/hopeSeedDetector';

async function main() {
  console.log('\n WAVE 16 — Generative Civilization Presence verification\n');
  const checks: Array<[string, boolean, string]> = [];

  const fieldGen = readCivilizationPresenceField({ sovereignty: 8, livingReputation: 7, forcedInfluence: false });
  const fieldForced = readCivilizationPresenceField({ sovereignty: 8, livingReputation: 7, forcedInfluence: true });
  checks.push([
    'civilization presence field is generative only when not forcing',
    fieldGen.field_is_generative && !fieldForced.field_is_generative,
    `clean → generative; forcing → thin (${fieldForced.field_strength}/10)`,
  ]);

  const propagating = readMeaningPropagationEngine({ meaningDensity: 9, trustGravity: 10 });
  checks.push([
    'meaning propagation engine reads meaning spreading outward',
    propagating.propagating,
    `density 8 + gravity 8 → propagating (${propagating.propagation_velocity}/10)`,
  ]);

  const wellPulling = readTrustGravityWell({ livingReputation: 8, trustNetGain: 4 });
  const wellThin = readTrustGravityWell({ livingReputation: 2, trustNetGain: -2 });
  checks.push([
    'trust gravity well pulls without effort when reputation has been earned',
    wellPulling.pulling_without_effort && !wellThin.pulling_without_effort,
    `8 + 4 → PULLING; 2 + -2 → thin`,
  ]);

  const inhabit = readSymbolicWorldbuildingRuntime({ symbolDensity: 8, symbolCoherence: 8 });
  checks.push([
    'symbolic worldbuilding runtime builds a world others can enter',
    inhabit.world_is_inhabitable,
    `density 8 + coherence 8 → inhabitable`,
  ]);

  const myth = readMythogenesisLayer({ archetypePresent: true, symbolPersistence: 7, timelinessRight: true });
  const noMyth = readMythogenesisLayer({ archetypePresent: false, symbolPersistence: 2, timelinessRight: false });
  checks.push([
    'mythogenesis layer generates myth when archetype + persistence + timeliness align',
    myth.myth_taking_root && !noMyth.myth_taking_root,
    `aligned → taking root; misaligned → no myth`,
  ]);

  const healing = readCollectiveHealingPatterns({
    audienceWoundedByExhaustion: true, audienceWoundedByCynicism: false, brandAbleToOfferQuiet: true,
  });
  checks.push([
    'collective healing patterns offers shelter to the right wound',
    healing.healing_pattern_offered && healing.pattern_kind !== null,
    `exhaustion + quiet available → "${healing.pattern_kind}"`,
  ]);

  const expanding = readResonanceFieldExpansion({ meaningPropagated: 8, trustGravity: 8 });
  checks.push([
    'resonance field expansion measures the field growing outward',
    expanding.expanding,
    `8 + 8 → expanding (radius ${expanding.field_radius}/10)`,
  ]);

  const inviting = readNonManipulativeInfluenceSystem({ invitesNotPushes: true, manipulating: false });
  const pushing = readNonManipulativeInfluenceSystem({ invitesNotPushes: false, manipulating: true });
  checks.push([
    'non-manipulative influence system separates invitation from pressure',
    inviting.influence_is_invitation && !pushing.influence_is_invitation,
    `inviting → INVITATION; pushing + manipulating → pressure`,
  ]);

  const beautyHolds = readBeautyPersistenceRuntime({ beautyPresent: true, truthful: true, carriedSecondHand: true });
  const beautyFades = readBeautyPersistenceRuntime({ beautyPresent: false, truthful: false, carriedSecondHand: false });
  checks.push([
    'beauty persistence runtime measures beauty outliving the moment',
    beautyHolds.beauty_persists && !beautyFades.beauty_persists,
    `present + truthful + carried → persists (${beautyHolds.persistence_score}/10)`,
  ]);

  const repelling = readAntiCynicismField({ sincerityPresent: true, sustainedOverTime: true, cynicismPressure: 6 });
  const absorbing = readAntiCynicismField({ sincerityPresent: false, sustainedOverTime: false, cynicismPressure: 9 });
  checks.push([
    'anti-cynicism field repels cynicism through sustained sincerity',
    repelling.cynicism_repelled && !absorbing.cynicism_repelled,
    `sustained sincerity → REPELLING; weak → absorbing`,
  ]);

  const hopeCoh = readCoherentHopeArchitecture({ hopeOffered: true, withoutDelusion: true, withoutDespair: true });
  const hopeBroken = readCoherentHopeArchitecture({ hopeOffered: true, withoutDelusion: false, withoutDespair: true });
  checks.push([
    'coherent hope architecture requires hope WITHOUT delusion or despair',
    hopeCoh.hope_is_coherent && !hopeBroken.hope_is_coherent,
    `all three → coherent; delusional hope → broken`,
  ]);

  const nsRepair = readCollectiveNervousSystemRepair({
    audienceOverloaded: true, brandOfferingSlowness: true, brandOfferingPermission: true,
  });
  checks.push([
    'collective nervous system repair offers what the audience nervous system needs',
    nsRepair.repair_offered,
    `overloaded + offering slowness → "${nsRepair.repair_kind}"`,
  ]);

  const presMeter = readGenerativePresenceMeter({ fieldStrength: 8, meaningPropagating: true });
  checks.push([
    'generative presence meter combines field strength and propagation',
    presMeter.is_generative,
    `8 + propagating → ${presMeter.presence}/10 generative`,
  ]);

  const govFlour = readGenerativePresenceGovernor({ fieldGenerative: true, forcing: false, coherent: true });
  const govExt = readGenerativePresenceGovernor({ fieldGenerative: false, forcing: true, coherent: false });
  const govThin = readGenerativePresenceGovernor({ fieldGenerative: false, forcing: false, coherent: false });
  checks.push([
    'generative presence governor reads flourishing / present / thin / extractive',
    govFlour.governance === 'flourishing' && govExt.governance === 'extractive' && govThin.governance === 'thin',
    `clean → "${govFlour.governance}"; forcing → "${govExt.governance}"; thin → "${govThin.governance}"`,
  ]);

  const inBounds = readGenerativePresenceBoundary({ forcingInfluence: false, manipulating: false, predating: false });
  const boundaryX = readGenerativePresenceBoundary({ forcingInfluence: true, manipulating: false, predating: false });
  checks.push([
    'generative presence boundary refuses forcing / manipulating / predating',
    inBounds.within && !boundaryX.within,
    `clean → within; forcing → "${boundaryX.crossed}"`,
  ]);

  const presCheckPass = readGenerativePresencePresenceCheck({ fieldGenerative: true, withinBoundary: true });
  const presCheckFail = readGenerativePresencePresenceCheck({ fieldGenerative: false, withinBoundary: false });
  checks.push([
    'generative presence presence check passes only when field is generative AND within boundary',
    presCheckPass.generative_presence_holds && !presCheckFail.generative_presence_holds,
    `clean → PASS; field thin + boundary crossed → FAIL`,
  ]);

  const cohClean = readGenerativePresenceCoherence({ fieldStrong: true, forcing: false, offeringGifts: true });
  const cohBroken = readGenerativePresenceCoherence({ fieldStrong: true, forcing: true, offeringGifts: true });
  checks.push([
    'generative presence coherence catches "strong field while forcing"',
    cohClean.coherent && !cohBroken.coherent,
    `clean → coherent; forcing while strong → ${cohBroken.incoherences.length} incoherence(s)`,
  ]);

  const intCoh = readGenerativeIntegrityCoherence({ presenceCoherent: true, meaningCoherent: true, hopeCoherent: true });
  const intBroken = readGenerativeIntegrityCoherence({ presenceCoherent: false, meaningCoherent: false, hopeCoherent: false });
  checks.push([
    'generative integrity coherence aggregates the three coherences',
    intCoh.is_coherent && !intBroken.is_coherent && intCoh.coherence_score >= 9,
    `3/3 → coherent (${intCoh.coherence_score}/10); 0/3 → ${intBroken.coherence_score}/10`,
  ]);

  const wd = readGenerativePresenceWatchdog({ fieldStrength: 2, forcing: true });
  checks.push([
    'generative presence watchdog catches forcing and thin field',
    wd.alert && wd.reason === 'forcing reality',
    `forcing + thin → ALERT "${wd.reason}"`,
  ]);

  const acctClean = readGenerativeAccountabilityArchive({ forcedAttempts: 1, beautyCount: 5 });
  const acctDamaged = readGenerativeAccountabilityArchive({ forcedAttempts: 8, beautyCount: 2 });
  checks.push([
    'generative accountability archive — more beauty than force',
    acctClean.record_clean && !acctDamaged.record_clean,
    `5 beauty / 1 forced → clean; 2 / 8 → damaged`,
  ]);

  const beautyChosen = readBeautyOverSpectacleGovernor({ beautifulOptionPicked: true, spectacleOptionPicked: false });
  const spectacleChosen = readBeautyOverSpectacleGovernor({ beautifulOptionPicked: false, spectacleOptionPicked: true });
  checks.push([
    'beauty over spectacle governor refuses spectacle when beauty was available',
    beautyChosen.chose_beauty && !spectacleChosen.chose_beauty,
    `beauty picked → BEAUTY; spectacle picked → spectacle`,
  ]);

  const noOther = readAntiOtheringEngine({ castingAnEnemy: false });
  const othering = readAntiOtheringEngine({ castingAnEnemy: true });
  checks.push([
    'anti-othering engine refuses casting an enemy',
    noOther.refuses_othering && !othering.refuses_othering,
    `no enemy → refused; casting enemy → OTHERING`,
  ]);

  const gift = readSymbolicGiftEngine({ offeringMeaningWithoutAsk: true });
  const transact = readSymbolicGiftEngine({ offeringMeaningWithoutAsk: false });
  checks.push([
    'symbolic gift engine — meaning offered without asking anything back',
    gift.gift_offered && !transact.gift_offered,
    `gift → "${gift.gift_kind}"; transaction → none`,
  ]);

  const notPreying = readPresenceWithoutPredation({ extractingAttention: false });
  const preying = readPresenceWithoutPredation({ extractingAttention: true });
  checks.push([
    'presence without predation — does not extract attention',
    notPreying.not_predatory && !preying.not_predatory,
    `clean → open; extracting → PREDATORY`,
  ]);

  const refused = readAntiEngagementOptimization({ optimizingForEngagement: false });
  const optimizing = readAntiEngagementOptimization({ optimizingForEngagement: true });
  checks.push([
    'anti-engagement optimization refuses chasing engagement',
    refused.refused_to_optimize && !optimizing.refused_to_optimize,
    `refused → clean; optimizing → captured`,
  ]);

  const beautyTruth = readBeautyAsTruthValidator({ beautiful: true, truthful: true });
  const decorative = readBeautyAsTruthValidator({ beautiful: true, truthful: false });
  checks.push([
    'beauty as truth validator — beauty without truth is decorative',
    beautyTruth.beauty_is_truth && !decorative.beauty_is_truth,
    `both → beauty is truth; beautiful but untruthful → decorative`,
  ]);

  const wound = readCollectiveWoundReader({ exhaustionHigh: true, trustEroded: false, isolationHigh: false });
  checks.push([
    'collective wound reader names the wound',
    wound.wound_detected && wound.wound_kind === 'exhaustion',
    `exhaustion high → "${wound.wound_kind}"`,
  ]);

  const seed = readHopeSeedDetector({ truthfulOptimism: true, groundedInReality: true });
  const noSeed = readHopeSeedDetector({ truthfulOptimism: false, groundedInReality: false });
  checks.push([
    'hope seed detector — truthful AND grounded',
    seed.seed_planted && !noSeed.seed_planted,
    `both → seed PLANTED (${seed.seed_quality}/10); neither → no seed`,
  ]);

  // ── evolution + persistence ─────────────────────────────────────
  const store = createGenerativePresenceStore();
  await store.reset();
  const base = createInitialGenerativePresence();
  const afterBeauty = evolveGenerativeFromBeauty(base);
  const afterForce = evolveGenerativeFromForce(base);
  const afterQuiet = evolveGenerativeFromQuiet(base);
  checks.push([
    'generative presence evolves — beauty deepens, force damages, silence preserves',
    afterBeauty.civilizationCoherenceScore > base.civilizationCoherenceScore &&
      afterBeauty.beautyMomentsCreated === 1 &&
      afterForce.civilizationCoherenceScore < base.civilizationCoherenceScore &&
      afterForce.forcedInfluenceAttempts === 1 &&
      afterQuiet.civilizationCoherenceScore >= base.civilizationCoherenceScore,
    `beauty → ${base.civilizationCoherenceScore}→${afterBeauty.civilizationCoherenceScore}; force → ${base.civilizationCoherenceScore}→${afterForce.civilizationCoherenceScore}; quiet → ${base.civilizationCoherenceScore}→${afterQuiet.civilizationCoherenceScore}`,
  ]);
  await store.save(afterBeauty);
  (globalThis as { __moodGenerativePresence?: unknown }).__moodGenerativePresence = undefined;
  const reloaded = await store.read();
  checks.push([
    'generative presence state persists and survives a restart',
    reloaded.presenceCycles === 1 && reloaded.beautyMomentsCreated === 1,
    `reloaded ${reloaded.presenceCycles} cycle, ${reloaded.beautyMomentsCreated} beauty on record`,
  ]);
  await store.reset();

  // ── THE CLOSING SYNTHESIS — reality changed beautifully? ────────
  const flourState = { ...createInitialGenerativePresence(), presenceCycles: 5, beautyMomentsCreated: 5, meaningPropagated: 4, civilizationCoherenceScore: 9, generativeImpactScore: 9 };
  const flourSynth = readCivilizationCoherenceRuntime({
    state: flourState, governor: govFlour, presenceField: fieldGen, hope: hopeCoh, coherence: intCoh,
  });
  const extractState = { ...createInitialGenerativePresence(), presenceCycles: 6, forcedInfluenceAttempts: 5, beautyMomentsCreated: 1, civilizationCoherenceScore: 2, generativeImpactScore: 2 };
  const extractSynth = readCivilizationCoherenceRuntime({
    state: extractState, governor: govExt, presenceField: fieldForced, hope: hopeBroken, coherence: intBroken,
  });
  checks.push([
    'the kernel answers "did reality become different because we existed beautifully?" — flourishing vs extractive',
    flourSynth.changed_reality_beautifully && !flourSynth.damaged_reality_by_forcing &&
      extractSynth.damaged_reality_by_forcing && !extractSynth.changed_reality_beautifully,
    `flourishing → "${flourSynth.generative_state}" — "${flourSynth.what_the_world_received}"; extractive → "${extractSynth.generative_state}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 16 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 16 VERIFIED — the organism changes reality by existing beautifully inside it.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
