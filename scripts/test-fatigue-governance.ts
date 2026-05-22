/**
 * scripts/test-fatigue-governance.ts — Phase 37 verification.
 *
 * Verifies the cognitive energy model blocks over-posting: a system
 * that has posted heavily with low novelty is told to be silent, and
 * a banner that depletes more attention than it returns is flagged.
 */

import type { EmotionalTraceEntry } from '@lib/humanMemory';
import { readCognitiveEnergy } from '@lib/cognitiveEnergyModel';
import { readAttentionDepletion } from '@lib/attentionDepletionEngine';

function trace(i: number, family: string, truth: string): EmotionalTraceEntry {
  return {
    bannerId: `b${i}`, createdAt: Date.now() - i * 3600000, stateId: `s-${family}`,
    family, truth, tension: 't', job: 'anti-ad', culturalMoment: null,
    reaction: { at_0_3s: 'recognition', at_1s: 'discomfort', at_3s: 'emotional tension' },
    engagement: 3, residue: 'r',
  };
}

function main() {
  console.log('\n PHASE 37 — Cognitive Energy / Fatigue Governance verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // An over-posted campaign: 11 banners in the last days, all the same truth.
  const overposted: EmotionalTraceEntry[] = [];
  for (let i = 0; i < 11; i++) overposted.push(trace(i, 'fatigue', 'the same tired truth again'));
  const fatigued = readCognitiveEnergy({
    trail: overposted, engagements: [], emotionalNovelty: 3,
    hookStrength: 5, loudness: 4, aftertaste: 5, recognition: 4,
  });
  checks.push([
    'fatigue governance recommends silence when fatigue is high and novelty is low',
    fatigued.recommend_silence && !fatigued.should_speak,
    `recommend_silence=${fatigued.recommend_silence}, should_speak=${fatigued.should_speak} — "${fatigued.reason}"`,
  ]);

  // A rested campaign with something novel to say.
  const rested = readCognitiveEnergy({
    trail: [trace(0, 'fatigue', 'a fresh observation')], engagements: [], emotionalNovelty: 8,
    hookStrength: 6, loudness: 3, aftertaste: 7, recognition: 7,
  });
  checks.push([
    'fatigue governance permits speaking when energy is high and there is novelty',
    rested.should_speak,
    `should_speak=${rested.should_speak}, energy ${rested.cognitive_energy}/10`,
  ]);

  // A banner that extracts more attention than it returns.
  const depleting = readAttentionDepletion({ hookStrength: 9, loudness: 9, aftertaste: 2, recognition: 2 });
  checks.push([
    'attention depletion flags a banner that takes more than it gives',
    depleting.extraction_exceeds_value,
    `extracted ${depleting.attention_extracted}/10 vs returned ${depleting.emotional_value_returned}/10`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) { console.error('  PHASE 37 VERIFICATION FAILED.\n'); process.exit(1); }
  console.log('  PHASE 37 VERIFIED.\n');
}

main();
