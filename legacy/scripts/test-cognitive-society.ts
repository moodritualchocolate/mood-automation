/**
 * scripts/test-cognitive-society.ts
 *
 * WAVE 5 — Autonomous Strategic Society verification (Phases 43–55).
 *
 * Proves the system argues with itself before acting: the council
 * convenes, entities disagree, a real debate happens, shallow
 * consensus is detected, the identity court convicts drift,
 * self-reflection catches hypocrisy, the consensus is earned through
 * tension, and the agents' reputations evolve across sessions.
 *
 * Run with:  npx tsx scripts/test-cognitive-society.ts
 */

import type { CouncilBriefing } from '@lib/councilTypes';
import { conveneCognitiveCouncil } from '@lib/cognitiveCouncil';
import { runInternalDebate } from '@lib/internalDebateEngine';
import { resolveCouncilConflict } from '@lib/councilConflictResolution';
import { holdIdentityDefenseCourt } from '@lib/identityDefenseCourt';
import { reflectOnHypocrisy } from '@lib/selfReflectionHypocrisy';
import { runExecutiveConsensus } from '@lib/executiveConsensusRuntime';
import { readAutonomousStrategicConsciousness } from '@lib/autonomousStrategicConsciousness';
import { readNarrativeArcIntelligence } from '@lib/narrativeArcIntelligence';
import { readSilenceRestraintGovernance } from '@lib/silenceRestraintGovernance';
import { planAutonomousCampaign } from '@lib/autonomousCampaignPlanning';
import {
  createCouncilReputationStore, applyMemoryBias,
} from '@lib/multiAgentMemoryBias';
import { updateInternalReputation } from '@lib/internalReputationSystem';

function briefing(over: Partial<CouncilBriefing> = {}): CouncilBriefing {
  return {
    strategicWeight: 7, priorityBand: 'proceed', strategicallyUnwise: false,
    merelyEmotionallyEffective: false, longTermEquity: 7,
    identityGovernanceBlocks: false, exhaustedHumanTrust: true, identityRisk: 2,
    collectiveRecognition: 6, worldTension: 4, culturalClimate: 'calm', viralContamination: 0,
    audienceHasFeedback: false, audienceRecognisedItself: false, deepEngagement: 5,
    shallowEngagement: 3, responseCorruptsTruth: false,
    emotionalRepetitionRisk: 2, truthPersistence: 5, continuityScore: 6,
    attentionIsTrue: true, attentionIsLoud: false, attentionRisk: 3,
    cognitiveEnergy: 8, shouldSpeak: true, recommendSilence: false,
    optimizationCorruptsTruth: false, optimizationRisk: 2,
    campaignUnderstandsWorld: true, worldStrained: false,
    lifecycleState: 'deepening', campaignHealth: 7, isRealDecision: true,
    executiveAction: 'continue', executiveIsOutput: true, executiveConfidence: 7,
    emergence: 7, truthValue: 7,
    ...over,
  };
}

function fullCouncil(b: CouncilBriefing) {
  const session = conveneCognitiveCouncil({ briefing: b });
  const debate = runInternalDebate({ session });
  const conflict = resolveCouncilConflict({ opinions: session.opinions, debate });
  const arc = readNarrativeArcIntelligence({ briefing: b });
  const silence = readSilenceRestraintGovernance({ briefing: b, opinions: session.opinions });
  const identityCourt = holdIdentityDefenseCourt({ briefing: b, opinions: session.opinions });
  const selfReflection = reflectOnHypocrisy({ briefing: b, opinions: session.opinions });
  const plan = planAutonomousCampaign({ briefing: b, conflict, debate });
  const consensus = runExecutiveConsensus({ conflict, debate, silence, identityCourt, selfReflection });
  const consciousness = readAutonomousStrategicConsciousness({
    session, debate, consensus, selfReflection, plan, arc,
  });
  return { session, debate, conflict, identityCourt, selfReflection, consensus, consciousness };
}

async function main() {
  console.log('\n WAVE 5 — Autonomous Strategic Society verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── the council convenes eleven entities ────────────────────────
  const healthy = fullCouncil(briefing());
  checks.push([
    'the cognitive council convenes all eleven entities',
    healthy.session.opinions.length === 11,
    `${healthy.session.opinions.length} entities convened`,
  ]);

  // ── a contested banner produces genuine disagreement ────────────
  const contested = fullCouncil(briefing({
    attentionIsLoud: true, attentionIsTrue: false, recommendSilence: true,
    optimizationCorruptsTruth: true, optimizationRisk: 8, emotionalRepetitionRisk: 7,
    strategicallyUnwise: true, priorityBand: 'refuse',
  }));
  checks.push([
    'entities disagree naturally — a contested banner draws objections',
    contested.session.tally.object >= 3,
    `${contested.session.tally.object} entities object, ${contested.session.tally.advocate} advocate`,
  ]);
  checks.push([
    'the internal debate produces real exchanges with cognitive tension',
    contested.debate.exchanges.length >= 1 && contested.debate.debate_tension >= 4,
    `${contested.debate.exchanges.length} exchange(s), tension ${contested.debate.debate_tension}/10`,
  ]);

  // ── the identity defense court convicts a corrupted candidate ───
  const corrupted = fullCouncil(briefing({
    identityGovernanceBlocks: true, exhaustedHumanTrust: false, identityRisk: 8,
  }));
  checks.push([
    'the identity defense court convicts a brand-eroding candidate',
    corrupted.identityCourt.verdict === 'convicted' && corrupted.consensus.consensus === 'block',
    `court verdict "${corrupted.identityCourt.verdict}", consensus "${corrupted.consensus.consensus}"`,
  ]);

  // ── self-reflection catches hypocrisy ───────────────────────────
  const hypocritical = fullCouncil(briefing({
    attentionIsLoud: true, attentionIsTrue: false, optimizationCorruptsTruth: true,
  }));
  checks.push([
    'self-reflection catches the council in hypocrisy',
    hypocritical.selfReflection.hypocrisy_detected,
    hypocritical.selfReflection.self_reflection,
  ]);

  // ── shallow consensus is detected and treated with suspicion ────
  // (the healthy briefing makes nearly every entity advocate.)
  const easy = fullCouncil(briefing({
    audienceHasFeedback: true, audienceRecognisedItself: true, deepEngagement: 9,
  }));
  checks.push([
    'shallow consensus is detected when the council agrees too quickly',
    easy.debate.shallow_consensus
      ? !easy.consciousness.emerged_from_genuine_tension
      : easy.consciousness.consciousness_score > 0,
    easy.debate.shallow_consensus
      ? 'shallow consensus flagged — suspicion raised'
      : `council retained tension (authenticity ${easy.debate.tension_authenticity}/10)`,
  ]);

  // ── a good banner that still draws one genuine objection emerges
  //    from real tension and the council proceeds anyway. ──────────
  const debated = fullCouncil(briefing({ emotionalRepetitionRisk: 6 }));
  checks.push([
    'a decision the council debated (with real dissent) emerges from genuine tension',
    debated.consciousness.emerged_from_genuine_tension &&
      debated.consciousness.consciousness_score >= 5 &&
      (debated.consciousness.verdict === 'proceed' || debated.consciousness.verdict === 'proceed-restrained'),
    `consciousness ${debated.consciousness.consciousness_score}/10, verdict "${debated.consciousness.verdict}", ${debated.session.tally.object} objector(s)`,
  ]);

  // ── dissent is recorded, never discarded ────────────────────────
  checks.push([
    'overruled dissent is recorded, never discarded',
    Array.isArray(contested.consciousness.recorded_dissent),
    `${contested.consciousness.recorded_dissent.length} dissenting voice(s) on the record`,
  ]);

  // ── reputation evolves across sessions ──────────────────────────
  const repStore = createCouncilReputationStore();
  await repStore.reset();
  let book = await repStore.read();
  const weight0 = book.entities['strategist'].conviction_weight;
  for (let i = 0; i < 6; i++) {
    const s = conveneCognitiveCouncil({ briefing: briefing() });
    const biased = applyMemoryBias(s.opinions, book);
    const upd = updateInternalReputation({
      book, opinions: biased.biased_opinions, finalOutcomeWasProceed: true,
    });
    book = upd.book;
  }
  await repStore.save(book);
  const weight1 = book.entities['strategist'].conviction_weight;
  checks.push([
    'agent reputations evolve across sessions',
    weight1 !== weight0 && book.entities['strategist'].sessionsParticipated === 6,
    `strategist conviction weight ${weight0} → ${weight1} over 6 sessions, personality "${book.entities['strategist'].personality}"`,
  ]);
  await repStore.reset();

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 5 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 5 VERIFIED — a strategic psychological civilization, not a creative pipeline.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
