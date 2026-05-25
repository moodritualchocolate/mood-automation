/**
 * COPY-QUALITY ADVISORY INLAY (Phase Next)
 *
 * Pure read-only helper. Given the copy-quality signal + copywriter
 * output, decides whether to append a single advisory line to the
 * meta-critic's finalVerdict.notes. The advisory is DISPLAY ONLY —
 * it never affects verdict, score, taste, brutality, or refusal.
 *
 * Trigger conditions (OR):
 *   - banner.copyQuality.copyIntegrity < 6
 *   - banner.copywriter.forbiddenPhrasesTriggered.length > 0
 *   - banner.copyQuality.warnings.length > 0
 *
 * Format:
 *   [advisory] copy quality signal: <top 2–3 concerns>
 *
 * Deterministic. Same inputs → same advisoryLine. No RNG, no I/O.
 */

import type { CopyQualityAxis } from './copyQualityAdapter';
import type { CopywriterOutput } from './copywriterEngine';

export interface CopyQualityAdvisory {
  shouldAppend: boolean;
  advisoryLine: string | null;
  reasonCodes: string[];
}

export interface CopyQualityAdvisoryInput {
  copyQuality: CopyQualityAxis | null | undefined;
  copywriter: CopywriterOutput | null | undefined;
}

// ─── concern enumeration ───────────────────────────────────────
//
// Each rule contributes a short, human-readable concern phrase + a
// machine-readable reason code. Rules are ordered by severity so
// the top-3 truncation surfaces the most important concerns first.

interface ConcernRule {
  matches: (q: CopyQualityAxis, c: CopywriterOutput | null | undefined) => boolean;
  phrase: (q: CopyQualityAxis, c: CopywriterOutput | null | undefined) => string;
  reason: string;
  severity: number;  // higher = surfaced earlier
}

const CONCERN_RULES: ConcernRule[] = [
  {
    severity: 100,
    matches: (_q, c) => !!c && c.forbiddenPhrasesTriggered.length > 0,
    phrase: (_q, c) => {
      const n = c!.forbiddenPhrasesTriggered.length;
      return n === 1
        ? `forbidden phrase triggered ("${c!.forbiddenPhrasesTriggered[0]}")`
        : `${n} forbidden phrases triggered`;
    },
    reason: 'forbidden-phrase-triggered',
  },
  {
    severity: 90,
    matches: (q) => q.trustSafety <= 4,
    phrase: (q) => `low trust safety (${q.trustSafety.toFixed(1)}/10)`,
    reason: 'low-trust-safety',
  },
  {
    severity: 85,
    matches: (q) => q.dignitySafety <= 4,
    phrase: (q) => `low dignity safety (${q.dignitySafety.toFixed(1)}/10)`,
    reason: 'low-dignity-safety',
  },
  {
    severity: 80,
    matches: (q) => q.proofAdequacy <= 4,
    phrase: (q) => `weak proof adequacy (${q.proofAdequacy.toFixed(1)}/10)`,
    reason: 'weak-proof-adequacy',
  },
  {
    severity: 75,
    matches: (q) => q.repetitionConcern >= 7,
    phrase: (q) => `high repetition concern (${q.repetitionConcern.toFixed(1)}/10)`,
    reason: 'high-repetition-concern',
  },
  {
    severity: 70,
    matches: (q) => q.ctaRestraint <= 4,
    phrase: (q) => `CTA pressure under trust context (restraint ${q.ctaRestraint.toFixed(1)}/10)`,
    reason: 'cta-pressure',
  },
  {
    severity: 65,
    matches: (q) => q.hebrewNaturalness <= 6,
    phrase: (q) => `Hebrew naturalness concern (${q.hebrewNaturalness.toFixed(1)}/10)`,
    reason: 'hebrew-naturalness',
  },
  {
    severity: 60,
    matches: (q) => q.strategicCopyFit <= 5,
    phrase: (q) => `strategy/tone mismatch (fit ${q.strategicCopyFit.toFixed(1)}/10)`,
    reason: 'strategy-tone-mismatch',
  },
  {
    severity: 55,
    matches: (q) => q.copyIntegrity < 6,
    phrase: (q) => `copy integrity below threshold (${q.copyIntegrity.toFixed(1)}/10)`,
    reason: 'low-copy-integrity',
  },
];

// ─── main ──────────────────────────────────────────────────────

export function buildCopyQualityAdvisory(input: CopyQualityAdvisoryInput): CopyQualityAdvisory {
  const { copyQuality: q, copywriter: c } = input;

  // No signal at all → no advisory.
  if (!q) {
    return { shouldAppend: false, advisoryLine: null, reasonCodes: [] };
  }

  // Trigger conditions per directive.
  const triggers: string[] = [];
  if (q.copyIntegrity < 6) triggers.push('integrity<6');
  if (c && c.forbiddenPhrasesTriggered.length > 0) triggers.push(`forbidden:${c.forbiddenPhrasesTriggered.length}`);
  if (q.warnings.length > 0) triggers.push(`warnings:${q.warnings.length}`);

  if (triggers.length === 0) {
    return { shouldAppend: false, advisoryLine: null, reasonCodes: [] };
  }

  // Score concerns deterministically (severity-sorted), take top 3.
  const matched = CONCERN_RULES
    .filter((rule) => rule.matches(q, c))
    .sort((a, b) => b.severity - a.severity)
    .slice(0, 3);

  // If the trigger fired but no concern rule matched (e.g. every axis
  // is above its rule threshold but raw `warnings` are present), fall
  // back to surfacing up to 3 raw warnings so the advisory remains
  // informative rather than tautological.
  if (matched.length === 0) {
    const fallbackConcerns = q.warnings.slice(0, 3);
    const fallback = fallbackConcerns.length > 0
      ? fallbackConcerns.join(', ')
      : `copy integrity ${q.copyIntegrity.toFixed(1)}/10`;
    return {
      shouldAppend: true,
      advisoryLine: `[advisory] copy quality signal: ${fallback}`,
      reasonCodes: [
        `triggered:${triggers.join(', ')}`,
        fallbackConcerns.length > 0 ? `fallback:raw-warnings:${fallbackConcerns.length}` : 'fallback:integrity-only',
      ],
    };
  }

  const concerns = matched.map((r) => r.phrase(q, c));
  const advisoryLine = `[advisory] copy quality signal: ${concerns.join(', ')}`;
  const reasonCodes = [
    `triggered:${triggers.join(', ')}`,
    ...matched.map((r) => `concern:${r.reason}`),
  ];

  return { shouldAppend: true, advisoryLine, reasonCodes };
}

// ─── notes mutator (display-only) ─────────────────────────────

/** Append the advisory line to an existing notes string. Pure.
 *  Returns the original string if no advisory should be appended. */
export function appendAdvisoryToNotes(notes: string, advisory: CopyQualityAdvisory): string {
  if (!advisory.shouldAppend || !advisory.advisoryLine) return notes;
  const sep = notes.length > 0 && !notes.endsWith('\n') ? '\n' : '';
  return `${notes}${sep}${advisory.advisoryLine}`;
}
