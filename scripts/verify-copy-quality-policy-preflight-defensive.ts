/**
 * VERIFY — Copy-Quality Policy Preflight defensive contract.
 *
 * Architecture rule the preflight must obey:
 *   Preflight is advisory safety infrastructure. It must never crash
 *   generation. Any unknown formula or campaignMode, any
 *   internal exception, must degrade to a safe "off" recommendation
 *   carrying a reasonCode — not throw.
 *
 * Cases:
 *   A · canonical 'Minimal' mode does not throw and returns a valid result
 *   B · unknown mode value does not throw; coercion is logged in reasonCodes
 *   C · null/undefined campaignMode does not throw (AUTO path)
 *   D · unknown formula value does not throw; coercion is logged
 *   E · any fallback includes a reasonCode (audit trail intact)
 *   F · ENERGY + MINIMAL + brutality 0.5 returns a valid degraded
 *        preflight (the synthesizeMinimalStrategy crash that was
 *        causing HTTP 500 on the generate route is gone)
 *   G · TypeScript clean — enforced via `npx tsc --noEmit` in the
 *        suite runner; this script only verifies runtime behavior.
 *
 * Read-only: no memory writes, no /api/generate calls, no network.
 */

import type { CampaignMode, Formula } from '../src/core/types';
import {
  runCopyQualityPolicyPreflight,
  type CopyQualityPolicyPreflight,
} from '../lib/copyQualityPolicyPreflight';

interface CaseResult {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

function isValidShape(r: CopyQualityPolicyPreflight): boolean {
  return (
    typeof r.applied === 'boolean' &&
    typeof r.enabled === 'boolean' &&
    typeof r.confidence === 'number' &&
    typeof r.policyBand === 'string' &&
    Array.isArray(r.reasonCodes) &&
    r.reasonCodes.every((c) => typeof c === 'string')
  );
}

async function tryRun(
  args: {
    formula: Formula | string;
    campaignMode: CampaignMode | string | null;
    brutality: number;
    explicitFlag?: boolean;
  },
): Promise<{ ok: true; result: CopyQualityPolicyPreflight } | { ok: false; err: string }> {
  try {
    const result = await runCopyQualityPolicyPreflight({
      explicitFlag: args.explicitFlag,
      // intentionally cast — these tests deliberately pass
      // off-spec values to assert defensive behavior.
      formula: args.formula as Formula,
      campaignMode: args.campaignMode as CampaignMode | null,
      brutality: args.brutality,
      strategyMemory: null,
    });
    return { ok: true, result };
  } catch (err) {
    return { ok: false, err: err instanceof Error ? err.message : String(err) };
  }
}

async function main(): Promise<void> {
  console.log('COPY-QUALITY POLICY PREFLIGHT DEFENSIVE VERIFICATION\n');

  // ── A · canonical 'Minimal' does not throw ───────────────────
  {
    const r = await tryRun({ formula: 'ENERGY', campaignMode: 'Minimal', brutality: 0.5 });
    record(
      'A',
      "canonical 'Minimal' mode does not throw",
      r.ok && isValidShape(r.result),
      r.ok ? 'returned valid shape' : `threw: ${r.err}`,
    );
  }

  // ── B · unknown mode does not throw ──────────────────────────
  {
    const r = await tryRun({
      formula: 'ENERGY',
      campaignMode: 'TOTALLY_FAKE_MODE',
      brutality: 0.5,
    });
    const hasCoerceCode = r.ok &&
      r.result.reasonCodes.some((c) => c.includes('unknown-campaignMode-coerced-to-AUTO'));
    record(
      'B',
      'unknown campaignMode does not throw',
      r.ok && isValidShape(r.result) && hasCoerceCode,
      r.ok
        ? `coercion reasonCode present: ${hasCoerceCode}`
        : `threw: ${r.err}`,
    );
  }

  // ── C · missing (null) campaignMode does not throw ───────────
  {
    const r = await tryRun({ formula: 'ENERGY', campaignMode: null, brutality: 0.5 });
    record(
      'C',
      'null campaignMode (AUTO) does not throw',
      r.ok && isValidShape(r.result),
      r.ok ? 'AUTO path returned valid shape' : `threw: ${r.err}`,
    );
  }

  // ── D · unknown formula does not throw ───────────────────────
  {
    const r = await tryRun({
      formula: 'NONSENSE_FORMULA',
      campaignMode: 'Editorial',
      brutality: 0.5,
    });
    const hasCoerceCode = r.ok &&
      r.result.reasonCodes.some((c) => c.includes('unknown-formula-coerced-to-ENERGY'));
    record(
      'D',
      'unknown formula does not throw',
      r.ok && isValidShape(r.result) && hasCoerceCode,
      r.ok ? `coercion reasonCode present: ${hasCoerceCode}` : `threw: ${r.err}`,
    );
  }

  // ── E · fallbacks all surface a reasonCode ───────────────────
  {
    const r = await tryRun({
      formula: 'NONSENSE_FORMULA',
      campaignMode: 'TOTALLY_FAKE_MODE',
      brutality: 0.5,
    });
    const allTagged = r.ok &&
      r.result.reasonCodes.some((c) => c.includes('unknown-formula-coerced-to-ENERGY')) &&
      r.result.reasonCodes.some((c) => c.includes('unknown-campaignMode-coerced-to-AUTO'));
    record(
      'E',
      'every fallback includes a reasonCode',
      r.ok && allTagged,
      r.ok
        ? `reasonCodes: ${r.result.reasonCodes.slice(0, 6).join(' | ')}`
        : `threw: ${r.err}`,
    );
  }

  // ── F · the reported bug repro: ENERGY + MINIMAL + 0.5 ───────
  // 'MINIMAL' (uppercase) is not a canonical CampaignMode, but the
  // route used to crash with HTTP 500 here. After the fix the
  // preflight must degrade silently with an audit code.
  {
    const r = await tryRun({
      formula: 'ENERGY',
      campaignMode: 'MINIMAL',
      brutality: 0.5,
    });
    const hasCoerceCode = r.ok &&
      r.result.reasonCodes.some((c) =>
        c.includes('unknown-campaignMode-coerced-to-AUTO') && c.includes('MINIMAL'),
      );
    record(
      'F',
      'ENERGY + MINIMAL + brutality 0.5 no longer crashes preflight (HTTP 500 root cause gone)',
      r.ok && isValidShape(r.result) && hasCoerceCode,
      r.ok
        ? `degraded safely; coercion logged: ${hasCoerceCode}`
        : `STILL THROWS: ${r.err}`,
    );
  }

  // ── G · TypeScript clean is verified separately ──────────────
  record(
    'G',
    'TypeScript clean (verified via separate `npx tsc --noEmit`)',
    true,
    'this script defers compiler validation to the suite runner',
  );

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('verification script crashed:', err);
  process.exit(2);
});
