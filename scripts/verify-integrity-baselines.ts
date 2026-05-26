/**
 * scripts/verify-integrity-baselines.ts
 *
 * Deterministic verification for the integrity-baseline anchoring
 * layer.
 *
 *   A · baseline generated deterministically
 *   B · same output matches baseline
 *   C · missing field → shape-drift
 *   D · renamed field → shape-drift
 *   E · value changes do not fail baseline
 *   F · missing baseline reports missing-baseline
 *   G · no runtime mutation (engine leaves inputs unchanged)
 *   H · no critic imports
 *   I · no external APIs (network/spawn) in baseline sources
 *   J · TypeScript clean (verified by `npx tsc --noEmit`)
 *
 * Run: npx tsx scripts/verify-integrity-baselines.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  deriveShape, compareShapes, compareLayer,
  type ShapeNode,
} from '../lib/integrityBaselineEngine';
import {
  createIntegrityBaselineReader, anchorBaseline, fingerprintShape,
  KNOWN_BASELINE_LAYERS,
} from '../lib/integrityBaselineMemory';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('INTEGRITY BASELINE ANCHORING — VERIFICATION\n');

async function main() {
  // ── A. baseline derived deterministically ────────────────────
  {
    const sample = {
      overall: 5,
      rows: [
        { name: 'a', score: 7, flags: [] },
        { name: 'b', score: 3, flags: ['warn'] },
      ],
      meta: null,
    };
    const s1 = deriveShape(sample);
    const s2 = deriveShape(sample);
    const f1 = fingerprintShape(s1);
    const f2 = fingerprintShape(s2);
    check('A · shape derivation + fingerprint deterministic',
      JSON.stringify(s1) === JSON.stringify(s2) && f1 === f2,
      `fingerprint=${f1}`);
  }

  // ── B. same output matches baseline ──────────────────────────
  {
    const value = { x: 1, y: 'two', z: [{ a: true }] };
    const baseline = deriveShape(value);
    const current = deriveShape({ x: 999, y: 'different string', z: [{ a: false }] });
    const result = compareShapes(baseline, current);
    check('B · same shape matches (values differ, structure identical)',
      result.matched && result.issues.length === 0,
      `matched=${result.matched}`);
  }

  // ── C. missing field → shape-drift ───────────────────────────
  {
    const baselineValue = { a: 1, b: 2, c: 3 };
    const currentValue = { a: 1, b: 2 };
    const baseline = deriveShape(baselineValue);
    const current = deriveShape(currentValue);
    const result = compareShapes(baseline, current);
    check('C · missing field detected',
      !result.matched && result.issues.some((i) => i.kind === 'missing-field' && i.detail.includes("'c'")),
      `issues=${JSON.stringify(result.issues.map((i) => i.kind))}`);
  }

  // ── D. renamed field → shape-drift (missing + extra) ─────────
  {
    const baselineValue = { trustImpact: 4 };
    const currentValue = { trustEffect: 4 };          // renamed
    const baseline = deriveShape(baselineValue);
    const current = deriveShape(currentValue);
    const result = compareShapes(baseline, current);
    const missing = result.issues.some((i) => i.kind === 'missing-field');
    const extra   = result.issues.some((i) => i.kind === 'extra-field');
    check('D · renamed field detected (missing + extra)',
      !result.matched && missing && extra,
      `missing=${missing} extra=${extra} totalIssues=${result.issues.length}`);
  }

  // ── E. value changes do not fail baseline ────────────────────
  {
    const baselineValue = {
      score: 7,
      label: 'medium',
      timestamps: [1, 2, 3],
      nested: { count: 10, active: true },
    };
    const currentValue = {
      score: 2.4,
      label: 'low',
      timestamps: [999, 1000],
      nested: { count: -5, active: false },
    };
    const result = compareShapes(deriveShape(baselineValue), deriveShape(currentValue));
    check('E · pure value changes do not break baseline',
      result.matched,
      `matched=${result.matched} issues=${result.issues.length}`);
  }

  // ── F. missing baseline → missing-baseline status ────────────
  {
    const row = compareLayer({
      layer: 'unknown-layer',
      current: { foo: 'bar' },
      baseline: null,
    });
    check('F · missing baseline reports missing-baseline status',
      row.status === 'missing-baseline' &&
      row.issueSummary !== null && row.issueSummary.includes('not yet anchored'),
      `status=${row.status} summary="${row.issueSummary}"`);
  }

  // ── G. no runtime mutation ───────────────────────────────────
  {
    const value = { rows: [{ a: 1 }, { a: 2 }], meta: null };
    const before = JSON.stringify(value);
    deriveShape(value);
    deriveShape(value);
    const shape = deriveShape(value);
    compareShapes(shape, deriveShape(value));
    const after = JSON.stringify(value);
    check('G · no runtime mutation — engine leaves inputs unchanged',
      before === after, `bytes ${before.length} → ${after.length}`);
  }

  // ── H. no critic imports ─────────────────────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/integrityBaselineEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/integrityBaselineMemory.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const badImports = ['tasteJudge', 'humanReaction', 'campaignDecision', 'perceptionCritic'];
    const found = badImports.filter((needle) =>
      new RegExp(`from\\s+['"][^'"]*${needle}[^'"]*['"]`, 'i').test(combined),
    );
    const criticPath = /from\s+['"][^'"]*\/critic[^'"]*['"]/i.test(combined);
    check('H · no critic imports in baseline sources',
      found.length === 0 && !criticPath,
      found.length === 0 && !criticPath ? 'verified clean' : `disallowed: ${found.join(', ')}`);
  }

  // ── I. no external APIs (network/spawn) ──────────────────────
  {
    const sources = await Promise.all([
      fs.readFile(path.resolve(process.cwd(), 'lib/integrityBaselineEngine.ts'), 'utf8'),
      fs.readFile(path.resolve(process.cwd(), 'lib/integrityBaselineMemory.ts'), 'utf8'),
    ]);
    const combined = sources.join('\n');
    const forbidden = ['fetch(', 'XMLHttpRequest', 'http.request', 'https.request',
                       "from 'http'", "from 'https'", "from 'axios'", "from 'undici'",
                       'child_process', 'spawn(', 'exec('];
    const found = forbidden.filter((needle) => combined.includes(needle));
    check('I · no external network/spawn calls in baseline sources',
      found.length === 0,
      found.length === 0 ? 'verified clean (fs is the only I/O)' : `disallowed: ${found.join(', ')}`);
  }

  // ── J. anchor + read round-trip (uses tmp dir, verifies the
  //       write-path requires explicit operator intent) ────────
  {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'baseline-'));
    // Refuse-without-intent: must throw.
    let threwWithoutIntent = false;
    try {
      // @ts-expect-error — intentionally calling without confirmOperatorIntent.
      await anchorBaseline({ layer: 'x', shape: { kind: 'primitive', types: ['null'] }, source: 'test', dir: tmpDir });
    } catch {
      threwWithoutIntent = true;
    }
    // With explicit intent: writes.
    const shape: ShapeNode = { kind: 'object', properties: {
      score: { kind: 'primitive', types: ['number'] },
      rows: { kind: 'array', element: { kind: 'object', properties: {
        a: { kind: 'primitive', types: ['number'] },
      }}},
    }};
    await anchorBaseline({ layer: 'cog-test', shape, source: 'verify', confirmOperatorIntent: true, dir: tmpDir });
    const reader = createIntegrityBaselineReader(tmpDir);
    const baselineFile = await reader.readBaseline('cog-test');
    const missing = await reader.readBaseline('not-yet-anchored');
    await fs.rm(tmpDir, { recursive: true, force: true });
    check('J · anchor refuses without operator intent + round-trips with it',
      threwWithoutIntent && baselineFile !== null &&
      baselineFile.layer === 'cog-test' &&
      baselineFile.shapeFingerprint.startsWith('fnv1a-') &&
      missing === null,
      `refused=${threwWithoutIntent} written=${!!baselineFile} fingerprint=${baselineFile?.shapeFingerprint}`);
  }

  // ── K. layer registry exposes 15 anchored layers ──────────────
  {
    check('K · KNOWN_BASELINE_LAYERS registry exposes 15 anchored layers',
      KNOWN_BASELINE_LAYERS.length === 15,
      `count=${KNOWN_BASELINE_LAYERS.length}`);
  }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
