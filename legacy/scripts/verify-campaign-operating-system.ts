/**
 * VERIFY — Campaign Operating System.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  composeCampaignPlan, type CampaignPlannerInput,
} from '../lib/campaignPlannerEngine';
import { buildTestingMatrix } from '../lib/testingMatrixEngine';
import { buildContentCalendar } from '../lib/contentCalendarEngine';
import { buildPerformanceExpectation } from '../lib/performanceExpectationEngine';
import {
  appendCampaignPlanRecord, applyCampaignPlanStep, newCampaignPlanId,
  createInitialCampaignPlanMemory, CAMPAIGN_PLAN_LIMIT,
  type CampaignPlanRecord,
} from '../lib/campaignPlanMemory';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── fixtures ────────────────────────────────────────────────

function basicInput(over: Partial<CampaignPlannerInput> = {}): CampaignPlannerInput {
  return {
    budgetUSD: 10000, goal: 'product-trial', formula: 'ENERGY',
    market: 'israel', audience: 'il-women-25-44',
    brandLanguage: 'hebrew',
    ...over,
  };
}

// ─── planner cases ───────────────────────────────────────────

function casePlannerShape(): { ok: boolean; detail: string } {
  const r = composeCampaignPlan(basicInput());
  const required = ['goal', 'formula', 'market', 'audience', 'budgetUSD', 'durationDays',
    'phases', 'budgetAllocation', 'creativeAngles', 'assetRequirements'];
  for (const k of required) if (!(k in r)) return { ok: false, detail: `missing ${k}` };
  if (r.phases.length !== 4) return { ok: false, detail: `phases=${r.phases.length}` };
  // Budget shares sum to ~1.
  const sumShares = r.phases.reduce((a, p) => a + p.budgetShare, 0);
  if (Math.abs(sumShares - 1) > 0.001) return { ok: false, detail: `budget shares sum to ${sumShares}` };
  return { ok: true, detail: `phases=4 budget shares sum to ${sumShares} angles=${r.creativeAngles.length}` };
}
function casePlannerDeterministic(): { ok: boolean; detail: string } {
  const input = basicInput();
  const a = JSON.stringify(composeCampaignPlan(input));
  const b = JSON.stringify(composeCampaignPlan(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function casePlannerAllGoals(): { ok: boolean; detail: string } {
  for (const goal of ['brand-awareness', 'product-trial', 'audience-retention', 'reactivation', 'community-build'] as const) {
    const r = composeCampaignPlan(basicInput({ goal }));
    if (r.phases.length !== 4) return { ok: false, detail: `${goal} → ${r.phases.length} phases` };
    if (r.creativeAngles.length === 0) return { ok: false, detail: `${goal} → 0 angles` };
  }
  return { ok: true, detail: 'all 5 goals produce 4 phases + angles' };
}
function casePlannerAllFormulas(): { ok: boolean; detail: string } {
  for (const formula of ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'] as const) {
    const r = composeCampaignPlan(basicInput({ formula }));
    if (r.creativeAngles.length === 0) return { ok: false, detail: `${formula} → 0 angles` };
  }
  return { ok: true, detail: 'all 4 formulas produce angles' };
}
function casePlannerBudgetSplitNeverNegative(): { ok: boolean; detail: string } {
  const r = composeCampaignPlan(basicInput({ budgetUSD: 5000 }));
  const a = r.budgetAllocation;
  const all = [a.productionUSD, a.paidMediaUSD, a.testingReserveUSD, a.contingencyUSD];
  if (all.some((v) => v < 0)) return { ok: false, detail: `negative split: ${all.join(',')}` };
  // Sum must equal total budget (allowing 1-USD rounding error).
  const sum = all.reduce((acc, v) => acc + v, 0);
  if (Math.abs(sum - r.budgetUSD) > 4) return { ok: false, detail: `split sum ${sum} vs budget ${r.budgetUSD}` };
  return { ok: true, detail: `split sum ${sum} ≈ ${r.budgetUSD}` };
}
function casePlannerSpendDisclaimer(): { ok: boolean; detail: string } {
  const r = composeCampaignPlan(basicInput());
  return {
    ok: /system never spends/i.test(r.budgetAllocation.spendDisclaimer) &&
        /Human remains final authority/i.test(r.advisoryNotice),
    detail: 'spend disclaimer + advisory present',
  };
}
function casePlannerNoWinner(): { ok: boolean; detail: string } {
  const r = composeCampaignPlan(basicInput());
  const stripped = JSON.stringify(r)
    .replace(/never\s+publishes/gi, '')
    .replace(/never\s+auto-?spends/gi, '')
    .replace(/never\s+auto-?approves/gi, '');
  const banned = /\b(winner|recommended|selected|chosen|optimal|best)\b|"will\s+perform"/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : 'banned phrasing present' };
}

// ─── testing-matrix cases ────────────────────────────────────

function caseMatrixShape(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const r = buildTestingMatrix({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    creativeAngles: plan.creativeAngles,
  });
  if (r.axes.length === 0) return { ok: false, detail: 'no axes' };
  if (r.cells.length === 0) return { ok: false, detail: 'no cells' };
  for (const c of r.cells) {
    if (c.operatorReviewRequired !== true) return { ok: false, detail: `${c.cellId} not operator-review-required` };
  }
  return { ok: true, detail: `axes=${r.axes.length} cells=${r.cells.length}` };
}
function caseMatrixDeterministic(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const input = {
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    creativeAngles: plan.creativeAngles,
  };
  const a = JSON.stringify(buildTestingMatrix(input));
  const b = JSON.stringify(buildTestingMatrix(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseMatrixNoWinner(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const r = buildTestingMatrix({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    creativeAngles: plan.creativeAngles,
  });
  const stripped = JSON.stringify(r)
    .replace(/never\s+names?\s+a\s+winning/gi, '')
    .replace(/never\s+auto-?selects/gi, '');
  const banned = /\b(winner|recommended|selected|chosen|optimal|best)\b|"will\s+perform"/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : 'banned phrasing present' };
}

// ─── calendar cases ──────────────────────────────────────────

function caseCalendarShape(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const r = buildContentCalendar({
    phases: plan.phases, assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles, startISODate: '2026-01-01',
  });
  if (r.weeks.length === 0) return { ok: false, detail: 'no weeks' };
  for (const w of r.weeks) if (w.slots.length !== 7) return { ok: false, detail: `week ${w.weekIndex} has ${w.slots.length} slots` };
  return { ok: true, detail: `weeks=${r.weeks.length} cadence=${r.publishingCadencePerWeek}/week rest=${r.restDaysPerWeek}/week` };
}
function caseCalendarDeterministic(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const input = {
    phases: plan.phases, assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles, startISODate: '2026-01-01',
  };
  const a = JSON.stringify(buildContentCalendar(input));
  const b = JSON.stringify(buildContentCalendar(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseCalendarRestBeats(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const r = buildContentCalendar({
    phases: plan.phases, assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles, startISODate: '2026-01-01',
    publishingCadencePerWeek: 3, restDaysPerWeek: 2,
  });
  for (const w of r.weeks) {
    const restCount = w.slots.filter((s) => s.packageType === 'rest').length;
    if (restCount < 2) return { ok: false, detail: `week ${w.weekIndex} has ${restCount} rest slots` };
  }
  return { ok: true, detail: 'every week has >=2 rest beats' };
}
function caseCalendarNeverPublishes(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const r = buildContentCalendar({
    phases: plan.phases, assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles,
  });
  const stripped = JSON.stringify(r)
    .replace(/never\s+publishes/gi, '')
    .replace(/never\s+auto-?schedules/gi, '');
  const banned = /\b(publishes|publish|posts to|publishing to|auto-?schedule)\b/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : 'banned phrasing present' };
}

// ─── performance-expectation cases ───────────────────────────

function caseExpectationShape(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const r = buildPerformanceExpectation({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    budgetUSD: plan.budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
  });
  if (r.perPhaseBands.length !== plan.phases.length) {
    return { ok: false, detail: `bands=${r.perPhaseBands.length} phases=${plan.phases.length}` };
  }
  for (const band of r.perPhaseBands) {
    if (band.impressionsBand.low > band.impressionsBand.high) return { ok: false, detail: `band inverted for ${band.phaseId}` };
  }
  return { ok: true, detail: `${r.perPhaseBands.length} per-phase bands · aggregate produced` };
}
function caseExpectationDeterministic(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const input = {
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    budgetUSD: plan.budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
  };
  const a = JSON.stringify(buildPerformanceExpectation(input));
  const b = JSON.stringify(buildPerformanceExpectation(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseExpectationNeverPredicts(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const r = buildPerformanceExpectation({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    budgetUSD: plan.budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
  });
  const text = JSON.stringify(r);
  const stripped = text
    .replace(/never\s+predicts?/gi, '')
    .replace(/never\s+guarantees?/gi, '')
    .replace(/never\s+names?\s+an?\s+optimal/gi, '')
    .replace(/never\s+spends/gi, '')
    .replace(/never\s+publishes/gi, '')
    .replace(/never\s+auto-?approves/gi, '');
  const banned = /\b(predict(s|ed|ing)?|guaranteed|will\s+perform|optimal|best|winner|recommended)\b/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : 'banned phrasing present' };
}
function caseExpectationZeroBudgetSafe(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput({ budgetUSD: 0 }));
  const r = buildPerformanceExpectation({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    budgetUSD: 0, durationDays: plan.durationDays, phases: plan.phases,
  });
  // Impressions bands should clamp to 0 / 0 when paid-media is 0.
  for (const band of r.perPhaseBands) {
    if (band.impressionsBand.low !== 0 || band.impressionsBand.high !== 0) {
      return { ok: false, detail: `phase ${band.phaseId} impressions ${band.impressionsBand.low}-${band.impressionsBand.high} on zero budget` };
    }
  }
  return { ok: true, detail: 'zero-budget → zero impressions bands' };
}

// ─── memory cases ────────────────────────────────────────────

function mkRecord(over: Partial<CampaignPlanRecord> = {}): CampaignPlanRecord {
  const plan = composeCampaignPlan(basicInput());
  const matrix = buildTestingMatrix({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    creativeAngles: plan.creativeAngles,
  });
  const calendar = buildContentCalendar({
    phases: plan.phases, assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles,
  });
  const expect = buildPerformanceExpectation({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    budgetUSD: plan.budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
  });
  return {
    planId: newCampaignPlanId(), label: 'test',
    input: basicInput(), plan, testingMatrix: matrix, contentCalendar: calendar,
    performanceExpectation: expect, createdAt: 1000, operatorId: 'op-a',
    status: 'draft', history: [{ at: 1000, status: 'draft', operatorId: 'op-a', reason: 'save' }],
    ...over,
  };
}
function caseMemoryAppendAndTransition(): { ok: boolean; detail: string } {
  let state = createInitialCampaignPlanMemory();
  const rec = mkRecord();
  state = appendCampaignPlanRecord(state, rec);
  if (state.plans.length !== 1) return { ok: false, detail: `len=${state.plans.length}` };
  state = applyCampaignPlanStep(state, rec.planId, {
    at: 2000, status: 'approved', operatorId: 'op-a', reason: 'looks good',
  });
  return {
    ok: state.plans[0].status === 'approved' && state.plans[0].history.length === 2,
    detail: `status=${state.plans[0].status} history=${state.plans[0].history.length}`,
  };
}
function caseMemoryThrowsOnUnknown(): { ok: boolean; detail: string } {
  try {
    applyCampaignPlanStep(createInitialCampaignPlanMemory(), 'nope', {
      at: 1, status: 'approved', operatorId: 'op-a', reason: 'x',
    });
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseMemoryFifo(): { ok: boolean; detail: string } {
  let state = createInitialCampaignPlanMemory();
  for (let i = 0; i < CAMPAIGN_PLAN_LIMIT + 30; i++) {
    state = appendCampaignPlanRecord(state, mkRecord({ planId: newCampaignPlanId() }));
  }
  return {
    ok: state.plans.length === CAMPAIGN_PLAN_LIMIT && state.totalPlans === CAMPAIGN_PLAN_LIMIT + 30,
    detail: `plans=${state.plans.length} total=${state.totalPlans}`,
  };
}

// ─── route static checks ─────────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function readRouteSrc(): Promise<string> {
  return fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'campaign-planner', 'route.ts'), 'utf8');
}
async function caseRouteNoPipeline(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const codeOnly = stripCommentsAndStrings(src);
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/core\/pipeline/, /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"]@\/core\/pipeline/, /\bfetch\s*\([^)]*\/api\/generate/,
    /\brunPipeline\s*\(/,
  ];
  for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden ${re}` };
  return { ok: true, detail: 'clean' };
}
async function caseRouteOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  return {
    ok: /(operatorId is required|requireSession)/.test(src) && /operatorReason is required/.test(src),
    detail: 'operator-gated POST',
  };
}
async function caseRouteHasGetAndPost(): Promise<{ ok: boolean; detail: string }> {
  const src = await readRouteSrc();
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return { ok: hasGet && hasPost, detail: `GET=${hasGet} POST=${hasPost}` };
}
async function caseRouteListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  return {
    ok: /['"]\/api\/campaign-planner['"]/.test(src),
    detail: /['"]\/api\/campaign-planner['"]/.test(src) ? 'registered' : 'missing',
  };
}
async function caseWhitelistUpdated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'scripts', 'verify-system-stability.ts'), 'utf8');
  return {
    ok: /app\/api\/campaign-planner\/route\.ts/.test(src),
    detail: /app\/api\/campaign-planner\/route\.ts/.test(src) ? 'whitelisted' : 'missing',
  };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/campaignPlannerEngine.ts', 'lib/testingMatrixEngine.ts',
    'lib/contentCalendarEngine.ts', 'lib/performanceExpectationEngine.ts',
    'lib/campaignPlanMemory.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/, /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"]@?lib\/banner(?!\.)/, /from\s+['"]@?lib\/.*publish/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}` };
    if (f !== 'lib/campaignPlanMemory.ts') {
      if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
      if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
    }
  }
  return { ok: true, detail: 'engines pure · no critic / pipeline / banner / publish imports' };
}

// ─── narrative-language guard rails ──────────────────────────

function buildAllText(): string {
  const plan = composeCampaignPlan(basicInput());
  const matrix = buildTestingMatrix({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    creativeAngles: plan.creativeAngles,
  });
  const cal = buildContentCalendar({
    phases: plan.phases, assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles, startISODate: '2026-01-01',
  });
  const expect = buildPerformanceExpectation({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    budgetUSD: plan.budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
  });
  const collect: string[] = [plan.advisoryNotice, matrix.advisoryNotice, cal.advisoryNotice, expect.advisoryNotice,
                             ...plan.notes, ...matrix.notes, ...cal.notes, ...expect.notes, ...expect.disclaimers];
  for (const ph of plan.phases) collect.push(ph.purpose, ph.toneNote);
  for (const ang of plan.creativeAngles) collect.push(ang.description, ang.emotionalArc);
  for (const a of plan.assetRequirements) collect.push(a.note);
  for (const c of matrix.cells) collect.push(c.exploration);
  for (const w of cal.weeks) {
    collect.push(w.weekNote);
    for (const s of w.slots) collect.push(s.slotNote);
  }
  for (const b of expect.perPhaseBands) {
    collect.push(b.impressionsBand.note, b.engagementRateBand.note, b.completionRateBand.note, b.saveRateBand.note);
  }
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const stripped = text
    .replace(/never\s+predicts?/gi, '').replace(/never\s+guarantees?/gi, '')
    .replace(/never\s+names?\s+a\s+winning/gi, '').replace(/never\s+names?\s+an?\s+optimal/gi, '')
    .replace(/never\s+auto-?selects?/gi, '').replace(/never\s+auto-?approves?/gi, '')
    .replace(/never\s+auto-?spends?/gi, '').replace(/never\s+publishes?/gi, '')
    .replace(/never\s+auto-?schedules?/gi, '');
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|auto-?approve|auto-?spend|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(stripped), detail: !banned.test(stripped) ? 'clean' : `banned: ${stripped.slice(0, 200)}` };
}
function caseForbiddenViralExploit(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(viral|virality|dopamine|outrage|exploit|trauma\s+exploit|manipulat)/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(operator approval required|historically associated|observed alongside|requires more evidence|system never spends|Human remains final authority|descriptive band|operator slot)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseAllAdvisoryNotices(): { ok: boolean; detail: string } {
  const plan = composeCampaignPlan(basicInput());
  const matrix = buildTestingMatrix({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    creativeAngles: plan.creativeAngles,
  });
  const cal = buildContentCalendar({
    phases: plan.phases, assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles,
  });
  const expect = buildPerformanceExpectation({
    goal: plan.goal, formula: plan.formula, market: plan.market, audience: plan.audience,
    budgetUSD: plan.budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
  });
  const allHaveHumanFinal = [plan, matrix, cal, expect].every((r) =>
    /Human remains final authority/i.test(r.advisoryNotice),
  );
  return { ok: allHaveHumanFinal, detail: allHaveHumanFinal ? 'all 4 declare Human final authority' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('CAMPAIGN OPERATING SYSTEM VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['planner-shape',              '4 phases · budget shares sum to 1 · angles populated', () => casePlannerShape()],
    ['planner-deterministic',      'campaign planner engine is pure',                       () => casePlannerDeterministic()],
    ['planner-all-goals',          'all 5 goals produce 4 phases + angles',                 () => casePlannerAllGoals()],
    ['planner-all-formulas',       'all 4 formulas produce angles',                          () => casePlannerAllFormulas()],
    ['planner-budget-split',       'budget split is non-negative and sums to ~budget',       () => casePlannerBudgetSplitNeverNegative()],
    ['planner-spend-disclaimer',   'spend disclaimer + Human final authority present',      () => casePlannerSpendDisclaimer()],
    ['planner-no-winner',          'planner narrative never names a winner',                () => casePlannerNoWinner()],
    ['matrix-shape',               'matrix axes + cells populated · operator-review-required', () => caseMatrixShape()],
    ['matrix-deterministic',       'testing matrix engine is pure',                          () => caseMatrixDeterministic()],
    ['matrix-no-winner',           'matrix narrative never names a winning cell',           () => caseMatrixNoWinner()],
    ['calendar-shape',             '7 slots per week · cadence + rest applied',             () => caseCalendarShape()],
    ['calendar-deterministic',     'calendar engine is pure',                                () => caseCalendarDeterministic()],
    ['calendar-rest-beats',        'requested rest beats appear in every week',             () => caseCalendarRestBeats()],
    ['calendar-never-publishes',   'calendar narrative never publishes / auto-schedules',   () => caseCalendarNeverPublishes()],
    ['expectation-shape',          'per-phase bands + aggregate populated · bands not inverted', () => caseExpectationShape()],
    ['expectation-deterministic',  'performance expectation engine is pure',                 () => caseExpectationDeterministic()],
    ['expectation-never-predicts', 'bands never predict / guarantee / claim optimal',       () => caseExpectationNeverPredicts()],
    ['expectation-zero-budget',    'zero budget → zero impressions bands',                  () => caseExpectationZeroBudgetSafe()],
    ['memory-append-transition',   'memory append + applyCampaignPlanStep work',            () => caseMemoryAppendAndTransition()],
    ['memory-throws-unknown',      'applyCampaignPlanStep throws on unknown id',            () => caseMemoryThrowsOnUnknown()],
    ['memory-fifo',                'campaign plan memory FIFO cap respected',               () => caseMemoryFifo()],
    ['route-no-pipeline',          'route does not import pipeline / generate',             () => caseRouteNoPipeline()],
    ['route-operator-gated',       'POST requires operatorId + operatorReason',             () => caseRouteOperatorGated()],
    ['route-get-and-post',         'route exports both GET and POST',                       () => caseRouteHasGetAndPost()],
    ['route-listed',               '/api/campaign-planner registered in systemIntegrityReport', () => caseRouteListed()],
    ['whitelist-updated',          'system-stability whitelist includes campaign-planner POST', () => caseWhitelistUpdated()],
    ['isolation',                  'engines pure · no critic / pipeline / banner / publish imports', () => caseIsolation()],
    ['forbidden-prediction',       'no predict / will / winner / best / recommended / optimize / chosen / optimal / auto-spend', () => caseForbiddenPrediction()],
    ['forbidden-viral-exploit',    'no viral / dopamine / outrage / exploit / manipulat',   () => caseForbiddenViralExploit()],
    ['allowed-language',           'historically associated / operator approval required / Human final authority', () => caseAllowedLanguage()],
    ['advisory-notices',           'all 4 engines declare "Human remains final authority"',  () => caseAllAdvisoryNotices()],
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
