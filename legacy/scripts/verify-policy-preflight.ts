/**
 * scripts/verify-policy-preflight.ts
 *
 * Deterministic verification for the route-side Copy-Quality Policy
 * Preflight. Drives the helper across the full precedence matrix
 * (checks A–D, F–H). Pipeline-internal threshold behavior (check E)
 * is verified separately by scripts/verify-copy-quality-refusal.ts.
 *
 * Run: npx tsx scripts/verify-policy-preflight.ts
 */

import { runCopyQualityPolicyPreflight } from '@lib/copyQualityPolicyPreflight';
import { createInitialAdStrategyMemory } from '@lib/adStrategyMemory';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('COPY-QUALITY POLICY PREFLIGHT — VERIFICATION\n');

async function main() {
// Pre-fabricate a strategy memory that elicits a STRICT recommendation:
// high trustDebt + low brandDignity.
const strictMemory = (() => {
  const m = createInitialAdStrategyMemory();
  m.trustDebt = 8;
  m.brandDignityScore = 3;
  return m;
})();

// And one that elicits OFF: clean slate.
const cleanMemory = createInitialAdStrategyMemory();

// A: omitted flag + policy strict → route sets enabled true
{
  const p = await runCopyQualityPolicyPreflight({
    explicitFlag: undefined,
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    brutality: 0.9,
    strategyMemory: strictMemory,
  });
  check('A · omitted + policy STRICT → enabled=true',
    p.applied && p.source === 'policy-default' && p.enabled === true && (p.policyBand === 'strict' || p.policyBand === 'warn'),
    `applied=${p.applied} source=${p.source} enabled=${p.enabled} band=${p.policyBand} confidence=${p.confidence}`);
}

// B: omitted flag + policy off → route sets enabled false
{
  const p = await runCopyQualityPolicyPreflight({
    explicitFlag: undefined,
    formula: 'ENERGY',
    campaignMode: 'Emotional',
    brutality: 0.5,
    strategyMemory: cleanMemory,
  });
  check('B · omitted + policy OFF → enabled=false',
    p.applied && p.source === 'policy-default' && p.enabled === false && (p.policyBand === 'off' || p.policyBand === 'observe'),
    `applied=${p.applied} source=${p.source} enabled=${p.enabled} band=${p.policyBand}`);
}

// C: explicit false + policy strict → remains false
{
  const p = await runCopyQualityPolicyPreflight({
    explicitFlag: false,
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    brutality: 0.9,
    strategyMemory: strictMemory,
  });
  check('C · explicit FALSE + policy strict → remains false',
    !p.applied && p.source === 'explicit-false' && p.enabled === false,
    `applied=${p.applied} source=${p.source} enabled=${p.enabled} band=${p.policyBand}`);
}

// D: explicit true + policy off → remains true
{
  const p = await runCopyQualityPolicyPreflight({
    explicitFlag: true,
    formula: 'ENERGY',
    campaignMode: 'Emotional',
    brutality: 0.5,
    strategyMemory: cleanMemory,
  });
  check('D · explicit TRUE + policy off → remains true',
    !p.applied && p.source === 'explicit-true' && p.enabled === true,
    `applied=${p.applied} source=${p.source} enabled=${p.enabled} band=${p.policyBand}`);
}

// F: baseline (omitted + no memory) → enabled=false (degrades to lenient)
{
  const p = await runCopyQualityPolicyPreflight({
    explicitFlag: undefined,
    formula: 'ENERGY',
    campaignMode: null,
    brutality: 0.65,
    strategyMemory: null,
  });
  check('F · baseline omitted + no memory → safe lenient default',
    p.applied && p.source === 'policy-default' && p.enabled === false,
    `enabled=${p.enabled} band=${p.policyBand}`);
}

// G: deterministic — same inputs produce same output
{
  const inputs = {
    explicitFlag: undefined,
    formula: 'ENERGY' as const,
    campaignMode: 'Documentary' as const,
    brutality: 0.9,
    strategyMemory: strictMemory,
  };
  const p1 = await runCopyQualityPolicyPreflight(inputs);
  const p2 = await runCopyQualityPolicyPreflight(inputs);
  check('G · same inputs → same preflight',
    JSON.stringify(p1) === JSON.stringify(p2),
    `band=${p1.policyBand} confidence=${p1.confidence} reasonCodes×${p1.reasonCodes.length}`);
}

// H: brutality below 0.8 + omitted → policy never returns strict band
{
  const p = await runCopyQualityPolicyPreflight({
    explicitFlag: undefined,
    formula: 'ENERGY',
    campaignMode: 'Documentary',
    brutality: 0.7,            // below the strict cap
    strategyMemory: strictMemory,
  });
  check('H · brutality<0.8 + omitted → band cannot be strict',
    p.applied && p.policyBand !== 'strict',
    `band=${p.policyBand} (strict cap to warn/observe enforced)`);
}

// Extra: explicit-true confidence is 10 (helper short-circuits, no engine call)
{
  const p = await runCopyQualityPolicyPreflight({
    explicitFlag: true,
    formula: 'ENERGY', campaignMode: 'Emotional', brutality: 0.5,
    strategyMemory: cleanMemory,
  });
  check('Extra · explicit-true short-circuit (no engine call)',
    p.reasonCodes.length === 1 && p.reasonCodes[0].includes('preflight skipped'),
    `reasonCodes=[${p.reasonCodes.join(', ')}]`);
}

console.log(`\n${passed} passed · ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
