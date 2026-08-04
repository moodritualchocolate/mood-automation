/**
 * scripts/test-os-genesis.ts
 *
 * WAVE 8 — Operating System Genesis verification (Phases 91–110).
 *
 * Proves the living organism now runs on a cognitive OPERATING
 * SYSTEM: a kernel runs the loop, a scheduler allocates cognition,
 * interrupts pre-empt it, a directive engine governs the tick, the
 * runtime heals itself, and the persistent OS state carries posture,
 * season, and uptime across runs.
 *
 * Run with:  npx tsx scripts/test-os-genesis.ts
 */

import type { OrganismCoreReading } from '@lib/persistentOrganismCore';
import type { ExistentialRiskReading } from '@lib/existentialRiskLayer';
import type { ComplexityRegulationReading } from '@lib/internalComplexityRegulation';
import type { CivilizationFatigueReading } from '@lib/civilizationFatigueMonitoring';
import type { IdentityStressReading } from '@lib/identityStressTesting';
import type { LongHorizonPredictionReading } from '@lib/longHorizonPrediction';
import {
  createOSRuntimeStore, createInitialOS, evolveOSFromTick, readOperatingSystemCore,
} from '@lib/operatingSystemCore';
import { readCognitiveKernel } from '@lib/cognitiveKernel';
import { readProcessScheduler } from '@lib/processScheduler';
import { readInterruptArchitecture } from '@lib/interruptArchitecture';
import { readStrategicTaskQueue } from '@lib/strategicTaskQueue';
import { readRuntimeResourceAllocation } from '@lib/runtimeResourceAllocation';
import { readActiveCognitionGraph } from '@lib/activeCognitionGraph';
import { readDirectiveEngine } from '@lib/directiveEngine';
import { readAutonomousRuntimeLoops } from '@lib/autonomousRuntimeLoops';
import { readStrategicPauseInfrastructure } from '@lib/strategicPauseInfrastructure';
import { readKernelHealthMonitor } from '@lib/kernelHealthMonitor';
import { readMemoryPressureManagement } from '@lib/memoryPressureManagement';
import { readMultiHorizonPlanning } from '@lib/multiHorizonPlanning';
import { readRecursiveReflectionEngine } from '@lib/recursiveReflectionEngine';
import { readExecutiveArbitrationCourt } from '@lib/executiveArbitrationCourt';
import { readRuntimeIdentityEnforcement } from '@lib/runtimeIdentityEnforcement';
import { readDynamicStrategicSeasons } from '@lib/dynamicStrategicSeasons';
import { readCognitiveDependencyMapping } from '@lib/cognitiveDependencyMapping';
import { readAutonomousRuntimeStabilization } from '@lib/autonomousRuntimeStabilization';
import { readPersistentExecutiveState } from '@lib/persistentExecutiveState';

function organism(o: Partial<OrganismCoreReading> = {}): OrganismCoreReading {
  return {
    vitality: 8, organism_is_adapting: true, organism_is_addicted: false,
    should_rest: false, condition: 'healthy', organism_statement: 'adapting', notes: [],
    ...o,
  };
}
function existential(o: Partial<ExistentialRiskReading> = {}): ExistentialRiskReading {
  return {
    existential_risk: 1, organism_at_risk: false, risk_signals: [], dominant_risk: null,
    survival_imperative: 'none', notes: [], ...o,
  };
}
function complexity(o: Partial<ComplexityRegulationReading> = {}): ComplexityRegulationReading {
  return { complexity_load: 3, over_thinking: false, regulation: 'within bounds', notes: [], ...o };
}
function fatigue(o: Partial<CivilizationFatigueReading> = {}): CivilizationFatigueReading {
  return { civilization_fatigue: 3, needs_recovery: false, fatigue_source: 'none', notes: [], ...o };
}
function identityStress(o: Partial<IdentityStressReading> = {}): IdentityStressReading {
  return { stress_applied: 3, identity_resilience: 8, identity_holds: true, failure_mode: null, notes: [], ...o };
}
function longHorizon(o: Partial<LongHorizonPredictionReading> = {}): LongHorizonPredictionReading {
  return {
    predicted_season: 'a-stable-season', season_strategy: 'grow steadily',
    horizon_confidence: 6, notes: [], ...o,
  };
}

async function main() {
  console.log('\n WAVE 8 — Operating System Genesis verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── the kernel boots, runs, and enters protected mode ───────────
  const booting = readCognitiveKernel({ organism: organism(), existentialRisk: existential(), complexity: complexity(), uptime: 0 });
  const running = readCognitiveKernel({ organism: organism(), existentialRisk: existential(), complexity: complexity(), uptime: 5 });
  const protectedK = readCognitiveKernel({
    organism: organism({ condition: 'at-risk', vitality: 3 }),
    existentialRisk: existential({ existential_risk: 9, organism_at_risk: true }),
    complexity: complexity(), uptime: 5,
  });
  checks.push([
    'the cognitive kernel boots, runs, and enters protected mode under threat',
    booting.kernel_state === 'booting' && running.kernel_state === 'running' &&
      protectedK.kernel_state === 'protected-mode',
    `uptime 0 → "${booting.kernel_state}"; uptime 5 healthy → "${running.kernel_state}"; under existential risk → "${protectedK.kernel_state}"`,
  ]);

  // ── the OS runtime state persists and survives a restart ────────
  const store = createOSRuntimeStore();
  await store.reset();
  let os = createInitialOS();
  os = evolveOSFromTick(os, {
    coordination: 8, directive: 'publish', posture: 'coordinated-operation',
    season: 'growth', interrupts: 1, fragmented: false,
  });
  await store.save(os);
  (globalThis as { __moodOS?: unknown }).__moodOS = undefined;
  const reloaded = await store.read();
  checks.push([
    'the OS runtime state persists uptime, season, and posture across a restart',
    reloaded.uptime === 1 && reloaded.currentSeason === 'growth' && reloaded.seasonAge === 0,
    `reloaded uptime ${reloaded.uptime} tick, season "${reloaded.currentSeason}"`,
  ]);
  await store.reset();

  // ── the scheduler never starves identity-defense under threat ───
  const survivalSchedule = readProcessScheduler({
    kernel: running, energyReserves: 2, fatigueNeedsRecovery: true, existentialRisk: 9,
  });
  const idDefense = survivalSchedule.processes.find((p) => p.name === 'identity-defense')!;
  checks.push([
    'the process scheduler starves discretionary work but never identity-defense',
    idDefense.window !== 'starved' && survivalSchedule.starved_count > 0,
    `under survival pressure: identity-defense "${idDefense.window}", ${survivalSchedule.starved_count} process(es) starved`,
  ]);

  // ── interrupts are raised and the highest pre-empts ─────────────
  const stormInterrupts = readInterruptArchitecture({
    worldShiftRate: 8, modelLagging: true, fatigueNeedsRecovery: true,
    identityFailing: true, ideologicalMutation: true, environmentHostile: true,
    organismAtRisk: true, contradictionCount: 5, memeticInfection: true,
  });
  const quietInterrupts = readInterruptArchitecture({
    worldShiftRate: 1, modelLagging: false, fatigueNeedsRecovery: false,
    identityFailing: false, ideologicalMutation: false, environmentHostile: false,
    organismAtRisk: false, contradictionCount: 0, memeticInfection: false,
  });
  checks.push([
    'the interrupt architecture raises interrupts and the highest pre-empts cognition',
    stormInterrupts.interrupts.length >= 5 && stormInterrupts.interrupt_demands_handling &&
      stormInterrupts.highest!.kind === 'environmental-emergency' &&
      quietInterrupts.interrupts.length === 0,
    `storm → ${stormInterrupts.interrupts.length} interrupt(s), highest "${stormInterrupts.highest!.kind}"; calm → ${quietInterrupts.interrupts.length}`,
  ]);

  // ── the strategic task queue reprioritises on a severe interrupt ─
  const calmSchedule = readProcessScheduler({
    kernel: running, energyReserves: 7, fatigueNeedsRecovery: false, existentialRisk: 2,
  });
  const queue = readStrategicTaskQueue({
    scheduler: calmSchedule, interrupts: stormInterrupts, energyReserves: 7,
  });
  checks.push([
    'the strategic task queue reprioritises when an interrupt demands handling',
    queue.reprioritized && (queue.next_task ?? '').startsWith('service interrupt'),
    `queue depth ${queue.queue_depth} — next "${queue.next_task}", reprioritised=${queue.reprioritized}`,
  ]);

  // ── resource allocation reports an over-subscribed runtime ───────
  const overSubscribed = readRuntimeResourceAllocation({
    kernel: protectedK, energyReserves: 2, complexityLoad: 9, deferredAndStarved: 5,
  });
  const headroom = readRuntimeResourceAllocation({
    kernel: running, energyReserves: 9, complexityLoad: 2, deferredAndStarved: 1,
  });
  checks.push([
    'runtime resource allocation detects an over-subscribed runtime',
    overSubscribed.over_subscribed && !headroom.over_subscribed,
    `depleted + throttled → over-subscribed (scarcest "${overSubscribed.scarcest_resource}"); healthy → has headroom`,
  ]);

  // ── the directive engine governs the tick ───────────────────────
  const dirAddicted = readDirectiveEngine({
    kernel: running, interrupts: quietInterrupts,
    organism: organism({ organism_is_addicted: true }),
    existentialRisk: existential(), silenceChosen: false,
  });
  const dirPublish = readDirectiveEngine({
    kernel: running, interrupts: quietInterrupts, organism: organism(),
    existentialRisk: existential(), silenceChosen: false,
  });
  const dirHibernate = readDirectiveEngine({
    kernel: protectedK, interrupts: stormInterrupts,
    organism: organism({ should_rest: true }),
    existentialRisk: existential({ existential_risk: 9, organism_at_risk: true }),
    silenceChosen: false,
  });
  checks.push([
    'the directive engine protects identity over output and ships only when clear',
    dirAddicted.directive === 'protect-identity' && dirAddicted.directive_withholds_output &&
      dirPublish.directive === 'publish' && !dirPublish.directive_withholds_output &&
      dirHibernate.directive === 'hibernate',
    `addicted → "${dirAddicted.directive}"; clear runtime → "${dirPublish.directive}"; existential risk → "${dirHibernate.directive}"`,
  ]);

  // ── the kernel health monitor names the runtime's failure modes ─
  const sickHealth = readKernelHealthMonitor({
    complexity: complexity({ complexity_load: 9, over_thinking: true }),
    organism: organism({ organism_is_addicted: true, vitality: 3 }),
    fatigue: fatigue({ needs_recovery: true }),
    identityStress: identityStress({ identity_holds: false }),
    civilizationDecaying: true,
  });
  const wellHealth = readKernelHealthMonitor({
    complexity: complexity(), organism: organism(), fatigue: fatigue(),
    identityStress: identityStress(), civilizationDecaying: false,
  });
  checks.push([
    'the kernel health monitor names every active runtime failure mode',
    sickHealth.failure_modes.length === 5 && sickHealth.overall_health < 4 &&
      wellHealth.failure_modes.length === 0,
    `failing runtime → ${sickHealth.failure_modes.length} failure modes (health ${sickHealth.overall_health}/10); healthy → 0`,
  ]);

  // ── memory pressure management acts under load ──────────────────
  const heavyMemory = readMemoryPressureManagement({
    memoryFootprint: 80, complexityLoad: 9, organismAge: 40, relevanceSpike: false,
  });
  const lightMemory = readMemoryPressureManagement({
    memoryFootprint: 2, complexityLoad: 2, organismAge: 1, relevanceSpike: false,
  });
  checks.push([
    'memory pressure management archives or forgets under load and holds when light',
    (heavyMemory.action === 'archive' || heavyMemory.action === 'strategic-forget') &&
      lightMemory.action === 'hold',
    `heavy footprint → "${heavyMemory.action}" (${heavyMemory.memory_pressure}/10); light → "${lightMemory.action}"`,
  ]);

  // ── the executive arbitration court never lets engagement win ────
  const arbEngagement = readExecutiveArbitrationCourt({
    wantsGrowth: false, optimizationCorrupts: false, existentialRisk: 1,
    identityFailing: false, silenceChosen: false, engagementPull: 10,
  });
  const arbSurvival = readExecutiveArbitrationCourt({
    wantsGrowth: false, optimizationCorrupts: false, existentialRisk: 9,
    identityFailing: false, silenceChosen: false, engagementPull: 3,
  });
  checks.push([
    'the executive arbitration court refuses to let engagement govern alone',
    arbEngagement.arbitrated_winner !== 'engagement' && arbSurvival.arbitrated_winner === 'survival',
    `engagement topped the claims → court ruled for "${arbEngagement.arbitrated_winner}"; existential risk → "${arbSurvival.arbitrated_winner}"`,
  ]);

  // ── runtime identity enforcement blocks violations ──────────────
  const enforceBreach = readRuntimeIdentityEnforcement({
    ideologicalMutation: true, identityFailing: true, governanceBlocks: true,
    arbitratedWinner: 'engagement',
  });
  const enforceClean = readRuntimeIdentityEnforcement({
    ideologicalMutation: false, identityFailing: false, governanceBlocks: false,
    arbitratedWinner: 'identity',
  });
  checks.push([
    'runtime identity enforcement blocks identity violations across the runtime',
    enforceBreach.violations_blocked.length === 3 && !enforceBreach.identity_enforced &&
      enforceClean.identity_enforced,
    `three violations + engagement governing → breach; clean runtime + identity governing → enforced`,
  ]);

  // ── dynamic strategic seasons change when reality calls ─────────
  const expansionSeason = readDynamicStrategicSeasons({
    currentSeason: 'growth', seasonAge: 5, longHorizon: longHorizon(),
    health: wellHealth, directive: dirPublish, organismAtRisk: false, canExpand: true,
  });
  const hibernationSeason = readDynamicStrategicSeasons({
    currentSeason: 'growth', seasonAge: 3, longHorizon: longHorizon(),
    health: wellHealth, directive: dirPublish, organismAtRisk: true, canExpand: false,
  });
  checks.push([
    'dynamic strategic seasons change the runtime\'s mode when reality calls',
    expansionSeason.season === 'expansion' && expansionSeason.season_changed &&
      hibernationSeason.season === 'hibernation',
    `stable + can-expand → "${expansionSeason.season}" (changed); organism at risk → "${hibernationSeason.season}"`,
  ]);

  // ── strategic pause infrastructure enters a system-wide pause ────
  const deepPause = readStrategicPauseInfrastructure({
    directive: dirHibernate, fatigueNeedsRecovery: true, shouldRest: true, organismAtRisk: true,
  });
  const noPause = readStrategicPauseInfrastructure({
    directive: dirPublish, fatigueNeedsRecovery: false, shouldRest: false, organismAtRisk: false,
  });
  checks.push([
    'strategic pause infrastructure enters a genuine system-wide pause',
    deepPause.in_deep_pause && noPause.pause_mode === 'none',
    `hibernate directive → "${deepPause.pause_mode}" (depth ${deepPause.pause_depth}/10); clear runtime → "${noPause.pause_mode}"`,
  ]);

  // ── autonomous runtime stabilization heals an unstable runtime ──
  const emergency = readAutonomousRuntimeStabilization({
    health: sickHealth, kernel: protectedK, fragmentationStreak: 4,
    runtimeDrift: true, graphTangled: true,
  });
  const stableRuntime = readAutonomousRuntimeStabilization({
    health: wellHealth, kernel: running, fragmentationStreak: 0,
    runtimeDrift: false, graphTangled: false,
  });
  checks.push([
    'autonomous runtime stabilization emergency-stabilises an unstable runtime',
    emergency.stabilization_action === 'emergency-stabilize' && !emergency.runtime_stable &&
      stableRuntime.stabilization_action === 'none' && stableRuntime.runtime_stable,
    `unstable runtime → "${emergency.stabilization_action}"; stable runtime → "${stableRuntime.stabilization_action}"`,
  ]);

  // ── recursive reflection knows when the structure is failing ────
  const reflWell = readRecursiveReflectionEngine({ kernel: running, health: wellHealth });
  const reflBad = readRecursiveReflectionEngine({ kernel: protectedK, health: sickHealth });
  checks.push([
    'the recursive reflection engine knows when its own structure is operating well',
    reflWell.operating_well && !reflBad.operating_well,
    `healthy runtime → operating well; failing runtime → "${reflBad.structural_insight}"`,
  ]);

  // ── multi-horizon planning detects a horizon conflict ───────────
  const horizonConflict = readMultiHorizonPlanning({
    longHorizon: longHorizon(),
    existentialRisk: existential({ existential_risk: 9, organism_at_risk: true }),
    directive: dirPublish,
  });
  const horizonsCoherent = readMultiHorizonPlanning({
    longHorizon: longHorizon(), existentialRisk: existential(), directive: dirPublish,
  });
  checks.push([
    'multi-horizon planning flags a short-term move that contradicts a long-horizon need',
    horizonConflict.horizon_conflict && !horizonsCoherent.horizon_conflict,
    `publish while organism at risk → horizon conflict; no threat → horizons coherent`,
  ]);

  // ── cognitive dependency mapping flags a fragile dependency ──────
  const tangledGraph = readActiveCognitionGraph({
    interrupts: stormInterrupts, scheduler: survivalSchedule,
    contradictionCount: 5, identityTension: true,
  });
  const dependencies = readCognitiveDependencyMapping({
    cognitionGraph: tangledGraph, health: sickHealth, civilizationDecaying: true,
  });
  checks.push([
    'cognitive dependency mapping flags a fragile dependency and a cascade risk',
    dependencies.fragile_dependency !== null && dependencies.cascade_risk >= 6,
    `fragile: "${dependencies.fragile_dependency}" — cascade risk ${dependencies.cascade_risk}/10`,
  ]);

  // ── persistent executive state detects a drifting posture ───────
  const driftedState = readPersistentExecutiveState({
    priorPosture: 'coordinated-operation',
    directiveLog: [
      { directive: 'publish', tick: 1 }, { directive: 'pause', tick: 2 },
      { directive: 'silence', tick: 3 }, { directive: 'escalate', tick: 4 },
      { directive: 'hibernate', tick: 5 },
    ],
    kernel: protectedK, directive: dirHibernate, health: sickHealth,
  });
  checks.push([
    'persistent executive state detects an operational posture drifting tick to tick',
    driftedState.posture_drifted,
    `five distinct directives across recent ticks → posture drift (continuity ${driftedState.posture_continuity}/10)`,
  ]);

  // ── THE CLOSING SYNTHESIS — coordinated vs fragmenting ──────────
  const runawayLoops = readAutonomousRuntimeLoops({
    kernel: protectedK, complexity: complexity({ complexity_load: 9, over_thinking: true }), uptime: 5,
  });
  const osFragmenting = readOperatingSystemCore({
    state: createInitialOS(), kernel: protectedK, health: sickHealth,
    directive: dirHibernate, stabilization: emergency, isolatedProcessStimulation: true,
  });
  const osCoordinated = readOperatingSystemCore({
    state: { ...createInitialOS(), uptime: 10, fragmentationStreak: 0 },
    kernel: running, health: wellHealth, directive: dirPublish,
    stabilization: stableRuntime, isolatedProcessStimulation: false,
  });
  checks.push([
    'the closing synthesis distinguishes a COORDINATED runtime from a FRAGMENTING one',
    osFragmenting.runtime_is_fragmenting && !osFragmenting.runtime_is_coordinated &&
      osCoordinated.runtime_is_coordinated && !osCoordinated.runtime_is_fragmenting &&
      runawayLoops.a_loop_is_runaway,
    `isolated processes → fragmenting (${osFragmenting.coordination_score}/10); ` +
      `kernel-coordinated → coordinated (${osCoordinated.coordination_score}/10)`,
  ]);

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 8 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 8 VERIFIED — a living cognitive operating system governing itself in real time.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
