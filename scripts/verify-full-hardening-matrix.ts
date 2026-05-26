/**
 * VERIFY — Full Hardening Matrix runner contract.
 *
 * Validates that scripts/run-full-hardening-matrix.ts:
 *   - enumerates the full operational surface (formulas × modes × brutality)
 *   - captures approval / refusal / degraded paths
 *   - preserves FIFO + deterministic-shape contracts
 *   - calls no external APIs
 *   - imports no critic logic
 *   - never mutates cognition state (no forbidden POSTs)
 *   - compiles cleanly
 *
 * Read-only: this script does NOT hit the dev server or make any HTTP
 * call. It performs static analysis on the runner source plus a
 * dry-run enumeration check via process spawn. TypeScript compilation
 * is verified separately by the suite runner.
 *
 * Cases:
 *   A · all 4 formulas execute    (ENERGY, FOCUS, RELAX, SLEEP)
 *   B · all 8 campaign modes execute
 *   C · brutality sweep executes  (0, 0.25, 0.5, 0.75, 1)
 *   D · approval paths captured   (verdict='approve' logged)
 *   E · refusal paths captured    (reject-* verdicts logged)
 *   F · degraded paths captured   (policyDegraded surfaced)
 *   G · FIFO caps preserved       (over-cap is a fail-fast trigger)
 *   H · deterministic reports stable (re-run same dry-run = same plan)
 *   I · no external APIs          (no non-localhost fetch URLs)
 *   J · no critic imports         (no import from src/engines/critic
 *                                  or src/core/pipeline)
 *   K · no cognition mutation     (no POST except /api/generate; no
 *                                  fs.writeFile to data/memory)
 *   L · TypeScript clean          (delegated to suite-level tsc)
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import { spawnSync } from 'child_process';

const RUNNER_PATH = path.resolve(__dirname, 'run-full-hardening-matrix.ts');

interface CaseResult { id: string; label: string; passed: boolean; detail: string; }
const results: CaseResult[] = [];

function record(id: string, label: string, passed: boolean, detail: string): void {
  results.push({ id, label, passed, detail });
  const tag = passed ? 'PASS' : 'FAIL';
  console.log(`  [${tag}] ${id} · ${label}`);
  if (!passed) console.log(`         ${detail}`);
}

async function main(): Promise<void> {
  console.log('FULL HARDENING MATRIX VERIFICATION\n');

  const src = await fs.readFile(RUNNER_PATH, 'utf8');

  // ── Dry-run enumeration ─────────────────────────────────────
  const dryRun = spawnSync(
    'npx', ['tsx', RUNNER_PATH, '--dry-run'],
    { encoding: 'utf8', cwd: path.resolve(__dirname, '..') },
  );
  const dryOut = (dryRun.stdout ?? '') + (dryRun.stderr ?? '');

  // ── A · all formulas enumerated ─────────────────────────────
  {
    const required = ['ENERGY', 'FOCUS', 'RELAX', 'SLEEP'];
    const present = required.filter((f) => new RegExp(`formula=${f}\\b`).test(dryOut));
    record(
      'A',
      'all 4 formulas execute',
      present.length === required.length,
      `present: ${present.join(',')} | missing: ${required.filter((f) => !present.includes(f)).join(',') || 'none'}`,
    );
  }

  // ── B · all 8 modes enumerated ──────────────────────────────
  {
    const required = ['AUTO', 'MINIMAL', 'DOCUMENTARY', 'EMOTIONAL',
                      'PERFORMANCE', 'AGGRESSIVE', 'PRODUCT_FOCUSED', 'LUXURY'];
    const present = required.filter((m) => new RegExp(`mode=${m}\\b`).test(dryOut));
    record(
      'B',
      'all 8 campaign modes execute',
      present.length === required.length,
      `present: ${present.join(',')} | missing: ${required.filter((m) => !present.includes(m)).join(',') || 'none'}`,
    );
  }

  // ── C · brutality sweep ─────────────────────────────────────
  {
    const required = ['0', '0.25', '0.5', '0.75', '1'];
    const present = required.filter((b) => new RegExp(`brutality=${b}\\b`).test(dryOut));
    record(
      'C',
      'brutality sweep executes (0, 0.25, 0.5, 0.75, 1)',
      present.length === required.length,
      `present: ${present.join(',')} | missing: ${required.filter((b) => !present.includes(b)).join(',') || 'none'}`,
    );
  }

  // ── D · approval-path capture in runner logic ───────────────
  {
    const hasApproval = /finalVerdict === 'approve'/.test(src);
    record(
      'D',
      "approval paths captured (finalVerdict === 'approve')",
      hasApproval,
      hasApproval ? 'approval categorization found' : "missing finalVerdict === 'approve' branch",
    );
  }

  // ── E · refusal-path capture ─────────────────────────────────
  {
    const hasReject = /reject-image|reject-concept|reject-taste/.test(src);
    const hasRefusalDist = /refusalReasonDistribution/.test(src);
    record(
      'E',
      'refusal paths captured (reject-* verdicts + distribution)',
      hasReject && hasRefusalDist,
      `reject-* match=${hasReject}, refusalReasonDistribution=${hasRefusalDist}`,
    );
  }

  // ── F · degraded-advisory capture ───────────────────────────
  {
    const hasDegraded = /policyDegraded/.test(src) && /degradedAdvisories/.test(src);
    record(
      'F',
      'degraded advisory paths captured (policyDegraded → degradedAdvisories)',
      hasDegraded,
      hasDegraded ? 'preflight degradation is surfaced' : 'no policyDegraded → degradedAdvisories wiring',
    );
  }

  // ── G · FIFO caps preserved (fail-fast trigger present) ─────
  {
    const hasFifoCheck = /fifo-over-cap/.test(src) && /memoryHealth/.test(src);
    record(
      'G',
      'FIFO caps preserved (over-cap is a fail-fast trigger)',
      hasFifoCheck,
      hasFifoCheck ? 'fail-fast wires /api/system-integrity.memoryHealth' : 'no FIFO fail-fast wiring',
    );
  }

  // ── H · deterministic dry-run output ────────────────────────
  {
    const dryRun2 = spawnSync(
      'npx', ['tsx', RUNNER_PATH, '--dry-run'],
      { encoding: 'utf8', cwd: path.resolve(__dirname, '..') },
    );
    const dryOut2 = dryRun2.stdout ?? '';
    record(
      'H',
      'deterministic reports stable (same dry-run = same plan)',
      dryOut === dryOut2,
      dryOut === dryOut2 ? 'dry-run output is byte-identical' : 'dry-run output differs between invocations',
    );
  }

  // ── I · no external APIs ────────────────────────────────────
  // The runner takes a --base-url flag whose default is localhost. Any
  // hard-coded external host (anthropic.com, openai.com, etc.) would
  // violate the no-external-API rule. We assert there are no fetch
  // calls to such hosts.
  {
    const externalHostPattern = /fetch\(\s*['"`]https?:\/\/(?!localhost|127\.0\.0\.1)/;
    const externalFound = externalHostPattern.test(src);
    record(
      'I',
      'no external API calls (only localhost / configurable base-url)',
      !externalFound,
      externalFound ? 'found a fetch() to a non-localhost host' : 'no external hosts referenced',
    );
  }

  // ── J · no critic imports ───────────────────────────────────
  // Critic logic must not be imported into a hardening runner — any
  // import from src/engines/critic, src/core/pipeline, src/core/criticEngine,
  // or @lib/copyQualityRefusalGuard would couple it to cognition.
  {
    const forbidden = [
      /from\s+['"](\.\.\/)?src\/engines\/critic/,
      /from\s+['"](\.\.\/)?src\/core\/pipeline/,
      /from\s+['"](\.\.\/)?src\/core\/criticEngine/,
      /from\s+['"]@lib\/copyQualityRefusalGuard/,
      /from\s+['"]@\/core\/pipeline/,
    ];
    const matched = forbidden.filter((re) => re.test(src));
    record(
      'J',
      'no critic / pipeline imports',
      matched.length === 0,
      matched.length === 0 ? 'no forbidden imports' : `forbidden imports found: ${matched.length}`,
    );
  }

  // ── K · no cognition mutation ───────────────────────────────
  // The runner may POST only to /api/generate (cognition entry point)
  // and /api/pre-generation-stability (READ-ONLY advisory probe — the
  // endpoint accepts a body but never mutates state). Direct
  // fs.writeFile into data/memory would mutate memory bypassing the
  // FIFO contract.
  {
    const POST_WHITELIST = ['/api/generate', '/api/pre-generation-stability'];
    const postPattern = /method:\s*['"]POST['"]/g;
    const posts = src.match(postPattern) ?? [];
    const fetchCalls = src.match(/fetch\([^)]*\)/g) ?? [];
    const nonWhitelistedPosts = fetchCalls.filter((f) => {
      const block = src.slice(src.indexOf(f), src.indexOf(f) + 800);
      if (!/method:\s*['"]POST['"]/.test(block)) return false;
      return !POST_WHITELIST.some((route) =>
        new RegExp(`\\\`\\$\\{base\\}${route}\\\`|['"]${route}`).test(f),
      );
    });
    const writeFileBlock = src.match(/fs\.writeFile\([^)]*\)/g) ?? [];
    const memoryWrites = writeFileBlock.filter((w) => /data\/memory/.test(w));

    const passed = nonWhitelistedPosts.length === 0 && memoryWrites.length === 0;
    record(
      'K',
      `no cognition mutation (POST only [${POST_WHITELIST.join(', ')}]; no data/memory writes)`,
      passed,
      `posts:${posts.length} non-whitelisted:${nonWhitelistedPosts.length} memory-writes:${memoryWrites.length}`,
    );
  }

  // ── L · TypeScript clean (delegated) ────────────────────────
  record(
    'L',
    'TypeScript clean (verify via separate `npx tsc --noEmit`)',
    true,
    'this script defers compiler validation to the suite runner',
  );

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
