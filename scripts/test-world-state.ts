/**
 * scripts/test-world-state.ts — Phase 42 verification.
 *
 * Verifies the world-state engine: it models the psychological world,
 * persists correctly, survives a restart, and the headline gate
 * rejects a campaign that does not understand the world.
 */

import type { IngestedSignal } from '@lib/realityIngestion';
import {
  createWorldStateEngineStore, readWorldState, campaignUnderstandsWorld,
} from '@lib/worldStateEngine';

function signal(id: string, text: string): IngestedSignal {
  return {
    id, source: 'reddit', text, observed_at: Date.now() - Number(id) * 1000,
    emotional_weight: 8, topical_tags: [],
  };
}

async function main() {
  console.log('\n PHASE 42 — World-State Executive Brain verification\n');
  const checks: Array<[string, boolean, string]> = [];

  const store = createWorldStateEngineStore();
  await store.reset();

  // A strained world — exhaustion + anxiety + economic pressure.
  const strainedSignals: IngestedSignal[] = [
    signal('1', 'I am so exhausted I cannot do anything anymore'),
    signal('2', 'constant anxiety, I feel overwhelmed and on edge'),
    signal('3', 'rent is impossible, money stress every single day'),
    signal('4', 'burnt out and drained, no energy left'),
    signal('5', 'lonely and disconnected, nobody really there'),
    signal('6', 'doomscrolling all night, the feed never stops'),
    signal('7', 'I do not trust any of it anymore, everything feels fake'),
    signal('8', 'too tired, completely depleted'),
  ];

  const ws1 = readWorldState({ ingestedSignals: strainedSignals, trail: [], prior: null });
  await store.save(ws1);
  checks.push([
    'world-state models a strained psychological world',
    ws1.world_tension >= 5 && ws1.observationCount === 1,
    `world tension ${ws1.world_tension}/10, climate "${ws1.climate}", observation ${ws1.observationCount}`,
  ]);

  // ── persistence + restart: clear the in-memory cache, re-read. ──
  (globalThis as { __moodWorldPsychology?: unknown }).__moodWorldPsychology = undefined;
  const reloaded = await store.read();
  checks.push([
    'world-state persists and survives a restart',
    reloaded !== null && reloaded.observationCount === 1 && reloaded.world_tension === ws1.world_tension,
    reloaded ? `reloaded observation ${reloaded.observationCount}, tension ${reloaded.world_tension}/10` : 'reload failed',
  ]);

  // ── second observation evolves the state slowly. ──
  const ws2 = readWorldState({ ingestedSignals: strainedSignals, trail: [], prior: reloaded });
  await store.save(ws2);
  checks.push([
    'world-state advances the observation count across runs',
    ws2.observationCount === 2,
    `observation count: ${ws2.observationCount}`,
  ]);

  // ── headline gate: an intense banner into a strained world. ──
  const intoStrained = campaignUnderstandsWorld(ws2, 'intense');
  const intoSoft = campaignUnderstandsWorld(ws2, 'soft');
  checks.push([
    'headline gate: an intense banner does not understand a strained world',
    !intoStrained.campaign_understands_world && intoSoft.campaign_understands_world,
    `intense alignment ${intoStrained.world_alignment}/10, soft alignment ${intoSoft.world_alignment}/10`,
  ]);

  await store.reset();

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) { console.error('  PHASE 42 VERIFICATION FAILED.\n'); process.exit(1); }
  console.log('  PHASE 42 VERIFIED.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
