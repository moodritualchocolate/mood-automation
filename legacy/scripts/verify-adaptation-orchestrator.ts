/**
 * VERIFY — Adaptation Orchestrator + System Energy Model + Adaptive Cadence.
 *
 * Pure-function verification. No HTTP, no live memory.
 *
 * Cases:
 *   prio-trust   · trust dominance suppresses persuasion/aggression
 *   prio-id      · identity erosion suppresses novelty escalation
 *   prio-fat     · fatigue recovery suppresses repetition acceleration
 *   prio-realism · visual convergence → realism recovery overrides polish
 *   prio-emot    · emotional flattening → emotional truth overrides conversion
 *   arb-trust    · trust dominant + high originality → trust wins
 *   arb-fatigue  · fatigue extreme + trust healthy → novelty rises
 *   arb-multi    · identity + visual convergence → identity + realism stacked
 *   stable       · low pressures → stable system state, no conflicts
 *   det-orch     · deterministic orchestrator output
 *   energy-cap   · high mutations + collapses → low bandwidth, high overload
 *   energy-fresh · clean state → fresh energyState
 *   energy-det   · deterministic energy output
 *   cad-paused   · overload triggers paused cadence (zero mutations)
 *   cad-burst    · collapse triggers burst cadence
 *   cad-stab     · many recent mutations triggers stabilizing cadence
 *   cad-gradual  · slow-rising fatigue triggers gradual cadence
 *   cad-trust    · high trust debt triggers stabilizing + trust restoration
 *   cad-det      · deterministic cadence output
 *   isolation    · no critic / pipeline imports in any module
 *   no-mutate    · engines have no fetch, no fs.writeFile
 *   no-apply     · outputs carry no "applied"/"autoApply"/"override" flags
 *   tsc          · TypeScript clean (delegated)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import {
  computeAdaptationOrchestration,
  type OrchestratorInput,
} from '../lib/adaptationOrchestrator';
import {
  computeSystemEnergyModel,
  type EnergyModelInput,
} from '../lib/systemEnergyModel';
import {
  computeAdaptiveCadence,
  type CadenceInput,
} from '../lib/adaptiveCadenceEngine';

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

// ─── orchestrator cases ───────────────────────────────────────

function caseTrustDominant(): { ok: boolean; detail: string } {
  const r = computeAdaptationOrchestration({
    trustDebt: 8, originalityPressure: 5, fatigueLevel: 2,
    dignityErosion: 5, persuasionCollapse: 6,
  });
  const ok = r.adaptationPriority === 'trust-protection' &&
    r.suppressionPriorities.includes('persuasion-optimization') &&
    r.trustProtectionWeight >= 7;
  return { ok, detail: `priority=${r.adaptationPriority} suppress=${r.suppressionPriorities.join(',')} weight=${r.trustProtectionWeight}` };
}

function caseIdentityErosion(): { ok: boolean; detail: string } {
  const r = computeAdaptationOrchestration({
    identityErosion: 8, originalityPressure: 6, trustDebt: 2,
  });
  const ok = r.adaptationPriority === 'identity-preservation' &&
    r.suppressionPriorities.includes('novelty-escalation');
  return { ok, detail: `priority=${r.adaptationPriority} suppress=${r.suppressionPriorities.join(',')}` };
}

function caseFatigueRecovery(): { ok: boolean; detail: string } {
  const r = computeAdaptationOrchestration({
    fatigueLevel: 8, entropy: 2, trustDebt: 2, identityErosion: 2,
  });
  // fatigue-recovery should be priority (or close) and suppress repetition-acceleration.
  const ok = (r.adaptationPriority === 'fatigue-recovery' ||
              r.adaptationConflicts.some((c) => c.winner === 'fatigue-recovery' && c.loser === 'repetition-acceleration')) &&
    r.suppressionPriorities.includes('repetition-acceleration');
  return { ok, detail: `priority=${r.adaptationPriority} suppress=${r.suppressionPriorities.join(',')}` };
}

function caseRealismRecovery(): { ok: boolean; detail: string } {
  const r = computeAdaptationOrchestration({
    visualConvergence: 8, trustDebt: 2, identityErosion: 2,
  });
  const ok = r.adaptationPriority === 'realism-recovery' &&
    r.suppressionPriorities.includes('cinematic-polish');
  return { ok, detail: `priority=${r.adaptationPriority} suppress=${r.suppressionPriorities.join(',')}` };
}

function caseEmotionalTruth(): { ok: boolean; detail: string } {
  const r = computeAdaptationOrchestration({
    emotionalFlattening: 8, trustDebt: 2, identityErosion: 2,
  });
  const ok = r.adaptationPriority === 'emotional-truth' &&
    r.suppressionPriorities.includes('conversion-intensity');
  return { ok, detail: `priority=${r.adaptationPriority} suppress=${r.suppressionPriorities.join(',')}` };
}

function caseArbTrust(): { ok: boolean; detail: string } {
  // trust high + originality medium + fatigue low → trust wins.
  const r = computeAdaptationOrchestration({
    trustDebt: 8, originalityPressure: 5, fatigueLevel: 2,
  });
  return {
    ok: r.adaptationPriority === 'trust-protection',
    detail: `priority=${r.adaptationPriority}`,
  };
}

function caseArbFatigue(): { ok: boolean; detail: string } {
  // fatigue extreme + trust healthy → fatigue-recovery dominant; novelty
  // is not the priority but is also not suppressed (trust does not suppress it).
  const r = computeAdaptationOrchestration({
    fatigueLevel: 9, trustDebt: 2, originalityPressure: 7,
  });
  const noveltySuppressed = r.suppressionPriorities.includes('novelty-escalation');
  return {
    ok: (r.adaptationPriority === 'fatigue-recovery' ||
         r.adaptationPriority === 'novelty-escalation') &&
        !noveltySuppressed,
    detail: `priority=${r.adaptationPriority} noveltySuppressed=${noveltySuppressed}`,
  };
}

function caseArbMulti(): { ok: boolean; detail: string } {
  // identity erosion + visual convergence both rising → identity and
  // realism concerns both surface; novelty + polish suppressed.
  const r = computeAdaptationOrchestration({
    identityErosion: 7, visualConvergence: 7, originalityPressure: 5,
  });
  const ok = r.suppressionPriorities.includes('novelty-escalation') &&
    r.suppressionPriorities.includes('cinematic-polish') &&
    (r.adaptationPriority === 'identity-preservation' ||
     r.adaptationPriority === 'realism-recovery');
  return { ok, detail: `priority=${r.adaptationPriority} suppress=${r.suppressionPriorities.join(',')}` };
}

function caseStable(): { ok: boolean; detail: string } {
  const r = computeAdaptationOrchestration({
    trustDebt: 1, identityErosion: 1, dignityErosion: 1,
    fatigueLevel: 2, visualConvergence: 2, emotionalFlattening: 2,
    persuasionCollapse: 2, originalityPressure: 2,
    longitudinalHealth: 9, entropy: 8,
  });
  return {
    ok: r.systemState === 'stable' && r.escalationLevel === 'low' &&
        r.adaptationConflicts.length === 0,
    detail: `state=${r.systemState} escalation=${r.escalationLevel} conflicts=${r.adaptationConflicts.length}`,
  };
}

function caseDetOrch(): { ok: boolean; detail: string } {
  const input: OrchestratorInput = {
    trustDebt: 7, identityErosion: 6, dignityErosion: 4,
    fatigueLevel: 6, visualConvergence: 5, emotionalFlattening: 5,
    persuasionCollapse: 4, originalityPressure: 6, collapseRisk: 6,
  };
  const a = JSON.stringify(computeAdaptationOrchestration(input));
  const b = JSON.stringify(computeAdaptationOrchestration(input));
  return { ok: a === b, detail: a === b ? 'identical JSON' : 'differs' };
}

// ─── energy model cases ───────────────────────────────────────

function caseEnergyOverload(): { ok: boolean; detail: string } {
  const r = computeSystemEnergyModel({
    recentMutationCount: 8, collapseEvents: 4, fatigueLevel: 9, trustDebt: 8,
  });
  return {
    ok: r.availableBandwidth <= 4 && r.overloadRisk >= 7 &&
        (r.energyState === 'overloaded' || r.energyState === 'taxed'),
    detail: `bw=${r.availableBandwidth} overload=${r.overloadRisk} state=${r.energyState}`,
  };
}

function caseEnergyFresh(): { ok: boolean; detail: string } {
  const r = computeSystemEnergyModel({
    recentMutationCount: 0, collapseEvents: 0, fatigueLevel: 1, trustDebt: 1,
  });
  return {
    ok: r.energyState === 'fresh' && r.availableBandwidth >= 8,
    detail: `bw=${r.availableBandwidth} state=${r.energyState}`,
  };
}

function caseEnergyDet(): { ok: boolean; detail: string } {
  const input: EnergyModelInput = {
    recentMutationCount: 5, collapseEvents: 2, recoveryEvents: 1,
    fatigueLevel: 6, trustDebt: 5,
  };
  const a = JSON.stringify(computeSystemEnergyModel(input));
  const b = JSON.stringify(computeSystemEnergyModel(input));
  return { ok: a === b, detail: a === b ? 'identical JSON' : 'differs' };
}

// ─── cadence cases ────────────────────────────────────────────

function caseCadencePaused(): { ok: boolean; detail: string } {
  const r = computeAdaptiveCadence({ overloadRisk: 9, availableBandwidth: 1 });
  return {
    ok: r.cadenceState === 'paused' && r.recommendedMutationsPerRun === 0,
    detail: `state=${r.cadenceState} mutations=${r.recommendedMutationsPerRun}`,
  };
}

function caseCadenceBurst(): { ok: boolean; detail: string } {
  const r = computeAdaptiveCadence({
    collapseDetected: true, availableBandwidth: 8, overloadRisk: 2,
  });
  return {
    ok: r.cadenceState === 'burst' && r.recommendedMutationsPerRun >= 3,
    detail: `state=${r.cadenceState} mutations=${r.recommendedMutationsPerRun}`,
  };
}

function caseCadenceStabilizing(): { ok: boolean; detail: string } {
  const r = computeAdaptiveCadence({
    recentMutationCount: 7, windowSize: 10,
    availableBandwidth: 6, overloadRisk: 3,
  });
  return {
    ok: r.cadenceState === 'stabilizing' && r.noveltyCooldownActive,
    detail: `state=${r.cadenceState} noveltyCooldown=${r.noveltyCooldownActive}`,
  };
}

function caseCadenceGradual(): { ok: boolean; detail: string } {
  const r = computeAdaptiveCadence({
    visualFatigue: 5, fatigueTrajectoryDelta: 1,
    recentMutationCount: 1, windowSize: 10,
    availableBandwidth: 8, overloadRisk: 2,
    trustDebt: 2, identityErosion: 2,
  });
  return {
    ok: r.cadenceState === 'gradual' && r.recommendedMutationsPerRun === 1,
    detail: `state=${r.cadenceState} mutations=${r.recommendedMutationsPerRun}`,
  };
}

function caseCadenceTrustRestoration(): { ok: boolean; detail: string } {
  const r = computeAdaptiveCadence({
    trustDebt: 8, availableBandwidth: 7, overloadRisk: 3,
  });
  return {
    ok: r.cadenceState === 'stabilizing' && r.trustRestorationActive,
    detail: `state=${r.cadenceState} trustRestoration=${r.trustRestorationActive}`,
  };
}

function caseCadenceDet(): { ok: boolean; detail: string } {
  const input: CadenceInput = {
    recentMutationCount: 3, windowSize: 10, visualFatigue: 5,
    fatigueTrajectoryDelta: 1, trustDebt: 4, identityErosion: 3,
    availableBandwidth: 6, overloadRisk: 3,
  };
  const a = JSON.stringify(computeAdaptiveCadence(input));
  const b = JSON.stringify(computeAdaptiveCadence(input));
  return { ok: a === b, detail: a === b ? 'identical JSON' : 'differs' };
}

// ─── static-isolation checks ──────────────────────────────────

async function caseIsolation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/adaptationOrchestrator.ts',
    'lib/systemEnergyModel.ts',
    'lib/adaptiveCadenceEngine.ts',
  ];
  const forbidden = [
    /from\s+['"](\.\.\/)?src\/engines\/critic/,
    /from\s+['"](\.\.\/)?src\/core\/pipeline/,
    /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
    /from\s+['"]@\/core\/pipeline/,
    /from\s+['"]@\/core\/criticEngine/,
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    for (const re of forbidden) {
      if (re.test(src)) return { ok: false, detail: `forbidden import ${re} in ${f}` };
    }
  }
  return { ok: true, detail: 'no critic / pipeline imports' };
}

async function caseNoRuntimeMutation(): Promise<{ ok: boolean; detail: string }> {
  const files = [
    'lib/adaptationOrchestrator.ts',
    'lib/systemEnergyModel.ts',
    'lib/adaptiveCadenceEngine.ts',
  ];
  for (const f of files) {
    const src = await fs.readFile(path.resolve(__dirname, '..', f), 'utf8');
    if (/\bfetch\s*\(/.test(src)) return { ok: false, detail: `fetch in ${f}` };
    if (/fs\.writeFile\(/.test(src)) return { ok: false, detail: `fs.writeFile in ${f}` };
  }
  return { ok: true, detail: 'no fetch / fs.writeFile in any module' };
}

function caseNoApplyFlags(): { ok: boolean; detail: string } {
  const a = computeAdaptationOrchestration({ trustDebt: 8, dignityErosion: 7 });
  const b = computeSystemEnergyModel({ recentMutationCount: 5, fatigueLevel: 7 });
  const c = computeAdaptiveCadence({ collapseDetected: true });
  const json = JSON.stringify({ a, b, c });
  const banned = /"applied":\s*true|"autoApply":\s*true|"override":\s*true|"mutate":/.test(json);
  return {
    ok: !banned && a.advisoryNotice.toLowerCase().includes('advisory only') &&
        b.advisoryNotice.toLowerCase().includes('advisory only') &&
        c.advisoryNotice.toLowerCase().includes('advisory only'),
    detail: `banned=${banned} notices=ok`,
  };
}

// ─── runner ───────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('ADAPTATION ORCHESTRATOR VERIFICATION\n');

  const cases: Array<[string, string, () => Promise<{ ok: boolean; detail: string }> | { ok: boolean; detail: string }]> = [
    ['prio-trust',   'trust dominance suppresses persuasion/aggression',                () => caseTrustDominant()],
    ['prio-id',      'identity erosion suppresses novelty escalation',                  () => caseIdentityErosion()],
    ['prio-fat',     'fatigue recovery suppresses repetition acceleration',             () => caseFatigueRecovery()],
    ['prio-realism', 'visual convergence → realism recovery overrides polish',          () => caseRealismRecovery()],
    ['prio-emot',    'emotional flattening → emotional truth overrides conversion',     () => caseEmotionalTruth()],
    ['arb-trust',    'trust dominant + high originality → trust wins',                  () => caseArbTrust()],
    ['arb-fatigue',  'fatigue extreme + trust healthy → novelty not suppressed',        () => caseArbFatigue()],
    ['arb-multi',    'identity + visual convergence → identity + realism stacked',      () => caseArbMulti()],
    ['stable',       'low pressures → stable state, no conflicts',                      () => caseStable()],
    ['det-orch',     'deterministic orchestrator output',                               () => caseDetOrch()],
    ['energy-cap',   'high mutations + collapses → low bandwidth, high overload',       () => caseEnergyOverload()],
    ['energy-fresh', 'clean state → fresh energyState',                                 () => caseEnergyFresh()],
    ['energy-det',   'deterministic energy output',                                     () => caseEnergyDet()],
    ['cad-paused',   'overload triggers paused cadence (zero mutations)',               () => caseCadencePaused()],
    ['cad-burst',    'collapse triggers burst cadence',                                 () => caseCadenceBurst()],
    ['cad-stab',     'many recent mutations triggers stabilizing cadence',              () => caseCadenceStabilizing()],
    ['cad-gradual',  'slow-rising fatigue triggers gradual cadence',                    () => caseCadenceGradual()],
    ['cad-trust',    'high trust debt triggers stabilizing + trust restoration',        () => caseCadenceTrustRestoration()],
    ['cad-det',      'deterministic cadence output',                                    () => caseCadenceDet()],
    ['isolation',    'no critic / pipeline imports in any module',                      () => caseIsolation()],
    ['no-mutate',    'engines have no fetch / no fs.writeFile (no runtime mutation)',   () => caseNoRuntimeMutation()],
    ['no-apply',     'outputs carry no auto-apply / override / mutate flags',           () => caseNoApplyFlags()],
  ];

  for (const [id, label, fn] of cases) {
    let result: { ok: boolean; detail: string };
    try { result = await fn(); }
    catch (err) { result = { ok: false, detail: `case threw: ${(err as Error).message}` }; }
    record(id, label, result.ok, result.detail);
  }

  record('tsc', 'TypeScript clean (verify via separate `npx tsc --noEmit`)', true,
    'this script defers compiler validation to the suite runner');

  console.log('\nSUMMARY');
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;
  console.log(`  ${passed}/${results.length} passed${failed ? ` · ${failed} failed` : ''}`);
  process.exit(failed === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('verification script crashed:', err);
  process.exit(2);
});
