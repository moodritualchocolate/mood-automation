/**
 * scripts/test-campaign-lifecycle.ts — Phase 40 verification.
 *
 * Verifies campaigns behave as living entities: an emerging campaign,
 * an overexposed one, and a recoverable one are each diagnosed
 * correctly — and the lifecycle is derived from the persisted trail
 * (so it survives a restart).
 */

import type { EmotionalTraceEntry } from '@lib/humanMemory';
import { readCampaignLifecycle } from '@lib/campaignLifecycle';
import { readReawakeningTriggers } from '@lib/reawakeningTriggers';

function trace(i: number, family: string, truth: string): EmotionalTraceEntry {
  return {
    bannerId: `b${i}`, createdAt: Date.now() - i * 86400000, stateId: `s-${family}`,
    family, truth, tension: 't', job: 'anti-ad', culturalMoment: null,
    reaction: { at_0_3s: 'recognition', at_1s: 'discomfort', at_3s: 'emotional tension' },
    engagement: 3, residue: 'r',
  };
}

function main() {
  console.log('\n PHASE 40 — Strategic Campaign Lifecycle verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // An emerging campaign — two banners.
  const emerging = readCampaignLifecycle({
    trail: [trace(0, 'fatigue', 'a'), trace(1, 'pressure', 'b')],
    recognitionDepth: 5, identityRisk: 1,
  });
  checks.push([
    'an emerging campaign is diagnosed "emerging"',
    emerging.lifecycle_state === 'emerging',
    `lifecycle state: "${emerging.lifecycle_state}", age ${emerging.emotional_age}`,
  ]);

  // An overexposed campaign — 14 banners, all the same family + truth.
  const overexposedTrail: EmotionalTraceEntry[] = [];
  for (let i = 0; i < 14; i++) overexposedTrail.push(trace(i, 'fatigue', 'the same exhausted truth repeated'));
  const overexposed = readCampaignLifecycle({
    trail: overexposedTrail, recognitionDepth: 3, identityRisk: 2,
  });
  checks.push([
    'an over-run campaign is diagnosed overexposed / drained',
    overexposed.lifecycle_state === 'overexposed' || overexposed.lifecycle_state === 'emotionally-drained',
    `lifecycle state: "${overexposed.lifecycle_state}", truth decay ${overexposed.truth_decay}/10, health ${overexposed.campaign_health}/10`,
  ]);

  checks.push([
    'campaign health degrades for an exhausted campaign',
    overexposed.campaign_health < emerging.campaign_health,
    `overexposed health ${overexposed.campaign_health}/10 < emerging health ${emerging.campaign_health}/10`,
  ]);

  // A campaign with a dormant truth available to reawaken.
  const dormantTrail: EmotionalTraceEntry[] = [];
  for (let i = 0; i < 6; i++) dormantTrail.push(trace(i, 'overstimulation', 'recent territory'));
  for (let i = 6; i < 12; i++) dormantTrail.push(trace(i, 'numbness', 'an older dormant territory'));
  const reawakening = readReawakeningTriggers({ trail: dormantTrail });
  checks.push([
    'reawakening triggers identify a dormant truth to revive',
    reawakening.reawaken_candidate !== null && reawakening.reawakening_probability > 0,
    reawakening.reawaken_candidate
      ? `dormant "${reawakening.reawaken_candidate.family}" — reawakening probability ${reawakening.reawakening_probability}/10`
      : 'no dormant truth found',
  ]);

  // The lifecycle is derived from the persisted trail — re-running on
  // the same trail yields the same emotional age (survives restart).
  const recomputed = readCampaignLifecycle({
    trail: overexposedTrail, recognitionDepth: 3, identityRisk: 2,
  });
  checks.push([
    'the lifecycle is derived from the persisted trail (survives restart)',
    recomputed.emotional_age === overexposed.emotional_age &&
      recomputed.lifecycle_state === overexposed.lifecycle_state,
    `recomputed age ${recomputed.emotional_age}, state "${recomputed.lifecycle_state}" — stable across recompute`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) { console.error('  PHASE 40 VERIFICATION FAILED.\n'); process.exit(1); }
  console.log('  PHASE 40 VERIFIED.\n');
}

main();
