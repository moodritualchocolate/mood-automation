/**
 * scripts/test-cognitive-civilization.ts
 *
 * WAVE 6 — Cognitive Civilization Infrastructure verification
 * (Phases 56–70).
 *
 * Proves the system has HISTORY: it accumulates institutional memory,
 * inherits beliefs, enacts laws, carries scars, drifts culturally,
 * decays when optimization beats identity, survives a restart, and
 * can explain a decision historically.
 *
 * Run with:  npx tsx scripts/test-cognitive-civilization.ts
 */

import {
  createCivilizationArchiveStore, createInitialCivilization,
} from '@lib/civilizationArchive';
import { readInstitutionalMemory, recordInstitutionalMemory } from '@lib/institutionalMemory';
import { readCulturalDrift, recordCulturalTendency } from '@lib/culturalDriftEngine';
import { readBeliefPersistence, reinforceBelief } from '@lib/beliefPersistence';
import { readScarMemory, recordScar } from '@lib/psychologicalScarMemory';
import { archiveDecision } from '@lib/historicalDecisionArchive';
import { readCognitiveLaws, considerLawFromHistory } from '@lib/cognitiveLawSystem';
import { readExecutiveEthics } from '@lib/executiveEthicsRuntime';
import { readIdeologicalMutation } from '@lib/ideologicalMutationDetection';
import { readCivilizationStability } from '@lib/civilizationStabilityLayer';
import { readTrustAuthority } from '@lib/trustAuthorityGraph';
import { readEmergentIdentityContinuity } from '@lib/emergentIdentityContinuity';

async function main() {
  console.log('\n WAVE 6 — Cognitive Civilization Infrastructure verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── institutional memory accumulates across generations ─────────
  let civ = createInitialCivilization();
  for (let g = 0; g < 10; g++) {
    civ.generation += 1;
    recordInstitutionalMemory(civ, {
      verdict: 'proceed', governingPriority: 'the brand identity — what MOOD refuses to become',
      consensusQuality: 7, debateTension: 6, emergedFromTension: true,
    });
    recordCulturalTendency(civ, 'the brand identity — what MOOD refuses to become');
  }
  const institutional = readInstitutionalMemory(civ);
  checks.push([
    'institutional memory accumulates across generations',
    institutional.remembered_sessions === 10 && institutional.dominant_governing_priority !== null,
    `${institutional.remembered_sessions} sessions remembered — ${institutional.institutional_character}`,
  ]);

  // ── cultural drift narrows under a monoculture ──────────────────
  const drift = readCulturalDrift(civ);
  checks.push([
    'cultural drift detects narrowing into a monoculture',
    drift.drift_is_narrowing,
    drift.drift_description,
  ]);

  // ── beliefs persist and strengthen as they are reinforced ───────
  let beliefCiv = createInitialCivilization();
  for (let i = 0; i < 5; i++) {
    beliefCiv.generation += 1;
    reinforceBelief(beliefCiv, 'restraint outlasts loudness');
  }
  const beliefs = readBeliefPersistence(beliefCiv);
  checks.push([
    'beliefs persist and strengthen as they are reinforced',
    beliefs.core_belief !== null && beliefs.core_belief.strength >= 7 &&
      beliefs.core_belief.timesReinforced === 5,
    beliefs.core_belief
      ? `core belief "${beliefs.core_belief.statement}" strength ${beliefs.core_belief.strength}/10`
      : 'no belief formed',
  ]);

  // ── laws are enacted from a repeated refusal pattern ────────────
  let lawCiv = createInitialCivilization();
  for (let i = 0; i < 5; i++) {
    lawCiv.generation += 1;
    archiveDecision(lawCiv, {
      verdict: 'block', dominantTruth: 'a corrupted truth',
      reason: 'optimization tried to override identity', optimizationWon: false,
    });
  }
  considerLawFromHistory(lawCiv);
  const laws = readCognitiveLaws({ state: lawCiv, candidateDescriptor: 'a fresh banner' });
  checks.push([
    'cognitive laws are enacted from a repeated refusal pattern',
    laws.laws.length >= 1,
    laws.laws.length ? `enacted law: "${laws.laws[0].law}"` : 'no law enacted',
  ]);

  // ── the civilization decays when optimization beats identity ────
  let decayCiv = createInitialCivilization();
  for (let i = 0; i < 10; i++) {
    decayCiv.generation += 1;
    archiveDecision(decayCiv, {
      verdict: 'proceed', dominantTruth: 't', reason: 'optimization won',
      optimizationWon: true,
    });
  }
  const decayStability = readCivilizationStability({
    state: decayCiv,
    drift: readCulturalDrift(decayCiv),
    mutation: readIdeologicalMutation(decayCiv),
    authority: readTrustAuthority(decayCiv),
  });
  checks.push([
    'the civilization decays when optimization repeatedly beats identity',
    decayStability.is_decaying && decayStability.condition === 'decaying',
    `condition "${decayStability.condition}" (${decayStability.stability}/10) — ${decayStability.decay_signals[0] ?? ''}`,
  ]);

  // ── scars are recorded and shape behaviour ──────────────────────
  let scarCiv = createInitialCivilization();
  scarCiv.generation = 3;
  recordScar(scarCiv, 'numbness optimization drift', 7);
  const scarHit = readScarMemory({ state: scarCiv, candidateDescriptor: 'numbness a flat tired banner' });
  const scarClear = readScarMemory({ state: scarCiv, candidateDescriptor: 'pressure a sharp deadline banner' });
  checks.push([
    'psychological scars are recorded and flagged when reopened',
    scarHit.touches_a_scar && !scarClear.touches_a_scar,
    `scar reopened by matching territory: ${scarHit.touches_a_scar}; clear of unrelated territory: ${!scarClear.touches_a_scar}`,
  ]);

  // ── executive ethics blocks an ethical violation ────────────────
  const ethicsViolation = readExecutiveEthics({
    state: createInitialCivilization(),
    manufacturesInadequacy: true, exploitsExhaustion: true, usesFalseUrgency: false,
    aestheticisesSuffering: false, performsCare: false,
  });
  checks.push([
    'executive ethics flags a candidate that crosses a moral line',
    ethicsViolation.ethical_violation && ethicsViolation.violated_constraints.length >= 2,
    `violated: ${ethicsViolation.violated_constraints.join(', ')}`,
  ]);

  // ── the civilization survives a restart (persistence) ───────────
  const store = createCivilizationArchiveStore();
  await store.reset();
  await store.save(civ);
  (globalThis as { __moodCivilization?: unknown }).__moodCivilization = undefined;
  const reloaded = await store.read();
  checks.push([
    'the civilization archive persists and survives a restart',
    reloaded.generation === civ.generation && reloaded.institutionalMemory.length === 10,
    `reloaded generation ${reloaded.generation} with ${reloaded.institutionalMemory.length} remembered sessions`,
  ]);
  await store.reset();

  // ── emergent identity continuity explains a decision historically
  const memoryDriven = readEmergentIdentityContinuity({
    state: beliefCiv,
    institutional: readInstitutionalMemory(civ),
    beliefs: readBeliefPersistence(beliefCiv),
    stability: readCivilizationStability({
      state: beliefCiv, drift: readCulturalDrift(beliefCiv),
      mutation: readIdeologicalMutation(beliefCiv), authority: readTrustAuthority(beliefCiv),
    }),
    laws: readCognitiveLaws({ state: beliefCiv, candidateDescriptor: 'x' }),
    scars: readScarMemory({ state: beliefCiv, candidateDescriptor: 'x' }),
    identityHeld: true,
  });
  const optimizationDriven = readEmergentIdentityContinuity({
    state: decayCiv,
    institutional: readInstitutionalMemory(decayCiv),
    beliefs: readBeliefPersistence(decayCiv),
    stability: decayStability,
    laws: readCognitiveLaws({ state: decayCiv, candidateDescriptor: 'x' }),
    scars: readScarMemory({ state: decayCiv, candidateDescriptor: 'x' }),
    identityHeld: false,
  });
  checks.push([
    'emergent identity continuity distinguishes memory-driven from optimization-driven decisions',
    memoryDriven.emerged_from_civilization_memory && optimizationDriven.driven_by_optimization_pressure,
    `belief civ: emerged from memory=${memoryDriven.emerged_from_civilization_memory}; decaying civ: driven by optimization=${optimizationDriven.driven_by_optimization_pressure}`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 6 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 6 VERIFIED — a persistent strategic organism with history.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
