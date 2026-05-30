/**
 * /api/campaign-planner
 *
 * Campaign Operating System · operator-supervised.
 *
 * GET   — composes a campaign plan from query parameters
 *         (budget, goal, formula, market, audience) PLUS optional
 *         prior performance evidence. Returns:
 *           - campaign plan structure (phases, budget allocation,
 *             creative angles, asset requirements)
 *           - testing matrix
 *           - content calendar
 *           - performance expectation bands
 *         AND the existing saved plans (read-only view).
 * POST  — operator-supervised. Actions: save | approve | start |
 *         complete | reject | archive. Every write requires
 *         operatorId + operatorReason.
 *
 * STRICT CONTRACT:
 *   - the route NEVER publishes
 *   - the route NEVER auto-spends budget
 *   - the route NEVER auto-approves a plan
 *   - the route NEVER calls a generator
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  composeCampaignPlan, type CampaignGoal, type CampaignMarket, type CampaignPlannerInput,
} from '@lib/campaignPlannerEngine';
import { buildTestingMatrix } from '@lib/testingMatrixEngine';
import { buildContentCalendar } from '@lib/contentCalendarEngine';
import { buildPerformanceExpectation } from '@lib/performanceExpectationEngine';
import {
  createCampaignPlanMemoryStore, newCampaignPlanId,
  type CampaignPlanRecord, type CampaignPlanStatus,
} from '@lib/campaignPlanMemory';
import { analyzePerformance } from '@lib/performanceAnalyzer';
import { createPerformanceMemoryStore } from '@lib/performanceMemory';
import { createPublicationRegistryStore } from '@lib/publicationRegistryMemory';
import { createAssetRegistryMemoryStore } from '@lib/assetRegistryMemory';
import type { Formula } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const VALID_FORMULAS: ReadonlySet<Formula> = new Set(['ENERGY', 'FOCUS', 'RELAX', 'SLEEP']);
const VALID_GOALS: ReadonlySet<CampaignGoal> = new Set([
  'brand-awareness', 'product-trial', 'audience-retention', 'reactivation', 'community-build',
]);
const VALID_MARKETS: ReadonlySet<CampaignMarket> = new Set(['israel', 'global']);
const VALID_TRANSITIONS: ReadonlySet<CampaignPlanStatus> = new Set([
  'approved', 'in-flight', 'completed', 'rejected', 'archived',
]);

// ─── GET ─────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<NextResponse> {
  const url = new URL(req.url);
  const budgetUSD = Math.max(0, parseFloat(url.searchParams.get('budgetUSD') ?? '1000'));
  const goalParam = (url.searchParams.get('goal') ?? 'brand-awareness') as CampaignGoal;
  const goal: CampaignGoal = VALID_GOALS.has(goalParam) ? goalParam : 'brand-awareness';
  const formulaParam = (url.searchParams.get('formula') ?? 'ENERGY').toUpperCase() as Formula;
  const formula: Formula = VALID_FORMULAS.has(formulaParam) ? formulaParam : 'ENERGY';
  const marketParam = (url.searchParams.get('market') ?? 'israel') as CampaignMarket;
  const market: CampaignMarket = VALID_MARKETS.has(marketParam) ? marketParam : 'israel';
  const audience = url.searchParams.get('audience') ?? 'il-women-25-44';
  const langParam = (url.searchParams.get('lang') ?? 'hebrew') as 'hebrew' | 'mixed' | 'english';
  const brandLanguage = ['hebrew', 'mixed', 'english'].includes(langParam) ? langParam : 'hebrew';
  const durationDaysOverrideStr = url.searchParams.get('durationDays');
  const cadenceStr = url.searchParams.get('cadencePerWeek');
  const restStr = url.searchParams.get('restDaysPerWeek');
  const startISODate = url.searchParams.get('startISODate') ?? undefined;
  const perCellBudgetStr = url.searchParams.get('perCellBudgetUSD');

  const input: CampaignPlannerInput = {
    budgetUSD, goal, formula, market, audience, brandLanguage,
    durationDaysOverride: durationDaysOverrideStr ? parseFloat(durationDaysOverrideStr) : undefined,
  };

  // Compose the plan + matrix + calendar.
  const plan = composeCampaignPlan(input);
  const testingMatrix = buildTestingMatrix({
    goal, formula, market, audience,
    creativeAngles: plan.creativeAngles,
    perCellBudgetUSD: perCellBudgetStr ? parseFloat(perCellBudgetStr) : 0,
  });
  const contentCalendar = buildContentCalendar({
    startISODate,
    phases: plan.phases,
    assetRequirements: plan.assetRequirements,
    creativeAngles: plan.creativeAngles,
    publishingCadencePerWeek: cadenceStr ? parseFloat(cadenceStr) : undefined,
    restDaysPerWeek: restStr ? parseFloat(restStr) : undefined,
  });

  // Performance expectation — anchored to operator-logged prior if any.
  const [perfMem, pubMem, assetMem] = await Promise.all([
    createPerformanceMemoryStore().read().catch(() => null),
    createPublicationRegistryStore().read().catch(() => null),
    createAssetRegistryMemoryStore().read().catch(() => null),
  ]);
  const performanceAnalysis = analyzePerformance({
    performances: perfMem?.performances ?? [],
    publications: pubMem?.publications ?? [],
    assets: assetMem?.assets ?? [],
  });
  const performanceExpectation = buildPerformanceExpectation({
    goal, formula, market, audience,
    budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
    performanceAnalysis,
  });

  const planMem = await createCampaignPlanMemoryStore().read().catch(() => null);
  const counts: Record<CampaignPlanStatus, number> = {
    draft: 0, approved: 0, 'in-flight': 0, completed: 0, rejected: 0, archived: 0,
  };
  for (const p of planMem?.plans ?? []) counts[p.status] += 1;

  return NextResponse.json({
    plan,
    testingMatrix,
    contentCalendar,
    performanceExpectation,
    savedPlans: {
      totalPlans: planMem?.totalPlans ?? 0,
      counts,
      plans: (planMem?.plans ?? []).slice(-32),
    },
    advisoryNotice:
      'Campaign Operating System · plan is a specification only. ' +
      'The system never publishes, never auto-spends, never auto-approves. ' +
      'Human remains final authority.',
  });
}

// ─── POST ─────────────────────────────────────────────────────

interface SaveBody {
  action: 'save';
  operatorId: string;
  operatorReason: string;
  label: string;
  /** Plan input the operator wants to freeze. */
  input: CampaignPlannerInput;
  /** Calendar overrides — operator-provided. */
  calendarOverrides?: { startISODate?: string; cadencePerWeek?: number; restDaysPerWeek?: number };
  perCellBudgetUSD?: number;
  operatorNote?: string;
}
interface TransitionBody {
  action: 'approve' | 'start' | 'complete' | 'reject' | 'archive';
  operatorId: string;
  operatorReason: string;
  planId: string;
}
type Body = SaveBody | TransitionBody;
function isSave(b: Body): b is SaveBody { return b.action === 'save'; }
function isTransition(b: Body): b is TransitionBody {
  return ['approve', 'start', 'complete', 'reject', 'archive'].includes(b.action);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: Body;
  try { body = await req.json() as Body; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }

  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }

  const store = createCampaignPlanMemoryStore();

  if (isSave(body)) {
    if (typeof body.label !== 'string' || body.label.length === 0) {
      return NextResponse.json({ error: 'label is required' }, { status: 400 });
    }
    if (!body.input || typeof body.input.budgetUSD !== 'number') {
      return NextResponse.json({ error: 'input.budgetUSD is required' }, { status: 400 });
    }
    if (!VALID_GOALS.has(body.input.goal)) {
      return NextResponse.json({ error: 'invalid input.goal' }, { status: 400 });
    }
    if (!VALID_FORMULAS.has(body.input.formula)) {
      return NextResponse.json({ error: 'invalid input.formula' }, { status: 400 });
    }
    if (!VALID_MARKETS.has(body.input.market)) {
      return NextResponse.json({ error: 'invalid input.market' }, { status: 400 });
    }

    // Recompose the snapshot at save time so the plan is frozen.
    const plan = composeCampaignPlan(body.input);
    const testingMatrix = buildTestingMatrix({
      goal: body.input.goal, formula: body.input.formula,
      market: body.input.market, audience: body.input.audience,
      creativeAngles: plan.creativeAngles,
      perCellBudgetUSD: body.perCellBudgetUSD ?? 0,
    });
    const contentCalendar = buildContentCalendar({
      startISODate: body.calendarOverrides?.startISODate,
      phases: plan.phases,
      assetRequirements: plan.assetRequirements,
      creativeAngles: plan.creativeAngles,
      publishingCadencePerWeek: body.calendarOverrides?.cadencePerWeek,
      restDaysPerWeek: body.calendarOverrides?.restDaysPerWeek,
    });
    const [perfMem, pubMem, assetMem] = await Promise.all([
      createPerformanceMemoryStore().read().catch(() => null),
      createPublicationRegistryStore().read().catch(() => null),
      createAssetRegistryMemoryStore().read().catch(() => null),
    ]);
    const performanceAnalysis = analyzePerformance({
      performances: perfMem?.performances ?? [],
      publications: pubMem?.publications ?? [],
      assets: assetMem?.assets ?? [],
    });
    const performanceExpectation = buildPerformanceExpectation({
      goal: body.input.goal, formula: body.input.formula,
      market: body.input.market, audience: body.input.audience,
      budgetUSD: body.input.budgetUSD, durationDays: plan.durationDays, phases: plan.phases,
      performanceAnalysis,
    });

    const at = Date.now();
    const record: CampaignPlanRecord = {
      planId: newCampaignPlanId(),
      label: body.label,
      input: body.input,
      plan,
      testingMatrix,
      contentCalendar,
      performanceExpectation,
      createdAt: at,
      operatorId: body.operatorId,
      status: 'draft',
      history: [{ at, status: 'draft', operatorId: body.operatorId, reason: body.operatorReason }],
      operatorNote: body.operatorNote,
    };
    const next = await store.append(record);
    return NextResponse.json({
      ok: true,
      plan: record,
      totalPlans: next.totalPlans,
      advisoryNotice:
        'Operator-supervised — campaign plan saved with status `draft`. ' +
        'The system never publishes, never auto-spends, never auto-approves. ' +
        'Human remains final authority.',
    });
  }

  if (isTransition(body)) {
    const status: CampaignPlanStatus =
      body.action === 'approve' ? 'approved' :
      body.action === 'start' ? 'in-flight' :
      body.action === 'complete' ? 'completed' :
      body.action === 'reject' ? 'rejected' :
                                  'archived';
    if (!VALID_TRANSITIONS.has(status)) {
      return NextResponse.json({ error: 'invalid transition' }, { status: 400 });
    }
    try {
      const next = await store.updateStatus(body.planId, {
        at: Date.now(), status,
        operatorId: body.operatorId, reason: body.operatorReason,
      });
      const updated = next.plans.find((p) => p.planId === body.planId);
      return NextResponse.json({
        ok: true,
        plan: updated,
        advisoryNotice:
          `Operator-supervised — status set to \`${status}\` for ${body.planId}. ` +
          'No spending, no publishing. Human remains final authority.',
      });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 404 });
    }
  }

  return NextResponse.json({ error: 'unknown action' }, { status: 400 });
}
