/**
 * scripts/verify-policy-audit.ts
 *
 * Deterministic verification for the Copy-Quality Policy Audit Trail.
 * Drives the helper across cases A–J:
 *   A. one generation creates one audit entry
 *   B. explicit true records override true
 *   C. explicit false records override false
 *   D. auto-applied records auto-applied
 *   E. missing copyQuality does not crash audit
 *   F. FIFO cap stable
 *   G. audit panel renders (view builder produces present=true)
 *   H. generation behavior unchanged (verified by separate harnesses)
 *   I. TypeScript clean (verified by `npx tsc --noEmit`)
 *   J. no external execution (verified by file inspection)
 *
 * Run: npx tsx scripts/verify-policy-audit.ts
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  createPolicyAuditStore,
  buildAuditEntry,
  buildAuditId,
  classifyOverride,
  recordPolicyAudit,
  POLICY_AUDIT_LIMIT,
} from '../lib/copyQualityPolicyAudit';
import { buildPolicyAuditView } from '../lib/copyQualityPolicyAuditView';

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('COPY-QUALITY POLICY AUDIT TRAIL — VERIFICATION\n');

async function main() {
  // Use an isolated temp memory dir so the verification doesn't
  // pollute real audit history.
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'policy-audit-'));
  process.env.MOOD_MEMORY_DIR = tmpDir;
  // Clear global cache so the store starts fresh.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).__moodPolicyAudit = undefined;

  const baseEntryInput = {
    at: 1700000000000,
    formula: 'ENERGY' as const,
    campaignMode: 'Documentary' as const,
    brutality: 0.9,
    attempt: 1,
    preflightRecommendedEnabled: true,
    preflightSource: 'policy-default' as const,
    policyBand: 'strict' as const,
    confidence: 7,
    suggestedIntegrityThreshold: 4.0,
    suggestedBrutalityThreshold: 0.8,
    reasonCodes: ['preflight:omitted-flag', 'mode-base[Documentary]:+3'],
    outcomeVerdict: 'approve' as const,
    outcomeReasons: [],
    copyIntegrity: 7.2,
    trustSafety: 7.0,
    dignitySafety: 8.0,
    repetitionConcern: 3.0,
  };

  // ── A. one generation creates one audit entry ────────────────
  {
    const store = createPolicyAuditStore(tmpDir);
    await store.reset();
    const entry = buildAuditEntry({
      ...baseEntryInput,
      requestedFlag: undefined,
      finalAppliedEnabled: true,
      policyRecommendsEnabled: true,
    });
    await store.append(entry);
    const state = await store.read();
    check('A · one generation creates one audit entry',
      state.entries.length === 1 && state.totalEntries === 1,
      `entries=${state.entries.length} totalEntries=${state.totalEntries}`);
  }

  // ── B. explicit true records override true ───────────────────
  {
    const cls = classifyOverride({
      requestedFlag: true, policyRecommendsEnabled: true, finalAppliedEnabled: true,
    });
    const entry = buildAuditEntry({
      ...baseEntryInput,
      requestedFlag: true,
      preflightSource: 'explicit-true',
      preflightRecommendedEnabled: true,
      finalAppliedEnabled: true,
      policyRecommendsEnabled: true,
    });
    check('B · explicit true → override type explicit-override-true',
      cls === 'explicit-override-true' && entry.overrideType === 'explicit-override-true',
      `classify=${cls} entry.overrideType=${entry.overrideType}`);
  }

  // ── C. explicit false records override false ─────────────────
  {
    const cls = classifyOverride({
      requestedFlag: false, policyRecommendsEnabled: false, finalAppliedEnabled: false,
    });
    const entry = buildAuditEntry({
      ...baseEntryInput,
      requestedFlag: false,
      preflightSource: 'explicit-false',
      preflightRecommendedEnabled: false,
      finalAppliedEnabled: false,
      policyRecommendsEnabled: false,
      policyBand: 'off',
    });
    check('C · explicit false (policy off) → explicit-override-false',
      cls === 'explicit-override-false' && entry.overrideType === 'explicit-override-false',
      `classify=${cls} entry.overrideType=${entry.overrideType}`);
  }

  // ── C2. explicit false but policy recommended → recommended-only
  {
    const cls = classifyOverride({
      requestedFlag: false, policyRecommendsEnabled: true, finalAppliedEnabled: false,
    });
    check('C2 · explicit false but policy recommended → recommended-only',
      cls === 'recommended-only',
      `classify=${cls}`);
  }

  // ── D. auto-applied records auto-applied ─────────────────────
  {
    const cls = classifyOverride({
      requestedFlag: undefined, policyRecommendsEnabled: true, finalAppliedEnabled: true,
    });
    const entry = buildAuditEntry({
      ...baseEntryInput,
      requestedFlag: undefined,
      finalAppliedEnabled: true,
      policyRecommendsEnabled: true,
    });
    check('D · omitted + policy-default enabled → auto-applied',
      cls === 'auto-applied' && entry.overrideType === 'auto-applied',
      `classify=${cls} entry.overrideType=${entry.overrideType}`);
  }

  // ── D2. omitted + policy off → left-disabled ────────────────
  {
    const cls = classifyOverride({
      requestedFlag: undefined, policyRecommendsEnabled: false, finalAppliedEnabled: false,
    });
    check('D2 · omitted + policy off → left-disabled',
      cls === 'left-disabled',
      `classify=${cls}`);
  }

  // ── E. missing copyQuality does not crash audit ──────────────
  {
    const store = createPolicyAuditStore(tmpDir);
    await store.reset();
    const entry = buildAuditEntry({
      ...baseEntryInput,
      requestedFlag: undefined,
      finalAppliedEnabled: true,
      policyRecommendsEnabled: true,
      copyIntegrity: null,
      trustSafety: null,
      dignitySafety: null,
      repetitionConcern: null,
    });
    await store.append(entry);
    const state = await store.read();
    check('E · missing copyQuality records null axes',
      state.entries.length === 1 &&
      state.entries[0].copyIntegrity === null &&
      state.entries[0].trustSafety === null &&
      state.entries[0].dignitySafety === null &&
      state.entries[0].repetitionConcern === null,
      `axes=null×4 entry.id=${state.entries[0].id}`);
  }

  // ── F. FIFO cap stable at POLICY_AUDIT_LIMIT ─────────────────
  {
    const store = createPolicyAuditStore(tmpDir);
    await store.reset();
    for (let i = 0; i < POLICY_AUDIT_LIMIT + 25; i++) {
      const entry = buildAuditEntry({
        ...baseEntryInput,
        at: baseEntryInput.at + i,
        attempt: i,
        requestedFlag: undefined,
        finalAppliedEnabled: true,
        policyRecommendsEnabled: true,
      });
      await store.append(entry);
    }
    const state = await store.read();
    const oldestId = state.entries[0]?.id;
    const newestId = state.entries[state.entries.length - 1]?.id;
    check('F · FIFO cap stable at POLICY_AUDIT_LIMIT',
      state.entries.length === POLICY_AUDIT_LIMIT &&
      state.totalEntries === POLICY_AUDIT_LIMIT + 25 &&
      newestId !== oldestId,
      `entries=${state.entries.length}/${POLICY_AUDIT_LIMIT} totalEntries=${state.totalEntries}`);
  }

  // ── G. audit view builder renders present=true ──────────────
  {
    const store = createPolicyAuditStore(tmpDir);
    const state = await store.read();
    const view = buildPolicyAuditView(state);
    check('G · audit view builder produces present view with rankings',
      view.present === true &&
      view.totalAudited > 0 &&
      view.formulaPressureRanking.length > 0 &&
      view.modeRiskRanking.length > 0 &&
      view.recentEntries.length > 0,
      `present=${view.present} total=${view.totalAudited} formulas=${view.formulaPressureRanking.length} ` +
      `modes=${view.modeRiskRanking.length} recent=${view.recentEntries.length}`);
  }

  // ── G2. empty state view is safe (no-history) ───────────────
  {
    const view = buildPolicyAuditView(null);
    check('G2 · empty state → present=false, statement set',
      view.present === false && view.statement.length > 0,
      `present=${view.present} statement="${view.statement}"`);
  }

  // ── Extra: deterministic ID builder ─────────────────────────
  {
    const id1 = buildAuditId(1700000000000, 'ENERGY', 'Documentary', 3);
    const id2 = buildAuditId(1700000000000, 'ENERGY', 'Documentary', 3);
    const id3 = buildAuditId(1700000000000, 'ENERGY', null, 3);
    check('Extra · deterministic ID + null mode → "auto"',
      id1 === id2 && id1 !== id3 && id3.includes('-auto-'),
      `id1=${id1} id3=${id3}`);
  }

  // ── H. recordPolicyAudit swallows write failures ────────────
  // Force a failure by pointing the dir at a path whose parent is a
  // regular file. mkdir/writeFile both reject with ENOTDIR — proves
  // generation is never blocked by a broken audit destination.
  {
    const blocker = path.join(tmpDir, 'blocker-file');
    await fs.writeFile(blocker, 'not-a-dir');
    process.env.MOOD_MEMORY_DIR = path.join(blocker, 'unreachable');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodPolicyAudit = undefined;
    let didThrow = false;
    try {
      await recordPolicyAudit({
        ...baseEntryInput,
        requestedFlag: undefined,
        finalAppliedEnabled: true,
        policyRecommendsEnabled: true,
      });
    } catch {
      didThrow = true;
    }
    check('H · recordPolicyAudit swallows write failure (non-blocking)',
      didThrow === false,
      `recordPolicyAudit threw=${didThrow} (expected false)`);
    process.env.MOOD_MEMORY_DIR = tmpDir;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__moodPolicyAudit = undefined;
  }

  // ── Cleanup ──────────────────────────────────────────────────
  try { await fs.rm(tmpDir, { recursive: true, force: true }); } catch { /* ignore */ }

  console.log(`\n${passed} passed · ${failed} failed`);
  process.exit(failed === 0 ? 0 : 1);
}

void main().catch((e) => {
  console.error(e);
  process.exit(1);
});
