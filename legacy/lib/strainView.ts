/**
 * STRAIN VIEW (Wave 25 — Dynamic Signal Architecture)
 *
 * Strain is unresolved cognitive load — what the organism is
 * currently holding without having resolved. Derived purely from
 * current OS state at render time; no stored field, no decay rules,
 * no time component. Open the dashboard with no pending cognition
 * and strain reads 0. Open it with an intention sitting unconsumed
 * and strain reads at least 1.
 *
 * Wave 26 will add the +2 term for a 'revise-required' review.
 */

import type { RuntimeSnapshot } from './runtimeUIBrain';

export interface StrainViewModel {
  present: boolean;
  strain: number;
  components: {
    pendingIntention: boolean;
    unreviewedDraft: boolean;
    fragmentation: number;
  };
  statement: string;
}

export function buildStrainView(snap: RuntimeSnapshot): StrainViewModel {
  const os = snap.os;
  if (!os) {
    return {
      present: false,
      strain: 0,
      components: { pendingIntention: false, unreviewedDraft: false, fragmentation: 0 },
      statement: 'no runtime',
    };
  }

  const pendingIntention = !!os.currentIntention;
  const unreviewedDraft = !!os.currentDraft;
  const fragmentation = os.fragmentationStreak;

  const strain =
    (pendingIntention ? 1 : 0) +
    (unreviewedDraft ? 1 : 0) +
    fragmentation;

  const parts: string[] = [];
  if (pendingIntention) parts.push('pending intention');
  if (unreviewedDraft) parts.push('unreviewed draft');
  if (fragmentation > 0) parts.push(`${fragmentation} consecutive refusal${fragmentation === 1 ? '' : 's'}`);

  return {
    present: true,
    strain,
    components: { pendingIntention, unreviewedDraft, fragmentation },
    statement: strain === 0
      ? 'no strain — nothing held without resolution'
      : `strain ${strain} — ${parts.join(', ')}`,
  };
}
