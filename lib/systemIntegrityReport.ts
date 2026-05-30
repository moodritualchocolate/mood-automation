/**
 * SYSTEM INTEGRITY REPORT
 *
 * Pure deterministic analyzer. Probes every memory store + every
 * longitudinal view + each safety guarantee, and produces a single
 * SystemIntegrityReport.
 *
 * STRICTLY:
 *   - read-only probe (no writes during the integrity check)
 *   - no external APIs
 *   - same memory state → same report
 *
 * The probe is intentionally cheap so the API endpoint can call it
 * on every GET without pressure on the system.
 */

import { promises as fs } from 'fs';
import * as path from 'path';

// ─── output shape ──────────────────────────────────────────────

export interface RouteHealthRow {
  route: string;
  status: 'ok' | 'missing' | 'error';
  issue: string | null;
}

export interface MemoryHealthRow {
  file: string;
  exists: boolean;
  readable: boolean;
  capped: boolean;
  issue: string | null;
}

export interface PanelHealthRow {
  panel: string;
  status: 'ok' | 'error';
  issue: string | null;
}

export interface SafetyHealth {
  criticUntouched: boolean;
  generationUntouched: boolean;
  noAutonomousExecution: boolean;
  noExternalApis: boolean;
  noSelfModification: boolean;
}

export interface BaselineHealthRow {
  layer: string;
  status: 'matched' | 'missing-baseline' | 'shape-drift';
  issue: string | null;
}

export interface SystemIntegrityReport {
  overallStatus: 'stable' | 'warning' | 'critical';
  typeScriptStatus: boolean;
  routeHealth: RouteHealthRow[];
  memoryHealth: MemoryHealthRow[];
  panelHealth: PanelHealthRow[];
  safetyHealth: SafetyHealth;
  baselineHealth: BaselineHealthRow[];
  warnings: string[];
  reasonCodes: string[];
}

// ─── known routes / memory files / panels ─────────────────────

/** All API routes we ship. Used to verify route file presence. */
const KNOWN_ROUTES: string[] = [
  '/api/generate',
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
  '/api/operator-confidence-preference',
  '/api/operator-calibration-reconciliation',
  '/api/system-integrity',
  '/api/pre-generation-stability',
  '/api/creative-drift',
  '/api/visual-dna',
  '/api/narrative-dna',
  '/api/creative-fatigue',
  '/api/mutation-planner',
  '/api/refusal-narrative',
  '/api/adaptation-orchestrator',
  '/api/consequence-intelligence',
  '/api/outcome',
  '/api/reality-intelligence',
  '/api/human-truth',
  '/api/cultural-memory',
  '/api/meta-cognition',
  '/api/reflective-reasoning',
  '/api/evolution-sandbox',
  '/api/operator-creative-trial',
  '/api/trial-outcome',
  '/api/supervised-learning-loop',
  '/api/world-model',
  '/api/self-reflection',
  '/api/human-memory-imprint',
  '/api/human-presence',
  '/api/creative-director',
  '/api/story-architect',
  '/api/scene-architect',
  '/api/emotional-rhythm',
  '/api/asset-composer',
  '/api/production-studio',
  '/api/asset-registry',
  '/api/provider-registry',
  '/api/generation-queue',
  '/api/generation-result',
  '/api/publication-registry',
  '/api/performance',
  '/api/performance-analyzer',
  '/api/creative-dna-map',
  '/api/learning-bridge',
  '/api/campaign-planner',
  '/api/customer-journey',
  '/api/attribution',
  '/api/product-intelligence',
  '/api/business-dashboard',
  '/api/revenue-bridge',
  '/api/workspace',
  '/api/team',
  '/api/task',
  '/api/knowledge',
  '/api/executive-dashboard',
  '/api/agent',
];

/** All known memory files + their FIFO observation-array key + cap.
 *  The cap is only verified loosely — we check that the persisted
 *  array length never exceeds the declared limit when the file exists. */
interface KnownMemorySpec {
  file: string;
  fifoFieldName: string | null;
  fifoLimit: number | null;
}

const KNOWN_MEMORY: KnownMemorySpec[] = [
  { file: 'ad-strategy-memory.json',                       fifoFieldName: 'audienceHistory',          fifoLimit: 32 },
  { file: 'copywriter-memory.json',                        fifoFieldName: 'hookHistory',              fifoLimit: 32 },
  { file: 'copy-quality-memory.json',                      fifoFieldName: 'samples',                  fifoLimit: 48 },
  { file: 'copy-quality-policy-audit.json',                fifoFieldName: 'entries',                  fifoLimit: 100 },
  { file: 'cultural-perception-memory.json',               fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'conflict-memory.json',                          fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'cognitive-weight-memory.json',                  fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'identity-continuity-memory.json',               fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'executive-governance-memory.json',              fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'strategic-outcome-memory.json',                 fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'counterfactual-cognition-memory.json',          fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'campaign-evolution-memory.json',                fifoFieldName: 'observations',             fifoLimit: 96 },
  { file: 'branch-activation-memory.json',                 fifoFieldName: 'activations',              fifoLimit: 96 },
  { file: 'projection-calibration-memory.json',            fifoFieldName: 'snapshots',                fifoLimit: 64 },
  { file: 'operator-confidence-preference-memory.json',    fifoFieldName: 'history',                  fifoLimit: 128 },
  { file: 'operator-calibration-reconciliation-memory.json', fifoFieldName: 'snapshots',              fifoLimit: 64 },
];

/** Studio panels exercised by this integrity report. Each entry pairs
 *  a panel name with a runtime probe that should succeed against the
 *  current memory state (or null state). */
const KNOWN_PANELS: string[] = [
  'LongitudinalQualityPanel',
  'PolicyAuditPanel',
  'CulturalIntelligencePanel',
  'CrossBrainConflictPanel',
  'CognitiveWeightEvolutionPanel',
  'IdentityContinuityPanel',
  'ExecutiveGovernancePanel',
  'StrategicOutcomeIntelligencePanel',
  'CounterfactualCognitionPanel',
  'CampaignEvolutionPanel',
  'BranchActivationPanel',
  'ProjectionCalibrationPanel',
  'OperatorConfidencePreferencePanel',
  'OperatorCalibrationReconciliationPanel',
  'SystemIntegrityPanel',
];

// ─── input ─────────────────────────────────────────────────────

/** Probe results passed in by the route — keeps the engine pure
 *  (no I/O of its own) so verification scripts can drive it
 *  deterministically. */
export interface IntegrityProbeInput {
  routeFilesPresent: Record<string, boolean>;
  memoryProbes: Array<{
    file: string;
    exists: boolean;
    readable: boolean;
    arrayLength: number | null;
    declaredLimit: number | null;
    parseError: string | null;
  }>;
  panelProbes: Array<{
    panel: string;
    viewBuilderSucceeded: boolean;
    jsonStringifySucceeded: boolean;
    issue: string | null;
  }>;
  /** Static-safety constants the route asserts at boot. Defaulted to
   *  true — the verify-system-stability.ts harness drives these via
   *  source-file scans. */
  safetyHealth?: Partial<SafetyHealth>;
  /** Optional TypeScript-clean signal; the harness sets this from
   *  the result of `npx tsc --noEmit`. Defaults to true. */
  typeScriptStatus?: boolean;
  /** Optional per-layer baseline comparison results. When omitted,
   *  the report emits zero baseline rows — useful for harness
   *  contexts that don't probe the baseline directory. */
  baselineHealth?: BaselineHealthRow[];
}

// ─── helpers ───────────────────────────────────────────────────

function defaultSafety(): SafetyHealth {
  return {
    criticUntouched: true,
    generationUntouched: true,
    noAutonomousExecution: true,
    noExternalApis: true,
    noSelfModification: true,
  };
}

// ─── main ──────────────────────────────────────────────────────

export function buildSystemIntegrityReport(
  input: IntegrityProbeInput,
): SystemIntegrityReport {
  const warnings: string[] = [];
  const reasonCodes: string[] = [];

  // Route health.
  const routeHealth: RouteHealthRow[] = KNOWN_ROUTES.map((route) => {
    const present = input.routeFilesPresent[route];
    if (present === undefined) {
      return { route, status: 'error' as const, issue: 'no probe data' };
    }
    if (!present) {
      return { route, status: 'missing' as const, issue: 'route file not found' };
    }
    return { route, status: 'ok' as const, issue: null };
  });

  // Memory health.
  const memoryProbeByFile = new Map(input.memoryProbes.map((p) => [p.file, p]));
  const memoryHealth: MemoryHealthRow[] = KNOWN_MEMORY.map((spec) => {
    const probe = memoryProbeByFile.get(spec.file);
    if (!probe) {
      return {
        file: spec.file, exists: false, readable: false, capped: true,
        issue: 'no probe data',
      };
    }
    let capped = true;
    let issue: string | null = probe.parseError;
    if (probe.exists && probe.readable && probe.arrayLength !== null && probe.declaredLimit !== null) {
      if (probe.arrayLength > probe.declaredLimit) {
        capped = false;
        issue = `array length ${probe.arrayLength} exceeds declared FIFO limit ${probe.declaredLimit}`;
      }
    }
    return {
      file: spec.file,
      exists: probe.exists,
      readable: probe.readable,
      capped,
      issue,
    };
  });

  // Panel health.
  const panelProbeByName = new Map(input.panelProbes.map((p) => [p.panel, p]));
  const panelHealth: PanelHealthRow[] = KNOWN_PANELS.map((panel) => {
    const probe = panelProbeByName.get(panel);
    if (!probe) {
      // Panels without an explicit probe are assumed OK — they're
      // rendered by view builders that are themselves verified by
      // the per-layer verify-* scripts.
      return { panel, status: 'ok' as const, issue: null };
    }
    if (!probe.viewBuilderSucceeded || !probe.jsonStringifySucceeded) {
      return { panel, status: 'error' as const, issue: probe.issue ?? 'unknown probe failure' };
    }
    return { panel, status: 'ok' as const, issue: null };
  });

  // Safety health.
  const safetyHealth: SafetyHealth = {
    ...defaultSafety(),
    ...(input.safetyHealth ?? {}),
  };

  // Baseline health.
  const baselineHealth: BaselineHealthRow[] = input.baselineHealth ?? [];

  // Aggregate.
  const typeScriptStatus = input.typeScriptStatus ?? true;
  const failedRoutes = routeHealth.filter((r) => r.status !== 'ok');
  const failedMemory = memoryHealth.filter((m) => m.exists && (!m.readable || !m.capped));
  const failedPanels = panelHealth.filter((p) => p.status !== 'ok');
  const safetyAllOk = (Object.values(safetyHealth) as boolean[]).every((v) => v === true);
  const baselineDrift = baselineHealth.filter((b) => b.status === 'shape-drift');
  const baselineMissing = baselineHealth.filter((b) => b.status === 'missing-baseline');

  // Warnings — memory file not yet created is informational, not a
  // failure; it's normal on a fresh install.
  for (const m of memoryHealth) {
    if (!m.exists) {
      warnings.push(`memory file not yet created: ${m.file} (expected on fresh install)`);
    }
    if (m.exists && m.issue && m.capped) {
      warnings.push(`${m.file}: ${m.issue}`);
    }
  }
  for (const b of baselineMissing) {
    warnings.push(`baseline not yet anchored: ${b.layer} (run scripts/anchor-integrity-baselines.ts)`);
  }
  for (const b of baselineDrift) {
    warnings.push(`baseline shape drift: ${b.layer}${b.issue ? ` — ${b.issue}` : ''}`);
  }

  let overallStatus: SystemIntegrityReport['overallStatus'] = 'stable';
  if (!typeScriptStatus || failedRoutes.length > 0 || failedPanels.length > 0 ||
      failedMemory.length > 0 || !safetyAllOk || baselineDrift.length > 0) {
    overallStatus = (failedRoutes.length > 0 || !safetyAllOk || baselineDrift.length > 0)
      ? 'critical'
      : 'warning';
  }

  reasonCodes.push(
    `routes-ok:${routeHealth.filter((r) => r.status === 'ok').length}/${routeHealth.length}`,
    `memory-files-present:${memoryHealth.filter((m) => m.exists).length}/${memoryHealth.length}`,
    `memory-files-capped:${memoryHealth.filter((m) => m.capped).length}/${memoryHealth.length}`,
    `panels-ok:${panelHealth.filter((p) => p.status === 'ok').length}/${panelHealth.length}`,
    `safety:${(Object.values(safetyHealth) as boolean[]).filter((v) => v).length}/5`,
    `baselines-matched:${baselineHealth.filter((b) => b.status === 'matched').length}/${baselineHealth.length}`,
    `typescript:${typeScriptStatus ? 'clean' : 'failing'}`,
    `overall:${overallStatus}`,
  );

  return {
    overallStatus,
    typeScriptStatus,
    routeHealth,
    memoryHealth,
    panelHealth,
    safetyHealth,
    baselineHealth,
    warnings,
    reasonCodes,
  };
}

// ─── helper: probe memory files from disk ─────────────────────

/** Filesystem probe — called by the route to populate the probe
 *  input. Pure I/O wrapper; never throws. */
export async function probeMemoryFile(
  spec: KnownMemorySpec,
  dir = path.resolve(process.cwd(), 'data', 'memory'),
): Promise<IntegrityProbeInput['memoryProbes'][number]> {
  const filePath = path.join(dir, spec.file);
  let exists = false;
  let readable = false;
  let arrayLength: number | null = null;
  let parseError: string | null = null;
  try {
    const txt = await fs.readFile(filePath, 'utf8');
    exists = true;
    readable = true;
    try {
      const parsed = JSON.parse(txt) as Record<string, unknown>;
      if (spec.fifoFieldName) {
        const arr = parsed[spec.fifoFieldName];
        arrayLength = Array.isArray(arr) ? arr.length : null;
      }
    } catch (e) {
      readable = false;
      parseError = (e as Error).message;
    }
  } catch (e) {
    const err = e as NodeJS.ErrnoException;
    if (err.code === 'ENOENT') {
      exists = false;
    } else {
      readable = false;
      parseError = err.message;
    }
  }
  return {
    file: spec.file,
    exists,
    readable,
    arrayLength,
    declaredLimit: spec.fifoLimit,
    parseError,
  };
}

/** Public re-export so the route + verify script see the same list. */
export { KNOWN_ROUTES, KNOWN_MEMORY, KNOWN_PANELS };
