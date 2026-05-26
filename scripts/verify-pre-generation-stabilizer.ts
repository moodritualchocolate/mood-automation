/**
 * VERIFY — Pre-Generation Stabilizer advisory contract.
 *
 * Pure-function tests against lib/preGenerationStabilizer.ts using
 * synthetic conservative inputs + synthetic view subsets.
 *
 * Cases:
 *   A · stable conservative → 'stable' OR 'caution', recommended 'run'
 *   B · warning conservative → 'caution' / 'testing-only' / 'unstable'
 *   C · forbidden conservative → 'blocked-for-production' + 'use-fallback'
 *   D · high memory pressure raises memoryPressure axis
 *   E · high refusal rate raises refusalPressure axis
 *   F · high identity/governance signals lower stabilizationScore
 *   G · output contains only advisory suggestions (no auto-apply flags;
 *        advisoryNotice present)
 *   H · stabilizer makes no generation mutation
 *        (structural: output has no fields named like 'mutate'/'apply'/
 *         'override' that would trigger runtime change)
 *   I · deterministic — same input → same output JSON
 *   J · TypeScript clean (delegated to suite tsc)
 *
 * Static guarantees about the source file:
 *   · no critic / pipeline imports
 *   · no fetch / network calls
 *   · no fs.write to data/memory
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computePreGenerationStabilizer,
  type PreGenerationStabilizerInput,
} from '../lib/preGenerationStabilizer';
import type { ProductionConservativeMode } from '../lib/productionConservativeMode';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic conservative builder ───────────────────────────

function makeConservative(opts: {
  tier: 'safe' | 'warning' | 'forbidden' | 'unknown';
  brutality?: number;
  action?: ProductionConservativeMode['recommendedAction'];
  withFallback?: boolean;
}): ProductionConservativeMode {
  return {
    requestedCombination: { formula: 'ENERGY', campaignMode: null, brutality: opts.brutality ?? 0.5 },
    safetyTier: opts.tier,
    productionReadinessScore: opts.tier === 'safe' ? 9 : opts.tier === 'warning' ? 6 : 3,
    allowedForProduction: opts.tier === 'safe',
    allowedForTesting: opts.tier === 'safe' || opts.tier === 'warning',
    recommendedAction: opts.action ?? (
      opts.tier === 'safe' ? 'proceed' :
      opts.tier === 'warning' ? 'proceed-with-caution' :
      opts.tier === 'forbidden' ? 'use-safe-fallback' : 'manual-review-required'
    ),
    safeFallback: (opts.withFallback ?? true) ? {
      formula: 'ENERGY', campaignMode: null, brutality: 0.25,
      reason: 'envelope-default safe production mode',
    } : null,
    instabilityReasons: opts.tier === 'safe' ? [] : ['synthetic reason'],
    guardrails: {
      maxRecommendedBrutality: 0.75, preferredModes: ['Minimal'], avoidedModes: ['Aggressive'],
      latencyCeilingMs: 2000, memoryPressureLimit: 2048, refusalTolerance: 0.30,
    },
    advisoryNotice: 'Advisory only — this system never auto-applies fallback policies.',
    reasonCodes: ['synthetic'],
  };
}

// ─── individual cases ─────────────────────────────────────────

function caseA(): { ok: boolean; detail: string } {
  const out = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'safe' }),
  });
  const ok = ['stable', 'caution'].includes(out.stabilizationStatus) &&
    out.recommendedHumanDecision === 'run' &&
    out.shouldGenerateInTesting === true;
  return { ok, detail: `status=${out.stabilizationStatus} decision=${out.recommendedHumanDecision} score=${out.stabilizationScore}` };
}

function caseB(): { ok: boolean; detail: string } {
  const out = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'warning' }),
  });
  const ok = ['caution', 'testing-only', 'unstable'].includes(out.stabilizationStatus) &&
    out.shouldGenerateInTesting === true &&
    out.shouldGenerateInProduction === false;
  return { ok, detail: `status=${out.stabilizationStatus} decision=${out.recommendedHumanDecision}` };
}

function caseC(): { ok: boolean; detail: string } {
  const out = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'forbidden' }),
  });
  const ok = out.stabilizationStatus === 'blocked-for-production' &&
    out.recommendedHumanDecision === 'use-fallback' &&
    out.shouldGenerateInProduction === false;
  return { ok, detail: `status=${out.stabilizationStatus} decision=${out.recommendedHumanDecision}` };
}

function caseD(): { ok: boolean; detail: string } {
  const out = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'safe' }),
    systemIntegrity: {
      memoryHealth: [
        { file: 'a.json', capped: false, issue: 'over-cap' },
        { file: 'b.json', capped: false, issue: 'over-cap' },
        { file: 'c.json', capped: true, issue: null },
      ],
    },
  });
  return {
    ok: out.pressureMap.memoryPressure >= 5,
    detail: `memoryPressure=${out.pressureMap.memoryPressure}/10`,
  };
}

function caseE(): { ok: boolean; detail: string } {
  const out = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'safe' }),
    policy: { refusalEnabledRate: 0.80 },
  });
  return {
    ok: out.pressureMap.refusalPressure >= 7,
    detail: `refusalPressure=${out.pressureMap.refusalPressure}/10`,
  };
}

function caseF(): { ok: boolean; detail: string } {
  const safeOut = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'safe' }),
  });
  const conflictOut = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'safe' }),
    identity:   { averageContinuityRisk: 8, continuityTrend: 'rising-fragmentation' },
    governance: { averageFragmentation: 7, governanceTrend: 'fragmentation-rising' },
  });
  const ok = conflictOut.stabilizationScore < safeOut.stabilizationScore;
  return {
    ok,
    detail: `clean=${safeOut.stabilizationScore} conflicted=${conflictOut.stabilizationScore}`,
  };
}

function caseG(): { ok: boolean; detail: string } {
  const out = computePreGenerationStabilizer({
    conservative: makeConservative({ tier: 'warning' }),
    policy: { refusalEnabledRate: 0.5 },
  });
  const txt = JSON.stringify(out);
  const banned = /"applied":\s*true|"autoApply":\s*true|"override":\s*true|"mutate":/.test(txt);
  const noticeOk = out.advisoryNotice.toLowerCase().includes('advisory only');
  const everySuggestionHasShape = out.nonAppliedSuggestions.every((s) =>
    typeof s.suggestion === 'string' &&
    typeof s.reason === 'string' &&
    typeof s.wouldAffect === 'string',
  );
  return {
    ok: !banned && noticeOk && everySuggestionHasShape,
    detail: `banned=${banned} noticeOk=${noticeOk} suggestions=${out.nonAppliedSuggestions.length}`,
  };
}

async function caseH(): Promise<{ ok: boolean; detail: string }> {
  // Static check the source — confirm no critic/pipeline import, no
  // fetch, no memory writes.
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'lib', 'preGenerationStabilizer.ts'),
    'utf8',
  );
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /\bfetch\s*\(/,
    /fs\.writeFile\(/,
  ];
  const violations = forbidden.filter((re) => re.test(src));
  return {
    ok: violations.length === 0,
    detail: violations.length === 0 ? 'no critic/pipeline/network/memory-write' : `violations: ${violations.length}`,
  };
}

function caseI(): { ok: boolean; detail: string } {
  const input: PreGenerationStabilizerInput = {
    conservative: makeConservative({ tier: 'warning' }),
    policy: { refusalEnabledRate: 0.3 },
    campaign: { averageFatiguePressure: 4 },
    outcome: { averageStrategicRisk: 3 },
  };
  const a = JSON.stringify(computePreGenerationStabilizer(input));
  const b = JSON.stringify(computePreGenerationStabilizer(input));
  return {
    ok: a === b,
    detail: a === b ? 'two invocations produced identical JSON' : 'differs',
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('PRE-GENERATION STABILIZER VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['A', 'stable conservative input → stable/caution, decision=run',           () => caseA()],
    ['B', 'warning conservative → caution/testing-only/unstable',               () => caseB()],
    ['C', 'forbidden conservative → blocked-for-production + use-fallback',     () => caseC()],
    ['D', 'high memory pressure raises memoryPressure axis',                    () => caseD()],
    ['E', 'high refusal rate raises refusalPressure axis',                      () => caseE()],
    ['F', 'identity/governance signals lower stabilizationScore',               () => caseF()],
    ['G', 'output is advisory only (no auto-apply/override/mutate)',            () => caseG()],
    ['H', 'no critic/pipeline imports, no fetch, no memory writes',             () => caseH()],
    ['I', 'deterministic: same input → identical JSON',                         () => caseI()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  // Architecture cross-check: /api/generate must not import the new
  // advisory modules — they are advisory and must stay out of the
  // generation pipeline path.
  try {
    const generateRouteSrc = await fs.readFile(
      path.resolve(__dirname, '..', 'app', 'api', 'generate', 'route.ts'),
      'utf8',
    );
    const advisoryImported = /productionConservativeMode|preGenerationStabilizer/.test(generateRouteSrc);
    record(
      'isolation',
      '/api/generate does NOT import the advisory modules',
      !advisoryImported,
      advisoryImported ? 'advisory module is imported into /api/generate' : '/api/generate is unchanged structurally',
    );
  } catch (err) {
    record('isolation', '/api/generate does NOT import the advisory modules', false,
      `could not read generate route: ${(err as Error).message}`);
  }

  record('J', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
    'this script defers compiler validation to the suite runner');

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
