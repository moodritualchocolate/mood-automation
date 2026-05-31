/**
 * scripts/audit-reality-hardening.ts
 *
 * REALITY HARDENING AUDIT (observation only · no new architecture).
 *
 * Runs four audits against the platform + the MOOD pilot seed:
 *   Phase 1 · Operator Walkthrough (10 entity creation flows)
 *   Phase 2 · Time-to-Value (operator effort estimates)
 *   Phase 3 · UI Consistency (4 pages · 7 axes)
 *   Phase 4 · Data Consistency (orphans · duplicates · broken refs)
 *
 * The script reads-only. It NEVER mutates platform state. It writes
 * its findings to stdout + (optionally) a JSON artifact for
 * downstream tooling. The findings doc lives at
 * docs/reality-hardening-findings.md (human-readable companion).
 *
 * Run: npx tsx scripts/audit-reality-hardening.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

// ─── shared shapes ───────────────────────────────────────────

interface Finding {
  id: string;
  phase: 1 | 2 | 3 | 4;
  severity: 'low' | 'medium' | 'high';
  category: string;
  note: string;
  /** Optional measurement attached to the finding. */
  measure?: number;
  /** Optional source location for the finding. */
  where?: string;
}

const FINDINGS: Finding[] = [];
function find(f: Finding): void {
  FINDINGS.push(f);
  console.log(
    `  [P${f.phase}·${f.severity}] ${f.id} · ${f.note}` +
    (f.measure !== undefined ? ` · measure=${f.measure}` : '') +
    (f.where ? ` · ${f.where}` : ''),
  );
}

// ─── helpers ─────────────────────────────────────────────────

const REPO = path.resolve(__dirname, '..');

async function readFile(rel: string): Promise<string> {
  return fs.readFile(path.join(REPO, rel), 'utf8');
}
async function exists(rel: string): Promise<boolean> {
  try { await fs.stat(path.join(REPO, rel)); return true; } catch { return false; }
}

/** Strip comments + string literals so static regex passes hit code only. */
function stripCommentsAndStrings(src: string): string {
  return src
    .replace(/\/\/.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""')
    .replace(/`[\s\S]*?`/g, '``');
}

// ─── Phase 1 · Operator Walkthrough Audit ────────────────────

interface FlowStep {
  step: string;
  route: string;
  /** Required operator fields in the POST body (excluding operatorId / operatorReason). */
  requiredFields: number;
  /** True if the route exists and is operator-supervised; false if missing or pure-transform-only. */
  routeExists: boolean;
  /** True if the operator has to leave the current page to complete this step. */
  pageHandoff: boolean;
  note?: string;
}

async function auditOperatorWalkthrough(): Promise<FlowStep[]> {
  console.log('\nPHASE 1 · OPERATOR WALKTHROUGH AUDIT');
  const flow: FlowStep[] = [];

  // Detect friction-reduction surfaces. When present, the audit measures
  // the operator path through those surfaces instead of through the
  // legacy multi-route chain.
  const fastStartExists       = await exists('app/api/fast-start/route.ts');
  const simplePerfExists      = await exists('app/api/simple-performance/route.ts');
  const brandRouteExists      = await exists('app/api/brand/route.ts');
  const productRouteExists    = await exists('app/api/product/route.ts');
  const wspContextRouteExists = await exists('app/api/workspace-context/route.ts');
  const channelUnifiedExists  = await exists('app/api/channel-unified/route.ts');

  if (fastStartExists) {
    // 1 · Fast Start collapses Org + Workspace + Membership + Brand +
    //     Product + Activation + Workflow into a single POST.
    flow.push({
      step: '1 · Fast Start (org+brand+product+workflow)', route: '/api/fast-start',
      requiredFields: 4, // organizationName, brandName, productName, goalId
      routeExists: true, pageHandoff: false,
      note: 'fast-start scaffolds 7 entities in one round-trip',
    });
  } else {
    flow.push({
      step: '1 · New Organization', route: '/api/organization',
      requiredFields: 2, routeExists: await exists('app/api/organization/route.ts'),
      pageHandoff: false,
    });
    flow.push({
      step: '2 · New Brand', route: brandRouteExists ? '/api/brand' : '/api/brand (missing)',
      requiredFields: 2, routeExists: brandRouteExists, pageHandoff: true,
      note: brandRouteExists ? undefined : 'no operator-facing route',
    });
    if (!brandRouteExists) find({
      id: 'wk-brand-route-missing', phase: 1, severity: 'high',
      category: 'walkthrough/missing-route',
      note: 'creating a Brand requires direct pure-transform access; no operator-facing route',
      where: 'lib/workspaceMemory.ts',
    });
    flow.push({
      step: '3 · New Product', route: productRouteExists ? '/api/product' : '/api/product (missing)',
      requiredFields: 3, routeExists: productRouteExists, pageHandoff: true,
      note: productRouteExists ? undefined : 'no operator-facing route',
    });
    if (!productRouteExists) find({
      id: 'wk-product-route-missing', phase: 1, severity: 'high',
      category: 'walkthrough/missing-route',
      note: 'creating a Product requires direct pure-transform access; no operator-facing route',
      where: 'lib/workspaceMemory.ts',
    });
    flow.push({
      step: '4 · New Campaign', route: '/api/campaign-planner',
      requiredFields: 5, routeExists: await exists('app/api/campaign-planner/route.ts'),
      pageHandoff: true,
    });
    // Workflow orchestrate retypes brand · product · market · audience.
    flow.push({
      step: '5 · New Workflow', route: '/api/workflows',
      requiredFields: 6, routeExists: await exists('app/api/workflows/route.ts'),
      pageHandoff: true,
      note: 'orchestrate requires brand · product · market · audience labels duplicated from earlier steps',
    });
    if (!wspContextRouteExists) find({
      id: 'wk-workflow-duplicate-context', phase: 1, severity: 'medium',
      category: 'walkthrough/duplicate-input',
      note: 'workflow orchestrate re-asks for brand · product · market · audience already known by the workspace',
      where: 'app/api/workflows/route.ts',
    });
  }

  // 5 · (or 2 · when fast-start present) New Asset → /api/asset-registry
  // When /api/workspace-context resolves the context, formula · campaign ·
  // sourceBriefId · sourcePromptId default from the workspace + workflow.
  // Operator-typed fields collapse to packageType · sourceStoryName ·
  // prompt · summary (4).
  flow.push({
    step: fastStartExists ? '2 · New Asset' : '6 · New Asset',
    route: '/api/asset-registry',
    requiredFields: wspContextRouteExists ? 4 : 7,
    routeExists: await exists('app/api/asset-registry/route.ts'),
    pageHandoff: true,
    note: wspContextRouteExists
      ? 'context auto-fills formula · campaign · sourceBriefId · sourcePromptId'
      : undefined,
  });

  // 6 · (or 3 ·) New Approval → /api/asset-registry approve
  flow.push({
    step: fastStartExists ? '3 · New Approval' : '7 · New Approval',
    route: '/api/asset-registry (approve)',
    requiredFields: 1,
    routeExists: await exists('app/api/asset-registry/route.ts'),
    pageHandoff: false,
  });

  // 7 · (or 4 ·) New Publication → /api/publication-registry
  // When workspace-context resolves campaign · formula · audience, the
  // operator only types assetId · channel · externalUrl · platform (4).
  flow.push({
    step: fastStartExists ? '4 · New Publication' : '8 · New Publication',
    route: '/api/publication-registry',
    requiredFields: wspContextRouteExists ? 4 : 7,
    routeExists: await exists('app/api/publication-registry/route.ts'),
    pageHandoff: true,
    note: channelUnifiedExists
      ? 'unified channel taxonomy available via /api/channel-unified · context auto-fills campaign · formula · audience'
      : 'channel taxonomy diverges from /api/channel-architecture (ChannelRef vs PublicationChannel)',
  });
  if (!channelUnifiedExists) find({
    id: 'wk-channel-taxonomy-split', phase: 1, severity: 'medium',
    category: 'walkthrough/inconsistent-vocab',
    note: 'ChannelRef (channelArchitecture) vs PublicationChannel (publicationRegistry) — operator must map manually',
    where: 'lib/business/channelArchitecture.ts · lib/publicationRegistryMemory.ts',
  });

  // 8 · (or 5 ·) New Performance Entry — Simple variant if available.
  if (simplePerfExists) {
    flow.push({
      step: fastStartExists ? '5 · New Performance Entry (simple)' : '9 · New Performance Entry (simple)',
      route: '/api/simple-performance', requiredFields: 5, // publicationId, views, clicks, engagement, revenueUSD
      routeExists: true, pageHandoff: true,
      note: 'simple performance · 5 fields · revenue event auto-emitted from same call',
    });
  } else {
    flow.push({
      step: fastStartExists ? '5 · New Performance Entry' : '9 · New Performance Entry',
      route: '/api/performance', requiredFields: 8,
      routeExists: await exists('app/api/performance/route.ts'),
      pageHandoff: true,
      note: 'measurementWindow is nested · metrics is a flat record with 12 optional fields',
    });
    find({
      id: 'wk-performance-deep-shape', phase: 1, severity: 'medium',
      category: 'walkthrough/shape-complexity',
      note: 'performance POST requires nested measurementWindow + 12-field metrics record; operator round-trip is heavy',
      measure: 8,
      where: 'app/api/performance/route.ts',
    });
  }

  // 9 · (or 6 ·) New Journey Entry — only when simple-performance does
  //   not already emit a revenue event in the same call.
  if (!simplePerfExists) {
    flow.push({
      step: fastStartExists ? '6 · New Journey Entry' : '10 · New Journey Entry',
      route: '/api/customer-journey', requiredFields: 4,
      routeExists: await exists('app/api/customer-journey/route.ts'),
      pageHandoff: true,
    });
  }

  const totalFields = flow.reduce((acc, f) => acc + f.requiredFields, 0);
  const handoffs = flow.filter((f) => f.pageHandoff).length;
  const missing = flow.filter((f) => !f.routeExists).length;
  console.log(
    `  TOTAL · steps=${flow.length} · field-entries=${totalFields} · ` +
    `page-handoffs=${handoffs} · missing-routes=${missing} ` +
    `· fast-start=${fastStartExists} · simple-performance=${simplePerfExists} ` +
    `· workspace-context=${wspContextRouteExists} · channel-unified=${channelUnifiedExists}`,
  );
  find({
    id: 'wk-total-field-entries',
    phase: 1,
    severity: totalFields > 22 ? 'medium' : 'low',
    category: 'walkthrough/cost',
    note: `operator types ~${totalFields} fields end-to-end (excluding operatorReason on each call)`,
    measure: totalFields,
  });
  find({
    id: 'wk-page-handoffs', phase: 1, severity: handoffs > 4 ? 'medium' : 'low',
    category: 'walkthrough/navigation',
    note: `operator leaves the current page ${handoffs} times across the ${flow.length} flows`,
    measure: handoffs,
  });
  return flow;
}

// ─── Phase 2 · Time-to-Value Audit ───────────────────────────

function ttv(
  label: string, requiredFields: number, requiredRoundTrips: number,
  pageHandoffs: number, manualEntries: number,
  directLinkedHandoffs = false,
): { label: string; estimatedMinutes: number; breakdown: string } {
  // Coarse operator-effort estimate (lower-bound):
  //   - 6s per field entry
  //   - 12s per round-trip (load + read advisory + submit)
  //   - 20s per page handoff when the operator must locate the next page
  //   - 10s per page handoff when the previous response surfaced a
  //     direct link to it (fast-start result emits links to /dashboard
  //     and /workflows, so the asset register handoff is one click)
  //   - 30s per manual entry that re-types known context
  const handoffCost = directLinkedHandoffs ? 10 : 20;
  const seconds = requiredFields * 6 + requiredRoundTrips * 12 +
                  pageHandoffs * handoffCost + manualEntries * 30;
  return {
    label, estimatedMinutes: Math.round(seconds / 60 * 10) / 10,
    breakdown: `${requiredFields} fields · ${requiredRoundTrips} round-trips · ${pageHandoffs} handoffs${directLinkedHandoffs ? ' (direct-linked)' : ''} · ${manualEntries} re-typed contexts`,
  };
}

async function auditTimeToValue(): Promise<Array<ReturnType<typeof ttv>>> {
  console.log('\nPHASE 2 · TIME-TO-VALUE AUDIT (coarse operator-effort estimates)');
  const fastStartExists  = await exists('app/api/fast-start/route.ts');
  const simplePerfExists = await exists('app/api/simple-performance/route.ts');

  const wspContextExists = await exists('app/api/workspace-context/route.ts');
  // When workspace-context resolves campaign · formula · audience, the
  // asset + publication routes only need 4 operator-typed fields each
  // (vs 7 in the legacy path).
  const assetFields = wspContextExists ? 4 : 7;
  const pubFields   = wspContextExists ? 4 : 7;

  const rows: Array<ReturnType<typeof ttv>> = fastStartExists
    ? [
        // Org Created → First Asset Produced (via fast-start)
        //   fast-start result emits direct links → handoff is one click.
        ttv('Org Created → First Asset Produced', 4 + assetFields, 2, 1, 0, true),
        // First Asset → First Workflow Activated
        //   fast-start already produced an active workflow → zero cost.
        ttv('First Asset → First Workflow Activated', 0, 0, 0, 0),
        // First Workflow → First Performance Recorded
        //   asset page surfaces a "register publication" link → handoff is direct-linked.
        ttv(
          'First Workflow → First Performance Recorded',
          simplePerfExists ? pubFields + 5 : pubFields + 8,
          2, 1, 0, true,
        ),
        // First Performance → First Revenue Event Recorded
        //   When simple-performance accepts revenueUSD inline, the
        //   revenue event is auto-emitted from the same POST → zero cost.
        simplePerfExists
          ? ttv('First Performance → First Revenue Event Recorded', 0, 0, 0, 0)
          : ttv('First Performance → First Revenue Event Recorded', 4, 1, 0, 1),
      ]
    : [
        ttv('Org Created → First Asset Produced', 14, 4, 3, 1),
        ttv('First Asset → First Workflow Activated', 7, 2, 1, 4),
        ttv('First Workflow → First Performance Recorded', 15, 2, 1, 1),
        ttv('First Performance → First Revenue Event Recorded', 4, 1, 0, 1),
      ];
  const total = rows.reduce((acc, r) => acc + r.estimatedMinutes, 0);
  for (const r of rows) {
    console.log(`  ${r.label} · ${r.estimatedMinutes} min · ${r.breakdown}`);
  }
  console.log(`  TOTAL · ${Math.round(total * 10) / 10} min` +
    (fastStartExists ? ' · fast-start path' : ' · legacy path'));
  find({
    id: 'ttv-total-minutes', phase: 2,
    severity: total >= 5 ? 'high' : (total >= 3 ? 'medium' : 'low'),
    category: 'time-to-value/friction',
    note: 'operator-effort estimate from org creation to first revenue event',
    measure: total,
  });
  // Workflow context rewrite friction only fires on the legacy path; the
  // fast-start path takes brand · product · market · audience once and
  // re-uses them inside the same call.
  if (!fastStartExists) {
    find({
      id: 'ttv-workflow-rewrite', phase: 2, severity: 'medium',
      category: 'time-to-value/redundant-input',
      note: '~4 re-typed contexts on workflow orchestrate (brand · product · market · audience)',
      measure: 4,
    });
  }
  return rows;
}

// ─── Phase 3 · UI Consistency Audit ──────────────────────────

interface ConsistencyAxis { axis: string; ok: boolean; note: string }

async function auditUIConsistency(): Promise<ConsistencyAxis[]> {
  console.log('\nPHASE 3 · UI CONSISTENCY AUDIT');
  const axes: ConsistencyAxis[] = [];
  // All operator-facing top-level pages.
  const allCandidatePages = [
    'app/dashboard/page.tsx', 'app/onboarding/page.tsx',
    'app/growth/page.tsx', 'app/workflows/page.tsx',
    'app/fast-start/page.tsx', 'app/brands/page.tsx', 'app/products/page.tsx',
  ];
  const pages: string[] = [];
  for (const p of allCandidatePages) if (await exists(p)) pages.push(p);

  // ── naming consistency: every page has CreativeOS eyebrow ────
  let creativeOsEyebrowCount = 0;
  for (const p of pages) {
    const src = await readFile(p);
    if (/CreativeOS\s*·/.test(src)) creativeOsEyebrowCount += 1;
  }
  axes.push({
    axis: 'naming',
    ok: creativeOsEyebrowCount === pages.length,
    note: `${creativeOsEyebrowCount}/${pages.length} pages declare the CreativeOS eyebrow`,
  });
  if (creativeOsEyebrowCount !== pages.length) {
    find({
      id: 'ui-naming-eyebrow', phase: 3, severity: 'low',
      category: 'consistency/naming',
      note: `only ${creativeOsEyebrowCount}/${pages.length} pages render the CreativeOS eyebrow`,
    });
  }

  // ── breadcrumb consistency: every page surfaces organizationId ────
  let breadcrumbCount = 0;
  for (const p of pages) {
    const src = await readFile(p);
    // Each page must reference organizationId AND workspaceId in the rendered output.
    if (/organizationId/.test(src) && /workspaceId/.test(src)) breadcrumbCount += 1;
  }
  axes.push({
    axis: 'breadcrumb',
    ok: breadcrumbCount === pages.length,
    note: `${breadcrumbCount}/${pages.length} pages surface organizationId + workspaceId`,
  });
  if (breadcrumbCount < pages.length) {
    find({
      id: 'ui-breadcrumb-missing', phase: 3, severity: 'medium',
      category: 'consistency/breadcrumb',
      note: `${pages.length - breadcrumbCount} page(s) do not render the org→workspace breadcrumb`,
    });
  }

  // ── channel consistency: ChannelRef vs PublicationChannel ────
  const channelArch = await readFile('lib/business/channelArchitecture.ts');
  const pubMem = await readFile('lib/publicationRegistryMemory.ts');
  // Extract the literal channel ids from both.
  const channelArchIds = Array.from(
    channelArch.matchAll(/channelId:\s*'([a-z0-9-]+)'/g),
  ).map((m) => m[1]).sort();
  const pubChannelMatch = pubMem.match(/PublicationChannel\s*=\s*([\s\S]*?);/);
  const pubChannelIds = pubChannelMatch
    ? Array.from(pubChannelMatch[1].matchAll(/'([a-z0-9-]+)'/g)).map((m) => m[1]).sort()
    : [];
  const archInPub = channelArchIds.filter((id) => pubChannelIds.includes(id)).length;
  // When the unified channel adapter exists, the operator no longer
  // navigates between the two vocabularies — channelUnified maps them.
  const channelUnifiedAdapterExists = await exists('lib/business/channelUnified.ts');
  axes.push({
    axis: 'channel',
    ok: archInPub === channelArchIds.length || channelUnifiedAdapterExists,
    note: channelUnifiedAdapterExists
      ? `${archInPub}/${channelArchIds.length} verbatim · unified adapter present (lib/business/channelUnified.ts)`
      : `${archInPub}/${channelArchIds.length} ChannelRef ids appear verbatim in PublicationChannel`,
  });
  if (archInPub < channelArchIds.length && !channelUnifiedAdapterExists) {
    find({
      id: 'ui-channel-vocab-split', phase: 3, severity: 'medium',
      category: 'consistency/channel',
      note: `${channelArchIds.length - archInPub} ChannelRef ids do not appear in PublicationChannel — operator must map`,
      where: 'lib/business/channelArchitecture.ts · lib/publicationRegistryMemory.ts',
    });
  }

  // ── formula consistency: same 4 formulas everywhere ────
  const expectedFormulas = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'].sort();
  let formulaConsistentFiles = 0;
  const formulaFiles = [
    'src/core/types.ts', 'lib/knowledgeMemory.ts',
    'lib/business/workspaceActivation.ts',
  ];
  for (const f of formulaFiles) {
    if (!(await exists(f))) continue;
    const src = await readFile(f);
    const found = expectedFormulas.every((g) => new RegExp(`['"]${g}['"]`).test(src));
    if (found) formulaConsistentFiles += 1;
  }
  axes.push({
    axis: 'formula',
    ok: formulaConsistentFiles >= 2,
    note: `${formulaConsistentFiles}/${formulaFiles.length} files reference ENERGY · FOCUS · RELAX · SLEEP`,
  });

  // ── status consistency: workflow status vs asset approval status ────
  const wfMem = await readFile('lib/workflows/workflowMemory.ts');
  const assetMem = await readFile('lib/assetRegistryMemory.ts');
  const wfStatuses = (wfMem.match(/WorkflowStatus\s*=\s*([\s\S]*?);/)?.[1] ?? '')
    .match(/'([a-z-]+)'/g)?.map((s) => s.replace(/'/g, '')) ?? [];
  const assetStatuses = (assetMem.match(/AssetApprovalStatus\s*=\s*([\s\S]*?);/)?.[1] ?? '')
    .match(/'([a-z-]+)'/g)?.map((s) => s.replace(/'/g, '')) ?? [];
  axes.push({
    axis: 'status',
    ok: wfStatuses.includes('completed') && assetStatuses.includes('approved'),
    note: `workflow=[${wfStatuses.join(',')}] · asset=[${assetStatuses.join(',')}] (tokens differ by intent)`,
  });
  // The token sets DO differ — that's by design (different lifecycles). We
  // surface the difference as a low-severity confusion risk.
  find({
    id: 'ui-status-token-diff', phase: 3, severity: 'low',
    category: 'consistency/status',
    note: 'workflow uses {draft·active·blocked·completed·abandoned}; asset uses {pending·approved·rejected·archived}',
  });

  // ── navigation consistency: every page renders dashboard nav links ────
  let navLinkPagesCount = 0;
  for (const p of pages) {
    const src = await readFile(p);
    // Any reference to /dashboard from the page source counts — pages
    // may use Next.js Link with a pathname object, a plain <a href>, or
    // a template literal href={`/dashboard?…`}.
    if (/\/dashboard/.test(src)) navLinkPagesCount += 1;
  }
  axes.push({
    axis: 'navigation',
    ok: navLinkPagesCount >= 2,
    note: `${navLinkPagesCount}/${pages.length} pages link back to /dashboard`,
  });
  if (navLinkPagesCount < pages.length) {
    find({
      id: 'ui-nav-back-link', phase: 3, severity: 'medium',
      category: 'consistency/navigation',
      note: `${pages.length - navLinkPagesCount} page(s) do not link back to /dashboard`,
    });
  }

  // ── role consistency: 6 declared roles appear in matrix + nav ────
  const matrix = await readFile('lib/tenancy/permissionMatrix.ts');
  const nav = await readFile('lib/productization/navigation.ts');
  const roles = ['platform-owner', 'organization-owner', 'admin', 'manager', 'editor', 'viewer'];
  const inMatrix = roles.every((r) => new RegExp(`'${r}'`).test(matrix));
  const inNav = roles.every((r) => new RegExp(`'${r}'`).test(nav));
  axes.push({
    axis: 'role',
    ok: inMatrix && inNav,
    note: `roles ${inMatrix ? 'matrix=ok' : 'matrix=missing'} · ${inNav ? 'nav=ok' : 'nav=missing'}`,
  });

  for (const a of axes) {
    console.log(`  ${a.ok ? '✓' : '✗'} ${a.axis} · ${a.note}`);
  }
  return axes;
}

// ─── Phase 4 · Data Consistency Audit ────────────────────────

async function auditDataConsistency(): Promise<{
  orphans: number; duplicates: number; brokenRefs: number;
}> {
  console.log('\nPHASE 4 · DATA CONSISTENCY AUDIT');
  // Run the seed against a temp dir, then inspect the resulting files.
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'reality-hardening-'));
  execSync(`MOOD_MEMORY_DIR=${tmp} npx tsx scripts/seed-mood-pilot.ts`, {
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  async function readJson<T>(file: string): Promise<T | null> {
    try {
      const raw = await fs.readFile(path.join(tmp, file), 'utf8');
      return JSON.parse(raw) as T;
    } catch { return null; }
  }

  const org = await readJson<{
    organizations: Array<{ organizationId: string }>;
    workspaces: Array<{ workspaceId: string; organizationId: string }>;
    memberships: Array<{ membershipId: string; organizationId: string; workspaceIds?: string[] }>;
  }>('organization-memory.json');
  const ws = await readJson<{
    brands: Array<{ brandId: string; projectId: string }>;
    products: Array<{ productId: string; brandId: string }>;
    campaigns?: Array<{ campaignId: string; productId: string }>;
  }>('workspace-memory.json');
  const wf = await readJson<{ workflows: Array<{ workflowId: string; label: string }> }>('workflow-memory.json');
  const ar = await readJson<{ assets: Array<{ assetId: string; campaign: string }> }>('asset-registry-memory.json');
  const pr = await readJson<{ publications: Array<{ publicationId: string; assetId: string; campaign: string }> }>('publication-registry-memory.json');
  const pm = await readJson<{ performances: Array<{ performanceId: string; assetId: string; publicationId: string }> }>('performance-memory.json');
  const jr = await readJson<{ events: Array<{ eventId: string; publicationId?: string; assetId?: string }> }>('customer-journey-memory.json');

  let orphans = 0, duplicates = 0, brokenRefs = 0;

  // ── orphans ─────────────────────────────────────────────────
  // 4.1 · brands referencing a missing projectId (projects are advisory in
  //       the existing platform — no projects memory yet seeded, so brand's
  //       projectId is informally a placeholder; surface as low-severity).
  const brandsWithPlaceholderProject = (ws?.brands ?? []).filter(
    (b) => /placeholder|pilot/i.test(b.projectId) || b.projectId === 'project-mood-pilot').length;
  if (brandsWithPlaceholderProject > 0) {
    find({
      id: 'dc-brand-project-placeholder', phase: 4, severity: 'low',
      category: 'consistency/orphan',
      note: 'BrandRecord.projectId references a placeholder project (no ProjectRecord seeded)',
      measure: brandsWithPlaceholderProject,
      where: 'lib/workspaceMemory.ts',
    });
    orphans += brandsWithPlaceholderProject;
  }

  // 4.2 · workflows whose label is not referenced by any asset.campaign ──
  const workflowLabels = new Set((wf?.workflows ?? []).map((w) => w.label));
  const assetCampaignLabels = new Set((ar?.assets ?? []).map((a) => a.campaign));
  const orphanWorkflows = [...workflowLabels].filter(
    (lbl) => !assetCampaignLabels.has(lbl));
  if (orphanWorkflows.length > 0) {
    find({
      id: 'dc-orphan-workflows', phase: 4, severity: 'medium',
      category: 'consistency/orphan',
      note: 'workflows with no asset.campaign matching the workflow label',
      measure: orphanWorkflows.length,
    });
    orphans += orphanWorkflows.length;
  }

  // 4.3 · assets with no publication, journey, or performance reference ──
  const referencedAssetIds = new Set<string>([
    ...((pr?.publications ?? []).map((p) => p.assetId)),
    ...((pm?.performances ?? []).map((p) => p.assetId)),
    ...((jr?.events ?? []).map((e) => e.assetId).filter(Boolean) as string[]),
  ]);
  const orphanAssets = (ar?.assets ?? []).filter((a) => !referencedAssetIds.has(a.assetId));
  if (orphanAssets.length > 0) {
    find({
      id: 'dc-orphan-assets', phase: 4, severity: 'low',
      category: 'consistency/orphan',
      note: 'assets with no downstream publication / performance / journey reference (often pending)',
      measure: orphanAssets.length,
    });
    orphans += orphanAssets.length;
  }

  // ── duplicates ──────────────────────────────────────────────
  // 4.4 · duplicate ids inside each store (defensive — should never happen)
  const stores: Array<[string, Array<{ id: string }>]> = [
    ['organizations',  (org?.organizations ?? []).map((o) => ({ id: o.organizationId }))],
    ['workspaces',     (org?.workspaces ?? []).map((w) => ({ id: w.workspaceId }))],
    ['memberships',    (org?.memberships ?? []).map((m) => ({ id: m.membershipId }))],
    ['brands',         (ws?.brands ?? []).map((b) => ({ id: b.brandId }))],
    ['products',       (ws?.products ?? []).map((p) => ({ id: p.productId }))],
    ['workflows',      (wf?.workflows ?? []).map((w) => ({ id: w.workflowId }))],
    ['assets',         (ar?.assets ?? []).map((a) => ({ id: a.assetId }))],
    ['publications',   (pr?.publications ?? []).map((p) => ({ id: p.publicationId }))],
    ['performances',   (pm?.performances ?? []).map((p) => ({ id: p.performanceId }))],
    ['journey-events', (jr?.events ?? []).map((e) => ({ id: e.eventId }))],
  ];
  for (const [name, rows] of stores) {
    const seen = new Map<string, number>();
    for (const r of rows) seen.set(r.id, (seen.get(r.id) ?? 0) + 1);
    const dup = [...seen.entries()].filter(([, n]) => n > 1);
    if (dup.length > 0) {
      find({
        id: `dc-duplicate-${name}`, phase: 4, severity: 'high',
        category: 'consistency/duplicate',
        note: `${name} carries ${dup.length} duplicate id(s)`,
        measure: dup.length,
      });
      duplicates += dup.length;
    }
  }

  // ── broken references ───────────────────────────────────────
  // 4.5 · workspace → organization
  const orgIds = new Set((org?.organizations ?? []).map((o) => o.organizationId));
  const orphanWsps = (org?.workspaces ?? []).filter((w) => !orgIds.has(w.organizationId));
  if (orphanWsps.length > 0) {
    find({
      id: 'dc-broken-workspace-org', phase: 4, severity: 'high',
      category: 'consistency/broken-ref',
      note: 'workspace references a missing organizationId',
      measure: orphanWsps.length,
    });
    brokenRefs += orphanWsps.length;
  }
  // 4.6 · membership → organization
  const orphanMems = (org?.memberships ?? []).filter((m) => !orgIds.has(m.organizationId));
  if (orphanMems.length > 0) {
    find({
      id: 'dc-broken-membership-org', phase: 4, severity: 'high',
      category: 'consistency/broken-ref',
      note: 'membership references a missing organizationId',
      measure: orphanMems.length,
    });
    brokenRefs += orphanMems.length;
  }
  // 4.7 · product → brand
  const brandIds = new Set((ws?.brands ?? []).map((b) => b.brandId));
  const orphanProducts = (ws?.products ?? []).filter((p) => !brandIds.has(p.brandId));
  if (orphanProducts.length > 0) {
    find({
      id: 'dc-broken-product-brand', phase: 4, severity: 'high',
      category: 'consistency/broken-ref',
      note: 'product references a missing brandId',
      measure: orphanProducts.length,
    });
    brokenRefs += orphanProducts.length;
  }
  // 4.8 · publication → asset
  const assetIds = new Set((ar?.assets ?? []).map((a) => a.assetId));
  const orphanPubs = (pr?.publications ?? []).filter((p) => !assetIds.has(p.assetId));
  if (orphanPubs.length > 0) {
    find({
      id: 'dc-broken-publication-asset', phase: 4, severity: 'high',
      category: 'consistency/broken-ref',
      note: 'publication references a missing assetId',
      measure: orphanPubs.length,
    });
    brokenRefs += orphanPubs.length;
  }
  // 4.9 · performance → publication + asset
  const pubIds = new Set((pr?.publications ?? []).map((p) => p.publicationId));
  const orphanPerf = (pm?.performances ?? []).filter(
    (r) => !pubIds.has(r.publicationId) || !assetIds.has(r.assetId));
  if (orphanPerf.length > 0) {
    find({
      id: 'dc-broken-performance-link', phase: 4, severity: 'high',
      category: 'consistency/broken-ref',
      note: 'performance references a missing publicationId or assetId',
      measure: orphanPerf.length,
    });
    brokenRefs += orphanPerf.length;
  }
  // 4.10 · journey → publication / asset
  const orphanJourneys = (jr?.events ?? []).filter(
    (e) =>
      (e.publicationId && !pubIds.has(e.publicationId)) ||
      (e.assetId && !assetIds.has(e.assetId)));
  if (orphanJourneys.length > 0) {
    find({
      id: 'dc-broken-journey-link', phase: 4, severity: 'medium',
      category: 'consistency/broken-ref',
      note: 'journey events reference a missing publicationId or assetId',
      measure: orphanJourneys.length,
    });
    brokenRefs += orphanJourneys.length;
  }

  try { await fs.rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }

  console.log(
    `  TOTAL · orphans=${orphans} · duplicates=${duplicates} · broken-refs=${brokenRefs}`,
  );
  return { orphans, duplicates, brokenRefs };
}

// ─── Phase 5 · Top 10 Pain Points ────────────────────────────

function rankTopTen(): Finding[] {
  const sevScore: Record<Finding['severity'], number> = { high: 3, medium: 2, low: 1 };
  return FINDINGS
    .slice()
    .sort((a, b) => {
      const s = sevScore[b.severity] - sevScore[a.severity];
      if (s !== 0) return s;
      return (b.measure ?? 0) - (a.measure ?? 0);
    })
    .slice(0, 10);
}

// ─── runner ──────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('REALITY HARDENING AUDIT · observation only · no new architecture\n');
  const walkthrough = await auditOperatorWalkthrough();
  const ttvRows = await auditTimeToValue();
  const consistency = await auditUIConsistency();
  const data = await auditDataConsistency();

  console.log('\nPHASE 5 · TOP 10 PAIN POINTS');
  const top10 = rankTopTen();
  top10.forEach((f, i) => {
    console.log(`  ${i + 1}. [${f.severity}] ${f.id} · ${f.note}`);
  });

  // Emit a machine-readable artifact for downstream tooling. The artifact
  // is intentionally NOT committed (data/runtime is gitignored).
  const artifactDir = path.resolve(__dirname, '..', 'data', 'runtime');
  await fs.mkdir(artifactDir, { recursive: true });
  await fs.writeFile(
    path.join(artifactDir, 'reality-hardening-audit.json'),
    JSON.stringify({
      generatedAt: Date.now(),
      walkthrough, ttvRows, consistency, data,
      findings: FINDINGS, top10,
    }, null, 2),
  );

  console.log('\nSUMMARY');
  console.log(`  walkthrough steps:    ${walkthrough.length}`);
  console.log(`  ttv rows:             ${ttvRows.length}`);
  console.log(`  consistency axes:     ${consistency.length}`);
  console.log(`  data orphans:         ${data.orphans}`);
  console.log(`  data duplicates:      ${data.duplicates}`);
  console.log(`  data broken refs:     ${data.brokenRefs}`);
  console.log(`  total findings:       ${FINDINGS.length}`);
  console.log('\nArtifact: data/runtime/reality-hardening-audit.json (gitignored)');
}
main().catch((err) => { console.error('audit crashed:', err); process.exit(1); });
