/**
 * /api/fast-start · operator-supervised end-to-end scaffold.
 *
 * POST · operator-supervised.
 *        Input (minimum required):
 *          organizationName · brandName · productName · goalId
 *        Optional:
 *          organizationSlug (derived from name when absent)
 *          formula (derived from product name when ENERGY/FOCUS/RELAX/SLEEP)
 *          primaryMarket (defaults to 'israel')
 *          audienceLabel (defaults to 'il-women-25-44')
 *
 *        Output:
 *          The route chains existing pure transforms in a single call:
 *            organization → workspace → membership (owner) → brand →
 *            product → workspace activation → workflow (drafted +
 *            activated). NO new memory store. NO new engine. NO
 *            publishing. NO generation. NO external API calls.
 *
 * Closes the friction surfaced by `ttv-total-minutes` (10.9 min) +
 * `wk-total-field-entries` (~45 fields) in the Reality Hardening audit.
 * Fast Start collapses the path into 4 required fields + 1 round-trip.
 */

import { NextResponse, type NextRequest } from 'next/server';
import {
  appendOrganization, appendWorkspace, appendMembership,
  createOrganizationMemoryStore, newOrganizationId, newWorkspaceId,
  newMembershipId,
} from '@lib/tenancy/organizationMemory';
import {
  appendBrand, appendProduct, appendProject,
  createWorkspaceMemoryStore, newBrandId, newProductId, newProjectId,
} from '@lib/workspaceMemory';
import {
  appendWorkspaceActivation, buildWorkspaceScaffolding,
  createWorkspaceActivationStore, newWorkspaceActivationId,
} from '@lib/business/workspaceActivation';
import {
  appendWorkflow, applyWorkflowStep,
  createWorkflowMemoryStore, newWorkflowId,
} from '@lib/workflows/workflowMemory';
import { orchestrateWorkflow } from '@lib/workflows/workflowOrchestrator';
import { BUSINESS_GOAL_IDS, type BusinessGoalId } from '@lib/business/businessGoalModel';
import type { WorkflowTemplateId } from '@lib/workflows/workflowTemplates';
import { FORMULAS, type Formula } from '@/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface FastStartBody {
  operatorId: string;
  operatorReason: string;
  organizationName: string;
  brandName: string;
  productName: string;
  goalId: BusinessGoalId;
  organizationSlug?: string;
  formula?: Formula;
  primaryMarket?: string;
  audienceLabel?: string;
  operatorNote?: string;
}

function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 32);
}

function defaultTemplateForGoal(goalId: BusinessGoalId): WorkflowTemplateId {
  switch (goalId) {
    case 'product-launch':   return 'product-launch';
    case 'lead-generation':  return 'lead-generation';
    case 'brand-awareness':  return 'brand-awareness';
    case 'community-growth': return 'community-growth';
    case 'retention':        return 'retention';
    case 'sales':            return 'lead-generation';
    case 'market-expansion': return 'brand-awareness';
  }
}

function deriveFormula(productName: string): Formula | undefined {
  const upper = productName.toUpperCase();
  for (const f of FORMULAS) if (upper.includes(f)) return f;
  return undefined;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: FastStartBody;
  try { body = await req.json() as FastStartBody; }
  catch { return NextResponse.json({ error: 'invalid JSON body' }, { status: 400 }); }
  if (!body || typeof body.operatorId !== 'string' || body.operatorId.length === 0) {
    return NextResponse.json({ error: 'operatorId is required' }, { status: 400 });
  }
  if (typeof body.operatorReason !== 'string' || body.operatorReason.length === 0) {
    return NextResponse.json({ error: 'operatorReason is required' }, { status: 400 });
  }
  if (typeof body.organizationName !== 'string' || body.organizationName.length === 0) {
    return NextResponse.json({ error: 'organizationName is required' }, { status: 400 });
  }
  if (typeof body.brandName !== 'string' || body.brandName.length === 0) {
    return NextResponse.json({ error: 'brandName is required' }, { status: 400 });
  }
  if (typeof body.productName !== 'string' || body.productName.length === 0) {
    return NextResponse.json({ error: 'productName is required' }, { status: 400 });
  }
  if (!BUSINESS_GOAL_IDS.includes(body.goalId)) {
    return NextResponse.json({ error: 'unknown goalId' }, { status: 400 });
  }
  if (body.formula && !FORMULAS.includes(body.formula)) {
    return NextResponse.json({ error: 'unknown formula' }, { status: 400 });
  }

  const at = Date.now();
  const orgSlug = (body.organizationSlug && /^[a-z0-9-]+$/.test(body.organizationSlug))
    ? body.organizationSlug
    : slugify(body.organizationName);
  const primaryMarket = body.primaryMarket ?? 'israel';
  const audienceLabel = body.audienceLabel ?? 'il-women-25-44';
  const formula = body.formula ?? deriveFormula(body.productName);

  // ─── 1 · organization ─────────────────────────────────────
  const orgStore = createOrganizationMemoryStore();
  let orgState = await orgStore.read();
  let organizationId: string;
  const existingOrg = orgState.organizations.find((o) => o.slug === orgSlug);
  if (existingOrg) {
    organizationId = existingOrg.organizationId;
  } else {
    organizationId = newOrganizationId();
    orgState = appendOrganization(orgState, {
      organizationId, name: body.organizationName, slug: orgSlug,
      billingTier: 'unbilled', createdAt: at, createdBy: body.operatorId,
      operatorNote: body.operatorNote ?? 'fast-start',
    });
  }

  // ─── 2 · workspace ────────────────────────────────────────
  const existingWsp = orgState.workspaces.find(
    (w) => w.organizationId === organizationId && w.slug === 'default');
  let workspaceId: string;
  if (existingWsp) {
    workspaceId = existingWsp.workspaceId;
  } else {
    workspaceId = newWorkspaceId();
    orgState = appendWorkspace(orgState, {
      workspaceId, organizationId,
      name: `${body.organizationName} · Default Workspace`, slug: 'default',
      createdAt: at, createdBy: body.operatorId,
    });
  }

  // ─── 3 · membership (operator owns the new org) ───────────
  const existingMembership = orgState.memberships.find(
    (m) => m.organizationId === organizationId && m.memberId === body.operatorId);
  if (!existingMembership) {
    orgState = appendMembership(orgState, {
      membershipId: newMembershipId(), organizationId, memberId: body.operatorId,
      displayName: `${body.operatorId} · owner`, roles: ['organization-owner'],
      createdAt: at, grantedBy: body.operatorId,
      operatorNote: 'fast-start owner grant',
    });
  }
  await orgStore.save(orgState);

  // ─── 4 · brand + 5 · product ─────────────────────────────
  const wsStore = createWorkspaceMemoryStore();
  let wsState = await wsStore.read();

  let brand = wsState.brands.find((b) => b.name === body.brandName);
  if (!brand) {
    const projectId = newProjectId();
    wsState = appendProject(wsState, {
      projectId, name: `${body.brandName} · default project`,
      createdAt: at, operatorId: body.operatorId,
    });
    brand = {
      brandId: newBrandId(), projectId, name: body.brandName,
      description: `${body.brandName} brand · seeded by fast-start`,
      createdAt: at, operatorId: body.operatorId,
    };
    wsState = appendBrand(wsState, brand);
  }
  let product = wsState.products.find(
    (p) => p.brandId === brand!.brandId && p.name === body.productName);
  if (!product) {
    product = {
      productId: newProductId(), brandId: brand.brandId, name: body.productName,
      formula, description: `${body.productName} · seeded by fast-start`,
      createdAt: at, operatorId: body.operatorId,
    };
    wsState = appendProduct(wsState, product);
  }
  await wsStore.save(wsState);

  // ─── 6 · workspace activation ─────────────────────────────
  const actStore = createWorkspaceActivationStore();
  let actState = await actStore.read();
  const existingActivation = actState.activations.find(
    (a) => a.organizationId === organizationId && a.workspaceId === workspaceId &&
           a.brandLabel === body.brandName && a.status === 'activated');
  let activationId: string;
  if (existingActivation) {
    activationId = existingActivation.activationId;
  } else {
    activationId = newWorkspaceActivationId();
    actState = appendWorkspaceActivation(actState, {
      activationId, organizationId, workspaceId, brandLabel: body.brandName,
      primaryGoalId: body.goalId,
      scaffolding: buildWorkspaceScaffolding(body.goalId),
      status: 'activated', createdAt: at, operatorId: body.operatorId,
      history: [{ at, status: 'activated', operatorId: body.operatorId, reason: 'fast-start' }],
      operatorNote: 'fast-start activation',
    });
    await actStore.save(actState);
  }

  // ─── 7 · workflow (drafted + activated) ──────────────────
  const wfStore = createWorkflowMemoryStore();
  let wfState = await wfStore.read();
  const templateId = defaultTemplateForGoal(body.goalId);
  const wfLabel = `${body.brandName} · ${body.productName} · ${templateId}`;
  const existingWf = wfState.workflows.find(
    (w) => w.organizationId === organizationId && w.workspaceId === workspaceId && w.label === wfLabel);
  let workflowId: string;
  if (existingWf) {
    workflowId = existingWf.workflowId;
  } else {
    const plan = orchestrateWorkflow({
      goalId: body.goalId, templateId,
      brandLabel: body.brandName, productLabel: body.productName,
      primaryMarket, audienceLabel, nowMs: at,
    });
    workflowId = newWorkflowId();
    wfState = appendWorkflow(wfState, {
      workflowId, templateId,
      organizationId, workspaceId,
      label: wfLabel, plan, status: 'draft',
      currentStepId: plan.steps[0].stepId, completedStepIds: [],
      createdAt: at, operatorId: body.operatorId,
      history: [{ at, status: 'draft', operatorId: body.operatorId, reason: 'fast-start' }],
      bottlenecks: [], outcomes: [], operatorNotes: [],
      operatorNote: 'fast-start workflow',
    });
    wfState = applyWorkflowStep(wfState, workflowId, {
      at: at + 1, status: 'active', operatorId: body.operatorId,
      reason: 'fast-start activate',
    });
    await wfStore.save(wfState);
  }

  return NextResponse.json({
    ok: true,
    result: {
      organizationId, workspaceId,
      brandId: brand.brandId, productId: product.productId,
      activationId, workflowId,
      derivedFields: {
        organizationSlug: orgSlug,
        formula: formula ?? null,
        primaryMarket, audienceLabel,
        templateId,
      },
    },
    advisoryNotice:
      'Operator-supervised — fast start scaffolded organization · workspace · ' +
      'membership · brand · product · workspace activation · workflow draft ' +
      'transitioned to active. The route NEVER auto-publishes, NEVER spends ' +
      'money, NEVER calls external APIs. Operator approval required at every ' +
      'downstream gate. Human remains final authority.',
  });
}
