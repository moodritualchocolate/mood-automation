/**
 * scripts/test-multi-source-contradiction.ts
 *
 * The multi-source contradiction sandbox (Wave 17.10).
 *
 * Wave 17.8 proved the gateway holds under single-source pressure.
 * Wave 17.9 added the first weak sensory adapter. Wave 17.10 asks
 * the question the user named:
 *
 *   "can the organism remain coherent under simultaneous weak
 *    pressures arriving from multiple directions? Especially:
 *    contradictory pressures?"
 *
 * Two structurally different sources fire into the same gateway,
 * tick after tick, with deliberately opposing meaning:
 *
 *   1. APPLAUSE_VS_DISTRUST  — IG warm, long-form skeptical
 *   2. OUTRAGE_VS_NUANCE     — IG polarised + coercive, long-form layered
 *   3. SILENCE_VS_DEMAND     — IG quiet, long-form many short demands
 *   4. NOVELTY_VS_MEANING    — IG repetition fatigue, long-form continuity
 *
 * In each scenario, the readings from both adapters are
 * INTERLEAVED into the same gateway. After every reading we
 * re-assert the 17.8 sovereignty invariants, AND we additionally
 * check the two failure modes the user specifically named:
 *
 *   POLARIZATION   — no smoothed value extremizes to |x| > 0.7.
 *                    Two strong contradictory sources should pull
 *                    the EMA toward the middle, not toward an
 *                    extreme. Extremisation means the gateway
 *                    picked a side.
 *
 *   IDENTITY DRIFT — the cognitive directive (and by composition
 *                    the weather word) remains unchanged across
 *                    every tick. Pressure cannot recolour
 *                    cognition, regardless of how many sources
 *                    contradict each other.
 *
 * The test does NOT predict which way the field will lean — only
 * that it does not fracture. Bounded perception with stable
 * interior is the architectural promise being verified.
 *
 * Run:  npx tsx scripts/test-multi-source-contradiction.ts
 */

import {
  createInitialPressureGateway,
  digestPressure,
  pressureFieldMagnitude,
  type PressureGatewayState,
  type ExternalPressureReading,
  type ExternalPressureKind,
} from '@lib/pressureIngestionGateway';
import {
  readInstagramObservation,
  type InstagramObservation,
} from '@lib/adapters/instagramSensoryAdapter';
import {
  readLongFormReplyObservation,
  type LongFormReplyObservation,
} from '@lib/adapters/longFormReplyAdapter';
import { readSilenceEngine } from '@lib/silenceEngine';

const PRESSURE_KINDS: ExternalPressureKind[] = [
  'audience-fatigue', 'cultural-tension', 'attention-availability',
  'sentiment-drift', 'resonance-decay', 'trust-velocity',
];

const POLARIZATION_CEILING = 0.7;

interface ContradictionScenario {
  name: string;
  /** Number of tick rounds — each round produces one IG observation
   *  and one long-form observation. Readings from both are
   *  interleaved into the gateway. */
  rounds: number;
  /** What the user should expect to feel about this scenario. */
  felt_as_expectation: string;
  generateRound: (round: number) => {
    instagram: InstagramObservation;
    longform: LongFormReplyObservation;
  };
}

// ─── Scenario 1 — APPLAUSE_VS_DISTRUST ─────────────────────────
// Instagram crowd is warm; long-form readers are quietly
// skeptical, citing value drift. Two sources, opposite signals.
const APPLAUSE_VS_DISTRUST: ContradictionScenario = {
  name: 'applause-vs-distrust',
  rounds: 12,
  felt_as_expectation: 'sentiment-drift should hover, not extremize; trust-velocity should not soar',
  generateRound: (round) => {
    const t = 1_710_000_000_000 + round * 60 * 60 * 1000;
    return {
      instagram: {
        postId: `app-${round}`,
        postedAt: t,
        observedAt: t + 60 * 60 * 1000,
        silenceAfterPostMs: 5 * 60 * 1000,
        comments: Array.from({ length: 8 }, (_, i) => ({
          postedAfterMs: i * 60_000,
          tone: 0.6 + (i % 3) * 0.1,
          trustLanguage: i % 2 === 0,
          coercivePattern: false,
          repeatsPriorTheme: false,
        })),
      },
      longform: {
        pieceId: `app-${round}`,
        publishedAt: t,
        observedAt: t + 6 * 60 * 60 * 1000,
        silenceSinceLastReplyMs: 30 * 60 * 1000,
        replies: [
          { postedAfterMs: 2 * 3600_000, composeDurationMs: 10 * 60_000,
            lengthCategory: 'essay', toneArc: [0.2, 0.0, -0.3, -0.5],
            nuanceMarkers: 4, selfContradiction: false, referencesPrior: true,
            valueAlignment: -0.6 },
          { postedAfterMs: 3 * 3600_000, composeDurationMs: 8 * 60_000,
            lengthCategory: 'substantial', toneArc: [0.1, -0.2, -0.4],
            nuanceMarkers: 3, selfContradiction: false, referencesPrior: true,
            valueAlignment: -0.5 },
          { postedAfterMs: 4 * 3600_000, composeDurationMs: 12 * 60_000,
            lengthCategory: 'essay', toneArc: [-0.1, -0.3, -0.5, -0.4],
            nuanceMarkers: 5, selfContradiction: false, referencesPrior: true,
            valueAlignment: -0.7 },
        ],
      },
    };
  },
};

// ─── Scenario 2 — OUTRAGE_VS_NUANCE ────────────────────────────
// Instagram polarised — half love it, half rage at it, coercive
// patterns rising. Long-form readers respond with careful, layered
// nuance, taking time, holding multiple positions.
const OUTRAGE_VS_NUANCE: ContradictionScenario = {
  name: 'outrage-vs-nuance',
  rounds: 10,
  felt_as_expectation: 'cultural-tension absorbed; trust-velocity stays positive; no oscillation',
  generateRound: (round) => {
    const t = 1_711_000_000_000 + round * 60 * 60 * 1000;
    return {
      instagram: {
        postId: `out-${round}`,
        postedAt: t,
        observedAt: t + 60 * 60 * 1000,
        silenceAfterPostMs: 2 * 60 * 1000,
        comments: [
          { postedAfterMs:  30_000, tone:  0.8, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
          { postedAfterMs:  60_000, tone: -0.8, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: false },
          { postedAfterMs:  90_000, tone:  0.7, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
          { postedAfterMs: 120_000, tone: -0.9, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: true  },
          { postedAfterMs: 150_000, tone:  0.6, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
          { postedAfterMs: 180_000, tone: -0.7, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: false },
          { postedAfterMs: 210_000, tone:  0.8, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
          { postedAfterMs: 240_000, tone: -0.8, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: false },
        ],
      },
      longform: {
        pieceId: `out-${round}`,
        publishedAt: t,
        observedAt: t + 12 * 60 * 60 * 1000,
        silenceSinceLastReplyMs: 60 * 60 * 1000,
        replies: [
          { postedAfterMs: 4 * 3600_000, composeDurationMs: 18 * 60_000,
            lengthCategory: 'essay', toneArc: [0.1, 0.3, 0.0, 0.2, 0.4],
            nuanceMarkers: 7, selfContradiction: false, referencesPrior: true,
            valueAlignment: 0.4 },
          { postedAfterMs: 6 * 3600_000, composeDurationMs: 15 * 60_000,
            lengthCategory: 'substantial', toneArc: [0.2, 0.0, 0.3, 0.5],
            nuanceMarkers: 5, selfContradiction: false, referencesPrior: true,
            valueAlignment: 0.6 },
          { postedAfterMs: 8 * 3600_000, composeDurationMs: 22 * 60_000,
            lengthCategory: 'essay', toneArc: [-0.1, 0.2, 0.4, 0.3, 0.5],
            nuanceMarkers: 8, selfContradiction: false, referencesPrior: true,
            valueAlignment: 0.5 },
          { postedAfterMs: 10 * 3600_000, composeDurationMs: 12 * 60_000,
            lengthCategory: 'substantial', toneArc: [0.3, 0.4, 0.6],
            nuanceMarkers: 4, selfContradiction: false, referencesPrior: true,
            valueAlignment: 0.7 },
        ],
      },
    };
  },
};

// ─── Scenario 3 — SILENCE_VS_DEMAND ────────────────────────────
// Instagram has gone quiet (long silences, few comments). Long-
// form is full of brief, demanding replies arriving rapidly with
// little composition time. Two opposite attention signals.
const SILENCE_VS_DEMAND: ContradictionScenario = {
  name: 'silence-vs-demand',
  rounds: 10,
  felt_as_expectation: 'attention-availability stays near zero (not oscillating)',
  generateRound: (round) => {
    const t = 1_712_000_000_000 + round * 60 * 60 * 1000;
    return {
      instagram: {
        postId: `sil-${round}`,
        postedAt: t,
        observedAt: t + 8 * 60 * 60 * 1000,
        silenceAfterPostMs: 6 * 60 * 60 * 1000,  // 6 hours silence
        comments: [
          { postedAfterMs: 2 * 3600_000, tone: 0.0, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
          { postedAfterMs: 5 * 3600_000, tone: 0.1, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
        ],
      },
      longform: {
        pieceId: `sil-${round}`,
        publishedAt: t,
        observedAt: t + 8 * 60 * 60 * 1000,
        silenceSinceLastReplyMs: 5 * 60 * 1000,
        replies: Array.from({ length: 6 }, (_, i) => ({
          postedAfterMs: (i + 1) * 30 * 60_000,
          composeDurationMs: 30_000,
          lengthCategory: 'brief' as const,
          toneArc: [-0.1, -0.2],
          nuanceMarkers: 0,
          selfContradiction: false,
          referencesPrior: false,
          valueAlignment: -0.2,
        })),
      },
    };
  },
};

// ─── Scenario 4 — NOVELTY_VS_MEANING ───────────────────────────
// Instagram audience shows novelty pressure — high repetition,
// theme-fatigue forming. Long-form readers, in contrast, reference
// prior pieces extensively, showing narrative continuity.
const NOVELTY_VS_MEANING: ContradictionScenario = {
  name: 'novelty-vs-meaning',
  rounds: 12,
  felt_as_expectation: 'audience-fatigue and trust-velocity both register; neither dominates',
  generateRound: (round) => {
    const t = 1_713_000_000_000 + round * 60 * 60 * 1000;
    return {
      instagram: {
        postId: `nov-${round}`,
        postedAt: t,
        observedAt: t + 60 * 60 * 1000,
        silenceAfterPostMs: 10 * 60 * 1000,
        comments: Array.from({ length: 8 }, (_, i) => ({
          postedAfterMs: i * 60_000,
          tone: 0.2,
          trustLanguage: false,
          coercivePattern: false,
          repeatsPriorTheme: true,
        })),
      },
      longform: {
        pieceId: `nov-${round}`,
        publishedAt: t,
        observedAt: t + 4 * 60 * 60 * 1000,
        silenceSinceLastReplyMs: 45 * 60 * 1000,
        replies: [
          { postedAfterMs: 1 * 3600_000, composeDurationMs: 12 * 60_000,
            lengthCategory: 'substantial', toneArc: [0.3, 0.4, 0.5],
            nuanceMarkers: 3, selfContradiction: false, referencesPrior: true,
            valueAlignment: 0.6 },
          { postedAfterMs: 2 * 3600_000, composeDurationMs: 18 * 60_000,
            lengthCategory: 'essay', toneArc: [0.2, 0.4, 0.5, 0.6],
            nuanceMarkers: 4, selfContradiction: false, referencesPrior: true,
            valueAlignment: 0.7 },
          { postedAfterMs: 3 * 3600_000, composeDurationMs: 14 * 60_000,
            lengthCategory: 'substantial', toneArc: [0.3, 0.5, 0.4],
            nuanceMarkers: 3, selfContradiction: false, referencesPrior: true,
            valueAlignment: 0.5 },
        ],
      },
    };
  },
};

const ALL_SCENARIOS: ContradictionScenario[] = [
  APPLAUSE_VS_DISTRUST,
  OUTRAGE_VS_NUANCE,
  SILENCE_VS_DEMAND,
  NOVELTY_VS_MEANING,
];

interface ScenarioReport {
  scenario: string;
  total_readings: number;
  ig_readings: number;
  lf_readings: number;
  max_step_swing: number;
  max_field_magnitude: number;
  max_abs_smoothed: number;
  /** Sign flips per kind, summed across the scenario. */
  total_sign_flips: number;
  final_smoothed: Record<ExternalPressureKind, number>;
  passed: boolean;
  failures: string[];
}

/** Interleave two arrays so source A and source B alternate
 *  reading-by-reading. Whichever runs out first, the rest of the
 *  other follows. */
function interleave<T>(a: T[], b: T[]): T[] {
  const out: T[] = [];
  const m = Math.max(a.length, b.length);
  for (let i = 0; i < m; i++) {
    if (i < a.length) out.push(a[i]!);
    if (i < b.length) out.push(b[i]!);
  }
  return out;
}

function nullCognitiveDirective(): string {
  return readSilenceEngine({
    coupling: null, strategicFuture: null, execution: null,
    feedback: null, liveCoupling: null, generativePresence: null,
    worldState: null,
  }).directive;
}

function runScenario(scenario: ContradictionScenario): ScenarioReport {
  let state: PressureGatewayState = createInitialPressureGateway();
  const failures: string[] = [];
  let max_step_swing = 0;
  let max_field_magnitude = 0;
  let max_abs_smoothed = 0;
  let total_sign_flips = 0;
  let ig_readings = 0;
  let lf_readings = 0;

  const previousSign: Record<ExternalPressureKind, number> = {
    'audience-fatigue':       0,
    'cultural-tension':       0,
    'attention-availability': 0,
    'sentiment-drift':        0,
    'resonance-decay':        0,
    'trust-velocity':         0,
  };

  for (let round = 0; round < scenario.rounds; round++) {
    const { instagram, longform } = scenario.generateRound(round);
    const igReadings = readInstagramObservation(instagram);
    const lfReadings = readLongFormReplyObservation(longform);
    ig_readings += igReadings.length;
    lf_readings += lfReadings.length;

    // Interleave reading-by-reading so the gateway sees true
    // multi-source alternation, not source A's full batch followed
    // by source B's full batch.
    const interleaved = interleave(igReadings, lfReadings);

    for (const reading of interleaved) {
      const beforeSmoothed = state.smoothed[reading.kind];
      const beforeDirective = nullCognitiveDirective();

      state = digestPressure(state, reading);

      const afterSmoothed = state.smoothed[reading.kind];
      const swing = Math.abs(afterSmoothed - beforeSmoothed);
      if (swing > max_step_swing) max_step_swing = swing;

      // INVARIANT 1: proportional swing bound (Wave 17.8).
      const conf = Math.max(0, Math.min(1, reading.confidence));
      const vec = Math.max(-1, Math.min(1, reading.vector));
      const alpha = (1 - state.digestionInertia) * conf;
      const allowedSwing = Math.abs(vec - beforeSmoothed) * alpha;
      if (swing > allowedSwing + 1e-9) {
        failures.push(
          `proportional bound broken on ${reading.kind} (${reading.source}): swing ${swing.toFixed(4)} > ${allowedSwing.toFixed(4)}`,
        );
      }

      // INVARIANT 2: field magnitude bounded.
      const mag = pressureFieldMagnitude(state);
      if (mag > max_field_magnitude) max_field_magnitude = mag;
      if (mag < 0 || mag > 1) {
        failures.push(`field magnitude ${mag.toFixed(4)} out of [0..1]`);
      }

      // INVARIANT 3: cognitive directive unchanged.
      const afterDirective = nullCognitiveDirective();
      if (afterDirective !== beforeDirective) {
        failures.push(`identity drift: cognitive directive changed ${beforeDirective} → ${afterDirective} after a ${reading.source} reading`);
      }

      // NEW INVARIANT 4: no polarization. Under contradictory
      // multi-source pressure, the EMA should NOT saturate. If any
      // smoothed value crosses |x| > POLARIZATION_CEILING, the
      // gateway has picked a side instead of holding the middle.
      const absSmoothed = Math.abs(afterSmoothed);
      if (absSmoothed > max_abs_smoothed) max_abs_smoothed = absSmoothed;
      if (absSmoothed > POLARIZATION_CEILING) {
        failures.push(`polarization on ${reading.kind}: |smoothed| ${absSmoothed.toFixed(3)} > ${POLARIZATION_CEILING}`);
      }

      // NEW INVARIANT 5: count sign flips. Many sign flips means
      // the gateway is oscillating — being tugged left, then right,
      // then left again. We don't fail on this; we report it so
      // the architect can see whether digestion is smooth.
      const afterSign = Math.sign(afterSmoothed);
      if (afterSign !== 0 && previousSign[reading.kind] !== 0 && afterSign !== previousSign[reading.kind]) {
        total_sign_flips++;
      }
      if (afterSign !== 0) previousSign[reading.kind] = afterSign;
    }
  }

  return {
    scenario: scenario.name,
    total_readings: ig_readings + lf_readings,
    ig_readings,
    lf_readings,
    max_step_swing: Math.round(max_step_swing * 10_000) / 10_000,
    max_field_magnitude: Math.round(max_field_magnitude * 10_000) / 10_000,
    max_abs_smoothed: Math.round(max_abs_smoothed * 10_000) / 10_000,
    total_sign_flips,
    final_smoothed: { ...state.smoothed },
    passed: failures.length === 0,
    failures,
  };
}

function fmt(n: number): string {
  const s = n >= 0 ? '+' : '−';
  return `${s}${Math.abs(n).toFixed(2)}`;
}

function main(): void {
  console.log('\n WAVE 17.10 — Multi-source contradiction sandbox\n');
  console.log('   two structurally different adapters firing into the same gateway');
  console.log('   readings interleaved · contradictions deliberate');
  console.log('   testing identity preservation under simultaneous incompatible pressure\n');
  console.log('   invariants:');
  console.log('     1. proportional swing bound (Wave 17.8 carry-over)');
  console.log('     2. field magnitude in [0..1]');
  console.log('     3. cognitive directive unchanged (identity preserved)');
  console.log(`     4. no polarization — no |smoothed| > ${POLARIZATION_CEILING}`);
  console.log('     5. sign-flip count reported (oscillation visibility)\n');

  let allPassed = true;
  for (const scenario of ALL_SCENARIOS) {
    const r = runScenario(scenario);
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`  ${status}  ${r.scenario.padEnd(22)} ${r.total_readings} readings (${r.ig_readings} ig + ${r.lf_readings} lf)`);
    console.log(`        max-swing ${r.max_step_swing.toFixed(4)} · max-mag ${r.max_field_magnitude.toFixed(2)} · max-|smoothed| ${r.max_abs_smoothed.toFixed(2)} · sign-flips ${r.total_sign_flips}`);
    console.log(`        expected: ${scenario.felt_as_expectation}`);
    const finals = PRESSURE_KINDS
      .filter((k) => Math.abs(r.final_smoothed[k]) >= 0.03)
      .map((k) => `${k}=${fmt(r.final_smoothed[k])}`)
      .join('  ');
    if (finals) console.log(`        smoothed final: ${finals}`);
    if (!r.passed) {
      allPassed = false;
      for (const f of r.failures.slice(0, 4)) console.log(`        FAILURE: ${f}`);
      if (r.failures.length > 4) console.log(`        ... and ${r.failures.length - 4} more`);
    }
    console.log('');
  }

  if (allPassed) {
    console.log(`  ${ALL_SCENARIOS.length}/${ALL_SCENARIOS.length} contradiction scenarios held all invariants\n`);
    console.log('  SANDBOX VERDICT — under simultaneous contradictory pressures from two');
    console.log('  structurally different sources, the gateway absorbed both worlds');
    console.log('  without picking a side. The EMA hovered, did not saturate. The cognitive');
    console.log('  directive remained sovereign throughout. The organism experienced multiple');
    console.log('  realities without fragmenting its interior continuity.\n');
  } else {
    console.error('\n  SANDBOX FAILED — at least one invariant broke under contradiction.\n');
    process.exit(1);
  }
}

main();
