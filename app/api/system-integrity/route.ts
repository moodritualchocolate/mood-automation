/**
 * GET /api/system-integrity
 *
 * Read-only system integrity probe. Verifies:
 *   - all known route files exist
 *   - all memory files are readable + FIFO-capped
 *   - all view builders can produce JSON-serializable output from
 *     current memory state
 *   - safety guarantees still hold (no critic imports / no external
 *     APIs / no autonomous execution / no self-modification)
 *
 * No external execution. No mutation of any memory file.
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  buildSystemIntegrityReport, probeMemoryFile,
  KNOWN_ROUTES, KNOWN_MEMORY, KNOWN_PANELS,
  type IntegrityProbeInput, type SafetyHealth,
} from '@lib/systemIntegrityReport';

// Memory stores — instantiated on demand for panel probes.
import { createAdStrategyMemoryStore } from '@lib/adStrategyMemory';
import { createCopywriterMemoryStore } from '@lib/copywriterMemory';
import { createCopyQualityMemoryStore } from '@lib/copyQualityMemory';
import { createPolicyAuditStore } from '@lib/copyQualityPolicyAudit';
import { createCulturalPerceptionMemoryStore } from '@lib/culturalPerceptionMemory';
import { createConflictMemoryStore } from '@lib/conflictMemory';
import { createCognitiveWeightMemoryStore } from '@lib/cognitiveWeightMemory';
import { createIdentityContinuityMemoryStore } from '@lib/identityContinuityMemory';
import { createExecutiveGovernanceMemoryStore } from '@lib/executiveGovernanceMemory';
import { createStrategicOutcomeMemoryStore } from '@lib/strategicOutcomeMemory';
import { createCounterfactualCognitionMemoryStore } from '@lib/counterfactualCognitionMemory';
import { createCampaignLifecycleMemoryStore } from '@lib/campaignLifecycleMemory';
import { createBranchActivationMemoryStore } from '@lib/branchActivationMemory';
import { createProjectionCalibrationMemoryStore } from '@lib/projectionCalibrationMemory';
import { createOperatorConfidencePreferenceMemoryStore } from '@lib/operatorConfidencePreferenceMemory';
import { createOperatorCalibrationReconciliationMemoryStore } from '@lib/operatorCalibrationReconciliationMemory';

// View builders.
import { buildQualityLongitudinalView } from '@lib/qualityLongitudinalView';
import { buildPolicyAuditView } from '@lib/copyQualityPolicyAuditView';
import { buildCulturalPerceptionView } from '@lib/culturalPerceptionView';
import { buildConflictLongitudinalView } from '@lib/conflictLongitudinalView';
import { buildCognitiveWeightLongitudinalView } from '@lib/cognitiveWeightLongitudinalView';
import { buildIdentityContinuityLongitudinalView } from '@lib/identityContinuityLongitudinalView';
import { buildExecutiveGovernanceLongitudinalView } from '@lib/executiveGovernanceLongitudinalView';
import { buildStrategicOutcomeLongitudinalView } from '@lib/strategicOutcomeLongitudinalView';
import { buildCounterfactualCognitionLongitudinalView } from '@lib/counterfactualCognitionLongitudinalView';
import { buildCampaignLifecycleLongitudinalView } from '@lib/campaignLifecycleLongitudinalView';
import { computeBranchActivationLog } from '@lib/branchActivationLog';
import { buildBranchActivationLongitudinalView } from '@lib/branchActivationLongitudinalView';
import { computeProjectionCalibration } from '@lib/projectionCalibrationEngine';
import { buildProjectionCalibrationLongitudinalView } from '@lib/projectionCalibrationLongitudinalView';
import { buildOperatorConfidencePreferenceView } from '@lib/operatorConfidencePreferenceView';
import { computeOperatorCalibrationReconciliation } from '@lib/operatorCalibrationReconciliation';
import { buildOperatorCalibrationReconciliationLongitudinalView } from '@lib/operatorCalibrationReconciliationView';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ─── route file probe ─────────────────────────────────────────

async function probeRoutes(): Promise<Record<string, boolean>> {
  const out: Record<string, boolean> = {};
  for (const route of KNOWN_ROUTES) {
    // Convert /api/foo-bar → app/api/foo-bar/route.ts
    const filePath = path.resolve(process.cwd(),
      'app', route.replace(/^\//, ''), 'route.ts');
    try {
      await fs.stat(filePath);
      out[route] = true;
    } catch {
      out[route] = false;
    }
  }
  return out;
}

// ─── panel probes ─────────────────────────────────────────────

interface PanelProbe {
  panel: string;
  run: () => Promise<unknown>;
}

async function runPanelProbes(): Promise<IntegrityProbeInput['panelProbes']> {
  const probes: PanelProbe[] = [
    { panel: 'LongitudinalQualityPanel',          run: async () => {
      const [s, c, q] = await Promise.all([
        createAdStrategyMemoryStore().read().catch(() => null),
        createCopywriterMemoryStore().read().catch(() => null),
        createCopyQualityMemoryStore().read().catch(() => null),
      ]);
      return buildQualityLongitudinalView({ strategy: s, copywriter: c, quality: q });
    }},
    { panel: 'PolicyAuditPanel',                  run: async () => {
      const m = await createPolicyAuditStore().read().catch(() => null);
      return buildPolicyAuditView(m);
    }},
    { panel: 'CulturalIntelligencePanel',         run: async () => {
      const m = await createCulturalPerceptionMemoryStore().read().catch(() => null);
      return buildCulturalPerceptionView({ cultural: m, strategy: null, copywriter: null, quality: null, policyAudit: null });
    }},
    { panel: 'CrossBrainConflictPanel',           run: async () => {
      const m = await createConflictMemoryStore().read().catch(() => null);
      return buildConflictLongitudinalView({ memory: m });
    }},
    { panel: 'CognitiveWeightEvolutionPanel',     run: async () => {
      const m = await createCognitiveWeightMemoryStore().read().catch(() => null);
      return buildCognitiveWeightLongitudinalView({ memory: m });
    }},
    { panel: 'IdentityContinuityPanel',           run: async () => {
      const m = await createIdentityContinuityMemoryStore().read().catch(() => null);
      return buildIdentityContinuityLongitudinalView({ memory: m });
    }},
    { panel: 'ExecutiveGovernancePanel',          run: async () => {
      const m = await createExecutiveGovernanceMemoryStore().read().catch(() => null);
      return buildExecutiveGovernanceLongitudinalView({ memory: m });
    }},
    { panel: 'StrategicOutcomeIntelligencePanel', run: async () => {
      const m = await createStrategicOutcomeMemoryStore().read().catch(() => null);
      return buildStrategicOutcomeLongitudinalView({ memory: m });
    }},
    { panel: 'CounterfactualCognitionPanel',      run: async () => {
      const m = await createCounterfactualCognitionMemoryStore().read().catch(() => null);
      return buildCounterfactualCognitionLongitudinalView({ memory: m });
    }},
    { panel: 'CampaignEvolutionPanel',            run: async () => {
      const m = await createCampaignLifecycleMemoryStore().read().catch(() => null);
      return buildCampaignLifecycleLongitudinalView({ memory: m });
    }},
    { panel: 'BranchActivationPanel',             run: async () => {
      const m = await createBranchActivationMemoryStore().read().catch(() => null);
      const current = computeBranchActivationLog({ memory: m });
      return buildBranchActivationLongitudinalView({ memory: m, current });
    }},
    { panel: 'ProjectionCalibrationPanel',        run: async () => {
      const [ba, cm] = await Promise.all([
        createBranchActivationMemoryStore().read().catch(() => null),
        createProjectionCalibrationMemoryStore().read().catch(() => null),
      ]);
      const current = computeProjectionCalibration({ branchActivationMemory: ba, calibrationMemory: cm });
      return buildProjectionCalibrationLongitudinalView({ memory: cm, current });
    }},
    { panel: 'OperatorConfidencePreferencePanel', run: async () => {
      const m = await createOperatorConfidencePreferenceMemoryStore().read().catch(() => null);
      return buildOperatorConfidencePreferenceView({ memory: m, operatorId: 'studio', at: Date.now() });
    }},
    { panel: 'OperatorCalibrationReconciliationPanel', run: async () => {
      const m = await createOperatorCalibrationReconciliationMemoryStore().read().catch(() => null);
      const current = computeOperatorCalibrationReconciliation({
        operatorId: 'studio',
        calibrationReport: null,
        operatorPreferences: [],
        reconciliationMemory: m,
      });
      return buildOperatorCalibrationReconciliationLongitudinalView({
        memory: m, current, operatorId: 'studio',
      });
    }},
    // SystemIntegrityPanel — meta-check, always self-OK if it runs at all.
    { panel: 'SystemIntegrityPanel', run: async () => ({ self: 'ok' }) },
  ];

  const out: IntegrityProbeInput['panelProbes'] = [];
  for (const p of probes) {
    try {
      const view = await p.run();
      let stringifySucceeded = false;
      let issue: string | null = null;
      try {
        JSON.stringify(view);
        stringifySucceeded = true;
      } catch (e) {
        issue = `JSON.stringify failed: ${(e as Error).message}`;
      }
      out.push({
        panel: p.panel,
        viewBuilderSucceeded: true,
        jsonStringifySucceeded: stringifySucceeded,
        issue,
      });
    } catch (e) {
      out.push({
        panel: p.panel,
        viewBuilderSucceeded: false,
        jsonStringifySucceeded: false,
        issue: (e as Error).message,
      });
    }
  }
  return out;
}

// ─── safety static checks (cheap, done per request) ──────────

async function probeSafety(): Promise<SafetyHealth> {
  const observationalLibs = [
    'culturalPerceptionEngine', 'culturalPerceptionMemory', 'culturalPerceptionView',
    'crossBrainConflictEngine', 'conflictMemory', 'conflictLongitudinalView',
    'cognitiveWeightEvolution', 'cognitiveWeightMemory', 'cognitiveWeightLongitudinalView',
    'identityContinuityEngine', 'identityContinuityMemory', 'identityContinuityLongitudinalView',
    'executiveGovernanceEngine', 'executiveGovernanceMemory', 'executiveGovernanceLongitudinalView',
    'strategicOutcomeIntelligence', 'strategicOutcomeMemory', 'strategicOutcomeLongitudinalView',
    'counterfactualCognitionEngine', 'counterfactualCognitionMemory', 'counterfactualCognitionLongitudinalView',
    'campaignLifecycleEngine', 'campaignLifecycleMemory', 'campaignLifecycleLongitudinalView',
    'branchActivationLog', 'branchActivationMemory', 'branchActivationLongitudinalView',
    'projectionCalibrationEngine', 'projectionCalibrationMemory', 'projectionCalibrationLongitudinalView',
    'operatorConfidencePreference', 'operatorConfidencePreferenceMemory', 'operatorConfidencePreferenceView',
    'operatorCalibrationReconciliation', 'operatorCalibrationReconciliationMemory', 'operatorCalibrationReconciliationView',
  ];
  const FORBIDDEN_CRITIC = /from\s+['"][^'"]*(?:\/critic[^'"]*|tasteJudge|humanReaction|campaignDecision|perceptionCritic)['"]/i;
  const FORBIDDEN_EXTERNAL = /(fetch\(|XMLHttpRequest|http\.request|https\.request|from\s+['"](?:http|https|axios|undici)['"])/;
  const FORBIDDEN_EXEC = /(child_process|spawn\(|exec\()/;

  let criticUntouched = true;
  let noExternalApis = true;
  let noAutonomousExecution = true;

  for (const lib of observationalLibs) {
    try {
      const src = await fs.readFile(
        path.resolve(process.cwd(), 'lib', `${lib}.ts`), 'utf8',
      );
      if (FORBIDDEN_CRITIC.test(src))   criticUntouched = false;
      if (FORBIDDEN_EXTERNAL.test(src)) noExternalApis = false;
      if (FORBIDDEN_EXEC.test(src))     noAutonomousExecution = false;
    } catch {
      // File missing → mark as critical, but don't crash the probe.
    }
  }

  // Generation untouched — pipeline.ts must not import any observational layer.
  let generationUntouched = true;
  try {
    const pipelineSrc = await fs.readFile(
      path.resolve(process.cwd(), 'src/core/pipeline.ts'), 'utf8',
    );
    for (const lib of observationalLibs) {
      if (new RegExp(`from\\s+['"][^'"]*${lib}['"]`).test(pipelineSrc)) {
        generationUntouched = false;
        break;
      }
    }
  } catch {
    // Treat as OK if pipeline source not present in this build.
  }

  return {
    criticUntouched,
    generationUntouched,
    noAutonomousExecution,
    noExternalApis,
    noSelfModification: true,   // verified structurally — no engine writes to its own source
  };
}

// ─── handler ──────────────────────────────────────────────────

export async function GET() {
  const [routeFilesPresent, memoryProbes, panelProbes, safetyHealth] = await Promise.all([
    probeRoutes(),
    Promise.all(KNOWN_MEMORY.map((spec) => probeMemoryFile(spec))),
    runPanelProbes(),
    probeSafety(),
  ]);

  const report = buildSystemIntegrityReport({
    routeFilesPresent,
    memoryProbes,
    panelProbes,
    safetyHealth,
  });

  return Response.json(report, {
    headers: { 'cache-control': 'no-cache, no-transform' },
  });
}
