/**
 * scripts/run-full-hardening-matrix.ts
 *
 * FULL HARDENING MATRIX — exhaustive controlled generation across the
 * full operational surface area:
 *
 *   formulas (4)  ×  modes (8)  ×  brutality (5)  =  160 combinations
 *
 * This is a SYSTEM-HARDENING runner, not an intelligence runner.
 *
 * STRICTLY:
 *   - never calls external APIs
 *   - never mutates projection scores
 *   - never reprioritizes branches
 *   - never auto-activates branches
 *   - never modifies cognition state
 *   - never self-heals
 *   - never autorepairs memory
 *   - never POSTs anywhere except /api/generate
 *
 * Fail-fast triggers (any one halts the matrix):
 *   - HTTP 500 / route crash
 *   - memory corruption (JSON parse fail on a memory file)
 *   - JSON serialization failure mid-stream
 *   - FIFO over-cap (from /api/system-integrity)
 *   - panel desync (a route that started ok becomes unreachable)
 *   - stream closure failure (no banner + no controlled error)
 *   - undefined/null runtime throw (fetch reject)
 *   - deterministic mismatch (consecutive GETs on a stable route differ
 *     in top-level shape)
 *   - route timeout (per-request AbortController, default 60s)
 *
 * Same memory state in → same matrix shape out.
 *
 * ─── PHASE 2 DESIGN NOTES (DOCUMENT ONLY — DO NOT IMPLEMENT YET) ────
 *
 * The next operational layers, when authorized, will be:
 *
 *   1. CONCURRENT STRESS RUNNER
 *      Goal: prove the FIFO + memory write contract holds when two or
 *      more clients hit /api/generate in parallel. Design: spawn N
 *      worker promises (default N=4), each picking a cell at random
 *      from the full matrix, sharing one memory directory. Verify that
 *      after all workers complete: FIFO caps are still ≤ ceiling, no
 *      memory file is corrupted, no banner has duplicate id, no
 *      observation memory contains an interleaved-write artifact (we
 *      detect this by hashing each memory file before/after and
 *      asserting append-only growth — no reordering, no overwrite of
 *      previously-written entries).
 *
 *   2. SNAPSHOT RECOVERY VERIFICATION
 *      Goal: prove that an entire memory directory can be archived,
 *      restored, and the system resumes deterministically. Design:
 *      capture memory at time T0, run M generations to T1, archive T1
 *      memory, wipe directory, restore T0 archive, re-run the same M
 *      generations with the same seeds — verify the resulting memory
 *      hashes match T1's. This requires no new system code; the
 *      verifier reads/writes only its own snapshot files.
 *
 *   3. DETERMINISTIC RESTORATION AUDIT
 *      Goal: stronger version of (2). After restoration, replay a
 *      known sequence of /api/generate calls and assert per-step
 *      observation memory equality (key-by-key diff with timestamps
 *      tolerantly compared). Outputs a deterministic-restoration
 *      score 0..10 and a list of any non-deterministic fields.
 *
 *   4. LONG-RUN MARATHON STABILITY TEST
 *      Goal: prove the system survives 12+ hours of continuous
 *      generation at conservative pace. Design: run the matrix on
 *      loop (e.g. ENERGY+AUTO+0.5 every 30s for 12h), collecting
 *      latency percentiles, memory growth curves, FIFO eviction
 *      cadence, and route-error rate over time. Fail-fast on the
 *      same triggers as this matrix runner. Produces a marathon-
 *      stability time-series report.
 *
 * Each of these will be its own script alongside this one, sharing
 * the same observational-read contract (no critic mutation, no
 * autonomous decisions).
 *
 * ──────────────────────────────────────────────────────────────────
 *
 * Usage:
 *   # Terminal 1
 *   npm run dev
 *
 *   # Terminal 2 — full default matrix (160 cells, 1 run each)
 *   npx tsx scripts/run-full-hardening-matrix.ts
 *
 *   # Smoke matrix — single formula, single mode, single brutality
 *   npx tsx scripts/run-full-hardening-matrix.ts \
 *     --formulas ENERGY --modes AUTO --brutality-levels 0.5
 *
 *   # Repeat 2x per cell, write JSON report
 *   npx tsx scripts/run-full-hardening-matrix.ts --repeat 2 --report report.json
 */

import { promises as fs } from 'fs';
import * as path from 'path';

// ─── matrix dimensions (canonical) ────────────────────────────

const ALL_FORMULAS = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'] as const;

// User-facing label → canonical CampaignMode (or null for AUTO).
// AUTO=null means "pipeline picks". 'PRODUCT_FOCUSED' translates to
// the canonical 'Product-focused'. Editorial is intentionally not in
// the default matrix (per spec list).
const MODE_LABEL_TO_CANONICAL: Record<string, string | null> = {
  AUTO:            null,
  MINIMAL:         'Minimal',
  DOCUMENTARY:     'Documentary',
  EMOTIONAL:       'Emotional',
  PERFORMANCE:     'Performance',
  AGGRESSIVE:      'Aggressive',
  PRODUCT_FOCUSED: 'Product-focused',
  LUXURY:          'Luxury',
};
const ALL_MODE_LABELS = Object.keys(MODE_LABEL_TO_CANONICAL);

const ALL_BRUTALITY = [0, 0.25, 0.5, 0.75, 1] as const;

// ─── flags ────────────────────────────────────────────────────

interface Flags {
  formulas: string[];
  modeLabels: string[];
  brutalityLevels: number[];
  repeat: number;
  baseUrl: string;
  timeoutMs: number;
  delayMs: number;
  dryRun: boolean;
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
  const csv = (raw: string | undefined, fallback: readonly string[]): string[] =>
    raw ? raw.split(',').map((s) => s.trim()).filter(Boolean) : Array.from(fallback);

  const formulas = csv(get('formulas'), ALL_FORMULAS);
  const modeLabels = csv(get('modes'), ALL_MODE_LABELS);
  const brutalityLevels = (get('brutality-levels')
    ? (get('brutality-levels') as string).split(',').map((s) => parseFloat(s.trim()))
    : Array.from(ALL_BRUTALITY)
  ).filter((n) => Number.isFinite(n));

  return {
    formulas,
    modeLabels,
    brutalityLevels,
    repeat: parseInt(get('repeat', '1') ?? '1', 10),
    baseUrl: get('base-url', 'http://localhost:3000') ?? 'http://localhost:3000',
    timeoutMs: parseInt(get('timeout-ms', '60000') ?? '60000', 10),
    delayMs: parseInt(get('delay-ms', '0') ?? '0', 10),
    dryRun: argv.includes('--dry-run'),
    failFast: !argv.includes('--no-fail-fast'),
    reportPath: get('report') ?? null,
  };
}

// ─── HTTP helpers (timeout-aware) ─────────────────────────────

interface CellOutcome {
  formula: string;
  modeLabel: string;
  canonicalMode: string | null;
  brutality: number;
  repeatIdx: number;

  ok: boolean;
  bannerReceived: boolean;
  httpStatus: number | null;
  errorMessage: string | null;
  parseError: string | null;
  timedOut: boolean;
  events: number;
  latencyMs: number;
  finalVerdict: string | null;
  refusalReasons: string[];
  copyIntegrity: number | null;
  trustSafety: number | null;
  policyBand: string | null;
  policyApplied: boolean | null;
  policyDegraded: boolean;
  stackSnippet: string | null;
}

async function runGenerate(
  base: string,
  formula: string,
  canonicalMode: string | null,
  brutality: number,
  timeoutMs: number,
): Promise<{ status: number | null; out: Omit<CellOutcome,
  'formula' | 'modeLabel' | 'canonicalMode' | 'brutality' | 'repeatIdx'>; }> {
  const t0 = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const out = {
    ok: false, bannerReceived: false, httpStatus: null as number | null,
    errorMessage: null as string | null, parseError: null as string | null,
    timedOut: false, events: 0, latencyMs: 0,
    finalVerdict: null as string | null,
    refusalReasons: [] as string[],
    copyIntegrity: null as number | null, trustSafety: null as number | null,
    policyBand: null as string | null,
    policyApplied: null as boolean | null,
    policyDegraded: false,
    stackSnippet: null as string | null,
  };
  let status: number | null = null;
  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        formula,
        ...(canonicalMode ? { campaignMode: canonicalMode } : {}),
        brutality,
      }),
      signal: ctrl.signal,
    });
    status = res.status;
    out.httpStatus = res.status;
    if (!res.ok || !res.body) {
      out.errorMessage = `HTTP ${res.status}`;
      try {
        const txt = await res.text();
        out.stackSnippet = txt.slice(0, 600);
      } catch { /* ignore */ }
      out.latencyMs = Date.now() - t0;
      return { status, out };
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf('\n')) >= 0) {
        const line = buffer.slice(0, nl).trim();
        buffer = buffer.slice(nl + 1);
        if (!line) continue;
        try {
          const payload = JSON.parse(line) as {
            type: string; error?: string;
            event?: {
              stage?: string;
              data?: {
                source?: string;
                reasonCodes?: string[];
                enabled?: boolean;
                policyBand?: string;
              };
            };
            banner?: {
              finalVerdict?: { verdict?: string; reasons?: string[] };
              copyQuality?: { copyIntegrity?: number; trustSafety?: number };
              copyQualityPolicy?: { policyBand?: string };
            };
          };
          if (payload.type === 'event') {
            out.events += 1;
            const ev = payload.event;
            if (ev?.stage === 'preflight-policy' && ev.data) {
              out.policyApplied = ev.data.source !== 'explicit-true' && ev.data.source !== 'explicit-false';
              if (ev.data.policyBand) out.policyBand = ev.data.policyBand;
              if (ev.data.reasonCodes?.some((c) =>
                c.includes('degraded') || c.includes('coerced'),
              )) {
                out.policyDegraded = true;
              }
            }
          }
          if (payload.type === 'banner' && payload.banner) {
            out.bannerReceived = true;
            out.finalVerdict = payload.banner.finalVerdict?.verdict ?? null;
            out.refusalReasons = payload.banner.finalVerdict?.reasons ?? [];
            out.copyIntegrity = payload.banner.copyQuality?.copyIntegrity ?? null;
            out.trustSafety = payload.banner.copyQuality?.trustSafety ?? null;
            if (payload.banner.copyQualityPolicy?.policyBand) {
              out.policyBand = payload.banner.copyQualityPolicy.policyBand;
            }
          }
          if (payload.type === 'error') {
            out.errorMessage = payload.error ?? 'unknown';
          }
        } catch (e) {
          out.parseError = (e as Error).message;
        }
      }
    }
    out.ok = out.bannerReceived || out.errorMessage !== null;
    out.latencyMs = Date.now() - t0;
  } catch (e) {
    const err = e as Error;
    if (err.name === 'AbortError') {
      out.timedOut = true;
      out.errorMessage = `route-timeout-${timeoutMs}ms`;
    } else {
      out.errorMessage = err.message;
      out.stackSnippet = err.stack ? err.stack.split('\n').slice(0, 4).join(' | ') : null;
    }
    out.latencyMs = Date.now() - t0;
  } finally {
    clearTimeout(timer);
  }
  return { status, out };
}

async function getJson<T>(
  base: string, route: string, timeoutMs = 10000,
): Promise<{ ok: boolean; status: number | null; data: T | null; error: string | null }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${route}`, { cache: 'no-store', signal: ctrl.signal });
    if (!res.ok) return { ok: false, status: res.status, data: null, error: `HTTP ${res.status}` };
    const data = await res.json() as T;
    return { ok: true, status: res.status, data, error: null };
  } catch (e) {
    return { ok: false, status: null, data: null, error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

// ─── memory probing ───────────────────────────────────────────

interface MemorySnapshot { files: Record<string, number>; }

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
  } catch { /* missing dir is not corruption */ }
  return { files: out };
}

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
  } catch { /* dir missing */ }
  return broken;
}

// ─── panel / route probes ─────────────────────────────────────

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
  if (Array.isArray(value)) return value.length === 0 ? '[]' : `[${topLevelShape(value[0])}]`;
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
    const r = await getJson<unknown>(base, route);
    out.push({
      route, ok: r.ok,
      shape: r.data ? topLevelShape(r.data) : null,
      error: r.error,
    });
  }
  return out;
}

/** Deterministic-mismatch detector. Re-fetch a stable observational
 *  endpoint twice with no generation between and assert the top-level
 *  shape matches. Memory contents may legitimately differ between
 *  cells; the shape must not. */
async function checkDeterministicShape(
  base: string, route: string,
): Promise<{ ok: boolean; reason: string | null }> {
  const a = await getJson<unknown>(base, route);
  if (!a.ok) return { ok: false, reason: `route ${route} unavailable: ${a.error}` };
  const b = await getJson<unknown>(base, route);
  if (!b.ok) return { ok: false, reason: `route ${route} second call failed: ${b.error}` };
  const sa = topLevelShape(a.data);
  const sb = topLevelShape(b.data);
  if (sa !== sb) return { ok: false, reason: `shape mismatch on ${route}: ${sa} → ${sb}` };
  return { ok: true, reason: null };
}

// ─── report shape ─────────────────────────────────────────────

export interface FailureDetail {
  combination: { formula: string; mode: string; brutality: number };
  route: string;
  httpStatus: number | null;
  errorMessage: string;
  stackSnippet: string | null;
  memoryNamespace: string;
}

export interface FullHardeningMatrixReport {
  totalCombinations: number;
  totalRuns: number;
  approvals: number;
  refusals: number;
  failures: number;
  degradedAdvisories: number;
  averageLatencyMs: number;

  crashMatrix: FailureDetail[];
  latencyHeatmap: {
    byFormula: Record<string, number>;
    byMode: Record<string, number>;
    byBrutality: Record<string, number>;
    perCombination: Array<{
      formula: string; mode: string; brutality: number; latencyMs: number;
    }>;
  };
  fifoPressure: {
    capped: number;
    overCap: number;
    total: number;
    overCapDetails: string[];
    overCapTriggerCell: { formula: string; mode: string; brutality: number } | null;
  };
  memoryGrowth: {
    filesTouched: string[];
    bytesAdded: number;
    perFile: Record<string, { before: number; after: number; delta: number }>;
  };
  routeErrorInventory: Array<{
    route: string; error: string; phase: 'initial' | 'final';
  }>;
  panelSyncWarnings: string[];
  refusalReasonDistribution: Record<string, number>;
  verdictDistribution: Record<string, number>;

  formulaStabilityRanking: Array<{
    formula: string; failureRate: number; avgLatencyMs: number; rank: number;
  }>;
  campaignModeStabilityRanking: Array<{
    mode: string; failureRate: number; avgLatencyMs: number; rank: number;
  }>;
  brutalityStressRanking: Array<{
    brutality: number; failureRate: number; avgLatencyMs: number; rank: number;
  }>;

  /** 0..10 — fraction of runs that finished cleanly (banner OR
   *  controlled refusal) without parse errors, timeouts, or
   *  uncaught throws. */
  deterministicConsistencyScore: number;
  deterministicConsistencyDetails: string[];

  stoppedEarly: boolean;
  stoppedReason: string | null;
  warnings: string[];
  reasonCodes: string[];
}

// ─── helpers ──────────────────────────────────────────────────

function average(xs: number[]): number {
  if (xs.length === 0) return 0;
  return Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
}

function groupAverage<K extends string | number>(
  rows: CellOutcome[], keyFn: (r: CellOutcome) => K,
): Record<string, number> {
  const buckets = new Map<K, number[]>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(r.latencyMs);
  }
  const out: Record<string, number> = {};
  for (const [k, arr] of buckets) out[String(k)] = average(arr);
  return out;
}

function groupFailureRate<K extends string | number>(
  rows: CellOutcome[], keyFn: (r: CellOutcome) => K, isFailure: (r: CellOutcome) => boolean,
): Map<K, { total: number; failed: number; latencyAvg: number }> {
  const buckets = new Map<K, { total: number; failed: number; lat: number[] }>();
  for (const r of rows) {
    const k = keyFn(r);
    if (!buckets.has(k)) buckets.set(k, { total: 0, failed: 0, lat: [] });
    const b = buckets.get(k)!;
    b.total += 1;
    if (isFailure(r)) b.failed += 1;
    b.lat.push(r.latencyMs);
  }
  const out = new Map<K, { total: number; failed: number; latencyAvg: number }>();
  for (const [k, b] of buckets) {
    out.set(k, { total: b.total, failed: b.failed, latencyAvg: average(b.lat) });
  }
  return out;
}

// ─── main ──────────────────────────────────────────────────────

async function main(): Promise<void> {
  const flags = parseFlags();

  // Resolve mode labels → canonical (silently drop unknown labels with a
  // warning rather than failing — the matrix dimensions are intentional).
  const cells: Array<{ formula: string; modeLabel: string; canonicalMode: string | null; brutality: number }> = [];
  const unknownLabels: string[] = [];
  for (const formula of flags.formulas) {
    for (const modeLabel of flags.modeLabels) {
      if (!(modeLabel in MODE_LABEL_TO_CANONICAL)) {
        unknownLabels.push(modeLabel);
        continue;
      }
      const canonicalMode = MODE_LABEL_TO_CANONICAL[modeLabel];
      for (const brutality of flags.brutalityLevels) {
        cells.push({ formula, modeLabel, canonicalMode, brutality });
      }
    }
  }

  console.log('FULL HARDENING MATRIX RUNNER\n');
  console.log(`  base-url:           ${flags.baseUrl}`);
  console.log(`  formulas (${flags.formulas.length}):     ${flags.formulas.join(',')}`);
  console.log(`  modes (${flags.modeLabels.length}):        ${flags.modeLabels.join(',')}`);
  console.log(`  brutality (${flags.brutalityLevels.length}):   ${flags.brutalityLevels.join(',')}`);
  console.log(`  repeat-per-cell:    ${flags.repeat}`);
  console.log(`  total cells:        ${cells.length}`);
  console.log(`  total runs:         ${cells.length * flags.repeat}`);
  console.log(`  timeout-ms:         ${flags.timeoutMs}`);
  console.log(`  delay-ms:           ${flags.delayMs}`);
  console.log(`  fail-fast:          ${flags.failFast}`);
  console.log(`  dry-run:            ${flags.dryRun}`);
  if (unknownLabels.length > 0) {
    console.log(`  ⚠ unknown mode labels skipped: ${unknownLabels.join(',')}`);
  }
  console.log('');

  if (flags.dryRun) {
    console.log('DRY RUN — printing planned matrix cells:');
    for (let i = 0; i < cells.length; i++) {
      const c = cells[i];
      console.log(
        `  [${String(i).padStart(3, '0')}] formula=${c.formula} ` +
        `mode=${c.modeLabel}${c.canonicalMode ? `(${c.canonicalMode})` : ''} ` +
        `brutality=${c.brutality}`,
      );
    }
    console.log(`\n  ${cells.length} cells × ${flags.repeat} repeat = ${cells.length * flags.repeat} runs`);
    return;
  }

  // ── Initial probes ──────────────────────────────────────────
  const memoryDir = path.resolve(process.cwd(), 'data', 'memory');
  console.log('PHASE 1: initial probes');
  const initialMemory = await probeMemoryDir(memoryDir);
  const initialProbes = await probeRoutes(flags.baseUrl);
  const initialFailed = initialProbes.filter((p) => !p.ok);
  if (initialFailed.length > 0) {
    console.log('  ⚠ initial route probe failed — start dev server with: npm run dev');
    for (const p of initialFailed.slice(0, 5)) console.log(`    ${p.route}: ${p.error}`);
    process.exit(2);
  }
  console.log(`  ${initialProbes.length}/${initialProbes.length} routes responding`);
  console.log(`  ${Object.keys(initialMemory.files).length} memory files snapshotted`);
  console.log('');

  // ── Matrix loop ────────────────────────────────────────────
  console.log(`PHASE 2: executing ${cells.length * flags.repeat} runs across ${cells.length} matrix cells`);
  const outcomes: CellOutcome[] = [];
  const crashMatrix: FailureDetail[] = [];
  let stoppedEarly = false;
  let stoppedReason: string | null = null;
  let fifoTriggerCell: { formula: string; mode: string; brutality: number } | null = null;

  outer:
  for (let i = 0; i < cells.length; i++) {
    const cell = cells[i];
    for (let r = 0; r < flags.repeat; r++) {
      const tag =
        `[${String(i).padStart(3, '0')}.${r}] ` +
        `${cell.formula}/${cell.modeLabel}/b=${cell.brutality}`;
      process.stdout.write(`  ${tag} ... `);
      const { status, out } = await runGenerate(
        flags.baseUrl, cell.formula, cell.canonicalMode, cell.brutality, flags.timeoutMs,
      );
      const outcome: CellOutcome = {
        formula: cell.formula,
        modeLabel: cell.modeLabel,
        canonicalMode: cell.canonicalMode,
        brutality: cell.brutality,
        repeatIdx: r,
        ...out,
      };
      outcomes.push(outcome);

      const label = outcome.bannerReceived
        ? `verdict=${outcome.finalVerdict}`
        : outcome.timedOut
          ? `TIMEOUT (${outcome.latencyMs}ms)`
          : outcome.errorMessage
            ? `error: ${outcome.errorMessage.slice(0, 50)}`
            : 'no banner, no error';
      console.log(`${label} (${outcome.latencyMs}ms${outcome.events ? `, ${outcome.events} events` : ''})`);

      // ── fail-fast triggers ───────────────────────────────
      if (flags.failFast) {
        const triggerCell = {
          formula: cell.formula,
          mode: cell.modeLabel,
          brutality: cell.brutality,
        };
        const recordCrash = (route: string, errorMessage: string): void => {
          crashMatrix.push({
            combination: triggerCell,
            route,
            httpStatus: status,
            errorMessage,
            stackSnippet: outcome.stackSnippet,
            memoryNamespace: memoryDir,
          });
        };
        // HTTP 500 / route crash
        if (status !== null && status >= 500) {
          stoppedReason = `HTTP ${status} on ${cell.formula}/${cell.modeLabel}/b=${cell.brutality}`;
          recordCrash('/api/generate', stoppedReason);
          stoppedEarly = true; break outer;
        }
        // Stream closure failure
        if (!outcome.bannerReceived && !outcome.errorMessage && !outcome.timedOut) {
          stoppedReason = `stream-closure-without-banner-or-error on ${cell.formula}/${cell.modeLabel}/b=${cell.brutality}`;
          recordCrash('/api/generate', stoppedReason);
          stoppedEarly = true; break outer;
        }
        // JSON parse failure
        if (outcome.parseError) {
          stoppedReason = `stream-json-parse-failure: ${outcome.parseError}`;
          recordCrash('/api/generate', stoppedReason);
          stoppedEarly = true; break outer;
        }
        // Timeout
        if (outcome.timedOut) {
          stoppedReason = `route-timeout on ${cell.formula}/${cell.modeLabel}/b=${cell.brutality} (${flags.timeoutMs}ms)`;
          recordCrash('/api/generate', stoppedReason);
          stoppedEarly = true; break outer;
        }
        // Memory corruption
        const broken = await detectMemoryCorruption(memoryDir);
        if (broken.length > 0) {
          stoppedReason = `memory-corruption after ${cell.formula}/${cell.modeLabel}/b=${cell.brutality}: ${broken.slice(0, 3).join('; ')}`;
          recordCrash('memory:' + broken[0].split(':')[0], stoppedReason);
          stoppedEarly = true; break outer;
        }
        // FIFO over-cap (via /api/system-integrity)
        const integrity = await getJson<{
          memoryHealth?: Array<{ file: string; capped: boolean; issue: string | null }>;
        }>(flags.baseUrl, '/api/system-integrity');
        const overCap = integrity.data?.memoryHealth?.filter((m) => !m.capped) ?? [];
        if (overCap.length > 0) {
          fifoTriggerCell = triggerCell;
          stoppedReason = `fifo-over-cap after ${cell.formula}/${cell.modeLabel}/b=${cell.brutality}: ${overCap.map((m) => `${m.file}(${m.issue})`).join(', ')}`;
          recordCrash('/api/system-integrity', stoppedReason);
          stoppedEarly = true; break outer;
        }
        // Panel desync — a previously-OK route stops responding
        const desyncProbe = await probeRoutes(flags.baseUrl);
        for (const ip of initialProbes) {
          const fp = desyncProbe.find((p) => p.route === ip.route);
          if (ip.ok && fp && !fp.ok) {
            stoppedReason = `panel-desync on ${ip.route} after ${cell.formula}/${cell.modeLabel}/b=${cell.brutality}: ${fp.error}`;
            recordCrash(ip.route, stoppedReason);
            stoppedEarly = true; break outer;
          }
        }
        // Deterministic mismatch — check one stable route twice
        const det = await checkDeterministicShape(flags.baseUrl, '/api/system-integrity');
        if (!det.ok) {
          stoppedReason = `deterministic-mismatch: ${det.reason}`;
          recordCrash('/api/system-integrity', stoppedReason);
          stoppedEarly = true; break outer;
        }
      }

      if (flags.delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, flags.delayMs));
      }
    }
  }
  console.log('');

  // ── Final probes ───────────────────────────────────────────
  console.log('PHASE 3: final probes + report build');
  const finalProbes = await probeRoutes(flags.baseUrl);
  const finalMemory = await probeMemoryDir(memoryDir);

  const integrityFinal = await getJson<{
    memoryHealth?: Array<{ file: string; capped: boolean; issue: string | null }>;
  }>(flags.baseUrl, '/api/system-integrity');
  const memHealth = integrityFinal.data?.memoryHealth ?? [];

  // Memory growth
  const allFiles = new Set([
    ...Object.keys(initialMemory.files),
    ...Object.keys(finalMemory.files),
  ]);
  const perFile: Record<string, { before: number; after: number; delta: number }> = {};
  const filesTouched: string[] = [];
  let bytesAdded = 0;
  for (const f of allFiles) {
    const before = initialMemory.files[f] ?? 0;
    const after = finalMemory.files[f] ?? 0;
    const delta = after - before;
    perFile[f] = { before, after, delta };
    if (delta !== 0) filesTouched.push(f);
    if (delta > 0) bytesAdded += delta;
  }
  filesTouched.sort();

  // Panel sync warnings
  const panelSyncWarnings: string[] = [];
  for (const ip of initialProbes) {
    const fp = finalProbes.find((p) => p.route === ip.route);
    if (!fp) continue;
    if (ip.ok && !fp.ok) {
      panelSyncWarnings.push(`${ip.route}: started ok, ended ${fp.error}`);
    }
    if (ip.shape && fp.shape && ip.shape !== fp.shape) {
      panelSyncWarnings.push(`${ip.route}: shape changed ${ip.shape} → ${fp.shape}`);
    }
  }

  // Route error inventory
  const routeErrorInventory: FullHardeningMatrixReport['routeErrorInventory'] = [];
  for (const p of initialProbes) {
    if (!p.ok) routeErrorInventory.push({ route: p.route, error: p.error ?? 'unknown', phase: 'initial' });
  }
  for (const p of finalProbes) {
    if (!p.ok) routeErrorInventory.push({ route: p.route, error: p.error ?? 'unknown', phase: 'final' });
  }

  // Counters
  const approvals = outcomes.filter((o) => o.finalVerdict === 'approve').length;
  const refusals = outcomes.filter((o) =>
    o.finalVerdict === 'reject-image' ||
    o.finalVerdict === 'reject-concept' ||
    o.finalVerdict === 'reject-taste' ||
    (o.errorMessage !== null && o.errorMessage.toLowerCase().includes('exhausted')),
  ).length;
  const failures = outcomes.filter((o) =>
    !o.bannerReceived && !(o.errorMessage && o.errorMessage.toLowerCase().includes('exhausted')),
  ).length;
  const degradedAdvisories = outcomes.filter((o) => o.policyDegraded).length;

  // Verdict + refusal distributions
  const verdictDistribution: Record<string, number> = {};
  const refusalReasonDistribution: Record<string, number> = {};
  for (const o of outcomes) {
    if (o.finalVerdict) {
      verdictDistribution[o.finalVerdict] = (verdictDistribution[o.finalVerdict] ?? 0) + 1;
    }
    for (const r of o.refusalReasons) {
      refusalReasonDistribution[r] = (refusalReasonDistribution[r] ?? 0) + 1;
    }
  }

  // Latency heatmap
  const latencyHeatmap = {
    byFormula: groupAverage(outcomes, (o) => o.formula),
    byMode: groupAverage(outcomes, (o) => o.modeLabel),
    byBrutality: groupAverage(outcomes, (o) => o.brutality),
    perCombination: outcomes.map((o) => ({
      formula: o.formula, mode: o.modeLabel, brutality: o.brutality, latencyMs: o.latencyMs,
    })),
  };

  // Stability rankings — failureRate ascending = most stable first
  const isFail = (o: CellOutcome): boolean => !o.bannerReceived ||
    !!o.parseError || !!o.timedOut || (o.httpStatus !== null && o.httpStatus >= 500);

  const formulaBuckets = groupFailureRate(outcomes, (o) => o.formula, isFail);
  const formulaStabilityRanking = Array.from(formulaBuckets.entries())
    .map(([k, v]) => ({
      formula: k,
      failureRate: v.total === 0 ? 0 : Math.round((v.failed / v.total) * 1000) / 1000,
      avgLatencyMs: v.latencyAvg,
      rank: 0,
    }))
    .sort((a, b) => a.failureRate - b.failureRate || a.avgLatencyMs - b.avgLatencyMs)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const modeBuckets = groupFailureRate(outcomes, (o) => o.modeLabel, isFail);
  const campaignModeStabilityRanking = Array.from(modeBuckets.entries())
    .map(([k, v]) => ({
      mode: k,
      failureRate: v.total === 0 ? 0 : Math.round((v.failed / v.total) * 1000) / 1000,
      avgLatencyMs: v.latencyAvg,
      rank: 0,
    }))
    .sort((a, b) => a.failureRate - b.failureRate || a.avgLatencyMs - b.avgLatencyMs)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  const brutalityBuckets = groupFailureRate(outcomes, (o) => o.brutality, isFail);
  const brutalityStressRanking = Array.from(brutalityBuckets.entries())
    .map(([k, v]) => ({
      brutality: k,
      failureRate: v.total === 0 ? 0 : Math.round((v.failed / v.total) * 1000) / 1000,
      avgLatencyMs: v.latencyAvg,
      rank: 0,
    }))
    .sort((a, b) => a.failureRate - b.failureRate || a.avgLatencyMs - b.avgLatencyMs)
    .map((row, i) => ({ ...row, rank: i + 1 }));

  // Deterministic consistency score — fraction of clean completions × 10
  const cleanCompletions = outcomes.filter((o) =>
    (o.bannerReceived || (o.errorMessage && !o.timedOut && o.httpStatus !== null && o.httpStatus < 500)) &&
    !o.parseError,
  ).length;
  const deterministicConsistencyScore = outcomes.length === 0
    ? 0
    : Math.round((cleanCompletions / outcomes.length) * 100) / 10;
  const deterministicConsistencyDetails: string[] = [];
  if (outcomes.some((o) => o.parseError)) {
    deterministicConsistencyDetails.push(`${outcomes.filter((o) => o.parseError).length} stream-parse-error(s)`);
  }
  if (outcomes.some((o) => o.timedOut)) {
    deterministicConsistencyDetails.push(`${outcomes.filter((o) => o.timedOut).length} timeout(s)`);
  }
  if (outcomes.some((o) => o.httpStatus !== null && o.httpStatus >= 500)) {
    deterministicConsistencyDetails.push(`${outcomes.filter((o) => (o.httpStatus ?? 0) >= 500).length} HTTP 5xx`);
  }
  if (deterministicConsistencyDetails.length === 0) {
    deterministicConsistencyDetails.push('all runs completed without parse/timeout/5xx faults');
  }

  // FIFO pressure
  const overCapDetails = memHealth.filter((m) => !m.capped)
    .map((m) => `${m.file}${m.issue ? ` (${m.issue})` : ''}`);

  const warnings: string[] = [];
  if (stoppedEarly) warnings.push(stoppedReason!);
  if (panelSyncWarnings.length > 0) warnings.push(`${panelSyncWarnings.length} panel sync warning(s)`);
  if (failures > 0) warnings.push(`${failures} run(s) failed without controlled refusal`);
  if (routeErrorInventory.length > 0) warnings.push(`${routeErrorInventory.length} route error(s) observed`);

  const report: FullHardeningMatrixReport = {
    totalCombinations: cells.length,
    totalRuns: outcomes.length,
    approvals,
    refusals,
    failures,
    degradedAdvisories,
    averageLatencyMs: average(outcomes.map((o) => o.latencyMs)),
    crashMatrix,
    latencyHeatmap,
    fifoPressure: {
      capped: memHealth.filter((m) => m.capped).length,
      overCap: overCapDetails.length,
      total: memHealth.length,
      overCapDetails,
      overCapTriggerCell: fifoTriggerCell,
    },
    memoryGrowth: { filesTouched, bytesAdded, perFile },
    routeErrorInventory,
    panelSyncWarnings,
    refusalReasonDistribution,
    verdictDistribution,
    formulaStabilityRanking,
    campaignModeStabilityRanking,
    brutalityStressRanking,
    deterministicConsistencyScore,
    deterministicConsistencyDetails,
    stoppedEarly,
    stoppedReason,
    warnings,
    reasonCodes: [
      `cells:${cells.length}`,
      `runs:${outcomes.length}`,
      `approvals:${approvals}`,
      `refusals:${refusals}`,
      `failures:${failures}`,
      `degraded:${degradedAdvisories}`,
      `avg-latency-ms:${average(outcomes.map((o) => o.latencyMs))}`,
      `files-touched:${filesTouched.length}`,
      `bytes-added:${bytesAdded}`,
      `fifo-capped:${memHealth.filter((m) => m.capped).length}/${memHealth.length}`,
      `route-errors:${routeErrorInventory.length}`,
      `panel-sync-warnings:${panelSyncWarnings.length}`,
      `det-consistency-score:${deterministicConsistencyScore}`,
      `stopped-early:${stoppedEarly}`,
    ],
  };

  // ── Print summary ───────────────────────────────────────────
  console.log('');
  console.log('───── FULL HARDENING MATRIX REPORT ─────');
  console.log(`  cells:               ${report.totalCombinations}`);
  console.log(`  runs:                ${report.totalRuns}`);
  console.log(`  approvals/refusals/failures: ${approvals}/${refusals}/${failures}`);
  console.log(`  degraded advisories: ${degradedAdvisories}`);
  console.log(`  avg latency:         ${report.averageLatencyMs}ms`);
  console.log(`  memory files touched: ${filesTouched.length} (+${bytesAdded} bytes)`);
  console.log(`  fifo:                ${report.fifoPressure.capped}/${report.fifoPressure.total} capped, ${report.fifoPressure.overCap} over-cap`);
  console.log(`  route errors:        ${routeErrorInventory.length}`);
  console.log(`  panel sync warnings: ${panelSyncWarnings.length}`);
  console.log(`  determinism score:   ${deterministicConsistencyScore}/10`);
  if (Object.keys(verdictDistribution).length > 0) {
    console.log(`  verdicts:            ${Object.entries(verdictDistribution).map(([k, v]) => `${k}:${v}`).join(' ')}`);
  }
  console.log('  formula stability:');
  for (const row of formulaStabilityRanking) {
    console.log(`    [${row.rank}] ${row.formula}: failRate=${row.failureRate} avgLatency=${row.avgLatencyMs}ms`);
  }
  console.log('  mode stability:');
  for (const row of campaignModeStabilityRanking) {
    console.log(`    [${row.rank}] ${row.mode}: failRate=${row.failureRate} avgLatency=${row.avgLatencyMs}ms`);
  }
  console.log('  brutality stress:');
  for (const row of brutalityStressRanking) {
    console.log(`    [${row.rank}] b=${row.brutality}: failRate=${row.failureRate} avgLatency=${row.avgLatencyMs}ms`);
  }
  if (report.stoppedEarly) {
    console.log(`  ⚠ stopped early:    ${report.stoppedReason}`);
  }
  if (crashMatrix.length > 0) {
    console.log('  crash matrix:');
    for (const c of crashMatrix.slice(0, 5)) {
      console.log(`    · ${c.combination.formula}/${c.combination.mode}/b=${c.combination.brutality}`);
      console.log(`      route=${c.route} status=${c.httpStatus} ns=${c.memoryNamespace}`);
      console.log(`      msg=${c.errorMessage.slice(0, 80)}`);
      if (c.stackSnippet) console.log(`      stack=${c.stackSnippet.slice(0, 120)}`);
    }
  }
  if (warnings.length > 0) {
    console.log('  warnings:');
    for (const w of warnings) console.log(`    · ${w}`);
  }

  if (flags.reportPath) {
    await fs.writeFile(path.resolve(flags.reportPath), JSON.stringify(report, null, 2));
    console.log(`\n  report written to: ${flags.reportPath}`);
  }

  // Exit code:
  //   0 → clean
  //   1 → stopped early OR route errors OR fifo breach OR failures
  const exitNonZero =
    stoppedEarly ||
    routeErrorInventory.length > 0 ||
    report.fifoPressure.overCap > 0 ||
    failures > 0;
  process.exit(exitNonZero ? 1 : 0);
}

void main().catch((e) => {
  console.error('matrix runner crashed:', e);
  process.exit(1);
});
