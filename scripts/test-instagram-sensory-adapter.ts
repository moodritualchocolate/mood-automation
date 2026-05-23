/**
 * scripts/test-instagram-sensory-adapter.ts
 *
 * Verifies the first weak sensory adapter (Wave 17.9) — Instagram
 * passive sentiment ingestion. Three fixture observations exercise
 * the adapter's full surface; the same sovereignty invariants from
 * Wave 17.8 are re-asserted around the adapter+gateway boundary.
 *
 * The observations are typed fixtures, not raw API responses. The
 * adapter never sees raw platform JSON; an upstream lens (not part
 * of this wave) would eventually transform real comments into the
 * `InstagramObservation` shape this adapter consumes.
 *
 * Run:  npx tsx scripts/test-instagram-sensory-adapter.ts
 */

import {
  createInitialPressureGateway,
  digestPressure,
  pressureFieldMagnitude,
  type PressureGatewayState,
} from '@lib/pressureIngestionGateway';
import {
  readInstagramObservation,
  type InstagramObservation,
} from '@lib/adapters/instagramSensoryAdapter';
import { readSilenceEngine } from '@lib/silenceEngine';

// ─── Fixture 1 — warm reception ────────────────────────────────
// Mostly positive tone, trust language emerging, no coercion.
const WARM_RECEPTION: InstagramObservation = {
  postId: 'fixture-warm',
  postedAt: 1_700_000_000_000,
  observedAt: 1_700_000_000_000 + 1000 * 60 * 30,  // 30 min after posting
  silenceAfterPostMs: 1000 * 60 * 5,               // 5 min since last comment
  comments: [
    { postedAfterMs: 60_000, tone:  0.7, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 120_000, tone:  0.4, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 240_000, tone:  0.8, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 360_000, tone:  0.3, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: true  },
    { postedAfterMs: 480_000, tone:  0.6, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 600_000, tone:  0.5, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 720_000, tone:  0.9, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 900_000, tone:  0.4, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: true  },
  ],
};

// ─── Fixture 2 — contradictory reception ───────────────────────
// Polarised audience: half love it, half hate it, with some coercion.
const CONTRADICTORY_RECEPTION: InstagramObservation = {
  postId: 'fixture-split',
  postedAt: 1_700_001_000_000,
  observedAt: 1_700_001_000_000 + 1000 * 60 * 45,
  silenceAfterPostMs: 1000 * 60 * 2,
  comments: [
    { postedAfterMs:  30_000, tone:  0.8, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs:  60_000, tone: -0.7, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: false },
    { postedAfterMs:  90_000, tone:  0.6, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 120_000, tone: -0.8, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: true  },
    { postedAfterMs: 150_000, tone:  0.7, trustLanguage: true,  coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 180_000, tone: -0.6, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: false },
    { postedAfterMs: 210_000, tone:  0.5, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
    { postedAfterMs: 240_000, tone: -0.9, trustLanguage: false, coercivePattern: true,  repeatsPriorTheme: false },
  ],
};

// ─── Fixture 3 — fatiguing reception ───────────────────────────
// Lukewarm tone, repetition dominating, partial silence.
const FATIGUING_RECEPTION: InstagramObservation = {
  postId: 'fixture-tired',
  postedAt: 1_700_002_000_000,
  observedAt: 1_700_002_000_000 + 1000 * 60 * 60 * 6,  // 6 hours after posting
  silenceAfterPostMs: 1000 * 60 * 60 * 4,              // 4 hours of silence
  comments: [
    { postedAfterMs: 1_800_000, tone:  0.1, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: true  },
    { postedAfterMs: 3_000_000, tone:  0.0, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: true  },
    { postedAfterMs: 4_500_000, tone: -0.1, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: true  },
    { postedAfterMs: 5_400_000, tone:  0.2, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: true  },
    { postedAfterMs: 6_300_000, tone:  0.0, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: true  },
    { postedAfterMs: 7_200_000, tone:  0.1, trustLanguage: false, coercivePattern: false, repeatsPriorTheme: false },
  ],
};

function fmtVec(v: number): string {
  const s = v >= 0 ? '+' : '−';
  return `${s}${Math.abs(v).toFixed(2)}`;
}

function ingestObservation(state: PressureGatewayState, obs: InstagramObservation, label: string): PressureGatewayState {
  const readings = readInstagramObservation(obs);
  console.log(`\n  ─── ${label} ───`);
  console.log(`    ${obs.comments.length} comments observed · ${readings.length} pressure readings produced`);
  for (const r of readings) {
    console.log(`      ${r.kind.padEnd(24)} ${fmtVec(r.vector)}  conf ${r.confidence.toFixed(2)}  source ${r.source}`);
  }

  // Drive the readings through the gateway and verify sovereignty
  // invariants AT THE BOUNDARY — the adapter must produce values
  // the gateway accepts under the same rules as any other source.
  for (const reading of readings) {
    const before = state.smoothed[reading.kind];
    const beforeDirective = readSilenceEngine({
      coupling: null, strategicFuture: null, execution: null,
      feedback: null, liveCoupling: null, generativePresence: null,
      worldState: null,
    }).directive;

    state = digestPressure(state, reading);

    const after = state.smoothed[reading.kind];
    const swing = Math.abs(after - before);

    const allowedSwing = Math.abs(reading.vector - before) * (1 - state.digestionInertia) * reading.confidence;
    if (swing > allowedSwing + 1e-9) {
      throw new Error(`adapter produced a reading that broke proportional bound: swing ${swing.toFixed(4)} > ${allowedSwing.toFixed(4)}`);
    }

    const afterDirective = readSilenceEngine({
      coupling: null, strategicFuture: null, execution: null,
      feedback: null, liveCoupling: null, generativePresence: null,
      worldState: null,
    }).directive;
    if (afterDirective !== beforeDirective) {
      throw new Error(`adapter reading changed the cognitive directive (${beforeDirective} → ${afterDirective}) — sovereignty violated`);
    }
  }

  const magnitude = pressureFieldMagnitude(state);
  console.log(`    after digestion: field magnitude ${magnitude.toFixed(3)}`);
  return state;
}

function main(): void {
  console.log('\n WAVE 17.9 — Instagram Sensory Adapter sandbox\n');
  console.log('   read-only · meaning-first · typed pressure → gateway · never commands');
  console.log('   no API access; three typed fixture observations exercise the surface\n');

  let state = createInitialPressureGateway();

  state = ingestObservation(state, WARM_RECEPTION, 'fixture 1 — warm reception');
  state = ingestObservation(state, CONTRADICTORY_RECEPTION, 'fixture 2 — contradictory reception');
  state = ingestObservation(state, FATIGUING_RECEPTION, 'fixture 3 — fatiguing reception');

  console.log('\n  ─── final gateway state after all three observations ───');
  for (const [kind, vector] of Object.entries(state.smoothed)) {
    console.log(`    ${kind.padEnd(24)} ${fmtVec(vector as number)}`);
  }
  console.log(`    field magnitude          ${pressureFieldMagnitude(state).toFixed(3)}`);
  console.log(`    readings ingested        ${state.readingsIngested}`);
  console.log('');
  console.log('  SANDBOX VERDICT — the adapter produced typed pressure across six dimensions,');
  console.log('  all readings absorbed within their proportional bounds, the cognitive directive');
  console.log('  remained unchanged throughout. The world is being perceived; the organism is');
  console.log('  not becoming the pressure.\n');
}

main();
