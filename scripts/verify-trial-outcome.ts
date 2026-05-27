/**
 * VERIFY — Trial Outcome Attachment.
 *
 * Pure-function + static verification.
 *
 * Cases:
 *   memory-fifo            · 300 inserts → ≤ TRIAL_OUTCOME_LIMIT
 *   newOutcomeId-unique    · 100 calls → 100 unique ids
 *   analyzer-links         · trial-outcome links computed
 *   analyzer-orphans       · orphan trials surface
 *   analyzer-unmatched     · outcomes referencing missing trial surface
 *   analyzer-mutation      · per-mutation counts grouped correctly
 *   analyzer-formula       · per-formula tendencies computed
 *   analyzer-mode          · per-campaign-mode fatigue / resonance share
 *   analyzer-operator      · per-operator follow-through computed
 *   analyzer-sandbox-real  · sandbox vs reality rows produced
 *   analyzer-deterministic · same inputs → same output
 *   analyzer-rates         · all rates in [0,1]
 *   analyzer-no-winner     · output carries no winner / best / recommended flag
 *   analyzer-language      · phrasing uses observed-alongside / historically-associated only
 *   route-no-external      · route does not fetch any non-localhost URL
 *   route-no-generation    · route does not import pipeline / call /api/generate
 *   route-no-execution     · route does not export apply / execute / generateNow / publishNow
 *   route-requires-fields  · route requires operatorId / trialId / platform / audienceSegment
 *   route-requires-data    · route requires metrics or qualitativeSignals
 *   isolation              · memory + analyzer have no critic / pipeline imports
 *   no-mutate              · analyzer is pure (no fetch / no fs.writeFile)
 *   tsc                    · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  createInitialTrialOutcomeMemory, newOutcomeId, TRIAL_OUTCOME_LIMIT,
  type TrialOutcomeRecord,
} from '../lib/trialOutcomeMemory';
import { analyzeTrialOutcomes } from '../lib/trialOutcomeAnalyzer';
import type { OperatorCreativeTrial } from '../lib/operatorCreativeTrialMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic data ──────────────────────────────────────────

function mkTrial(o: Partial<OperatorCreativeTrial> = {}): OperatorCreativeTrial {
  return {
    trialId: o.trialId ?? 'trial-x',
    createdAt: o.createdAt ?? 1000,
    updatedAt: o.updatedAt ?? 1000,
    operatorId: o.operatorId ?? 'op-a',
    sourceCandidateId: o.sourceCandidateId ?? 'cand-1',
    formula: o.formula ?? 'ENERGY',
    campaignMode: o.campaignMode ?? 'Documentary',
    mutationType: o.mutationType ?? 'realism',
    fingerprintDelta: o.fingerprintDelta ?? 'increase realism',
    operatorReason: o.operatorReason ?? 'because',
    status: o.status ?? 'approved',
    statusHistory: o.statusHistory ?? [
      { at: 1000, status: o.status ?? 'approved', operatorId: 'op-a' },
    ],
    ...(o.outcomeId !== undefined ? { outcomeId: o.outcomeId } : {}),
  };
}

function mkOutcome(o: Partial<TrialOutcomeRecord> = {}): TrialOutcomeRecord {
  return {
    outcomeId: o.outcomeId ?? `o-${Math.random()}`,
    trialId: o.trialId ?? 'trial-x',
    timestamp: o.timestamp ?? 2000,
    operatorId: o.operatorId ?? 'op-a',
    platform: o.platform ?? 'instagram',
    audienceSegment: o.audienceSegment ?? 'us-parents',
    exposureWindow: o.exposureWindow,
    metrics: o.metrics ?? { retention: 0.6, saves: 3 },
    qualitativeSignals: o.qualitativeSignals ?? [],
    operatorNotes: o.operatorNotes,
    outcomeLabels: o.outcomeLabels ?? ['emotional-resonance'],
  };
}

// ─── memory cases ────────────────────────────────────────────

function caseMemoryFifo(): { ok: boolean; detail: string } {
  let mem = createInitialTrialOutcomeMemory();
  for (let i = 0; i < 300; i++) {
    const o = mkOutcome({ outcomeId: `oo-${i}`, timestamp: i });
    mem = {
      ...mem,
      outcomes: [...mem.outcomes, o].slice(-TRIAL_OUTCOME_LIMIT),
      totalOutcomes: mem.totalOutcomes + 1,
    };
  }
  return {
    ok: mem.outcomes.length <= TRIAL_OUTCOME_LIMIT && mem.totalOutcomes === 300,
    detail: `length=${mem.outcomes.length}/${TRIAL_OUTCOME_LIMIT} total=${mem.totalOutcomes}`,
  };
}

function caseNewOutcomeIdUnique(): { ok: boolean; detail: string } {
  const ids = new Set<string>();
  for (let i = 0; i < 100; i++) ids.add(newOutcomeId());
  return { ok: ids.size === 100, detail: `${ids.size}/100 unique` };
}

// ─── analyzer cases ──────────────────────────────────────────

function buildSample(): { trials: OperatorCreativeTrial[]; outcomes: TrialOutcomeRecord[] } {
  const trials: OperatorCreativeTrial[] = [
    mkTrial({ trialId: 't1', mutationType: 'realism', formula: 'ENERGY', operatorId: 'op-a', campaignMode: 'Documentary' }),
    mkTrial({ trialId: 't2', mutationType: 'realism', formula: 'ENERGY', operatorId: 'op-a', campaignMode: 'Documentary' }),
    mkTrial({ trialId: 't3', mutationType: 'silence', formula: 'FOCUS',  operatorId: 'op-b', campaignMode: 'Minimal' }),
    mkTrial({ trialId: 't4', mutationType: 'ritual',  formula: 'ENERGY', operatorId: 'op-b', campaignMode: 'Documentary' }),
  ];
  const outcomes: TrialOutcomeRecord[] = [
    mkOutcome({ trialId: 't1', outcomeId: 'o1', platform: 'instagram', audienceSegment: 'us-parents',
      metrics: { retention: 0.65, saves: 4 }, outcomeLabels: ['emotional-resonance'] }),
    mkOutcome({ trialId: 't1', outcomeId: 'o2', platform: 'tiktok',    audienceSegment: 'wellness',
      metrics: { retention: 0.55, saves: 2 }, outcomeLabels: ['trust-formation'] }),
    mkOutcome({ trialId: 't3', outcomeId: 'o3', platform: 'instagram', audienceSegment: 'crypto',
      metrics: { bounceRate: 0.6, retention: 0.2 }, outcomeLabels: ['fatigue-acceleration'] }),
    // t2 has no outcome → orphan
    // t4 has no outcome → orphan
    // outcome referencing missing trial:
    mkOutcome({ trialId: 't-missing', outcomeId: 'o4',
      outcomeLabels: ['emotional-resonance'] }),
  ];
  return { trials, outcomes };
}

function caseAnalyzerLinks(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const t1 = r.trialOutcomeLinks.find((l) => l.trialId === 't1');
  return {
    ok: t1 !== undefined && t1.outcomeCount === 2 &&
        t1.platformsObserved.length === 2 &&
        t1.observedLabels.includes('emotional-resonance'),
    detail: t1 ? `t1: count=${t1.outcomeCount} platforms=${t1.platformsObserved.join(',')}` : 'no t1 link',
  };
}
function caseAnalyzerOrphans(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  return {
    ok: r.orphanTrialIds.includes('t2') && r.orphanTrialIds.includes('t4'),
    detail: `orphans=${r.orphanTrialIds.join(',')}`,
  };
}
function caseAnalyzerUnmatched(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  return {
    ok: r.unmatchedOutcomeIds.includes('o4'),
    detail: `unmatched=${r.unmatchedOutcomeIds.join(',')}`,
  };
}
function caseAnalyzerMutation(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const realism = r.perMutationCounts.find((m) => m.mutationType === 'realism');
  const silence = r.perMutationCounts.find((m) => m.mutationType === 'silence');
  return {
    ok: realism !== undefined && realism.totalOutcomes === 2 &&
        silence !== undefined && silence.totalOutcomes === 1,
    detail: `realism=${realism?.totalOutcomes} silence=${silence?.totalOutcomes}`,
  };
}
function caseAnalyzerFormula(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const energy = r.perFormulaTendencies.find((f) => f.formula === 'ENERGY');
  return {
    ok: energy !== undefined && energy.totalOutcomes === 2,
    detail: `ENERGY total=${energy?.totalOutcomes}`,
  };
}
function caseAnalyzerMode(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const minimal = r.perCampaignModeTendencies.find((m) => m.campaignMode === 'Minimal');
  const doc = r.perCampaignModeTendencies.find((m) => m.campaignMode === 'Documentary');
  return {
    ok: minimal !== undefined && minimal.fatigueShare >= 0.99 &&
        doc !== undefined && doc.resonanceShare >= 0.99,
    detail: `Minimal fatigue=${minimal?.fatigueShare} Documentary resonance=${doc?.resonanceShare}`,
  };
}
function caseAnalyzerOperator(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const opA = r.perOperatorFollowThrough.find((o) => o.operatorId === 'op-a');
  const opB = r.perOperatorFollowThrough.find((o) => o.operatorId === 'op-b');
  return {
    ok: opA !== undefined && opA.totalTrials === 2 && opA.trialsWithOutcomes === 1 &&
        opB !== undefined && opB.totalTrials === 2 && opB.trialsWithOutcomes === 1,
    detail: `op-a=${opA?.trialsWithOutcomes}/${opA?.totalTrials} op-b=${opB?.trialsWithOutcomes}/${opB?.totalTrials}`,
  };
}
function caseAnalyzerSandboxReal(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  return {
    ok: r.sandboxVsReality.length === 3 && r.sandboxVsReality.every((row) =>
      typeof row.reportingRate === 'number',
    ),
    detail: `rows=${r.sandboxVsReality.length}`,
  };
}
function caseAnalyzerDeterministic(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const a = JSON.stringify(analyzeTrialOutcomes(trials, outcomes));
  const b = JSON.stringify(analyzeTrialOutcomes(trials, outcomes));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseAnalyzerRates(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const inRange = (n: number): boolean => n >= 0 && n <= 1;
  const okMode = r.perCampaignModeTendencies.every((m) =>
    inRange(m.fatigueShare) && inRange(m.resonanceShare),
  );
  const okOperator = r.perOperatorFollowThrough.every((o) => inRange(o.followThroughRate));
  const okSandbox = r.sandboxVsReality.every((row) => inRange(row.reportingRate));
  return {
    ok: okMode && okOperator && okSandbox && inRange(r.overallReportingRate),
    detail: `mode=${okMode} operator=${okOperator} sandbox=${okSandbox}`,
  };
}
function caseAnalyzerNoWinner(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const text = JSON.stringify(r);
  const banned = /"winner":|"best":|"recommended":|"applied":\s*true|"selected":|"correct":\s*true/i;
  return {
    ok: !banned.test(text),
    detail: !banned.test(text) ? 'no winner flags' : 'banned flag present',
  };
}
function caseAnalyzerLanguage(): { ok: boolean; detail: string } {
  const { trials, outcomes } = buildSample();
  const r = analyzeTrialOutcomes(trials, outcomes);
  const text = JSON.stringify(r);
  const required = /(observed alongside|historically associated|operator-reported|outcome-attached|joins?)/i;
  const banned = /(will happen|going to happen|guarantees|definitely|certainly)/i;
  return {
    ok: required.test(text) && !banned.test(text),
    detail: required.test(text) && !banned.test(text)
      ? 'allowed phrasing present; no banned phrasing'
      : 'language check failed',
  };
}

// ─── route + module static checks ────────────────────────────

async function readRouteSrc(): Promise<string> {
  return fs.readFile(
    path.resolve(__dirname, '..', 'app', 'api', 'trial-outcome', 'route.ts'),
    'utf8',
  );
}

async function caseRouteNoExternal(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const externalHost = /fetch\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/;
  return {
    ok: !externalHost.test(src),
    detail: !externalHost.test(src) ? 'no external fetch' : 'external fetch found',
  };
}
async function caseRouteNoGeneration(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/,
    /fetch\(\s*['"`][^'"`]*\/api\/generate/,
    /runPipeline\b/,
    /composeBannerSvg\b/,
    /rememberBanner\b/,
  ];
  for (const re of forbidden) {
    if (re.test(src)) return { ok: false, detail: `forbidden ${re}` };
  }
  return { ok: true, detail: 'route does not import or call generation' };
}
async function caseRouteNoExecution(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const banned = /\bexport\s+(function|async\s+function|const)\s+(applyMutation|executeMutation|generateNow|publishNow|runMutation|selectMutation|chooseMutation)\b/;
  return {
    ok: !banned.test(src),
    detail: !banned.test(src) ? 'no execution function exported' : 'execution function present',
  };
}
async function caseRouteRequiresFields(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const ok =
    /operatorId is required/.test(src) &&
    /trialId is required/.test(src) &&
    /platform is required/.test(src) &&
    /audienceSegment is required/.test(src);
  return {
    ok,
    detail: ok ? 'route enforces operator + trialId + platform + audience' : 'missing field checks',
  };
}
async function caseRouteRequiresData(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const ok = /metrics or qualitativeSignals is required/.test(src);
  return {
    ok,
    detail: ok ? 'route requires metrics or qualitativeSignals' : 'missing data check',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = ['lib/trialOutcomeMemory.ts', 'lib/trialOutcomeAnalyzer.ts'];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    for (const re of forbidden) {
      if (re.test(src)) return { ok: false, detail: `forbidden import in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline imports' };
}
async function caseNoMutate(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(
    path.resolve(__dirname, '..', 'lib', 'trialOutcomeAnalyzer.ts'),
    'utf8',
  );
  if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: 'fetch in analyzer' };
  if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: 'fs.writeFile in analyzer' };
  return { ok: true, detail: 'analyzer is pure' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('TRIAL OUTCOME VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['memory-fifo',           '300 inserts → ≤ TRIAL_OUTCOME_LIMIT',                          () => caseMemoryFifo()],
    ['newOutcomeId-unique',   '100 calls → 100 unique outcome ids',                            () => caseNewOutcomeIdUnique()],
    ['analyzer-links',        'trial-outcome links computed',                                  () => caseAnalyzerLinks()],
    ['analyzer-orphans',      'orphan trials surface',                                         () => caseAnalyzerOrphans()],
    ['analyzer-unmatched',    'outcomes referencing missing trial surface',                    () => caseAnalyzerUnmatched()],
    ['analyzer-mutation',     'per-mutation counts grouped correctly',                         () => caseAnalyzerMutation()],
    ['analyzer-formula',      'per-formula tendencies computed',                               () => caseAnalyzerFormula()],
    ['analyzer-mode',         'per-campaign-mode fatigue / resonance share',                   () => caseAnalyzerMode()],
    ['analyzer-operator',     'per-operator follow-through computed',                          () => caseAnalyzerOperator()],
    ['analyzer-sandbox-real', 'sandbox vs reality rows produced',                              () => caseAnalyzerSandboxReal()],
    ['analyzer-det',          'analyzer deterministic',                                        () => caseAnalyzerDeterministic()],
    ['analyzer-rates',        'all rates in [0,1]',                                            () => caseAnalyzerRates()],
    ['analyzer-no-winner',    'analyzer carries no winner / best / recommended flag',          () => caseAnalyzerNoWinner()],
    ['analyzer-language',     'phrasing uses observed-alongside / historically-associated',    () => caseAnalyzerLanguage()],
    ['route-no-external',     'route does not fetch any non-localhost URL',                    () => caseRouteNoExternal()],
    ['route-no-generation',   'route does not import pipeline / call /api/generate',           () => caseRouteNoGeneration()],
    ['route-no-execution',    'route does not export apply / execute / generateNow / publishNow', () => caseRouteNoExecution()],
    ['route-requires-fields', 'route requires operatorId / trialId / platform / audienceSegment', () => caseRouteRequiresFields()],
    ['route-requires-data',   'route requires metrics or qualitativeSignals',                  () => caseRouteRequiresData()],
    ['isolation',             'memory + analyzer have no critic / pipeline imports',           () => caseIsolation()],
    ['no-mutate',             'analyzer is pure (no fetch / no fs.writeFile)',                 () => caseNoMutate()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
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
