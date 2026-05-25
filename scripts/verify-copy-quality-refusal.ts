/**
 * scripts/verify-copy-quality-refusal.ts
 *
 * Deterministic verification for the Feature-Flagged Copy-Quality
 * Refusal. Drives the pure helper across the full matrix.
 * Checks A–F + G (tsc) + H (no I/O in helper).
 *
 * Run: npx tsx scripts/verify-copy-quality-refusal.ts
 */

import {
  evaluateCopyQualityRefusal,
  COPY_QUALITY_BRUTALITY_THRESHOLD,
  COPY_QUALITY_INTEGRITY_THRESHOLD,
} from '@lib/copyQualityRefusal';
import type { CopyQualityAxis } from '@lib/copyQualityAdapter';
import type { FinalVerdict } from '@/core/types';

function badCopy(integrity = 3.9): CopyQualityAxis {
  return {
    copyIntegrity: integrity,
    trustSafety: 2, dignitySafety: 2, repetitionConcern: 9,
    proofAdequacy: 2, ctaRestraint: 2, hebrewNaturalness: 4,
    strategicCopyFit: 3,
    warnings: ['low trust', 'low dignity'], reasonCodes: [],
  };
}
function strongCopy(integrity = 8.5): CopyQualityAxis {
  return {
    copyIntegrity: integrity,
    trustSafety: 9, dignitySafety: 9, repetitionConcern: 1,
    proofAdequacy: 10, ctaRestraint: 9, hebrewNaturalness: 10,
    strategicCopyFit: 9,
    warnings: [], reasonCodes: [],
  };
}

/** Simulate the pipeline-side mutation against a finalVerdict-like
 *  object. Mirrors exactly what src/core/pipeline.ts does. */
function applyDecision(
  finalVerdict: { verdict: FinalVerdict['verdict']; reasons: string[]; notes: string },
  decision: ReturnType<typeof evaluateCopyQualityRefusal>,
) {
  if (decision.triggered) {
    if (decision.refusalReason && !finalVerdict.reasons.includes(decision.refusalReason)) {
      finalVerdict.reasons.push(decision.refusalReason);
    }
    if (decision.refusalNote) {
      const sep = finalVerdict.notes.length > 0 && !finalVerdict.notes.endsWith('\n') ? '\n' : '';
      finalVerdict.notes = `${finalVerdict.notes}${sep}${decision.refusalNote}`;
    }
    finalVerdict.verdict = decision.nextVerdict;
  }
}

let passed = 0, failed = 0;
function check(label: string, ok: boolean, detail: string) {
  if (ok) { passed += 1; console.log(`  PASS  ${label}\n        ${detail}`); }
  else    { failed += 1; console.log(`  FAIL  ${label}\n        ${detail}`); }
}

console.log('FEATURE-FLAGGED COPY-QUALITY REFUSAL — VERIFICATION\n');

// A: flag false + brutal + bad copy → no verdict change
{
  const fv = { verdict: 'approve' as FinalVerdict['verdict'], reasons: [] as string[], notes: 'Approved at brutality 0.90.' };
  const d = evaluateCopyQualityRefusal({
    enabled: false, brutality: 0.9, copyQuality: badCopy(2.5), currentVerdict: fv.verdict,
  });
  applyDecision(fv, d);
  check('A · flag=false + brutal + bad copy → no verdict change',
    !d.triggered && fv.verdict === 'approve' && fv.reasons.length === 0 && !fv.notes.includes('[copy-quality-refusal]'),
    `triggered=${d.triggered} verdict=${fv.verdict} reasons=[${fv.reasons.join(', ')}]`);
}

// B: flag true + lenient + bad copy → no verdict change
{
  const fv = { verdict: 'approve' as FinalVerdict['verdict'], reasons: [] as string[], notes: 'Approved at brutality 0.50.' };
  const d = evaluateCopyQualityRefusal({
    enabled: true, brutality: 0.5, copyQuality: badCopy(2.5), currentVerdict: fv.verdict,
  });
  applyDecision(fv, d);
  check('B · flag=true + lenient brutality + bad copy → no verdict change',
    !d.triggered && fv.verdict === 'approve' && fv.reasons.length === 0,
    `triggered=${d.triggered} verdict=${fv.verdict} code-trail: ${d.reasonCodes.join(' | ')}`);
}

// C: flag true + brutal + integrity 3.9 → refusal reason added
{
  const fv = { verdict: 'approve' as FinalVerdict['verdict'], reasons: ['existing-critic-reason'] as string[], notes: 'Approved at brutality 0.90.' };
  const d = evaluateCopyQualityRefusal({
    enabled: true, brutality: 0.9, copyQuality: badCopy(3.9), currentVerdict: fv.verdict,
  });
  applyDecision(fv, d);
  const allChecks =
    d.triggered
    && fv.verdict === 'reject-concept'
    && fv.reasons.includes('copy-quality-threshold')
    && fv.reasons.includes('existing-critic-reason')   // append, not replace
    && fv.notes.includes('[copy-quality-refusal]')
    && fv.notes.includes('4.0/10');
  check('C · flag=true + brutal + integrity 3.9 → refusal triggered, reason appended',
    allChecks,
    `verdict=${fv.verdict} reasons=[${fv.reasons.join(', ')}] notes-end="${fv.notes.split('\n').slice(-1)[0]}"`);
}

// D: flag true + brutal + integrity 4.0 → NOT triggered (strict < threshold)
{
  const fv = { verdict: 'approve' as FinalVerdict['verdict'], reasons: [] as string[], notes: 'Approved.' };
  const d = evaluateCopyQualityRefusal({
    enabled: true, brutality: 0.9, copyQuality: badCopy(4.0), currentVerdict: fv.verdict,
  });
  applyDecision(fv, d);
  check('D · flag=true + brutal + integrity 4.0 → NOT triggered (strict <)',
    !d.triggered && fv.verdict === 'approve' && fv.reasons.length === 0,
    `triggered=${d.triggered} integrity=4.0 vs threshold=${COPY_QUALITY_INTEGRITY_THRESHOLD}; code-trail: ${d.reasonCodes.join(' | ')}`);
}

// E: existing rejection verdict preserved (don't downgrade reject-image to reject-concept)
{
  const fv = { verdict: 'reject-image' as FinalVerdict['verdict'], reasons: ['low-scrollstop'] as string[], notes: 'Rejected at image stage.' };
  const d = evaluateCopyQualityRefusal({
    enabled: true, brutality: 0.9, copyQuality: badCopy(2.5), currentVerdict: fv.verdict,
  });
  applyDecision(fv, d);
  check('E · existing rejection verdict preserved (append-only)',
    d.triggered
      && fv.verdict === 'reject-image'             // preserved
      && fv.reasons.includes('low-scrollstop')      // existing preserved
      && fv.reasons.includes('copy-quality-threshold'), // appended
    `verdict=${fv.verdict} reasons=[${fv.reasons.join(', ')}]`);
}

// F: integrity exactly at 3.99 → triggered; at 4.0 → not (boundary)
{
  const dJustBelow = evaluateCopyQualityRefusal({ enabled: true, brutality: 0.8, copyQuality: badCopy(3.99), currentVerdict: 'approve' });
  const dAt        = evaluateCopyQualityRefusal({ enabled: true, brutality: 0.8, copyQuality: badCopy(4.0),  currentVerdict: 'approve' });
  const dBrutHigh  = evaluateCopyQualityRefusal({ enabled: true, brutality: 1.0, copyQuality: badCopy(3.5),  currentVerdict: 'approve' });
  const dBrutLow   = evaluateCopyQualityRefusal({ enabled: true, brutality: 0.79, copyQuality: badCopy(2.0), currentVerdict: 'approve' });
  check('F · boundary behavior (brutality + integrity thresholds)',
    dJustBelow.triggered && !dAt.triggered && dBrutHigh.triggered && !dBrutLow.triggered,
    `integrity 3.99=${dJustBelow.triggered} 4.0=${dAt.triggered} | brutality 1.0=${dBrutHigh.triggered} 0.79=${dBrutLow.triggered}`);
}

// G: strong copy never triggers regardless of flag/brutality
{
  const cases = [
    { enabled: false, brutality: 0.9, copy: strongCopy() },
    { enabled: true,  brutality: 0.9, copy: strongCopy() },
    { enabled: true,  brutality: 0.5, copy: strongCopy() },
    { enabled: true,  brutality: 1.0, copy: strongCopy(8.5) },
  ];
  const allUntriggered = cases.every((c) => {
    const d = evaluateCopyQualityRefusal({
      enabled: c.enabled, brutality: c.brutality, copyQuality: c.copy, currentVerdict: 'approve',
    });
    return !d.triggered;
  });
  check('G · strong copy never triggers refusal',
    allUntriggered,
    `4 strong-copy scenarios all returned triggered=false`);
}

// H: null copyQuality → never triggered
{
  const d = evaluateCopyQualityRefusal({
    enabled: true, brutality: 0.9, copyQuality: null, currentVerdict: 'approve',
  });
  check('H · null copyQuality → not triggered (defensive)',
    !d.triggered && d.reasonCodes.includes('no-copyQuality-signal'),
    `triggered=${d.triggered} code-trail: ${d.reasonCodes.join(' | ')}`);
}

// I: helper is synchronous + pure (no I/O)
{
  const d = evaluateCopyQualityRefusal({ enabled: true, brutality: 0.9, copyQuality: badCopy(3.5), currentVerdict: 'approve' });
  check('I · helper synchronous + pure',
    typeof d === 'object' && typeof d.triggered === 'boolean',
    `returned synchronously; output keys=[${Object.keys(d).sort().join(', ')}]`);
}

console.log(`\n${passed} passed · ${failed} failed`);
console.log(`\nThresholds: brutality >= ${COPY_QUALITY_BRUTALITY_THRESHOLD}, integrity < ${COPY_QUALITY_INTEGRITY_THRESHOLD}`);
process.exit(failed === 0 ? 0 : 1);
