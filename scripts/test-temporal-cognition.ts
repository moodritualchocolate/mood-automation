/**
 * scripts/test-temporal-cognition.ts
 *
 * The temporal cognition sandbox (Wave 18).
 *
 * Two fixture archives drive the new layer to verify it perceives
 * duration without inventing it. The fixtures are deterministic;
 * `deriveTemporalCognition` is pure, so the assertions are exact.
 *
 *   DURABLE ARCHIVE — exhibits every temporal pattern:
 *     - signals that persisted for days
 *     - a kind that went quiet then returned
 *     - a slow trust build with no spike
 *     - audience-fatigue that peaked and recovered
 *     - trust-velocity sustaining positive across the window
 *     - a scar from 10 days ago still teaching
 *     - weather transitions that follow plausible neighbours
 *
 *   FRAGMENTED ARCHIVE — exhibits NONE of those patterns:
 *     - sparse, recent readings only
 *     - weather whiplash (flourishing ↔ strained ↔ dormant)
 *     - one fresh shallow scar
 *     - no trust-velocity readings
 *
 * The assertions are not just "ran without throwing" — they encode
 * the architectural promise: the layer perceives duration when it
 * is there, and stays empty when it is not.
 *
 * Run:  npx tsx scripts/test-temporal-cognition.ts
 */

import { deriveTemporalCognition, type TemporalArchives, type TemporalCognitionReading } from '@lib/temporalCognition';
import type { WeatherLogState, WeatherSample } from '@lib/weatherLogArchive';
import type { ProtectionMemoryState } from '@lib/protectionMemoryArchive';
import type { ContradictionScarsState } from '@lib/contradictionScarsArchive';
import type { PressureGatewayState, ExternalPressureReading } from '@lib/pressureIngestionGateway';

const NOW = 1_715_000_000_000;
const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// ─── Helpers ───────────────────────────────────────────────────
function weatherSample(at: number, weather: WeatherSample['weather']): WeatherSample {
  return { at, weather, silence_strength: 0, protection_recorded: false, scar_recorded: false };
}
function pressure(kind: ExternalPressureReading['kind'], at: number, vector: number, source = 'instagram-sensory'): ExternalPressureReading {
  return { kind, vector, confidence: 0.6, source, at };
}

// ─── DURABLE ARCHIVE ───────────────────────────────────────────
function buildDurableArchive(): TemporalArchives {
  // Weather: 16 samples spaced over ~8 days. Mostly coherent
  // transitions on the awake ↔ breathing ↔ hushed ↔ restrained
  // ladder, with one strained dip and one flourishing rise.
  const weatherSamples: WeatherSample[] = [];
  const weatherSequence: WeatherSample['weather'][] = [
    'awake', 'breathing', 'breathing', 'hushed',
    'restrained', 'hushed', 'breathing', 'awake',
    'breathing', 'flourishing', 'breathing', 'awake',
    'strained', 'breathing', 'hushed', 'breathing',
  ];
  for (let i = 0; i < weatherSequence.length; i++) {
    weatherSamples.push(weatherSample(NOW - (16 - i) * (12 * HOUR), weatherSequence[i]!));
  }
  const weatherLog: WeatherLogState = {
    bornAt: NOW - 9 * DAY,
    totalSamples: weatherSamples.length,
    samples: weatherSamples,
    updatedAt: NOW,
  };

  // Pressure: deliberately construct each pattern.
  const recent: ExternalPressureReading[] = [];

  // Persisted sentiment-drift: 5 readings spread over 6 days.
  recent.push(pressure('sentiment-drift', NOW - 6 * DAY, 0.4));
  recent.push(pressure('sentiment-drift', NOW - 5 * DAY, 0.3));
  recent.push(pressure('sentiment-drift', NOW - 3 * DAY, 0.45));
  recent.push(pressure('sentiment-drift', NOW - 2 * DAY, 0.35));
  recent.push(pressure('sentiment-drift', NOW - 6 * HOUR, 0.4, 'longform-reply'));

  // Delayed resonance: resonance-decay appears, then 36h gap,
  // then returns.
  recent.push(pressure('resonance-decay', NOW - 5 * DAY, 0.5));
  recent.push(pressure('resonance-decay', NOW - 4 * DAY - 12 * HOUR, 0.4));
  recent.push(pressure('resonance-decay', NOW - 3 * HOUR, 0.45));

  // Slow emergence: cultural-tension building gradually with no
  // single step > 0.25. 6 readings over ~3h.
  for (let i = 0; i < 6; i++) {
    recent.push(pressure('cultural-tension', NOW - (3 * HOUR) + i * (30 * 60 * 1000), 0.1 + i * 0.08));
  }

  // Recovery: audience-fatigue peaked at 0.7 four days ago, now
  // smoothed back to near 0.
  recent.push(pressure('audience-fatigue', NOW - 4 * DAY, 0.7));
  recent.push(pressure('audience-fatigue', NOW - 3 * DAY, 0.5));
  recent.push(pressure('audience-fatigue', NOW - 2 * DAY, 0.2));
  recent.push(pressure('audience-fatigue', NOW - 12 * HOUR, 0.05));

  // Trust compounding: 8 trust-velocity readings, 7 positive,
  // over 5 hours.
  for (let i = 0; i < 8; i++) {
    const v = i === 3 ? -0.1 : 0.2 + (i % 3) * 0.1;
    recent.push(pressure('trust-velocity', NOW - (5 * HOUR) + i * (40 * 60 * 1000), v, 'longform-reply'));
  }

  const pressureGateway: PressureGatewayState = {
    bornAt: NOW - 9 * DAY,
    smoothed: {
      'audience-fatigue':        0.06,
      'cultural-tension':        0.42,
      'attention-availability':  0.1,
      'sentiment-drift':         0.38,
      'resonance-decay':         0.35,
      'trust-velocity':          0.18,
    },
    recent,
    readingsIngested: recent.length,
    digestionInertia: 0.85,
    updatedAt: NOW,
  };

  // Scars: one fresh shallow scar (will not qualify as a
  // persistent lesson) and one severe scar 10 days ago that does.
  const scars: ContradictionScarsState = {
    bornAt: NOW - 12 * DAY,
    totalScars: 2,
    scars: [
      { at: NOW - 10 * DAY, kind: 'overreach', severity: 8,
        description: 'reached for amplification before meaning settled',
        wisdom: 'do not amplify what has not yet become' },
      { at: NOW - 4 * HOUR, kind: 'noise', severity: 4,
        description: 'a small noise event',
        wisdom: 'silence is still cheaper than apology' },
    ],
    updatedAt: NOW,
  };

  const protectionMemory: ProtectionMemoryState = {
    bornAt: NOW - 9 * DAY,
    totalEvents: 1,
    events: [
      { at: NOW - 6 * HOUR, directive: 'be-silent', strength: 7,
        reasons: ['audience-saturated'],
        statement: 'silence is the move',
        source: 'cycle-tick' },
    ],
    updatedAt: NOW,
  };

  return { weatherLog, protectionMemory, contradictionScars: scars, pressureGateway };
}

// ─── FRAGMENTED ARCHIVE ────────────────────────────────────────
function buildFragmentedArchive(): TemporalArchives {
  // Weather: deliberate whiplash transitions.
  const seq: WeatherSample['weather'][] = [
    'awake', 'flourishing', 'strained', 'flourishing', 'dormant', 'strained', 'flourishing',
  ];
  const weatherSamples = seq.map((w, i) => weatherSample(NOW - (seq.length - i) * HOUR, w));
  const weatherLog: WeatherLogState = {
    bornAt: NOW - 8 * HOUR,
    totalSamples: weatherSamples.length,
    samples: weatherSamples,
    updatedAt: NOW,
  };

  // Pressure: only 3 recent readings, no persistence, no return.
  const recent: ExternalPressureReading[] = [
    pressure('cultural-tension', NOW - 30 * 60 * 1000, 0.2),
    pressure('audience-fatigue', NOW - 20 * 60 * 1000, 0.15),
    pressure('attention-availability', NOW - 5 * 60 * 1000, -0.1),
  ];
  const pressureGateway: PressureGatewayState = {
    bornAt: NOW - HOUR,
    smoothed: {
      'audience-fatigue':        0.02,
      'cultural-tension':        0.03,
      'attention-availability': -0.015,
      'sentiment-drift':         0,
      'resonance-decay':         0,
      'trust-velocity':          0,
    },
    recent,
    readingsIngested: recent.length,
    digestionInertia: 0.85,
    updatedAt: NOW,
  };

  // One fresh shallow scar — no persistent lesson.
  const scars: ContradictionScarsState = {
    bornAt: NOW - 2 * HOUR,
    totalScars: 1,
    scars: [
      { at: NOW - HOUR, kind: 'noise', severity: 4,
        description: 'small noise spike',
        wisdom: 'fresh and shallow — will fade' },
    ],
    updatedAt: NOW,
  };

  return { weatherLog, protectionMemory: null, contradictionScars: scars, pressureGateway };
}

// ─── Assertions ────────────────────────────────────────────────
let failures = 0;
function assert(cond: boolean, label: string, detail = ''): void {
  if (cond) {
    console.log(`    PASS  ${label}${detail ? ` — ${detail}` : ''}`);
  } else {
    console.error(`    FAIL  ${label}${detail ? ` — ${detail}` : ''}`);
    failures++;
  }
}

function checkDurable(r: TemporalCognitionReading): void {
  console.log('\n  ─── DURABLE ARCHIVE — temporal patterns should be perceived ───');
  console.log(`    felt_as: ${r.felt_as}`);
  console.log(`    observed span: ${(r.observed_span_ms / DAY).toFixed(1)} days · coherence ${r.temporal_coherence.toFixed(2)}`);

  const persisted = r.pressure_dynamics.filter((d) => d.persisted);
  assert(persisted.length >= 2,
    'at least two pressure signals persisted over the multi-day window',
    `${persisted.length} persisted (${persisted.map((p) => p.kind).join(', ')})`);

  assert(r.delayed_resonance.length >= 1,
    'delayed resonance perceived',
    r.delayed_resonance.map((d) => `${d.kind} returned after ${(d.gap_ms / HOUR).toFixed(0)}h`).join('; ') || 'none');

  assert(r.slow_emergence.length >= 1,
    'slow emergence perceived',
    r.slow_emergence.map((s) => `${s.kind} run ${s.run_length} over ${(s.span_ms / HOUR).toFixed(1)}h`).join('; ') || 'none');

  assert(r.recovery_signals.some((rs) => rs.kind === 'audience-fatigue'),
    'audience-fatigue recovery cycle perceived',
    r.recovery_signals.map((rs) => `${rs.kind} peak ${rs.peak.toFixed(2)} → ${rs.current.toFixed(2)} over ${(rs.recovery_span_ms / DAY).toFixed(1)}d`).join('; ') || 'none');

  assert(r.trust_compounding !== null && r.trust_compounding.positive_share >= 0.7,
    'trust compounding perceived',
    r.trust_compounding ? `${r.trust_compounding.readings} readings · ${(r.trust_compounding.positive_share * 100).toFixed(0)}% positive` : 'none');

  assert(r.persistent_lessons.length >= 1 && r.persistent_lessons[0]!.kind === 'overreach',
    'persistent lesson still teaching (≥7d, severity ≥6)',
    r.persistent_lessons.map((l) => `${l.kind} aged ${(l.age_ms / DAY).toFixed(0)}d severity ${l.severity}`).join('; ') || 'none');

  assert(r.temporal_coherence >= 0.7,
    'weather trajectory mostly coherent (≥0.7)',
    `coherence ${r.temporal_coherence.toFixed(2)}`);

  // Half-lives are derived where decay was observed.
  const halfLives = r.pressure_dynamics.filter((d) => d.half_life_ms !== null);
  assert(halfLives.length >= 1,
    'at least one half-life observed',
    halfLives.map((d) => `${d.kind} t½=${((d.half_life_ms ?? 0) / HOUR).toFixed(1)}h`).join('; ') || 'none');
}

function checkFragmented(r: TemporalCognitionReading): void {
  console.log('\n  ─── FRAGMENTED ARCHIVE — no temporal patterns should be perceived ───');
  console.log(`    felt_as: ${r.felt_as}`);
  console.log(`    observed span: ${(r.observed_span_ms / HOUR).toFixed(1)}h · coherence ${r.temporal_coherence.toFixed(2)}`);

  const persisted = r.pressure_dynamics.filter((d) => d.persisted);
  assert(persisted.length === 0,
    'no signal persisted (window too short)',
    `${persisted.length} persisted`);

  assert(r.delayed_resonance.length === 0, 'no delayed resonance', `${r.delayed_resonance.length} found`);
  assert(r.slow_emergence.length === 0, 'no slow emergence', `${r.slow_emergence.length} found`);
  assert(r.recovery_signals.length === 0, 'no recovery cycles', `${r.recovery_signals.length} found`);
  assert(r.trust_compounding === null, 'no trust compounding (no trust readings present)');
  assert(r.persistent_lessons.length === 0, 'no persistent lessons (only fresh shallow scar)', `${r.persistent_lessons.length} found`);

  assert(r.temporal_coherence < 0.5,
    'weather trajectory perceived as fragmented (<0.5)',
    `coherence ${r.temporal_coherence.toFixed(2)}`);
}

// ─── Run ───────────────────────────────────────────────────────
function main(): void {
  console.log('\n WAVE 18 — Temporal Cognition sandbox\n');
  console.log('   pure derivation across existing archives');
  console.log('   no new adapter · no new write surface · no clock access');
  console.log('   the organism learns duration\n');

  const durable = deriveTemporalCognition(buildDurableArchive(), NOW);
  checkDurable(durable);

  const fragmented = deriveTemporalCognition(buildFragmentedArchive(), NOW);
  checkFragmented(fragmented);

  // Also verify the pure-function contract: same input → same
  // reading (compare deep equal via JSON).
  const a = JSON.stringify(deriveTemporalCognition(buildDurableArchive(), NOW));
  const b = JSON.stringify(deriveTemporalCognition(buildDurableArchive(), NOW));
  console.log('\n  ─── Purity check ───');
  assert(a === b, 'same archives + same now → identical reading');

  // And: an empty archive returns a coherent empty reading.
  const empty = deriveTemporalCognition({}, NOW);
  console.log('\n  ─── Empty archive ───');
  console.log(`    felt_as: ${empty.felt_as}`);
  assert(empty.pressure_dynamics.length === 0, 'empty pressure dynamics');
  assert(empty.persistent_lessons.length === 0, 'empty persistent lessons');
  assert(empty.temporal_coherence === 1, 'coherence defaults to 1 when nothing to read');

  console.log('');
  if (failures === 0) {
    console.log('  SANDBOX VERDICT — temporal cognition perceives duration when it is there');
    console.log('  and stays silent when it is not. The organism is no longer reading only');
    console.log('  the present moment.\n');
  } else {
    console.error(`  SANDBOX FAILED — ${failures} assertion(s) did not hold.\n`);
    process.exit(1);
  }
}

main();
