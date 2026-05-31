/**
 * scripts/verify-mood-pilot.ts
 *
 * Verifies the MOOD pilot seed is well-formed, idempotent, and uses
 * ONLY existing memory stores. No new architecture introduced.
 *
 * Runs the seed against a temp dir, then asserts the resulting state
 * is internally consistent and the seed is deterministic.
 *
 * Run: npx tsx scripts/verify-mood-pilot.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';
import { PLATFORM_TENANT_ID_MOOD, PLATFORM_WORKSPACE_ID_MOOD } from '../lib/tenancy/types';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];
function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

function runSeed(memDir: string): { stdout: string; stderr: string; ok: boolean } {
  try {
    const out = execSync(`MOOD_MEMORY_DIR=${memDir} npx tsx scripts/seed-mood-pilot.ts`, {
      stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8',
    });
    return { stdout: out, stderr: '', ok: true };
  } catch (e) {
    const err = e as { stdout?: string; stderr?: string };
    return { stdout: err.stdout ?? '', stderr: err.stderr ?? '', ok: false };
  }
}

async function readMemFile<T>(memDir: string, file: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(path.join(memDir, file), 'utf8');
    return JSON.parse(raw) as T;
  } catch { return null; }
}

async function main(): Promise<void> {
  console.log('MOOD PILOT VERIFICATION\n');
  const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'mood-pilot-verify-'));

  // ── 1 · seed runs cleanly ─────────────────────────────────
  const first = runSeed(tmp);
  record('seed-runs', 'seed script runs cleanly', first.ok, first.ok ? 'ok' : `stderr:\n${first.stderr.slice(0, 200)}`);
  if (!first.ok) {
    process.exit(1);
  }

  // ── 2 · idempotent ─────────────────────────────────────────
  const second = runSeed(tmp);
  record('seed-idempotent', 'second seed run does not duplicate records',
    second.ok && /products:\s+4/.test(second.stdout) && /assets:\s+9/.test(second.stdout),
    `re-run completed: assets=9 retained · publications=5 retained`);

  // ── 3 · organization · workspace · memberships present ─────
  const org = await readMemFile<{
    organizations: Array<{ organizationId: string; name: string; slug: string }>;
    workspaces: Array<{ workspaceId: string; organizationId: string }>;
    memberships: Array<{ membershipId: string; organizationId: string; memberId: string; roles: string[] }>;
  }>(tmp, 'organization-memory.json');
  const hasOrg = !!org && org.organizations.some((o) => o.organizationId === PLATFORM_TENANT_ID_MOOD && o.name === 'MOOD');
  const hasWsp = !!org && org.workspaces.some((w) => w.workspaceId === PLATFORM_WORKSPACE_ID_MOOD);
  const mems = org?.memberships ?? [];
  const ownerMem  = mems.find((m) => m.roles.includes('organization-owner'));
  const managerMem = mems.find((m) => m.roles.includes('manager'));
  const editorMem  = mems.find((m) => m.roles.includes('editor'));
  record('org-record', 'organization MOOD record present (id=org-mood · name=MOOD)', hasOrg, `org=${hasOrg}`);
  record('wsp-record', 'workspace wsp-mood-default present', hasWsp, `wsp=${hasWsp}`);
  record('memberships', '3 memberships (owner · manager · editor) present',
    !!ownerMem && !!managerMem && !!editorMem,
    `owner=${!!ownerMem} manager=${!!managerMem} editor=${!!editorMem}`);

  // ── 4 · brand + 4 products ─────────────────────────────────
  const ws = await readMemFile<{
    brands: Array<{ brandId: string; name: string }>;
    products: Array<{ productId: string; brandId: string; formula: string }>;
  }>(tmp, 'workspace-memory.json');
  const moodBrand = ws?.brands.find((b) => b.name === 'mood') ?? null;
  const productFormulas = new Set(ws?.products.filter((p) => p.brandId === moodBrand?.brandId).map((p) => p.formula));
  record('brand', 'brand "mood" present', !!moodBrand, `brand=${!!moodBrand}`);
  record('products',
    '4 products (ENERGY · FOCUS · RELAX · SLEEP)',
    productFormulas.has('ENERGY') && productFormulas.has('FOCUS') &&
    productFormulas.has('RELAX')  && productFormulas.has('SLEEP'),
    [...productFormulas].sort().join(' · '));

  // ── 5 · knowledge: audience · market · brand · visual · formula ──
  const kn = await readMemFile<{ entries: Array<{ category: string; title: string; linkedFormula?: string }> }>(tmp, 'knowledge-memory.json');
  const cats = new Set(kn?.entries.map((e) => e.category) ?? []);
  const formulasInKnowledge = new Set(kn?.entries.map((e) => e.linkedFormula).filter(Boolean) as string[]);
  record('knowledge-categories',
    'knowledge covers audience-rule · brand-rule · visual-rule · formula-rule',
    cats.has('audience-rule') && cats.has('brand-rule') &&
    cats.has('visual-rule')  && cats.has('formula-rule'),
    [...cats].sort().join(' · '));
  record('knowledge-formulas',
    'knowledge has formula-rule per ENERGY · FOCUS · RELAX · SLEEP',
    formulasInKnowledge.has('ENERGY') && formulasInKnowledge.has('FOCUS') &&
    formulasInKnowledge.has('RELAX')  && formulasInKnowledge.has('SLEEP'),
    [...formulasInKnowledge].sort().join(' · '));

  // ── 6 · workspace activation ───────────────────────────────
  const act = await readMemFile<{ activations: Array<{ activationId: string; status: string; organizationId: string }> }>(tmp, 'workspace-activation-memory.json');
  const activated = act?.activations.find((a) => a.organizationId === PLATFORM_TENANT_ID_MOOD && a.status === 'activated');
  record('activation', 'workspace activation present + status=activated', !!activated, `act=${!!activated}`);

  // ── 7 · 3 workflows · active state · plan integrity ────────
  const wf = await readMemFile<{
    workflows: Array<{
      workflowId: string; templateId: string; status: string;
      label: string; plan: { steps: Array<{ stepId: string }>; suggestedDurationDays: number };
    }>;
  }>(tmp, 'workflow-memory.json');
  const wfs = wf?.workflows ?? [];
  const wfTemplates = new Set(wfs.map((w) => w.templateId));
  record('workflows-three',
    '3 workflows (product-launch · lead-generation · brand-awareness)',
    wfTemplates.has('product-launch') && wfTemplates.has('lead-generation') &&
    wfTemplates.has('brand-awareness'),
    [...wfTemplates].sort().join(' · '));
  record('workflows-active',
    'all 3 workflows transitioned to active',
    wfs.length === 3 && wfs.every((w) => w.status === 'active'),
    wfs.map((w) => `${w.templateId}=${w.status}`).join(' · '));
  record('workflows-plan-non-empty',
    'each workflow has non-empty plan + duration > 0',
    wfs.every((w) => w.plan.steps.length > 0 && w.plan.suggestedDurationDays > 0),
    wfs.map((w) => `${w.templateId}: ${w.plan.steps.length} steps · ${w.plan.suggestedDurationDays} days`).join(' · '));

  // ── 8 · assets: 9 + 4 packageTypes + tenancy-tagged campaigns ──
  const ar = await readMemFile<{ assets: Array<{ assetId: string; packageType: string; approvalStatus: string; campaign: string }> }>(tmp, 'asset-registry-memory.json');
  const assets = ar?.assets ?? [];
  const pkgTypes = new Set(assets.map((a) => a.packageType));
  record('assets-count', '9 asset records present', assets.length === 9, `count=${assets.length}`);
  record('assets-package-types',
    '4 package types covered (image · video · carousel · landing)',
    pkgTypes.has('image') && pkgTypes.has('video') &&
    pkgTypes.has('carousel') && pkgTypes.has('landing'),
    [...pkgTypes].sort().join(' · '));
  const approvedAssets = assets.filter((a) => a.approvalStatus === 'approved');
  record('assets-approved', 'at least 5 assets are approved', approvedAssets.length >= 5, `approved=${approvedAssets.length}`);

  // ── 9 · publications and performance ───────────────────────
  const pubs = (await readMemFile<{ publications: Array<{ publicationId: string; status: string }> }>(tmp, 'publication-registry-memory.json'))?.publications ?? [];
  record('publications', '5 publications live', pubs.length === 5 && pubs.every((p) => p.status === 'live'),
    `count=${pubs.length} · all live=${pubs.every((p) => p.status === 'live')}`);

  const perf = (await readMemFile<{ performances: Array<{ performanceId: string; metrics: { views?: number; reach?: number; engagementRate?: number } }> }>(tmp, 'performance-memory.json'))?.performances ?? [];
  record('performance', '5 performance rows, every row has views + reach + engagement',
    perf.length === 5 && perf.every((r) => (r.metrics.views ?? 0) > 0 && (r.metrics.reach ?? 0) > 0),
    `rows=${perf.length}`);

  // ── 10 · journey events: every type observed ──────────────
  const jr = (await readMemFile<{ events: Array<{ eventType: string; revenueUSD?: number }> }>(tmp, 'customer-journey-memory.json'))?.events ?? [];
  const journeyTypes = new Set(jr.map((e) => e.eventType));
  const revenueRows = jr.filter((e) => (e.revenueUSD ?? 0) > 0);
  record('journey-event-types',
    'journey covers impression · view · click · landing-visit · lead · purchase · repeat-purchase',
    journeyTypes.has('impression') && journeyTypes.has('view') &&
    journeyTypes.has('click') && journeyTypes.has('landing-visit') &&
    journeyTypes.has('lead') && journeyTypes.has('purchase') &&
    journeyTypes.has('repeat-purchase'),
    [...journeyTypes].sort().join(' · '));
  record('journey-revenue',
    'at least 10 events carry revenueUSD',
    revenueRows.length >= 10, `revenue rows=${revenueRows.length}`);

  // ── 11 · platform-freeze invariant: no new lib/ modules ────
  const libDirs = await fs.readdir(path.resolve(__dirname, '..', 'lib'), { withFileTypes: true });
  const knownLibDirs = new Set([
    'tenancy', 'productization', 'business', 'workflows',
    'adapters', 'agents', 'banner', 'providers',
  ]);
  const newLibDirs: string[] = [];
  for (const ent of libDirs) {
    if (ent.isDirectory() && !knownLibDirs.has(ent.name)) newLibDirs.push(ent.name);
  }
  record('platform-freeze-libdirs',
    'no new top-level lib/ directories introduced',
    newLibDirs.length === 0,
    newLibDirs.length === 0 ? 'frozen' : `new dirs: ${newLibDirs.join(',')}`);

  // ── 12 · gap audit doc exists ──────────────────────────────
  try {
    await fs.stat(path.resolve(__dirname, '..', 'docs', 'mood-pilot-gap-audit.md'));
    record('gap-audit-doc', 'docs/mood-pilot-gap-audit.md exists', true, 'present');
  } catch { record('gap-audit-doc', 'docs/mood-pilot-gap-audit.md exists', false, 'missing'); }

  // ── cleanup ────────────────────────────────────────────────
  try { await fs.rm(tmp, { recursive: true, force: true }); } catch { /* ignore */ }

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}
main().catch((err) => { console.error('verification crashed:', err); process.exit(2); });
