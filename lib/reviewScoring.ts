/**
 * REVIEW SCORING (Wave 26 — Phase 7)
 *
 * Deterministic scoring of a CurrentDraft against the runtime's
 * persistent state. Every score derives from real data:
 *
 *   coherenceScore     — body claims ("N× observed") vs actual log
 *                        counts. Match ratio × 10. Stale drafts
 *                        naturally lose coherence as state advances.
 *
 *   restraintScore     — count of restrain directives in log,
 *                        clamped: min(10, restrainCount × 2 + 4).
 *                        Floor 4 even with no restraint; rises by 2
 *                        per restrain event in the chain.
 *
 *   contradictionScore — number of body claims that mismatch actual
 *                        log counts. 0 = clean.
 *
 *   depthScore         — unique cognitive verbs in log, capped at 10.
 *                        More vocabulary used = deeper cognition.
 *
 *   noveltyScore       — binary: 10 if body is distinct from every
 *                        prior draft in the lineage, 0 if duplicate.
 *
 *   qualityScore       — round((coherence + restraint + (10 − contra)
 *                         + depth + novelty) / 5)
 *
 * No randomness, no LLM, no fabricated reasoning. Same state → same
 * scores forever. The body's claim format is fixed by the Wave 24
 * draft composer ("Internal draft born from disciplined cognition:
 * N× observed, …") which is what this module parses.
 */

import type { CurrentDraft, DirectiveRecord, ReviewRecommendation } from './operatingSystemCore';

const PAST_TO_PRESENT: Record<string, string> = {
  observed: 'observe',
  noticed: 'notice',
  considered: 'consider',
  restrained: 'restrain',
  permitted: 'permit',
  prepared: 'prepare',
};

export interface ParsedClaim { verb: string; count: number; }

/** Parse "N× observed" patterns out of a draft body. */
export function parseClaimsFromBody(body: string): ParsedClaim[] {
  const claims: ParsedClaim[] = [];
  const re = /(\d+)×\s+(\w+)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const count = parseInt(m[1], 10);
    const present = PAST_TO_PRESENT[m[2]] ?? m[2];
    if (!Number.isNaN(count)) {
      claims.push({ verb: present, count });
    }
  }
  return claims;
}

export interface DirectiveCounts {
  [verb: string]: number;
}

export function countByDirective(log: DirectiveRecord[]): DirectiveCounts {
  const counts: DirectiveCounts = {};
  for (const d of log) counts[d.directive] = (counts[d.directive] ?? 0) + 1;
  return counts;
}

export interface ReviewScores {
  qualityScore: number;
  coherenceScore: number;
  restraintScore: number;
  contradictionScore: number;
  depthScore: number;
  noveltyScore: number;
}

export function computeReviewScores(
  draft: CurrentDraft,
  log: DirectiveRecord[],
  priorDraftBodies: string[],
): ReviewScores {
  const claims = parseClaimsFromBody(draft.body);
  const counts = countByDirective(log);

  // Coherence: fraction of claims that match actual counts.
  let matches = 0;
  let mismatches = 0;
  for (const claim of claims) {
    if ((counts[claim.verb] ?? 0) === claim.count) matches++;
    else mismatches++;
  }
  const coherenceScore = claims.length === 0
    ? 0
    : Math.round((matches / claims.length) * 10);

  // Restraint: floor 4, +2 per restrain in log, cap 10.
  const restrainCount = counts.restrain ?? 0;
  const restraintScore = Math.min(10, Math.max(0, restrainCount * 2 + 4));

  // Contradiction: count of mismatches in the parse.
  const contradictionScore = mismatches;

  // Depth: unique verbs in log, capped at 10.
  const depthScore = Math.min(10, new Set(log.map((d) => d.directive)).size);

  // Novelty: 10 if body distinct from every prior draft, 0 if duplicate.
  const noveltyScore = priorDraftBodies.includes(draft.body) ? 0 : 10;

  // Quality: aggregate. Contradiction inverted before summing.
  const qualityScore = Math.round(
    (coherenceScore + restraintScore + (10 - Math.min(10, contradictionScore)) +
     depthScore + noveltyScore) / 5,
  );

  return {
    qualityScore, coherenceScore, restraintScore,
    contradictionScore, depthScore, noveltyScore,
  };
}

export function recommendationFor(scores: ReviewScores): ReviewRecommendation {
  if (scores.contradictionScore > 0) return 'revise-required';
  if (scores.coherenceScore < 6) return 'revise-required';
  if (scores.qualityScore < 5) return 'refused';
  if (scores.qualityScore >= 7 && scores.coherenceScore >= 7) {
    return 'approved-for-approval';
  }
  return 'revise-required';
}

export function deriveStrengths(scores: ReviewScores): string[] {
  const s: string[] = [];
  if (scores.restraintScore >= 8) s.push('stable restraint');
  if (scores.coherenceScore >= 8) s.push('coherent with directive history');
  if (scores.contradictionScore === 0) s.push('no contradictions detected');
  if (scores.noveltyScore >= 7) s.push('distinct from prior drafts');
  if (scores.depthScore >= 7) s.push('broad cognitive vocabulary');
  return s;
}

export function deriveWeaknesses(scores: ReviewScores): string[] {
  const w: string[] = [];
  if (scores.coherenceScore < 6) w.push('weak coherence with directive history');
  if (scores.contradictionScore > 0) {
    w.push(`${scores.contradictionScore} claim contradiction${scores.contradictionScore === 1 ? '' : 's'}`);
  }
  if (scores.depthScore < 5) w.push('limited cognitive vocabulary');
  if (scores.noveltyScore < 4) w.push('repeats a prior draft');
  if (scores.restraintScore < 6) w.push('insufficient restraint history');
  return w;
}

export function deriveEvaluation(
  scores: ReviewScores,
  recommendation: ReviewRecommendation,
): string {
  if (recommendation === 'approved-for-approval') {
    return `draft is internally coherent and disciplined — quality ${scores.qualityScore}/10`;
  }
  if (recommendation === 'revise-required') {
    if (scores.contradictionScore > 0) {
      return `draft contradicts state in ${scores.contradictionScore} place${scores.contradictionScore === 1 ? '' : 's'} — revision required`;
    }
    if (scores.coherenceScore < 6) {
      return `draft is internally weak — coherence ${scores.coherenceScore}/10, revision required`;
    }
    return `draft is acceptable but incomplete — quality ${scores.qualityScore}/10, revision recommended`;
  }
  return `draft does not meet internal coherence threshold — quality ${scores.qualityScore}/10`;
}
