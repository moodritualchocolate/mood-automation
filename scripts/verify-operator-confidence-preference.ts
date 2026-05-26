/**
 * scripts/verify-operator-confidence-preference.ts
 *
 * Deterministic verification for the Operator Confidence Preference
 * layer (visual overlay only).
 *
 *   A · same preferences → same view
 *   B · preference update persists
 *   C · raw projections unchanged (calibration sources do not import
 *       operator preference)
 *   D · branch rankings unchanged (lifecycle / counterfactual sources
 *       do not import operator preference)
 *   E · critic untouched (no critic imports anywhere)
 *   F · generation untouched (pipeline does not import operator
 *       preference; route surfaces it only via fetch in studio)
 *   G · no external APIs
 *   H · deterministic outputs
 *   I · FIFO/history stable
 *   J · TypeScript clean (verified by `npx tsc --noEmit`)
 *
 * Run: npx tsx scripts/verify-operator-confidence-preference.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  KNOWN_PROJECTION_TYPES, type OperatorPreference,
  clampWeight, labelForWeight,
} from '../lib/operatorConfidencePreference';
import {
  applyPreferenceUpdate, createInitialOperatorConfidencePreferenceMemory,
  createOperatorConfidencePreferenceMemoryStore, HISTORY_LIMIT,
  getCurrentPreference,
} from '../lib/operatorConfidencePreferenceMemory';
import { buildOperatorConfidencePreferenceView } from '../lib/operatorConfidencePreferenceView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('OPERATOR CONFIDENCE PREFERENCE — VERIFICATION\n');

function pref(over: Partial<OperatorPreference> = {}): OperatorPreference {
  return {
    operatorId: 'studio',
    projectionType: 'trust-optimal',
    confidenceWeight: 70,
    reasonNote: null,
    updatedAt: 1700000000000,
    ...over,
  };
}

async function main() {
  // ── A. same preferences → same view ──────────────────────────
  {
    let mem = createInitialOperatorConfidencePreferenceMemory();
    mem = applyPreferenceUpdate(mem, pref({ projectionType: 'trust-optimal', confidenceWeight: 80 }));
    mem = applyPreferenceUpdate(mem, pref({ projectionType: 'fatigue-recovery', confidenceWeight: 60 }));
    const at = 1700000000000;
    const v1 = buildOperatorConfidencePreferenceView({ memory: mem, operatorId: 'studio', at });
    const v2 = buildOperatorConfidencePreferenceView({ memory: mem, operatorId: 'studio', at });
    check('A · same preferences → same view',
      JSON.stringify(v1) === JSON.stringify(v2),
      `prefs=${v1.preferences.length} updates=${v1.totalUpdates}`);
  }

  // ── B. preference update persists ────────────────────────────
  {
    let mem = createInitialOperatorConfidencePreferenceMemory();
    mem = applyPreferenceUpdate(mem, pref({
      projectionType: 'novelty-led', confidenceWeight: 30, reasonNote: 'historically overestimates',
    }));
    const stored = getCurrentPreference(mem, 'studio', 'novelty-led');
    const v = buildOperatorConfidencePreferenceView({
      memory: mem, operatorId: 'studio', at: 1700000000000,
    });
    const novelty = v.preferences.find((p) => p.projectionType === 'novelty-led');
    check('B · preference update persists with reason note',
      !!stored && stored.confidenceWeight === 30 && stored.reasonNote === 'historically overestimates' &&
      !!novelty && novelty.confidenceWeight === 30 && novelty.confidenceLabel === 'low',
      novelty ? `weight=${novelty.confidenceWeight} label=${novelty.confidenceLabel} note=${novelty.reasonNote}` : 'NOT FOUND');
  }

  // ── C. raw projections unchanged (static check) ──────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/counterfactualCognitionEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/strategicOutcomeIntelligence.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/projectionCalibrationEngine.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const referencesPreference = /from\s+['"][^'"]*operatorConfidencePreference[^'"]*['"]/i.test(combined);
    check('C · raw projection engines do not import operator preference',
      !referencesPreference,
      referencesPreference ? 'leak detected' : 'verified clean — projection engines are isolated from operator slider state');
  }

  // ── D. branch rankings unchanged (static check) ──────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/campaignLifecycleEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/branchActivationLog.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const referencesPreference = /from\s+['"][^'"]*operatorConfidencePreference[^'"]*['"]/i.test(combined);
    check('D · branch / lifecycle engines do not import operator preference',
      !referencesPreference,
      referencesPreference ? 'leak detected' : 'verified clean — branch rankings unaffected by operator sliders');
  }

  // ── E. critic untouched (static check) ───────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorConfidencePreference.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorConfidencePreferenceMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorConfidencePreferenceView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('E · no critic imports in operator preference sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── F. generation untouched (static check) ───────────────────
  {
    const route = await fs.readFile(path.resolve(process.cwd(), 'app/api/generate/route.ts'), 'utf8');
    const pipeline = await fs.readFile(path.resolve(process.cwd(), 'src/core/pipeline.ts'), 'utf8');
    const routeRefs = /from\s+['"][^'"]*operatorConfidencePreference[^'"]*['"]/i.test(route);
    const pipelineRefs = /from\s+['"][^'"]*operatorConfidencePreference[^'"]*['"]/i.test(pipeline);
    check('F · generation route + pipeline do not import operator preference',
      !routeRefs && !pipelineRefs,
      !routeRefs && !pipelineRefs ? 'verified clean — generation paths isolated from operator sliders' : `leak: route=${routeRefs} pipeline=${pipelineRefs}`);
  }

  // ── G. no external APIs ──────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorConfidencePreference.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorConfidencePreferenceMemory.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/operatorConfidencePreferenceView.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'"];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('G · no external APIs in operator preference sources',
      found.length === 0,
      found.length === 0 ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── H. deterministic outputs (multiple calls, byte-identical) ─
  {
    let mem = createInitialOperatorConfidencePreferenceMemory();
    for (const t of KNOWN_PROJECTION_TYPES) {
      mem = applyPreferenceUpdate(mem, pref({ projectionType: t, confidenceWeight: 50 + (t.length % 5) * 10 }));
    }
    const at = 1700000000000;
    const v1 = buildOperatorConfidencePreferenceView({ memory: mem, operatorId: 'studio', at });
    const v2 = buildOperatorConfidencePreferenceView({ memory: mem, operatorId: 'studio', at });
    const v3 = buildOperatorConfidencePreferenceView({ memory: mem, operatorId: 'studio', at });
    check('H · deterministic — three calls produce byte-identical view',
      JSON.stringify(v1) === JSON.stringify(v2) &&
      JSON.stringify(v2) === JSON.stringify(v3),
      `prefs=${v1.preferences.length} labels=${v1.preferences.map((p) => p.confidenceLabel).join(',')}`);
  }

  // ── I. FIFO/history stable ───────────────────────────────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'opcp-'));
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodOperatorConfidencePreference = undefined;
    const store = createOperatorConfidencePreferenceMemoryStore(tmpDir);
    await store.reset();
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) {
      await store.update(pref({
        projectionType: KNOWN_PROJECTION_TYPES[i % KNOWN_PROJECTION_TYPES.length],
        confidenceWeight: (i * 7) % 100,
        updatedAt: 1700000000000 + i,
      }));
    }
    const state = await store.read();
    check('I · FIFO history capped at HISTORY_LIMIT, current map preserved',
      state.history.length === HISTORY_LIMIT &&
      state.totalUpdates === HISTORY_LIMIT + 20 &&
      Object.keys(state.current).length === KNOWN_PROJECTION_TYPES.length,
      `history=${state.history.length}/${HISTORY_LIMIT} total=${state.totalUpdates} current=${Object.keys(state.current).length}`);
    await fs.rm(tmpDir, { recursive: true, force: true });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodOperatorConfidencePreference = undefined;
  }

  // ── J. label boundaries deterministic ────────────────────────
  {
    const cases: Array<[number, string]> = [
      [0, 'very-low'], [10, 'very-low'], [20, 'very-low'],
      [21, 'low'], [30, 'low'], [40, 'low'],
      [41, 'medium'], [50, 'medium'], [60, 'medium'],
      [61, 'medium-high'], [70, 'medium-high'], [80, 'medium-high'],
      [81, 'high'], [95, 'high'], [100, 'high'],
      [-5, 'very-low'],   // clamp
      [150, 'high'],      // clamp
    ];
    const wrong = cases.filter(([w, expected]) => {
      const got = labelForWeight(clampWeight(w));
      return got !== expected;
    });
    check('J · label boundaries deterministic across 0..100 + clamp',
      wrong.length === 0,
      wrong.length === 0 ? `all ${cases.length} boundary cases mapped correctly` : `wrong: ${JSON.stringify(wrong)}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
