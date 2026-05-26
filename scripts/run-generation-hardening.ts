/**
 * scripts/run-generation-hardening.ts
 *
 * Controlled repetition runner — generates N safe banners and reports
 * memory/route/panel integrity. Conservative by default. Fail-fast on
 * any anomaly.
 *
 * Distinct from run-controlled-simulations.ts:
 *   - generation-only by default (no branch activations / slider POSTs)
 *   - conservative defaults (ENERGY, 10 runs, brutality 0.5)
 *   - STOPS on first route crash / memory corruption / FIFO breach /
 *     JSON parse failure (--no-fail-fast disables, but on by default)
 *
 * STRICTLY:
 *   - never calls external APIs
 *   - never mutates critic logic / thresholds / prompts
 *   - never auto-optimizes / self-modifies
 *   - never activates branches unless --enable-branch-activation passed
 *
 * Usage:
 *   # Terminal 1
 *   npm run dev
 *
 *   # Terminal 2
 *   npx tsx scripts/run-generation-hardening.ts --formula ENERGY --runs 20 --mode Minimal --brutality 0.5
 *   npx tsx scripts/run-generation-hardening.ts --formula ENERGY --runs 50 --modes Minimal,Editorial,Documentary --brutality 0.5
 */

import { promises as fs } from 'fs';
import * as path from 'path';

// ─── flags ────────────────────────────────────────────────────

interface Flags {
  formula: string;
  runs: number;
  modes: (string | null)[];     // null = AUTO
  brutality: number;
  delayMs: number;
  namespace: string | null;
  dryRun: boolean;
  baseUrl: string;
  enableBranchActivation: boolean;
  failFast: boolean;
  reportPath: string | null;
}

function parseFlags(): Flags {
  const argv = process.argv.slice(2);
  const get = (name: string, fallback?: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    if (idx === -1) return fallback;
    return argv[idx + 1];
  };
  const modesRaw = get('modes');
  const modeRaw = get('mode');
  const modes: (string | null)[] = modesRaw
    ? modesRaw.split(',').map((m) => (m === 'AUTO' || m === '' ? null : m))
    : (modeRaw ? [modeRaw === 'AUTO' ? null : modeRaw] : [null]);
  return {
    formula: get('formula', 'ENERGY') ?? 'ENERGY',
    runs: parseInt(get('runs', '10') ?? '10', 10),
    modes,
    brutality: parseFloat(get('brutality', '0.5') ?? '0.5'),
    delayMs: parseInt(get('delay', '0') ?? '0', 10),
    namespace: get('namespace') ?? null,
    dryRun: argv.includes('--dry-run'),
    baseUrl: get('base-url', 'http://localhost:3000') ?? 'http://localhost:3000',
    enableBranchActivation: argv.includes('--enable-branch-activation'),
    failFast: !argv.includes('--no-fail-fast'),
    reportPath: get('report') ?? null,
  };
}

// ─── HTTP helpers ─────────────────────────────────────────────

interface StreamRunResult {
  ok: boolean;
  bannerReceived: boolean;
  errorMessage: string | null;
  events: number;
  latencyMs: number;
  parseError: string | null;
  finalVerdict: string | null;
  copyIntegrity: number | null;
  trustSafety: number | null;
  policyBand: string | null;
  primaryAudience: string | null;
  trustDebt: number | null;
  campaignRole: string | null;
}

async function runGenerate(
  base: string, formula: string, mode: string | null, brutality: number,
): Promise<StreamRunResult> {
  const t0 = Date.now();
  const result: StreamRunResult = {
    ok: false, bannerReceived: false, errorMessage: null,
    events: 0, latencyMs: 0, parseError: null,
    finalVerdict: null, copyIntegrity: null, trustSafety: null,
    policyBand: null, primaryAudience: null, trustDebt: null, campaignRole: null,
  };
  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        formula,
        ...(mode ? { campaignMode: mode } : {}),
        brutality,
      }),
    });
    if (!res.ok || !res.body) {
      result.errorMessage = `HTTP ${res.status}`;
      result.latencyMs = Date.now() - t0;
      return result;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          const payload = JSON.parse(line) as {
            type: string; error?: string;
            banner?: {
              finalVerdict?: { verdict?: string };
              copyQuality?: { copyIntegrity?: number; trustSafety?: number };
              copyQualityPolicy?: { policyBand?: string };
              adStrategy?: { primaryAudience?: string; trustDebt?: number; campaignRole?: string };
            };
          };
          if (payload.type === 'event') result.events += 1;
          if (payload.type === 'banner' && payload.banner) {
            result.bannerReceived = true;
            result.finalVerdict = payload.banner.finalVerdict?.verdict ?? null;
            result.copyIntegrity = payload.banner.copyQuality?.copyIntegrity ?? null;
            result.trustSafety = payload.banner.copyQuality?.trustSafety ?? null;
            result.policyBand = payload.banner.copyQualityPolicy?.policyBand ?? null;
            result.primaryAudience = payload.banner.adStrategy?.primaryAudience ?? null;
            result.trustDebt = payload.banner.adStrategy?.trustDebt ?? null;
            result.campaignRole = payload.banner.adStrategy?.campaignRole ?? null;
          }
          if (payload.type === 'error') result.errorMessage = payload.error ?? 'unknown';
        } catch (e) {
          // JSON parse failure inside the stream — treat as critical anomaly.
          result.parseError = (e as Error).message;
        }
      }
    }
    result.ok = result.bannerReceived || result.errorMessage !== null;
    result.latencyMs = Date.now() - t0;
    return result;
  } catch (e) {
    result.errorMessage = (e as Error).message;
    result.latencyMs = Date.now() - t0;
    return result;
  }
}

async function getJson<T>(base: string, route: string): Promise<{ ok: boolean; data: T | null; error: string | null }> {
  try {
    const res = await fetch(`${base}${route}`, { cache: 'no-store' });
    if (!res.ok) return { ok: false, data: null, error: `HTTP ${res.status}` };
    const data = await res.json() as T;
    return { ok: true, data, error: null };
  } catch (e) {
    return { ok: false, data: null, error: (e as Error).message };
  }
}

/** Probe the read-only pre-generation-stability endpoint for the
 *  current cell. Records advisory status for the report. The runner
 *  must NEVER act on this signal — it is recorded only. */
interface AdvisoryProbeResult {
  ok: boolean;
  safetyTier: string | null;
  stabilizationStatus: string | null;
  fallbackSuggested: boolean;
}
async function probePreGenAdvisory(
  base: string, formula: string, mode: string | null, brutality: number,
): Promise<AdvisoryProbeResult> {
  try {
    const res = await fetch(`${base}/api/pre-generation-stability`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formula, campaignMode: mode, brutality }),
    });
    if (!res.ok) return { ok: false, safetyTier: null, stabilizationStatus: null, fallbackSuggested: false };
    const data = await res.json() as {
      productionConservativeMode?: { safetyTier?: string; safeFallback?: unknown };
      preGenerationStabilizer?: { stabilizationStatus?: string };
    };
    return {
      ok: true,
      safetyTier: data.productionConservativeMode?.safetyTier ?? null,
      stabilizationStatus: data.preGenerationStabilizer?.stabilizationStatus ?? null,
      fallbackSuggested: data.productionConservativeMode?.safeFallback !== null
        && data.productionConservativeMode?.safeFallback !== undefined,
    };
  } catch {
    return { ok: false, safetyTier: null, stabilizationStatus: null, fallbackSuggested: false };
  }
}

async function postJson(base: string, route: string, body: unknown): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetch(`${base}${route}`, {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── memory probing ───────────────────────────────────────────

interface MemorySnapshot {
  files: Record<string, number>;
}

async function probeMemoryDir(dir: string): Promise<MemorySnapshot> {
  const out: Record<string, number> = {};
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith('.json')) {
        const stat = await fs.stat(path.join(dir, e.name));
        out[e.name] = stat.size;
      }
    }
  } catch {
    /* dir doesn't exist */
  }
  return { files: out };
}

/** Read each memory file's JSON to verify it parses. Returns the list
 *  of files whose contents failed to parse — these indicate memory
 *  corruption and trigger a fail-fast stop. */
async function detectMemoryCorruption(dir: string): Promise<string[]> {
  const broken: string[] = [];
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile() || !e.name.endsWith('.json')) continue;
      try {
        const txt = await fs.readFile(path.join(dir, e.name), 'utf8');
        JSON.parse(txt);
      } catch (err) {
        broken.push(`${e.name}: ${(err as Error).message}`);
      }
    }
  } catch {
    /* dir doesn't exist yet — not a corruption */
  }
  return broken;
}

// ─── route + panel shape capture ──────────────────────────────

const PROBE_ROUTES = [
  '/api/quality-longitudinal',
  '/api/policy-audit',
  '/api/cultural-perception',
  '/api/cross-brain-conflict',
  '/api/cognitive-weight',
  '/api/identity-continuity',
  '/api/executive-governance',
  '/api/strategic-outcome',
  '/api/counterfactual-cognition',
  '/api/campaign-evolution',
  '/api/branch-activation',
  '/api/projection-calibration',
  '/api/operator-confidence-preference?operatorId=studio',
  '/api/operator-calibration-reconciliation?operatorId=studio',
  '/api/system-integrity',
  '/api/integrity-baselines',
];

function topLevelShape(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return value.length === 0 ? '[]' : `[${topLevelShape(value[0])}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as object).sort();
    return `{${keys.join(',')}}`;
  }
  return typeof value;
}

interface RouteProbeResult {
  route: string;
  ok: boolean;
  shape: string | null;
  error: string | null;
}

async function probeRoutes(base: string): Promise<RouteProbeResult[]> {
  const out: RouteProbeResult[] = [];
  for (const route of PROBE_ROUTES) {
    const result = await getJson<unknown>(base, route);
    out.push({
      route, ok: result.ok,
      shape: result.data ? topLevelShape(result.data) : null,
      error: result.error,
    });
  }
  return out;
}

// ─── GenerationHardeningReport ───────────────────────────────

export interface GenerationHardeningReport {
  runsRequested: number;
  runsCompleted: number;
  approvals: number;
  refusals: number;
  failures: number;
  averageLatencyMs: number;
  memoryFilesTouched: string[];
  fifoStatus: {
    capped: number;
    overCap: number;
    total: number;
    overCapDetails: string[];
  };
  routeErrors: string[];
  deterministicWarnings: string[];
  panelSyncWarnings: string[];
  copyQualitySummary: {
    runsWithCopyQuality: number;
    averageCopyIntegrity: number | null;
    averageTrustSafety: number | null;
  };
  strategySummary: {
    audiencesUsed: string[];
    rolesUsed: string[];
    averageTrustDebt: number | null;
  };
  campaignEvolutionSummary: {
    finalPhase: string | null;
    phaseTrend: string | null;
    averageHealth: number | null;
  };
  policyAuditSummary: {
    bandDistribution: Record<string, number>;
  };
  /** Advisory-only readout from /api/pre-generation-stability — recorded
   *  per run, never used to gate execution. The runner ignores this
   *  signal for control flow; it's published in the report so the
   *  operator can see what the advisory layer said about each cell. */
  preGenerationAdvisory: {
    preGenerationStatusDistribution: Record<string, number>;
    productionTierDistribution: Record<string, number>;
    fallbackSuggestedCount: number;
    testingOnlyCount: number;
    blockedForProductionCount: number;
    /** True when the endpoint was unreachable on at least one run. */
    advisoryEndpointUnreachable: boolean;
  };
  stoppedEarly: boolean;
  stoppedReason: string | null;
  warnings: string[];
  reasonCodes: string[];
}

// ─── main ──────────────────────────────────────────────────────

function average(xs: number[]): number {
  if (xs.length === 0) return 0;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

function averageOrNull(xs: Array<number | null>): number | null {
  const real = xs.filter((x): x is number => typeof x === 'number');
  if (real.length === 0) return null;
  return Math.round((real.reduce((a, b) => a + b, 0) / real.length) * 10) / 10;
}

function unique(xs: Array<string | null>): string[] {
  const set = new Set<string>();
  for (const x of xs) if (x) set.add(x);
  return Array.from(set).sort();
}

async function main() {
  const flags = parseFlags();
  console.log('GENERATION HARDENING RUNNER\n');
  console.log(`  base-url: ${flags.baseUrl}`);
  console.log(`  formula: ${flags.formula}`);
  console.log(`  runs: ${flags.runs}`);
  console.log(`  modes: ${flags.modes.map((m) => m ?? 'AUTO').join(',')}`);
  console.log(`  brutality: ${flags.brutality}`);
  console.log(`  delay-ms: ${flags.delayMs}`);
  console.log(`  namespace: ${flags.namespace ?? '(default data/memory)'}`);
  console.log(`  enable-branch-activation: ${flags.enableBranchActivation}`);
  console.log(`  fail-fast: ${flags.failFast}`);
  console.log(`  dry-run: ${flags.dryRun}`);
  console.log('');

  if (flags.namespace) {
    process.env.MOOD_MEMORY_DIR = path.resolve(flags.namespace);
    console.log(`  MOOD_MEMORY_DIR set to ${process.env.MOOD_MEMORY_DIR}`);
    console.log(`  (note: env var only affects in-process imports — the dev server`);
    console.log(`   uses whatever MOOD_MEMORY_DIR it was started with)`);
    console.log('');
  }

  if (flags.dryRun) {
    console.log('DRY RUN — printing planned run sequence:');
    for (let i = 0; i < flags.runs; i++) {
      const mode = flags.modes[i % flags.modes.length];
      console.log(`  [${String(i).padStart(2, '0')}] formula=${flags.formula} mode=${mode ?? 'AUTO'} brutality=${flags.brutality}`);
    }
    if (flags.enableBranchActivation) {
      console.log('\n  branch activation would be attempted (enabled by flag)');
    } else {
      console.log('\n  no branch activation (default — pass --enable-branch-activation to enable)');
    }
    return;
  }

  const memoryDir = path.resolve(process.cwd(), 'data', 'memory');
  const initialMemory = await probeMemoryDir(memoryDir);

  // ── Initial probe (drift baseline + fail-fast on bad start) ─
  console.log('PHASE 1: initial route probe');
  const initialProbes = await probeRoutes(flags.baseUrl);
  const initialFailed = initialProbes.filter((p) => !p.ok);
  if (initialFailed.length > 0) {
    console.log('  ⚠ some routes failing on initial probe — dev server may be down. Start it with: npm run dev');
    for (const p of initialFailed.slice(0, 5)) console.log(`    ${p.route}: ${p.error}`);
    process.exit(2);
  }
  console.log(`  ${initialProbes.length}/${initialProbes.length} routes responding`);
  console.log('');

  // ── Run loop ────────────────────────────────────────────────
  console.log(`PHASE 2: ${flags.runs} controlled generation run(s)`);
  const runResults: StreamRunResult[] = [];
  let stoppedReason: string | null = null;
  let stoppedEarly = false;

  // Advisory aggregation — recorded per run, never used to gate execution.
  const advisoryProbes: AdvisoryProbeResult[] = [];

  for (let i = 0; i < flags.runs; i++) {
    const mode = flags.modes[i % flags.modes.length];
    // Read-only advisory probe BEFORE generation. Result is recorded
    // and ignored for control flow.
    const advisory = await probePreGenAdvisory(flags.baseUrl, flags.formula, mode, flags.brutality);
    advisoryProbes.push(advisory);
    process.stdout.write(`  [${String(i).padStart(2, '0')}] formula=${flags.formula} mode=${mode ?? 'AUTO'} brutality=${flags.brutality} ... `);
    const r = await runGenerate(flags.baseUrl, flags.formula, mode, flags.brutality);
    runResults.push(r);
    const label = r.bannerReceived
      ? `banner verdict=${r.finalVerdict}`
      : r.errorMessage
        ? `error: ${r.errorMessage.slice(0, 50)}`
        : 'no banner, no error';
    console.log(`${label} (${r.latencyMs}ms, ${r.events} events)`);

    // Fail-fast triggers.
    if (flags.failFast) {
      if (r.parseError) {
        stoppedReason = `stream JSON parse failure on run ${i}: ${r.parseError}`;
        stoppedEarly = true; break;
      }
      if (!r.ok && !r.bannerReceived && !r.errorMessage) {
        stoppedReason = `run ${i} produced no banner and no controlled error (route crash?)`;
        stoppedEarly = true; break;
      }
      // Memory corruption check after each run.
      const broken = await detectMemoryCorruption(memoryDir);
      if (broken.length > 0) {
        stoppedReason = `memory corruption detected after run ${i}: ${broken.slice(0, 3).join('; ')}`;
        stoppedEarly = true; break;
      }
      // FIFO cap check (probe system integrity).
      const integrity = await getJson<{
        memoryHealth?: Array<{ file: string; capped: boolean; issue: string | null }>;
      }>(flags.baseUrl, '/api/system-integrity');
      const overCap = integrity.data?.memoryHealth?.filter((m) => !m.capped) ?? [];
      if (overCap.length > 0) {
        stoppedReason = `FIFO cap exceeded after run ${i}: ${overCap.map((m) => `${m.file} (${m.issue})`).join('; ')}`;
        stoppedEarly = true; break;
      }
    }

    if (flags.delayMs > 0 && i < flags.runs - 1) {
      await new Promise((resolve) => setTimeout(resolve, flags.delayMs));
    }
  }
  console.log('');

  // ── Branch activation (optional, off by default) ────────────
  if (flags.enableBranchActivation && !stoppedEarly) {
    console.log('PHASE 3: synthetic branch activation (flag enabled)');
    const r = await postJson(flags.baseUrl, '/api/branch-activation', {
      branchName: 'high-trust-documentary',
      counterfactualType: 'trust-optimal',
      fromPhase: 'fatiguing', fromExecutive: 'strategy',
      fromIdentityVector: 'aggressive-conversion',
      fromArchetype: 'aggressive-performance',
      predictedTrustImpact: 4, predictedFatigueImpact: -1,
      predictedDurabilityImpact: 4, predictedRisk: 4,
      predictedDurabilityPotential: 7,
      baselineTrustMomentum: 4, baselineFatiguePressure: 7,
      baselineDurability: 4, baselineCampaignHealth: 5,
      operatorId: 'hardening-runner',
      reason: 'explicit --enable-branch-activation flag',
    });
    console.log(`  ${r.ok ? 'ok' : 'fail'}${r.error ? ` · ${r.error}` : ''}`);
    console.log('');
  }

  // ── Final probe + summary ──────────────────────────────────
  console.log('PHASE 4: final probe + memory delta');
  const finalProbes = await probeRoutes(flags.baseUrl);
  const finalMemory = await probeMemoryDir(memoryDir);

  // Memory files touched (size changed).
  const memoryFilesTouched = new Set<string>();
  for (const f of new Set([...Object.keys(initialMemory.files), ...Object.keys(finalMemory.files)])) {
    if ((initialMemory.files[f] ?? 0) !== (finalMemory.files[f] ?? 0)) memoryFilesTouched.add(f);
  }

  // Panel sync warnings — routes whose top-level shape changed unexpectedly.
  // (Shape change is EXPECTED when memory populates, so this is informational
  // rather than critical — only counts as a real warning if a previously-OK
  // route became non-OK.)
  const panelSyncWarnings: string[] = [];
  for (const initial of initialProbes) {
    const finalProbe = finalProbes.find((p) => p.route === initial.route);
    if (!finalProbe) continue;
    if (initial.ok && !finalProbe.ok) {
      panelSyncWarnings.push(`${initial.route}: started ok, ended ${finalProbe.error}`);
    }
  }

  const routeErrors = finalProbes.filter((p) => !p.ok).map((p) => `${p.route}: ${p.error}`);

  // Pull system integrity for FIFO + baseline status.
  const integrityFinal = await getJson<{
    memoryHealth?: Array<{ file: string; capped: boolean; issue: string | null }>;
    baselineHealth?: Array<{ layer: string; status: string }>;
  }>(flags.baseUrl, '/api/system-integrity');
  const memHealth = integrityFinal.data?.memoryHealth ?? [];

  // Pull campaign evolution.
  const campaign = await getJson<{
    statement?: string; trend?: string;
    averageCampaignHealth?: number;
    current?: { currentPhase?: string };
  }>(flags.baseUrl, '/api/campaign-evolution');

  // Pull policy audit.
  const policyAudit = await getJson<{
    overrideTypeBreakdown?: Array<{ overrideType: string; count: number }>;
    refusalEnabledRate?: number;
  }>(flags.baseUrl, '/api/policy-audit');

  // Build summaries.
  const completed = runResults.length;
  const approvals = runResults.filter((r) => r.finalVerdict === 'approve').length;
  const refusals = runResults.filter((r) =>
    r.finalVerdict === 'reject-image' || r.finalVerdict === 'reject-concept' || r.finalVerdict === 'reject-taste'
    || (r.errorMessage !== null && r.errorMessage.toLowerCase().includes('exhausted')),
  ).length;
  const failures = runResults.filter((r) =>
    !r.bannerReceived && !(r.errorMessage && r.errorMessage.toLowerCase().includes('exhausted')),
  ).length;

  const deterministicWarnings: string[] = [];
  const parseErrors = runResults.filter((r) => r.parseError !== null);
  if (parseErrors.length > 0) {
    deterministicWarnings.push(`${parseErrors.length} run(s) had stream JSON parse failures`);
  }

  // Build policy band distribution from per-run policy bands.
  const bandDistribution: Record<string, number> = {};
  for (const r of runResults) {
    if (r.policyBand) bandDistribution[r.policyBand] = (bandDistribution[r.policyBand] ?? 0) + 1;
  }

  const overCapDetails = memHealth.filter((m) => !m.capped)
    .map((m) => `${m.file}${m.issue ? ` (${m.issue})` : ''}`);

  const warnings: string[] = [];
  if (stoppedEarly) warnings.push(stoppedReason!);
  if (panelSyncWarnings.length > 0) warnings.push(`${panelSyncWarnings.length} panel(s) became unreachable mid-run`);
  if (failures > 0) warnings.push(`${failures} run(s) failed without controlled refusal`);
  if (deterministicWarnings.length > 0) warnings.push(...deterministicWarnings);

  const report: GenerationHardeningReport = {
    runsRequested: flags.runs,
    runsCompleted: completed,
    approvals,
    refusals,
    failures,
    averageLatencyMs: average(runResults.map((r) => r.latencyMs)),
    memoryFilesTouched: Array.from(memoryFilesTouched).sort(),
    fifoStatus: {
      capped: memHealth.filter((m) => m.capped).length,
      overCap: overCapDetails.length,
      total: memHealth.length,
      overCapDetails,
    },
    routeErrors,
    deterministicWarnings,
    panelSyncWarnings,
    copyQualitySummary: {
      runsWithCopyQuality: runResults.filter((r) => r.copyIntegrity !== null).length,
      averageCopyIntegrity: averageOrNull(runResults.map((r) => r.copyIntegrity)),
      averageTrustSafety:   averageOrNull(runResults.map((r) => r.trustSafety)),
    },
    strategySummary: {
      audiencesUsed: unique(runResults.map((r) => r.primaryAudience)),
      rolesUsed: unique(runResults.map((r) => r.campaignRole)),
      averageTrustDebt: averageOrNull(runResults.map((r) => r.trustDebt)),
    },
    campaignEvolutionSummary: {
      finalPhase: campaign.data?.current?.currentPhase ?? null,
      phaseTrend: campaign.data?.trend ?? null,
      averageHealth: typeof campaign.data?.averageCampaignHealth === 'number'
        ? campaign.data.averageCampaignHealth : null,
    },
    policyAuditSummary: {
      bandDistribution,
    },
    preGenerationAdvisory: (() => {
      const statusDist: Record<string, number> = {};
      const tierDist: Record<string, number> = {};
      let fallbackSuggestedCount = 0;
      let testingOnlyCount = 0;
      let blockedForProductionCount = 0;
      let endpointUnreachable = false;
      for (const a of advisoryProbes) {
        if (!a.ok) { endpointUnreachable = true; continue; }
        if (a.stabilizationStatus) {
          statusDist[a.stabilizationStatus] = (statusDist[a.stabilizationStatus] ?? 0) + 1;
        }
        if (a.safetyTier) {
          tierDist[a.safetyTier] = (tierDist[a.safetyTier] ?? 0) + 1;
        }
        if (a.fallbackSuggested) fallbackSuggestedCount += 1;
        if (a.stabilizationStatus === 'testing-only') testingOnlyCount += 1;
        if (a.stabilizationStatus === 'blocked-for-production') blockedForProductionCount += 1;
      }
      return {
        preGenerationStatusDistribution: statusDist,
        productionTierDistribution: tierDist,
        fallbackSuggestedCount,
        testingOnlyCount,
        blockedForProductionCount,
        advisoryEndpointUnreachable: endpointUnreachable,
      };
    })(),
    stoppedEarly,
    stoppedReason,
    warnings,
    reasonCodes: [
      `requested:${flags.runs}`,
      `completed:${completed}`,
      `approvals:${approvals}`,
      `refusals:${refusals}`,
      `failures:${failures}`,
      `avg-latency-ms:${average(runResults.map((r) => r.latencyMs))}`,
      `memory-files-touched:${memoryFilesTouched.size}`,
      `fifo-capped:${memHealth.filter((m) => m.capped).length}/${memHealth.length}`,
      `route-errors:${routeErrors.length}`,
      `stopped-early:${stoppedEarly}`,
    ],
  };

  // ── Print report ────────────────────────────────────────────
  console.log('───── GENERATION HARDENING REPORT ─────');
  console.log(`  runs:                ${report.runsCompleted}/${report.runsRequested}`);
  console.log(`  approvals/refusals/failures: ${report.approvals}/${report.refusals}/${report.failures}`);
  console.log(`  avg latency:         ${report.averageLatencyMs} ms`);
  console.log(`  memory files touched: ${report.memoryFilesTouched.length}`);
  console.log(`  fifo:                ${report.fifoStatus.capped}/${report.fifoStatus.total} capped, ${report.fifoStatus.overCap} over-cap`);
  console.log(`  route errors:        ${report.routeErrors.length}`);
  console.log(`  panel sync warnings: ${report.panelSyncWarnings.length}`);
  if (report.copyQualitySummary.averageCopyIntegrity !== null) {
    console.log(`  avg copy integrity:  ${report.copyQualitySummary.averageCopyIntegrity}/10`);
  }
  if (report.copyQualitySummary.averageTrustSafety !== null) {
    console.log(`  avg trust safety:    ${report.copyQualitySummary.averageTrustSafety}/10`);
  }
  if (report.strategySummary.averageTrustDebt !== null) {
    console.log(`  avg trust debt:      ${report.strategySummary.averageTrustDebt}/10`);
  }
  console.log(`  audiences used:      ${report.strategySummary.audiencesUsed.join(', ') || '—'}`);
  console.log(`  roles used:          ${report.strategySummary.rolesUsed.join(', ') || '—'}`);
  console.log(`  final phase:         ${report.campaignEvolutionSummary.finalPhase ?? '—'}`);
  if (Object.keys(report.policyAuditSummary.bandDistribution).length > 0) {
    const dist = Object.entries(report.policyAuditSummary.bandDistribution)
      .map(([b, n]) => `${b}:${n}`).join(' ');
    console.log(`  policy bands:        ${dist}`);
  }
  if (report.stoppedEarly) {
    console.log(`  ⚠ stopped early:     ${report.stoppedReason}`);
  }
  if (report.warnings.length > 0) {
    console.log(`  warnings:`);
    for (const w of report.warnings) console.log(`    · ${w}`);
  }
  if (report.routeErrors.length > 0) {
    console.log(`  failed routes:`);
    for (const r of report.routeErrors.slice(0, 8)) console.log(`    · ${r}`);
  }

  if (flags.reportPath) {
    await fs.writeFile(path.resolve(flags.reportPath), JSON.stringify(report, null, 2));
    console.log(`\n  report written to: ${flags.reportPath}`);
  }

  // Exit code:
  //   0 → all runs completed, no route errors, no FIFO breach, no memory corruption
  //   1 → stopped early OR route errors OR FIFO breach OR failures present
  const exitNonZero = stoppedEarly || routeErrors.length > 0 || report.fifoStatus.overCap > 0 || failures > 0;
  process.exit(exitNonZero ? 1 : 0);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
