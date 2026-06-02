/**
 * scripts/verify-system-stability.ts
 *
 * Full stability + integrity audit. Proves the system can survive
 * its own complexity before any new cognition is added.
 *
 *   A · TypeScript clean
 *   B · all critical routes import safely
 *   C · all memory stores read empty state safely
 *   D · all longitudinal views handle missing files
 *   E · studio panel data shapes tolerate null/empty memory
 *   F · generate route produces a result or controlled refusal
 *   G · no endpoint returns invalid JSON
 *   H · repeated refresh produces deterministic views
 *   I · memory files remain FIFO-capped
 *   J · no critic imports from observational layers
 *   K · no external fetch/spawn/network calls
 *   L · no autonomous execution/mutation paths
 *
 * Run: npx tsx scripts/verify-system-stability.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('SYSTEM STABILITY + INTEGRITY AUDIT\n');

// ─── known surface area ───────────────────────────────────────

const KNOWN_ROUTES = [
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
];

const OBSERVATIONAL_LIBS = [
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
  'systemIntegrityReport',
];

async function main() {
  // Use a temp dir for all memory stores so the audit doesn't touch real data.
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'system-stability-'));
  process.env.MOOD_MEMORY_DIR = tmpDir;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const g = globalThis as any;
  // Reset every cached memory state so reads pull fresh-empty.
  for (const k of [
    '__moodAdStrategy', '__moodCopywriterMemory', '__moodCopyQualityHistory',
    '__moodPolicyAudit', '__moodCulturalPerception', '__moodConflictMemory',
    '__moodCognitiveWeight', '__moodIdentityContinuity', '__moodExecutiveGovernance',
    '__moodStrategicOutcome', '__moodCounterfactualCognition', '__moodCampaignLifecycle',
    '__moodBranchActivation', '__moodProjectionCalibration',
    '__moodOperatorConfidencePreference', '__moodOperatorCalibrationReconciliation',
  ]) g[k] = undefined;

  // ── A. TypeScript clean ──────────────────────────────────────
  {
    let typeScriptOk = true;
    let stderr = '';
    try {
      execSync('npx tsc --noEmit', { stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) {
      typeScriptOk = false;
      stderr = (e as { stderr?: Buffer; stdout?: Buffer }).stdout?.toString() ?? '';
    }
    check('A · TypeScript clean (npx tsc --noEmit)',
      typeScriptOk,
      typeScriptOk ? 'no type errors' : `errors:\n${stderr.split('\n').slice(0, 5).join('\n')}`);
  }

  // ── B. all critical routes import safely ─────────────────────
  {
    const issues: string[] = [];
    for (const route of KNOWN_ROUTES) {
      const filePath = path.resolve(process.cwd(),
        'app', route.replace(/^\//, ''), 'route.ts');
      try {
        await fs.stat(filePath);
        // Try dynamic import — fails if there's a top-level error.
        await import(filePath);
      } catch (e) {
        issues.push(`${route}: ${(e as Error).message.split('\n')[0]}`);
      }
    }
    check('B · all critical route modules import without error',
      issues.length === 0,
      issues.length === 0 ? `${KNOWN_ROUTES.length} routes imported cleanly` : `issues:\n${issues.slice(0, 5).join('\n')}`);
  }

  // ── C. all memory stores read empty state safely ─────────────
  {
    const stores: Array<{ name: string; create: () => Promise<unknown> }> = [];
    const mods = await Promise.all([
      import('../lib/adStrategyMemory'),
      import('../lib/copywriterMemory'),
      import('../lib/copyQualityMemory'),
      import('../lib/copyQualityPolicyAudit'),
      import('../lib/culturalPerceptionMemory'),
      import('../lib/conflictMemory'),
      import('../lib/cognitiveWeightMemory'),
      import('../lib/identityContinuityMemory'),
      import('../lib/executiveGovernanceMemory'),
      import('../lib/strategicOutcomeMemory'),
      import('../lib/counterfactualCognitionMemory'),
      import('../lib/campaignLifecycleMemory'),
      import('../lib/branchActivationMemory'),
      import('../lib/projectionCalibrationMemory'),
      import('../lib/operatorConfidencePreferenceMemory'),
      import('../lib/operatorCalibrationReconciliationMemory'),
    ]);
    const factories = [
      mods[0].createAdStrategyMemoryStore,
      mods[1].createCopywriterMemoryStore,
      mods[2].createCopyQualityMemoryStore,
      mods[3].createPolicyAuditStore,
      mods[4].createCulturalPerceptionMemoryStore,
      mods[5].createConflictMemoryStore,
      mods[6].createCognitiveWeightMemoryStore,
      mods[7].createIdentityContinuityMemoryStore,
      mods[8].createExecutiveGovernanceMemoryStore,
      mods[9].createStrategicOutcomeMemoryStore,
      mods[10].createCounterfactualCognitionMemoryStore,
      mods[11].createCampaignLifecycleMemoryStore,
      mods[12].createBranchActivationMemoryStore,
      mods[13].createProjectionCalibrationMemoryStore,
      mods[14].createOperatorConfidencePreferenceMemoryStore,
      mods[15].createOperatorCalibrationReconciliationMemoryStore,
    ];
    const issues: string[] = [];
    for (let i = 0; i < factories.length; i++) {
      try {
        const state = await factories[i]().read();
        if (state === null || state === undefined) {
          issues.push(`factory ${i}: read returned null/undefined`);
        }
      } catch (e) {
        issues.push(`factory ${i}: ${(e as Error).message}`);
      }
    }
    check('C · all memory stores read empty state without throw',
      issues.length === 0,
      issues.length === 0 ? `${factories.length} stores returned safe default state` : `issues: ${issues.join(', ')}`);
  }

  // ── D. all longitudinal views handle missing files (null memory)
  {
    const views: Array<{ name: string; run: () => unknown }> = [];
    const mods = await Promise.all([
      import('../lib/qualityLongitudinalView'),
      import('../lib/copyQualityPolicyAuditView'),
      import('../lib/culturalPerceptionView'),
      import('../lib/conflictLongitudinalView'),
      import('../lib/cognitiveWeightLongitudinalView'),
      import('../lib/identityContinuityLongitudinalView'),
      import('../lib/executiveGovernanceLongitudinalView'),
      import('../lib/strategicOutcomeLongitudinalView'),
      import('../lib/counterfactualCognitionLongitudinalView'),
      import('../lib/campaignLifecycleLongitudinalView'),
      import('../lib/branchActivationLongitudinalView'),
      import('../lib/projectionCalibrationLongitudinalView'),
      import('../lib/operatorConfidencePreferenceView'),
      import('../lib/operatorCalibrationReconciliationView'),
    ]);
    views.push(
      { name: 'qualityLongitudinal',   run: () => mods[0].buildQualityLongitudinalView({ strategy: null, copywriter: null, quality: null }) },
      { name: 'policyAudit',           run: () => mods[1].buildPolicyAuditView(null) },
      { name: 'culturalPerception',    run: () => mods[2].buildCulturalPerceptionView({ cultural: null, strategy: null, copywriter: null, quality: null, policyAudit: null }) },
      { name: 'conflictLongitudinal',  run: () => mods[3].buildConflictLongitudinalView({ memory: null }) },
      { name: 'cognitiveWeight',       run: () => mods[4].buildCognitiveWeightLongitudinalView({ memory: null }) },
      { name: 'identityContinuity',    run: () => mods[5].buildIdentityContinuityLongitudinalView({ memory: null }) },
      { name: 'executiveGovernance',   run: () => mods[6].buildExecutiveGovernanceLongitudinalView({ memory: null }) },
      { name: 'strategicOutcome',      run: () => mods[7].buildStrategicOutcomeLongitudinalView({ memory: null }) },
      { name: 'counterfactual',        run: () => mods[8].buildCounterfactualCognitionLongitudinalView({ memory: null }) },
      { name: 'campaignLifecycle',     run: () => mods[9].buildCampaignLifecycleLongitudinalView({ memory: null }) },
      { name: 'branchActivation',      run: () => mods[10].buildBranchActivationLongitudinalView({ memory: null }) },
      { name: 'projectionCalibration', run: () => mods[11].buildProjectionCalibrationLongitudinalView({ memory: null }) },
      { name: 'operatorConfidencePref',run: () => mods[12].buildOperatorConfidencePreferenceView({ memory: null, operatorId: 'studio', at: 1 }) },
      { name: 'operatorReconciliation',run: () => mods[13].buildOperatorCalibrationReconciliationLongitudinalView({ memory: null, operatorId: 'studio' }) },
    );
    const issues: string[] = [];
    for (const v of views) {
      try { v.run(); }
      catch (e) { issues.push(`${v.name}: ${(e as Error).message.split('\n')[0]}`); }
    }
    check('D · all longitudinal views handle missing/null memory',
      issues.length === 0,
      issues.length === 0 ? `${views.length} views handled null memory cleanly` : `issues: ${issues.join(', ')}`);
  }

  // ── E. studio panel data shapes tolerate null/empty memory ───
  // (each view's no-history output must be JSON.stringify-able)
  {
    const mods = await Promise.all([
      import('../lib/qualityLongitudinalView'),
      import('../lib/copyQualityPolicyAuditView'),
      import('../lib/culturalPerceptionView'),
      import('../lib/conflictLongitudinalView'),
      import('../lib/cognitiveWeightLongitudinalView'),
      import('../lib/identityContinuityLongitudinalView'),
      import('../lib/executiveGovernanceLongitudinalView'),
      import('../lib/strategicOutcomeLongitudinalView'),
      import('../lib/counterfactualCognitionLongitudinalView'),
      import('../lib/campaignLifecycleLongitudinalView'),
      import('../lib/branchActivationLongitudinalView'),
      import('../lib/projectionCalibrationLongitudinalView'),
      import('../lib/operatorConfidencePreferenceView'),
      import('../lib/operatorCalibrationReconciliationView'),
    ]);
    const samples = [
      mods[0].buildQualityLongitudinalView({ strategy: null, copywriter: null, quality: null }),
      mods[1].buildPolicyAuditView(null),
      mods[2].buildCulturalPerceptionView({ cultural: null, strategy: null, copywriter: null, quality: null, policyAudit: null }),
      mods[3].buildConflictLongitudinalView({ memory: null }),
      mods[4].buildCognitiveWeightLongitudinalView({ memory: null }),
      mods[5].buildIdentityContinuityLongitudinalView({ memory: null }),
      mods[6].buildExecutiveGovernanceLongitudinalView({ memory: null }),
      mods[7].buildStrategicOutcomeLongitudinalView({ memory: null }),
      mods[8].buildCounterfactualCognitionLongitudinalView({ memory: null }),
      mods[9].buildCampaignLifecycleLongitudinalView({ memory: null }),
      mods[10].buildBranchActivationLongitudinalView({ memory: null }),
      mods[11].buildProjectionCalibrationLongitudinalView({ memory: null }),
      mods[12].buildOperatorConfidencePreferenceView({ memory: null, operatorId: 'studio', at: 1 }),
      mods[13].buildOperatorCalibrationReconciliationLongitudinalView({ memory: null, operatorId: 'studio' }),
    ];
    const issues: string[] = [];
    samples.forEach((s, i) => {
      try { JSON.stringify(s); }
      catch (e) { issues.push(`sample ${i}: ${(e as Error).message}`); }
    });
    check('E · panel data shapes tolerate null/empty memory (JSON-stringify safe)',
      issues.length === 0,
      issues.length === 0 ? `${samples.length} panel view outputs serialize cleanly` : `issues: ${issues.join(', ')}`);
  }

  // ── F. generate route produces controlled refusal on bad input ──
  {
    // Static check: route exports POST + has the controlled error
    // path (write({type:'error', error: ...})). End-to-end requires
    // a dev server; we verify the safety contract by source inspection.
    const src = await fs.readFile(path.resolve(process.cwd(), 'app/api/generate/route.ts'), 'utf8');
    const exportsPost = /export\s+async\s+function\s+POST\b/.test(src);
    const hasErrorPath = /write\(\s*\{\s*type:\s*['"]error['"]/.test(src);
    const closesStream = /controller\.close\(\)/.test(src);
    check('F · generate route exports POST + controlled refusal path + stream close',
      exportsPost && hasErrorPath && closesStream,
      `exportsPost=${exportsPost} hasErrorPath=${hasErrorPath} closesStream=${closesStream}`);
  }

  // ── G. no endpoint returns invalid JSON (sampling) ───────────
  {
    // Each view-builder output is the body of its GET endpoint. We
    // already JSON-stringified them in (E). Run a parse-back round-trip.
    const mods = await Promise.all([
      import('../lib/qualityLongitudinalView'),
      import('../lib/copyQualityPolicyAuditView'),
      import('../lib/systemIntegrityReport'),
    ]);
    const samples = [
      mods[0].buildQualityLongitudinalView({ strategy: null, copywriter: null, quality: null }),
      mods[1].buildPolicyAuditView(null),
      mods[2].buildSystemIntegrityReport({
        routeFilesPresent: {}, memoryProbes: [], panelProbes: [],
      }),
    ];
    const issues: string[] = [];
    samples.forEach((s, i) => {
      try {
        const round = JSON.parse(JSON.stringify(s));
        if (typeof round !== 'object' || round === null) {
          issues.push(`sample ${i}: round-trip returned non-object`);
        }
      } catch (e) {
        issues.push(`sample ${i}: ${(e as Error).message}`);
      }
    });
    check('G · endpoint outputs round-trip through JSON cleanly',
      issues.length === 0,
      issues.length === 0 ? 'verified for representative endpoints' : `issues: ${issues.join(', ')}`);
  }

  // ── H. repeated refresh produces deterministic views ─────────
  {
    const mods = await Promise.all([
      import('../lib/qualityLongitudinalView'),
      import('../lib/culturalPerceptionView'),
      import('../lib/conflictLongitudinalView'),
      import('../lib/cognitiveWeightLongitudinalView'),
      import('../lib/identityContinuityLongitudinalView'),
      import('../lib/executiveGovernanceLongitudinalView'),
      import('../lib/strategicOutcomeLongitudinalView'),
      import('../lib/counterfactualCognitionLongitudinalView'),
      import('../lib/campaignLifecycleLongitudinalView'),
      import('../lib/branchActivationLongitudinalView'),
      import('../lib/projectionCalibrationLongitudinalView'),
      import('../lib/operatorCalibrationReconciliationView'),
    ]);
    const calls: Array<() => unknown> = [
      () => mods[0].buildQualityLongitudinalView({ strategy: null, copywriter: null, quality: null }),
      () => mods[1].buildCulturalPerceptionView({ cultural: null, strategy: null, copywriter: null, quality: null, policyAudit: null }),
      () => mods[2].buildConflictLongitudinalView({ memory: null }),
      () => mods[3].buildCognitiveWeightLongitudinalView({ memory: null }),
      () => mods[4].buildIdentityContinuityLongitudinalView({ memory: null }),
      () => mods[5].buildExecutiveGovernanceLongitudinalView({ memory: null }),
      () => mods[6].buildStrategicOutcomeLongitudinalView({ memory: null }),
      () => mods[7].buildCounterfactualCognitionLongitudinalView({ memory: null }),
      () => mods[8].buildCampaignLifecycleLongitudinalView({ memory: null }),
      () => mods[9].buildBranchActivationLongitudinalView({ memory: null }),
      () => mods[10].buildProjectionCalibrationLongitudinalView({ memory: null }),
      () => mods[11].buildOperatorCalibrationReconciliationLongitudinalView({ memory: null, operatorId: 'studio' }),
    ];
    const issues: string[] = [];
    calls.forEach((c, i) => {
      const a = JSON.stringify(c());
      const b = JSON.stringify(c());
      if (a !== b) issues.push(`call ${i}: non-deterministic`);
    });
    check('H · repeated view-builder calls produce byte-identical output',
      issues.length === 0,
      issues.length === 0 ? `${calls.length} view builders verified deterministic on null memory` : `issues: ${issues.join(', ')}`);
  }

  // ── I. memory files remain FIFO-capped (probe one heavy store)
  {
    // Pick the largest FIFO store to verify the cap is enforced
    // (cultural-perception, 96 observations).
    const mod = await import('../lib/culturalPerceptionMemory');
    const store = mod.createCulturalPerceptionMemoryStore(tmpDir);
    await store.reset();
    for (let i = 0; i < mod.CULTURAL_OBSERVATION_LIMIT + 20; i++) {
      await store.append({
        at: i, bannerId: `i-${i}`, formula: 'ENERGY', campaignMode: 'Documentary',
        layoutFamily: 'a', productRole: 'b', typographyDominance: 'c', focalPoint: 'd',
        emotionalFamily: 'fatigue', stateLabel: 'x', emotionalFrame: null, persuasionTone: null,
        pacing: 'quiet', restraint: 0.5, hookFingerprint: 'h', ctaStyle: 'bare', ctaBehavior: 'integrated',
        copyIntegrity: 7, trustSafety: 7, dignitySafety: 8,
        repetitionConcern: 3, ctaRestraint: 6, hebrewNaturalness: 8,
        policyBand: 'observe', outcomeVerdict: 'approve',
      });
    }
    const state = await store.read();
    check('I · FIFO cap enforced under append pressure (cultural perception)',
      state.observations.length === mod.CULTURAL_OBSERVATION_LIMIT &&
      state.totalObservations === mod.CULTURAL_OBSERVATION_LIMIT + 20,
      `observations=${state.observations.length}/${mod.CULTURAL_OBSERVATION_LIMIT} total=${state.totalObservations}`);
  }

  // ── J. no critic imports from observational layers ───────────
  {
    const FORBIDDEN = /from\s+['"][^'"]*(?:\/critic[^'"]*|tasteJudge|humanReaction|campaignDecision|perceptionCritic)['"]/i;
    const issues: string[] = [];
    for (const lib of OBSERVATIONAL_LIBS) {
      try {
        const src = await fs.readFile(path.resolve(process.cwd(), 'lib', `${lib}.ts`), 'utf8');
        if (FORBIDDEN.test(src)) issues.push(lib);
      } catch (e) {
        issues.push(`${lib}: missing source (${(e as Error).message.split('\n')[0]})`);
      }
    }
    check('J · no critic imports across observational libraries',
      issues.length === 0,
      issues.length === 0 ? `${OBSERVATIONAL_LIBS.length} libraries verified clean` : `disallowed: ${issues.join(', ')}`);
  }

  // ── K. no external fetch/spawn/network calls ─────────────────
  {
    const FORBIDDEN = /(fetch\(|XMLHttpRequest|http\.request|https\.request|from\s+['"](?:http|https|axios|undici)['"]|child_process|spawn\(|exec\()/;
    const issues: string[] = [];
    for (const lib of OBSERVATIONAL_LIBS) {
      try {
        const src = await fs.readFile(path.resolve(process.cwd(), 'lib', `${lib}.ts`), 'utf8');
        if (FORBIDDEN.test(src)) issues.push(lib);
      } catch {
        // Missing source already reported in J.
      }
    }
    check('K · no external network/spawn calls in observational libraries',
      issues.length === 0,
      issues.length === 0 ? `${OBSERVATIONAL_LIBS.length} libraries verified clean` : `disallowed: ${issues.join(', ')}`);
  }

  // ── L. no autonomous execution/mutation paths ────────────────
  {
    // (1) Pipeline must not import any observational layer.
    // (2) Any POST endpoint that mutates memory must be an explicit
    //     operator path — we whitelist the two known POSTs.
    const pipelineSrc = await fs.readFile(path.resolve(process.cwd(), 'src/core/pipeline.ts'), 'utf8');
    const pipelineLeaks = OBSERVATIONAL_LIBS.filter((lib) =>
      new RegExp(`from\\s+['"][^'"]*${lib}['"]`).test(pipelineSrc),
    );

    // POST endpoints — find all route files and inspect for POST exports.
    const allRoutes: string[] = [];
    const apiDir = path.resolve(process.cwd(), 'app/api');
    async function walk(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) await walk(full);
        else if (e.name === 'route.ts') allRoutes.push(full);
      }
    }
    await walk(apiDir);
    // All POST endpoints in the system MUST be operator-triggered
    // (i.e., never invoked by an internal loop). This whitelist
    // captures the full operator-facing POST surface area:
    //   - /api/generate            (POST = user pressed GENERATE)
    //   - /api/branch-activation   (POST = operator pressed Activate Branch)
    //   - /api/operator-confidence-preference (POST = operator moved a slider)
    //   - /api/banner/[id]/*       (POST = operator-triggered banner ops)
    //   - /api/cognition/*         (POST = operator-triggered cognition verbs)
    //   - /api/ingest              (POST = operator/external-signal ingestion)
    //   - /api/operator-creative-trial, /api/trial-outcome, /api/outcome,
    //     /api/pre-generation-stability, /api/refusal-narrative
    //     (POSTs requiring operatorId + operatorReason — every write is
    //      an explicit operator decision; the routes never auto-execute,
    //      never publish, never run the pipeline)
    //   - /api/asset-registry      (POST = operator approval gate for
    //     execution-layer asset records; requires operatorId +
    //     operatorReason; never publishes, never auto-approves)
    const ALLOWED_POST_ROUTES = new Set([
      'app/api/generate/route.ts',
      'app/api/branch-activation/route.ts',
      'app/api/operator-confidence-preference/route.ts',
      'app/api/banner/[id]/export/route.ts',
      'app/api/banner/[id]/signal/route.ts',
      'app/api/banner/[id]/simulate-signals/route.ts',
      'app/api/cognition/approve/route.ts',
      'app/api/cognition/consider/route.ts',
      'app/api/cognition/defer/route.ts',
      'app/api/cognition/draft/route.ts',
      'app/api/cognition/notice/route.ts',
      'app/api/cognition/observe/route.ts',
      'app/api/cognition/permit/route.ts',
      'app/api/cognition/prepare/route.ts',
      'app/api/cognition/propose/route.ts',
      'app/api/cognition/rest/route.ts',
      'app/api/cognition/restrain/route.ts',
      'app/api/cognition/review/route.ts',
      'app/api/cognition/revise/route.ts',
      'app/api/ingest/route.ts',
      // ── operator-supervised POSTs (every write requires operatorId + operatorReason) ──
      'app/api/operator-creative-trial/route.ts',
      'app/api/trial-outcome/route.ts',
      'app/api/outcome/route.ts',
      'app/api/pre-generation-stability/route.ts',
      'app/api/refusal-narrative/route.ts',
      'app/api/asset-registry/route.ts',
      // ── generation connector layer (operator-supervised POSTs;
      //    the routes NEVER call a provider, NEVER publish) ──
      'app/api/generation-queue/route.ts',
      'app/api/generation-result/route.ts',
      // ── creative performance layer (operator-supervised POSTs;
      //    operator manually registers publications + manually
      //    logs performance metrics; routes NEVER publish, NEVER
      //    fetch from platforms) ──
      'app/api/publication-registry/route.ts',
      'app/api/performance/route.ts',
      // ── campaign operating system (operator-supervised POSTs;
      //    operator saves + transitions plan status; the route
      //    NEVER publishes, NEVER auto-spends, NEVER auto-approves) ──
      'app/api/campaign-planner/route.ts',
      // ── business intelligence layer (operator-supervised POST;
      //    operator manually logs journey events; the route NEVER
      //    fetches from analytics / CRM / payments / ad APIs, NEVER
      //    triggers outbound actions) ──
      'app/api/customer-journey/route.ts',
      // ── operations layer (operator-supervised POSTs; the routes
      //    NEVER publish, NEVER spend, NEVER auto-create entities,
      //    NEVER call external APIs) ──
      'app/api/workspace/route.ts',
      'app/api/team/route.ts',
      'app/api/task/route.ts',
      'app/api/knowledge/route.ts',
      // ── execution agent layer (operator-supervised POST; the
      //    agents NEVER publish, NEVER spend, NEVER call external
      //    APIs, NEVER approve their own runs) ──
      'app/api/agent/route.ts',
      // ── multi-tenant SaaS substrate (operator-supervised POST;
      //    the route NEVER auto-creates organizations, NEVER
      //    auto-grants memberships, NEVER charges, NEVER calls a
      //    billing provider, NEVER calls external APIs) ──
      'app/api/organization/route.ts',
      // ── productization layer (operator-supervised POST; the
      //    wizard NEVER auto-advances steps, NEVER auto-creates
      //    downstream entities, NEVER auto-completes the session,
      //    NEVER calls external APIs) ──
      'app/api/onboarding/route.ts',
      // ── growth operating system (operator-supervised POST; the
      //    activation NEVER publishes, NEVER launches a campaign,
      //    NEVER spends money, NEVER calls external APIs) ──
      'app/api/workspace-activation/route.ts',
      // ── workflow orchestration layer (operator-supervised POST;
      //    the orchestrator NEVER auto-advances, NEVER auto-publishes,
      //    NEVER spends money, NEVER calls external APIs) ──
      'app/api/workflows/route.ts',
      'app/api/workspace-quick-start/route.ts',
      // ── friction-reduction surfaces (operator-supervised POSTs;
      //    pure adapters above existing memory stores; NEVER publish,
      //    NEVER spend money, NEVER call external APIs) ──
      'app/api/brand/route.ts',
      'app/api/product/route.ts',
      'app/api/fast-start/route.ts',
      'app/api/simple-performance/route.ts',
      // ── authentication layer (operator-supervised POSTs; NEVER
      //    sends email, NEVER calls external APIs; bootstrap is
      //    env-var-seeded and idempotent) ──
      'app/api/auth/register/route.ts',
      'app/api/auth/login/route.ts',
      'app/api/auth/logout/route.ts',
      'app/api/auth/bootstrap/route.ts',
    ]);
    const unexpectedPostRoutes: string[] = [];
    for (const route of allRoutes) {
      const src = await fs.readFile(route, 'utf8');
      if (/export\s+async\s+function\s+POST\b/.test(src)) {
        const rel = path.relative(process.cwd(), route);
        if (!ALLOWED_POST_ROUTES.has(rel)) unexpectedPostRoutes.push(rel);
      }
    }

    check('L · no autonomous mutation paths — pipeline isolated + only whitelisted POSTs exist',
      pipelineLeaks.length === 0 && unexpectedPostRoutes.length === 0,
      `pipelineLeaks=${pipelineLeaks.length} unexpectedPostRoutes=${unexpectedPostRoutes.length}` +
      (pipelineLeaks.length === 0 && unexpectedPostRoutes.length === 0
        ? ` (whitelist: ${[...ALLOWED_POST_ROUTES].length} POSTs)`
        : ` issues: ${pipelineLeaks.join(',')} ${unexpectedPostRoutes.join(',')}`));
  }

  // ── Cleanup ──────────────────────────────────────────────────
  try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
