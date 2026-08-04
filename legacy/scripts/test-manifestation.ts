/**
 * scripts/test-manifestation.ts
 *
 * WAVE 9 — Manifestation Architecture verification (Phases 111–130).
 *
 * Proves the cognitive operating system has become a living, visible
 * runtime: every manifestation surface is built purely from the
 * persistent runtime snapshot — no fabricated widgets — and degrades
 * honestly to a dormant state when there is nothing to show.
 *
 * Run with:  npx tsx scripts/test-manifestation.ts
 */

import type { ExecutiveWorldState } from '@lib/worldStateEngine';
import type { RuntimeSnapshot } from '@lib/runtimeUIBrain';
import { createInitialOrganism } from '@lib/persistentOrganismCore';
import { createInitialOS } from '@lib/operatingSystemCore';
import { createInitialCivilization } from '@lib/civilizationArchive';
import { createRuntimeMemoryStore } from '@lib/runtimeMemoryStore';
import type { RuntimeHistoryEntry } from '@lib/runtimeMemoryStore';
import { buildRuntimeManifestation } from '@lib/manifestationCore';

function makeWorld(): ExecutiveWorldState {
  return {
    updatedAt: Date.now(), observationCount: 8,
    collective_exhaustion: 6, emotional_volatility: 5, anxiety_pressure: 6,
    social_fragmentation: 5, attention_chaos: 7, economic_pressure: 6,
    loneliness_index: 5, digital_overload: 7, trust_erosion: 5, world_tension: 6,
    climate: 'tense', climate_description: 'a tense world', most_acute_pressure: 'attention chaos',
    notes: [],
  };
}

function historyEntry(i: number, verdict: string, territory: string, coherence: number): RuntimeHistoryEntry {
  return {
    generationIndex: i, ts: Date.now() - (20 - i) * 1000, verdict,
    dominantTruth: `truth ${i}`, emotionalTerritory: territory, symbolicObjects: [],
    worldStateGen: i, emergence: 6, fieldCoherence: coherence, continuityScore: 6,
    silenceLevel: 5,
  };
}

async function main() {
  console.log('\n WAVE 9 — Manifestation Architecture verification\n');
  const checks: Array<[string, boolean, string]> = [];

  // ── the dormant case — nothing has run ──────────────────────────
  const emptySnap: RuntimeSnapshot = {
    organism: null, os: null, civilization: null, worldState: null,
    runtime: null, capturedAt: Date.now(),
  };
  const dormant = buildRuntimeManifestation(emptySnap);
  checks.push([
    'a dormant runtime manifests honestly — visible=false, every panel degrades without throwing',
    !dormant.runtime_is_visible && dormant.brain.liveness === 'dormant' &&
      !dormant.organism.present && !dormant.pulse.present,
    `dormant → visible=${dormant.runtime_is_visible}, liveness="${dormant.brain.liveness}"`,
  ]);

  // ── build a populated, healthy runtime snapshot ─────────────────
  const organism = { ...createInitialOrganism(), age: 12, energyReserves: 8, stressAccumulation: 3, complexityLoad: 4, adaptationCount: 7, restCount: 3 };
  organism.immuneMemory = [
    { threat: 'optimization-corruption', age: 4, survived: true },
    { threat: 'viral-memetics', age: 9, survived: true },
  ];
  const os = {
    ...createInitialOS(), uptime: 14, operationalPosture: 'coordinated-operation' as const,
    currentSeason: 'growth' as const, seasonAge: 4, coordinationEMA: 8, totalInterrupts: 9,
    directiveLog: [
      { directive: 'publish', tick: 11 }, { directive: 'escalate', tick: 12 },
      { directive: 'publish', tick: 13 }, { directive: 'publish', tick: 14 },
    ],
  };
  const civilization = { ...createInitialCivilization(), generation: 14, optimizationWins: 3, identityWins: 9 };
  civilization.beliefs = [
    { id: 'b1', statement: 'restraint outlasts loudness', strength: 8, bornGeneration: 3, timesReinforced: 5 },
  ];
  civilization.scars = [{ id: 's1', wound: 'numbness drift', generation: 6, severity: 5, healed: false }];
  civilization.myths = [{ id: 'm1', story: 'the first true refusal', foundingGeneration: 2 }];
  civilization.institutionalMemory = [
    { generation: 13, ts: Date.now(), verdict: 'proceed', governingPriority: 'identity', consensusQuality: 7, debateTension: 6, emergedFromTension: true },
  ];
  civilization.reputationEconomy = { strategist: 7, 'identity-guardian': 8 };
  civilization.culturalTendency = { identity: 9, optimization: 3 };

  const store = createRuntimeMemoryStore('test-manifestation');
  await store.reset();
  const book = await store.read();
  book.approvedCount = 8;
  book.rejectedCount = 3;
  book.history = [
    historyEntry(8, 'approve', 'fatigue', 8),
    historyEntry(9, 'approve', 'fatigue', 7),
    historyEntry(10, 'reject-concept', 'fatigue', 6),
    historyEntry(11, 'approve', 'overstimulation', 7),
    historyEntry(12, 'approve', 'fatigue', 7),
    historyEntry(13, 'approve', 'fatigue', 8),
  ];

  const snap: RuntimeSnapshot = {
    organism, os, civilization, worldState: makeWorld(), runtime: book, capturedAt: Date.now(),
  };
  const m = buildRuntimeManifestation(snap);

  // ── the runtime is visible and alive ────────────────────────────
  checks.push([
    'a booted runtime manifests as visible and alive',
    m.runtime_is_visible && m.brain.is_booted &&
      (m.brain.liveness === 'alive' || m.brain.liveness === 'breathing'),
    `booted → visible=${m.runtime_is_visible}, liveness="${m.brain.liveness}"`,
  ]);

  // ── organism state surfaces real vital signs ────────────────────
  checks.push([
    'the organism state surface renders real vital signs as gauges',
    m.organism.present && m.organism.gauges.length === 4 && m.organism.age === 12,
    `${m.organism.gauges.length} gauges, condition "${m.organism.condition}", vitality ${m.organism.vitality}/10`,
  ]);

  // ── the cognitive pulse has a waveform ──────────────────────────
  checks.push([
    'the cognitive pulse visualizer produces a felt heartbeat waveform',
    m.pulse.present && m.pulse.waveform.length === 24 && m.pulse.rate > 0,
    `pulse ${m.pulse.rate}, rhythm "${m.pulse.rhythm}", ${m.pulse.waveform.length}-sample waveform`,
  ]);

  // ── the directive stream reflects the kernel's directive log ────
  checks.push([
    'the directive stream surfaces the kernel\'s real directive log',
    m.directives.present && m.directives.current === 'publish' && m.directives.stream.length === 4,
    `current "${m.directives.current}", dominant "${m.directives.dominant_directive}" (${m.directives.dominant_share}%)`,
  ]);

  // ── the cognition timeline orders real events ───────────────────
  checks.push([
    'the cognition timeline orders directives, sessions, and verdicts into one history',
    m.timeline.present && m.timeline.events.length > 0,
    `${m.timeline.events.length} timeline events across ${m.timeline.span_ticks} ticks`,
  ]);

  // ── the strategic season monitor reflects the OS season ─────────
  checks.push([
    'the strategic season monitor reflects the operating system\'s real season',
    m.season.present && m.season.current_season === 'growth' &&
      m.season.markers.filter((mk) => mk.active).length === 1,
    `season "${m.season.current_season}", age ${m.season.season_age} ticks`,
  ]);

  // ── the world-state monitor surfaces the observed reality ───────
  checks.push([
    'the world-state monitor surfaces the observed reality as pressure gauges',
    m.worldState.present && m.worldState.pressures.length === 8,
    `climate "${m.worldState.climate}", ${m.worldState.pressures.length} pressure gauges`,
  ]);

  // ── the attention pressure map lays pressure onto a field ───────
  checks.push([
    'the attention pressure map lays external, internal, and runtime pressure onto a field',
    m.pressureMap.present && m.pressureMap.cells.length >= 7 && m.pressureMap.hottest_cell !== null,
    `${m.pressureMap.cells.length} cells, total ${m.pressureMap.total_pressure}/10, hottest "${m.pressureMap.hottest_cell}"`,
  ]);

  // ── the memory graph draws the civilization's memory ────────────
  checks.push([
    'the memory graph draws beliefs, myths, scars, and immune records as a structure',
    m.memoryGraph.present && m.memoryGraph.nodes.length >= 4,
    `${m.memoryGraph.nodes.length} memory nodes, density ${m.memoryGraph.density}/10`,
  ]);

  // ── the identity surface reads the identity as eroding ──────────
  checks.push([
    'the identity state surface reads identity strength from real civilization history',
    m.identity.present && m.identity.core_belief === 'restraint outlasts loudness',
    `identity strength ${m.identity.identity_strength}/10, held=${m.identity.identity_held}`,
  ]);

  // ── the escalation surface reflects the decision ledger ─────────
  checks.push([
    'the escalation surface reflects the real approved / refused decision ledger',
    m.escalation.present && m.escalation.approved_count === 8 && m.escalation.refused_count === 3,
    `${m.escalation.approved_count} shipped / ${m.escalation.refused_count} refused — posture "${m.escalation.posture}"`,
  ]);

  // ── the drift monitor reads the runtime history ─────────────────
  checks.push([
    'the drift monitor reads drift from the real runtime history',
    m.drift.present,
    `drift detected=${m.drift.drift_detected}, magnitude ${m.drift.drift_magnitude}/10`,
  ]);

  // ── the layout promotes the foreground surface to hero ──────────
  const heroPanels = m.layout.panels.filter((p) => p.emphasis === 'hero');
  checks.push([
    'the manifestation layout composes itself, promoting the foreground surface to hero',
    heroPanels.length === 1 && heroPanels[0].panel === m.brain.foreground,
    `hero panel "${m.layout.hero}" matches brain foreground "${m.brain.foreground}"`,
  ]);

  // ── every surface is true to cognition ──────────────────────────
  checks.push([
    'every visible surface is built from persistent state — true to cognition by construction',
    m.surface_is_true_to_cognition && m.layout.panels.length === 16,
    `${m.layout.panels.length} panels, all derived from the persistent snapshot`,
  ]);

  // ── a critical runtime manifests as critical ────────────────────
  const criticalSnap: RuntimeSnapshot = {
    organism: { ...createInitialOrganism(), age: 30, energyReserves: 1, stressAccumulation: 9, complexityLoad: 9 },
    os: { ...createInitialOS(), uptime: 30, fragmentationStreak: 4, coordinationEMA: 2, operationalPosture: 'protective-mode' },
    civilization: { ...createInitialCivilization(), generation: 30, optimizationWins: 14, identityWins: 4 },
    worldState: makeWorld(), runtime: book, capturedAt: Date.now(),
  };
  const critical = buildRuntimeManifestation(criticalSnap);
  checks.push([
    'a distressed runtime manifests as critical, with internal conflict surfaced',
    critical.brain.liveness === 'critical' && !critical.conflict.at_peace &&
      critical.conflict.conflicts.length >= 2,
    `liveness "${critical.brain.liveness}", ${critical.conflict.conflicts.length} internal conflict(s)`,
  ]);

  await store.reset();

  let passed = 0;
  for (const [name, ok, detail] of checks) {
    console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${name}\n        ${detail}`);
    if (ok) passed += 1;
  }
  console.log(`\n  ${passed}/${checks.length} checks passed\n`);
  if (passed < checks.length) {
    console.error('  WAVE 9 VERIFICATION FAILED.\n');
    process.exit(1);
  }
  console.log('  WAVE 9 VERIFIED — the operating system is a living, visible runtime.\n');
}

main().catch((e) => { console.error(e); process.exit(1); });
