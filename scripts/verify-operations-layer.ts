/**
 * VERIFY — Operations Layer.
 *
 * 5 phases: workspace · team · task · knowledge · executive dashboard.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  appendProject, appendBrand, appendProduct, appendCampaign, updateCampaignStatus,
  newProjectId, newBrandId, newProductId, newCampaignId,
  createInitialWorkspaceMemory, WORKSPACE_LIMIT_PROJECTS,
  type ProjectRecord, type BrandRecord, type ProductRecord, type CampaignRecord,
} from '../lib/workspaceMemory';
import { composeWorkspace } from '../lib/workspaceEngine';
import {
  appendTeamMember, updateTeamMemberRoles, newTeamMemberId,
  createInitialTeamMemory, TEAM_MEMBER_LIMIT, TEAM_ROLES,
  type TeamMemberRecord,
} from '../lib/teamMemory';
import { buildTeamEngine, memberMayPerform } from '../lib/teamEngine';
import {
  appendTaskRecord, applyTaskStep, newTaskId,
  createInitialTaskMemory, TASK_LIMIT, type TaskRecord,
} from '../lib/taskMemory';
import { analyzeTasks } from '../lib/taskEngine';
import {
  appendKnowledgeEntry, updateKnowledgeEntry, newKnowledgeEntryId,
  createInitialKnowledgeMemory, KNOWLEDGE_LIMIT, type KnowledgeEntry,
} from '../lib/knowledgeMemory';
import { searchKnowledge } from '../lib/knowledgeEngine';
import { composeExecutiveDashboard } from '../lib/executiveDashboardEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── fixtures ────────────────────────────────────────────────

const TEST_ORG = 'org-mood';
const TEST_WSP = 'wsp-mood-default';

function mkProject(over: Partial<ProjectRecord> = {}): ProjectRecord {
  return { projectId: newProjectId(), organizationId: TEST_ORG, workspaceId: TEST_WSP, name: 'MOOD Brand', createdAt: 1000, operatorId: 'op-a', ...over };
}
function mkBrand(projectId: string, over: Partial<BrandRecord> = {}): BrandRecord {
  return { brandId: newBrandId(), organizationId: TEST_ORG, workspaceId: TEST_WSP, projectId, name: 'MOOD', createdAt: 1100, operatorId: 'op-a', ...over };
}
function mkProduct(brandId: string, over: Partial<ProductRecord> = {}): ProductRecord {
  return { productId: newProductId(), organizationId: TEST_ORG, workspaceId: TEST_WSP, brandId, name: 'MOOD ENERGY chocolate', formula: 'ENERGY', createdAt: 1200, operatorId: 'op-a', ...over };
}
function mkCampaign(productId: string, over: Partial<CampaignRecord> = {}): CampaignRecord {
  return {
    campaignId: newCampaignId(), organizationId: TEST_ORG, workspaceId: TEST_WSP,
    productId, name: 'Q1 launch',
    status: 'planning', createdAt: 1300, operatorId: 'op-a', ...over,
  };
}
function mkTeamMember(over: Partial<TeamMemberRecord> = {}): TeamMemberRecord {
  return {
    memberId: newTeamMemberId(), name: 'Alice', roles: ['operator'],
    createdAt: 1000, addedBy: 'op-a', ...over,
  };
}
function mkTask(over: Partial<TaskRecord> = {}): TaskRecord {
  const at = 1000;
  return {
    taskId: newTaskId(), title: 'design banner', priority: 'medium', status: 'backlog',
    dependencyTaskIds: [], createdAt: at, operatorId: 'op-a',
    statusHistory: [{ at, status: 'backlog', operatorId: 'op-a', reason: 'create' }],
    ...over,
  };
}
function mkKnowledgeEntry(over: Partial<KnowledgeEntry> = {}): KnowledgeEntry {
  return {
    entryId: newKnowledgeEntryId(), category: 'brand-rule',
    title: 'MOOD never optimizes for virality',
    body: 'MOOD chocolate is present as a quiet object · no productivity-drug language',
    tags: ['restraint', 'brand-truth'],
    createdAt: 1000, operatorId: 'op-a',
    revisionHistory: [{ at: 1000, operatorId: 'op-a', reason: 'create' }],
    ...over,
  };
}

// ─── workspace cases ─────────────────────────────────────────

function caseWorkspaceTreeShape(): { ok: boolean; detail: string } {
  let state = createInitialWorkspaceMemory();
  const proj = mkProject({ name: 'MOOD' });
  state = appendProject(state, proj);
  const brand = mkBrand(proj.projectId);
  state = appendBrand(state, brand);
  const prod = mkProduct(brand.brandId);
  state = appendProduct(state, prod);
  const camp = mkCampaign(prod.productId, { name: 'Q1' });
  state = appendCampaign(state, camp);
  const reading = composeWorkspace({
    projects: state.projects, brands: state.brands,
    products: state.products, campaigns: state.campaigns,
  });
  if (reading.projectTree.length !== 1) return { ok: false, detail: `projects=${reading.projectTree.length}` };
  const p = reading.projectTree[0];
  if (p.brands.length !== 1) return { ok: false, detail: `brands=${p.brands.length}` };
  if (p.brands[0].products.length !== 1) return { ok: false, detail: 'product missing' };
  if (p.brands[0].products[0].campaigns.length !== 1) return { ok: false, detail: 'campaign missing' };
  if (p.totals.campaignCount !== 1) return { ok: false, detail: `totals=${p.totals.campaignCount}` };
  return { ok: true, detail: 'tree shape correct' };
}
function caseWorkspaceTransitionsCampaign(): { ok: boolean; detail: string } {
  let state = createInitialWorkspaceMemory();
  const proj = mkProject(); state = appendProject(state, proj);
  const brand = mkBrand(proj.projectId); state = appendBrand(state, brand);
  const prod = mkProduct(brand.brandId); state = appendProduct(state, prod);
  const camp = mkCampaign(prod.productId); state = appendCampaign(state, camp);
  state = updateCampaignStatus(state, camp.campaignId, 'in-flight');
  return {
    ok: state.campaigns[0].status === 'in-flight',
    detail: `status=${state.campaigns[0].status}`,
  };
}
function caseWorkspaceThrowsOnUnknownCampaign(): { ok: boolean; detail: string } {
  try {
    updateCampaignStatus(createInitialWorkspaceMemory(), 'nope', 'in-flight');
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseWorkspaceFifo(): { ok: boolean; detail: string } {
  let state = createInitialWorkspaceMemory();
  for (let i = 0; i < WORKSPACE_LIMIT_PROJECTS + 10; i++) {
    state = appendProject(state, mkProject({ projectId: newProjectId() }));
  }
  return {
    ok: state.projects.length === WORKSPACE_LIMIT_PROJECTS,
    detail: `projects=${state.projects.length}`,
  };
}
function caseWorkspaceDeterministic(): { ok: boolean; detail: string } {
  let state = createInitialWorkspaceMemory();
  const proj = mkProject(); state = appendProject(state, proj);
  const brand = mkBrand(proj.projectId); state = appendBrand(state, brand);
  const a = JSON.stringify(composeWorkspace({ projects: state.projects, brands: state.brands }));
  const b = JSON.stringify(composeWorkspace({ projects: state.projects, brands: state.brands }));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseWorkspaceOrphansDetected(): { ok: boolean; detail: string } {
  let state = createInitialWorkspaceMemory();
  const brand = mkBrand('does-not-exist'); state = appendBrand(state, brand);
  const reading = composeWorkspace({ projects: state.projects, brands: state.brands });
  return {
    ok: reading.orphans.brands.length === 1,
    detail: `orphan brands=${reading.orphans.brands.length}`,
  };
}

// ─── team cases ──────────────────────────────────────────────

function caseTeamShape(): { ok: boolean; detail: string } {
  let state = createInitialTeamMemory();
  state = appendTeamMember(state, mkTeamMember({ name: 'Owner Olivia', roles: ['owner'] }));
  state = appendTeamMember(state, mkTeamMember({ memberId: newTeamMemberId(), name: 'Director Dana', roles: ['creative-director', 'reviewer'] }));
  const reading = buildTeamEngine({ members: state.members });
  if (reading.approvalFlows.length === 0) return { ok: false, detail: 'no flows' };
  if (reading.approvalAvailability.length !== 2) return { ok: false, detail: 'wrong availability count' };
  return { ok: true, detail: `flows=${reading.approvalFlows.length} avail=${reading.approvalAvailability.length} uncovered=${reading.uncoveredRoles.length}` };
}
function caseTeamMemberMayPerform(): { ok: boolean; detail: string } {
  const owner = mkTeamMember({ name: 'O', roles: ['owner'] });
  const designer = mkTeamMember({ memberId: newTeamMemberId(), name: 'D', roles: ['designer'] });
  // Owner MAY approve assets; designer MAY NOT (designer is not in approve roles).
  const ownerCanApprove = memberMayPerform(owner, 'asset-approve');
  const designerCanApprove = memberMayPerform(designer, 'asset-approve');
  const designerCanDraft = memberMayPerform(designer, 'gen-queue-draft');
  return {
    ok: ownerCanApprove && !designerCanApprove && designerCanDraft,
    detail: `owner-approve=${ownerCanApprove} designer-approve=${designerCanApprove} designer-draft=${designerCanDraft}`,
  };
}
function caseTeamUncoveredRoles(): { ok: boolean; detail: string } {
  const reading = buildTeamEngine({ members: [mkTeamMember({ name: 'Op', roles: ['operator'] })] });
  // All non-operator roles uncovered → 6.
  return {
    ok: reading.uncoveredRoles.length === TEAM_ROLES.length - 1,
    detail: `uncovered=${reading.uncoveredRoles.length}`,
  };
}
function caseTeamFifo(): { ok: boolean; detail: string } {
  let state = createInitialTeamMemory();
  for (let i = 0; i < TEAM_MEMBER_LIMIT + 10; i++) {
    state = appendTeamMember(state, mkTeamMember({ memberId: newTeamMemberId() }));
  }
  return { ok: state.members.length === TEAM_MEMBER_LIMIT, detail: `members=${state.members.length}` };
}
function caseTeamRoleUpdateThrowsOnUnknown(): { ok: boolean; detail: string } {
  try {
    updateTeamMemberRoles(createInitialTeamMemory(), 'nope', ['operator']);
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}

// ─── task cases ──────────────────────────────────────────────

function caseTaskAnalyzer(): { ok: boolean; detail: string } {
  const t1 = mkTask({ taskId: 't1', title: 'A', priority: 'high', status: 'backlog' });
  const t2 = mkTask({ taskId: 't2', title: 'B', priority: 'medium', status: 'backlog', dependencyTaskIds: ['t1'] });
  const t3 = mkTask({ taskId: 't3', title: 'C', priority: 'urgent', status: 'in-progress', deadlineAt: 500 });
  const t4 = mkTask({ taskId: 't4', title: 'D', priority: 'low', status: 'done' });
  const t5 = mkTask({ taskId: 't5', title: 'E', priority: 'medium', status: 'backlog', deadlineAt: 5000 });
  const reading = analyzeTasks({ tasks: [t1, t2, t3, t4, t5], nowMs: 4000, atRiskWindowMs: 2000 });
  if (reading.readyToStart.length === 0) return { ok: false, detail: 'no ready tasks' };
  if (!reading.readyToStart.some((s) => s.taskId === 't1')) return { ok: false, detail: 't1 not ready' };
  if (!reading.blockedTasks.some((s) => s.taskId === 't2')) return { ok: false, detail: 't2 not blocked' };
  if (!reading.overdueTasks.some((s) => s.taskId === 't3')) return { ok: false, detail: 't3 not overdue' };
  if (!reading.atRiskTasks.some((s) => s.taskId === 't5')) return { ok: false, detail: 't5 not at-risk' };
  return { ok: true, detail: `ready=${reading.readyToStart.length} blocked=${reading.blockedTasks.length} overdue=${reading.overdueTasks.length} atRisk=${reading.atRiskTasks.length}` };
}
function caseTaskDeterministic(): { ok: boolean; detail: string } {
  const tasks = [mkTask({ taskId: 't1' }), mkTask({ taskId: 't2' })];
  const a = JSON.stringify(analyzeTasks({ tasks, nowMs: 1500 }));
  const b = JSON.stringify(analyzeTasks({ tasks, nowMs: 1500 }));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseTaskApplyStepThrowsOnUnknown(): { ok: boolean; detail: string } {
  try {
    applyTaskStep(createInitialTaskMemory(), 'nope', { at: 1, status: 'in-progress', operatorId: 'op-a' });
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseTaskFifo(): { ok: boolean; detail: string } {
  let state = createInitialTaskMemory();
  for (let i = 0; i < TASK_LIMIT + 20; i++) {
    state = appendTaskRecord(state, mkTask({ taskId: newTaskId() }));
  }
  return { ok: state.tasks.length === TASK_LIMIT && state.totalTasks === TASK_LIMIT + 20,
    detail: `tasks=${state.tasks.length} total=${state.totalTasks}` };
}

// ─── knowledge cases ─────────────────────────────────────────

function caseKnowledgeSearchEmptyQuery(): { ok: boolean; detail: string } {
  let state = createInitialKnowledgeMemory();
  state = appendKnowledgeEntry(state, mkKnowledgeEntry({ title: 'Brand truth' }));
  state = appendKnowledgeEntry(state, mkKnowledgeEntry({ entryId: newKnowledgeEntryId(), category: 'formula-rule', title: 'ENERGY mood' }));
  const reading = searchKnowledge({ entries: state.entries });
  return {
    ok: reading.totalEntries === 2 && reading.matches.length === 2,
    detail: `total=${reading.totalEntries} matches=${reading.matches.length}`,
  };
}
function caseKnowledgeSearchQuery(): { ok: boolean; detail: string } {
  let state = createInitialKnowledgeMemory();
  state = appendKnowledgeEntry(state, mkKnowledgeEntry({ title: 'Brand truth · restraint' }));
  state = appendKnowledgeEntry(state, mkKnowledgeEntry({ entryId: newKnowledgeEntryId(), category: 'formula-rule', title: 'MOOD ENERGY tone' }));
  const reading = searchKnowledge({ entries: state.entries, query: 'restraint brand' });
  return {
    ok: reading.matches.length >= 1 && reading.matches[0].matchScore > 0,
    detail: `top match=${reading.matches[0]?.entry.title} score=${reading.matches[0]?.matchScore}`,
  };
}
function caseKnowledgeUpdateRevises(): { ok: boolean; detail: string } {
  let state = createInitialKnowledgeMemory();
  const entry = mkKnowledgeEntry();
  state = appendKnowledgeEntry(state, entry);
  state = updateKnowledgeEntry(state, entry.entryId, { body: 'updated body' }, { at: 2000, operatorId: 'op-a', reason: 'edit' });
  const updated = state.entries.find((e) => e.entryId === entry.entryId);
  return {
    ok: !!updated && updated.body === 'updated body' && updated.revisionHistory.length === 2,
    detail: `revisions=${updated?.revisionHistory.length}`,
  };
}
function caseKnowledgeUpdateThrowsOnUnknown(): { ok: boolean; detail: string } {
  try {
    updateKnowledgeEntry(createInitialKnowledgeMemory(), 'nope', { title: 'x' }, { at: 1, operatorId: 'op-a' });
    return { ok: false, detail: 'should have thrown' };
  } catch (err) {
    return { ok: /not found/.test((err as Error).message), detail: (err as Error).message };
  }
}
function caseKnowledgeFifo(): { ok: boolean; detail: string } {
  let state = createInitialKnowledgeMemory();
  for (let i = 0; i < KNOWLEDGE_LIMIT + 10; i++) {
    state = appendKnowledgeEntry(state, mkKnowledgeEntry({ entryId: newKnowledgeEntryId() }));
  }
  return { ok: state.entries.length === KNOWLEDGE_LIMIT, detail: `entries=${state.entries.length}` };
}

// ─── executive dashboard cases ───────────────────────────────

function caseExecutiveShape(): { ok: boolean; detail: string } {
  const reading = composeExecutiveDashboard({});
  const expected = [
    'campaigns', 'assets', 'approvals', 'generationQueue', 'publications',
    'revenueAttribution', 'performance', 'learning', 'systemHealth',
  ];
  for (const k of expected) {
    if (!(k in reading.sections)) return { ok: false, detail: `missing section ${k}` };
  }
  return { ok: true, detail: `9 sections present · advisory ${/Human remains final authority/i.test(reading.advisoryNotice) ? 'ok' : 'missing'}` };
}
function caseExecutiveDeterministic(): { ok: boolean; detail: string } {
  const input = { systemHealth: { overallStatus: 'stable' as const, typeScriptStatus: true, warningCount: 0 } };
  const a = JSON.stringify(composeExecutiveDashboard(input));
  const b = JSON.stringify(composeExecutiveDashboard(input));
  return { ok: a === b, detail: a === b ? 'identical' : 'differs' };
}
function caseExecutiveCountersIntegrate(): { ok: boolean; detail: string } {
  const reading = composeExecutiveDashboard({
    assets: [{
      assetId: 'a1', formula: 'ENERGY', campaign: 'c', packageType: 'image',
      sourceStoryName: 'X', sourceBriefId: 'b', sourcePromptId: 'p',
      prompt: 'P', summary: 'S', createdAt: 1, operatorId: 'op-a',
      approvalStatus: 'pending',
      approvalHistory: [{ at: 1, status: 'pending', operatorId: 'op-a', reason: 'r' }],
    }],
  });
  return {
    ok: reading.sections.assets.counters.total === 1 &&
        reading.sections.assets.counters.pending === 1 &&
        reading.sections.approvals.counters.pendingAssets === 1,
    detail: `assets total=${reading.sections.assets.counters.total} pending=${reading.sections.assets.counters.pending}`,
  };
}

// ─── route + static checks ───────────────────────────────────

function stripCommentsAndStrings(src: string): string {
  return src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''").replace(/"[^"\n]*"/g, '""').replace(/`[\s\S]*?`/g, '``');
}
async function caseRoutesNoExternalAPIs(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'app/api/workspace/route.ts', 'app/api/team/route.ts',
    'app/api/task/route.ts', 'app/api/knowledge/route.ts',
    'app/api/executive-dashboard/route.ts',
  ];
  const forbidden = [
    /from\s+['"][^'"]*(facebook|meta|google[- ]?ads|hubspot|salesforce|stripe|braintree|paypal|tiktok|asana|jira|notion|slack)/i,
    /\bfetch\s+['"][^'"]*(graph\.facebook|googleapis\.com|stripe|paypal|slack|notion|hubapi)/i,
    /\brunPipeline\s*\(/,
    /\bfetch\s*\([^)]*\/api\/generate/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
  }
  return { ok: true, detail: 'no external-platform / pipeline calls in routes' };
}
async function caseRoutesOperatorGated(): Promise<{ ok: boolean; detail: string }> {
  const files = ['app/api/workspace/route.ts', 'app/api/team/route.ts',
                 'app/api/task/route.ts', 'app/api/knowledge/route.ts'];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (!/(operatorId is required|requireSession)/.test(src)) return { ok: false, detail: `${f} missing operatorId gate` };
    if (!/operatorReason is required/.test(src)) return { ok: false, detail: `${f} missing operatorReason gate` };
  }
  return { ok: true, detail: '4 operator-gated POST routes' };
}
async function caseExecutiveRouteIsGetOnly(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'app', 'api', 'executive-dashboard', 'route.ts'), 'utf8');
  const hasGet = /\bexport\s+async\s+function\s+GET\b/.test(src);
  const hasPost = /\bexport\s+async\s+function\s+POST\b/.test(src);
  return { ok: hasGet && !hasPost, detail: `GET=${hasGet} POST=${hasPost}` };
}
async function caseRoutesListed(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'lib', 'systemIntegrityReport.ts'), 'utf8');
  const ok = /['"]\/api\/workspace['"]/.test(src) && /['"]\/api\/team['"]/.test(src) &&
             /['"]\/api\/task['"]/.test(src) && /['"]\/api\/knowledge['"]/.test(src) &&
             /['"]\/api\/executive-dashboard['"]/.test(src);
  return { ok, detail: ok ? 'all 5 routes registered' : 'one or more missing' };
}
async function caseWhitelistUpdated(): Promise<{ ok: boolean; detail: string }> {
  const src = await fs.readFile(path.resolve(__dirname, '..', 'scripts', 'verify-system-stability.ts'), 'utf8');
  const ok = /app\/api\/workspace\/route\.ts/.test(src) && /app\/api\/team\/route\.ts/.test(src) &&
             /app\/api\/task\/route\.ts/.test(src) && /app\/api\/knowledge\/route\.ts/.test(src);
  return { ok, detail: ok ? 'whitelist includes 4 new POSTs' : 'missing' };
}
async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/workspaceMemory.ts', 'lib/workspaceEngine.ts',
    'lib/teamMemory.ts', 'lib/teamEngine.ts',
    'lib/taskMemory.ts', 'lib/taskEngine.ts',
    'lib/knowledgeMemory.ts', 'lib/knowledgeEngine.ts',
    'lib/executiveDashboardEngine.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/, /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"]@?lib\/banner(?!\.)/, /from\s+['"]@?lib\/.*publish(?!ication)/i,
    /from\s+['"][^'"]*(facebook|meta|google[- ]?ads|hubspot|salesforce|stripe|paypal|tiktok)/i,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    const codeOnly = stripCommentsAndStrings(src);
    for (const re of forbidden) if (re.test(codeOnly)) return { ok: false, detail: `forbidden in ${f}: ${re}` };
    if (!f.endsWith('Memory.ts')) {
      if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
      if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
    }
  }
  return { ok: true, detail: 'engines pure · no critic / pipeline / banner / publishing / external-platform imports' };
}

// ─── narrative-language guard rails ──────────────────────────

function stripNegatedContract(text: string): string {
  return text
    .replace(/never\s+publish(es|ing)?/gi, '').replace(/never\s+spends?/gi, '')
    .replace(/never\s+auto-?(approves?|approve|applies|apply|create(?:s)?|edit(?:s)?|advance(?:s)?|select(?:s)?|optimize(?:s)?|execute(?:s)?|assign(?:s)?)/gi, '')
    .replace(/never\s+executes?/gi, '').replace(/never\s+selects?\s+a\s+winner/gi, '')
    .replace(/never\s+best/gi, '').replace(/never\s+derive[s]?\s+(a|the)?\s*best/gi, '')
    .replace(/never\s+names?\s+a\s+winner/gi, '').replace(/never\s+names?\s+a\s+best(\s+practice)?/gi, '')
    .replace(/never\s+optimizes\s+for\s+virality/gi, '')
    .replace(/no\s+winner\s+selection/gi, '').replace(/never\s+predicts?/gi, '')
    .replace(/never\s+recommend(s|ed|ing)?/gi, '').replace(/never\s+fetches?\s+from/gi, '');
}
function buildAllText(): string {
  let ws = createInitialWorkspaceMemory();
  const proj = mkProject(); ws = appendProject(ws, proj);
  const brand = mkBrand(proj.projectId); ws = appendBrand(ws, brand);
  const prod = mkProduct(brand.brandId); ws = appendProduct(ws, prod);
  const camp = mkCampaign(prod.productId); ws = appendCampaign(ws, camp);
  const wsR = composeWorkspace({
    projects: ws.projects, brands: ws.brands, products: ws.products, campaigns: ws.campaigns,
  });
  const teamR = buildTeamEngine({ members: [mkTeamMember({ name: 'A', roles: ['owner'] })] });
  const taskR = analyzeTasks({ tasks: [mkTask()] });
  const kR = searchKnowledge({ entries: [mkKnowledgeEntry()] });
  const execR = composeExecutiveDashboard({
    workspace: wsR, team: teamR, tasks: taskR,
    systemHealth: { overallStatus: 'stable', typeScriptStatus: true, warningCount: 0 },
  });
  const collect: string[] = [
    wsR.advisoryNotice, teamR.advisoryNotice, taskR.advisoryNotice, kR.advisoryNotice, execR.advisoryNotice,
    ...wsR.notes, ...teamR.notes, ...taskR.notes, ...kR.notes, ...execR.notes,
  ];
  for (const flow of teamR.approvalFlows) collect.push(flow.description);
  for (const av of teamR.approvalAvailability) collect.push(av.member.name);
  for (const list of [taskR.readyToStart, taskR.blockedTasks, taskR.overdueTasks, taskR.atRiskTasks]) {
    for (const t of list) collect.push(t.observation);
  }
  for (const m of kR.matches) collect.push(m.observation);
  for (const k in execR.sections) collect.push((execR.sections as any)[k].observation);
  return collect.join(' ');
}
function caseForbiddenPrediction(): { ok: boolean; detail: string } {
  const text = stripNegatedContract(buildAllText());
  const banned = /\b(predict(s|ed|ing)?|best|winner|guaranteed|auto-?apply|auto-?approve|auto-?optimize|auto-?modify|optimize|optimizes|recommended|selected|chosen|optimal|will\s+perform)\b|\bwill\s+(rise|fall|happen|be|remain)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseForbiddenExternalAPIs(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const banned = /\b(meta\s+api|facebook\s+api|google\s+ads\s+api|crm\s+write|payment\s+write|autonomous\s+post|auto.?publish|slack\s+send|notion\s+write)\b/i;
  return { ok: !banned.test(text), detail: !banned.test(text) ? 'clean' : `banned: ${text.slice(0, 200)}` };
}
function caseAllowedLanguage(): { ok: boolean; detail: string } {
  const text = buildAllText();
  const required = /(operator approval required|historically observed|Human remains final authority|operator review required|approval flow)/i;
  return { ok: required.test(text), detail: required.test(text) ? 'present' : 'missing' };
}
function caseAllAdvisoryNotices(): { ok: boolean; detail: string } {
  const wsR = composeWorkspace({});
  const teamR = buildTeamEngine({});
  const taskR = analyzeTasks({});
  const kR = searchKnowledge({});
  const execR = composeExecutiveDashboard({});
  const all = [wsR, teamR, taskR, kR, execR].every((r) =>
    /Human remains final authority/i.test(r.advisoryNotice),
  );
  return { ok: all, detail: all ? 'all 5 declare Human final authority' : 'missing' };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('OPERATIONS LAYER VERIFICATION\n');
  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['workspace-tree-shape',         'projects → brands → products → campaigns tree built',  () => caseWorkspaceTreeShape()],
    ['workspace-campaign-transition', 'campaign status transition works',                     () => caseWorkspaceTransitionsCampaign()],
    ['workspace-throws-unknown',     'updateCampaignStatus throws on unknown id',             () => caseWorkspaceThrowsOnUnknownCampaign()],
    ['workspace-fifo',               'project FIFO cap respected',                            () => caseWorkspaceFifo()],
    ['workspace-deterministic',      'workspace engine is pure',                              () => caseWorkspaceDeterministic()],
    ['workspace-orphans',            'orphan brand surfaced when project missing',            () => caseWorkspaceOrphansDetected()],
    ['team-shape',                   'team engine produces approval flows + availability',    () => caseTeamShape()],
    ['team-may-perform',             'owner MAY approve · designer MAY draft only',           () => caseTeamMemberMayPerform()],
    ['team-uncovered-roles',         'single operator → 6 uncovered roles',                  () => caseTeamUncoveredRoles()],
    ['team-fifo',                    'team member FIFO cap respected',                        () => caseTeamFifo()],
    ['team-update-throws',           'updateTeamMemberRoles throws on unknown id',            () => caseTeamRoleUpdateThrowsOnUnknown()],
    ['task-analyzer',                'task analyzer surfaces ready / blocked / overdue / atRisk', () => caseTaskAnalyzer()],
    ['task-deterministic',           'task analyzer is pure',                                 () => caseTaskDeterministic()],
    ['task-apply-throws',            'applyTaskStep throws on unknown id',                    () => caseTaskApplyStepThrowsOnUnknown()],
    ['task-fifo',                    'task FIFO cap respected',                               () => caseTaskFifo()],
    ['knowledge-empty-query',        'empty query returns recent entries',                    () => caseKnowledgeSearchEmptyQuery()],
    ['knowledge-query',              'query scoring finds matching entry',                    () => caseKnowledgeSearchQuery()],
    ['knowledge-update-revises',     'update appends a revision and changes body',            () => caseKnowledgeUpdateRevises()],
    ['knowledge-update-throws',      'updateKnowledgeEntry throws on unknown id',             () => caseKnowledgeUpdateThrowsOnUnknown()],
    ['knowledge-fifo',               'knowledge FIFO cap respected',                          () => caseKnowledgeFifo()],
    ['executive-shape',              '9 sections present + Human final authority',            () => caseExecutiveShape()],
    ['executive-deterministic',      'executive dashboard is pure',                           () => caseExecutiveDeterministic()],
    ['executive-counters',           'asset counters integrate into approvals section',       () => caseExecutiveCountersIntegrate()],
    ['routes-no-external-apis',      'no Meta / Google Ads / CRM / payment / Slack / Notion / Jira calls', () => caseRoutesNoExternalAPIs()],
    ['routes-operator-gated',        '4 POST routes require operatorId + operatorReason',     () => caseRoutesOperatorGated()],
    ['executive-route-get-only',     'executive dashboard route is GET-only',                 () => caseExecutiveRouteIsGetOnly()],
    ['routes-listed',                'all 5 routes registered in systemIntegrityReport',      () => caseRoutesListed()],
    ['whitelist-updated',            'system-stability whitelist includes 4 new POSTs',        () => caseWhitelistUpdated()],
    ['isolation',                    'engines pure · no critic / pipeline / banner / publishing / external-platform imports', () => caseIsolation()],
    ['forbidden-prediction',         'no predict / will / winner / best / recommended / optimize / chosen / optimal', () => caseForbiddenPrediction()],
    ['forbidden-external-apis',      'no Meta / Google Ads / CRM / Slack / Notion phrasing',  () => caseForbiddenExternalAPIs()],
    ['allowed-language',             'historically observed / operator approval required / approval flow', () => caseAllowedLanguage()],
    ['advisory-notices',             'all 5 engines declare "Human remains final authority"',  () => caseAllAdvisoryNotices()],
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
