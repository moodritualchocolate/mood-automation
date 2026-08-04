/**
 * scripts/test-temporal-accumulation.ts
 *
 * The Wave 19 sandbox. Seven scenarios drawn directly from the
 * failure modes the spec named:
 *
 *   1. LONG SILENCE PERIODS       — silence durability detected without inflation
 *   2. INTERMITTENT RECURRENCE    — recurring signature found
 *   3. DISAPPEARING SIGNALS       — silence remains silence (no fabricated persistence)
 *   4. CONTRADICTORY RETURNS      — sign-flip return distinguished from coherent return
 *   5. FALSE PERSISTENCE          — loud narrow burst classified as 'novel-burst', NOT persistent
 *   6. MEANING DECAY              — long-tail resonance correctly absent when decay is real
 *   7. RECOVERY AFTER FRAGMENTATION — coherence delta detected
 *
 * Plus three architectural checks:
 *
 *   - HONEST UNCERTAINTY  — thin window → all detections empty
 *   - PURITY              — same archives → same reading
 *   - EMPTY               — no archives → coherent honest-uncertain reading
 *
 * Run:  npx tsx scripts/test-temporal-accumulation.ts
 */

import {
  deriveTemporalAccumulation,
  type TemporalAccumulationArchives,
  type TemporalAccumulationReading,
} from '@lib/temporalAccumulation';
import type { WeatherLogState, WeatherSample } from '@lib/weatherLogArchive';
import type { ContradictionScarsState } from '@lib/contradictionScarsArchive';
import type { PressureGatewayState, ExternalPressureReading } from '@lib/pressureIngestionGateway';

const NOW = 1_716_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

function weatherSample(at: number, weather: WeatherSample['weather']): WeatherSample {
  return { at, weather, silence_strength: 0, protection_recorded: false, scar_recorded: false };
}
function pressure(kind: ExternalPressureReading['kind'], at: number, vector: number, source = 'instagram-sensory'): ExternalPressureReading {
  return { kind, vector, confidence: 0.6, source, at };
}

// ─── Scenario 1 — LONG SILENCE PERIODS ─────────────────────────
// Weather log dominated by silent weathers (hushed, restrained,
// breathing) — silence durability should be detected; ratio > 1.
function scenarioLongSilence(): TemporalAccumulationArchives {
  const samples: WeatherSample[] = [];
  // Two brief active runs, then a long stretch of silence at the end.
  const seq: WeatherSample['weather'][] = [
    'awake', 'awake', 'breathing', 'awake', 'awake',
    'breathing', 'hushed',
    'awake', 'awake',
    'breathing', 'hushed', 'restrained', 'hushed', 'restrained',
    'hushed', 'restrained', 'restrained', 'hushed',
  ];
  for (let i = 0; i < seq.length; i++) {
    samples.push(weatherSample(NOW - (seq.length - i) * 12 * HOUR, seq[i]!));
  }
  const weatherLog: WeatherLogState = {
    bornAt: NOW - 10 * DAY,
    totalSamples: samples.length, samples, updatedAt: NOW,
  };
  return { weatherLog, contradictionScars: null, pressureGateway: { ...emptyGateway(), bornAt: NOW - 10 * DAY } };
}

// ─── Scenario 2 — INTERMITTENT RECURRENCE ──────────────────────
// One pressure kind appears in 4 distinct episodes spread across
// 8 days, each separated by > 6 hours. Other kinds appear once.
function scenarioRecurrence(): TemporalAccumulationArchives {
  const readings: ExternalPressureReading[] = [];
  // Episode 1 (day -8)
  readings.push(pressure('cultural-tension', NOW - 8 * DAY, 0.3));
  readings.push(pressure('cultural-tension', NOW - 8 * DAY + 30 * 60_000, 0.4));
  // Episode 2 (day -5)
  readings.push(pressure('cultural-tension', NOW - 5 * DAY, 0.35));
  readings.push(pressure('cultural-tension', NOW - 5 * DAY + 20 * 60_000, 0.4));
  // Episode 3 (day -3)
  readings.push(pressure('cultural-tension', NOW - 3 * DAY, 0.3));
  // Episode 4 (day -1)
  readings.push(pressure('cultural-tension', NOW - DAY, 0.45));
  readings.push(pressure('cultural-tension', NOW - DAY + 45 * 60_000, 0.35));
  // Unrelated single readings of other kinds
  readings.push(pressure('sentiment-drift', NOW - 4 * DAY, 0.2));
  return {
    weatherLog: null, contradictionScars: null,
    pressureGateway: {
      ...emptyGateway(),
      bornAt: NOW - 10 * DAY,
      recent: readings,
      readingsIngested: readings.length,
      smoothed: { ...emptyGateway().smoothed, 'cultural-tension': 0.25 },
    },
  };
}

// ─── Scenario 3 — DISAPPEARING SIGNALS ─────────────────────────
// A pressure kind seen once 6 days ago, smoothed value already at
// 0. Surrounding weather samples span the full window so the layer
// is `ready` — meaning it COULD fabricate persistence if its
// architecture allowed. It must not. The disappeared kind should
// classify as 'rare' (or simply absent), never as 'persistent', and
// long-tail-resonance must stay empty.
function scenarioDisappearing(): TemporalAccumulationArchives {
  const readings: ExternalPressureReading[] = [
    pressure('sentiment-drift', NOW - 6 * DAY, 0.4),
  ];
  // Weather samples give the layer a wide enough observation
  // window to be `ready`. The samples themselves are neutral.
  const samples: WeatherSample[] = [];
  for (let i = 0; i < 6; i++) {
    samples.push(weatherSample(NOW - (6 - i) * DAY, 'awake'));
  }
  const weatherLog: WeatherLogState = {
    bornAt: NOW - 7 * DAY, totalSamples: samples.length, samples, updatedAt: NOW,
  };
  return {
    weatherLog,
    contradictionScars: null,
    pressureGateway: {
      ...emptyGateway(),
      bornAt: NOW - 7 * DAY,
      recent: readings,
      readingsIngested: 1,
      smoothed: { ...emptyGateway().smoothed, 'sentiment-drift': 0.0 },
    },
  };
}

// ─── Scenario 4 — CONTRADICTORY RETURNS ────────────────────────
// One kind returns after a gap with OPPOSITE sign — distinct from
// the kind that returns with the SAME sign.
function scenarioContradictoryReturn(): TemporalAccumulationArchives {
  const readings: ExternalPressureReading[] = [
    // contradictory: sentiment-drift +0.4 then later -0.5
    pressure('sentiment-drift', NOW - 5 * DAY, 0.4),
    pressure('sentiment-drift', NOW - 2 * HOUR, -0.5),
    // coherent: trust-velocity +0.3 then later +0.4
    pressure('trust-velocity', NOW - 5 * DAY, 0.3),
    pressure('trust-velocity', NOW - 2 * HOUR, 0.4),
  ];
  return {
    weatherLog: null, contradictionScars: null,
    pressureGateway: {
      ...emptyGateway(),
      bornAt: NOW - 7 * DAY,
      recent: readings,
      readingsIngested: readings.length,
    },
  };
}

// ─── Scenario 5 — FALSE PERSISTENCE ────────────────────────────
// Audience-fatigue: 8 readings inside 60 minutes (a single burst).
// Must classify as 'novel-burst', NOT 'persistent' or 'established'.
function scenarioFalsePersistence(): TemporalAccumulationArchives {
  const readings: ExternalPressureReading[] = [];
  for (let i = 0; i < 8; i++) {
    readings.push(pressure('audience-fatigue', NOW - HOUR + i * 7 * 60_000, 0.5));
  }
  // Plus an established kind to verify the distinction holds
  // alongside burst classification.
  for (let i = 0; i < 7; i++) {
    readings.push(pressure('trust-velocity', NOW - 6 * DAY + i * DAY, 0.3));
  }
  return {
    weatherLog: null, contradictionScars: null,
    pressureGateway: {
      ...emptyGateway(),
      bornAt: NOW - 7 * DAY,
      recent: readings,
      readingsIngested: readings.length,
    },
  };
}

// ─── Scenario 6 — MEANING DECAY ────────────────────────────────
// Smoothed value low (decay complete) AND most recent reading is
// fresh. Long-tail resonance must be empty — the smoothed value is
// no longer holding any echo.
function scenarioMeaningDecay(): TemporalAccumulationArchives {
  const readings: ExternalPressureReading[] = [
    pressure('resonance-decay', NOW - 6 * DAY, 0.7),
    pressure('resonance-decay', NOW - 5 * DAY, 0.5),
    pressure('resonance-decay', NOW - 3 * DAY, 0.2),
    pressure('resonance-decay', NOW - HOUR, 0.05),
  ];
  return {
    weatherLog: null, contradictionScars: null,
    pressureGateway: {
      ...emptyGateway(),
      bornAt: NOW - 7 * DAY,
      recent: readings,
      readingsIngested: readings.length,
      smoothed: { ...emptyGateway().smoothed, 'resonance-decay': 0.04 },
    },
  };
}

// ─── Scenario 7 — RECOVERY AFTER FRAGMENTATION ─────────────────
// First half: whiplash transitions. Second half: stable ladder.
// Recovery delta should exceed the threshold.
function scenarioRecovery(): TemporalAccumulationArchives {
  const seq: WeatherSample['weather'][] = [
    // First half — fragmented (every transition is whiplash)
    'flourishing', 'strained', 'flourishing', 'dormant', 'strained', 'flourishing',
    // Second half — coherent (only neighbour transitions)
    'awake', 'breathing', 'hushed', 'breathing', 'awake', 'breathing',
  ];
  const samples = seq.map((w, i) => weatherSample(NOW - (seq.length - i) * 12 * HOUR, w));
  const weatherLog: WeatherLogState = {
    bornAt: NOW - 7 * DAY, totalSamples: samples.length, samples, updatedAt: NOW,
  };
  return { weatherLog, contradictionScars: null, pressureGateway: { ...emptyGateway(), bornAt: NOW - 7 * DAY } };
}

// ─── Architectural — HONEST UNCERTAINTY ────────────────────────
// Below the 3-day window. Even though signals are present, every
// detection field must remain empty.
function scenarioThinWindow(): TemporalAccumulationArchives {
  const readings: ExternalPressureReading[] = [];
  for (let i = 0; i < 8; i++) {
    readings.push(pressure('cultural-tension', NOW - HOUR + i * 5 * 60_000, 0.4));
  }
  return {
    weatherLog: null, contradictionScars: null,
    pressureGateway: {
      ...emptyGateway(),
      bornAt: NOW - 2 * HOUR,
      recent: readings,
      readingsIngested: readings.length,
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────
function emptyGateway(): PressureGatewayState {
  return {
    bornAt: NOW,
    smoothed: {
      'audience-fatigue': 0, 'cultural-tension': 0, 'attention-availability': 0,
      'sentiment-drift': 0, 'resonance-decay': 0, 'trust-velocity': 0,
    },
    recent: [], readingsIngested: 0, digestionInertia: 0.85, updatedAt: NOW,
  };
}

let failures = 0;
function assert(cond: boolean, label: string, detail = ''): void {
  if (cond) console.log(`    PASS  ${label}${detail ? ` — ${detail}` : ''}`);
  else { console.error(`    FAIL  ${label}${detail ? ` — ${detail}` : ''}`); failures++; }
}

function header(name: string, r: TemporalAccumulationReading): void {
  console.log(`\n  ─── ${name} ───`);
  console.log(`    ready: ${r.ready} · span ${(r.observed_span_ms / DAY).toFixed(1)}d`);
  console.log(`    felt_as: ${r.felt_as}`);
}

// ─── Run ───────────────────────────────────────────────────────
function main(): void {
  console.log('\n WAVE 19 — Passive Temporal Accumulation sandbox\n');
  console.log('   pure derivation · honest uncertainty · observational only');
  console.log('   the architecture should become older, not louder\n');

  // 1
  {
    const r = deriveTemporalAccumulation(scenarioLongSilence(), NOW);
    header('1. LONG SILENCE PERIODS', r);
    assert(r.silence_durability !== null, 'silence durability measurable');
    assert((r.silence_durability?.current_run ?? 0) >= 4, 'long current silent run detected', `run=${r.silence_durability?.current_run}`);
    assert((r.silence_durability?.durability_ratio ?? 0) > 1.0, 'silence holding longer than its historical norm', `ratio=${r.silence_durability?.durability_ratio.toFixed(2)}`);
  }

  // 2
  {
    const r = deriveTemporalAccumulation(scenarioRecurrence(), NOW);
    header('2. INTERMITTENT RECURRENCE', r);
    const sig = r.recurring_signatures.find((s) => s.kind === 'cultural-tension');
    assert(!!sig, 'recurring signature detected for cultural-tension');
    assert((sig?.episodes ?? 0) >= 4, '≥ 4 episodes counted', `episodes=${sig?.episodes}`);
    assert(r.recurring_signatures.every((s) => s.kind === 'cultural-tension'),
      'no spurious signatures from singletons');
  }

  // 3
  {
    const r = deriveTemporalAccumulation(scenarioDisappearing(), NOW);
    header('3. DISAPPEARING SIGNALS', r);
    assert(r.long_tail_resonance.length === 0, 'no long-tail resonance fabricated', `found=${r.long_tail_resonance.length}`);
    assert(r.recurring_signatures.length === 0, 'no recurrence from a single reading');
    const cls = r.persistence_classifications.find((c) => c.kind === 'sentiment-drift');
    assert(cls?.classification === 'rare', 'single old reading classified as rare', `classification=${cls?.classification}`);
  }

  // 4
  {
    const r = deriveTemporalAccumulation(scenarioContradictoryReturn(), NOW);
    header('4. CONTRADICTORY RETURNS', r);
    const con = r.contradictory_returns.find((c) => c.kind === 'sentiment-drift');
    const coh = r.coherent_returns.find((c) => c.kind === 'trust-velocity');
    assert(!!con, 'contradictory return on sentiment-drift detected');
    assert(con?.sign_before !== con?.sign_after, 'signs genuinely opposite');
    assert(!!coh, 'coherent return on trust-velocity preserved');
    assert(coh?.sign_before === coh?.sign_after, 'coherent return has matching sign');
  }

  // 5
  {
    const r = deriveTemporalAccumulation(scenarioFalsePersistence(), NOW);
    header('5. FALSE PERSISTENCE', r);
    const burst = r.persistence_classifications.find((c) => c.kind === 'audience-fatigue');
    assert(burst?.classification === 'novel-burst',
      'loud narrow burst classified as novel-burst, NOT persistent',
      `audience-fatigue classification=${burst?.classification} (${burst?.occurrences} readings in ${((burst?.span_ms ?? 0) / 60_000).toFixed(0)}m)`);
    const established = r.persistence_classifications.find((c) => c.kind === 'trust-velocity');
    assert(established?.classification === 'established' || established?.classification === 'persistent',
      'truly long-spanning kind correctly classified as established/persistent',
      `trust-velocity classification=${established?.classification}`);
  }

  // 6
  {
    const r = deriveTemporalAccumulation(scenarioMeaningDecay(), NOW);
    header('6. MEANING DECAY', r);
    assert(r.long_tail_resonance.length === 0, 'no long-tail resonance when decay is real', `found=${r.long_tail_resonance.length}`);
    // The pressure kind should be classified persistent (long span)
    // but the long-tail-resonance perception remains empty because
    // the smoothed value has decayed.
    const cls = r.persistence_classifications.find((c) => c.kind === 'resonance-decay');
    assert(cls?.classification === 'persistent' || cls?.classification === 'established' || cls?.classification === 'rare',
      'kind still classified honestly by its observation pattern',
      `classification=${cls?.classification}`);
  }

  // 7
  {
    const r = deriveTemporalAccumulation(scenarioRecovery(), NOW);
    header('7. RECOVERY AFTER FRAGMENTATION', r);
    assert(r.fragmentation_recovery !== null, 'fragmentation recovery perceived');
    assert((r.fragmentation_recovery?.delta ?? 0) >= 0.2,
      'second-half coherence > first-half by at least the recovery threshold',
      `Δ=${r.fragmentation_recovery?.delta.toFixed(2)} (${r.fragmentation_recovery?.first_half_coherence.toFixed(2)} → ${r.fragmentation_recovery?.second_half_coherence.toFixed(2)})`);
    assert(r.temporal_fragmentation.whiplash > 0,
      'whiplash transitions reported in the fragmentation perception',
      `whiplash=${r.temporal_fragmentation.whiplash}/${r.temporal_fragmentation.transitions}`);
  }

  // Architectural — HONEST UNCERTAINTY
  {
    const r = deriveTemporalAccumulation(scenarioThinWindow(), NOW);
    header('A. HONEST UNCERTAINTY (thin window)', r);
    assert(!r.ready, 'layer marks itself not-ready');
    assert(r.recurring_signatures.length === 0, 'no recurring signatures despite 8 readings');
    assert(r.long_tail_resonance.length === 0, 'no long-tail');
    assert(r.persistence_classifications.length === 0, 'no persistence classifications');
    assert(r.coherent_returns.length === 0 && r.contradictory_returns.length === 0, 'no returns');
    assert(r.felt_as.includes('insufficient time'), 'felt_as honestly states uncertainty', `felt_as=${r.felt_as}`);
  }

  // Architectural — PURITY
  {
    const a = JSON.stringify(deriveTemporalAccumulation(scenarioRecurrence(), NOW));
    const b = JSON.stringify(deriveTemporalAccumulation(scenarioRecurrence(), NOW));
    console.log('\n  ─── B. PURITY ───');
    assert(a === b, 'same archives + same now → identical reading');
  }

  // Architectural — EMPTY
  {
    const r = deriveTemporalAccumulation({}, NOW);
    console.log('\n  ─── C. EMPTY ARCHIVES ───');
    console.log(`    felt_as: ${r.felt_as}`);
    assert(!r.ready, 'empty archives → not ready');
    assert(r.recurring_signatures.length === 0 && r.persistence_classifications.length === 0,
      'all detections empty');
  }

  console.log('');
  if (failures === 0) {
    console.log('  SANDBOX VERDICT — the layer perceives long-horizon temporal structure when');
    console.log('  it is genuinely there, distinguishes loud from lasting, distinguishes coherent');
    console.log('  returns from contradictory ones, and remains honestly uncertain when time has');
    console.log('  not yet accumulated. No fabricated continuity. Silence remains silence.\n');
  } else {
    console.error(`\n  SANDBOX FAILED — ${failures} assertion(s) did not hold.\n`);
    process.exit(1);
  }
}

main();
