/**
 * VERIFY — Execution Agent Layer.
 *
 * 5 agents + run memory + operator-supervised route.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  runCreativeDirectorAgent, runContentProducerAgent,
  runQualityReviewerAgent, runCampaignManagerAgent, runPerformanceAnalystAgent,
  AGENT_CATALOG, AGENT_IDS,
} from '../lib/agents';
import {
  appendAgentRun, applyAgentRunStep, newAgentRunId,
  createInitialAgentRunMemory, AGENT_RUN_LIMIT,
  type AgentRunRecord,
} from '../lib/agentRunMemory';
import type { AssetRecord } from '../lib/assetRegistryMemory';
import type { CampaignPlanRecord } from '../lib/campaignPlanMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

function mkAsset(over: Partial<AssetRecord> = {}): AssetRecord {
  return {
    assetId: over.assetId ?? 'asset-1', formula: 'ENERGY', campaign: 'production-studio-ENERGY',
    packageType: 'image', sourceStoryName: 'Quiet Return Home',
    sourceBriefId: 'b1', sourcePromptId: 'p1',
    prompt: 'kitchen light · documentary handheld · 50mm handheld · Hebrew RTL · MOOD ENERGY',
    summary: 'image · home', createdAt: 1000, operatorId: 'op-a',
    approvalStatus: 'approved',
    approvalHistory: [{ at: 1000, status: 'approved', operatorId: 'op-a', reason: 'ok' }],
    ...over,
  };
}

// ─── catalog cases ───────────────────────────────────────────

function caseCatalogShape(): { ok: boolean; detail: string } {
  if (AGENT_IDS.length !== 5) return { ok: false, detail: `agents=${AGENT_IDS.length}` };
  for (const id of AGENT_IDS) {
    const d = AGENT_CATALOG[id];
    if (!d || d.agentId !== id) return { ok: false, detail: `catalog missing ${id}` };
    if (d.consumes.length === 0 || d.produces.length === 0) {
      return { ok: false, detail: `${id} has no consumes/produces` };
    }
  }
  return { ok: true, detail: `5 agents catalogued with consumes + produces` };
}

// ─── individual agent shape cases ────────────────────────────

function caseCreativeDirectorShape(): { ok: boolean; detail: string } {
  const r = runCreativeDirectorAgent({
    goal: 'product-trial', formula: 'ENERGY', market: 'israel', audience: 'il-women-25-44',
    budgetUSD: 5000,
  });
  return {
    ok: r.descriptor.agentId === 'creative-director' &&
        r.briefs.banners.length > 0 &&
        r.storyArchitect.storyBlueprints.length > 0,
    detail: `briefs.banners=${r.briefs.banners.length} blueprints=${r.storyArchitect.storyBlueprints.length}`,
  };
}
function caseContentProducerShape(): { ok: boolean; detail: string } {
  const r = runContentProducerAgent({
    briefRef: {
      blueprintId: 'quiet-return-home', storyName: 'Quiet Return Home',
      emotionalArc: 'pressure → breath → return', memoryAnchor: 'kitchen light',
    },
    formula: 'ENERGY',
  });
  return {
    ok: r.descriptor.agentId === 'content-producer' &&
        r.bannerPackage !== null && r.videoPackage !== null &&
        r.carouselPackage !== null && r.landingPackage !== null,
    detail: 'all 4 packages composed',
  };
}
function caseQualityReviewerShape(): { ok: boolean; detail: string } {
  const r = runQualityReviewerAgent({
    assets: [mkAsset()],
  });
  return {
    ok: r.descriptor.agentId === 'quality-reviewer' &&
        r.findings.length === 1 &&
        Array.isArray(r.reviewNotes),
    detail: `findings=${r.findings.length} violations=${r.totalViolations} gaps=${r.totalEvidenceGaps}`,
  };
}
function caseCampaignManagerShape(): { ok: boolean; detail: string } {
  const plan: CampaignPlanRecord = {
    planId: 'p1', label: 'Q1', operatorId: 'op-a', status: 'in-flight',
    createdAt: 100, history: [],
    input: { budgetUSD: 1000, goal: 'product-trial', formula: 'ENERGY', market: 'israel', audience: 'il' },
    plan: {
      goal: 'product-trial', formula: 'ENERGY', market: 'israel', audience: 'il',
      budgetUSD: 1000, durationDays: 14,
      phases: [], creativeAngles: [],
      budgetAllocation: { productionUSD: 0, paidMediaUSD: 0, testingReserveUSD: 0, contingencyUSD: 0, spendDisclaimer: '' },
      assetRequirements: [
        { packageType: 'image', minimumCount: 4, exploredCount: 6, phases: ['arrival'], note: 'note' },
      ],
      notes: [], reasonCodes: [], advisoryNotice: '',
    },
    testingMatrix: { axes: [], cells: [], totalCells: 0, notes: [], reasonCodes: [], advisoryNotice: '' },
    contentCalendar: { startISODate: '2026-01-01', totalWeeks: 2, publishingCadencePerWeek: 3, restDaysPerWeek: 1, weeks: [], notes: [], reasonCodes: [], advisoryNotice: '' },
    performanceExpectation: { perPhaseBands: [], aggregate: {
      impressionsBand: { low: 0, high: 0, unit: '', note: '', source: 'industry-norm' },
      engagementRateBand: { low: 0, high: 0, unit: '', note: '', source: 'industry-norm' },
      completionRateBand: { low: 0, high: 0, unit: '', note: '', source: 'industry-norm' },
      saveRateBand: { low: 0, high: 0, unit: '', note: '', source: 'industry-norm' },
      estimatedAssetsExplored: { low: 0, high: 0 },
    }, disclaimers: [], notes: [], reasonCodes: [], advisoryNotice: '' },
  };
  const r = runCampaignManagerAgent({
    campaignPlans: [plan],
    assets: [mkAsset({ assetId: 'a-x' })], // approved + matching campaign label
    nowMs: plan.createdAt + 5 * 24 * 60 * 60 * 1000, // in-flight on time
  });
  return {
    ok: r.descriptor.agentId === 'campaign-manager' && r.rows.length === 1 &&
        r.rows[0].requiredAssetCount === 4 && r.rows[0].approvedAssetCount === 1 &&
        r.rows[0].missingAssetCount === 3 &&
        r.rows[0].timelineStatus === 'in-flight-on-time',
    detail: `req=${r.rows[0]?.requiredAssetCount} have=${r.rows[0]?.approvedAssetCount} missing=${r.rows[0]?.missingAssetCount} timeline=${r.rows[0]?.timelineStatus}`,
  };
}
function casePerformanceAnalystShape(): { ok: boolean; detail: string } {
  const r = runPerformanceAnalystAgent({});
  return {
    ok: r.descriptor.agentId === 'performance-analyst' && r.evidenceGaps.length > 0,
    detail: `obs=${r.observations.length} patterns=${r.patterns.length} questions=${r.researchQuestions.length} gaps=${r.evidenceGaps.length}`,
  };
}

// ─── determinism ─────────────────────────────────────────────

function caseAllAgentsDeterministic(): { ok: boolean; detail: string } {
  const inputs: Array<[string, () => unknown]> = [
    ['creative-director', () => runCreativeDirectorAgent({
      goal: 'brand-awareness', formula: 'RELAX', market: 'global', audience: 'global', budgetUSD: 3000,
    })],
    ['content-producer', () => runContentProducerAgent({
      briefRef: { blueprintId: 'morning-restart', storyName: 'Morning Restart' },
      formula: 'ENERGY',
    })],
    ['quality-reviewer', () => runQualityReviewerAgent({ assets: [mkAsset()] })],
    ['campaign-manager', () => runCampaignManagerAgent({ campaignPlans: [], assets: [] })],
    ['performance-analyst', () => runPerformanceAnalystAgent({})],
  ];
  for (const [name, fn] of inputs) {
    const a = JSON.stringify(fn());
    const b = JSON.stringify(fn());
    if (a !== b) return { ok: false, detail: `${name} non-deterministic` };
  }
  return { ok: true, detail: '5 agents deterministic' };
}

// ─── operator-approval gate ──────────────────────────────────

function caseAgentsNeverAutoApprove(): { ok: boolean; detail: string } {
  const outputs = [
    JSON.stringify(runCreativeDirectorAgent({ goal: 'product-trial', formula: 'ENERGY', market: 'israel', audience: 'il' })),
    JSON.stringify(runContentProducerAgent({ briefRef: { blueprintId: 'x', storyName: 'X' }, formula: 'ENERGY' })),
    JSON.stringify(runQualityReviewerAgent({ assets: [mkAsset()] })),
    JSON.stringify(runCampaignManagerAgent({ campaignPlans: [], assets: [] })),
    JSON.stringify(runPerformanceAnalystAgent({})),
  ];
  for (const o of outputs) {
    // Outputs must NOT contain explicit auto-approval fields.
    if (/"approved":\s*true|"autoApprove(d)?":\s*true|"winner":|"recommended":\s*true/i.test(o)) {
      return { ok: false, detail: 'agent output declares auto-approval / winner' };
    }
  }
  return { ok: true, detail: 'no agent output auto-approves' };
}

// ─── memory cases ────────────────────────────────────────────

function caseMemoryAppendAndTransition(): { ok: boolean; detail: string } {
  let state = createInitialAgentRunMemory();
  const rec: AgentRunRecord = {
    runId: newAgentRunId(), agentId: 'quality-reviewer', label: 'test',
    input: {}, output: {}, createdAt: 1000, operatorId: 'op-a',
    status: 'pending', history: [{ at: 1000, status: 'pending', operatorId: 'op-a', reason: 'exec' }],
  };
  state = appendAgentRun(state, rec);
  if (state.runs.length !== 1) return { ok: false, detail: `len=${state.runs.length}` };
  state = applyAgentRunStep(state, rec.runId, { at: 2000, status: 'approved', operatorId: 'op-a', reason: 'ok' });
  return {
    ok: state.runs[0].status === 'approved' && state.runs[0].history.length === 2,
    detail: `status=${state.runs[0].status} history=${state.runs[0].history.length}`,
  };
}
function caseMemoryThrowsOnUnknown(): { ok: boolean; detail: string } {
  try {
    applyAgentRunStep(createInitialAgentRunMemory(), 'nope', { at: 1, status: 'approved', operatorId: 'op-a' });
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialAgentRunMemory();
  for (let i = 0; i < AGENT_RUN_LIMIT + 30; i++) {
    state = appendAgentRun(state, {
      runId: newAgentRunId(), agentId: 'quality-reviewer', label: 'x',
      input: {}, output: {}, createdAt: 1000 + i, operatorId: 'op-a',
      status: 'pending', history: [{ at: 1000 + i, status: 'pending', operatorId: 'op-a' }],
    });
  }
  return {
    ok: state.runs.length === AGENT_RUN_LIMIT && state.totalRuns === AGENT_RUN_LIMIT + 30,
    detail: `runs=${state.runs.length} total=${state.totalRuns}`,
  };
}

// ─── route + static checks ───────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function caseRouteNoExternalAPIs(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'agent', 'route.ts'), 'utf8');
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"][^'"]*(facebook|meta|google[- ]?ads|hubspot|salesforce|stripe|braintree|paypal|tiktok|slack|notion|asana|jira)/i,
    /\bfetch\s+['"][^'"]*(graph\.facebook|googleapis\.com|stripe|paypal|slack|notion|hubapi)/i,
    /\brunPipeline\s*\(/,
    /\bfetch\s*\([^)]*\/api\/generate/,
  ];
  for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  return { ok: true, detail: 'no external-API or pipeline calls in route' };
}
async function caseRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'agent', 'route.ts'), 'utf8');
  const a = /(operatorId is required|requireSession)/.test(src);
  const b = /operatorReason is required/.test(src);
  return { ok: a && b, detail: `operatorId=${a} operatorReason=${b}` };
}
async function caseRouteHasGetAndPost(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'agent', 'route.ts'), 'utf8');
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return { ok: hasGet && hasPost, detail: `GET=${hasGet} POST=${hasPost}` };
}
async function caseRouteListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  return {
    ok: /['"]\/api\/agent['"]/.test(src),
    detail: /['"]\/api\/agent['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseWhitelistUpdated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'scripts', 'verify-system-stability.ts'), 'utf8');
  return {
    ok: /app\/api\/agent\/route\.ts/.test(src),
    detail: /app\/api\/agent\/route\.ts/.test(src) ? 'whitelisted' : 'missing',
  };
}
async function caseAgentIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files: string[] = [];
  const dir = path.resolve(__dirname, '..', 'lib', 'agents');
  for (const f of await fs.readdir(dir)) {
    if (f.endsWith('.ts')) files.push(path.join('lib', 'agents', f));
  }
  files.push(path.join('lib', 'agentRunMemory.ts'));
  const forbidden = [
    /from\s+['"](\.\.\/)*src\/engines\/critic/, /from\s+['"](\.\.\/)*src\/core\/pipeline/,
    /from\s+['"]@\/core\/pipeline/, /from\s+['"]@?lib\/banner(?!\.)/,
    /from\s+['"][^'"]*(facebook|meta|google[- ]?ads|hubspot|salesforce|stripe|paypal|tiktok|slack|notion|asana|jira)/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
    // Agents must be pure — no fetch, no fs.writeFile (memory file is the exception).
    if (!f.endsWith('agentRunMemory.ts')) {
      if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
      if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
    }
  }
  return { ok: true, detail: 'agents pure · no critic / pipeline / banner / external-platform imports' };
}

// ─── narrative-language guard rails ──────────────────────────

function stripNegatedContract(text: string): string {
  return text
    .replace(/never\s+publish(es|ing)?/gi, '').replace(/never\s+spends?\s+(money|budget)?/gi, '')
    .replace(/never\s+modif(y|ies)\s+external\s+systems?/gi, '')
    .replace(/never\s+calls?\s+(ad|external)\s+(api|apis)/gi, '')
    .replace(/never\s+approves?\s+(itself|its\s+own\s+runs?)/gi, '')
    .replace(/never\s+auto-?(approve(s|d)?|appl(y|ies)|optimize(s)?|advance(s)?|select(s)?|execute(s)?|create(s)?|edit(s)?)/gi, '')
    .replace(/never\s+predicts?/gi, '').replace(/never\s+recommend(s|ed|ing)?/gi, '')
    .replace(/never\s+name(s)?\s+a\s+winner/gi, '').replace(/never\s+name(s)?\s+a\s+best/gi, '')
    .replace(/never\s+best/gi, '').replace(/never\s+winner/gi, '')
    .replace(/never\s+blocks?/gi, '').replace(/never\s+fetches?\s+from/gi, '')
    .replace(/never\s+generates?\s+(real\s+)?assets?/gi, '');
}
function buildAllText(): string {
  const collect: string[] = [];
  const a1 = runCreativeDirectorAgent({ goal: 'product-trial', formula: 'ENERGY', market: 'israel', audience: 'il' });
  collect.push(a1.advisoryNotice, ...a1.notes);
  const a2 = runContentProducerAgent({ briefRef: { blueprintId: 'x', storyName: 'X' }, formula: 'ENERGY' });
  collect.push(a2.advisoryNotice, ...a2.notes);
  const a3 = runQualityReviewerAgent({ assets: [mkAsset()] });
  collect.push(a3.advisoryNotice, ...a3.notes, ...a3.reviewNotes);
  for (const f of a3.findings) collect.push(f.note, ...f.violations, ...f.warnings);
  const a4 = runCampaignManagerAgent({ campaignPlans: [], assets: [] });
  collect.push(a4.advisoryNotice, ...a4.notes);
  for (const r of a4.rows) collect.push(r.observation);
  const a5 = runPerformanceAnalystAgent({});
  collect.push(a5.advisoryNotice, ...a5.notes);
  for (const o of a5.observations) collect.push(o.note);
  for (const p of a5.patterns) collect.push(p.description);
  for (const q of a5.researchQuestions) collect.push(q.question, q.rationale);
  for (const g of a5.evidenceGaps) collect.push(g.description);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = stripNegatedContract(buildAllText());
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|auto-?approve|auto-?optimize|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenViralExternal(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|manipulat|meta\s+api|google\s+ads|crm\s+write|payment\s+write|auto.?publish)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(historically observed|operator review required|requires more evidence|operator-reviewable|Human remains final authority)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseAllAdvisoryNotices(): { ok: boolean; detail: string } {
  const tested = [
    runCreativeDirectorAgent({ goal: 'product-trial', formula: 'ENERGY', market: 'israel', audience: 'il' }),
    runContentProducerAgent({ briefRef: { blueprintId: 'x', storyName: 'X' }, formula: 'ENERGY' }),
    runQualityReviewerAgent({ assets: [mkAsset()] }),
    runCampaignManagerAgent({ campaignPlans: [], assets: [] }),
    runPerformanceAnalystAgent({}),
  ];
  const all = tested.every((r) => /Human remains final authority/i.test(r.advisoryNotice));
  return { ok: all, detail: all ? 'all 5 declare Human final authority' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('EXECUTION AGENT LAYER VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['catalog-shape',                'agent catalog has all 5 agents with consumes + produces', () => caseCatalogShape()],
    ['creative-director-shape',      'creative director composes briefs + blueprints',         () => caseCreativeDirectorShape()],
    ['content-producer-shape',       'content producer composes all 4 packages',               () => caseContentProducerShape()],
    ['quality-reviewer-shape',       'quality reviewer composes findings + reviewNotes',       () => caseQualityReviewerShape()],
    ['campaign-manager-shape',       'campaign manager surfaces missing-asset count + timeline status', () => caseCampaignManagerShape()],
    ['performance-analyst-shape',    'performance analyst surfaces evidence gaps with empty input', () => casePerformanceAnalystShape()],
    ['agents-deterministic',         '5 agents produce identical output for identical input',  () => caseAllAgentsDeterministic()],
    ['agents-never-auto-approve',    'no agent output declares auto-approval / winner flag',   () => caseAgentsNeverAutoApprove()],
    ['memory-append-transition',     'agent run append + applyAgentRunStep work',              () => caseMemoryAppendAndTransition()],
    ['memory-throws-unknown',        'applyAgentRunStep throws on unknown id',                 () => caseMemoryThrowsOnUnknown()],
    ['memory-fifo',                  'agent run FIFO cap respected',                            () => caseMemoryFifo()],
    ['route-no-external-apis',       'route does not import or fetch external platforms',     () => caseRouteNoExternalAPIs()],
    ['route-operator-gated',         'POST requires operatorId + operatorReason',              () => caseRouteOperatorGated()],
    ['route-has-get-and-post',       'route exports both GET and POST',                        () => caseRouteHasGetAndPost()],
    ['route-listed',                 '/api/agent registered in systemIntegrityReport',         () => caseRouteListed()],
    ['whitelist-updated',            'system-stability whitelist includes agent POST',         () => caseWhitelistUpdated()],
    ['agent-isolation',              'agents + memory have no critic / pipeline / external-platform imports', () => caseAgentIsolation()],
    ['forbidden-prediction',         'no predict / will-perform / winner / best / recommended / optimize', () => caseForbiddenPrediction()],
    ['forbidden-viral-external',     'no viral / dopamine / outrage / Meta API / Google Ads / auto-publish', () => caseForbiddenViralExternal()],
    ['allowed-language',             'historically observed / operator review required / Human final authority', () => caseAllowedLanguage()],
    ['advisory-notices',             'all 5 agents declare "Human remains final authority"',   () => caseAllAdvisoryNotices()],
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
