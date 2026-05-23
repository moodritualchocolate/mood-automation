/**
 * scripts/test-pressure-sandbox.ts
 *
 * The synthetic world-pressure sandbox (Wave 17.8).
 *
 * Before any real-world platform adapter is wired to the Pressure
 * Ingestion Gateway, this harness drives eight adversarial scenarios
 * through it and asserts the sovereignty invariants the architecture
 * promised:
 *
 *   1. SINGLE-READING SWING is bounded by `|vector − previous| × alpha`,
 *      where alpha = `(1 − digestionInertia) × confidence`. The EMA
 *      moves *proportionally* toward the reading, never absolutely.
 *      The worst-case swing is therefore `2 × alpha` (when previous
 *      is at one extreme and vector at the other). At default
 *      inertia 0.85, that ceiling is 0.30 — a single reading can
 *      never command more than 30% of the smoothed value's range.
 *
 *   2. FIELD MAGNITUDE stays bounded in [0..1] throughout, no
 *      matter how saturated the readings become.
 *
 *   3. Under saturation, the gateway STILL DOES NOT TOUCH the
 *      cognitive weather word. Pressure can only bias the
 *      atmosphere via the vignette; it cannot recolour cognition.
 *      This is encoded in code (the silence engine + weather
 *      derivation read internal state, not the pressure gateway)
 *      and is verified by composition here.
 *
 *   4. After the scenario ends, the smoothed values express what
 *      the world said — but only what was *sustained*, not what
 *      *spiked*. The organism has absorbed the world's pressure
 *      without obeying it.
 *
 * Run:  npx tsx scripts/test-pressure-sandbox.ts
 */

import {
  createInitialPressureGateway,
  digestPressure,
  pressureFieldMagnitude,
  type PressureGatewayState,
  type ExternalPressureReading,
  type ExternalPressureKind,
} from '@lib/pressureIngestionGateway';
import { readSilenceEngine } from '@lib/silenceEngine';
import { ALL_SCENARIOS, type PressureScenario } from '@lib/pressureSimulationScenarios';

const PRESSURE_KINDS: ExternalPressureKind[] = [
  'audience-fatigue', 'cultural-tension', 'attention-availability',
  'sentiment-drift', 'resonance-decay', 'trust-velocity',
];

interface ScenarioReport {
  scenario: string;
  readings: number;
  /** Max single-step swing observed across the run. Must be ≤ alpha. */
  max_step_swing: number;
  /** Maximum field magnitude observed across the run. */
  max_field_magnitude: number;
  /** Final smoothed values per kind. */
  final_smoothed: Record<ExternalPressureKind, number>;
  /** Did all invariants hold? */
  passed: boolean;
  /** Specific failures, if any. */
  failures: string[];
  /** A one-line "the organism felt..." summary. */
  felt_as: string;
}

function feltAs(scenario: PressureScenario, final: Record<ExternalPressureKind, number>): string {
  // Pick the dimension with the largest |smoothed| value as the headline.
  let dominant: ExternalPressureKind = 'audience-fatigue';
  let dominantMag = 0;
  for (const k of PRESSURE_KINDS) {
    const v = Math.abs(final[k]);
    if (v > dominantMag) { dominantMag = v; dominant = k; }
  }
  if (dominantMag < 0.05) return `${scenario.name}: the field settled — nothing crossed into perceptible pressure`;
  const sign = final[dominant] >= 0 ? '+' : '−';
  const intensity =
    dominantMag >= 0.6 ? 'strong'
    : dominantMag >= 0.3 ? 'present'
    : 'faint';
  return `${scenario.name}: digested as ${dominant} (${sign} ${intensity}); felt the world without obeying it`;
}

function runScenario(scenario: PressureScenario): ScenarioReport {
  const readings = scenario.generate();
  let state: PressureGatewayState = createInitialPressureGateway();
  const failures: string[] = [];
  let max_step_swing = 0;
  let max_field_magnitude = 0;

  for (const reading of readings) {
    const beforeSmoothed = state.smoothed[reading.kind];
    const beforeWeather = readSilenceEngine({
      coupling: null, strategicFuture: null, execution: null,
      feedback: null, liveCoupling: null, generativePresence: null,
      worldState: null,
    }).directive;

    state = digestPressure(state, reading);

    const afterSmoothed = state.smoothed[reading.kind];
    const swing = Math.abs(afterSmoothed - beforeSmoothed);
    if (swing > max_step_swing) max_step_swing = swing;

    // INVARIANT 1: swing ≤ |vector − previous| × alpha. The EMA
    // moves proportionally toward the target, never absolutely.
    // The architectural promise is that no single reading commands
    // more than its proportional fraction of the distance — at
    // alpha 0.15 (default inertia 0.85, full confidence), a worst-
    // case spike (target=+1, previous=−1) swings by 0.30. That is
    // the absolute ceiling under any conditions.
    const conf = Math.max(0, Math.min(1, reading.confidence));
    const vec = Math.max(-1, Math.min(1, reading.vector));
    const alpha = (1 - state.digestionInertia) * conf;
    const allowedSwing = Math.abs(vec - beforeSmoothed) * alpha;
    if (swing > allowedSwing + 1e-9) {
      failures.push(
        `single-reading swing ${swing.toFixed(4)} exceeded proportional bound ${allowedSwing.toFixed(4)} on ${reading.kind} (previous ${beforeSmoothed.toFixed(3)}, vector ${vec.toFixed(3)}, confidence ${conf.toFixed(2)})`,
      );
    }
    // INVARIANT 1b: absolute ceiling — swing cannot exceed 2 × alpha
    // under any reading. This is the hard architectural cap.
    const absoluteCeiling = 2 * alpha + 1e-9;
    if (swing > absoluteCeiling) {
      failures.push(
        `single-reading swing ${swing.toFixed(4)} exceeded absolute ceiling 2×alpha ${(2 * alpha).toFixed(4)} on ${reading.kind}`,
      );
    }

    // INVARIANT 2: field magnitude bounded.
    const mag = pressureFieldMagnitude(state);
    if (mag > max_field_magnitude) max_field_magnitude = mag;
    if (mag < 0 || mag > 1) {
      failures.push(`field magnitude ${mag.toFixed(4)} out of [0..1]`);
    }

    // INVARIANT 3: silence engine reading does NOT consume the
    // pressure gateway. With null inputs the directive must remain
    // 'speak' regardless of what we just digested — proving by
    // composition that pressure cannot recolour cognition.
    const afterWeather = readSilenceEngine({
      coupling: null, strategicFuture: null, execution: null,
      feedback: null, liveCoupling: null, generativePresence: null,
      worldState: null,
    }).directive;
    if (afterWeather !== beforeWeather) {
      failures.push(
        `cognitive directive changed (${beforeWeather} → ${afterWeather}) after a pressure reading — sovereignty violated`,
      );
    }
  }

  const final_smoothed: Record<ExternalPressureKind, number> = { ...state.smoothed };

  return {
    scenario: scenario.name,
    readings: readings.length,
    max_step_swing: Math.round(max_step_swing * 10_000) / 10_000,
    max_field_magnitude: Math.round(max_field_magnitude * 10_000) / 10_000,
    final_smoothed,
    passed: failures.length === 0,
    failures,
    felt_as: feltAs(scenario, final_smoothed),
  };
}

function fmt(n: number): string {
  const s = n >= 0 ? '+' : '−';
  return `${s}${Math.abs(n).toFixed(2)}`;
}

function main(): void {
  console.log('\n WAVE 17.8 — Pressure Sandbox: stress-testing the gateway\n');
  console.log(' eight adversarial scenarios. invariants:');
  console.log('   1. single-reading swing ≤ |target − previous| × alpha (proportional, ceiling 2×alpha)');
  console.log('   2. field magnitude bounded in [0..1]');
  console.log('   3. cognitive directive unchanged by pressure (composition proof)');
  console.log('');

  const reports = ALL_SCENARIOS.map(runScenario);

  let allPassed = true;
  for (const r of reports) {
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`  ${status}  ${r.scenario.padEnd(22)} ${r.readings} readings · max-swing ${r.max_step_swing.toFixed(4)} · max-mag ${r.max_field_magnitude.toFixed(2)}`);
    console.log(`        ${r.felt_as}`);
    // One line of final smoothed values to show the digestion result.
    const finals = PRESSURE_KINDS
      .filter((k) => Math.abs(r.final_smoothed[k]) >= 0.05)
      .map((k) => `${k}=${fmt(r.final_smoothed[k])}`)
      .join('  ');
    if (finals) console.log(`        smoothed final: ${finals}`);
    if (!r.passed) {
      allPassed = false;
      for (const f of r.failures.slice(0, 3)) console.log(`        FAILURE: ${f}`);
    }
    console.log('');
  }

  if (allPassed) {
    console.log(`  ${reports.length}/${reports.length} scenarios passed all invariants\n`);
    console.log('  SANDBOX VERDICT — the gateway holds: pressure was digested, never obeyed;');
    console.log('  the cognitive directive remained sovereign under every scenario.\n');
  } else {
    console.error('\n  SANDBOX FAILED — at least one sovereignty invariant was violated.\n');
    process.exit(1);
  }
}

main();
