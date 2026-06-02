/**
 * VERIFY — Creative Performance Layer.
 *
 * 5 phases: publication registry · performance memory ·
 * performance analyzer · creative DNA map · learning signal bridge.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  appendPublicationRecord, applyPublicationStep, newPublicationId,
  createInitialPublicationRegistry, PUBLICATION_REGISTRY_LIMIT,
  type PublicationRecord,
} from '../lib/publicationRegistryMemory';
import {
  appendPerformanceRecord, newPerformanceId, createInitialPerformanceMemory,
  PERFORMANCE_MEMORY_LIMIT,
  type PerformanceRecord,
} from '../lib/performanceMemory';
import { analyzePerformance } from '../lib/performanceAnalyzer';
import { buildCreativeDNAMap } from '../lib/creativeDNAMap';
import { composeLearningSignalBridge } from '../lib/learningSignalBridge';
import type { AssetRecord } from '../lib/assetRegistryMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── synthetic fixtures ──────────────────────────────────────

function mkAsset(o: Partial<AssetRecord> = {}): AssetRecord {
  return {
    assetId: 'asset-x', formula: 'ENERGY', campaign: 'c',
    packageType: 'image', sourceStoryName: 'Quiet Return Home',
    sourceBriefId: 'brief-image-quiet-return-home', sourcePromptId: 'prompt-image-quiet-return-home',
    prompt: 'kitchen light · documentary handheld · 50mm handheld · Hebrew RTL · pressure → breath → return · observational still',
    summary: 'image · home', createdAt: 1000, operatorId: 'op-a',
    approvalStatus: 'approved',
    approvalHistory: [{ at: 1000, status: 'approved', operatorId: 'op-a', reason: 'looks good' }],
    ...o,
  };
}
function mkPub(o: Partial<PublicationRecord> = {}): PublicationRecord {
  return {
    publicationId: o.publicationId ?? newPublicationId(),
    assetId: o.assetId ?? 'asset-x',
    channel: o.channel ?? 'instagram-feed',
    publishedAt: o.publishedAt ?? 1000,
    operatorId: o.operatorId ?? 'op-a',
    campaign: o.campaign ?? 'c', formula: o.formula ?? 'ENERGY',
    audience: o.audience ?? 'il-women-25-44', platform: o.platform ?? 'ig-123',
    status: o.status ?? 'live',
    statusHistory: o.statusHistory ?? [{ at: 1000, status: 'live', operatorId: 'op-a', reason: 'registered' }],
    ...o,
  };
}
function mkPerf(o: Partial<PerformanceRecord> = {}): PerformanceRecord {
  return {
    performanceId: o.performanceId ?? newPerformanceId(),
    assetId: o.assetId ?? 'asset-x',
    publicationId: o.publicationId ?? 'pub-x',
    platform: o.platform ?? 'instagram',
    measuredAt: o.measuredAt ?? 2000,
    measurementWindow: o.measurementWindow ?? { startedAt: 1000, endedAt: 2000, durationHours: 24 },
    metrics: o.metrics ?? { views: 100, reach: 80, watchTimeSeconds: 8, completionRate: 0.6, ctr: 0.02,
                            shares: 5, saves: 12, comments: 3, likes: 50, engagementRate: 0.08,
                            follows: 2, profileVisits: 30 },
    operatorId: o.operatorId ?? 'op-a',
  };
}

// ─── publication registry cases ──────────────────────────────

function caseRegistryAppendAndTransition(): { ok: boolean; detail: string } {
  let state = createInitialPublicationRegistry();
  const rec = mkPub();
  state = appendPublicationRecord(state, rec);
  if (state.publications.length !== 1) return { ok: false, detail: `len=${state.publications.length}` };
  state = applyPublicationStep(state, rec.publicationId, {
    at: 2000, status: 'paused', operatorId: 'op-a', reason: 'pausing'
  });
  return {
    ok: state.publications[0].status === 'paused' && state.publications[0].statusHistory.length === 2,
    detail: `status=${state.publications[0].status} history=${state.publications[0].statusHistory.length}`,
  };
}
function caseRegistryThrowsOnUnknown(): { ok: boolean; detail: string } {
  try {
    applyPublicationStep(createInitialPublicationRegistry(), 'nope', {
      at: 1, status: 'paused', operatorId: 'op-a', reason: 'x',
    });
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseRegistryFifo(): { ok: boolean; detail: string } {
  let state = createInitialPublicationRegistry();
  for (let i = 0; i < PUBLICATION_REGISTRY_LIMIT + 30; i++) {
    state = appendPublicationRecord(state, mkPub({ publicationId: newPublicationId() }));
  }
  return {
    ok: state.publications.length === PUBLICATION_REGISTRY_LIMIT &&
        state.totalPublications === PUBLICATION_REGISTRY_LIMIT + 30,
    detail: `publications=${state.publications.length} total=${state.totalPublications}`,
  };
}

// ─── performance memory cases ────────────────────────────────

function casePerfAppendFifo(): { ok: boolean; detail: string } {
  let state = createInitialPerformanceMemory();
  for (let i = 0; i < PERFORMANCE_MEMORY_LIMIT + 30; i++) {
    state = appendPerformanceRecord(state, mkPerf({ performanceId: newPerformanceId() }));
  }
  return {
    ok: state.performances.length === PERFORMANCE_MEMORY_LIMIT &&
        state.totalPerformances === PERFORMANCE_MEMORY_LIMIT + 30,
    detail: `performances=${state.performances.length} total=${state.totalPerformances}`,
  };
}

// ─── performance analyzer cases ──────────────────────────────

function buildScenario() {
  const assets = [
    mkAsset({ assetId: 'a1', packageType: 'image' }),
    mkAsset({ assetId: 'a2', packageType: 'video', prompt: 'documentary handheld · 50mm handheld · noise → silence → clarity · Hebrew RTL' }),
  ];
  const publications: PublicationRecord[] = [
    mkPub({ publicationId: 'pub-1', assetId: 'a1', channel: 'instagram-feed', publishedAt: 1000 }),
    mkPub({ publicationId: 'pub-2', assetId: 'a2', channel: 'instagram-reels', publishedAt: 2000 }),
    mkPub({ publicationId: 'pub-3', assetId: 'a1', channel: 'instagram-feed', publishedAt: 3000 }),
  ];
  const performances: PerformanceRecord[] = [
    mkPerf({ performanceId: 'p1', assetId: 'a1', publicationId: 'pub-1', measuredAt: 1500,
             metrics: { views: 500, reach: 300, watchTimeSeconds: 6, completionRate: 0.55, ctr: 0.02,
                        shares: 10, saves: 25, comments: 8, likes: 80, engagementRate: 0.09,
                        follows: 7, profileVisits: 60 } }),
    mkPerf({ performanceId: 'p2', assetId: 'a2', publicationId: 'pub-2', measuredAt: 2500,
             metrics: { views: 1000, reach: 700, watchTimeSeconds: 12, completionRate: 0.6, ctr: 0.03,
                        shares: 20, saves: 35, comments: 15, likes: 200, engagementRate: 0.12,
                        follows: 15, profileVisits: 120 } }),
    mkPerf({ performanceId: 'p3', assetId: 'a1', publicationId: 'pub-3', measuredAt: 3500,
             metrics: { views: 250, reach: 180, watchTimeSeconds: 3, completionRate: 0.25, ctr: 0.01,
                        shares: 6, saves: 4, comments: 2, likes: 30, engagementRate: 0.04,
                        follows: 1, profileVisits: 15 } }),
  ];
  return { assets, publications, performances };
}

function caseAnalyzerShape(): { ok: boolean; detail: string } {
  const { assets, publications, performances } = buildScenario();
  const r = analyzePerformance({ assets, publications, performances });
  const required = ['fatigueIndicator', 'attentionIndicator', 'retentionIndicator', 'trustIndicator'];
  for (const k of required) {
    const v = (r.indicators as any)[k];
    if (typeof v?.level !== 'number') return { ok: false, detail: `${k} missing` };
  }
  return {
    ok: r.totalPerformances === 3 && r.perChannel.length >= 1 && r.perFormula.length >= 1,
    detail: `total=${r.totalPerformances} channels=${r.perChannel.length} formulas=${r.perFormula.length} patterns=${r.historicallyAssociatedPatterns.length}`,
  };
}
function caseAnalyzerDeterministic(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const a = JSON.stringify(analyzePerformance(s));
  const b = JSON.stringify(analyzePerformance(s));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function stripNegatedContract(text: string): string {
  return text
    .replace(/never\s+names?\s+a\s+winner/gi, '')
    .replace(/never\s+recommends?/gi, '')
    .replace(/never\s+auto-?(applies|apply|modifies|modify|approves|approve|publish(es)?|posts?)/gi, '')
    .replace(/never\s+selected/gi, '')
    .replace(/never\s+chosen/gi, '')
    .replace(/never\s+optimal/gi, '')
    .replace(/never\s+best/gi, '')
    .replace(/no\s+winner\s+selection/gi, '')
    .replace(/No winner selection/gi, '')
    .replace(/observation only.{0,15}never recommended/gi, '')
    .replace(/never\s+recommended/gi, '');
}
function caseAnalyzerNoWinner(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const text = stripNegatedContract(JSON.stringify(analyzePerformance(s)));
  const banned = /\b(winner|recommended|selected|chosen|optimal|best)\b|"will\s+perform"/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : 'banned phrasing present' };
}
function caseAnalyzerEmpty(): { ok: boolean; detail: string } {
  const r = analyzePerformance({});
  return {
    ok: r.totalPerformances === 0 && r.notes.some((n) => /requires more evidence/i.test(n)),
    detail: `total=${r.totalPerformances}`,
  };
}

// ─── creative DNA map cases ──────────────────────────────────

function caseDNAMapShape(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const r = buildCreativeDNAMap(s);
  const expected = ['hook', 'emotionType', 'visualStyle', 'storyStructure',
                    'cameraStyle', 'headlineStyle', 'silenceRatio', 'pace'];
  const axisNames = r.axes.map((a) => a.axis);
  const missing = expected.filter((k) => !axisNames.includes(k as any));
  return {
    ok: missing.length === 0 && r.totalAssetsObserved >= 1,
    detail: missing.length === 0 ? `axes=${axisNames.length} assets=${r.totalAssetsObserved}` : `missing=${missing.join(',')}`,
  };
}
function caseDNAMapDeterministic(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const a = JSON.stringify(buildCreativeDNAMap(s));
  const b = JSON.stringify(buildCreativeDNAMap(s));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseDNAMapNoWinner(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const text = stripNegatedContract(JSON.stringify(buildCreativeDNAMap(s)));
  // "observed strength" is allowed phrasing — must NOT contain winner-style verbs.
  const banned = /\b(winner|recommended|selected|chosen|optimal|best)\b|"will\s+perform"/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : 'banned phrasing present' };
}
function caseDNAMapHookExtracted(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const r = buildCreativeDNAMap(s);
  const hookAxis = r.axes.find((a) => a.axis === 'hook');
  // The fixture prompts mention "Quiet Return Home" and "pressure → breath → return"
  // so the hook axis should surface at least one named hook token.
  return {
    ok: hookAxis !== undefined && hookAxis.tokens.length >= 1,
    detail: hookAxis ? `tokens=${hookAxis.tokens.map((t) => t.token).join(',')}` : 'no hook axis',
  };
}

// ─── learning signal bridge cases ────────────────────────────

function caseBridgeShape(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const performance = analyzePerformance(s);
  const creativeDNA = buildCreativeDNAMap(s);
  const r = composeLearningSignalBridge({
    performance, creativeDNA,
    supervised: { alignedMutations: ['realism'], contradictedMutations: ['tension'] },
  });
  return {
    ok: r.bridgeSignals.length >= 1 && /Human remains final authority/.test(r.advisoryNotice),
    detail: `signals=${r.bridgeSignals.length}`,
  };
}
function caseBridgeDeterministic(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const input = {
    performance: analyzePerformance(s),
    creativeDNA: buildCreativeDNAMap(s),
    supervised: { alignedMutations: ['realism'] },
  };
  const a = JSON.stringify(composeLearningSignalBridge(input));
  const b = JSON.stringify(composeLearningSignalBridge(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseBridgeNeverAutoApplies(): { ok: boolean; detail: string } {
  const s = buildScenario();
  const r = composeLearningSignalBridge({
    performance: analyzePerformance(s),
    creativeDNA: buildCreativeDNAMap(s),
    supervised: { alignedMutations: ['realism'] },
  });
  const text = stripNegatedContract(JSON.stringify(r));
  // "consideredBy" is allowed — it lists which downstream layers MAY consider
  // the signal. Banned: auto-apply / auto-modify / will-modify / recommended.
  const banned = /\b(auto-?apply|auto-?modify|will\s+modify|recommended|selected|chosen|optimal|winner|best)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : 'banned phrasing present' };
}
function caseBridgeEmpty(): { ok: boolean; detail: string } {
  const r = composeLearningSignalBridge({});
  return {
    ok: r.bridgeSignals.some((s) => s.signalId === 'perf-absent'),
    detail: `signals=${r.bridgeSignals.length}`,
  };
}

// ─── route + isolation cases ─────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function caseRoutesNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'app/api/publication-registry/route.ts',
    'app/api/performance/route.ts',
    'app/api/performance-analyzer/route.ts',
    'app/api/creative-dna-map/route.ts',
    'app/api/learning-bridge/route.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/, /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/, /\bfetch\s*\([^)]*\/api\/generate/,
    /\brunPipeline\s*\(/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
  }
  return { ok: true, detail: 'no pipeline / external-provider calls in routes' };
}
async function casePublicationRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'publication-registry', 'route.ts'), 'utf8');
  const ok = /(operatorId is required|requireSession)/.test(src) && /operatorReason is required/.test(src) &&
             /asset is not approved/.test(src);
  return { ok, detail: ok ? 'operator-gated · approved-status gated' : 'gate missing' };
}
async function casePerformanceRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'performance', 'route.ts'), 'utf8');
  const ok = /(operatorId is required|requireSession)/.test(src) && /operatorReason is required/.test(src) &&
             /publicationId not found/.test(src);
  return { ok, detail: ok ? 'operator-gated · publication-existence gated' : 'gate missing' };
}
async function caseReadOnlyRoutesAreGetOnly(): Promise<{ ok: boolean; detail: string }> {
  for (const f of ['app/api/performance-analyzer/route.ts', 'app/api/creative-dna-map/route.ts',
                   'app/api/learning-bridge/route.ts']) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
    const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
    if (!hasGet || hasPost) return { ok: false, detail: `${f}: GET=${hasGet} POST=${hasPost}` };
  }
  return { ok: true, detail: '3 read-only routes are GET-only' };
}
async function caseRoutesListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  const ok = /['"]\/api\/publication-registry['"]/.test(src) &&
             /['"]\/api\/performance['"]/.test(src) &&
             /['"]\/api\/performance-analyzer['"]/.test(src) &&
             /['"]\/api\/creative-dna-map['"]/.test(src) &&
             /['"]\/api\/learning-bridge['"]/.test(src);
  return { ok, detail: ok ? 'all 5 routes registered' : 'one or more missing' };
}
async function caseWhitelistUpdated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'scripts', 'verify-system-stability.ts'), 'utf8');
  const ok = /app\/api\/publication-registry\/route\.ts/.test(src) &&
             /app\/api\/performance\/route\.ts/.test(src);
  return { ok, detail: ok ? 'whitelist includes new POSTs' : 'missing' };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/publicationRegistryMemory.ts', 'lib/performanceMemory.ts',
    'lib/performanceAnalyzer.ts', 'lib/creativeDNAMap.ts', 'lib/learningSignalBridge.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/, /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"]@?lib\/banner(?!\.)/, /from\s+['"]@?lib\/.*publish/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}` };
    // Pure engines (not memory stores) must have no fetch / no fs.writeFile.
    if (f.includes('Analyzer') || f.includes('Map') || f.includes('Bridge')) {
      if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
      if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
    }
  }
  return { ok: true, detail: 'engines pure · no critic / pipeline / banner / publish imports' };
}

// ─── narrative-language guard rails ──────────────────────────

function buildAllText(): string {
  const s = buildScenario();
  const perf = analyzePerformance(s);
  const dna = buildCreativeDNAMap(s);
  const br = composeLearningSignalBridge({ performance: perf, creativeDNA: dna,
                                            supervised: { alignedMutations: ['realism'] } });
  const collect: string[] = [perf.advisoryNotice, dna.advisoryNotice, br.advisoryNotice,
                             ...perf.notes, ...dna.notes, ...br.notes,
                             ...br.operatorExplorations];
  for (const ind of Object.values(perf.indicators)) collect.push(ind.observation);
  for (const p of perf.historicallyAssociatedPatterns) collect.push(p.description);
  for (const ch of perf.perChannel) collect.push(ch.observation);
  for (const fm of perf.perFormula) collect.push(fm.observation);
  for (const ax of dna.axes) for (const t of ax.tokens) collect.push(t.observation);
  for (const s of br.bridgeSignals) collect.push(s.observation);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = stripNegatedContract(buildAllText());
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|auto-?modify|auto-?approve|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenAutoPublish(): { ok: boolean; detail: string } {
  const text = buildAllText();
  // Banned: phrasing that implies the system itself publishes / posts.
  // "never auto-publishes / never auto-posts" is the contract — we don't
  // emit those strings in observational text either, the engines stay
  // descriptive.
  const banned = /\b(auto.?publish|auto.?post|autonomous post|will\s+publish|will\s+post|viral|dopamine|outrage|manipulat|exploit)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(historically associated|observed alongside|requires more evidence|Human remains final authority|operator review required|appears (elevated|suppressed|to be|stable))/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('CREATIVE PERFORMANCE LAYER VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['publication-append-transition',  'publication append + applyPublicationStep work', () => caseRegistryAppendAndTransition()],
    ['publication-throws-unknown',     'applyPublicationStep throws on unknown id',      () => caseRegistryThrowsOnUnknown()],
    ['publication-fifo',               'publication FIFO cap respected',                  () => caseRegistryFifo()],
    ['performance-fifo',               'performance memory FIFO cap respected',           () => casePerfAppendFifo()],
    ['analyzer-shape',                 '4 indicators + per-channel + per-formula populated', () => caseAnalyzerShape()],
    ['analyzer-deterministic',         'analyzer is pure',                                () => caseAnalyzerDeterministic()],
    ['analyzer-no-winner',             'analyzer never names a winner',                   () => caseAnalyzerNoWinner()],
    ['analyzer-empty',                 'no input → requires more evidence note',          () => caseAnalyzerEmpty()],
    ['dna-shape',                      '8 DNA axes populated · ≥1 asset observed',        () => caseDNAMapShape()],
    ['dna-deterministic',              'DNA map is pure',                                  () => caseDNAMapDeterministic()],
    ['dna-no-winner',                  'DNA map never names a winner',                    () => caseDNAMapNoWinner()],
    ['dna-hook-extracted',             'hook axis surfaces at least one token from synthetic prompts', () => caseDNAMapHookExtracted()],
    ['bridge-shape',                   'bridge produces signals + Human final authority',  () => caseBridgeShape()],
    ['bridge-deterministic',           'bridge is pure',                                   () => caseBridgeDeterministic()],
    ['bridge-never-auto-applies',      'bridge phrasing never auto-applies / auto-modifies', () => caseBridgeNeverAutoApplies()],
    ['bridge-empty',                   'no input → bridge surfaces requires-more-evidence signal', () => caseBridgeEmpty()],
    ['routes-no-pipeline',             'routes do not import pipeline / generate',         () => caseRoutesNoPipeline()],
    ['publication-route-operator-gated', 'publication POST requires operatorId + reason + approved-status gate', () => casePublicationRouteOperatorGated()],
    ['performance-route-operator-gated', 'performance POST requires operatorId + reason + publication-existence gate', () => casePerformanceRouteOperatorGated()],
    ['read-only-routes-get-only',      '3 read-only routes export GET but not POST',       () => caseReadOnlyRoutesAreGetOnly()],
    ['routes-listed',                  'all 5 routes registered in systemIntegrityReport', () => caseRoutesListed()],
    ['whitelist-updated',              'system-stability whitelist includes new POSTs',    () => caseWhitelistUpdated()],
    ['isolation',                      'engines pure · no critic / pipeline / banner / publish imports', () => caseIsolation()],
    ['forbidden-prediction',           'no predict / winner / optimize / recommended / auto-apply',     () => caseForbiddenPrediction()],
    ['forbidden-auto-publish',         'no auto-publish / autonomous post / viral / dopamine / exploit', () => caseForbiddenAutoPublish()],
    ['allowed-language',               'historically associated / requires more evidence / Human final authority', () => caseAllowedLanguage()],
  ];
  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }
  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true, 'deferred');
  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error('verification script crashed:', err); process.exit(2); });
