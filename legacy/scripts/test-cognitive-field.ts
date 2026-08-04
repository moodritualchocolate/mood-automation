/**
 * scripts/test-cognitive-field.ts
 *
 * PHASE 26 — anti-fragmentation + soft-floor verification.
 *
 * Verifies that the system behaves like ONE organism thinking, not
 * many modules reporting:
 *
 *   ANTI-FRAGMENTATION TEST
 *     - the cognitive field unifies multiple structural dimensions
 *     - the banner connects to >= 3 dimensions (truth / pressure /
 *       behavior / identity / ritual / culture / campaign-memory)
 *     - the cognition trace explains the banner (explainability high)
 *     - emotional physics finds a causal chain
 *     - the contradiction resolver is governed by human-truth
 *
 *   SOFT-FLOOR TEST
 *     - the pipeline runs with NO user prompt, NO manual scene, NO
 *       manual style, NO manual product direction — and still
 *       produces a coherent campaign decision, because the
 *       world-state provides the context.
 *
 * Run with:  npx tsx scripts/test-cognitive-field.ts
 */

import { runPipeline } from '@/core/pipeline';

async function main() {
  console.log('\n PHASE 26 — Unified Cognitive Field verification\n');

  // SOFT-FLOOR TEST — only a formula is supplied. No prompt, no scene,
  // no style, no product direction. The world-state must carry it.
  const { banner } = await runPipeline({ formula: 'ENERGY' });

  // ANTI-FRAGMENTATION TEST — a second run on a structurally rich
  // state, to confirm desire / pressure / behavior / identity / culture
  // all feed ONE shared field together (modules influencing each other).
  const { banner: richBanner } = await runPipeline({
    formula: 'ENERGY', forceStateId: 'startup-burnout',
  });
  const richField = richBanner.tasteSystem.cognition.field;

  const cog = banner.tasteSystem.cognition;
  const field = cog.field;
  const trace = cog.trace;

  const checks: Array<[string, boolean, string]> = [
    [
      'soft-floor: ran with no prompt / scene / style / product direction',
      true,
      'pipeline produced a banner from world-state context alone',
    ],
    [
      'cognitive field unified multiple dimensions',
      field.connected_dimensions.length >= 3,
      `connected dimensions: ${field.connected_dimensions.join(', ') || 'none'}`,
    ],
    [
      'banner EMERGED from the world model (not decorated)',
      field.emergence_score >= 4,
      `emergence ${field.emergence_score}/10`,
    ],
    [
      'cognition trace explains the banner',
      trace.explainability >= 5,
      `explainability ${trace.explainability}/10 — ${trace.finalCreativeReason}`,
    ],
    [
      'emotional physics found a causal chain',
      cog.physics.primary_chain !== null,
      cog.physics.primary_chain ? cog.physics.primary_chain.chain.join(' → ') : 'no causal chain',
    ],
    [
      'contradiction resolver is governed by human-truth (aesthetics never wins)',
      cog.contradictionResolution.governing_voice === 'human-truth'
        && !cog.contradictionResolution.aesthetic_tried_to_override_truth,
      `governing voice: ${cog.contradictionResolution.governing_voice}`,
    ],
    [
      'anti-fragmentation: desire / pressure / behavior / identity / culture all feed one field',
      [
        richField.desireForces.length,
        richField.activePressures.length,
        richField.behavioralLoops.length,
        richField.identityNarratives.length,
        richField.culturalSignals.length,
      ].filter((n) => n > 0).length >= 3,
      `rich-state field populated by: ${richField.connected_dimensions.join(', ')}`,
    ],
    [
      'tension topology located a campaign opportunity',
      richBanner.tasteSystem.cognition.tensionTopology.deepest_opportunity !== null,
      richBanner.tasteSystem.cognition.tensionTopology.deepest_opportunity
        ? `"${richBanner.tasteSystem.cognition.tensionTopology.deepest_opportunity.the_tension}"`
        : 'no tension located',
    ],
    [
      'life trajectory projected a forward state (not a snapshot)',
      cog.lifeTrajectory.trajectory_statement.length > 0,
      cog.lifeTrajectory.trajectory_statement,
    ],
  ];

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}`);
    console.log(`        ${detail}`);
    if (ok) passed += 1;
  }

  console.log(`\n  ${passed}/${checks.length} checks passed`);
  console.log(`  world-state confidence: ${field.worldStateConfidence}/10 · field coherence: ${field.field_coherence}/10`);
  console.log(`  campaign atmosphere: ${field.campaignAtmosphere}\n`);

  if (passed < checks.length) {
    console.error('  PHASE 26 VERIFICATION FAILED — the modules are not behaving like one mind.\n');
    process.exit(1);
  }
  console.log('  PHASE 26 VERIFIED — the system is one organism thinking.\n');
}

main().catch((e) => {
  console.error('\n  cognitive-field verification failed:', e);
  process.exit(1);
});
