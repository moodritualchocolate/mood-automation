/**
 * scripts/test-executive-runtime.ts — Phase 41 verification.
 *
 * Verifies the executive runtime decides like a strategic creative
 * director: it produces a real decision with full reasoning, and
 * timing / strategy / identity each genuinely change the decision.
 */

import type { HumanTruth } from '@/core/types';
import { readStrategicPriority } from '@lib/strategicPriorityEngine';
import { readCognitiveEnergy } from '@lib/cognitiveEnergyModel';
import { readTemporalPsychology } from '@lib/temporalPsychology';
import { readIdentityGovernance } from '@lib/identityGovernance';
import { readCampaignLifecycle } from '@lib/campaignLifecycle';
import { readWorldState, campaignUnderstandsWorld } from '@lib/worldStateEngine';
import { runExecutiveRuntime } from '@lib/executiveRuntime';

function truthOf(text: string): HumanTruth {
  return {
    state: { id: 's', label: 's', family: 'fatigue', timeAnchor: null, setting: [], body: [], weight: 1 },
    truth: text, tension: 'wanting rest / fearing stillness', voice: 'observed', forbidden: [],
  };
}

const HEALTHY_TRUTH = truthOf('It is past midnight and the laptop is still open.');
const worldState = readWorldState({ ingestedSignals: [], trail: [], prior: null });

// A strained world — used to prove the world / timing engine changes
// the executive decision.
const STRAINED_SIGNALS = Array.from({ length: 8 }, (_, i) => ({
  id: String(i), source: 'reddit' as const,
  text: 'exhausted, anxious, overwhelmed, burnt out, drained, on edge, too tired',
  observed_at: Date.now() - i * 1000, emotional_weight: 9, topical_tags: [],
}));
const strainedWorld = readWorldState({ ingestedSignals: STRAINED_SIGNALS, trail: [], prior: null });

function decideScenario(opts: {
  identityCorrupted?: boolean;
  timingNow?: number;        // epoch ms to force an hour
  candidateRegister?: 'soft' | 'intense' | 'neutral';
  strained?: boolean;
}) {
  const register = opts.candidateRegister ?? 'soft';
  const world = opts.strained ? strainedWorld : worldState;
  const strategicPriority = readStrategicPriority({
    truthValue: 8, resonance: 7, identityRisk: opts.identityCorrupted ? 8 : 1,
    saturationRisk: 2, optimizationRisk: 1, viralityRisk: 1, engagementPull: 4,
    engagementDepth: 7, emotionalNovelty: 8, outputPressure: 3, fatigue: 2, culturalImportance: 7,
  });
  const cognitiveEnergy = readCognitiveEnergy({
    trail: [], engagements: [], emotionalNovelty: 8,
    hookStrength: 6, loudness: 3, aftertaste: 7, recognition: 7,
  });
  const temporal = readTemporalPsychology({
    now: opts.timingNow, candidateRegister: register,
    collectiveTension: world.world_tension, collectiveExhaustion: world.collective_exhaustion,
  });
  const identityGovernance = readIdentityGovernance({
    truth: opts.identityCorrupted
      ? truthOf('Optimize your grind and boost your productivity — manifest your best self.')
      : HEALTHY_TRUTH,
    realism: opts.identityCorrupted ? 4 : 8,
    restraint: opts.identityCorrupted ? 3 : 8,
    nonPerformative: opts.identityCorrupted ? 3 : 8,
    hasTension: !opts.identityCorrupted,
    imperfection: opts.identityCorrupted ? 3 : 7,
    productAsFix: !!opts.identityCorrupted,
    emergence: opts.identityCorrupted ? 4 : 7,
    recognition: 7,
    improvementPressure: opts.identityCorrupted ? 8 : 2,
  });
  const lifecycle = readCampaignLifecycle({ trail: [], recognitionDepth: 6, identityRisk: identityGovernance.violationSeverity });
  const worldUnderstanding = campaignUnderstandsWorld(world, register);
  return runExecutiveRuntime({
    strategicPriority, cognitiveEnergy, temporal, identityGovernance, lifecycle, worldState: world, worldUnderstanding,
  });
}

function main() {
  console.log('\n PHASE 41 — Executive Decision Runtime verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── a healthy candidate at a good hour (afternoon dip) ──────────
  const afternoon = new Date(); afternoon.setHours(14, 0, 0, 0);
  const healthy = decideScenario({ timingNow: afternoon.getTime() });
  checks.push([
    'the executive runtime produces a real decision with full reasoning',
    healthy.reasoning.executive_memo.length > 0 &&
      Object.values(healthy.reasoning.why).every((v) => typeof v === 'string' && v.length > 0),
    `decision "${healthy.action}" — every WHY dimension is explained`,
  ]);
  checks.push([
    'a healthy candidate at a good moment is permitted to ship',
    healthy.is_an_output,
    `decision "${healthy.action}" (is_an_output=${healthy.is_an_output})`,
  ]);

  // ── identity governance overrides toward archive ────────────────
  const corrupted = decideScenario({ identityCorrupted: true, timingNow: afternoon.getTime() });
  checks.push([
    'identity governance overrides the decision toward archive',
    corrupted.action === 'archive' && !corrupted.is_an_output,
    `decision "${corrupted.action}", governing voice "${corrupted.governing_voice}"`,
  ]);

  // ── timing / world genuinely change the decision: an intense
  //    banner in a strained world is delayed, not shipped. ─────────
  const intenseCalm = decideScenario({ candidateRegister: 'intense', timingNow: afternoon.getTime() });
  const intenseStrained = decideScenario({ candidateRegister: 'intense', timingNow: afternoon.getTime(), strained: true });
  checks.push([
    'timing / world genuinely change the decision (an intense banner in a strained world is delayed)',
    intenseStrained.action !== intenseCalm.action &&
      (intenseStrained.action === 'delay' || !intenseStrained.is_an_output),
    `calm world → "${intenseCalm.action}", strained world → "${intenseStrained.action}"`,
  ]);

  // ── the decision is self-governed ───────────────────────────────
  checks.push([
    'a healthy decision passes the self-governance loop',
    healthy.decision_is_governed && healthy.self_governed,
    `governance score ${healthy.governance_score}/10`,
  ]);

  // ── strategy is governed by the executive hierarchy ─────────────
  checks.push([
    'the decision names its governing voice from the executive hierarchy',
    typeof healthy.governing_voice === 'string' && healthy.governing_voice.length > 0,
    `governing voice: "${healthy.governing_voice}"`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) { console.error('  PHASE 41 VERIFICATION FAILED.\n'); process.exit(1); }
  console.log('  PHASE 41 VERIFIED — the system governs its own behavior.\n');
}

main();
