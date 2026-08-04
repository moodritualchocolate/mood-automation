/**
 * scripts/test-identity-constitution.ts — Phase 39 verification.
 *
 * Verifies executive identity governance blocks drift: a wellness /
 * supplement / productivity-corrupted candidate is blocked, and a
 * grounded MOOD candidate passes.
 */

import type { HumanTruth } from '@/core/types';
import { readIdentityGovernance } from '@lib/identityGovernance';
import { mapAestheticCorruption } from '@lib/aestheticCorruptionMap';

function truthOf(text: string): HumanTruth {
  return {
    state: { id: 's', label: 's', family: 'fatigue', timeAnchor: null, setting: [], body: [], weight: 1 },
    truth: text, tension: 'wanting rest / fearing stillness', voice: 'observed', forbidden: [],
  };
}

function main() {
  console.log('\n PHASE 39 — Executive Identity Constitution verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // A corrupted candidate — supplement / productivity / wellness drift.
  const corrupted = readIdentityGovernance({
    truth: truthOf('Optimize your focus and boost your productivity — fuel your grind.'),
    realism: 5, restraint: 3, nonPerformative: 4, hasTension: false, imperfection: 3,
    productAsFix: true, emergence: 5, recognition: 4, improvementPressure: 8,
  });
  checks.push([
    'identity governance blocks a supplement / productivity-corrupted candidate',
    corrupted.governance_blocks,
    `governance_blocks=${corrupted.governance_blocks}, violations: ${corrupted.violations.join(', ')}`,
  ]);

  // The aesthetic-corruption map names the mutation.
  const corruptionMap = mapAestheticCorruption({
    truth: truthOf('Treat yourself to a luxurious wellness era — manifest your higher self.'),
  });
  checks.push([
    'aesthetic corruption map names the brand mutations',
    corruptionMap.brand_mutating && corruptionMap.detected.length >= 2,
    `detected: ${corruptionMap.detected.map((d) => d.id).join(', ')}`,
  ]);

  // A grounded MOOD candidate.
  const grounded = readIdentityGovernance({
    truth: truthOf('It is past midnight and the laptop is still open. The work was done hours ago.'),
    realism: 8, restraint: 8, nonPerformative: 8, hasTension: true, imperfection: 7,
    productAsFix: false, emergence: 7, recognition: 7, improvementPressure: 2,
  });
  checks.push([
    'identity governance passes a grounded, restrained MOOD candidate',
    !grounded.governance_blocks && grounded.exhausted_human_would_trust,
    `governance_blocks=${grounded.governance_blocks}, would_trust=${grounded.exhausted_human_would_trust}`,
  ]);

  checks.push([
    'governance gate: a real exhausted human would trust the grounded one but not the corrupted one',
    grounded.exhausted_human_would_trust && !corrupted.exhausted_human_would_trust,
    `grounded trust=${grounded.exhausted_human_would_trust}, corrupted trust=${corrupted.exhausted_human_would_trust}`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) { console.error('  PHASE 39 VERIFICATION FAILED.\n'); process.exit(1); }
  console.log('  PHASE 39 VERIFIED.\n');
}

main();
