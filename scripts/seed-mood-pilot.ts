/**
 * scripts/seed-mood-pilot.ts
 *
 * MOOD PILOT SEED — populates the existing memory stores with the
 * MOOD organization · brand · products · knowledge · activation ·
 * workflows · assets · publications · performance · journey events.
 *
 * Hard constraints (CORE PLATFORM FREEZE):
 *   - introduces NO new engines · NO new memories · NO new dashboards
 *   - writes ONLY to existing memory stores via their pure transforms
 *   - is idempotent: re-running the seed does NOT duplicate records
 *   - is deterministic: identical input → identical seeded state
 *   - NEVER publishes externally · NEVER spends money · NEVER calls APIs
 *
 * Run: npx tsx scripts/seed-mood-pilot.ts
 */

import {
  appendOrganization, appendWorkspace, appendMembership,
  createOrganizationMemoryStore,
} from '../lib/tenancy/organizationMemory';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '../lib/tenancy/types';
import {
  appendBrand, appendProduct, createWorkspaceMemoryStore,
  newBrandId, newProductId,
  type BrandRecord, type ProductRecord,
} from '../lib/workspaceMemory';
import {
  appendKnowledgeEntry, createKnowledgeMemoryStore,
  newKnowledgeEntryId, type KnowledgeEntry,
} from '../lib/knowledgeMemory';
import {
  appendWorkspaceActivation, buildWorkspaceScaffolding,
  createWorkspaceActivationStore, newWorkspaceActivationId,
  type WorkspaceActivationRecord,
} from '../lib/business/workspaceActivation';
import {
  appendWorkflow, applyWorkflowStep, createWorkflowMemoryStore,
  newWorkflowId, type WorkflowRecord,
} from '../lib/workflows/workflowMemory';
import { orchestrateWorkflow } from '../lib/workflows/workflowOrchestrator';
import {
  appendAssetRecord, applyAssetApprovalStep,
  createAssetRegistryMemoryStore, newAssetId,
  type AssetRecord, type AssetExecutionType,
} from '../lib/assetRegistryMemory';
import {
  appendPublicationRecord, createPublicationRegistryStore,
  newPublicationId, type PublicationRecord, type PublicationChannel,
} from '../lib/publicationRegistryMemory';
import {
  appendPerformanceRecord, createPerformanceMemoryStore, newPerformanceId,
  type PerformanceRecord,
} from '../lib/performanceMemory';
import {
  appendJourneyEvent, createCustomerJourneyMemoryStore,
  newJourneyEventId, type JourneyEvent, type JourneyEventType,
} from '../lib/customerJourneyMemory';
import type { Formula } from '../src/core/types';

// ─── deterministic time anchor ───────────────────────────────
// Fixed anchor so re-runs produce byte-identical state.
const PILOT_ANCHOR = Date.UTC(2026, 4, 1); // 2026-05-01 00:00 UTC
const DAY = 24 * 60 * 60 * 1000;
const day = (offset: number) => PILOT_ANCHOR + offset * DAY;

// ─── operators ───────────────────────────────────────────────

const OP_PLATFORM = 'op-mood-platform';
const OP_OWNER    = 'op-mood-owner';
const OP_MANAGER  = 'op-mood-manager';
const OP_EDITOR   = 'op-mood-editor';

// ─── seed log ────────────────────────────────────────────────

const log: string[] = [];
function note(line: string) { log.push(line); console.log(`  • ${line}`); }

// ─── 1 · organization · workspace · memberships ──────────────

async function seedOrganization(): Promise<{
  organizationId: string; workspaceId: string;
  membershipIds: { owner: string; manager: string; editor: string };
}> {
  const store = createOrganizationMemoryStore();
  let state = await store.read();
  const orgId = PLATFORM_TENANT_ID_MOOD;
  const wspId = PLATFORM_WORKSPACE_ID_MOOD;

  if (!state.organizations.some((o) => o.organizationId === orgId)) {
    state = appendOrganization(state, {
      organizationId: orgId, name: 'MOOD', slug: 'mood',
      billingTier: 'unbilled', createdAt: day(-30), createdBy: OP_PLATFORM,
      operatorNote: 'pilot tenant · MOOD Organization #1',
    });
    note(`organization seeded: ${orgId}`);
  } else { note(`organization already present: ${orgId}`); }

  if (!state.workspaces.some((w) => w.workspaceId === wspId)) {
    state = appendWorkspace(state, {
      workspaceId: wspId, organizationId: orgId,
      name: 'MOOD · Default Workspace', slug: 'default',
      createdAt: day(-30), createdBy: OP_PLATFORM,
      operatorNote: 'pilot workspace',
    });
    note(`workspace seeded: ${wspId}`);
  } else { note(`workspace already present: ${wspId}`); }

  const membershipPresence = {
    owner:   state.memberships.find((m) => m.memberId === OP_OWNER   && m.organizationId === orgId),
    manager: state.memberships.find((m) => m.memberId === OP_MANAGER && m.organizationId === orgId),
    editor:  state.memberships.find((m) => m.memberId === OP_EDITOR  && m.organizationId === orgId),
  };
  if (!membershipPresence.owner) {
    state = appendMembership(state, {
      membershipId: 'mem-mood-owner', organizationId: orgId, memberId: OP_OWNER,
      displayName: 'MOOD · Owner', roles: ['organization-owner'],
      createdAt: day(-30), grantedBy: OP_PLATFORM,
    });
    note('membership seeded: organization-owner');
  }
  if (!membershipPresence.manager) {
    state = appendMembership(state, {
      membershipId: 'mem-mood-manager', organizationId: orgId, memberId: OP_MANAGER,
      displayName: 'MOOD · Manager', roles: ['manager'],
      createdAt: day(-30), grantedBy: OP_OWNER,
    });
    note('membership seeded: manager');
  }
  if (!membershipPresence.editor) {
    state = appendMembership(state, {
      membershipId: 'mem-mood-editor', organizationId: orgId, memberId: OP_EDITOR,
      displayName: 'MOOD · Editor', roles: ['editor'],
      createdAt: day(-30), grantedBy: OP_OWNER,
    });
    note('membership seeded: editor');
  }
  await store.save(state);
  return {
    organizationId: orgId, workspaceId: wspId,
    membershipIds: { owner: 'mem-mood-owner', manager: 'mem-mood-manager', editor: 'mem-mood-editor' },
  };
}

// ─── 2 · brand + 4 products ──────────────────────────────────

async function seedBrandAndProducts(): Promise<{
  brandId: string;
  productIds: Record<Formula, string>;
}> {
  const store = createWorkspaceMemoryStore();
  let state = await store.read();

  let brand = state.brands.find((b) => b.name === 'mood');
  if (!brand) {
    const brandId = newBrandId();
    const record: BrandRecord = {
      brandId, projectId: 'project-mood-pilot', name: 'mood',
      description: 'MOOD · functional chocolate · ENERGY · FOCUS · RELAX · SLEEP',
      createdAt: day(-29), operatorId: OP_OWNER,
      operatorNote: 'pilot brand',
    };
    state = appendBrand(state, record);
    brand = record;
    note(`brand seeded: ${brand.brandId}`);
  } else { note(`brand already present: ${brand.brandId}`); }

  const formulas: Formula[] = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'];
  const descriptions: Record<Formula, string> = {
    ENERGY: 'morning · forward push · activation without anxiety',
    FOCUS:  'mid-day · attention without compression · quiet capability',
    RELAX:  'evening · soft descent · ease without sedation',
    SLEEP:  'night · deeper rest · returning to the body',
  };
  const productIds = {} as Record<Formula, string>;
  for (const formula of formulas) {
    const existing = state.products.find((p) => p.formula === formula && p.brandId === brand!.brandId);
    if (existing) { productIds[formula] = existing.productId; note(`product already present: ${formula}`); continue; }
    const productId = newProductId();
    const record: ProductRecord = {
      productId, brandId: brand!.brandId,
      name: `mood ${formula.toLowerCase()}`, formula,
      description: descriptions[formula],
      createdAt: day(-29), operatorId: OP_OWNER,
      operatorNote: `pilot product · ${formula}`,
    };
    state = appendProduct(state, record);
    productIds[formula] = productId;
    note(`product seeded: ${formula} · ${productId}`);
  }
  await store.save(state);
  return { brandId: brand!.brandId, productIds };
}

// ─── 3 · knowledge: audience · market · brand-rule · visual-rule · formula-rule ──

async function seedKnowledge(): Promise<void> {
  const store = createKnowledgeMemoryStore();
  let state = await store.read();

  const seedEntries: Array<Omit<KnowledgeEntry, 'entryId' | 'createdAt' | 'revisionHistory'>> = [
    // audience
    {
      category: 'audience-rule', title: 'Primary audience · Israel · women 25-44',
      body: 'historically observed: women 25-44 in Israel · urban centers · seeking emotional regulation without sedation · digital-native · Hebrew RTL + English bilingual UX expected',
      tags: ['israel', 'il-women-25-44', 'bilingual'],
      operatorId: OP_OWNER,
    },
    {
      category: 'audience-rule', title: 'Secondary audience · Global English',
      body: 'historically observed: English-speaking global audience · wellness-adjacent · prefers ingredient transparency · responds to editorial photography',
      tags: ['global', 'english', 'wellness'],
      operatorId: OP_OWNER,
    },
    // market
    {
      category: 'brand-rule', title: 'Primary market · Israel',
      body: 'historically observed: Israel is MOOD primary market · pricing in ILS · physical retail + DTC · Hebrew copy carries primary brand voice',
      tags: ['israel', 'market'],
      operatorId: OP_OWNER,
    },
    {
      category: 'brand-rule', title: 'Secondary market · Global English',
      body: 'historically observed: global English market is secondary · pricing in USD · DTC only · English copy must preserve the same restraint as Hebrew',
      tags: ['global', 'market'],
      operatorId: OP_OWNER,
    },
    // brand
    {
      category: 'brand-rule', title: 'Brand voice · restraint over insistence',
      body: 'MOOD voice is restrained · never urgent · never optimization-language · communicates a state, not a result · operator approval required at every copy',
      tags: ['voice', 'restraint'],
      operatorId: OP_OWNER,
    },
    {
      category: 'brand-rule', title: 'Brand voice · no manipulation phrasing',
      body: 'NEVER use: viral · dopamine · hack · optimize · best · proven · guaranteed · breakthrough · revolutionary. ALWAYS use: historically observed · operator-supervised · may carry memory weight',
      tags: ['voice', 'forbidden-phrasing'],
      operatorId: OP_OWNER,
    },
    // visual
    {
      category: 'visual-rule', title: 'Visual identity · ink · bone · signal',
      body: 'palette: ink #0A0A0A · bone #F7F5F2 · signal warning #FF4D2D · signal quiet #5C5C5C · editorial typography · 50mm documentary photography · handheld restraint',
      tags: ['palette', 'typography', 'photography'],
      operatorId: OP_OWNER,
    },
    {
      category: 'visual-rule', title: 'Visual identity · photography rule',
      body: 'photography: documentary 50mm · handheld · indoor available light · no spectacle · no over-direction · operator selects existing frames; never generates synthetic faces',
      tags: ['photography', 'documentary'],
      operatorId: OP_OWNER,
    },
    // formula rules
    {
      category: 'formula-rule', title: 'ENERGY · morning state', linkedFormula: 'ENERGY',
      body: 'ENERGY · morning · activation without anxiety · forward push that does not collapse into urgency · operator briefs anchor it in a kitchen morning',
      tags: ['energy', 'morning'],
      operatorId: OP_OWNER,
    },
    {
      category: 'formula-rule', title: 'FOCUS · mid-day state', linkedFormula: 'FOCUS',
      body: 'FOCUS · mid-day · attention without compression · quiet capability · operator briefs anchor it in a desk-side breath',
      tags: ['focus', 'mid-day'],
      operatorId: OP_OWNER,
    },
    {
      category: 'formula-rule', title: 'RELAX · evening state', linkedFormula: 'RELAX',
      body: 'RELAX · evening · soft descent · ease without sedation · operator briefs anchor it in the moment between work and home',
      tags: ['relax', 'evening'],
      operatorId: OP_OWNER,
    },
    {
      category: 'formula-rule', title: 'SLEEP · night state', linkedFormula: 'SLEEP',
      body: 'SLEEP · night · returning to the body · operator briefs anchor it in the last hour before bed',
      tags: ['sleep', 'night'],
      operatorId: OP_OWNER,
    },
  ];

  for (const e of seedEntries) {
    if (state.entries.some((x) => x.title === e.title)) continue;
    const entry: KnowledgeEntry = {
      entryId: newKnowledgeEntryId(),
      createdAt: day(-28), revisionHistory: [{ at: day(-28), operatorId: e.operatorId }],
      ...e,
    };
    state = appendKnowledgeEntry(state, entry);
    note(`knowledge seeded: ${e.title}`);
  }
  await store.save(state);
}

// ─── 4 · workspace activation ────────────────────────────────

async function seedWorkspaceActivation(orgId: string, wspId: string): Promise<void> {
  const store = createWorkspaceActivationStore();
  let state = await store.read();
  const brandLabel = 'mood';
  const existing = state.activations.find(
    (a) => a.organizationId === orgId && a.workspaceId === wspId &&
           a.brandLabel === brandLabel && a.status === 'activated');
  if (existing) { note(`workspace activation already present: ${existing.activationId}`); return; }
  const scaffolding = buildWorkspaceScaffolding('product-launch');
  const record: WorkspaceActivationRecord = {
    activationId: newWorkspaceActivationId(),
    organizationId: orgId, workspaceId: wspId,
    brandLabel, primaryGoalId: 'product-launch', scaffolding,
    status: 'activated', createdAt: day(-27), operatorId: OP_OWNER,
    history: [{ at: day(-27), status: 'activated', operatorId: OP_OWNER, reason: 'pilot scaffolding' }],
    operatorNote: 'pilot workspace activation',
  };
  state = appendWorkspaceActivation(state, record);
  await store.save(state);
  note(`workspace activation seeded: ${record.activationId}`);
}

// ─── 5 · 3 workflows ─────────────────────────────────────────

interface SeededWorkflow { workflowId: string; templateId: 'product-launch' | 'lead-generation' | 'brand-awareness'; }

async function seedWorkflows(orgId: string, wspId: string): Promise<SeededWorkflow[]> {
  const store = createWorkflowMemoryStore();
  let state = await store.read();

  const targets: Array<{
    templateId: SeededWorkflow['templateId']; goalId: 'product-launch' | 'lead-generation' | 'brand-awareness';
    label: string; productLabel: string; createdAt: number;
  }> = [
    {
      templateId: 'product-launch',  goalId: 'product-launch',
      label: 'MOOD · Energy Launch', productLabel: 'mood energy', createdAt: day(-26),
    },
    {
      templateId: 'lead-generation', goalId: 'lead-generation',
      label: 'MOOD · Focus Lead Generation', productLabel: 'mood focus', createdAt: day(-26),
    },
    {
      templateId: 'brand-awareness', goalId: 'brand-awareness',
      label: 'MOOD · Relax Awareness', productLabel: 'mood relax', createdAt: day(-26),
    },
  ];

  const seeded: SeededWorkflow[] = [];
  for (const t of targets) {
    const existing = state.workflows.find(
      (w) => w.organizationId === orgId && w.workspaceId === wspId && w.label === t.label);
    if (existing) { seeded.push({ workflowId: existing.workflowId, templateId: t.templateId }); note(`workflow already present: ${existing.workflowId}`); continue; }
    const plan = orchestrateWorkflow({
      goalId: t.goalId, templateId: t.templateId,
      brandLabel: 'mood', productLabel: t.productLabel,
      primaryMarket: 'israel', audienceLabel: 'il-women-25-44',
      secondaryMarkets: ['global'], nowMs: t.createdAt,
    });
    const wid = newWorkflowId();
    const record: WorkflowRecord = {
      workflowId: wid, templateId: t.templateId,
      organizationId: orgId, workspaceId: wspId,
      label: t.label, plan, status: 'draft',
      currentStepId: plan.steps[0].stepId,
      completedStepIds: [], createdAt: t.createdAt, operatorId: OP_MANAGER,
      history: [{ at: t.createdAt, status: 'draft', operatorId: OP_MANAGER, reason: 'pilot draft' }],
      bottlenecks: [], outcomes: [], operatorNotes: [],
      operatorNote: 'pilot workflow',
    };
    state = appendWorkflow(state, record);
    // operator activates the draft one day later
    state = applyWorkflowStep(state, wid, {
      at: t.createdAt + DAY, status: 'active', operatorId: OP_MANAGER, reason: 'pilot activate',
    });
    seeded.push({ workflowId: wid, templateId: t.templateId });
    note(`workflow seeded: ${t.label}`);
  }
  await store.save(state);
  return seeded;
}

// ─── 6 · assets ──────────────────────────────────────────────

interface SeededAsset { assetId: string; formula: Formula; packageType: AssetExecutionType; campaign: string; }

async function seedAssets(workflows: SeededWorkflow[]): Promise<SeededAsset[]> {
  const store = createAssetRegistryMemoryStore();
  let state = await store.read();

  const blueprints: Array<{
    formula: Formula; packageType: AssetExecutionType;
    campaign: string; story: string; prompt: string;
  }> = [
    // ENERGY · launch
    { formula: 'ENERGY', packageType: 'image',
      campaign: 'MOOD · Energy Launch',
      story: 'Quiet Return Home',
      prompt: 'kitchen morning · documentary handheld · 50mm · Hebrew RTL · MOOD ENERGY · ink·bone palette' },
    { formula: 'ENERGY', packageType: 'video',
      campaign: 'MOOD · Energy Launch',
      story: 'Morning Restart',
      prompt: 'kitchen sink · 15s reel · handheld · 50mm · breath · MOOD ENERGY' },
    { formula: 'ENERGY', packageType: 'carousel',
      campaign: 'MOOD · Energy Launch',
      story: 'Three Mornings',
      prompt: '3-card carousel · kitchen · café · desk · MOOD ENERGY · editorial restraint' },
    { formula: 'ENERGY', packageType: 'landing',
      campaign: 'MOOD · Energy Launch',
      story: 'Energy Landing',
      prompt: 'landing page · single hero · Hebrew RTL + English · opt-in form · MOOD ENERGY' },
    // FOCUS · lead generation
    { formula: 'FOCUS', packageType: 'image',
      campaign: 'MOOD · Focus Lead Generation',
      story: 'Desk Breath',
      prompt: 'desk-side breath · documentary 50mm · ink·bone palette · MOOD FOCUS' },
    { formula: 'FOCUS', packageType: 'video',
      campaign: 'MOOD · Focus Lead Generation',
      story: 'Quiet Capability',
      prompt: 'mid-day desk · 12s short · 9:16 vertical · MOOD FOCUS' },
    { formula: 'FOCUS', packageType: 'landing',
      campaign: 'MOOD · Focus Lead Generation',
      story: 'Focus Landing',
      prompt: 'lead capture landing · single hero · opt-in form · MOOD FOCUS · Hebrew RTL' },
    // RELAX · awareness
    { formula: 'RELAX', packageType: 'video',
      campaign: 'MOOD · Relax Awareness',
      story: 'Soft Descent',
      prompt: 'evening descent · 20s long-form vertical · 9:16 · MOOD RELAX' },
    { formula: 'RELAX', packageType: 'carousel',
      campaign: 'MOOD · Relax Awareness',
      story: 'Between Work and Home',
      prompt: '4-card carousel · the moment between · MOOD RELAX · ink·bone palette' },
  ];

  const seeded: SeededAsset[] = [];
  let assetCreatedAt = day(-20);
  for (const b of blueprints) {
    const existing = state.assets.find(
      (a) => a.campaign === b.campaign && a.packageType === b.packageType && a.sourceStoryName === b.story);
    if (existing) {
      seeded.push({ assetId: existing.assetId, formula: existing.formula,
                    packageType: existing.packageType, campaign: existing.campaign });
      note(`asset already present: ${existing.assetId}`);
      continue;
    }
    const id = newAssetId();
    const briefId = `b-${b.formula.toLowerCase()}-${b.packageType}`;
    const promptId = `p-${b.formula.toLowerCase()}-${b.packageType}`;
    const record: AssetRecord = {
      assetId: id, formula: b.formula, campaign: b.campaign,
      packageType: b.packageType, sourceStoryName: b.story,
      sourceBriefId: briefId, sourcePromptId: promptId,
      prompt: b.prompt, summary: `${b.packageType} · ${b.story} · ${b.formula}`,
      createdAt: assetCreatedAt, operatorId: OP_EDITOR,
      approvalStatus: 'pending',
      approvalHistory: [{ at: assetCreatedAt, status: 'pending', operatorId: OP_EDITOR, reason: 'pilot register' }],
      operatorNote: 'pilot asset',
    };
    state = appendAssetRecord(state, record);
    // half of the assets are approved by manager (deterministic by index)
    if (seeded.length % 2 === 0) {
      state = applyAssetApprovalStep(state, id, {
        at: assetCreatedAt + DAY, status: 'approved',
        operatorId: OP_MANAGER, reason: 'pilot approval',
      });
    }
    seeded.push({ assetId: id, formula: b.formula, packageType: b.packageType, campaign: b.campaign });
    note(`asset seeded: ${b.story} · ${b.packageType}`);
    assetCreatedAt += Math.floor(DAY / 3);
  }
  // workflow argument acknowledged for traceability
  void workflows;
  await store.save(state);
  return seeded;
}

// ─── 7 · publications for approved assets ────────────────────

interface SeededPublication { publicationId: string; assetId: string; channel: PublicationChannel; }

async function seedPublications(assets: SeededAsset[]): Promise<SeededPublication[]> {
  const store = createPublicationRegistryStore();
  let state = await store.read();
  // We publish the approved assets only. The approval was deterministic
  // (even index in seedAssets) — we re-derive that here.
  const approvedAssets = assets.filter((_, i) => i % 2 === 0);
  const channelByPackage: Record<AssetExecutionType, PublicationChannel> = {
    image:    'instagram-feed',
    video:    'instagram-reels',
    carousel: 'instagram-feed',
    landing:  'website-hero',
  };
  const seeded: SeededPublication[] = [];
  let publishedAt = day(-15);
  for (const a of approvedAssets) {
    const channel = channelByPackage[a.packageType];
    const existing = state.publications.find(
      (p) => p.assetId === a.assetId && p.channel === channel);
    if (existing) { seeded.push({ publicationId: existing.publicationId, assetId: a.assetId, channel }); continue; }
    const id = newPublicationId();
    const record: PublicationRecord = {
      publicationId: id, assetId: a.assetId, channel,
      publishedAt, operatorId: OP_MANAGER,
      campaign: a.campaign, formula: a.formula, audience: 'il-women-25-44',
      platform: `placeholder-platform-id-${id}`,
      status: 'live',
      statusHistory: [{ at: publishedAt, status: 'live', operatorId: OP_MANAGER, reason: 'pilot publish' }],
      operatorNote: 'pilot publication · operator-supervised',
    };
    state = appendPublicationRecord(state, record);
    seeded.push({ publicationId: id, assetId: a.assetId, channel });
    note(`publication seeded: ${a.assetId} · ${channel}`);
    publishedAt += Math.floor(DAY / 2);
  }
  await store.save(state);
  return seeded;
}

// ─── 8 · performance records ─────────────────────────────────

async function seedPerformance(publications: SeededPublication[], assets: SeededAsset[]): Promise<number> {
  const store = createPerformanceMemoryStore();
  let state = await store.read();
  let measuredAt = day(-10);
  let count = 0;
  for (const p of publications) {
    if (state.performances.some((r) => r.publicationId === p.publicationId)) continue;
    const a = assets.find((x) => x.assetId === p.assetId);
    if (!a) continue;
    const record: PerformanceRecord = {
      performanceId: newPerformanceId(),
      assetId: p.assetId, publicationId: p.publicationId,
      platform: `placeholder-platform-id-${p.publicationId}`,
      measuredAt,
      measurementWindow: {
        startedAt: measuredAt - 7 * DAY, endedAt: measuredAt,
        durationHours: 7 * 24,
      },
      metrics: {
        views:        approxByPackage(a.packageType, 'views'),
        reach:        approxByPackage(a.packageType, 'reach'),
        watchTimeSeconds: approxByPackage(a.packageType, 'watch'),
        completionRate:   approxByPackage(a.packageType, 'completion') / 1000,
        ctr:              approxByPackage(a.packageType, 'ctr') / 1000,
        engagementRate:   approxByPackage(a.packageType, 'engagement') / 1000,
        shares:       approxByPackage(a.packageType, 'shares'),
        saves:        approxByPackage(a.packageType, 'saves'),
        comments:     approxByPackage(a.packageType, 'comments'),
        likes:        approxByPackage(a.packageType, 'likes'),
        follows:      approxByPackage(a.packageType, 'follows'),
        profileVisits: approxByPackage(a.packageType, 'profileVisits'),
      },
      operatorNote: 'pilot performance · operator-logged',
      operatorId: OP_MANAGER,
    };
    state = appendPerformanceRecord(state, record);
    count += 1;
    measuredAt += DAY;
  }
  await store.save(state);
  return count;
}

function approxByPackage(pkg: AssetExecutionType, metric: string): number {
  // Deterministic plausible numbers, scaled by package type. NO prediction,
  // NO optimization — these are operator-entered historical observations.
  const base: Record<AssetExecutionType, number> = {
    image: 1000, carousel: 1800, video: 4200, landing: 600,
  }[pkg] !== undefined
    ? { image: 1000, carousel: 1800, video: 4200, landing: 600 }
    : { image: 1000, carousel: 1800, video: 4200, landing: 600 };
  const b = base[pkg];
  switch (metric) {
    case 'views':         return b * 4;
    case 'reach':         return b * 3;
    case 'watch':         return pkg === 'video' ? 9 : 3;
    case 'completion':    return pkg === 'video' ? 380 : 0;
    case 'ctr':           return pkg === 'landing' ? 45 : 22;
    case 'engagement':    return 18;
    case 'shares':        return Math.floor(b / 60);
    case 'saves':         return Math.floor(b / 40);
    case 'comments':      return Math.floor(b / 80);
    case 'likes':         return Math.floor(b / 6);
    case 'follows':       return Math.floor(b / 200);
    case 'profileVisits': return Math.floor(b / 30);
    default: return 0;
  }
}

// ─── 9 · journey events: clicks · leads · sales · repeat ─────

async function seedJourneyEvents(publications: SeededPublication[]): Promise<number> {
  const store = createCustomerJourneyMemoryStore();
  let state = await store.read();
  let occurredAt = day(-8);
  let count = 0;
  // Three deterministic journeys per publication: an impression → click →
  // lead pattern, a impression → click → landing → purchase pattern, and a
  // repeat purchase pattern. NO prediction, NO optimization — these are
  // operator-logged historical observations.
  for (const p of publications) {
    const journeys = [
      { id: `j-${p.publicationId}-a`, events: ['impression', 'click', 'lead'] as JourneyEventType[] },
      { id: `j-${p.publicationId}-b`, events: ['impression', 'click', 'landing-visit', 'purchase'] as JourneyEventType[] },
      { id: `j-${p.publicationId}-c`, events: ['view', 'click', 'purchase', 'repeat-purchase'] as JourneyEventType[] },
    ];
    for (const j of journeys) {
      let stepAt = occurredAt;
      for (const eventType of j.events) {
        if (state.events.some(
          (e) => e.journeyId === j.id && e.eventType === eventType)) continue;
        const event: JourneyEvent = {
          eventId: newJourneyEventId(), eventType, journeyId: j.id,
          publicationId: p.publicationId, assetId: p.assetId,
          channel: p.channel, audience: 'il-women-25-44',
          revenueUSD: (eventType === 'purchase' || eventType === 'repeat-purchase') ? 28 : undefined,
          occurredAt: stepAt, operatorNote: 'pilot journey · operator-logged',
          operatorId: OP_MANAGER, loggedAt: stepAt + 60_000,
        };
        state = appendJourneyEvent(state, event);
        count += 1;
        stepAt += Math.floor(DAY / 3);
      }
      occurredAt += Math.floor(DAY / 4);
    }
  }
  await store.save(state);
  return count;
}

// ─── runner ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('MOOD PILOT SEED · idempotent · deterministic\n');
  const t = await seedOrganization();
  const bp = await seedBrandAndProducts();
  await seedKnowledge();
  await seedWorkspaceActivation(t.organizationId, t.workspaceId);
  const workflows = await seedWorkflows(t.organizationId, t.workspaceId);
  const assets = await seedAssets(workflows);
  const publications = await seedPublications(assets);
  const perfCount = await seedPerformance(publications, assets);
  const journeyCount = await seedJourneyEvents(publications);

  console.log('\nSUMMARY');
  console.log(`  organization: ${t.organizationId}`);
  console.log(`  workspace:    ${t.workspaceId}`);
  console.log(`  brand:        ${bp.brandId} (mood)`);
  console.log(`  products:     ${Object.keys(bp.productIds).length} (ENERGY · FOCUS · RELAX · SLEEP)`);
  console.log(`  workflows:    ${workflows.length}`);
  console.log(`  assets:       ${assets.length}`);
  console.log(`  publications: ${publications.length}`);
  console.log(`  performance:  ${perfCount} rows`);
  console.log(`  journey:      ${journeyCount} events`);
  console.log(`  log lines:    ${log.length}`);
  console.log('\nNEVER published externally · NEVER spent money · NEVER called external APIs');
  console.log('Operator approval required at every approval gate. Human remains final authority.');
}
main().catch((err) => { console.error('seed crashed:', err); process.exit(1); });
