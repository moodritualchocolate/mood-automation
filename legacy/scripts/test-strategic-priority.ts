/**
 * scripts/test-strategic-priority.ts — Phase 36 verification.
 *
 * Verifies the strategic engine overrides engagement temptation:
 * a high-performing but identity-eroding candidate is refused, and
 * a true low-engagement candidate is prioritised.
 */

import { readStrategicPriority } from '@lib/strategicPriorityEngine';

function main() {
  console.log('\n PHASE 36 — Strategic Priority verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // A loud, high-engagement, identity-eroding candidate.
  const temptation = readStrategicPriority({
    truthValue: 3, resonance: 3, identityRisk: 8, saturationRisk: 5,
    optimizationRisk: 8, viralityRisk: 7, engagementPull: 9, engagementDepth: 2,
    emotionalNovelty: 3, outputPressure: 8, fatigue: 6, culturalImportance: 3,
  });
  checks.push([
    'strategic engine refuses a high-engagement but identity-eroding candidate',
    temptation.priority_band === 'refuse' || temptation.strategically_unwise,
    `band "${temptation.priority_band}", strategically_unwise=${temptation.strategically_unwise}, dominant="${temptation.dominant_importance}"`,
  ]);

  // A true, resonant, low-engagement candidate.
  const trueCandidate = readStrategicPriority({
    truthValue: 8, resonance: 8, identityRisk: 1, saturationRisk: 2,
    optimizationRisk: 1, viralityRisk: 1, engagementPull: 3, engagementDepth: 7,
    emotionalNovelty: 8, outputPressure: 3, fatigue: 2, culturalImportance: 7,
  });
  checks.push([
    'strategic engine prioritises a true, resonant, low-engagement candidate',
    trueCandidate.priority_band === 'deepen' || trueCandidate.priority_band === 'proceed',
    `band "${trueCandidate.priority_band}", strategic weight ${trueCandidate.strategic_weight}/10`,
  ]);

  checks.push([
    'strategic engine names a temptation as a temptation, not an importance',
    temptation.dominant_importance === 'algorithmically-tempting' || temptation.dominant_importance === 'identity-dangerous',
    `temptation dominant importance: "${temptation.dominant_importance}"`,
  ]);

  checks.push([
    'strategic engine detects false urgency (output pressure without novelty)',
    temptation.urgency_kind === 'false-urgency',
    `temptation urgency: "${temptation.urgency_kind}"`,
  ]);

  report('PHASE 36', checks);
}

function report(label: string, checks: Array<[string, boolean, string]>) {
  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) { console.error(`  ${label} VERIFICATION FAILED.\n`); process.exit(1); }
  console.log(`  ${label} VERIFIED.\n`);
}

main();
