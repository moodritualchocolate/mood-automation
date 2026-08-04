/**
 * scripts/run-controlled-simulations.ts
 *
 * Deterministic operational pressure-testing harness.
 *
 * Drives /api/generate (+ POST endpoints) via HTTP against a running
 * dev server, varies formula × campaign mode × brutality × operator
 * sliders × branch activations, captures latency + memory growth +
 * FIFO integrity + route stability + panel-shape consistency, and
 * produces a SimulationReport.
 *
 * STRICTLY:
 *   - no autonomous prompt rewriting / branching / optimization
 *   - no self-modification / hidden memory mutation
 *   - every action is an explicit, traceable, deterministic call
 *   - all results / latency / memory growth are recorded auditable
 *
 * Usage:
 *   # Spin up dev server in another shell:
 *   npm run dev
 *
 *   # Then run the simulation:
 *   npx tsx scripts/run-controlled-simulations.ts
 *
 * Flags:
 *   --runs <N>                    cap iterations (default: 12)
 *   --formulas ENERGY,FOCUS,...   limit formula matrix
 *   --dry-run                     print plan without executing
 *   --base-url http://localhost:3000   override server URL
 *   --namespace <dir>             override MOOD_MEMORY_DIR for isolation
 *   --branch-activations <N>      number of branch activations to attempt (default: 2)
 *   --confidence-updates <N>      number of slider updates (default: 3)
 *   --report <path>               write JSON report to this path
 */

import { promises as fs } from 'fs';
import * as path from 'path';

// ─── CLI parsing ──────────────────────────────────────────────

interface Flags {
  runs: number;
  formulas: string[];
  modes: string[];
  brutalities: number[];
  branchActivations: number;
  confidenceUpdates: number;
  dryRun: boolean;
  baseUrl: string;
  namespace: string | null;
  reportPath: string | null;
}

function parseFlags(): Flags {
  const argv = process.argv.slice(2);
  const get = (name: string, fallback?: string): string | undefined => {
    const idx = argv.indexOf(`--${name}`);
    if (idx === -1) return fallback;
    return argv[idx + 1];
  };
  return {
    runs: parseInt(get('runs', '12') ?? '12', 10),
    formulas: (get('formulas', 'ENERGY,FOCUS,RELAX,SLEEP') ?? 'ENERGY,FOCUS,RELAX,SLEEP').split(','),
    modes: (get('modes', 'Documentary,Editorial,Performance,Emotional') ?? '').split(','),
    brutalities: (get('brutalities', '0.5,0.65,0.9') ?? '').split(',').map((s) => parseFloat(s)),
    branchActivations: parseInt(get('branch-activations', '2') ?? '2', 10),
    confidenceUpdates: parseInt(get('confidence-updates', '3') ?? '3', 10),
    dryRun: argv.includes('--dry-run'),
    baseUrl: get('base-url', 'http://localhost:3000') ?? 'http://localhost:3000',
    namespace: get('namespace') ?? null,
    reportPath: get('report') ?? null,
  };
}

// ─── deterministic seed-driven matrix ─────────────────────────

/** Deterministic combo selector via FNV-1a-like seed. Same iteration
 *  index → same combo. Avoids random — every batch is reproducible. */
function pickCombo(i: number, flags: Flags): {
  formula: string; mode: string; brutality: number;
} {
  return {
    formula: flags.formulas[i % flags.formulas.length],
    mode: flags.modes[Math.floor(i / flags.formulas.length) % flags.modes.length],
    brutality: flags.brutalities[Math.floor(i / (flags.formulas.length * flags.modes.length))
      % flags.brutalities.length],
  };
}

// ─── HTTP helpers ─────────────────────────────────────────────

interface RunMetrics {
  index: number;
  formula: string;
  mode: string;
  brutality: number;
  ok: boolean;
  events: number;
  bannerReceived: boolean;
  errorMessage: string | null;
  latencyMs: number;
}

async function runGenerate(base: string, formula: string, mode: string, brutality: number, idx: number): Promise<RunMetrics> {
  const t0 = Date.now();
  const metrics: RunMetrics = {
    index: idx, formula, mode, brutality,
    ok: false, events: 0, bannerReceived: false, errorMessage: null, latencyMs: 0,
  };
  try {
    const res = await fetch(`${base}/api/generate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formula, campaignMode: mode, brutality }),
    });
    if (!res.ok || !res.body) {
      metrics.errorMessage = `HTTP ${res.status}`;
      metrics.latencyMs = Date.now() - t0;
      return metrics;
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
          const payload = JSON.parse(line) as { type: string; error?: string };
          if (payload.type === 'event') metrics.events += 1;
          if (payload.type === 'banner') metrics.bannerReceived = true;
          if (payload.type === 'error') metrics.errorMessage = payload.error ?? 'unknown';
        } catch (e) {
          metrics.errorMessage = `parse: ${(e as Error).message}`;
        }
      }
    }
    metrics.ok = metrics.bannerReceived || metrics.errorMessage !== null;
    metrics.latencyMs = Date.now() - t0;
    return metrics;
  } catch (e) {
    metrics.errorMessage = (e as Error).message;
    metrics.latencyMs = Date.now() - t0;
    return metrics;
  }
}

async function getJson<T>(base: string, route: string): Promise<{ ok: boolean; data: T | null; latencyMs: number; error: string | null }> {
  const t0 = Date.now();
  try {
    const res = await fetch(`${base}${route}`, { cache: 'no-store' });
    const latencyMs = Date.now() - t0;
    if (!res.ok) return { ok: false, data: null, latencyMs, error: `HTTP ${res.status}` };
    const data = await res.json() as T;
    return { ok: true, data, latencyMs, error: null };
  } catch (e) {
    return { ok: false, data: null, latencyMs: Date.now() - t0, error: (e as Error).message };
  }
}

async function postJson(base: string, route: string, body: unknown): Promise<{ ok: boolean; error: string | null }> {
  try {
    const res = await fetch(`${base}${route}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { ok: res.ok, error: res.ok ? null : `HTTP ${res.status}` };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

// ─── memory growth probe ──────────────────────────────────────

interface MemorySnapshot {
  at: number;
  files: Record<string, number>;     // file path → byte size
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
    /* dir doesn't exist yet */
  }
  return { at: Date.now(), files: out };
}

// ─── route probes for stability + drift ──────────────────────

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

interface RouteProbeResult {
  route: string;
  ok: boolean;
  latencyMs: number;
  error: string | null;
  jsonShape: string | null;        // a compact shape signature for drift detection
}

function shapeSignature(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) {
    return value.length === 0 ? '[]' : `[${shapeSignature(value[0])}]`;
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value as object).sort();
    return `{${keys.join(',')}}`;
  }
  return typeof value;
}

async function probeAllRoutes(base: string): Promise<RouteProbeResult[]> {
  const out: RouteProbeResult[] = [];
  for (const route of PROBE_ROUTES) {
    const result = await getJson<unknown>(base, route);
    out.push({
      route,
      ok: result.ok,
      latencyMs: result.latencyMs,
      error: result.error,
      jsonShape: result.data ? shapeSignature(result.data) : null,
    });
  }
  return out;
}

// ─── branch activation injection ──────────────────────────────

const KNOWN_PROJECTION_TYPES = [
  'trust-optimal',
  'fatigue-recovery',
  'novelty-led',
  'proof-led',
  'aggressive-performance',
  'premium-restraint',
  'culture-synchronized',
  'audience-mirror',
];

async function injectBranchActivation(base: string, idx: number): Promise<{ ok: boolean; error: string | null }> {
  // Deterministic synthetic activation — no internal "branch picker"
  // logic. The simulation runner explicitly chooses the branch via
  // the iteration index so the workflow is fully traceable.
  const archetypes = [
    'high-trust-documentary', 'premium-restraint', 'quiet-authority',
    'fatigue-safe', 'emotion-first', 'audience-mirror',
  ];
  const counterfactualTypes = ['trust-optimal', 'durability-optimal', 'fatigue-aware', 'high-impact'];
  return postJson(base, '/api/branch-activation', {
    branchName: archetypes[idx % archetypes.length],
    counterfactualType: counterfactualTypes[idx % counterfactualTypes.length],
    fromPhase: 'fatiguing',
    fromExecutive: 'strategy',
    fromIdentityVector: 'aggressive-conversion',
    fromArchetype: 'aggressive-performance',
    predictedTrustImpact: 3,
    predictedFatigueImpact: -2,
    predictedDurabilityImpact: 3,
    predictedRisk: 4,
    predictedDurabilityPotential: 7,
    baselineTrustMomentum: 4,
    baselineFatiguePressure: 7,
    baselineDurability: 4,
    baselineCampaignHealth: 5,
    operatorId: 'simulation',
    reason: `synthetic activation #${idx} from controlled simulation runner`,
  });
}

async function injectConfidenceUpdate(base: string, idx: number): Promise<{ ok: boolean; error: string | null }> {
  return postJson(base, '/api/operator-confidence-preference', {
    operatorId: 'simulation',
    projectionType: KNOWN_PROJECTION_TYPES[idx % KNOWN_PROJECTION_TYPES.length],
    confidenceWeight: [20, 40, 50, 65, 75, 85][idx % 6],
    reasonNote: `synthetic slider update #${idx} from controlled simulation runner`,
  });
}

// ─── SimulationReport ────────────────────────────────────────

export interface SimulationReport {
  runsExecuted: number;
  formulasCovered: string[];
  memoryGrowth: {
    initial: MemorySnapshot;
    final: MemorySnapshot;
    perFileDeltaBytes: Record<string, number>;
    totalDeltaBytes: number;
  };
  fifoIntegrity: {
    /** From /api/system-integrity baselineHealth — counts after run. */
    matchedBaselines: number;
    driftedBaselines: number;
    missingBaselines: number;
    cappedMemoryFiles: number;
    totalMemoryFiles: number;
  };
  routeFailures: string[];
  panelFailures: string[];
  deterministicConsistency: {
    routesProbed: number;
    routesIdenticalShapeOnRefresh: number;
    routesShapeChanged: number;
  };
  driftAccumulation: {
    /** routes whose shape stayed identical across initial + final probe */
    stableRoutes: number;
    /** routes whose shape changed — expected when data was added */
    shapeChangedRoutes: string[];
  };
  latencyMetrics: {
    generateRunCount: number;
    generateP50Ms: number;
    generateP95Ms: number;
    generateMaxMs: number;
    probeP95Ms: number;
  };
  stabilityStatus: 'stable' | 'warning' | 'critical';
  warnings: string[];
  reasonCodes: string[];
}

// ─── main ──────────────────────────────────────────────────────

function percentile(xs: number[], p: number): number {
  if (xs.length === 0) return 0;
  const sorted = [...xs].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx];
}

async function main() {
  const flags = parseFlags();
  console.log(`CONTROLLED SIMULATION RUNNER\n`);
  console.log(`  base-url: ${flags.baseUrl}`);
  console.log(`  runs: ${flags.runs}`);
  console.log(`  formulas: ${flags.formulas.join(',')}`);
  console.log(`  modes: ${flags.modes.join(',')}`);
  console.log(`  brutalities: ${flags.brutalities.join(',')}`);
  console.log(`  branch-activations: ${flags.branchActivations}`);
  console.log(`  confidence-updates: ${flags.confidenceUpdates}`);
  console.log(`  namespace: ${flags.namespace ?? '(default data/memory)'}`);
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
    console.log('DRY RUN — printing planned variation matrix only:');
    for (let i = 0; i < flags.runs; i++) {
      const combo = pickCombo(i, flags);
      console.log(`  [${String(i).padStart(2, '0')}] formula=${combo.formula} mode=${combo.mode} brutality=${combo.brutality}`);
    }
    console.log(`\n${flags.branchActivations} branch activation(s) + ${flags.confidenceUpdates} confidence update(s) would follow.`);
    return;
  }

  const memoryDir = path.resolve(process.cwd(), 'data', 'memory');
  const initialMemory = await probeMemoryDir(memoryDir);

  console.log('PHASE 1: initial route probe (drift baseline)');
  const initialProbes = await probeAllRoutes(flags.baseUrl);
  const initialProbeOk = initialProbes.filter((p) => p.ok).length;
  console.log(`  ${initialProbeOk}/${initialProbes.length} routes responding`);
  if (initialProbeOk < initialProbes.length) {
    console.log('  ⚠ some routes failing on initial probe — dev server may be down. Start it with: npm run dev');
    for (const p of initialProbes.filter((x) => !x.ok)) {
      console.log(`    ${p.route}: ${p.error}`);
    }
    process.exit(2);
  }
  console.log('');

  console.log(`PHASE 2: ${flags.runs} controlled generation runs`);
  const runMetrics: RunMetrics[] = [];
  const formulasSeen = new Set<string>();
  for (let i = 0; i < flags.runs; i++) {
    const combo = pickCombo(i, flags);
    formulasSeen.add(combo.formula);
    process.stdout.write(`  [${String(i).padStart(2, '0')}] formula=${combo.formula} mode=${combo.mode} brutality=${combo.brutality} ... `);
    const m = await runGenerate(flags.baseUrl, combo.formula, combo.mode, combo.brutality, i);
    runMetrics.push(m);
    console.log(`${m.ok ? (m.bannerReceived ? 'banner' : 'refusal') : 'fail'} (${m.latencyMs}ms, ${m.events} events)${m.errorMessage ? ` · ${m.errorMessage.slice(0, 60)}` : ''}`);
  }
  console.log('');

  console.log(`PHASE 3: ${flags.branchActivations} branch activation(s)`);
  const activationResults: { ok: boolean; error: string | null }[] = [];
  for (let i = 0; i < flags.branchActivations; i++) {
    const r = await injectBranchActivation(flags.baseUrl, i);
    activationResults.push(r);
    console.log(`  [${i}] ${r.ok ? 'ok' : 'fail'}${r.error ? ` · ${r.error}` : ''}`);
  }
  console.log('');

  console.log(`PHASE 4: ${flags.confidenceUpdates} operator confidence slider update(s)`);
  const confidenceResults: { ok: boolean; error: string | null }[] = [];
  for (let i = 0; i < flags.confidenceUpdates; i++) {
    const r = await injectConfidenceUpdate(flags.baseUrl, i);
    confidenceResults.push(r);
    console.log(`  [${i}] ${r.ok ? 'ok' : 'fail'}${r.error ? ` · ${r.error}` : ''}`);
  }
  console.log('');

  console.log('PHASE 5: final route probe (drift comparison)');
  const finalProbes = await probeAllRoutes(flags.baseUrl);
  const finalProbeOk = finalProbes.filter((p) => p.ok).length;
  console.log(`  ${finalProbeOk}/${finalProbes.length} routes responding`);

  // Compare shapes initial vs final.
  const routesIdenticalShape: string[] = [];
  const routesShapeChanged: string[] = [];
  for (const initial of initialProbes) {
    const finalProbe = finalProbes.find((p) => p.route === initial.route);
    if (!finalProbe) continue;
    if (initial.jsonShape === finalProbe.jsonShape) routesIdenticalShape.push(initial.route);
    else routesShapeChanged.push(initial.route);
  }
  console.log(`  ${routesIdenticalShape.length}/${initialProbes.length} routes kept identical top-level shape`);
  console.log('');

  const finalMemory = await probeMemoryDir(memoryDir);
  const perFileDelta: Record<string, number> = {};
  const allFiles = new Set([...Object.keys(initialMemory.files), ...Object.keys(finalMemory.files)]);
  for (const f of allFiles) {
    perFileDelta[f] = (finalMemory.files[f] ?? 0) - (initialMemory.files[f] ?? 0);
  }
  const totalDeltaBytes = Object.values(perFileDelta).reduce((a, b) => a + b, 0);

  // Pull system integrity for FIFO + baseline health.
  const integrity = await getJson<{
    memoryHealth?: Array<{ file: string; capped: boolean; exists: boolean }>;
    baselineHealth?: Array<{ layer: string; status: string }>;
  }>(flags.baseUrl, '/api/system-integrity');
  const memoryHealth = integrity.data?.memoryHealth ?? [];
  const baselineHealth = integrity.data?.baselineHealth ?? [];

  const generateLatencies = runMetrics.map((m) => m.latencyMs);
  const probeLatencies = [...initialProbes, ...finalProbes].map((p) => p.latencyMs);

  const routeFailures = [
    ...initialProbes.filter((p) => !p.ok).map((p) => `initial ${p.route}: ${p.error}`),
    ...finalProbes.filter((p) => !p.ok).map((p) => `final ${p.route}: ${p.error}`),
  ];
  const generateFailures = runMetrics
    .filter((m) => !m.bannerReceived && (m.errorMessage === null || !m.errorMessage.includes('exhausted')))
    .map((m) => `run ${m.index} (${m.formula}/${m.mode}/${m.brutality}): ${m.errorMessage ?? 'no banner, no controlled error'}`);

  const panelFailures: string[] = [];
  for (const b of baselineHealth) {
    if (b.status === 'shape-drift') panelFailures.push(`baseline drift: ${b.layer}`);
  }

  const warnings: string[] = [];
  if (formulasSeen.size < flags.formulas.length) {
    warnings.push(`only ${formulasSeen.size}/${flags.formulas.length} formulas exercised — raise --runs to cover all`);
  }
  if (generateFailures.length > 0) {
    warnings.push(`${generateFailures.length} generation run(s) failed`);
  }
  if (activationResults.some((r) => !r.ok)) {
    warnings.push('branch activation POST(s) failed');
  }
  if (confidenceResults.some((r) => !r.ok)) {
    warnings.push('confidence slider POST(s) failed');
  }

  let stabilityStatus: SimulationReport['stabilityStatus'] = 'stable';
  if (routeFailures.length > 0 || generateFailures.length > 0 || panelFailures.length > 0) {
    stabilityStatus = routeFailures.length > 0 || panelFailures.length > 0 ? 'critical' : 'warning';
  }

  const report: SimulationReport = {
    runsExecuted: runMetrics.length,
    formulasCovered: Array.from(formulasSeen).sort(),
    memoryGrowth: {
      initial: initialMemory, final: finalMemory,
      perFileDeltaBytes: perFileDelta, totalDeltaBytes,
    },
    fifoIntegrity: {
      matchedBaselines: baselineHealth.filter((b) => b.status === 'matched').length,
      driftedBaselines: baselineHealth.filter((b) => b.status === 'shape-drift').length,
      missingBaselines: baselineHealth.filter((b) => b.status === 'missing-baseline').length,
      cappedMemoryFiles: memoryHealth.filter((m) => m.capped).length,
      totalMemoryFiles: memoryHealth.length,
    },
    routeFailures: [...routeFailures, ...generateFailures],
    panelFailures,
    deterministicConsistency: {
      routesProbed: initialProbes.length,
      routesIdenticalShapeOnRefresh: routesIdenticalShape.length,
      routesShapeChanged: routesShapeChanged.length,
    },
    driftAccumulation: {
      stableRoutes: routesIdenticalShape.length,
      shapeChangedRoutes: routesShapeChanged,
    },
    latencyMetrics: {
      generateRunCount: generateLatencies.length,
      generateP50Ms: percentile(generateLatencies, 0.5),
      generateP95Ms: percentile(generateLatencies, 0.95),
      generateMaxMs: Math.max(0, ...generateLatencies),
      probeP95Ms: percentile(probeLatencies, 0.95),
    },
    stabilityStatus,
    warnings,
    reasonCodes: [
      `runs:${runMetrics.length}`,
      `formulas:${formulasSeen.size}`,
      `route-failures:${routeFailures.length}`,
      `generate-failures:${generateFailures.length}`,
      `panel-failures:${panelFailures.length}`,
      `memory-delta-bytes:${totalDeltaBytes}`,
      `fifo-capped:${memoryHealth.filter((m) => m.capped).length}/${memoryHealth.length}`,
      `baselines-matched:${baselineHealth.filter((b) => b.status === 'matched').length}/${baselineHealth.length}`,
      `overall:${stabilityStatus}`,
    ],
  };

  console.log('───── SIMULATION REPORT ─────');
  console.log(`  stability:              ${report.stabilityStatus}`);
  console.log(`  runs executed:          ${report.runsExecuted}`);
  console.log(`  formulas covered:       ${report.formulasCovered.join(', ')}`);
  console.log(`  route failures:         ${report.routeFailures.length}`);
  console.log(`  panel failures:         ${report.panelFailures.length}`);
  console.log(`  memory delta bytes:     ${report.memoryGrowth.totalDeltaBytes}`);
  console.log(`  fifo capped:            ${report.fifoIntegrity.cappedMemoryFiles}/${report.fifoIntegrity.totalMemoryFiles}`);
  console.log(`  baselines matched:      ${report.fifoIntegrity.matchedBaselines}/${report.fifoIntegrity.matchedBaselines + report.fifoIntegrity.driftedBaselines + report.fifoIntegrity.missingBaselines}`);
  console.log(`  generate p50/p95/max:   ${report.latencyMetrics.generateP50Ms}/${report.latencyMetrics.generateP95Ms}/${report.latencyMetrics.generateMaxMs} ms`);
  console.log(`  probe p95:              ${report.latencyMetrics.probeP95Ms} ms`);
  if (report.warnings.length > 0) {
    console.log(`  warnings:`);
    for (const w of report.warnings) console.log(`    · ${w}`);
  }
  if (report.routeFailures.length > 0) {
    console.log(`  failed routes:`);
    for (const r of report.routeFailures.slice(0, 10)) console.log(`    · ${r}`);
  }

  if (flags.reportPath) {
    await fs.writeFile(path.resolve(flags.reportPath), JSON.stringify(report, null, 2));
    console.log(`\n  report written to: ${flags.reportPath}`);
  }

  process.exit(report.stabilityStatus === 'critical' ? 1 : 0);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
